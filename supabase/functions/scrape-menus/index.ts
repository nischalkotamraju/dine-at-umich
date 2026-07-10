/**
 * Michigan Dining Menu Scraper — Supabase Edge Function
 *
 * Scrapes dining.umich.edu via ScraperAPI (bypasses Cloudflare), parses HTML,
 * and bulk-inserts into Supabase.
 *
 * Required secret: SCRAPER_API_KEY  (set via `supabase secrets set SCRAPER_API_KEY=...`)
 */

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

// Blue Market at Bursley/Michigan Union/Munger and PharmFresh are pure
// grab-and-go convenience marts with no published itemized menu (confirmed
// 0 items across multiple test dates) — intentionally excluded here.
const MARKETS = [
  { name: 'Blue Market at Pierpont Commons', baseUrl: 'https://dining.umich.edu/menus-locations/markets/blue-market/pierpont-commons/' },
  { name: 'Blue Cafe and Market at Mosher-Jordan', baseUrl: 'https://dining.umich.edu/menus-locations/markets/blue-market-and-cafe/mosher-jordan/' },
  { name: "Maizie's Kitchen and Market", baseUrl: 'https://dining.umich.edu/menus-locations/markets/maizies/' },
];

const CAFE_STYLE_LOCATIONS = [...CAFES, ...GRILL, ...MARKETS];

