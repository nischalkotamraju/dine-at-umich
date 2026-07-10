import { ChevronDown } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

interface TimeScheduleProps {
  schedule: { dayRange: string; time: string }[];
  isOpen: boolean;
  onToggle: () => void;
  hideIcon?: boolean;
}

const TimeSchedule = ({ schedule, isOpen, onToggle }: TimeScheduleProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const textColor = isDarkMode ? '#D1D5DB' : '#6B7280';
  const displayed = isOpen ? schedule : schedule.slice(0, 1);

  return (
    <TouchableOpacity onPress={onToggle}>
      {/* Collapsed: single row with label + today's slots inline */}
      {!isOpen && schedule.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#fff' : '#000' }}>
            HOURS TODAY
          </Text>
          <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: textColor, flex: 1 }}>
            {schedule[0].time.split(/,|\n/).map(s => s.trim()).filter(Boolean).join('  ·  ')}
          </Text>
          <ChevronDown size={12} color={isDarkMode ? '#aaa' : COLORS['um-grey']} />
        </View>
      )}

      {/* Expanded: full schedule */}
      {isOpen && (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: isDarkMode ? '#fff' : '#000' }}>
              HOURS TODAY
            </Text>
            <ChevronDown size={12} color={isDarkMode ? '#aaa' : COLORS['um-grey']} style={{ transform: [{ rotate: '180deg' }] }} />
          </View>
          {displayed.map((item) => {
            const slots = item.time.split(/,|\n/).map(s => s.trim()).filter(Boolean);
            return (
              <View key={item.dayRange} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_500Medium', color: textColor, width: 52 }}>
                  {item.dayRange}:
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  {slots.map((slot, i) => (
                    <Text key={i} style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: textColor }}>
                      {slot}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TimeSchedule;
