import { useEffect, useMemo, useRef, useState } from 'react';
import type { FoodItem, Location, Menu, MenuCategory } from '~/services/database/database';

const PROXY_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/menu-proxy`;

// Get a numeric value from a field that might be plain or @-prefixed (XML→JSON artifact)
function num(obj: any, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k] ?? obj?.['@' + k];
    const n = parseFloat(v);
    if (!isNaN(n)) return n;
  }
  return null;
}

// Get a string value, trying plain and @-prefixed keys
function str(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k] ?? obj?.['@' + k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function toArr(val: any): any[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function parseAllergens(item: any) {
  const allergenList = toArr(item.allergen ?? item.allergens_list).map((x: any) =>
    (x?.['@name'] ?? x?.name ?? x ?? '').toString().toLowerCase(),
  );
  const filterList = toArr(item.filter ?? item.mealFilter ?? item.mealFilters_list).map((x: any) =>
    (x?.['@name'] ?? x?.name ?? x ?? '').toString().toLowerCase(),
  );
  const aObj = (!Array.isArray(item.allergens) && typeof item.allergens === 'object') ? (item.allergens ?? {}) : {};
  const fObj = (!Array.isArray(item.mealFilters) && typeof item.mealFilters === 'object') ? (item.mealFilters ?? {}) : {};

  const has = (list: string[], ...terms: string[]) =>
    terms.some((t) => list.some((l) => l.includes(t)));

  return {
    id: 0,
    milk:         !!(aObj.milk  || aObj.dairy  || has(allergenList, 'milk', 'dairy')),
    egg:          !!(aObj.egg   || aObj.eggs   || has(allergenList, 'egg')),
    fish:         !!(aObj.fish               || has(allergenList, 'fish')),
    shellfish:    !!(aObj.shellfish           || has(allergenList, 'shellfish', 'crustacean')),
    tree_nuts:    !!(aObj.treenuts || aObj['tree-nuts'] || has(allergenList, 'tree nut', 'treenut')),
    peanuts:      !!(aObj.peanuts             || has(allergenList, 'peanut')),
    wheat:        !!(aObj.wheat || aObj.gluten || has(allergenList, 'wheat', 'gluten', 'oat')),
    soy:          !!(aObj.soy                 || has(allergenList, 'soy')),
    sesame_seeds: !!(aObj.sesame || aObj.sesame_seeds || has(allergenList, 'sesame')),
    beef:         !!(aObj.beef                || has(allergenList, 'beef')),
    pork:         !!(aObj.pork                || has(allergenList, 'pork')),
    halal:        !!(fObj.halal  || aObj.halal  || has(filterList, 'halal')),
    vegan:        !!(fObj.vegan  || aObj.vegan  || has(filterList, 'vegan')),
    vegetarian:   !!(fObj.vegetarian || aObj.vegetarian || has(filterList, 'vegetarian')),
  };
}

function parseNutrition(n: any) {
  if (!n) return undefined;
  return {
    id: 0,
    calories:            num(n, 'calories') != null ? String(Math.round(num(n, 'calories')!)) : null,
    calories_from_fat:   num(n, 'caloriesfromfat', 'calories_from_fat') != null ? String(num(n, 'caloriesfromfat', 'calories_from_fat')) : null,
    total_fat:           num(n, 'totalfat', 'total_fat') != null ? String(num(n, 'totalfat', 'total_fat')) : null,
    saturated_fat:       num(n, 'saturatedfat', 'saturated_fat') != null ? String(num(n, 'saturatedfat', 'saturated_fat')) : null,
    trans_fat:           num(n, 'transfat', 'trans_fat') != null ? String(num(n, 'transfat', 'trans_fat')) : null,
    cholesterol:         num(n, 'cholesterol') != null ? String(num(n, 'cholesterol')) : null,
    sodium:              num(n, 'sodium') != null ? String(num(n, 'sodium')) : null,
    total_carbohydrates: num(n, 'totalcarbohydrates', 'total_carbohydrates', 'carbohydrates') != null ? String(num(n, 'totalcarbohydrates', 'total_carbohydrates', 'carbohydrates')) : null,
    dietary_fiber:       num(n, 'dietaryfiber', 'dietary_fiber', 'fiber') != null ? String(num(n, 'dietaryfiber', 'dietary_fiber', 'fiber')) : null,
    total_sugars:        num(n, 'sugars', 'total_sugars') != null ? String(num(n, 'sugars', 'total_sugars')) : null,
    protein:             num(n, 'protein') != null ? String(num(n, 'protein')) : null,
    vitamin_d:           num(n, 'vitamind', 'vitamin_d') != null ? String(num(n, 'vitamind', 'vitamin_d')) : null,
    calcium:             num(n, 'calcium') != null ? String(num(n, 'calcium')) : null,
    iron:                num(n, 'iron') != null ? String(num(n, 'iron')) : null,
    potassium:           num(n, 'potassium') != null ? String(num(n, 'potassium')) : null,
  };
}

function parseMenu(rawData: any): Record<string, MenuCategory[]> {
  const meals = toArr(rawData?.menu?.meal ?? rawData?.menu);
  const result: Record<string, MenuCategory[]> = {};

  for (const meal of meals) {
    const mealName = str(meal, 'name') || 'Menu';
    const categories: MenuCategory[] = [];

    for (const course of toArr(meal.course)) {
      const title = str(course, 'name') || 'Items';
      const rawItems = toArr(course.menuitem ?? course.item);
      if (!rawItems.length) continue;

      const food_items: FoodItem[] = rawItems
        .map((item: any) => {
          const name = str(item, 'name');
          if (!name) return null;
          return {
            name,
            link: null,
            nutrition: parseNutrition(item.nutrition),
            allergens: parseAllergens(item),
          } as FoodItem;
        })
        .filter(Boolean) as FoodItem[];

      if (food_items.length) categories.push({ category_title: title, food_items });
    }

    result[mealName] = categories;
  }

  return result;
}

export function useUMichMenu(locationName: string, date: string) {
  const [allMenus, setAllMenus] = useState<Record<string, MenuCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [isSwitchingMenus, setIsSwitchingMenus] = useState(false);
  const prevMenu = useRef<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedMenu(null);
    setAllMenus({});

    console.log('[useUMichMenu] fetching:', locationName, date);
    console.log('[useUMichMenu] proxy URL:', PROXY_URL);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    fetch(PROXY_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ location: locationName, date }),
    })
      .then(async (r) => {
        clearTimeout(timeout);
        const text = await r.text();
        console.log('[useUMichMenu] status:', r.status, 'body preview:', text.slice(0, 200));
        if (r.status === 403 || r.status === 404) {
          // UMich returns 403/404 when no menu exists for this date (e.g. summer, holidays)
          setAllMenus({});
          setLoading(false);
          return;
        }
        if (!r.ok) throw new Error(`Proxy HTTP ${r.status}: ${text.slice(0, 100)}`);
        if (!text.trim()) throw new Error('Empty response from dining API');
        const data = JSON.parse(text);
        const parsed = parseMenu(data);
        if (Object.keys(parsed).length === 0) throw new Error('No menu data for this date');
        setAllMenus(parsed);
        setLoading(false);
      })
      .catch((e) => {
        clearTimeout(timeout);
        console.error('[useUMichMenu] error:', e.message);
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
  }, [locationName, date]);

  const mealNames = useMemo(() => Object.keys(allMenus), [allMenus]);
  const defaultMenu = selectedMenu ?? mealNames[0] ?? null;

  // Track switching state
  useEffect(() => {
    if (defaultMenu && prevMenu.current !== defaultMenu) {
      if (prevMenu.current !== null) setIsSwitchingMenus(true);
      prevMenu.current = defaultMenu;
    }
  }, [defaultMenu]);

  useEffect(() => {
    if (isSwitchingMenus) {
      const t = setTimeout(() => setIsSwitchingMenus(false), 200);
      return () => clearTimeout(t);
    }
  }, [isSwitchingMenus]);

  const menuData = useMemo((): Location | null => {
    if (!defaultMenu || !allMenus[defaultMenu]) return null;
    return {
      menus: [
        {
          menu_name: defaultMenu,
          menu_categories: allMenus[defaultMenu],
        } as Menu,
      ],
    } as unknown as Location;
  }, [defaultMenu, allMenus]);

  const filters = useMemo(
    () => mealNames.map((name) => ({ title: name, id: name })),
    [mealNames],
  );

  return { menuData, loading, error, selectedMenu: defaultMenu, setSelectedMenu, filters, isSwitchingMenus };
}
