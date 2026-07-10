// https://rnas.vercel.app/

import { registerSheet, type SheetDefinition } from 'react-native-actions-sheet';
import type { Location } from '~/services/database/schema';
import FiltersSheet from './FiltersSheet';
import FoodInfoSheet from './FoodInfoSheet';
import LocationAboutSheet from './LocationAboutSheet';
import LocationTypeFilterSheet from './LocationTypeFilterSheet';

registerSheet('location-about', LocationAboutSheet);
registerSheet('food-info', FoodInfoSheet, 'food');
registerSheet('filters', FiltersSheet);
registerSheet('filters', FiltersSheet, 'settings');
registerSheet('location-type-filter', LocationTypeFilterSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'location-about': SheetDefinition<{
      payload: {
        location: Location;
      };
    }>;
    'food-info': SheetDefinition;
    filters: SheetDefinition;
    settings: SheetDefinition;
    'location-type-filter': SheetDefinition<{
      payload: {
        selectedFilter: string;
        locationTypes: { id: string; name: string }[];
        onSelect: (filter: string) => void;
      };
    }>;
  }
}