// ---------------------------------------------------------------------------
// HTML parsing (mirrors cloudflare-worker/src/index.js)
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseMenuHtml(html: string) {
  const meals: { name: string; categories: { title: string; items: any[] }[] }[] = [];
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
function isNoiseCategory(name: string): boolean {
  return /(?:'|’)s Hours$/i.test(name) || name === 'Special Diets' || name === 'MyNutrition';
}

function parseCategoriesFromMealChunk(mealChunk: string) {
  const categories: { title: string; items: any[] }[] = [];
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
function parseCafeStyleMenuHtml(html: string) {
  const categories = parseCategoriesFromMealChunk(html);
  return categories.length > 0 ? [{ name: 'Menu', categories }] : [];
}

function parseItemsFromCategoryChunk(categoryChunk: string) {
  const items: any[] = [];
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

    const classTraits = traitClasses.split(/\s+/).map((c: string) =>
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
      milk: classTraits.some((t: string) => t === 'milk' || t === 'dairy'),
      egg: classTraits.some((t: string) => t === 'eggs' || t === 'egg'),
      fish: classTraits.includes('fish'),
      shellfish: classTraits.includes('shellfish'),
      tree_nuts: classTraits.some((t: string) => t === 'treenuts' || t === 'tree-nuts' || t === 'tree_nuts'),
      peanuts: classTraits.includes('peanuts'),
      wheat: classTraits.some((t: string) => t === 'wheat' || t === 'gluten'),
      soy: classTraits.includes('soy'),
      sesame_seeds: classTraits.some((t: string) => t === 'sesame' || t === 'sesameseeds'),
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

function parseNutrition(html: string) {
  const n: Record<string, string | null> = {
    serving_size: null, calories: null, total_fat: null, saturated_fat: null,
    trans_fat: null, cholesterol: null, sodium: null, total_carbohydrates: null,
    dietary_fiber: null, total_sugars: null, protein: null, vitamin_a: null,
    vitamin_c: null, vitamin_d: null,
    calcium: null, iron: null, potassium: null,
  };
  if (!html) return n;

  const rows = html.split(/<tr[^>]*>/i);
  for (const row of rows) {
    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const num = (str: string) => { const m = str.match(/(\d+\.?\d*)/); return m ? m[1] : null; };
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
// Supabase helpers
// ---------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sbFetch(method: string, path: string, body?: unknown) {
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

// ---------------------------------------------------------------------------
// Scrape one location
// ---------------------------------------------------------------------------

async function scrapeHall(
  hall: { name: string; slug: string },
  date: string,
  scraperApiKey: string,
  locationMap: Record<string, number>,
) {
  const locationId = locationMap[hall.name];
  if (!locationId) return `Location not found in Supabase`;
  const target = `https://dining.umich.edu/menus-locations/dining-halls/${hall.slug}/?menuDate=${date}`;
  return scrapeLocation(target, date, locationId, scraperApiKey, parseMenuHtml);
}

async function scrapeCafeStyle(
  place: { name: string; baseUrl: string },
  date: string,
  scraperApiKey: string,
  locationMap: Record<string, number>,
) {
  const locationId = locationMap[place.name];
  if (!locationId) return `Location not found in Supabase`;
  const target = `${place.baseUrl}?menuDate=${date}`;
  return scrapeLocation(target, date, locationId, scraperApiKey, parseCafeStyleMenuHtml);
}

async function scrapeLocation(
  target: string,
  date: string,
  locationId: number,
  scraperApiKey: string,
  parseFn: (html: string) => { name: string; categories: { title: string; items: any[] }[] }[],
) {
  const scraperUrl = `http://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(target)}&render=true`;

  let res = await fetch(scraperUrl);
  if (!res.ok) {
    await new Promise(r => setTimeout(r, 3000));
    res = await fetch(scraperUrl);
    if (!res.ok) return `ScraperAPI HTTP ${res.status}`;
  }
  const html = await res.text();

  if (html.length < 10000 || html.includes('Just a moment')) {
    return `Bot challenge page (${html.length} bytes)`;
  }

  const meals = parseFn(html);
  if (meals.length === 0) return `Closed / no menu`;

  // Delete existing menus for this location+date
  await sbFetch('DELETE', `/menu?location_id=eq.${locationId}&date=eq.${date}`);

  // Bulk insert menus
  const menuRows = await sbFetch('POST', '/menu',
    meals.map(m => ({ location_id: locationId, name: m.name, date })));

  const menuIdMap: Record<string, number> = {};
  for (const row of menuRows) menuIdMap[row.name] = row.id;

  const allCategories: { menu_id: number; title: string; _items: any[] }[] = [];
  for (const meal of meals) {
    const menuId = menuIdMap[meal.name];
    if (!menuId) continue;
    for (const cat of meal.categories) {
      allCategories.push({ menu_id: menuId, title: cat.title, _items: cat.items });
    }
  }
  if (allCategories.length === 0) return `${meals.length} meals, 0 categories`;

  const catRows = await sbFetch('POST', '/menu_category',
    allCategories.map(c => ({ menu_id: c.menu_id, title: c.title })));

  const catIdMap: Record<string, number> = {};
  for (const row of catRows) catIdMap[`${row.menu_id}:${row.title}`] = row.id;

  const allItems: any[] = [];
  for (const cat of allCategories) {
    const categoryId = catIdMap[`${cat.menu_id}:${cat.title}`];
    if (!categoryId) continue;
    for (const item of cat._items) {
      allItems.push({ categoryId, ...item });
    }
  }
  if (allItems.length === 0) return `${meals.length} meals, 0 items`;

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

  return `${meals.length} meals, ${allItems.length} items inserted`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');
  if (!scraperApiKey) {
    return new Response(JSON.stringify({ error: 'SCRAPER_API_KEY secret not set' }), { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const today = new Date().toISOString().split('T')[0];
  const targetDate = body.date ?? today;

  // Build date range: 2 days back, today, 3 days forward (or single date if specified)
  let dates: string[];
  if (body.date) {
    dates = [body.date];
  } else {
    dates = [];
    for (let offset = -2; offset <= 3; offset++) {
      const d = new Date(targetDate + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + offset);
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  // Fetch location IDs
  const allNames = [...DINING_HALLS.map(h => h.name), ...CAFE_STYLE_LOCATIONS.map(l => l.name)];
  const locData = await sbFetch('GET',
    `/location?name=in.(${encodeURIComponent(allNames.join(','))})&select=id,name`);
  const locationMap: Record<string, number> = {};
  for (const row of (locData ?? [])) locationMap[row.name] = row.id;

  const results: Record<string, string> = {};

  for (const date of dates) {
    for (const hall of DINING_HALLS) {
      const key = `${date} | ${hall.name}`;
      try {
        results[key] = await scrapeHall(hall, date, scraperApiKey, locationMap);
      } catch (err: any) {
        results[key] = `Error: ${err.message}`;
      }
    }
    for (const place of CAFE_STYLE_LOCATIONS) {
      const key = `${date} | ${place.name}`;
      try {
        results[key] = await scrapeCafeStyle(place, date, scraperApiKey, locationMap);
      } catch (err: any) {
        results[key] = `Error: ${err.message}`;
      }
    }
  }

  return new Response(JSON.stringify({ dates, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});
