import * as Haptics from 'expo-haptics';
import { Coffee, Flame, ShoppingBasket, UtensilsCrossed } from 'lucide-react-native';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet, { ScrollView, type SheetProps } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 12;
const COLS = 2;
const CARD_SIZE = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;
const SHEET_RADIUS = 38;
const CARD_RADIUS = 18;

const OPTIONS = [
  { id: 'dining hall', name: 'Dining Hall' },
  { id: 'café', name: 'Café' },
  { id: 'grill', name: 'Grill' },
  { id: 'market', name: 'Market' },
] as const;

const getIcon = (id: string, color: string, size = 28) => {
  if (id === 'dining hall') return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
  if (id === 'café') return <Coffee size={size} color={color} strokeWidth={1.8} />;
  if (id === 'grill') return <Flame size={size} color={color} strokeWidth={1.8} />;
  if (id === 'market') return <ShoppingBasket size={size} color={color} strokeWidth={1.8} />;
  return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
};

const FiltersSheet = ({ sheetId }: SheetProps<'filters'>) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';

  return (
    <ActionSheet
      id={sheetId}
      defaultOverlayOpacity={0.5}
      containerStyle={{ backgroundColor: bg }}
      gestureEnabled
      safeAreaInsets={insets}
      useBottomSafeAreaPadding
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: PADDING, paddingTop: 28, paddingBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>
            Filter Locations
          </Text>
          <Text style={{ fontSize: 14, color: subColor, marginTop: 3, marginBottom: 20 }}>
            Choose a category to browse
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {OPTIONS.map((option, index) => {
              const totalRows = Math.ceil(OPTIONS.length / COLS);
              const row = Math.floor(index / COLS);
              const col = index % COLS;
              const isLastRow = row === totalRows - 1;
              const isLeft = col === 0;
              const isRight = col === COLS - 1;

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  activeOpacity={0.75}
                  style={{
                    width: CARD_SIZE,
                    height: CARD_SIZE,
                    backgroundColor: cardBg,
                    borderTopLeftRadius: CARD_RADIUS,
                    borderTopRightRadius: CARD_RADIUS,
                    borderBottomLeftRadius: isLastRow && isLeft ? SHEET_RADIUS : CARD_RADIUS,
                    borderBottomRightRadius: isLastRow && isRight ? SHEET_RADIUS : CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#e5e7eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDarkMode ? 0 : 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {getIcon(option.id, '#8E8E93')}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDarkMode ? '#fff' : '#000', textAlign: 'center' }}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ActionSheet>
  );
};

export default FiltersSheet;
