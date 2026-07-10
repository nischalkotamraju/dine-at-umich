import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import * as Network from 'expo-network';
import { ChevronRight, WifiOff } from 'lucide-react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Container } from '~/components/Container';
import OnboardingScreen from '~/components/onboarding/OnboardingScreen';
import type { PaymentMethod } from '~/data/PaymentInfo';
import { useOnboardingStore } from '~/store/useOnboardingStore';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { usePaymentFilterStore } from '~/store/usePaymentFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS, getAccent } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { fetchMenuData } from '~/utils/queries';
import * as schema from '../../services/database/schema';
import HomeHeader from '../_components/HomeHeader';
import LocationItem from '../_components/LocationItem';

// Constants
const SPLASH_SCREEN_DURATION = 1000;

// Configure splash screen
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: SPLASH_SCREEN_DURATION,
  fade: true,
});

// Types
export type FilterType = 'all' | string;

type SectionedLocations = {
  open: schema.LocationWithType[];
  openingSoon: schema.LocationWithType[];
  closed: schema.LocationWithType[];
};

const sectionAndFilterLocations = (
  locations: schema.LocationWithType[],
  locationTypes: schema.LocationType[],
  filters: string[],
  paymentMethods: PaymentMethod[],
  db: DrizzleDB,
  currentTime: Date,
): SectionedLocations => {
  let filtered = locations;
  if (filters.length > 0) {
    const targetTypeIds = locationTypes.filter((t) => filters.includes(t.name)).map((t) => t.id);
    filtered = locations.filter((l) => targetTypeIds.includes(l.type_id));
  }
  if (paymentMethods.length > 0) {
    filtered = filtered.filter((l) => {
      const accepted = Array.isArray(l.methods_of_payment) ? l.methods_of_payment : [];
      return paymentMethods.some((m) => accepted.includes(m));
    });
  }
  filtered = [...filtered].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  const todayDate = getTodayInCentralTime();
  const open: schema.LocationWithType[] = [];
  const openingSoon: schema.LocationWithType[] = [];
  const closed: schema.LocationWithType[] = [];

  for (const location of filtered) {
    const locationData = db
      .select()
      .from(schema.location)
      .where(eq(schema.location.id, location.id))
      .get();

    const status = getDetailedLocationStatus(
      location,
      locationData ?? null,
      db,
      currentTime,
      todayDate,
    );

    if (status === 'open') open.push(location);
    else closed.push(location);
  }

  return { open, openingSoon, closed };
};

export type DrizzleDB = ExpoSQLiteDatabase<typeof schema> & {
  $client: SQLiteDatabase;
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { selectedFilters } = useHomeFilterStore();
  const { selectedMethods } = usePaymentFilterStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);

  const { previewError } = useLocalSearchParams<{ previewError?: string }>();
  const db = useSQLiteContext();
  const drizzleDb: DrizzleDB = drizzle(db, { schema });
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const queryClient = useQueryClient();

  useDrizzleStudio(db);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Use TanStack Query for menu/location data
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['menuData'],
    queryFn: () => fetchMenuData(drizzleDb),
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    refetchInterval: 30 * 60 * 1000, // 15 minutes polling while in app
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // One quiet retry before giving up: fetchMenuData already retries its own
    // transient SQLite read failures internally, but this is a second safety
    // net so a genuine failure keeps showing the loading spinner for a beat
    // instead of immediately flipping to the full error screen.
    retry: 1,
    retryDelay: 800,
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Check if user is online before attempting to refetch
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        return;
      }

      // Add timeout to refetch operation (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      // Force sync with Supabase and then refetch the query
      await Promise.race([
        fetchMenuData(drizzleDb, true).then(() =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ['menuData'] }),
            queryClient.invalidateQueries({ queryKey: ['menuNames'] }),
          ]),
        ),
        timeoutPromise,
      ]);

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle splash screen
  const onLayoutRootView = () => {
    setLayoutLoaded(true);
  };

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (layoutLoaded && !isLoading && !isFetching) {
      console.log('✅ Splash screen hidden');
    }
  }, [layoutLoaded, isLoading, isFetching]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#171717' : '#fff',
        }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (isError || previewError === '1') {
    const accent = getAccent(isDarkMode);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#171717' : '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <WifiOff size={34} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
        </View>

        <Text
          style={{
            fontFamily: 'RobotoMono_700Bold',
            fontSize: 20,
            color: isDarkMode ? '#fff' : '#111',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          FAILED TO LOAD
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            marginTop: 10,
            textAlign: 'center',
            maxWidth: 260,
          }}
        >
          If you just updated the app, close and reopen it.
        </Text>

        <TouchableOpacity
          onPress={handleRefresh}
          activeOpacity={0.8}
          style={{
            marginTop: 32,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: accent,
          }}
        >
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 13,
              color: isDarkMode ? '#000' : '#fff',
              letterSpacing: 1,
            }}
          >
            RELOAD
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const locations = data?.locations || [];
  const locationTypes = data?.locationTypes || [];

  const { open, openingSoon, closed } = sectionAndFilterLocations(
    locations,
    locationTypes,
    selectedFilters,
    selectedMethods,
    drizzleDb,
    currentTime,
  );

  // Build a flat list with section headers
  type ListRow =
    | { type: 'header'; label: string; color: string; count: number }
    | { type: 'location'; item: schema.LocationWithType };

  const listData: ListRow[] = [];
  if (open.length > 0) {
    listData.push({ type: 'header', label: 'OPEN NOW', color: '#4ADE80', count: open.length });
    for (const item of open) listData.push({ type: 'location', item });
  }
  if (closed.length > 0) {
    listData.push({ type: 'header', label: 'CLOSED', color: '#F87171', count: closed.length });
    for (const item of closed) listData.push({ type: 'location', item });
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#171717' : '#fff' }}>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container disableBottomPadding onLayout={onLayoutRootView}>
        <OnboardingScreen isOnboardingComplete={isOnboardingComplete} />

        <FlatList
            extraData={[currentTime, selectedFilters, selectedMethods, refreshKey, isDarkMode]}
            data={listData}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDarkMode ? COLORS['um-grey-dark-mode'] : '#8E8E93'}
              />
            }
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_700Bold', color: item.color, letterSpacing: 0.5 }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: item.color, opacity: 0.7 }}>
                      {item.count} {item.label === 'OPEN NOW' ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                );
              }
              return (
                <LocationItem
                  key={`${item.item.id}-${refreshKey}`}
                  location={item.item}
                  currentTime={currentTime}
                />
              );
            }}
            keyExtractor={(item, index) =>
              item.type === 'header' ? `header-${item.label}` : `loc-${item.item.id}-${index}`
            }
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <HomeHeader
                currentTime={currentTime}
                locationTypes={locationTypes}
              />
            }
          />
      </Container>
    </View>
  );
}
