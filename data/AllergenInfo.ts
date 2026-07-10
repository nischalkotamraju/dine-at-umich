import type { ImageSourcePropType } from 'react-native';

const BeefIcon = require('../assets/allergen-icons/Beef.webp');
const EggIcon = require('../assets/allergen-icons/Eggs.webp');
const FishIcon = require('../assets/allergen-icons/Fish.webp');
const HalalIcon = require('../assets/allergen-icons/Halal.webp');
const MilkIcon = require('../assets/allergen-icons/Milk.webp');
const PeanutsIcon = require('../assets/allergen-icons/Peanuts.webp');
const PorkIcon = require('../assets/allergen-icons/Pork.webp');
const SesameSeedsIcon = require('../assets/allergen-icons/Sesame.webp');
const ShellfishIcon = require('../assets/allergen-icons/Shellfish.webp');
const SoyIcon = require('../assets/allergen-icons/Soy.webp');
const TreeNutsIcon = require('../assets/allergen-icons/Tree_Nuts.webp');
const VeganIcon = require('../assets/allergen-icons/Vegan.webp');
const VegetarianIcon = require('../assets/allergen-icons/Veggie.webp');
const WheatIcon = require('../assets/allergen-icons/Wheat.webp');

export type AllergenKey =
  | 'beef'
  | 'egg'
  | 'fish'
  | 'peanuts'
  | 'pork'
  | 'shellfish'
  | 'soy'
  | 'tree_nuts'
  | 'wheat'
  | 'sesame_seeds'
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'milk';

const ALLERGEN_ICONS: Record<AllergenKey, ImageSourcePropType> = {
  beef: BeefIcon,
  egg: EggIcon,
  fish: FishIcon,
  milk: MilkIcon,
  peanuts: PeanutsIcon,
  pork: PorkIcon,
  shellfish: ShellfishIcon,
  soy: SoyIcon,
  tree_nuts: TreeNutsIcon,
  wheat: WheatIcon,
  sesame_seeds: SesameSeedsIcon,
  vegan: VeganIcon,
  vegetarian: VegetarianIcon,
  halal: HalalIcon,
};

// Constants
const NUTRITION_ORDER = [
  'Calories',
  'Total Fat',
  'Saturated Fat',
  'Trans Fat',
  'Cholesterol',
  'Sodium',
  'Total Carbohydrates',
  'Dietary Fiber',
  'Total Sugars',
  'Protein',
  'Vitamin A',
  'Vitamin C',
  'Calcium',
  'Iron',
];

const DAILY_VALUES: Record<string, number> = {
  'Total Fat': 78,
  'Saturated Fat': 20,
  Cholesterol: 300,
  Sodium: 2300,
  'Total Carbohydrates': 275,
  'Dietary Fiber': 28,
  'Total Sugars': 50,
  Protein: 50,
};

const NUTRITION_UNITS: Record<string, string> = {
  'Total Fat': 'g',
  'Saturated Fat': 'g',
  'Trans Fat': 'g',
  Cholesterol: 'mg',
  Sodium: 'mg',
  'Total Carbohydrates': 'g',
  'Dietary Fiber': 'g',
  'Total Sugars': 'g',
  Protein: 'g',
};

// U-M's nutrition labels only ever publish a %DV for these four — there's no
// separate mg/mcg amount column to scrape (see scripts/scrape-menus.mjs).
// The scraped number for these keys IS the %DV already, so it must be
// rendered as-is instead of being treated like an amount and run back
// through DAILY_VALUES to compute a second, bogus percentage.
const PERCENT_ONLY_NUTRITION = new Set(['Vitamin A', 'Vitamin C', 'Calcium', 'Iron']);

// Nutrients where a HIGH %DV is a good thing (you want more of these), so the
// red/yellow/green indicator needs to run in the opposite direction from
// "nutrients to limit" like fat/sodium/sugar — 20%+ protein or iron is
// something to highlight positively (green), not flag as excessive (red).
const BENEFICIAL_NUTRITION = new Set([
  'Dietary Fiber',
  'Protein',
  'Vitamin A',
  'Vitamin C',
  'Calcium',
  'Iron',
]);

const INDENTED_NUTRITION = new Set(['Saturated Fat', 'Trans Fat', 'Dietary Fiber', 'Total Sugars']);
const ALLERGEN_EXCEPTIONS = new Set(['halal', 'vegan', 'vegetarian']);

export {
  ALLERGEN_ICONS,
  NUTRITION_ORDER,
  DAILY_VALUES,
  NUTRITION_UNITS,
  PERCENT_ONLY_NUTRITION,
  BENEFICIAL_NUTRITION,
  INDENTED_NUTRITION,
  ALLERGEN_EXCEPTIONS,
};
