import { router, Stack } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';

export default function NotFoundScreen() {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const bg = isDarkMode ? '#171717' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const accent = getAccent(isDarkMode);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <SearchX size={34} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
        </View>

        <Text
          style={{
            fontFamily: 'RobotoMono_700Bold',
            fontSize: 15,
            color: accent,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          404
        </Text>
        <Text
          style={{
            fontFamily: 'RobotoMono_700Bold',
            fontSize: 20,
            color: textColor,
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          PAGE NOT FOUND
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: subColor,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          This screen doesn't exist.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
          style={{
            marginTop: 32,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: accent,
          }}
        >
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 13,
              color: isDarkMode ? '#000' : '#fff',
              letterSpacing: 1,
            }}
          >
            GO TO HOME
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
