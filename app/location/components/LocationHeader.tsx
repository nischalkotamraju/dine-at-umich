import { and, eq } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TopBar from '~/components/TopBar';
import {
  getPaymentMethodIcon,
  isPaymentMethod,
  PAYMENT_METHOD_COLORS,
  PAYMENT_METHOD_LABELS,
} from '~/data/PaymentInfo';
import { useDatabase } from '~/hooks/useDatabase';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import { location as location_schema, menu } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { useMealTimes } from '~/utils/locations';
import { getAccent } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import { getCurrentOpenSlot, getNextOpeningInfo, isLocationOpen } from '~/utils/time';
import DateNavigator from './DateNavigator';
import SearchBar from './SearchBar';

interface LocationHeaderProps {
  location: string;
  selectedMenu: string | null;
  setSelectedMenu: (menu: string) => void;
  filters: { title: string; id: string }[];
  query: string;
  setQuery: (query: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const LocationHeader = React.memo(
  ({
    location,
    selectedMenu,
    setSelectedMenu,
    filters,
    query,
    setQuery,
    selectedDate,
    onDateChange,
  }: LocationHeaderProps) => {
    const [open, setOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const db = useDatabase();
    const { locationData } = useLocationDetails(location);

    const displayName = location;
    const mealTimes = useMealTimes(location);

    const isDarkMode = useSettingsStore((state) => state.isDarkMode);

    useEffect(() => {
      const checkOpen = async () => {
        const locationDbData = db
          .select()
          .from(location_schema)
          .where(eq(location_schema.name, location))
          .get();

        if (!locationDbData) {
          setOpen(false);
          return;
        }

        // Locations that publish itemized menus (has_menus) are only "open"
        // if today's menu actually exists — mirrors the home list's logic in
        // utils/locationStatus.ts. Grab-and-go spots with has_menus=false
        // (e.g. PharmFresh) skip this check and go by hours alone, so they
        // no longer get stuck permanently "closed" just because they've
        // never had a menu row.
        if (locationDbData.has_menus) {
          const todayMenu = db
            .select()
            .from(menu)
            .where(and(eq(menu.location_id, locationDbData.id), eq(menu.date, getTodayInCentralTime())))
            .get();

          if (!todayMenu) {
            setOpen(false);
            return;
          }
        }

        setOpen(isLocationOpen(locationData));
      };

      checkOpen();
    }, [location, locationData, db.select]);

    const nextOpeningInfo = !open ? getNextOpeningInfo(locationData) : null;

    const paymentMethods = Array.isArray(locationData?.methods_of_payment)
      ? locationData.methods_of_payment
      : [];

    return (
      <View style={{ marginTop: 6, gap: 16 }}>
        {!isSearchFocused && (
          <>
            <View style={{ paddingHorizontal: 20 }}>
              <TopBar variant="location" />
            </View>

            {/* Force close banner */}
            {locationData?.force_close && (
              <View style={{ marginHorizontal: 20, borderRadius: 10, backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 16, color: '#fff', letterSpacing: 1 }}>
                  TEMPORARILY CLOSED
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={{ fontSize: 30, fontWeight: '800', color: isDarkMode ? '#fff' : '#000', letterSpacing: -0.5, paddingHorizontal: 20 }}>
              {displayName}
            </Text>

            {/* Status + Type + Current slot */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, flexWrap: 'wrap', paddingHorizontal: 20 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: open ? '#4ADE80' : '#F87171' }} />
              <Text style={{ fontSize: 13, fontFamily: 'RobotoMono_700Bold', color: open ? '#4ADE80' : '#F87171' }}>
                {open ? 'OPEN' : 'CLOSED'}
              </Text>
              {open && getCurrentOpenSlot(locationData) && (
                <>
                  <Text style={{ color: isDarkMode ? '#4B5563' : '#9CA3AF', fontSize: 13 }}>|</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/location/hours-modal', params: { location } });
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                      {getCurrentOpenSlot(locationData)}
                    </Text>
                    <ChevronRight size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} strokeWidth={2} />
                  </TouchableOpacity>
                </>
              )}
              {!open && nextOpeningInfo && (
                <>
                  <Text style={{ color: isDarkMode ? '#4B5563' : '#9CA3AF', fontSize: 13 }}>|</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/location/hours-modal', params: { location } });
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: isDarkMode ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase' }}>
                      {nextOpeningInfo.label}
                    </Text>
                    <ChevronRight size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} strokeWidth={2} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Address */}
            {locationData?.address && (
              <TouchableOpacity
                onPress={() => {
                  const url =
                    Platform.OS === 'ios' ? locationData.apple_maps_link : locationData.google_maps_link;
                  if (url) Linking.openURL(url);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20 }}
              >
                <MapPin size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>{locationData.address}</Text>
              </TouchableOpacity>
            )}

            {/* Payment methods */}
            {paymentMethods.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, columnGap: 10, paddingHorizontal: 20 }}>
                {paymentMethods.map((method: string) => {
                  if (!isPaymentMethod(method)) return null;
                  return (
                    <View key={method} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <View
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
                      <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Date Navigator */}
            <View style={{ paddingHorizontal: 20 }}>
              <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
            </View>

          </>
        )}

        {/* Search Bar */}
        {filters && filters.length >= 1 && (
          <View style={{ paddingHorizontal: 20 }}>
          <SearchBar
            query={query}
            setQuery={setQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            isSearchFocused={isSearchFocused}
          />
          </View>
        )}

        {/* Meal period pills */}
        {!isSearchFocused && filters && filters.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {filters.map((f) => {
              const isSelected = selectedMenu === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => {
                    setSelectedMenu(f.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: isSelected ? getAccent(isDarkMode) : isDarkMode ? '#242424' : '#F2F2F7',
                    borderWidth: 1,
                    borderColor: isSelected ? 'transparent' : isDarkMode ? '#333' : '#e5e7eb',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'RobotoMono_500Medium',
                    color: isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000',
                  }}>
                    {f.title.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  },
);

export default LocationHeader;
