import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import {
  buildAvailabilityTimeline,
  formatHHMM,
  getDishesServingLocations,
} from '~/utils/foodAvailability';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { BookmarkX, ChevronRight, Clock, Heart } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocationIcon } from '~/app/_components/LocationItem';
import { getCategoryIcon } from '~/components/FoodComponent';
import { getPaymentMethodIcon, isPaymentMethod, PAYMENT_METHOD_COLORS } from '~/data/PaymentInfo';
import { useDatabase } from '~/hooks/useDatabase';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import { toggleFavorites, toggleLocationFavorite } from '~/services/database/database';
import * as schema from '~/services/database/schema';
import type { LocationWithType } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { fetchMenuData } from '~/utils/queries';
import { getLocationTimeMessage, getNextOpeningInfo } from '~/utils/time';

type LocationFavoriteCardProps = {
  item: LocationWithType;
  currentTime: Date;
  db: ExpoSQLiteDatabase<typeof schema>;
};

// Mirrors app/_components/LocationItem.tsx's visual style (icon/status
// coloring, live open/closed time text, payment method badges) so favorited
// locations look identical to their home-page cards, with a heart added to
// unfavorite instead of the chevron affordance.
const LocationFavoriteCard = ({ item, currentTime, db }: LocationFavoriteCardProps) => {
  const [status, setStatus] = useState<'open' | 'opening_soon' | 'closed'>('closed');
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const { locationData } = useLocationDetails(item.name ?? '');
  const displayName = item.name ?? '';

  useEffect(() => {
    const todayDate = getTodayInCentralTime();
    const s = getDetailedLocationStatus(item, locationData, db, currentTime, todayDate);
    setStatus(s);
  }, [locationData, currentTime, db, item]);

  const isOpen = status === 'open';
  const nameColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  const getTimeText = () => {
    if (locationData?.force_close) return 'Closed';
    if (isOpen) {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    const nextOpening = getNextOpeningInfo(locationData, currentTime);
    return nextOpening ? nextOpening.label : 'Closed';
  };

  const paymentMethods = (
    Array.isArray(item.methods_of_payment) ? item.methods_of_payment : []
  ).filter(isPaymentMethod);

  return (
    <Pressable
      onPress={() => router.push(`/location/${item.name}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
        backgroundColor: isDarkMode ? '#262626' : '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDarkMode ? '#333' : '#e5e7eb',
        paddingHorizontal: 14,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: isOpen ? '#22C55E' : '#F87171',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {getLocationIcon(item.type, '#111')}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'RobotoMono_500Medium', color: nameColor, letterSpacing: -0.3 }} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {isOpen && <Clock size={11} color="#22C55E" strokeWidth={2} />}
          <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: subColor, letterSpacing: 0.3 }}>
            {getTimeText().toUpperCase()}
          </Text>
        </View>
      </View>
      {paymentMethods.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 4, flexShrink: 0 }}>
          {paymentMethods.map((method) => (
            <View
              key={method}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: PAYMENT_METHOD_COLORS[method],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getPaymentMethodIcon(method, '#111', 11)}
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        onPress={async () => {
          await toggleLocationFavorite(db, item.name as string);
        }}
        hitSlop={10}
        style={{ padding: 4, flexShrink: 0 }}
      >
        <Heart size={18} color={getAccent(isDarkMode)} fill={getAccent(isDarkMode)} />
      </TouchableOpacity>
    </Pressable>
  );
};

type Tab = 'foods' | 'halls';

const SavedTab = () => {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const db = useDatabase();
  const [refreshKey, setRefreshKey] = useState(0);
  // Belt-and-suspenders: force a fresh read whenever this tab regains focus,
  // so a favorite toggled elsewhere always shows up here without needing a
  // full app reload.
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []),
  );
  const { data: favorites } = useLiveQuery(db.select().from(schema.favorites), [refreshKey]);
  const { data: locationFavorites } = useLiveQuery(
    db.select().from(schema.location_favorites),
    [refreshKey],
  );
  const [activeTab, setActiveTab] = useState<Tab>('foods');
  const insets = useSafeAreaInsets();

  // Drives LocationFavoriteCard's live open/closed status text, matching the
  // same 1-minute refresh the home page's location cards use.
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Reuses the same cached query the Home tab populates, so this doesn't
  // trigger its own Supabase fetch — just reads whatever's already loaded.
  const { data: menuData } = useQuery({
    queryKey: ['menuData'],
    queryFn: () => fetchMenuData(db),
    staleTime: 3 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const sortedFavorites = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
      ),
    [favorites],
  );

  // The whole point of favoriting a dish is finding out where it's being
  // served *today* without having to remember which location you favorited
  // it from, so look up every location currently serving each favorited
  // food's name instead of showing the single origin location.
  const foodNames = useMemo(() => sortedFavorites.map((f) => f.name), [sortedFavorites]);

  const { data: foodLocations } = useQuery({
    queryKey: ['savedFoodLocations', foodNames, refreshKey],
    queryFn: () => getDishesServingLocations(db, foodNames),
    enabled: foodNames.length > 0,
  });

  const sortedLocationFavorites = useMemo(() => {
    const locations = menuData?.locations ?? [];
    const byName = new Map(locations.map((l) => [l.name, l]));

    return [...locationFavorites]
      .sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
      .map((fav) => byName.get(fav.location_name))
      .filter((l): l is LocationWithType => l !== undefined);
  }, [locationFavorites, menuData]);

  const bg = isDarkMode ? '#171717' : '#fff';
  // Matches FoodComponent's card background so favorited foods look
  // identical to the same food's card on its location page.
  const foodCardBg = isDarkMode ? '#242424' : '#F8F9FA';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const tabActiveBg = isDarkMode ? '#333' : '#00274C';
  const tabInactiveBg = isDarkMode ? '#262626' : '#F0F0F0';

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <FlashList
        estimatedItemSize={72}
        extraData={[isDarkMode, currentTime, foodLocations]}
        data={activeTab === 'foods' ? sortedFavorites : sortedLocationFavorites}
        keyExtractor={(item) =>
          'menu_name' in item ? `${item.name}-${item.location_name}` : item.id
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginBottom: 16 }}>
              Saved
            </Text>

            {/* Tab toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: tabInactiveBg,
                borderRadius: 10,
                padding: 3,
                marginBottom: 16,
              }}
            >
              {(['foods', 'halls'] as Tab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: activeTab === t ? tabActiveBg : 'transparent',
                  }}
                  onPress={() => setActiveTab(t)}
                >
                  <Text
                    style={{
                      fontFamily: 'RobotoMono_500Medium',
                      fontSize: 14,
                      color: activeTab === t ? '#fff' : subColor,
                    }}
                  >
                    {t === 'foods' ? 'FOODS' : 'LOCATIONS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'foods' && sortedFavorites.length > 0 && (
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: subColor, marginBottom: 10, letterSpacing: 1 }}>
                FAVORITE FOODS
              </Text>
            )}
            {activeTab === 'halls' && sortedLocationFavorites.length > 0 && (
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: subColor, marginBottom: 10, letterSpacing: 1 }}>
                FAVORITE LOCATIONS
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) =>
          'menu_name' in item ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/food/[food]',
                  params: {
                    food: item.name,
                    menu: item.menu_name,
                    category: item.category_name,
                    location: item.location_name,
                    favorite: 'true',
                  },
                })
              }
              style={{
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                marginBottom: 8,
                backgroundColor: foodCardBg,
              }}
            >
              {/* Header row: icon, name, favorite/chevron */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: getAccentTint(isDarkMode),
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(item.category_name ?? '', isDarkMode)}
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontFamily: 'RobotoMono_500Medium', color: textColor, letterSpacing: -0.3 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await toggleFavorites(
                      db,
                      { name: item.name, nutrition: undefined, allergens: undefined, link: '' },
                      item.location_name,
                      item.menu_name,
                      item.category_name,
                    );
                  }}
                  hitSlop={10}
                  style={{ padding: 4, flexShrink: 0 }}
                >
                  <Heart size={19} color={getAccent(isDarkMode)} fill={getAccent(isDarkMode)} strokeWidth={1.8} />
                </TouchableOpacity>
                <ChevronRight size={16} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
              </View>

              {/* Where to find it today — open windows and the locations
                  serving the dish during each; the current window is green. */}
              {(() => {
                const timeline = buildAvailabilityTimeline(foodLocations?.[item.name] ?? []);
                if (timeline.length === 0) {
                  return (
                    <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: subColor, marginTop: 8, marginLeft: 56 }}>
                      Not on any menu today
                    </Text>
                  );
                }
                return (
                  <View style={{ marginTop: 10, marginLeft: 56, gap: 7 }}>
                    {timeline.map((slot) => (
                      <View key={`${slot.open}-${slot.close}`} style={{ gap: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_700Bold', color: slot.isNow ? '#22C55E' : textColor, letterSpacing: 0.2 }}>
                            {`${formatHHMM(slot.open)} – ${formatHHMM(slot.close)}`}
                          </Text>
                          {slot.isNow && (
                            <Text style={{ fontSize: 9, fontFamily: 'RobotoMono_700Bold', color: '#22C55E', letterSpacing: 0.5 }}>
                              NOW
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: subColor }}>
                          {slot.locationNames.join(', ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </Pressable>
          ) : (
            <LocationFavoriteCard item={item} currentTime={currentTime} db={db} />
          )
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            {activeTab === 'foods' ? (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    backgroundColor: getAccent(isDarkMode),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <BookmarkX size={30} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontFamily: 'RobotoMono_700Bold',
                    fontSize: 16,
                    color: textColor,
                    letterSpacing: 1,
                    textAlign: 'center',
                  }}
                >
                  NO SAVED FOODS YET
                </Text>
                <Text style={{ color: subColor, marginTop: 8, textAlign: 'center', maxWidth: 240 }}>
                  Swipe left on a food item and tap the heart to save it.
                </Text>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    backgroundColor: getAccent(isDarkMode),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <BookmarkX size={30} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontFamily: 'RobotoMono_700Bold',
                    fontSize: 16,
                    color: textColor,
                    letterSpacing: 1,
                    textAlign: 'center',
                  }}
                >
                  NO SAVED LOCATIONS YET
                </Text>
                <Text style={{ color: subColor, marginTop: 8, textAlign: 'center', maxWidth: 240 }}>
                  Tap the heart on a location's page to save it for quick access.
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
};

export default SavedTab;
