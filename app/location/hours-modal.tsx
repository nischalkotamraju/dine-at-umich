import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { AlertTriangle, Clock, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { useLocationHours } from '~/hooks/useLocationHours';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';
import { getTodayInCentralTime } from '~/utils/date';
import type { DayHours, HoursBlock } from '~/utils/hours';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Fixed pixel heights used to compute the sheet height directly from the
// hours data — deterministic, so it never depends on iOS's flaky
// `fitToContents` measurement (which rounds up and stretches the measured
// view, leaving a per-row-count gap). Tune these if a row-count clips or gaps.
const HEADER_H = 78; // paddingTop 24 + header row (~38) + paddingBottom 16
const CARD_V_PADDING = 28; // paddingVertical 14 top + bottom
const DATE_LINE_H = 17; // the bold date header line
const DATE_BLOCK_GAP = 8; // gap between date header and its block lines
const BLOCK_LINE_H = 16; // one line of 12px RobotoMono block text
const SLOT_GAP = 4; // gap between stacked block lines in a card
const CARD_GAP = 8; // gap between day cards
const NON_SCHEDULE_DETENT = 0.28; // loading / error states

// HHMM int (1630) -> "4:30 PM".
function formatHHMM(t: number): string {
  const hour24 = Math.floor(t / 100);
  const minute = t % 100;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

// 'YYYY-MM-DD' -> "Mon, Aug 4".
function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Number of text lines a card renders below its date header.
function cardBlockLines(day: DayHours): number {
  return day.status === 'open' ? Math.max(day.blocks.length, 1) : 1;
}

export default function HoursModal() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const { days, loading, error } = useLocationHours(location ?? '');
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const navigation = useNavigation();
  const today = getTodayInCentralTime();

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const textColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const mutedColor = isDarkMode ? '#8E8E93' : '#9CA3AF';
  const PADDING = 20;
  // Last card's bottom corners use this larger radius so they blend into the
  // sheet's own rounded bottom.
  const SHEET_RADIUS = 38;
  const CARD_RADIUS = 14;
  const bodyBottomPad = 28;

  // Compute the exact sheet height from the hours data and pin the detent to
  // it. No view measurement, so the day-count gets exactly bodyBottomPad of
  // room below the last card.
  useEffect(() => {
    let detent = NON_SCHEDULE_DETENT;
    if (!loading && !error && days.length > 0) {
      let rows = 0;
      for (const day of days) {
        const lines = cardBlockLines(day);
        rows +=
          CARD_V_PADDING +
          DATE_LINE_H +
          DATE_BLOCK_GAP +
          lines * BLOCK_LINE_H +
          (lines - 1) * SLOT_GAP;
      }
      const total = HEADER_H + rows + (days.length - 1) * CARD_GAP + bodyBottomPad;
      detent = Math.min(total / SCREEN_HEIGHT, 0.95);
    }
    navigation.setOptions({ sheetAllowedDetents: [detent] });
  }, [loading, error, days, bodyBottomPad, navigation]);

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
      ) : error || days.length === 0 ? (
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
            <AlertTriangle size={22} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
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
            UNABLE TO LOAD HOURS
          </Text>
        </View>
      ) : (
      <View style={{ paddingHorizontal: PADDING, paddingBottom: bodyBottomPad, gap: CARD_GAP }}>
        {days.map((day, index) => {
          const isLast = index === days.length - 1;
          const isToday = day.date === today;
          return (
            <View key={day.date} style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              borderBottomLeftRadius: isLast ? SHEET_RADIUS : CARD_RADIUS,
              borderBottomRightRadius: isLast ? SHEET_RADIUS : CARD_RADIUS,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderWidth: isToday ? 1.5 : 0,
              borderColor: isToday ? getAccent(isDarkMode) : 'transparent',
            }}>
              {/* Date header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: DATE_BLOCK_GAP }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getAccent(isDarkMode) }} />
                <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#fff' : '#000' }}>
                  {formatDateLabel(day.date)}
                </Text>
                {isToday && (
                  <View style={{ backgroundColor: getAccent(isDarkMode), borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#000' : '#fff', letterSpacing: 0.5 }}>
                      TODAY
                    </Text>
                  </View>
                )}
              </View>

              {/* Blocks */}
              <View style={{ gap: SLOT_GAP, paddingLeft: 14 }}>
                {day.status === 'open' ? (
                  day.blocks.map((block: HoursBlock, i: number) => {
                    // Café-style single blocks are named "Open" — show that in
                    // green, matching the app's open/closed status colors.
                    const isOpenLabel = block.name.toLowerCase() === 'open';
                    return (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_500Medium', color: isOpenLabel ? '#4ADE80' : isDarkMode ? '#fff' : '#000' }}>
                          {isOpenLabel ? 'OPEN' : block.name}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: textColor }}>
                          {formatHHMM(block.open)} – {formatHHMM(block.close)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: day.status === 'closed' ? '#F87171' : mutedColor }}>
                    {day.status === 'closed' ? 'CLOSED' : 'Hours not posted'}
                  </Text>
                )}
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
