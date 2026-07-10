import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight, Clock, ShoppingBag, ShoppingCart, Truck, UtensilsCrossed, Coffee } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { getPaymentMethodIcon, isPaymentMethod, PAYMENT_METHOD_COLORS } from '~/data/PaymentInfo';
import { useDatabase } from '~/hooks/useDatabase';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import type { LocationWithType } from '~/services/database/schema';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getTodayInCentralTime } from '~/utils/date';
import { getDetailedLocationStatus } from '~/utils/locationStatus';
import { getLocationTimeMessage, getNextOpeningInfo } from '~/utils/time';

type LocationItemProps = {
  location: LocationWithType;
  currentTime: Date;
};

// Exported so other screens (e.g. the location type filter modal) render the
// exact same icon per location type as these cards do, instead of drifting
// out of sync with a separately-maintained copy of this logic.
export const getLocationIcon = (type: string | null, color: string, size = 18) => {
  const t = (type ?? '').toLowerCase();
  if (t.includes('dining hall')) return <UtensilsCrossed size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('caf') || t.includes('coffee')) return <Coffee size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('food court')) return <ShoppingBag size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('convenience')) return <ShoppingCart size={size} color={color} strokeWidth={1.8} />;
  if (t.includes('truck')) return <Truck size={size} color={color} strokeWidth={1.8} />;
  return <ShoppingBag size={size} color={color} strokeWidth={1.8} />;
};

// Distinct accent color per location type, used for the icon's circular
// background in the filter modal (cards themselves color this circle by
// open/closed status instead, since that's more useful at a glance there).
export const getLocationIconColor = (type: string | null): string => {
  const t = (type ?? '').toLowerCase();
  if (t.includes('dining hall')) return '#60A5FA';
  if (t.includes('caf') || t.includes('coffee')) return '#FBBF24';
  if (t.includes('grill')) return '#FB923C';
  if (t.includes('market')) return '#34D399';
  if (t.includes('food court')) return '#A78BFA';
  if (t.includes('convenience')) return '#38BDF8';
  if (t.includes('truck')) return '#F472B6';
  return '#9CA3AF';
};

const LocationItem = ({ location, currentTime }: LocationItemProps) => {
  const [status, setStatus] = useState<'open' | 'opening_soon' | 'closed'>('closed');
  const scale = useSharedValue(1);
  const db = useDatabase();
  const { isDarkMode } = useSettingsStore();
  const { locationData } = useLocationDetails(location.name ?? '');
  const displayName = location.name ?? '';

  useEffect(() => {
    const todayDate = getTodayInCentralTime();
    const s = getDetailedLocationStatus(location, locationData, db, currentTime, todayDate);
    setStatus(s);
  }, [locationData, currentTime, db, location]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (router.canDismiss()) router.dismissAll();
    router.push(`/location/${location.name}`);
  };

  const isOpen = status === 'open';
  const statusColor = isOpen ? '#22C55E' : '#F87171';
  const iconBg = isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)';
  const nameColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  const getTimeText = () => {
    // force_close is an admin override, not a schedule gap — the location
    // won't necessarily reopen at its next regular hours slot, so don't show
    // a next-opening time that could be wrong. Every other closed location
    // should always surface when it opens next (today or a future day), not
    // just a bare "Closed".
    if (locationData?.force_close) return 'Closed';
    if (isOpen) {
      const msg = getLocationTimeMessage(locationData, currentTime);
      return msg.replace('Open for ', 'Closes in ');
    }
    const nextOpening = getNextOpeningInfo(locationData, currentTime);
    return nextOpening ? nextOpening.label : 'Closed';
  };

  const paymentMethods = (
    Array.isArray(location.methods_of_payment) ? location.methods_of_payment : []
  ).filter(isPaymentMethod);

  return (
    <Reanimated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          gap: 12,
          backgroundColor: isDarkMode ? '#262626' : '#f9f9f9',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDarkMode ? '#333' : '#e5e7eb',
          paddingHorizontal: 14,
          marginBottom: 8,
        }}
      >
        {/* Location icon */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: isOpen ? '#22C55E' : '#F87171',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {getLocationIcon(location.type, '#111')}
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'RobotoMono_500Medium', color: nameColor, letterSpacing: -0.3 }} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {isOpen && <Clock size={11} color="#22C55E" strokeWidth={2} />}
            <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: subColor, letterSpacing: 0.3 }}>
              {getTimeText().toUpperCase()}
            </Text>
          </View>
        </View>

        {paymentMethods.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, flexShrink: 0 }}>
            {paymentMethods.map((method) => (
              <View
                key={method}
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
            ))}
          </View>
        )}

        <ChevronRight size={14} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} strokeWidth={2.5} />
      </Pressable>
    </Reanimated.View>
  );
};

export default LocationItem;
