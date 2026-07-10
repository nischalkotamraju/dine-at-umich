import { addDays, isSameDay, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { createDateFromString, formatDateForAPI, getCentralTimeDate } from '~/utils/date';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onDateChange }) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const today = getCentralTimeDate();
  const currentDate = createDateFromString(selectedDate);

  // Build 5 dates: 2 back, today, 2 forward
  const dates = [];
  for (let i = -2; i <= 2; i++) {
    dates.push(i < 0 ? subDays(today, Math.abs(i)) : addDays(today, i));
  }

  const handlePress = async (date: Date) => {
    // Use local-getter-based formatting, not toISOString() (which reads the
    // true UTC epoch and ignores the Eastern-Time "local" values this Date
    // object was built to represent — using it here selected the wrong day).
    onDateChange(formatDateForAPI(date));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {dates.map((date) => {
        const isSelected = isSameDay(date, currentDate);
        const isToday = isSameDay(date, today);

        return (
          <TouchableOpacity
            key={date.toISOString()}
            onPress={() => handlePress(date)}
            activeOpacity={0.75}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: isSelected
                ? getAccent(isDarkMode)
                : isDarkMode ? '#242424' : '#F2F2F7',
            }}
          >
            <Text style={{
              fontSize: 10,
              fontFamily: 'RobotoMono_500Medium',
              letterSpacing: 0.3,
              color: isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#9CA3AF' : '#6B7280',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {isToday ? 'TODAY' : DAYS[date.getDay()]}
            </Text>
            <Text style={{
              fontSize: 18,
              fontFamily: 'RobotoMono_700Bold',
              color: isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#111',
              letterSpacing: -0.5,
            }}>
              {date.getDate()}
            </Text>
            <Text style={{
              fontSize: 10,
              fontFamily: 'RobotoMono_400Regular',
              color: isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#6B7280' : '#9CA3AF',
              marginTop: 2,
            }}>
              {MONTHS[date.getMonth()].toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default DateNavigator;
