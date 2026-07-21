import * as Haptics from 'expo-haptics';
import { RotateCwIcon } from 'lucide-react-native';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import {
  getPaymentMethodIcon,
  PAYMENT_METHOD_COLORS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '~/data/PaymentInfo';
import { usePaymentFilterStore } from '~/store/usePaymentFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 12;
const COLS = 2;
const CARD_SIZE = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

export default function PaymentFilterModal() {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const { selectedMethods, toggleMethod, resetMethods } = usePaymentFilterStore();

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Title */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>
            Filter by Payment
          </Text>
          <Text style={{ fontSize: 14, color: subColor, marginTop: 3 }}>
            Select any accepted methods
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetMethods(); haptic(); }}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            borderRadius: 20, borderWidth: 1.5,
            borderColor: getAccent(isDarkMode),
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: getAccentTint(isDarkMode),
          }}
        >
          <RotateCwIcon size={14} color={getAccent(isDarkMode)} />
          <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>RESET</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: PADDING,
          gap: GAP,
        }}
      >
        {PAYMENT_METHODS.map((method, index) => {
          const isSelected = selectedMethods.includes(method);
          const tileBg = isDarkMode ? '#2C2C2E' : '#fff';
          const borderColor = isSelected ? getAccent(isDarkMode) : isDarkMode ? '#333' : '#e5e7eb';

          const totalRows = Math.ceil(PAYMENT_METHODS.length / COLS);
          const cardRow = Math.floor(index / COLS);
          const isLastRow = cardRow === totalRows - 1;
          const isLeftCard = index % COLS === 0;
          const isRightCard = index % COLS === COLS - 1;
          const SHEET_RADIUS = 38;
          const CARD_RADIUS = 18;

          return (
            <TouchableOpacity
              key={method}
              onPress={() => { toggleMethod(method); haptic(); }}
              activeOpacity={0.75}
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
                backgroundColor: tileBg,
                borderTopLeftRadius: CARD_RADIUS,
                borderTopRightRadius: CARD_RADIUS,
                borderBottomLeftRadius: isLastRow && isLeftCard ? SHEET_RADIUS : CARD_RADIUS,
                borderBottomRightRadius: isLastRow && isRightCard ? SHEET_RADIUS : CARD_RADIUS,
                borderWidth: isSelected ? 2 : 1,
                borderColor: borderColor,
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
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: PAYMENT_METHOD_COLORS[method],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getPaymentMethodIcon(method, '#111', 22)}
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'RobotoMono_500Medium',
                  color: isSelected ? getAccent(isDarkMode) : isDarkMode ? '#fff' : '#000',
                  textAlign: 'center',
                  paddingHorizontal: 4,
                }}
                numberOfLines={2}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
