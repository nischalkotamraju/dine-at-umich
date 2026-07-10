import { AlertTriangle, InfoIcon, MapPin } from 'lucide-react-native';
import { ActivityIndicator, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet, { type SheetProps } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getPaymentMethodIcon,
  isPaymentMethod,
  PAYMENT_METHOD_COLORS,
} from '~/data/PaymentInfo';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { generateSchedule } from '~/utils/time';
import { cn } from '~/utils/utils';

const LocationAboutSheet = ({ sheetId, payload }: SheetProps<'location-about'>) => {
  const insets = useSafeAreaInsets();
  const locationName = payload?.location?.name;
  const { locationData, loading, error } = useLocationDetails(locationName || '');
  const displayName = locationName || '';
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  // Generate schedule from database data
  const schedule = generateSchedule(locationData, false);

  // Get payment methods from database data - ensure it's an array
  const paymentMethods = Array.isArray(locationData?.methods_of_payment)
    ? locationData.methods_of_payment
    : [];

  if (loading) {
    return (
      <ActionSheet
        id={sheetId}
        defaultOverlayOpacity={0.5}
        containerStyle={{ backgroundColor: isDarkMode ? '#171717' : 'white', maxHeight: 600 }}
        gestureEnabled
        safeAreaInsets={insets}
        useBottomSafeAreaPadding
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 600 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="small" color={getAccent(isDarkMode)} />
          </View>
        </ScrollView>
      </ActionSheet>
    );
  }

  if (error || !locationData) {
    const accent = getAccent(isDarkMode);
    return (
      <ActionSheet
        id={sheetId}
        defaultOverlayOpacity={0.5}
        containerStyle={{ backgroundColor: isDarkMode ? '#171717' : 'white', maxHeight: 600 }}
        gestureEnabled
        safeAreaInsets={insets}
        useBottomSafeAreaPadding
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 600 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={26} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: 'RobotoMono_700Bold',
                fontSize: 15,
                color: isDarkMode ? '#fff' : '#111',
                letterSpacing: 0.5,
                textAlign: 'center',
              }}
            >
              UNABLE TO LOAD
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Location details couldn't be fetched.
            </Text>
          </View>
        </ScrollView>
      </ActionSheet>
    );
  }

  return (
    <ActionSheet
      id={sheetId}
      defaultOverlayOpacity={0.5}
      containerStyle={{ backgroundColor: isDarkMode ? '#171717' : 'white' }}
      gestureEnabled
      safeAreaInsets={insets}
      useBottomSafeAreaPadding
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 550 }}>
        <View className="flex-col gap-y-3 p-6">
          <View className="gap-1">
            <View className="flex-row items-center gap-x-2">
              <View>
                <InfoIcon color={getAccent(isDarkMode)} />
              </View>
              <Text className={cn('font-bold text-3xl', isDarkMode ? 'text-white' : 'text-black')}>
                About {displayName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (locationData) {
                  if (Platform.OS === 'ios') {
                    Linking.openURL(locationData.apple_maps_link || '');
                  } else {
                    Linking.openURL(locationData.google_maps_link || '');
                  }
                }
              }}
              className="flex-row items-center gap-x-1"
            >
              <MapPin size={16} color={getAccent(isDarkMode)} />
              <Text className={cn('', isDarkMode ? 'text-gray-300' : 'text-ut-grey')}>
                {locationData?.address}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className={cn(
              'my-1 w-full border-b',
              isDarkMode ? 'border-neutral-800' : 'border-b-ut-grey/15',
            )}
          />

          <Text className={cn('text-base', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
            {locationData?.description}
          </Text>

          <View
            className={cn(
              'flex-col gap-y-3 rounded-xl p-4',
              isDarkMode ? 'bg-ut-grey-dark-mode/10' : 'bg-neutral-50',
            )}
          >
            <Text
              className={cn('font-semibold text-2xl', isDarkMode ? 'text-white ' : 'text-black')}
            >
              Regular Service Hours
            </Text>
            {schedule.map((schedule) => (
              <View
                key={`${schedule.dayRange}${schedule.time}`}
                className="flex-row items-start justify-between"
              >
                <Text className={cn('font-medium', isDarkMode ? 'text-white' : 'text-black')}>
                  {schedule.dayRange}:
                </Text>
                <Text
                  className={cn('leading-loose', isDarkMode ? 'text-gray-300' : 'text-ut-grey')}
                >
                  {schedule.time.includes(',') ? schedule.time.replace(/, /g, '\n') : schedule.time}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-col gap-y-3">
            <Text
              className={cn('font-semibold text-2xl', isDarkMode ? 'text-white' : 'text-black')}
            >
              Methods of Payment
            </Text>
            <View className="flex-row flex-wrap items-center justify-between gap-4">
              {paymentMethods.map((method) => {
                if (isPaymentMethod(method)) {
                  return (
                    <View key={method} className="items-center justify-center gap-0.5">
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: PAYMENT_METHOD_COLORS[method],
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getPaymentMethodIcon(method, '#111', 16)}
                      </View>
                      <Text
                        className={cn('font-medium', isDarkMode ? 'text-gray-300' : 'text-ut-grey')}
                      >
                        {method}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </ActionSheet>
  );
};

export default LocationAboutSheet;
