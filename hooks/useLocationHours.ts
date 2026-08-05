import { useQuery } from '@tanstack/react-query';
import { getHoursForDates, hoursWindowDates, type DayHours } from '~/utils/hours';
import { useDatabase } from './useDatabase';

// Reads the 5-date window (today-2 .. today+2) of scraped per-date hours for a
// location from the local location_hours table. No fallback to stale weekly
// hours — dates without a scraped row surface as status: 'unknown'.
export function useLocationHours(locationName: string) {
  const db = useDatabase();
  const dates = hoursWindowDates();

  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery<DayHours[]>({
    queryKey: ['locationHours', locationName, dates[0]],
    queryFn: () => getHoursForDates(db, locationName, dates),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!locationName,
  });

  return { days: data, loading, error: error ? 'Failed to fetch hours' : null };
}
