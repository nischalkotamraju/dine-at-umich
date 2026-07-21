import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Bookmark, Home, Map, Search, Settings } from 'lucide-react-native';

import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS, getAccent } from '~/utils/colors';

export default function Layout() {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#171717' : '#ffffff',
          borderTopColor: isDarkMode ? '#262626' : '#e5e7eb',
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: getAccent(isDarkMode),
        tabBarInactiveTintColor: isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey'],
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.5} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} strokeWidth={1.5} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} strokeWidth={1.5} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} strokeWidth={1.5} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.5} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />

      {/* Reachable via notification taps, but hidden from the tab bar */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
