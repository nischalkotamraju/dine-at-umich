import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getLocationMenuData,
  getLocationMenuNames,
  type Location,
} from '~/services/database/database';
import { getCentralTimeDate, getTodayInCentralTime } from '~/utils/date';
import { useDatabase } from './useDatabase';

// Picks the meal to open on by default. For today, chooses the meal that fits
// the current time of day (e.g. dinner at 6pm, not breakfast) so navigating to
// a dining hall lands on what's actually being served; for other dates, or
// single-menu cafés, it just uses the first menu. Purely time-bucketed so it
// never depends on the (incomplete) per-location meal_times data.
function pickDefaultMenu(menuNames: (string | null)[], targetDate: string): string | undefined {
  const names = menuNames.filter(Boolean) as string[];
  if (names.length <= 1) return names[0];
  if (targetDate !== getTodayInCentralTime()) return names[0];

  const now = getCentralTimeDate();
  const mins = now.getHours() * 60 + now.getMinutes();
  const find = (meal: string) => names.find((n) => n.toLowerCase() === meal);
  const last = names[names.length - 1];

  if (mins >= 16 * 60) return find('dinner') ?? last; // late afternoon / evening
  if (mins >= 11 * 60) return find('lunch') ?? find('brunch') ?? find('dinner') ?? names[0]; // midday
  if (mins >= 10 * 60) return find('brunch') ?? find('breakfast') ?? names[0]; // late morning (weekend brunch)
  return find('breakfast') ?? find('brunch') ?? names[0]; // morning
}

export function useMenuData(location: string, date?: string) {
  const db = useDatabase();
  const queryClient = useQueryClient();
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [isMenuSwitching, setIsMenuSwitching] = useState(false);
  const prevSelectedMenuRef = useRef<string | null>(null);

  // Use provided date or default to today
  const targetDate = date || getTodayInCentralTime();

  // Query for menu names
  const {
    data: menuNames = [],
    isLoading: isLoadingMenuNames,
    error: menuNamesError,
  } = useQuery({
    queryKey: ['menuNames', location, targetDate],
    queryFn: () => getLocationMenuNames(db, location, targetDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!location,
  });

  // Auto-select the meal that fits the current time of day if none selected.
  const defaultMenu = selectedMenu || pickDefaultMenu(menuNames, targetDate);

  // Prefetch all menu data for instant switching
  useEffect(() => {
    if (menuNames.length > 0 && queryClient) {
      menuNames.forEach((menuName) => {
        if (menuName) {
          queryClient.prefetchQuery({
            queryKey: ['menuData', location, menuName, targetDate],
            queryFn: () => getLocationMenuData(db, location, menuName, targetDate),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        }
      });
    }
  }, [menuNames, location, db, queryClient, targetDate]);

  // Query for current menu data (should be instant due to prefetching)
  const {
    data: menuData = null,
    isLoading: isLoadingMenuData,
    error: menuDataError,
  } = useQuery({
    queryKey: ['menuData', location, defaultMenu, targetDate],
    queryFn: () => getLocationMenuData(db, location, defaultMenu as string, targetDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!location && !!defaultMenu,
  });

  // Reset selected menu when date changes
  useEffect(() => {
    setSelectedMenu(null);
  }, [targetDate]);

  // Track menu switching state
  useEffect(() => {
    if (defaultMenu && prevSelectedMenuRef.current !== defaultMenu) {
      if (prevSelectedMenuRef.current !== null) {
        setIsMenuSwitching(true);
      }
      prevSelectedMenuRef.current = defaultMenu;
    }
  }, [defaultMenu]);

  // Reset switching state when data is loaded
  useEffect(() => {
    if (!isLoadingMenuData && isMenuSwitching) {
      const timer = setTimeout(() => {
        setIsMenuSwitching(false);
      }, 200); // Small delay to ensure smooth transition
      return () => clearTimeout(timer);
    }
  }, [isLoadingMenuData, isMenuSwitching]);

  // Transform menu names to filters format
  const filters = useMemo(
    () =>
      menuNames.map((menuName) => ({
        title: menuName || '',
        id: menuName || '',
      })),
    [menuNames],
  );

  const loading = isLoadingMenuNames || isLoadingMenuData;
  const error = menuNamesError || menuDataError;

  return {
    menuData: menuData as Location | null,
    loading,
    error,
    selectedMenu: defaultMenu ?? filters[0]?.id,
    setSelectedMenu,
    filters,
    isSwitchingMenus: isMenuSwitching,
  };
}
