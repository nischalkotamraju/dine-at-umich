/**
 * AI Nutrition + Ingredient Estimation
 *
 * Some dishes are never published with nutrition facts or ingredients by
 * EITHER source: dining.umich.edu (scrape-menus.mjs) omits ingredients for
 * everything and nutrition for many items, and fss.studentlife.umich.edu's
 * NetNutrition (scrape-netnutrition.mjs) doesn't cover every location/date.
 * The result is dishes with a bare or missing `nutrition` row.
 *
 * This pass runs LAST — after both scrapers, so it only ever fills what real
 * data couldn't. For each unique dish name still missing ingredients and/or
 * nutrition across the app's visible date window, it uses a typical-serving
 * estimate, writes it to every same-name instance that's missing it, and sets
 * `nutrition.ai_estimated = true`. The app shows an "AI-estimated" notice for
 * any row with that flag, so estimates are never presented as official data.
 *
 * COST CONTROL — the menu scraper deletes/recreates food_item + nutrition every
 * cycle, so a dish's estimate is wiped each run. To avoid re-calling the model
 * for the same dishes forever, estimates are cached by normalized dish name in
 * `ai_nutrition_estimates`: each unique name is sent to the model exactly once
 * (ever), then reused for free. Only genuinely new dish names hit the API, and
 * those are batched many-per-request. Real data always wins: a field is only
 * filled when currently empty, and a same-name twin with REAL (non-AI) values
 * is preferred over the estimate.
 *
 * Run with: node scripts/enrich-ai.mjs [YYYY-MM-DD]   (default: today-2..+2)
 *
 * Env vars required:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 * Optional:
 *   AI_ENRICH_MODEL   (default: claude-haiku-4-5-20251001)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gtkzwyhqxtubgmlvovmn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.AI_ENRICH_MODEL || 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 20; // dishes per model request
const CONCURRENCY = 3; // parallel model requests

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY env var is required');
  process.exit(1);
}

// Nutrition columns we fill, in DB order. Each maps to the AI numeric field and
// is stored as a plain string (no units — the app appends kcal/g/mg).
const NUM_FIELDS = [
  ['calories', 'calories'],
  ['total_fat', 'total_fat_g'],
  ['saturated_fat', 'saturated_fat_g'],
  ['trans_fat', 'trans_fat_g'],
  ['cholesterol', 'cholesterol_mg'],
  ['sodium', 'sodium_mg'],
  ['total_carbohydrates', 'total_carbohydrates_g'],
  ['dietary_fiber', 'dietary_fiber_g'],
  ['total_sugars', 'total_sugars_g'],
  ['protein', 'protein_g'],
];
const CACHE_COLS = ['ingredients', 'serving_size', ...NUM_FIELDS.map(([c]) => c)];

async function sbFetch(method, path, body, extraHeaders) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? undefined : 'return=representation',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

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

function isEmpty(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// today-2 .. today+2 (the window the app can display), or a single argv date.
function getDates() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const base = new Date(Date.UTC(+m.year, +m.month - 1, +m.day, 12));
  if (process.argv[2]) return [process.argv[2]];
  const out = [];
  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + offset);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

// Every food_item on the given dates, with its dish name, category title (for
// context), and current nutrition values.
async function fetchFoodItems(dates) {
  const select =
    'select=id,name,nutrition_id,' +
    'nutrition!food_item_nutrition_id_fkey(ingredients,serving_size,ai_estimated,' +
    NUM_FIELDS.map(([col]) => col).join(',') +
    '),menu_category!inner(title,menu!inner(date))';
  const pageSize = 1000;
  const all = [];
  for (const date of dates) {
    for (let offset = 0; ; offset += pageSize) {
      const page = await sbFetch(
        'GET',
        `/food_item?${select}&menu_category.menu.date=eq.${date}&limit=${pageSize}&offset=${offset}`,
      );
      const rows = page ?? [];
      all.push(...rows);
      if (rows.length < pageSize) break;
    }
  }
  return all;
}

// Cached estimates for the given normalized names, as normalized_name -> columns.
async function loadCache(normNames) {
  const map = new Map();
  for (const group of chunk(normNames, 100)) {
    const inList = group.map((n) => `"${n.replace(/"/g, '""')}"`).join(',');
    const rows = await sbFetch(
      'GET',
      `/ai_nutrition_estimates?select=${['normalized_name', ...CACHE_COLS].join(',')}&normalized_name=in.(${encodeURIComponent(inList)})`,
    );
    for (const r of rows ?? []) {
      const cols = {};
      for (const c of CACHE_COLS) cols[c] = r[c];
      map.set(r.normalized_name, cols);
    }
  }
  return map;
}

// Persist fresh estimates (upsert on normalized_name).
async function saveCache(entries) {
  if (entries.length === 0) return;
  for (const group of chunk(entries, 100)) {
    await sbFetch('POST', '/ai_nutrition_estimates', group, {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }
}

// Ask Claude for typical-serving estimates for a batch of dishes at once.
// `dishes` is [{ norm, name, category }]. Returns Map norm -> columns.
async function estimateBatch(dishes) {
  const tool = {
    name: 'record_estimates',
    description: 'Record estimated nutrition + ingredients for each dish.',
    input_schema: {
      type: 'object',
      properties: {
        estimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dish: { type: 'string', description: 'The dish name, copied exactly from the input.' },
              ingredients: {
                type: 'string',
                description: 'Comma-separated typical ingredients, most prominent first.',
              },
              serving_size: { type: 'string', description: 'e.g. "1 cup (240g)".' },
              calories: { type: 'integer' },
              total_fat_g: { type: 'number' },
              saturated_fat_g: { type: 'number' },
              trans_fat_g: { type: 'number' },
              cholesterol_mg: { type: 'number' },
              sodium_mg: { type: 'number' },
              total_carbohydrates_g: { type: 'number' },
              dietary_fiber_g: { type: 'number' },
              total_sugars_g: { type: 'number' },
              protein_g: { type: 'number' },
            },
            required: ['dish', 'ingredients', 'serving_size', ...NUM_FIELDS.map(([, ai]) => ai)],
          },
        },
      },
      required: ['estimates'],
    },
  };

  const list = dishes
    .map((d, i) => `${i + 1}. "${d.name}"${d.category ? ` (menu category: ${d.category})` : ''}`)
    .join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system:
        'You estimate nutrition facts and ingredients for University of Michigan dining dishes ' +
        'whose real data was not published. For each dish give a realistic typical single-serving ' +
        'profile for a college dining-hall preparation. These values are clearly labeled as AI ' +
        'estimates in the app, so approximate confidently rather than refusing. Return exactly one ' +
        'estimate per input dish via the record_estimates tool.',
      tools: [tool],
      tool_choice: { type: 'tool', name: 'record_estimates' },
      messages: [{ role: 'user', content: `Estimate these dishes:\n${list}` }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).substring(0, 300)}`);
  const data = await res.json();
  const block = (data.content ?? []).find((b) => b.type === 'tool_use');
  if (!block) throw new Error('no tool_use in response');

  // Map each returned estimate back to a requested dish by normalized name,
  // falling back to positional order for anything that doesn't match.
  const byNorm = new Map(dishes.map((d) => [d.norm, d]));
  const out = new Map();
  const estimates = block.input.estimates ?? [];
  estimates.forEach((est, i) => {
    const target = byNorm.get(normalizeName(est.dish)) ?? dishes[i];
    if (target) out.set(target.norm, estimateToColumns(est));
  });
  return out;
}

// Turn an AI estimate into the nutrition column values (strings, no units).
function estimateToColumns(est) {
  const cols = {
    ingredients: (est.ingredients ?? '').trim(),
    serving_size: (est.serving_size ?? '').trim(),
  };
  for (const [col, aiKey] of NUM_FIELDS) {
    const v = est[aiKey];
    cols[col] = v === null || v === undefined ? null : String(Math.round(Number(v) * 10) / 10);
  }
  return cols;
}

async function run() {
  const dates = getDates();
  console.log(`AI enrichment for dates: ${dates.join(', ')} (model ${MODEL})`);

  const items = await fetchFoodItems(dates);
  console.log(`Fetched ${items.length} food_item rows`);

  // Group instances by normalized dish name.
  const groups = new Map();
  for (const it of items) {
    const key = normalizeName(it.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }

  // A group needs filling when, across all its instances, there's no REAL
  // (non-AI) source for ingredients and/or nutrition, yet some instance is
  // missing it.
  const needy = [];
  for (const [norm, group] of groups) {
    const realIng = group.find((r) => r.nutrition && !r.nutrition.ai_estimated && !isEmpty(r.nutrition.ingredients));
    const realNut = group.find((r) => r.nutrition && !r.nutrition.ai_estimated && !isEmpty(r.nutrition.calories));
    const missingIng = group.some((r) => isEmpty(r.nutrition?.ingredients));
    const missingNut = group.some((r) => isEmpty(r.nutrition?.calories));
    if ((missingIng && !realIng) || (missingNut && !realNut)) {
      const sample = group.find((r) => r.name) ?? group[0];
      needy.push({ norm, group, name: sample.name, category: sample.menu_category?.title, realIng, realNut });
    }
  }
  console.log(`${needy.length} unique dishes need filling`);

  // Reuse cached estimates; only brand-new dish names go to the model.
  const cache = await loadCache(needy.map((n) => n.norm));
  const estimates = new Map(); // norm -> columns
  for (const n of needy) if (cache.has(n.norm)) estimates.set(n.norm, cache.get(n.norm));
  const uncached = needy.filter((n) => !cache.has(n.norm));
  console.log(`${cache.size} from cache, ${uncached.length} to estimate via model`);

  // Batch the uncached dishes and call the model with a small concurrency pool.
  const batches = chunk(uncached, BATCH_SIZE);
  const toCache = [];
  let apiCalls = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      try {
        const result = await estimateBatch(batch);
        apiCalls++;
        for (const d of batch) {
          const cols = result.get(d.norm);
          if (!cols) continue;
          estimates.set(d.norm, cols);
          toCache.push({ normalized_name: d.norm, sample_name: d.name, ...cols });
        }
      } catch (err) {
        console.log(`  batch failed (${batch.length} dishes): ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await saveCache(toCache);

  // Apply estimates (cached + fresh) to every instance missing data.
  let filled = 0;
  for (const n of needy) {
    const est = estimates.get(n.norm);
    if (!est) continue;
    const realIngValue = n.realIng?.nutrition?.ingredients?.trim() || null;
    const realNutRow = n.realNut?.nutrition || null;

    for (const inst of n.group) {
      const nut = inst.nutrition || {};
      const patch = {};
      let usedAi = false;

      if (isEmpty(nut.ingredients)) {
        if (realIngValue) patch.ingredients = realIngValue;
        else if (est.ingredients) {
          patch.ingredients = est.ingredients;
          usedAi = true;
        }
      }
      if (isEmpty(nut.calories)) {
        if (realNutRow) {
          if (isEmpty(nut.serving_size) && !isEmpty(realNutRow.serving_size)) patch.serving_size = realNutRow.serving_size;
          for (const [col] of NUM_FIELDS) if (!isEmpty(realNutRow[col])) patch[col] = realNutRow[col];
        } else {
          if (isEmpty(nut.serving_size) && est.serving_size) patch.serving_size = est.serving_size;
          for (const [col] of NUM_FIELDS) if (!isEmpty(est[col])) patch[col] = est[col];
          usedAi = true;
        }
      }

      if (Object.keys(patch).length === 0) continue;
      if (usedAi) patch.ai_estimated = true;

      try {
        if (inst.nutrition_id) {
          await sbFetch('PATCH', `/nutrition?id=eq.${inst.nutrition_id}`, patch);
        } else {
          const [created] = await sbFetch('POST', '/nutrition', [patch]);
          await sbFetch('PATCH', `/food_item?id=eq.${inst.id}`, { nutrition_id: created.id });
        }
        filled++;
      } catch (err) {
        console.log(`  write failed for "${inst.name}": ${err.message}`);
      }
    }
  }

  console.log(
    `AI enrichment done: ${apiCalls} model calls (${uncached.length} new dishes, ${cache.size} cached), filled ${filled} instances.`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
