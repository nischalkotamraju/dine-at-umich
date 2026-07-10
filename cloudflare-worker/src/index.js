/**
 * Michigan Dining Menu Scraper — Cloudflare Worker
 *
 * Scrapes dining.umich.edu via ScraperAPI, parses embedded HTML menu data,
 * and bulk-inserts into Supabase (minimizing subrequests to stay under free-tier limit).
 *
 * Secrets (set via `npx wrangler secret put`):
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SCRAPER_API_KEY
 *
 * Deploy:  cd cloudflare-worker && npx wrangler deploy
 * Trigger: curl https://michigan-dining-scraper.michigan-dining.workers.dev
 */

const DINING_HALLS = [
  { name: 'Bursley Dining Hall',       slug: 'bursley' },
  { name: 'East Quad Dining Hall',     slug: 'east-quad' },
  { name: 'Markley Dining Hall',       slug: 'markley' },
  { name: 'North Quad Dining Hall',    slug: 'north-quad' },
  { name: 'South Quad Dining Hall',    slug: 'south-quad' },
  { name: 'Mosher-Jordan Dining Hall', slug: 'mosher-jordan' },
];

// ---------------------------------------------------------------------------
// HTML parsing
// ---------------------------------------------------------------------------

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function parseMenuHtml(html) {
  const meals = [];
  const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Late Night'];

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

function parseCategoriesFromMealChunk(mealChunk) {
  const categories = [];
  const h4Parts = mealChunk.split(/<h4[^>]*>/i);

  for (let i = 1; i < h4Parts.length; i++) {
    const part = h4Parts[i];
    const nameEnd = part.indexOf('</h4>');
    if (nameEnd === -1) continue;
    const categoryName = stripTags(part.substring(0, nameEnd)).replace(/\s+/g, ' ').trim();
    if (!categoryName) continue;

    const items = parseItemsFromCategoryChunk(part);
    if (items.length > 0) categories.push({ title: categoryName, items });
  }

  return categories;
}

function parseItemsFromCategoryChunk(categoryChunk) {
  const items = [];
  const liParts = categoryChunk.split(/<li class="([^"]*trait-[^"]*)"/i);

  for (let i = 1; i < liParts.length; i += 2) {
    const traitClasses = liParts[i] ?? '';
    const itemHtml = liParts[i + 1] ?? '';

    const nameMatch = itemHtml.match(/<span[^>]*class="item-name"[^>]*>([\s\S]*?)<\/span>/i);
    if (!nameMatch) continue;
    const name = stripTags(nameMatch[1]).replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
    if (!name) continue;

    const classTraits = traitClasses.split(/\s+/).map(c =>
      c.startsWith('trait-') ? c.slice(6) :
      c.startsWith('allergen-') ? c.slice(9) : c
    );

    // Find nutrition div — handle variants like "nutrition clearfix", "nutrition-label", etc.
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
    dietary_fiber: null, total_sugars: null, protein: null, vitamin_d: null,
    calcium: null, iron: null, potassium: null,
  };
  if (!html) return n;

  // Parse each <tr> in the nutrition table individually to avoid cross-row regex issues
  const rows = html.split(/<tr[^>]*>/i);

  for (const row of rows) {
    // Strip all tags from this row to get plain text
    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    // Extract first number (with optional decimal) from a text segment
    const num = (str) => {
      const m = str.match(/(\d+\.?\d*)/);
      return m ? m[1] : null;
    };

    const t = text.toLowerCase();

    if (t.startsWith('serving size')) {
      // "Serving Size 1 Cup (240g)" — grab everything after "serving size "
      n.serving_size = text.replace(/^serving size\s*/i, '').replace(/\s*%.*$/, '').trim() || null;
    } else if (/^calories\s/i.test(text)) {
      n.calories = num(text.replace(/^calories\s*/i, ''));
    } else if (/total fat/i.test(t) && !/saturated/i.test(t)) {
      n.total_fat = num(text.replace(/total fat/i, ''));
    } else if (/saturated fat/i.test(t)) {
      n.saturated_fat = num(text.replace(/saturated fat/i, ''));
    } else if (/trans fat/i.test(t)) {
      n.trans_fat = num(text.replace(/trans fat/i, ''));
    } else if (/cholesterol/i.test(t)) {
      n.cholesterol = num(text.replace(/cholesterol/i, ''));
    } else if (/sodium/i.test(t)) {
      n.sodium = num(text.replace(/sodium/i, ''));
    } else if (/total carbohydrate/i.test(t)) {
      n.total_carbohydrates = num(text.replace(/total carbohydrate\w*/i, ''));
    } else if (/dietary fiber/i.test(t)) {
      n.dietary_fiber = num(text.replace(/dietary fiber/i, ''));
    } else if (/total sugars/i.test(t)) {
      n.total_sugars = num(text.replace(/total sugars/i, ''));
    } else if (/^sugars\s/i.test(text)) {
      n.total_sugars = n.total_sugars ?? num(text.replace(/^sugars\s*/i, ''));
    } else if (/protein/i.test(t)) {
      n.protein = num(text.replace(/protein/i, ''));
    } else if (/vitamin d/i.test(t)) {
      n.vitamin_d = num(text.replace(/vitamin d/i, ''));
    } else if (/calcium/i.test(t) && !t.includes('citrate')) {
      n.calcium = num(text.replace(/calcium/i, ''));
    } else if (/^iron\s/i.test(text)) {
      n.iron = num(text.replace(/^iron\s*/i, ''));
    } else if (/potassium/i.test(t)) {
      n.potassium = num(text.replace(/potassium/i, ''));
    }
  }

  return n;
}

// ---------------------------------------------------------------------------
// Supabase helpers — bulk operations to minimize subrequests
// ---------------------------------------------------------------------------

async function sbFetch(supabaseUrl, serviceKey, method, path, body) {
  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
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
// Main scraper — one hall at a time, all inserts batched
// ---------------------------------------------------------------------------

async function scrapeHall(hall, date, scraperApiKey, supabaseUrl, supabaseKey, locationMap) {
  const locationId = locationMap[hall.name];
  if (!locationId) return { hall: hall.name, result: 'Location not found in Supabase' };

  // 1. Fetch HTML from ScraperAPI, with 1 retry on 500 (1-2 subrequests)
  const target = `https://dining.umich.edu/menus-locations/dining-halls/${hall.slug}/?menuDate=${date}`;
  const scraperUrl = `http://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(target)}&render=true`;
  let res = await fetch(scraperUrl);
  if (!res.ok) {
    // Wait 3s and retry once
    await new Promise(r => setTimeout(r, 3000));
    res = await fetch(scraperUrl);
    if (!res.ok) return { hall: hall.name, result: `ScraperAPI HTTP ${res.status}` };
  }
  const html = await res.text();
  if (html.length < 10000 || html.includes('Just a moment')) {
    return { hall: hall.name, result: 'Got bot challenge page' };
  }

  const meals = parseMenuHtml(html);
  if (meals.length === 0) return { hall: hall.name, result: 'Closed today (no menu on page)' };

  // 2. Delete existing menus for this location+date (1 subrequest, cascades to categories/items)
  // This ensures we never leave partial data (categories without food items)
  await sbFetch(supabaseUrl, supabaseKey, 'DELETE',
    `/menu?location_id=eq.${locationId}&date=eq.${date}`);

  // 3. Bulk insert menus → get IDs (1 subrequest)
  const menuRows = await sbFetch(supabaseUrl, supabaseKey, 'POST', '/menu',
    meals.map(m => ({ location_id: locationId, name: m.name, date })));

  // Build meal name → menu ID map
  const menuIdMap = {};
  for (const row of menuRows) menuIdMap[row.name] = row.id;

  // Flatten all categories across all meals
  const allCategories = [];
  for (const meal of meals) {
    const menuId = menuIdMap[meal.name];
    if (!menuId) continue;
    for (const cat of meal.categories) {
      allCategories.push({ menu_id: menuId, title: cat.title, _items: cat.items });
    }
  }

  if (allCategories.length === 0) return { hall: hall.name, result: `${meals.length} meals, 0 categories` };

  // 4. Bulk insert menu_categories → get IDs (1 subrequest)
  const catInserts = allCategories.map(c => ({ menu_id: c.menu_id, title: c.title }));
  const catRows = await sbFetch(supabaseUrl, supabaseKey, 'POST', '/menu_category', catInserts);

  // Map category title+menu_id → category ID
  const catIdMap = {};
  for (const row of catRows) catIdMap[`${row.menu_id}:${row.title}`] = row.id;

  // Flatten all food items
  const allItems = [];
  for (const cat of allCategories) {
    const categoryId = catIdMap[`${cat.menu_id}:${cat.title}`];
    if (!categoryId) continue;
    for (const item of cat._items) {
      allItems.push({ categoryId, ...item });
    }
  }

  if (allItems.length === 0) return { hall: hall.name, result: `${meals.length} meals, 0 items` };

  // 5. Bulk insert all nutrition rows at once → get IDs (1 subrequest)
  const nutritionItems = allItems.filter(i => i.nutrition);
  let nutritionIds = {};
  if (nutritionItems.length > 0) {
    const nutRows = await sbFetch(supabaseUrl, supabaseKey, 'POST', '/nutrition',
      nutritionItems.map(i => i.nutrition));
    for (let j = 0; j < nutritionItems.length; j++) {
      nutritionItems[j]._nutritionId = nutRows[j]?.id ?? null;
    }
    for (const item of nutritionItems) {
      // use object identity to map back
      nutritionIds[nutritionItems.indexOf(item)] = item._nutritionId;
    }
  }

  // 6. Bulk insert all allergen rows at once → get IDs (1 subrequest)
  const allergenItems = allItems.filter(i => i.allergens);
  if (allergenItems.length > 0) {
    const algRows = await sbFetch(supabaseUrl, supabaseKey, 'POST', '/allergens',
      allergenItems.map(i => i.allergens));
    for (let j = 0; j < allergenItems.length; j++) {
      allergenItems[j]._allergenId = algRows[j]?.id ?? null;
    }
  }

  // 7. Bulk insert all food_items (1 subrequest)
  const foodItemInserts = allItems.map(item => ({
    menu_category_id: item.categoryId,
    name: item.name,
    nutrition_id: item._nutritionId ?? null,
    allergens_id: item._allergenId ?? null,
  }));
  await sbFetch(supabaseUrl, supabaseKey, 'POST', '/food_item', foodItemInserts);

  return { hall: hall.name, result: `${meals.length} meals, ${allItems.length} items inserted` };
}

// Returns array of date strings YYYY-MM-DD: 2 days back, today, 3 days forward
function getDateRange(todayStr) {
  const today = new Date(todayStr + 'T12:00:00Z');
  const dates = [];
  for (let offset = -2; offset <= 3; offset++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function runScraper(dates, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const scraperApiKey = env.SCRAPER_API_KEY;

  if (!supabaseKey) return [{ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }];
  if (!scraperApiKey) return [{ error: 'SCRAPER_API_KEY not set' }];

  // Fetch all location IDs in one request
  const locData = await sbFetch(supabaseUrl, supabaseKey, 'GET',
    `/location?name=in.(${encodeURIComponent(DINING_HALLS.map(h => h.name).join(','))})&select=id,name`);
  const locationMap = {};
  for (const row of (locData ?? [])) locationMap[row.name] = row.id;

  const results = [];
  for (const date of dates) {
    for (const hall of DINING_HALLS) {
      try {
        const result = await scrapeHall(hall, date, scraperApiKey, supabaseUrl, supabaseKey, locationMap);
        results.push({ date, ...result });
        console.log(`[${date}] ${hall.name}: ${result.result}`);
      } catch (err) {
        results.push({ date, hall: hall.name, result: `Error: ${err.message}` });
        console.error(`[${date}] ${hall.name} failed:`, err.message);
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Worker entrypoints
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Debug endpoint: ?debug=1 returns raw nutrition HTML for first Bursley item
    if (url.searchParams.get('debug') === '1') {
      const slug = url.searchParams.get('slug') ?? 'bursley';
      const target = `https://dining.umich.edu/menus-locations/dining-halls/${slug}/`;
      const scraperUrl = `http://api.scraperapi.com/?api_key=${env.SCRAPER_API_KEY}&url=${encodeURIComponent(target)}&render=true`;
      const res = await fetch(scraperUrl);
      const html = await res.text();
      const liParts = html.split(/<li class="([^"]*trait-[^"]*)"/i);

      // Inspect first 5 items
      const items = [];
      for (let i = 1; i < Math.min(liParts.length, 12); i += 2) {
        const cls = liParts[i] ?? '';
        const itemHtml = liParts[i + 1] ?? '';
        const nameMatch = itemHtml.match(/<span[^>]*class="item-name"[^>]*>([\s\S]*?)<\/span>/i);
        const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : '(no name)';

        // Find nutrition div
        let nutStart = itemHtml.indexOf('<div class="nutrition"');
        let nutDivMatch = null;
        if (nutStart < 0) {
          const m = itemHtml.match(/<div[^>]+class="nutrition[^"]*"/i);
          if (m) { nutStart = itemHtml.indexOf(m[0]); nutDivMatch = m[0]; }
        } else {
          nutDivMatch = '<div class="nutrition"';
        }
        const nutritionHtml = nutStart >= 0 ? itemHtml.substring(nutStart, nutStart + 3000) : '';
        const rows = nutritionHtml.split(/<tr[^>]*>/i)
          .map(r => r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 15);

        // Also show raw HTML snippet around where nutrition should be
        const rawSnippet = itemHtml.substring(0, 500);

        items.push({ name, cls: cls.substring(0, 80), nutStart, nutDivMatch, rows, rawSnippet });
      }

      return new Response(JSON.stringify({ pageLength: html.length, itemCount: Math.floor((liParts.length - 1) / 2), items }, null, 2),
        { headers: { 'Content-Type': 'application/json' } });
    }

    const today = new Date().toISOString().split('T')[0];
    // ?date=2026-07-01 scrapes just that one date; otherwise scrapes the full range
    const singleDate = url.searchParams.get('date');
    const dates = singleDate ? [singleDate] : getDateRange(today);
    const results = await runScraper(dates, env);
    return new Response(JSON.stringify({ dates, results }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async scheduled(event, env) {
    const today = new Date().toISOString().split('T')[0];
    // Cron scrapes only today to stay under the 50-subrequest limit
    const results = await runScraper([today], env);
    console.log('Cron scrape complete:', JSON.stringify(results));
  },
};
