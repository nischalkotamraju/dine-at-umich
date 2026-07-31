import { Image } from 'expo-image';
import { Clock, Heart, LayoutGrid, type LucideIcon, MapPin, UtensilsCrossed } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';

type Props = {
  width: number;
};

const image = require('~/assets/icons/ios-light.png');

const FEATURES: { Icon: LucideIcon; label: string }[] = [
  { Icon: UtensilsCrossed, label: 'Daily menus, ingredients & allergens' },
  { Icon: Clock, label: "Live hours so you know what's open" },
  { Icon: MapPin, label: 'Find every location on the map' },
  { Icon: Heart, label: 'Save your favorite halls & dishes' },
  { Icon: LayoutGrid, label: 'Home screen widgets, updated live' },
];

const WelcomeScreen = ({ width }: Props) => {
  const isDark = useSettingsStore((state) => state.isDarkMode);
  const textColor = isDark ? '#fff' : '#111';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';
  const accent = getAccent(isDark);
  const tint = getAccentTint(isDark);

  return (
    <View style={{ width, flex: 1, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? '#333' : '#e5e7eb',
              marginRight: 10,
            }}
          >
            <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 12,
              letterSpacing: 1,
              color: accent,
            }}
          >
            DINE @ MICHIGAN
          </Text>
        </View>

        <Text
          style={{
            fontWeight: '700',
            fontSize: 34,
            lineHeight: 42,
            color: textColor,
          }}
        >
          Know what's <Text style={{ color: accent }}>cooking</Text> on campus.
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: subColor,
            marginTop: 16,
            maxWidth: 320,
          }}
        >
          Every dining hall, café, and market on campus, all in one place.
        </Text>

        <View style={{ marginTop: 32, gap: 16 }}>
          {FEATURES.map(({ Icon, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={accent} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 15, color: textColor, flex: 1 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default WelcomeScreen;
