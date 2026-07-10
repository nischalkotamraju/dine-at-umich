import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CalendarX, Clock, X } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';
import { generateSchedule } from '~/utils/time';

export default function HoursModal() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const { locationData, loading, error } = useLocationDetails(location);
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const schedule = generateSchedule(locationData, true);

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const textColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const PADDING = 20;
  const SHEET_RADIUS = 38;
  const CARD_RADIUS = 14;

  // Sheet is sized to fit its content (sheetAllowedDetents: 'fitToContents'
  // in app/_layout.tsx), which measures this view's natural laid-out height.
  // A ScrollView does NOT report a content-based height to that measurement
  // — it just stretches to fill whatever space its parent gets, which is why
  // the sheet always looked like a fixed size regardless of row count.
  // generateSchedule collapses consecutive matching days, so there are at
  // most 7 rows here — a plain View sizes correctly with no scrolling needed.
  return (
    <View style={{ backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: getAccentTint(isDarkMode), alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color={getAccent(isDarkMode)} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: isDarkMode ? '#fff' : '#000' }}>
              Hours
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_500Medium', color: getAccent(isDarkMode), marginTop: 1 }}>
              {location?.toString().replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color={isDarkMode ? '#fff' : '#000'} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: PADDING, paddingBottom: SHEET_RADIUS, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={getAccent(isDarkMode)} />
        </View>
      ) : error || schedule.length === 0 ? (
        <View style={{ paddingHorizontal: PADDING, paddingBottom: SHEET_RADIUS, alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: getAccent(isDarkMode),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            {error ? (
              <AlertTriangle size={22} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
            ) : (
              <CalendarX size={22} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
            )}
          </View>
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 13,
              color: isDarkMode ? '#fff' : '#000',
              letterSpacing: 0.5,
              textAlign: 'center',
            }}
          >
            {error ? 'UNABLE TO LOAD HOURS' : 'NO HOURS AVAILABLE'}
          </Text>
        </View>
      ) : (
      <View style={{ paddingHorizontal: PADDING, gap: 8 }}>
        {schedule.map((item, index) => {
          const slots = item.time.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean);
          const isLast = index === schedule.length - 1;
          return (
            <View key={item.dayRange} style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              borderBottomLeftRadius: isLast ? SHEET_RADIUS : CARD_RADIUS,
              borderBottomRightRadius: isLast ? SHEET_RADIUS : CARD_RADIUS,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getAccent(isDarkMode), marginTop: 4 }} />
              <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#fff' : '#000', width: 48 }}>
                {item.dayRange}
              </Text>
              <View style={{ flex: 1, gap: 4 }}>
                {slots.map((slot: string, i: number) => (
                  <Text key={i} style={{ fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: textColor }}>
                    {slot}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      )}
    </View>
  );
}
