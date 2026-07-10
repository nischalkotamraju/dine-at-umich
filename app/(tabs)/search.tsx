import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight, Search as SearchIcon, SearchX, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALLERGEN_ICON_MAP, getCategoryIcon } from '~/components/FoodComponent';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';

const ALLERGEN_KEYS = [
  'beef', 'egg', 'fish', 'milk', 'oats', 'peanuts', 'pork', 'sesame_seeds',
  'shellfish', 'soy', 'tree_nuts', 'wheat', 'deep_fried', 'vegan', 'vegetarian', 'halal',
] as const;

interface SearchEntry {
  locationName: string;
  menuName: string;
  categoryName: string;
  date: string;
}

interface SearchResult {
  name: string;
  locationNames: string[];
  entries: SearchEntry[];
  categoryName: string;
  calories: string | null;
  protein: string | null;
  carbs: string | null;
  allergens: Record<string, boolean>;
}

type RawRow = {
  name: string;
  location_name: string;
  menu_name: string;
  category_title: string;
  menu_date: string;
  calories: string | null;
  protein: string | null;
  total_carbohydrates: string | null;
} & Record<(typeof ALLERGEN_KEYS)[number], number | null>;

/**
 * Groups raw per-food_item rows (one row per row in the DB, each with its own
 * self-consistent location/menu/category/date) into one result per dish name,
 * keeping each location's menu/category/date paired correctly so navigation
 * never mismatches a location with a menu/category it doesn't actually have.
 */
function groupRows(rows: RawRow[]): SearchResult[] {
  const byName = new Map<string, SearchResult>();

  for (const r of rows) {
    const entry: SearchEntry = {
      locationName: r.location_name,
      menuName: r.menu_name,
      categoryName: r.category_title,
      date: r.menu_date,
    };

    const existing = byName.get(r.name);
    if (existing) {
      if (!existing.locationNames.includes(r.location_name)) {
        existing.locationNames.push(r.location_name);
      }
      existing.entries.push(entry);
      existing.calories = existing.calories ?? r.calories;
      existing.protein = existing.protein ?? r.protein;
      existing.carbs = existing.carbs ?? r.total_carbohydrates;
      for (const key of ALLERGEN_KEYS) {
        if (r[key]) existing.allergens[key] = true;
      }
    } else {
      const allergens: Record<string, boolean> = {};
      for (const key of ALLERGEN_KEYS) {
        if (r[key]) allergens[key] = true;
      }
      byName.set(r.name, {
        name: r.name,
        locationNames: [r.location_name],
        entries: [entry],
        categoryName: r.category_title,
        calories: r.calories,
        protein: r.protein,
        carbs: r.total_carbohydrates,
        allergens,
      });
    }
  }

  return Array.from(byName.values());
}

