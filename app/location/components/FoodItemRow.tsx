import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import FoodComponent from '~/components/FoodComponent';
import { type FoodItem, toggleFavorites } from '~/services/database/database';
import type * as schema from '~/services/database/schema';

// Define interfaces for the props
interface FoodItemProps {
  data: FoodItem;
  categoryId: string;
  id: string;
  hidden?: boolean;
}

interface FoodItemRowProps {
  item: FoodItemProps;
  selectedMenu: string;
  location: string;
  date: string;
  db: ExpoSQLiteDatabase<typeof schema>;
  favorites: schema.Favorite[];
}

const FoodItemRow = ({ item, selectedMenu, location, date, db, favorites }: FoodItemRowProps) => {
  const foodName = item.data.name;
  // Use state for favorite status
  const [isFavorite, setIsFavorite] = useState(favorites.some((f) => f.name === foodName));

  // Update local state when favorites change
  useEffect(() => {
    setIsFavorite(favorites.some((f) => f.name === foodName));
  }, [favorites, foodName]);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <FoodComponent
        food={item.data}
        selectedMenu={selectedMenu}
        categoryName={item.categoryId}
        location={location}
        date={date}
        onFavorite={async (food) => {
          // Update local state immediately for a responsive UI
          setIsFavorite(!isFavorite);

          // Toggle in database
          await toggleFavorites(db, food, location, selectedMenu, item.categoryId);
        }}
        isFavorite={isFavorite}
      />
    </View>
  );
};

export default memo(FoodItemRow);
