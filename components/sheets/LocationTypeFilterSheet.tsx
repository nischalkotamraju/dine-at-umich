import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import ActionSheet, { type SheetProps } from 'react-native-actions-sheet';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';

type Payload = {
  selectedFilter: string;
  locationTypes: { id: string; name: string }[];
  onSelect: (filter: string) => void;
};

const LocationTypeFilterSheet = ({ sheetId, payload }: SheetProps<'location-type-filter'>) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const { selectedFilter, locationTypes, onSelect } = (payload as Payload) ?? {};

  const options = [
    { id: 'all', name: 'All' },
    ...(locationTypes ?? []).map((t) => ({ id: t.name, name: t.name })),
  ];

  const bg = isDarkMode ? '#1C1C1E' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';
  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <ActionSheet
      id={sheetId}
      defaultOverlayOpacity={0.4}
      containerStyle={{ backgroundColor: bg }}
      gestureEnabled
      closeOnTouchBackdrop
      safeAreaInsets={insets}
      useBottomSafeAreaPadding
      springOffset={50}
      springConfig={{ damping: 18, mass: 0.7, stiffness: 200 }}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '60%' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: subColor, letterSpacing: 0.5, marginBottom: 12 }}>
            FILTER BY TYPE
          </Text>

          {options.map((option, index) => {
            const isSelected = selectedFilter === option.id;
            return (
              <View key={option.id}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect?.(option.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? getAccent(isDarkMode) : textColor,
                    }}
                  >
                    {option.name}
                  </Text>
                  {isSelected && <Check size={18} color={getAccent(isDarkMode)} strokeWidth={2.5} />}
                </TouchableOpacity>
                {index < options.length - 1 && (
                  <View style={{ height: 1, backgroundColor: dividerColor }} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ActionSheet>
  );
};

export default LocationTypeFilterSheet;