const SearchScreen = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<TextInput>(null);

  const BASE_QUERY = `
    SELECT fi.name, l.name as location_name, m.name as menu_name,
           mc.title as category_title, m.date as menu_date,
           n.calories, n.protein, n.total_carbohydrates,
           a.beef, a.egg, a.fish, a.milk, a.oats, a.peanuts, a.pork, a.sesame_seeds,
           a.shellfish, a.soy, a.tree_nuts, a.wheat, a.deep_fried, a.vegan, a.vegetarian, a.halal
    FROM food_item fi
    JOIN menu_category mc ON fi.menu_category_id = mc.id
    JOIN menu m ON mc.menu_id = m.id
    JOIN location l ON m.location_id = l.id
    LEFT JOIN nutrition n ON fi.nutrition_id = n.id
    LEFT JOIN allergens a ON fi.allergens_id = a.id`;

  const fetchAll = () => {
    try {
      const rows = db.getAllSync<RawRow>(
        `${BASE_QUERY} ORDER BY fi.name LIMIT 3000`,
        [],
      );
      setResults(groupRows(rows).slice(0, 1000));
    } catch {
      setResults([]);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      fetchAll();
      return;
    }

    try {
      const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);

      // Try AND match first (all tokens must appear in name)
      const andWhere = tokens.map(() => `fi.name LIKE ? COLLATE NOCASE`).join(' AND ');
      const andParams = tokens.map((t) => `%${t}%`);
      let rows = db.getAllSync<RawRow>(`${BASE_QUERY} WHERE ${andWhere} LIMIT 500`, andParams);

      // Fallback: OR match (any token matches)
      if (rows.length === 0 && tokens.length > 1) {
        const orWhere = tokens.map(() => `fi.name LIKE ? COLLATE NOCASE`).join(' OR ');
        rows = db.getAllSync<RawRow>(`${BASE_QUERY} WHERE ${orWhere} LIMIT 500`, andParams);
      }

      const grouped = groupRows(rows);

      // Score by relevance
      const lower = trimmed.toLowerCase();
      const scored = grouped
        .map((r) => {
          const name = r.name.toLowerCase();
          let score = 0;
          if (name === lower) score = 100;
          else if (name.startsWith(lower)) score = 80;
          else if (name.includes(lower)) score = 60;
          else {
            // Partial token scoring: reward more matched tokens
            const matchedTokens = tokens.filter((t) => name.includes(t.toLowerCase())).length;
            score = (matchedTokens / tokens.length) * 40;
          }
          return { r, score };
        })
        .sort((a, b) => b.score - a.score);

      setResults(scored.map(({ r }) => r).slice(0, 150));
    } catch {
      setResults([]);
    }
  };

  const bg = isDarkMode ? '#171717' : '#fff';
  const cardBg = isDarkMode ? '#242424' : '#F8F9FA';
  const barBg = isDarkMode ? '#242424' : '#F2F2F7';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginBottom: 12 }}>
          Search
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: barBg,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 14,
          }}
        >
          <SearchIcon size={16} color={subColor} />
          <TextInput
            ref={inputRef}
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: textColor }}
            placeholder="Search all menu items..."
            placeholderTextColor={subColor}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={16} color={subColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {results.length === 0 && query.length >= 2 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: getAccent(isDarkMode),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <SearchX size={30} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 16,
              color: textColor,
              letterSpacing: 1,
              textAlign: 'center',
            }}
          >
            NO RESULTS
          </Text>
          <Text style={{ marginTop: 8, color: subColor, textAlign: 'center' }}>
            Try a different search term.
          </Text>
        </View>
      ) : (
        <FlashList
          estimatedItemSize={84}
          data={results}
          extraData={isDarkMode}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const hasMacros = item.calories != null || item.protein != null || item.carbs != null;
            const macroText = [
              item.calories != null ? `${item.calories} calories` : null,
              item.protein != null ? `${item.protein}g protein` : null,
              item.carbs != null ? `${item.carbs}g carbs` : null,
            ]
              .filter(Boolean)
              .join(' · ');

            const allergenEntries = Object.entries(item.allergens).filter(
              ([key, value]) => value === true && ALLERGEN_ICON_MAP[key],
            );
            const allergenIcons = [
              ...allergenEntries.filter(([key]) => ALLERGEN_ICON_MAP[key].type === 'preference'),
              ...allergenEntries.filter(([key]) => ALLERGEN_ICON_MAP[key].type === 'allergen'),
            ];

            return (
              <Pressable
                onPress={() => {
                  // Prefer today's entry so the lookup on the food screen (which
                  // defaults to today) matches; fall back to the first entry.
                  const today = getTodayInCentralTime();
                  const entry = item.entries.find((e) => e.date === today) ?? item.entries[0];
                  router.push({
                    pathname: '/food/[food]',
                    params: {
                      food: item.name,
                      menu: entry.menuName,
                      category: entry.categoryName,
                      location: entry.locationName,
                      date: entry.date,
                      favorite: 'false',
                    },
                  });
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  backgroundColor: cardBg,
                  marginBottom: 8,
                }}
              >
                {/* Category icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: getAccentTint(isDarkMode),
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(item.categoryName, isDarkMode)}
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 14,
                      fontFamily: 'RobotoMono_500Medium',
                      color: textColor,
                      letterSpacing: -0.3,
                    }}
                  >
                    {item.name}
                  </Text>

                  {hasMacros && (
                    <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: subColor }}>
                      {macroText}
                    </Text>
                  )}

                  {(allergenIcons.length > 0 || item.locationNames.length > 0) && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {allergenIcons.map(([key]) => {
                        const { Icon, type } = ALLERGEN_ICON_MAP[key];
                        const iconColor = type === 'allergen' ? '#EF4444' : '#22C55E';
                        const bgColor = type === 'allergen' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)';
                        return (
                          <View
                            key={key}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              backgroundColor: bgColor,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={12} color={iconColor} strokeWidth={1.8} />
                          </View>
                        );
                      })}
                      {item.locationNames.map((loc) => (
                        <View
                          key={loc}
                          style={{
                            backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E7EB',
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '500', color: subColor }}>
                            {loc}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <ChevronRight size={16} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
              </Pressable>
            );
          }}
          ListHeaderComponent={
            <Text style={{ color: subColor, fontSize: 12, marginBottom: 8, marginTop: 4 }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default SearchScreen;
