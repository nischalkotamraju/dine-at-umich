/**
 * UMich Dining Menu Scraper
 * Uses Playwright (headless Chromium) to bypass Cloudflare bot protection on
 * dining.umich.edu — no ScraperAPI, no timeouts.
 * Run with: node scripts/scrape-menus.mjs [YYYY-MM-DD]
 *
 * Env vars required:
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { chromium } from 'playwright';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jzcxllxhnjjbgflpsehi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}

const DINING_HALLS = [
  { name: 'Bursley Dining Hall',          slug: 'bursley' },
  { name: 'East Quad Dining Hall',        slug: 'east-quad' },
  { name: 'Markley Dining Hall',          slug: 'markley' },
  { name: 'North Quad Dining Hall',       slug: 'north-quad' },
  { name: 'South Quad Dining Hall',       slug: 'south-quad' },
  { name: 'Mosher-Jordan Dining Hall',    slug: 'mosher-jordan' },
  { name: 'Twigs at Oxford',              slug: 'twigs-at-oxford' },
  { name: 'Wolverine Village Dining Hall', slug: 'wolverine-village-dining-hall' },
  { name: 'Lawyers Club Dining Hall',     slug: 'select-access/lawyers-club' },
  { name: 'Martha Cook Dining Hall',      slug: 'select-access/martha-cook' },
];

// Cafés, the grill, and markets don't have <h3> meal-period sections like dining
// halls — they render a single flat list of <h4> categories instead. They're
// scraped with a different parser (parseCafeStyleMenuHtml) but the same
// insert/delete pipeline.
const CAFES = [
  { name: "Bert's Café",     baseUrl: 'https://dining.umich.edu/menus-locations/cafes/berts-cafe/' },
  { name: 'Blue Cafe East Quad', baseUrl: 'https://dining.umich.edu/menus-locations/cafes/east-quad/' },
  { name: 'Café 32',         baseUrl: 'https://dining.umich.edu/menus-locations/cafes/cafe-32/' },
  { name: "Darwin's",        baseUrl: 'https://dining.umich.edu/menus-locations/cafes/darwins/' },
  { name: 'Eigen Café',      baseUrl: 'https://dining.umich.edu/menus-locations/cafes/eigen-cafe/' },
  { name: 'Fireside Café',   baseUrl: 'https://dining.umich.edu/menus-locations/cafes/fireside-cafe/' },
  { name: 'JavaBlu',         baseUrl: 'https://dining.umich.edu/menus-locations/cafes/taubman-health-sciences-library/' },
  { name: 'Mujo Café',       baseUrl: 'https://dining.umich.edu/menus-locations/cafes/mujo-cafe/' },
  { name: 'UMMA Café',       baseUrl: 'https://dining.umich.edu/menus-locations/cafes/umma-cafe/' },
];

const GRILL = [
  { name: 'Petrovich Family Grill', baseUrl: 'https://dining.umich.edu/menus-locations/petrovich-family-grill/' },
];

// Blue Market at Bursley/Munger and PharmFresh are pure grab-and-go
// convenience marts with no published itemized menu (confirmed 0 items
// across multiple test dates) — intentionally excluded here. Blue Market at
// Michigan Union DOES publish a real itemized menu (Classics, Non Coffee,
// Iced Beverages, Baked Goods, MBakery, etc.) on weekdays — confirmed via
// direct page inspection — so it's included below like any other café-style
// location.
const MARKETS = [
  { name: 'Blue Market at Pierpont Commons', baseUrl: 'https://dining.umich.edu/menus-locations/markets/blue-market/pierpont-commons/' },
  { name: 'Blue Cafe and Market at Mosher-Jordan', baseUrl: 'https://dining.umich.edu/menus-locations/markets/blue-market-and-cafe/mosher-jordan/' },
  { name: "Maizie's Kitchen and Market", baseUrl: 'https://dining.umich.edu/menus-locations/markets/maizies/' },
  { name: 'Blue Market at Michigan Union', baseUrl: 'https://dining.umich.edu/menus-locations/markets/blue-market/michigan-union/' },
];

const CAFE_STYLE_LOCATIONS = [...CAFES, ...GRILL, ...MARKETS];

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
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function getLocationMap() {
  const allNames = [
    ...DINING_HALLS.map(h => h.name),
    ...CAFE_STYLE_LOCATIONS.map(l => l.name),
  ];
  const names = allNames.join(',');
  const data = await sbFetch('GET', `/location?name=in.(${encodeURIComponent(names)})&select=id,name`);
  const map = {};
  for (const row of (data ?? [])) map[row.name] = row.id;
  return map;
}

// ---------------------------------------------------------------------------
// HTML parsing
// ---------------------------------------------------------------------------

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseMenuHtml(html) {
  const meals = [];
  const MEAL_NAMES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Late Night'];

  const h3Parts = html.split(/<h3[^>]*>/i);
  for (const part of h3Parts) {
    const headerEnd = part.indexOf('</h3>');
    if (headerEnd === -1) continue;
    const headerText = stripTags(part.substring(0, headerEnd));
    const mealName = MEAL_NAMES.find(m => headerText.includes(m));
    if (!mealName) continue;
    const categories = parseCategoriesFromMealChunk(part);
    if (categories.length > 0) meals.push({ name: mealName, categories });
  }
  return meals;
}

// Café/grill/market pages prepend non-menu <h4> sections ("Today's Hours",
// "Special Diets", "MyNutrition") before the real categories. These normally
// fall out on their own (no trait-<li> items inside), but filter explicitly
// in case a location ever lists a real item under "Today's Hours".
function isNoiseCategory(name) {
  return /(?:'|’)s Hours$/i.test(name) || name === 'Special Diets' || name === 'MyNutrition';
}

function parseCategoriesFromMealChunk(mealChunk) {
  const categories = [];
  const h4Parts = mealChunk.split(/<h4[^>]*>/i);
  for (let i = 1; i < h4Parts.length; i++) {
    const part = h4Parts[i];
    const nameEnd = part.indexOf('</h4>');
    if (nameEnd === -1) continue;
    const categoryName = stripTags(part.substring(0, nameEnd)).replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
    if (!categoryName || isNoiseCategory(categoryName)) continue;
    const items = parseItemsFromCategoryChunk(part);
    if (items.length > 0) categories.push({ title: categoryName, items });
  }
  return categories;
}

// Cafés, the grill, and markets have no <h3> meal-period wrapper — just a
// flat run of <h4> categories. Treat the whole page as a single "Menu" meal.
function parseCafeStyleMenuHtml(html) {
  const categories = parseCategoriesFromMealChunk(html);
  return categories.length > 0 ? [{ name: 'Menu', categories }] : [];
}

function parseItemsFromCategoryChunk(categoryChunk) {
  const items = [];
  const liParts = categoryChunk.split(/<li class="([^"]*trait-[^"]*)"/i);

  for (let i = 1; i < liParts.length; i += 2) {
    const traitClasses = liParts[i] ?? '';
    const itemHtml = liParts[i + 1] ?? '';

    // Café/market/grill item names have a nested <span class="price">$X.XX</span>
    // inside the item-name span. Stop at either that nested span's start or the
    // item-name span's own close, whichever comes first, so the price never
    // gets captured as part of the name (dining halls have no nested span, so
    // this is a no-op there).
    const nameMatch = itemHtml.match(/<span[^>]*class="item-name"[^>]*>([\s\S]*?)(?:<span[^>]*class="price"|<\/span>)/i);
    if (!nameMatch) continue;
    const name = stripTags(nameMatch[1]).replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
    if (!name) continue;

    // Café/market/grill items have a nested <span class="price">$X.XX</span>
    // inside the item-name span; dining halls have none, so this is null there.
    const priceMatch = itemHtml.match(/<span[^>]*class="price"[^>]*>([\s\S]*?)<\/span>/i);
    const price = priceMatch ? stripTags(priceMatch[1]).replace(/\s+/g, ' ').trim() || null : null;

    const classTraits = traitClasses.split(/\s+/).map(c =>
      c.startsWith('trait-') ? c.slice(6) :
      c.startsWith('allergen-') ? c.slice(9) : c
    );

    let nutStart = itemHtml.indexOf('<div class="nutrition"');
    if (nutStart < 0) {
      const m = itemHtml.match(/<div[^>]+class="nutrition[^"]*"/i);
      if (m) nutStart = itemHtml.indexOf(m[0]);
    }
    const nutritionHtml = nutStart >= 0 ? itemHtml.substring(nutStart, nutStart + 10000) : '';
    const nutrition = parseNutrition(nutritionHtml);

    const allergens = {
      milk: classTraits.some(t => t === 'milk' || t === 'dairy'),
      egg: classTraits.some(t => t === 'eggs' || t === 'egg'),
      fish: classTraits.includes('fish'),
      shellfish: classTraits.includes('shellfish'),
      tree_nuts: classTraits.some(t => t === 'treenuts' || t === 'tree-nuts' || t === 'tree_nuts'),
      peanuts: classTraits.includes('peanuts'),
      wheat: classTraits.some(t => t === 'wheat' || t === 'gluten'),
      soy: classTraits.includes('soy'),
      sesame_seeds: classTraits.some(t => t === 'sesame' || t === 'sesameseeds'),
      beef: classTraits.includes('beef'),
      pork: classTraits.includes('pork'),
      halal: classTraits.includes('halal'),
      vegan: classTraits.includes('vegan'),
      vegetarian: classTraits.includes('vegetarian'),
    };

    items.push({
      name,
      price,
      allergens: Object.values(allergens).some(Boolean) ? allergens : null,
      nutrition: nutrition.calories !== null ? nutrition : null,
    });
  }
  return items;
}

function parseNutrition(html) {
  const n = {
    serving_size: null, calories: null, total_fat: null, saturated_fat: null,
    trans_fat: null, cholesterol: null, sodium: null, total_carbohydrates: null,
    dietary_fiber: null, total_sugars: null, protein: null, vitamin_a: null,
    vitamin_c: null, vitamin_d: null, calcium: null, iron: null, potassium: null,
  };
  if (!html) return n;

  const rows = html.split(/<tr[^>]*>/i);
  for (const row of rows) {
    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const num = (str) => { const m = str.match(/(\d+\.?\d*)/); return m ? m[1] : null; };
    const t = text.toLowerCase();

    if (t.startsWith('serving size')) {
      n.serving_size = text.replace(/^serving size\s*/i, '').replace(/\s*%.*$/, '').trim() || null;
    } else if (/^calories\s/i.test(text)) {
      n.calories = num(text.replace(/^calories\s*/i, ''));
    } else if (/^total fat\b/i.test(t)) {
      n.total_fat = num(text.replace(/^total fat/i, ''));
    } else if (/^saturated fat\b/i.test(t)) {
      n.saturated_fat = num(text.replace(/^saturated fat/i, ''));
    } else if (/^trans fat\b/i.test(t)) {
      n.trans_fat = num(text.replace(/^trans fat/i, ''));
    } else if (/^cholesterol\b/i.test(t)) {
      n.cholesterol = num(text.replace(/^cholesterol/i, ''));
    } else if (/^sodium\b/i.test(t)) {
      n.sodium = num(text.replace(/^sodium/i, ''));
    } else if (/^total carbohydrate/i.test(t)) {
      n.total_carbohydrates = num(text.replace(/^total carbohydrate\w*/i, ''));
    } else if (/^dietary fiber\b/i.test(t)) {
      n.dietary_fiber = num(text.replace(/^dietary fiber/i, ''));
    } else if (/^total sugars\b/i.test(t)) {
      n.total_sugars = num(text.replace(/^total sugars/i, ''));
    } else if (/^sugars\s/i.test(text)) {
      n.total_sugars = n.total_sugars ?? num(text.replace(/^sugars\s*/i, ''));
    } else if (/^protein\b/i.test(t)) {
      n.protein = num(text.replace(/^protein/i, ''));
    } else if (/^vitamin a\b/i.test(t)) {
      n.vitamin_a = num(text.replace(/^vitamin a/i, ''));
    } else if (/^vitamin c\b/i.test(t)) {
      n.vitamin_c = num(text.replace(/^vitamin c/i, ''));
    } else if (/^vitamin d\b/i.test(t)) {
      n.vitamin_d = num(text.replace(/^vitamin d/i, ''));
    } else if (/^calcium\b/i.test(t)) {
      n.calcium = num(text.replace(/^calcium/i, ''));
    } else if (/^iron\s/i.test(text)) {
      n.iron = num(text.replace(/^iron\s*/i, ''));
    } else if (/^potassium\b/i.test(t)) {
      n.potassium = num(text.replace(/^potassium/i, ''));
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Scrape one location for one date (uses Playwright page)
// ---------------------------------------------------------------------------

async function scrapeHall(page, hall, date, locationId) {
  const url = `https://dining.umich.edu/menus-locations/dining-halls/${hall.slug}/?menuDate=${date}`;
  await scrapeLocation(page, url, parseMenuHtml, date, locationId);
}

async function scrapeCafeStyle(page, place, date, locationId) {
  const url = `${place.baseUrl}?menuDate=${date}`;
  await scrapeLocation(page, url, parseCafeStyleMenuHtml, date, locationId);
}

async function scrapeLocation(page, url, parseFn, date, locationId) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('h3, h4, .no-menu-message, #content', { timeout: 15000 }).catch(() => {});
  const html = await page.content();

  if (html.length < 5000 || html.includes('Just a moment') || html.includes('cf-browser-verification')) {
    console.log(`  Bot challenge page (${html.length} bytes)`);
    return;
  }

  const meals = parseFn(html);
  if (meals.length === 0) {
    console.log(`  ℹ️  Closed / no menu`);
    return;
  }

  // Delete existing menus for this location+date
  await sbFetch('DELETE', `/menu?location_id=eq.${locationId}&date=eq.${date}`);

  // Bulk insert menus
  const menuRows = await sbFetch('POST', '/menu',
    meals.map(m => ({ location_id: locationId, name: m.name, date })));

  const menuIdMap = {};
  for (const row of menuRows) menuIdMap[row.name] = row.id;

  // Flatten categories
  const allCategories = [];
  for (const meal of meals) {
    const menuId = menuIdMap[meal.name];
    if (!menuId) continue;
    for (const cat of meal.categories) {
      allCategories.push({ menu_id: menuId, title: cat.title, _items: cat.items });
    }
  }
  if (allCategories.length === 0) return;

  // Bulk insert categories
  const catRows = await sbFetch('POST', '/menu_category',
    allCategories.map(c => ({ menu_id: c.menu_id, title: c.title })));

  const catIdMap = {};
  for (const row of catRows) catIdMap[`${row.menu_id}:${row.title}`] = row.id;

  // Flatten items
  const allItems = [];
  for (const cat of allCategories) {
    const categoryId = catIdMap[`${cat.menu_id}:${cat.title}`];
    if (!categoryId) continue;
    for (const item of cat._items) {
      allItems.push({ categoryId, ...item });
    }
  }
  if (allItems.length === 0) return;

  // Bulk insert nutrition
  const nutritionItems = allItems.filter(i => i.nutrition);
  if (nutritionItems.length > 0) {
    const nutRows = await sbFetch('POST', '/nutrition', nutritionItems.map(i => i.nutrition));
    for (let j = 0; j < nutritionItems.length; j++) {
      nutritionItems[j]._nutritionId = nutRows[j]?.id ?? null;
    }
  }

  // Bulk insert allergens
  const allergenItems = allItems.filter(i => i.allergens);
  if (allergenItems.length > 0) {
    const algRows = await sbFetch('POST', '/allergens', allergenItems.map(i => i.allergens));
    for (let j = 0; j < allergenItems.length; j++) {
      allergenItems[j]._allergenId = algRows[j]?.id ?? null;
    }
  }

  // Bulk insert food items
  await sbFetch('POST', '/food_item', allItems.map(item => ({
    menu_category_id: item.categoryId,
    name: item.name,
    price: item.price ?? null,
    nutrition_id: item._nutritionId ?? null,
    allergens_id: item._allergenId ?? null,
  })));

  console.log(`  ✅ ${meals.length} meals, ${allItems.length} items`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let dates;
if (process.argv[2]) {
  dates = [process.argv[2]];
} else {
  // Anchor to "today" in Eastern Time (Ann Arbor, MI) rather than the
  // scraper host's UTC date — otherwise a run between ~8pm-midnight Eastern
  // (when the UTC calendar date has already rolled over) shifts the whole
  // window a day forward and silently drops the correct day.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const base = new Date(Date.UTC(+map.year, +map.month - 1, +map.day, 12));

  // Today forward only — deliberately NOT backwards. scrapeLocationDate()
  // DELETEs a location+date's menu and re-inserts it from scratch, which also
  // throws away the ingredients and detailed allergen flags that
  // scrape-netnutrition.mjs added. That enrichment can only ever be applied to
  // today and future dates (NetNutrition exposes no past-date view for halls,
  // and no date navigation at all for cafés), so re-scraping a past date
  // permanently strips data that can never be rebuilt. Past menus don't change
  // anyway, so leaving them alone preserves the enrichment they picked up while
  // they were current.
  dates = [];
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push(d.toISOString().split('T')[0]);
  }
}

console.log(`Scraping dates: ${dates.join(', ')}`);

const locationMap = await getLocationMap();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'en-US',
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});
const page = await context.newPage();

try {
  for (const date of dates) {
    console.log(`\n=== ${date} ===`);
    for (const hall of DINING_HALLS) {
      const locationId = locationMap[hall.name];
      if (!locationId) {
        console.log(`  ${hall.name}: not found in Supabase`);
        continue;
      }
      process.stdout.write(`  ${hall.name}... `);
      try {
        await scrapeHall(page, hall, date, locationId);
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    for (const place of CAFE_STYLE_LOCATIONS) {
      const locationId = locationMap[place.name];
      if (!locationId) {
        console.log(`  ${place.name}: not found in Supabase`);
        continue;
      }
      process.stdout.write(`  ${place.name}... `);
      try {
        await scrapeCafeStyle(page, place, date, locationId);
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }
} finally {
  await browser.close();
}

console.log('\nDone!');
