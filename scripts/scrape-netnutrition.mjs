/**
 * NetNutrition Enrichment Scraper
 *
 * dining.umich.edu (scraped by scripts/scrape-menus.mjs) never lists
 * ingredients for any dish, and is missing several allergens (Alcohol,
 * Coconut, Oats) plus a "deep fried" flag that fss.studentlife.umich.edu's
 * NetNutrition site does expose. This script does NOT replace the main
 * scraper — it's a separate enrichment pass that runs on top of it:
 *
 *   1. Scrapes ingredients + the 4 extra allergen flags from NetNutrition.
 *   2. Matches each NetNutrition item to an existing `food_item` row (by
 *      location_id + date + case-insensitive name) that the main scraper
 *      already created.
 *   3. PATCHes (never deletes/recreates) that row's linked `nutrition`.
 *      ingredients and `allergens`.{alcohol,coconut,oats,deep_fried} fields.
 *
 * Not every NetNutrition-covered dish exists in our own DB yet (and vice
 * versa — some of our locations aren't in NetNutrition at all), so
 * unmatched items are logged and skipped rather than treated as errors.
 *
 * Run with: node scripts/scrape-netnutrition.mjs [YYYY-MM-DD]
 *
 * Env vars required:
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { chromium } from 'playwright';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gtkzwyhqxtubgmlvovmn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NETNUTRITION_BASE = 'https://fss.studentlife.umich.edu/NetNutrition/1';

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Location -> NetNutrition unit map
// ---------------------------------------------------------------------------
// "hall" units require Daily Menu -> date -> meal navigation and are scraped
// once per (date, meal) combo found in our own today..+2 day window.
// "cafe" units show a single flat, non-dated "current" menu as soon as the
// unit is selected — there's no way to view a specific past/future date, so
// these are only matched against TODAY's rows in our own DB.
//
// Blue Market at Michigan Union and Wolverine Village Dining Hall don't
// exist in NetNutrition at all (confirmed via the full unit tree) and are
// intentionally omitted. Blue Cafe South Quad exists in NetNutrition but
// isn't one of our tracked locations, so it's omitted too.
const NETNUTRITION_HALLS = [
  { name: 'Bursley Dining Hall', unitOid: 19 },
  { name: 'East Quad Dining Hall', unitOid: 28 },
  { name: 'Lawyers Club Dining Hall', unitOid: 37 },
  { name: 'Markley Dining Hall', unitOid: 44 },
  { name: 'Martha Cook Dining Hall', unitOid: 54 },
  { name: 'Mosher-Jordan Dining Hall', unitOid: 61 },
  { name: 'North Quad Dining Hall', unitOid: 70 },
  { name: 'South Quad Dining Hall', unitOid: 78 },
  { name: 'Twigs at Oxford', unitOid: 88 },
];

const NETNUTRITION_CAFES = [
  { name: 'Petrovich Family Grill', unitOid: 3 },
  { name: "Bert's Café", unitOid: 5 },
  { name: 'Blue Cafe East Quad', unitOid: 6 },
  { name: 'Café 32', unitOid: 8 },
  { name: "Darwin's", unitOid: 9 },
  { name: 'Eigen Café', unitOid: 10 },
  { name: 'Fireside Café', unitOid: 11 },
  { name: 'JavaBlu', unitOid: 12 },
  { name: 'Mujo Café', unitOid: 13 },
  { name: 'UMMA Café', unitOid: 14 },
  { name: "Maizie's Kitchen and Market", unitOid: 16 },
  { name: 'Blue Market at Pierpont Commons', unitOid: 17 },
  { name: 'Blue Cafe and Market at Mosher-Jordan', unitOid: 18 },
];

// mealoid values confirmed via the site's own [data-type="ML"] nav links.
const MEALS = [
  { name: 'Breakfast', mealoid: 1 },
  { name: 'Lunch', mealoid: 3 },
  { name: 'Dinner', mealoid: 4 },
  { name: 'Brunch', mealoid: 46 },
];

// traitoid values confirmed via the site's own [id^="allergy_"] filter buttons.
const NEW_TRAITS = [
  { key: 'alcohol', traitoid: 35 },
  { key: 'coconut', traitoid: 522 },
  { key: 'oats', traitoid: 28 },
  { key: 'deep_fried', traitoid: 50 },
];

// ---------------------------------------------------------------------------
// Supabase REST helpers (no SDK needed)
// ---------------------------------------------------------------------------

async function sbFetch(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? undefined : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function getLocationMap() {
  const allNames = [...NETNUTRITION_HALLS, ...NETNUTRITION_CAFES].map((l) => l.name);
  const data = await sbFetch('GET', `/location?name=in.(${encodeURIComponent(allNames.join(','))})&select=id,name`);
  const map = {};
  for (const row of data ?? []) map[row.name] = row.id;
  return map;
}

// Loosened key for matching our menu-site names against NetNutrition's, which
// disagree on punctuation and accents for the same dish ("Crammin' Caramel
// Latte" vs "Crammin Caramel Latte", "Café" vs "Cafe", "Mac & Cheese" vs
// "Mac and Cheese"). Strips diacritics, folds "&" to "and", reduces every
// other non-alphanumeric run to a single space, and lowercases. Only used as a
// fallback after an exact match, so it can't override a precise hit.
function normalizeName(name) {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const EMPTY_INDEX = { exact: new Map(), normalized: new Map() };

// Fetches every food_item row (with its nutrition_id/allergens_id) that the
// main scraper already created for this location+date, indexed both by exact
// lowercased name and by the loosened key above.
//
// The same dish name (e.g. "Oatmeal", "Cilantro", a recurring station like
// "24 Carrots") frequently recurs across multiple meals (breakfast AND lunch)
// or multiple categories on the same day — a name-only key silently collapses
// all of those into one Map entry, so enrichment (ingredients + the 4 extra
// allergen flags) meant for one meal's serving gets cross-applied to a
// different meal's identically-named dish instead. When `mealName` is given
// (dining halls, scraped one meal at a time), restrict matching to food_items
// whose own menu.name equals it, so same-named dishes in other meals aren't
// candidates at all. Cafes (mealName undefined, single flat "Menu") can't be
// scoped further since NetNutrition doesn't expose per-item category here.
async function getExistingFoodItems(locationId, date, mealName) {
  let menuQuery = `/menu?location_id=eq.${locationId}&date=eq.${date}&select=id,name`;
  const menus = await sbFetch('GET', menuQuery);
  if (!menus?.length) return EMPTY_INDEX;

  const scopedMenus = mealName ? menus.filter((m) => m.name === mealName) : menus;
  if (!scopedMenus.length) return EMPTY_INDEX;

  const menuIds = scopedMenus.map((m) => m.id).join(',');
  const cats = await sbFetch('GET', `/menu_category?menu_id=in.(${menuIds})&select=id`);
  if (!cats?.length) return EMPTY_INDEX;

  const catIds = cats.map((c) => c.id).join(',');
  const items = await sbFetch(
    'GET',
    `/food_item?menu_category_id=in.(${catIds})&select=id,name,nutrition_id,allergens_id`,
  );

  const exact = new Map();
  const normalized = new Map();
  for (const item of items ?? []) {
    exact.set(item.name.trim().toLowerCase(), item);
    // First writer wins, so a normalized collision between two distinct dishes
    // can't silently reassign an item that already matched exactly.
    const norm = normalizeName(item.name);
    if (!normalized.has(norm)) normalized.set(norm, item);
  }
  return { exact, normalized };
}

async function applyEnrichment(foodItem, ingredients, allergenFlags) {
  if (ingredients) {
    if (foodItem.nutrition_id) {
      await sbFetch('PATCH', `/nutrition?id=eq.${foodItem.nutrition_id}`, { ingredients });
    } else {
      const [row] = await sbFetch('POST', '/nutrition', [{ ingredients }]);
      await sbFetch('PATCH', `/food_item?id=eq.${foodItem.id}`, { nutrition_id: row.id });
      foodItem.nutrition_id = row.id;
    }
  }

  const hasAnyFlag = Object.values(allergenFlags).some((v) => v !== null);
  if (hasAnyFlag) {
    if (foodItem.allergens_id) {
      await sbFetch('PATCH', `/allergens?id=eq.${foodItem.allergens_id}`, allergenFlags);
    } else {
      const [row] = await sbFetch('POST', '/allergens', [allergenFlags]);
      await sbFetch('PATCH', `/food_item?id=eq.${foodItem.id}`, { allergens_id: row.id });
      foodItem.allergens_id = row.id;
    }
  }
}

// ---------------------------------------------------------------------------
// NetNutrition navigation (Playwright)
// ---------------------------------------------------------------------------

async function selectUnit(page, unitOid) {
  await page.evaluate((oid) => {
    const el = document.querySelector(`[data-unitoid="${oid}"][data-type="UN"]`);
    if (el) NetNutrition.UI.handleNavBarSelection(el);
  }, unitOid);
  await page.waitForTimeout(1200);
}

async function clickDailyMenu(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const el = links.find((a) => a.textContent.trim() === 'Daily Menu');
    if (el) {
      el.click();
      return true;
    }
    return false;
  });
}

// dateStr must be either "Today" or "M/D/YYYY" (no leading zeros), matching
// NetNutrition's own data-date attribute format exactly.
async function selectDate(page, dateStr) {
  const found = await page.evaluate((d) => {
    const el = document.querySelector(`[data-type="DT"][data-date="${d}"]`);
    if (el) {
      NetNutrition.UI.handleNavBarSelection(el);
      return true;
    }
    return false;
  }, dateStr);
  if (found) await page.waitForTimeout(1200);
  return found;
}

async function selectMeal(page, mealoid) {
  const found = await page.evaluate((oid) => {
    const el = document.querySelector(`[data-type="ML"][data-mealoid="${oid}"]`);
    if (el) {
      NetNutrition.UI.handleNavBarSelection(el);
      return true;
    }
    return false;
  }, mealoid);
  if (found) await page.waitForTimeout(1200);
  return found;
}

async function getBaselineItems(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('a.cbo_nn_itemHover')).map((a) => {
      const clone = a.cloneNode(true);
      clone.querySelectorAll('span').forEach((s) => s.remove());
      return {
        detailOid: a.id.replace('showNutrition_', ''),
        name: clone.textContent.trim(),
      };
    });
  });
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getIngredients(page, detailOid) {
  const itemHandle = await page.evaluateHandle(
    (id) => document.getElementById(`showNutrition_${id}`),
    detailOid,
  );
  const el = itemHandle.asElement();
  if (!el) return null;

  try {
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('ShowItemNutritionLabel'), { timeout: 10000 }),
      page.evaluate((element) => element.click(), el),
    ]);
    const html = await resp.text();
    const match = html.match(/cbo_nn_LabelIngredients'>([\s\S]*?)<\/span>/);
    return match ? decodeHtmlEntities(match[1]) || null : null;
  } catch {
    return null;
  } finally {
    await page.evaluate(() => $('#cbo_nn_nutritionDialog').modal('hide')).catch(() => {});
  }
}

// Toggles a trait filter on, diffs the remaining item ids against the
// unfiltered baseline set to see which items got excluded (= have the
// trait), then toggles it back off before returning.
async function getItemsWithTrait(page, traitoid, baselineIds) {
  const btnExists = await page.evaluate((oid) => !!document.getElementById(`allergy_${oid}`), traitoid);
  if (!btnExists) return new Set();

  const [onResp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('SelectTrait'), { timeout: 10000 }),
    page.evaluate((oid) => NetNutrition.UI.traitListCb(document.getElementById(`allergy_${oid}`)), traitoid),
  ]);
  const onJson = await onResp.json();
  const html = onJson.panels?.find((p) => p.id === 'itemPanel')?.html ?? '';
  const remaining = new Set([...html.matchAll(/showNutrition_(\d+)/g)].map((m) => m[1]));

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('SelectTrait'), { timeout: 10000 }),
    page.evaluate((oid) => NetNutrition.UI.traitListCb(document.getElementById(`allergy_${oid}`)), traitoid),
  ]);
  await page.waitForTimeout(500);

  const withTrait = new Set();
  for (const id of baselineIds) {
    if (!remaining.has(id)) withTrait.add(id);
  }
  return withTrait;
}

// Scrapes the currently-displayed item panel: ingredients for every item,
// plus the 4 new allergen flags via trait-filter diffing. Returns
// [{ name, ingredients, allergens }].
async function scrapeCurrentMenuView(page) {
  const baseline = await getBaselineItems(page);
  if (baseline.length === 0) return [];

  const baselineIds = baseline.map((i) => i.detailOid);
  const traitSets = {};
  for (const trait of NEW_TRAITS) {
    traitSets[trait.key] = await getItemsWithTrait(page, trait.traitoid, baselineIds);
  }

  const results = [];
  for (const item of baseline) {
    const ingredients = await getIngredients(page, item.detailOid);
    const allergens = {};
    for (const trait of NEW_TRAITS) {
      allergens[trait.key] = traitSets[trait.key].has(item.detailOid) ? true : null;
    }
    results.push({ name: item.name, ingredients, allergens });
    await page.waitForTimeout(300);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Match scraped items against our existing food_item rows and PATCH them
// ---------------------------------------------------------------------------

async function enrichLocationDate(locationId, date, scrapedItems, stats, mealName) {
  const { exact, normalized } = await getExistingFoodItems(locationId, date, mealName);
  const unmatchedNames = [];
  for (const scraped of scrapedItems) {
    const key = scraped.name.trim().toLowerCase();
    // Exact first; fall back to the punctuation/accent-insensitive key.
    const foodItem = exact.get(key) ?? normalized.get(normalizeName(scraped.name));
    if (!foodItem) {
      stats.unmatched++;
      unmatchedNames.push(scraped.name);
      continue;
    }
    if (!scraped.ingredients && Object.values(scraped.allergens).every((v) => v === null)) {
      continue;
    }
    try {
      await applyEnrichment(foodItem, scraped.ingredients, scraped.allergens);
      stats.matched++;
    } catch (err) {
      // Don't let one bad item (e.g. a column that doesn't exist yet in prod)
      // abort enrichment for the rest of this meal's items.
      stats.failed = (stats.failed ?? 0) + 1;
      console.log(`    "${scraped.name}": FAILED ${err.message}`);
    }
  }

  // Surface what NetNutrition served that we couldn't line up with our own
  // rows. Previously this was only a counter, so a location sitting at 0%
  // enrichment gave no clue whether the unit failed to scrape or every name
  // simply missed — these samples make that difference obvious in the logs.
  if (unmatchedNames.length > 0) {
    const sample = unmatchedNames.slice(0, 8).map((n) => `"${n}"`).join(', ');
    console.log(
      `    unmatched (${unmatchedNames.length}): ${sample}${unmatchedNames.length > 8 ? ', …' : ''}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Date window (same Eastern-time anchoring as scripts/scrape-menus.mjs)
// ---------------------------------------------------------------------------

function getDateWindow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const base = new Date(Date.UTC(+map.year, +map.month - 1, +map.day, 12));
  const todayIso = base.toISOString().split('T')[0];

  if (process.argv[2]) {
    const iso = process.argv[2];
    return [{ iso, isToday: iso === todayIso, dateObj: new Date(`${iso}T12:00:00Z`) }];
  }

  // Today forward only, matching scrape-menus.mjs. NetNutrition has no
  // past-date view (halls can't navigate to them; cafés have no date picker at
  // all), so attempting yesterday/-2 only ever produced failed navigations and
  // zero enrichment — measurable in the DB, where every past date had 0 items
  // with ingredients while today/future had hundreds. Skipping them removes
  // that wasted browser work without losing any data.
  const dates = [];
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push({ iso: d.toISOString().split('T')[0], isToday: offset === 0, dateObj: d });
  }
  return dates;
}

// Converts an ISO date to NetNutrition's own data-date format: "Today" for
// the current Eastern-time date, otherwise "M/D/YYYY" with no leading zeros.
function toNetNutritionDateStr(entry) {
  if (entry.isToday) return 'Today';
  const d = entry.dateObj;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const dateWindow = getDateWindow();
console.log(`Enriching dates: ${dateWindow.map((d) => d.iso).join(', ')}`);

const locationMap = await getLocationMap();
const totalStats = { matched: 0, unmatched: 0, failed: 0 };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'en-US',
});
const page = await context.newPage();

try {
  await page.goto(NETNUTRITION_BASE, { waitUntil: 'networkidle', timeout: 60000 });

  // --- Dining halls: per (date, meal) navigation ---
  for (const hall of NETNUTRITION_HALLS) {
    const locationId = locationMap[hall.name];
    if (!locationId) {
      console.log(`${hall.name}: not found in Supabase`);
      continue;
    }
    console.log(`\n=== ${hall.name} ===`);

    for (const dateEntry of dateWindow) {
      await selectUnit(page, hall.unitOid);
      const hasMenu = await clickDailyMenu(page);
      if (!hasMenu) {
        console.log(`  ${dateEntry.iso}: no Daily Menu link (closed?)`);
        continue;
      }

      const dateStr = toNetNutritionDateStr(dateEntry);
      const dateFound = await selectDate(page, dateStr);
      if (!dateFound) {
        console.log(`  ${dateEntry.iso}: date not published on NetNutrition, skipping`);
        continue;
      }

      const stats = { matched: 0, unmatched: 0, failed: 0 };
      for (const meal of MEALS) {
        const mealFound = await selectMeal(page, meal.mealoid);
        if (!mealFound) continue;

        try {
          const items = await scrapeCurrentMenuView(page);
          if (items.length === 0) continue;
          await enrichLocationDate(locationId, dateEntry.iso, items, stats, meal.name);
        } catch (err) {
          console.log(`  ${dateEntry.iso} ${meal.name}: FAILED ${err.message}`);
        }
      }
      console.log(`  ${dateEntry.iso}: matched ${stats.matched}, unmatched ${stats.unmatched}, failed ${stats.failed}`);
      totalStats.matched += stats.matched;
      totalStats.unmatched += stats.unmatched;
      totalStats.failed += stats.failed;
    }
  }

  // --- Cafes/grill/markets: single flat "current" menu, today only ---
  const todayEntry = dateWindow.find((d) => d.isToday);
  for (const cafe of NETNUTRITION_CAFES) {
    const locationId = locationMap[cafe.name];
    if (!locationId) {
      console.log(`\n${cafe.name}: not found in Supabase`);
      continue;
    }
    console.log(`\n=== ${cafe.name} (today only — NetNutrition has no date nav for cafes) ===`);

    try {
      // Cafe-style units show a flat "current" menu as soon as they're
      // selected (no Daily Menu/date/meal click to force a full content
      // reset like dining halls get). Reloading the base page before each
      // selection avoids stale items lingering from the previously-selected
      // cafe when switching directly between two cafe units.
      await page.goto(NETNUTRITION_BASE, { waitUntil: 'networkidle', timeout: 60000 });
      await selectUnit(page, cafe.unitOid);
      // selectUnit's fixed wait isn't always long enough for the AJAX item
      // panel to render here (unlike halls, cafes show items immediately on
      // unit selection with no intermediate Daily Menu click to gate on).
      // Wait explicitly for an item to appear, falling back to "no items"
      // (a real closure) if none show up within a few seconds.
      await page.waitForSelector('a.cbo_nn_itemHover', { timeout: 8000 }).catch(() => {});
      const items = await scrapeCurrentMenuView(page);
      if (items.length === 0) {
        console.log(`  no items found`);
        continue;
      }
      const stats = { matched: 0, unmatched: 0, failed: 0 };
      await enrichLocationDate(locationId, todayEntry.iso, items, stats);
      console.log(`  matched ${stats.matched}, unmatched ${stats.unmatched}, failed ${stats.failed}`);
      totalStats.matched += stats.matched;
      totalStats.unmatched += stats.unmatched;
      totalStats.failed += stats.failed;
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
    }
  }
} finally {
  await browser.close();
}

console.log(
  `\nDone! Total matched: ${totalStats.matched}, unmatched: ${totalStats.unmatched}, failed: ${totalStats.failed}`,
);
