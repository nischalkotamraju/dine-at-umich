import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { MapPin, X } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import { useEffect, useState } from 'react';
import {
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getLocationIcon, getLocationIconColor } from '~/app/_components/LocationItem';
import { getSafePostHog } from '~/services/analytics/posthog';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';

type MapLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  location: {
    name: string;
    address: string;
    description: string;
    type: string;
  } | null;
};

// Uses React Native's built-in Modal (a centered dialog-style popup) rather
// than the app's react-native-actions-sheet bottom sheets, and matches the
// app's real visual identity (RobotoMono labels, raw color values instead of
// broken/off-brand tailwind classes) instead of the generic sheet styling.
const MapLocationModal = ({ visible, onClose, location }: MapLocationModalProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const analytics = getSafePostHog(usePostHog());

  // Keep showing the last-selected location's content while the modal plays
  // its close animation. `location` goes null the instant the map screen
  // clears selection, which happens in the same update as `visible` turning
  // false — if we bailed out (returning null) at that point, the <Modal>
  // itself would unmount mid-transition instead of fading out gracefully,
  // producing a jarring flash of whatever's behind it for every location.
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location) {
      setDisplayLocation(location);
    }
  }, [location]);

  useEffect(() => {
    if (visible && displayLocation) {
      analytics.screen(`${displayLocation.name}-map-modal`);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: analytics only
  }, [visible, displayLocation?.name]);

  if (!displayLocation) return null;

  const { name, address, description, type } = displayLocation;
  const accentColor = getLocationIconColor(type);
  const textColor = isDarkMode ? '#fff' : '#000';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cardBg = isDarkMode ? '#171717' : '#fff';
  const borderColor = isDarkMode ? '#333' : '#e5e7eb';

  const handleOpenMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const encodedAddress = encodeURIComponent(address.replace(/\s/g, '+'));
    const url =
      Platform.OS === 'ios'
        ? `maps://maps.apple.com/?address=${encodedAddress}`
        : `https://www.google.com/maps/place/${encodedAddress}`;
    Linking.openURL(url);
  };

  const handleMoreInfo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.replace('/');

    InteractionManager.runAfterInteractions(() => {
      router.navigate(`/location/${name}`);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 380,
            borderRadius: 20,
            borderWidth: 1,
            borderColor,
            backgroundColor: cardBg,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              width: 28,
              height: 28,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <X size={14} color={subColor} strokeWidth={2.5} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }} bounces={false}>
            {/* Header: icon + name/type */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 28 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: accentColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getLocationIcon(type, '#111', 20)}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, letterSpacing: -0.4 }}>
                  {name}
                </Text>
                {!!type && (
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 11,
                      fontFamily: 'RobotoMono_700Bold',
                      color: accentColor,
                      letterSpacing: 0.5,
                    }}
                  >
                    {type.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            {/* Address */}
            <TouchableOpacity
              onPress={handleOpenMaps}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}
            >
              <MapPin size={14} color={subColor} strokeWidth={2} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'RobotoMono_400Regular',
                  color: subColor,
                  flexShrink: 1,
                }}
              >
                {address}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: borderColor, marginVertical: 16 }} />

            {/* Description */}
            {!!description && (
              <Text style={{ fontSize: 14, lineHeight: 20, color: textColor }}>{description}</Text>
            )}

            {/* Directions button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenMaps}
              style={{
                marginTop: 18,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                backgroundColor: getAccent(isDarkMode),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'RobotoMono_700Bold',
                  color: isDarkMode ? '#000' : '#fff',
                  letterSpacing: 0.5,
                }}
              >
                DIRECTIONS
              </Text>
            </TouchableOpacity>

            {/* More Info button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleMoreInfo}
              style={{
                marginTop: 10,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                borderWidth: 1,
                borderColor,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'RobotoMono_700Bold',
                  color: textColor,
                  letterSpacing: 0.5,
                }}
              >
                MORE INFO
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MapLocationModal;
