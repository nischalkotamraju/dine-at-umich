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
 * nutrition across the app's visible date window, it asks Claude for a single
 * typical-serving estimate, then writes it to every same-name instance that's
 * missing it and sets `nutrition.ai_estimated = true`. The app shows an
 * "AI-estimated" notice for any row with that flag, so estimates are never
 * presented as official data.
 *
 * Real data always wins: a field is only filled when it's currently empty, and
 * a same-name twin that has REAL (non-AI) values is preferred over the AI
 * estimate before falling back to it.
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
const CONCURRENCY = 4;

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var is required');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY env var is required');
  process.exit(1);
}

// Nutrition columns we fill, in DB order. Each AI numeric field maps to the
// stored string (no units — the app appends kcal/g/mg).
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

// Ask Claude for a single typical-serving estimate for a dish.
async function estimateDish(name, categoryTitle) {
  const tool = {
    name: 'record_estimate',
    description: 'Record the estimated nutrition and ingredients for one dish.',
    input_schema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'string',
          description:
            'Comma-separated list of the typical ingredients for this dish, most prominent first. Best effort; may be generic.',
        },
        serving_size: { type: 'string', description: 'Typical single serving, e.g. "1 cup (240g)".' },
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
      required: [
        'ingredients',
        'serving_size',
        ...NUM_FIELDS.map(([, ai]) => ai),
      ],
    },
  };

  const context = categoryTitle ? ` (menu category: "${categoryTitle}")` : '';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system:
        'You estimate nutrition facts and ingredients for University of Michigan dining dishes ' +
        'whose real data was not published. Give a realistic typical single-serving profile for a ' +
        'college dining-hall preparation. These values are clearly labeled as AI estimates in the ' +
        'app, so approximate confidently rather than refusing. Always call the record_estimate tool.',
      tools: [tool],
      tool_choice: { type: 'tool', name: 'record_estimate' },
      messages: [{ role: 'user', content: `Dish: "${name}"${context}` }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).substring(0, 300)}`);
  }
  const data = await res.json();
  const block = (data.content ?? []).find((b) => b.type === 'tool_use');
  if (!block) throw new Error('no tool_use in response');
  return block.input;
}

// Turn an AI estimate into the nutrition column values (strings, no units).
function estimateToColumns(est) {
  const cols = { ingredients: (est.ingredients ?? '').trim(), serving_size: (est.serving_size ?? '').trim() };
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

  // A group needs AI when, across all its instances, there's no REAL (non-AI)
  // source for ingredients and/or nutrition, yet some instance is missing it.
  const needy = [];
  for (const group of groups.values()) {
    const realIng = group.find((r) => r.nutrition && !r.nutrition.ai_estimated && !isEmpty(r.nutrition.ingredients));
    const realNut = group.find((r) => r.nutrition && !r.nutrition.ai_estimated && !isEmpty(r.nutrition.calories));
    const missingIng = group.some((r) => isEmpty(r.nutrition?.ingredients));
    const missingNut = group.some((r) => isEmpty(r.nutrition?.calories));
    if ((missingIng && !realIng) || (missingNut && !realNut)) {
      const sample = group.find((r) => r.name) ?? group[0];
      needy.push({ group, name: sample.name, category: sample.menu_category?.title, realIng, realNut });
    }
  }
  console.log(`${needy.length} unique dishes need AI estimation`);

  let estimated = 0;
  let filled = 0;
  let failed = 0;

  // Small concurrency pool over the needy dishes.
  let cursor = 0;
  async function worker() {
    while (cursor < needy.length) {
      const job = needy[cursor++];
      const { group, name, category, realIng, realNut } = job;
      let est;
      try {
        est = estimateToColumns(await estimateDish(name, category));
        estimated++;
      } catch (err) {
        failed++;
        console.log(`  estimate failed for "${name}": ${err.message}`);
        continue;
      }

      const realIngValue = realIng?.nutrition?.ingredients?.trim() || null;
      const realNutRow = realNut?.nutrition || null;

      for (const inst of group) {
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
            // Propagate real twin's numbers (+ serving size) — not AI.
            if (isEmpty(nut.serving_size) && !isEmpty(realNutRow.serving_size)) patch.serving_size = realNutRow.serving_size;
            for (const [col] of NUM_FIELDS) {
              if (!isEmpty(realNutRow[col])) patch[col] = realNutRow[col];
            }
          } else {
            if (isEmpty(nut.serving_size) && est.serving_size) patch.serving_size = est.serving_size;
            for (const [col] of NUM_FIELDS) {
              if (est[col] !== null) patch[col] = est[col];
            }
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
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(
    `AI enrichment done: estimated ${estimated} dishes, filled ${filled} instances, ${failed} failed.`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
