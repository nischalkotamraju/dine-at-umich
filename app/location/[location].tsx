import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CalendarX, FilterX, SearchX } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Container } from '~/components/Container';
import type { ListItem } from '~/hooks/useCategoryExpansion';
import { useCategoryExpansion } from '~/hooks/useCategoryExpansion';
import { useDatabase } from '~/hooks/useDatabase';
import { useDebounce } from '~/hooks/useDebounce';
import { useMenuData } from '~/hooks/useMenuData';
import { useScrollToTop } from '~/hooks/useScrollToTop';
import * as schema from '~/services/database/schema';
import { type FiltersState, useFiltersStore } from '~/store/useFiltersStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { filterFoodItems } from '~/utils/filter';
import CategoryHeader from './components/CategoryHeader';
import FoodItemRow from './components/FoodItemRow';
import LocationHeader from './components/LocationHeader';
import ScrollToTopButton from './components/ScrollToTopButton';
import SkeletonItem from './components/SkeletonItem';

/**
 * Filter items based on search query and user-selected filters
 */
const useFilteredItems = (
  flattenedItems: ListItem[],
  debouncedSearchQuery: string,
  filters: FiltersState['filters'],
  favorites: schema.Favorite[],
) => {
  return React.useMemo(() => {
    // First, filter by search query
    let result = flattenedItems;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = [];
      const processedCategoryIds = new Set();
      let currentCategory = null;

      for (const item of flattenedItems) {
        if (item.type === 'category_header') {
          currentCategory = { ...item };
        } else if (item.type === 'food_item') {
          const foodName = item.data.name ? item.data.name.toLowerCase() : '';

          if (foodName.includes(query)) {
            if (currentCategory && !processedCategoryIds.has(currentCategory.id)) {
              // Respect the actual expansion state of categories in search results
              result.push({
                ...currentCategory,
              });
              processedCategoryIds.add(currentCategory.id);
            }
            // Respect the category's expansion state for hiding items
            result.push({
              ...item,
              hidden: currentCategory ? !currentCategory.isExpanded : false,
            });
          }
        }
      }
    }

    // Then, apply additional filters (favorites, allergens, dietary)
    if (
      Object.values(filters).some(
        (val) =>
          val === true ||
          (typeof val === 'object' && val !== null && Object.values(val).some((v) => v)),
      )
    ) {
      const filteredCategories = new Set();
      const filteredResult = [];
      let currentCategory = null;

      for (const item of result) {
        if (item.type === 'category_header') {
          // Don't add category headers yet, we'll add them if they have matching items
          currentCategory = item;
        } else if (item.type === 'food_item') {
          // Apply additional filters to food items
          const foodItem = item.data;

          // Use our utility function to check if this item passes all filters
          if (filterFoodItems([foodItem], filters, favorites).length > 0) {
            // Item passed all filters, so add its category header if not already added
            if (currentCategory && !filteredCategories.has(currentCategory.id)) {
              filteredResult.push(currentCategory);
              filteredCategories.add(currentCategory.id);
            }
            // Then add the item itself
            filteredResult.push(item);
          }
        } else {
          // Pass through any other item types
          filteredResult.push(item);
        }
      }

      return filteredResult;
    }

    return result;
  }, [flattenedItems, debouncedSearchQuery, filters, favorites]);
};

/**
 * Generate skeleton items for loading state
 */
const useSkeletonItems = (): ListItem[] => {
  return React.useMemo(() => {
    const items: ListItem[] = [];
    for (let i = 0; i < 2; i++) {
      items.push({ type: 'skeleton_header', id: `skeleton-header-${i}` } as const);
      const itemCount = Math.floor(Math.random() * 2) + 3;
      for (let j = 0; j < itemCount; j++) {
        items.push({ type: 'skeleton_item', id: `skeleton-item-${i}-${j}` } as const);
      }
    }
    return items;
  }, []);
};

