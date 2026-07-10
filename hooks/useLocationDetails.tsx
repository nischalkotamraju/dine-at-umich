import { useQuery } from '@tanstack/react-query';
import { getLocationDetails } from '~/services/database/database';
import { useDatabase } from './useDatabase';

// Uses react-query (shared cache, keyed by locationName) rather than local
// state so that data already fetched on the location page (e.g. by
// LocationHeader) is available synchronously — with no null -> populated
// flicker — when a different screen (e.g. hours-modal) requests the same
// location. This matters for hours-modal specifically: its formSheet uses
// sheetAllowedDetents: 'fitToContents', which measures content height only
// once, on the very first layout frame — if that first frame renders before
// data arrives, the sheet gets locked at a too-small height forever.
export function useLocationDetails(locationName: string) {
  const db = useDatabase();

  const {
    data: locationData = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['locationDetails', locationName],
    queryFn: () => getLocationDetails(db, locationName),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!locationName,
  });

  return { locationData, loading, error: error ? 'Failed to fetch location details' : null };
}
