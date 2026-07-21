import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { AlertTriangle, CalendarX, Clock, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';
import { generateSchedule } from '~/utils/time';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Fixed pixel heights used to compute the sheet height directly from the
// schedule data — deterministic, so it never depends on iOS's flaky
// `fitToContents` measurement (which rounds up and stretches the measured
// view, leaving a per-row-count gap). Tune these if a row-count clips or gaps.
const HEADER_H = 78; // paddingTop 24 + header row (~38) + paddingBottom 16
const CARD_V_PADDING = 28; // paddingVertical 14 top + bottom
const TEXT_LINE_H = 16; // one line of 12px RobotoMono day/time text
const SLOT_GAP = 4; // gap between stacked time slots in a row
const CARD_GAP = 8; // gap between day cards
const NON_SCHEDULE_DETENT = 0.28; // loading / error / no-hours states

export default function HoursModal() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const { locationData, loading, error } = useLocationDetails(location);
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const schedule = generateSchedule(locationData, true);
  const navigation = useNavigation();

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const textColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const PADDING = 20;
  // Last card's bottom corners use this larger radius so they blend into the
  // sheet's own rounded bottom — but only if the card actually reaches the
  // sheet bottom, so the body has no bottom padding.
  const SHEET_RADIUS = 38;
  const CARD_RADIUS = 14;
  // Breathing room below the last card. A lone row looks cramped with the
  // tighter multi-row value, so give single-row schedules a bit more.
  const bodyBottomPad = schedule.length <= 1 ? 30 : schedule.length >= 4 ? 28 : 8;

  // Compute the exact sheet height from the schedule data and pin the detent
  // to it. No view measurement, so every row-count gets exactly bodyBottomPad
  // of room below the last card — consistent across 1–4 rows.
  useEffect(() => {
    let detent = NON_SCHEDULE_DETENT;
    if (!loading && !error && schedule.length > 0) {
      let rows = 0;
      for (const item of schedule) {
        const lines = Math.max(
          item.time.split(/,|\n/).map((s) => s.trim()).filter(Boolean).length,
          1,
        );
        rows += CARD_V_PADDING + lines * TEXT_LINE_H + (lines - 1) * SLOT_GAP;
      }
      const total =
        HEADER_H + rows + (schedule.length - 1) * CARD_GAP + bodyBottomPad;
      detent = Math.min(total / SCREEN_HEIGHT, 0.95);
    }
    navigation.setOptions({ sheetAllowedDetents: [detent] });
  }, [loading, error, schedule, bodyBottomPad, navigation]);

  return (
    <View style={{ backgroundColor: bg }}>
     <View>
      {/* Header */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <View style={{ paddingHorizontal: PADDING, paddingBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={getAccent(isDarkMode)} />
        </View>
      ) : error || schedule.length === 0 ? (
        <View style={{ paddingHorizontal: PADDING, paddingBottom: 24, alignItems: 'center' }}>
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
      <View style={{ paddingHorizontal: PADDING, paddingBottom: bodyBottomPad, gap: 8 }}>
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
              <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#fff' : '#000', width: 62 }}>
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
    </View>
  );
}
