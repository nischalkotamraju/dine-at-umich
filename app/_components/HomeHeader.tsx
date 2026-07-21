import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronDown, CreditCard, SlidersHorizontal } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { FlipBoard } from '~/components/FlipBoard';
import { PAYMENT_METHOD_LABELS } from '~/data/PaymentInfo';
import { formatInCentralTime } from '~/utils/date';
import { useHomeFilterStore } from '~/store/useHomeFilterStore';
import { usePaymentFilterStore } from '~/store/usePaymentFilterStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import type * as schema from '../../services/database/schema';

type HomeHeaderProps = {
  currentTime: Date;
  locationTypes: schema.LocationType[];
};

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const TITLE = 'DINE @ MICHIGAN';
const SUBTITLE = "Here's what's nearby.";

const HomeHeader = ({ currentTime, locationTypes }: HomeHeaderProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const { selectedFilters, resetFilters } = useHomeFilterStore();
  const { selectedMethods, resetMethods } = usePaymentFilterStore();

  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const easternHour = Number(formatInCentralTime(currentTime, 'H'));
  const greeting = getGreeting(easternHour);
  const filterActive = selectedFilters.length > 0;
  const activeLabel = filterActive
    ? locationTypes
        .filter((t) => selectedFilters.includes(t.name))
        .map((t) => t.name)
        .join(', ')
    : null;

  return (
    <View style={{ marginTop: 8, gap: 16 }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 54, height: 54, borderRadius: 14 }} resizeMode="contain" />
          <Text style={{ fontSize: 16, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode), letterSpacing: -0.5 }}>
            {TITLE}
          </Text>
        </View>
      </View>

      {/* Greeting */}
      <View>
        <FlipBoard
          lines={[
            { text: `${greeting.toUpperCase()},`, color: isDarkMode ? '#fff' : '#111' },
            { text: 'WOLVERINE.', color: getAccent(isDarkMode), showClawAfter: true },
          ]}
          targetTileSize={25}
          isDarkMode={isDarkMode}
        />
        <Text style={{ fontSize: 14, color: subColor, marginTop: 8 }}>{SUBTITLE}</Text>
      </View>

      {/* Filter pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'nowrap', gap: 8 }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (filterActive) {
              resetFilters();
            } else {
              router.push('/home-filter');
            }
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexShrink: 1,
            minWidth: 0,
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: filterActive ? getAccent(isDarkMode) : isDarkMode ? '#2C2C2E' : '#F2F2F7',
            borderWidth: 1,
            borderColor: filterActive ? 'transparent' : isDarkMode ? '#333' : '#e5e7eb',
          }}
        >
          <SlidersHorizontal size={13} color={filterActive ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000'} strokeWidth={2} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flexShrink: 1, fontSize: 12, fontFamily: 'RobotoMono_500Medium', color: filterActive ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000' }}
          >
            {filterActive ? (activeLabel ?? '').toUpperCase() : 'ALL LOCATIONS'}
          </Text>
          <ChevronDown size={13} color={filterActive ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000'} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Payment method filter pill */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (selectedMethods.length > 0) {
              resetMethods();
            } else {
              router.push('/payment-filter');
            }
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexShrink: 1,
            minWidth: 0,
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: selectedMethods.length > 0 ? getAccent(isDarkMode) : isDarkMode ? '#2C2C2E' : '#F2F2F7',
            borderWidth: 1,
            borderColor: selectedMethods.length > 0 ? 'transparent' : isDarkMode ? '#333' : '#e5e7eb',
          }}
        >
          <CreditCard size={13} color={selectedMethods.length > 0 ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000'} strokeWidth={2} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flexShrink: 1, fontSize: 12, fontFamily: 'RobotoMono_500Medium', color: selectedMethods.length > 0 ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000' }}
          >
            {selectedMethods.length > 0
              ? selectedMethods.map((m) => PAYMENT_METHOD_LABELS[m]).join(', ').toUpperCase()
              : 'ALL PAYMENT METHODS'}
          </Text>
          <ChevronDown size={13} color={selectedMethods.length > 0 ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#000'} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
