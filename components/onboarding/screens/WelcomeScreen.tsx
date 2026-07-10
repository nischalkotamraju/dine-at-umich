import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';

type Props = {
  width: number;
};

const image = require('~/assets/onboarding/icon.webp');

const WelcomeScreen = ({ width }: Props) => {
  const isDark = useSettingsStore((state) => state.isDarkMode);
  const textColor = isDark ? '#fff' : '#111';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';
  const accent = getAccent(isDark);

  return (
    <View style={{ width, flex: 1, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
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
            fontFamily: 'RobotoMono_700Bold',
            fontSize: 34,
            lineHeight: 42,
            color: textColor,
          }}
        >
          Know what's{'\n'}cooking on{'\n'}
          <Text style={{ color: accent }}>campus.</Text>
        </Text>

        <Text
          style={{
            fontFamily: 'RobotoMono_400Regular',
            fontSize: 14,
            lineHeight: 21,
            color: subColor,
            marginTop: 20,
            maxWidth: 300,
          }}
        >
          Real-time menus, hours, and locations for every dining hall, café, and market on campus.
        </Text>

        <View
          style={{
            marginTop: 32,
            height: 4,
            width: 56,
            borderRadius: 2,
            backgroundColor: accent,
          }}
        />
      </View>
    </View>
  );
};

export default WelcomeScreen;