const Location = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  // Core state and data
  const { location } = useLocalSearchParams<{ location: string }>();
  const [selectedDate, setSelectedDate] = useState(getTodayInCentralTime());
  const {
    menuData: data,
    loading,
    error,
    selectedMenu,
    setSelectedMenu,
    filters: menuFilters,
    isSwitchingMenus,
  } = useMenuData(location, selectedDate);
  const { toggleCategory, flattenedItems, resetExpandedCategories } = useCategoryExpansion(data);
  const db = useDatabase();

  const posthog = usePostHog();

  const { data: favorites } = useLiveQuery(db.select().from(schema.favorites));

  // Get active filters from filters store
  const activeFilters = useFiltersStore((state) => state.filters);

  // Sync meal period filter → selected menu
  useEffect(() => {
    if (activeFilters.mealPeriod && menuFilters.length > 0) {
      const match = menuFilters.find((f) =>
        f.title.toLowerCase().includes(activeFilters.mealPeriod!.toLowerCase()),
      );
      if (match) setSelectedMenu(match.id);
    }
  }, [activeFilters.mealPeriod, menuFilters]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Custom hooks for UI elements
  const filteredItems = useFilteredItems(
    flattenedItems,
    debouncedSearchQuery,
    activeFilters,
    favorites,
  );
  const skeletonItems = useSkeletonItems();

  // Scroll to top functionality
  const listRef = useRef<FlashList<ListItem>>(null);
  const { showScrollToTop, scrollButtonAnimation, handleScroll, scrollToTop } =
    useScrollToTop(listRef);

  // Date change handler
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Reset search and expanded categories when menu or date changes
  useEffect(() => {
    try {
      setSearchQuery('');
      if (resetExpandedCategories) {
        resetExpandedCategories();
      }
    } catch (error) {
      console.error('Error resetting menu state:', error);
    }
  }, [resetExpandedCategories]);

  useEffect(() => {
    if (posthog) {
      posthog.screen(location);
    }
  }, [location, posthog]);

  // Memoize the displayed items to prevent unnecessary recalculations
  const displayedItems = useMemo(() => {
    if (loading) return skeletonItems;
    if (error) return []; // Return empty array on error, EmptyState will handle the display
    return debouncedSearchQuery ||
      Object.values(activeFilters).some(
        (val) => val === true || (val !== null && typeof val === 'object' && Object.values(val).some((v) => v)),
      )
      ? filteredItems
      : flattenedItems;
  }, [
    loading,
    error,
    debouncedSearchQuery,
    filteredItems,
    flattenedItems,
    skeletonItems,
    activeFilters,
  ]);

  // In your renderItem function in [location].tsx
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case 'category_header':
          return (
            <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
              <CategoryHeader
                title={item.title}
                isExpanded={item.isExpanded}
                onToggle={async () => {
                  toggleCategory(item.id);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>
          );

        case 'food_item': {
          // Don't render if marked as hidden
          if (item.hidden) {
            return null;
          }

          return (
            <FoodItemRow
              item={item}
              selectedMenu={selectedMenu ?? ''}
              location={location as string}
              date={selectedDate}
              db={db}
              favorites={favorites}
            />
          );
        }

        case 'skeleton_header':
          return <SkeletonItem isHeader />;

        case 'skeleton_item':
          return <SkeletonItem />;

        default:
          return null;
      }
    },
    [selectedMenu, location, selectedDate, toggleCategory, favorites, db],
  );

  // Empty state component
  const EmptyState = useCallback(() => {
    if (loading) return null;

    const hasActiveFilters = Object.values(activeFilters).some(
      (val) => val === true || (val !== null && typeof val === 'object' && Object.values(val).some((v) => v)),
    );

    const accent = getAccent(isDarkMode);
    const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

    let Icon = CalendarX;
    let title = 'NO MENU TODAY';
    let subtitle = 'No menu is available for this date. Try a different day.';

    if (error) {
      Icon = AlertTriangle;
      title = 'ERROR LOADING MENU';
      subtitle = error.message || 'There was an error loading the menu. Please try again.';
    } else if (debouncedSearchQuery) {
      Icon = SearchX;
      title = 'NO RESULTS';
      subtitle = 'Try a different search term.';
    } else if (hasActiveFilters) {
      Icon = FilterX;
      title = 'NO ITEMS FOUND';
      subtitle = 'Try adjusting your filters.';
    } else if (flattenedItems.length > 0) {
      title = 'NO ITEMS FOUND';
    }

    return (
      <View style={{ marginTop: 48, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Icon size={30} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
        </View>
        <Text
          style={{
            fontFamily: 'RobotoMono_700Bold',
            fontSize: 16,
            color: isDarkMode ? '#fff' : '#111',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: subColor, marginTop: 8, textAlign: 'center' }}>
          {subtitle}
        </Text>
      </View>
    );
  }, [loading, error, debouncedSearchQuery, activeFilters, flattenedItems.length, isDarkMode]);

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#171717' : '#fff' }}>
      <Stack.Screen options={{ title: 'Location' }} />
      <Container className="relative mx-0 w-full flex-1">
        <FlashList
          estimatedItemSize={60}
          extraData={[favorites, isDarkMode]}
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
          data={displayedItems}
          removeClippedSubviews
          scrollEnabled={!isSwitchingMenus}
          ListHeaderComponent=<LocationHeader
            location={location}
            selectedMenu={selectedMenu ?? null}
            setSelectedMenu={setSelectedMenu}
            filters={menuFilters}
            query={searchQuery}
            setQuery={(query) => {
              resetExpandedCategories();
              setSearchQuery(query);
            }}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          ListEmptyComponent={<EmptyState />}
          renderItem={renderItem}
          getItemType={(item) => ('type' in item ? item.type : 'unknown')}
          keyboardShouldPersistTaps="always"
        />

        {/* Loading indicator for menu switching */}
        {isSwitchingMenus && (
          <View
            className="absolute inset-0 z-10 flex h-screen items-center justify-center"
            style={{
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <View
              className="flex items-center justify-center rounded-lg p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <ActivityIndicator size="small" style={{ marginBottom: 8 }} />
            </View>
          </View>
        )}

        <ScrollToTopButton
          visible={showScrollToTop}
          animationValue={scrollButtonAnimation}
          onPress={() => {
            scrollToTop();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </Container>
    </View>
  );
};

export default Location;
