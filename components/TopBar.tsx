import * as Haptics from 'expo-haptics';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Heart, MessageSquare } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useDatabase } from '~/hooks/useDatabase';
import { useFoodData } from '~/hooks/useFoodData';
import { useLocationDetails } from '~/hooks/useLocationDetails';
import {
  isFavoriteItem,
  isFavoriteLocation,
  toggleFavorites,
  toggleLocationFavorite,
} from '~/services/database/database';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS, getAccent } from '~/utils/colors';

const icon = require('../assets/logo.png');

const HomeTopBar = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  return (
    <View className="flex w-full flex-row items-center justify-between ">
      <Image className="size-12" source={icon} />

      <View className="flex flex-row gap-x-5">
        <Link href="https://dinemichigan.userjot.com/" asChild>
          <TouchableOpacity>
            <MessageSquare
              size={20}
              color={isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey']}
            />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

const LocationTopBar = () => {
  const { location } = useLocalSearchParams<{ location: string }>();
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const db = useDatabase();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteLocation(db, location));
  }, [location, db]);

  const getIconColor = (isActive: boolean) => {
    if (isActive) return getAccent(isDarkMode);
    return isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey'];
  };

  return (
    <View className="flex w-full flex-row items-center justify-between">
      <TouchableOpacity
        className="flex flex-row items-center"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <ChevronLeft size={24} color={getAccent(isDarkMode)} />
        <Text style={{ fontSize: 16, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>BACK</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          const isFavorited = await toggleLocationFavorite(db, location);
          setIsFavorite(isFavorited);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      >
        <Heart
          size={20}
          color={getIconColor(isFavorite)}
          fill={isFavorite ? getAccent(isDarkMode) : 'transparent'}
        />
      </TouchableOpacity>
    </View>
  );
};

const FoodTopBar = () => {
  const { category, food, location, menu, favorite } = useLocalSearchParams<{
    category: string;
    food: string;
    location: string;
    menu: string;
    favorite: string;
  }>();

  const { foodItem } = useFoodData(location, menu, category, food, favorite === 'true');
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const db = useDatabase();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const result = isFavoriteItem(db, foodItem?.name as string);

    setIsFavorite(result);
  }, [foodItem, db]);

  if (!foodItem) {
    return null;
  }

  const getIconColor = (isActive: boolean) => {
    if (isActive) return getAccent(isDarkMode);
    return isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey'];
  };

  return (
    <View className="flex w-full flex-row items-center justify-between ">
      <TouchableOpacity
        className="flex flex-row items-center"
        onPress={() => {
          router.back();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <ChevronLeft size={24} color={getAccent(isDarkMode)} />
        <Text style={{ fontSize: 16, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>BACK</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          if (foodItem) {
            const isFavorited = await toggleFavorites(db, foodItem, location, menu, category);
            setIsFavorite(isFavorited);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }}
      >
        <Heart
          size={20}
          color={getIconColor(isFavorite)}
          fill={isFavorite ? getAccent(isDarkMode) : 'transparent'}
        />
      </TouchableOpacity>
    </View>
  );
};

const BackTopBar = () => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  return (
    <View className="flex w-full flex-row items-center justify-between ">
      <TouchableOpacity
        className="flex flex-row items-center"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <ChevronLeft size={24} color={getAccent(isDarkMode)} />

        <Text className="font-semibold text-lg" style={{ color: getAccent(isDarkMode) }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

interface TopBarProps {
  variant?: 'home' | 'location' | 'back' | 'food';
}

const TopBar = ({ variant = 'home' }: TopBarProps) => {
  switch (variant) {
    case 'home':
      return <HomeTopBar />;
    case 'location':
      return <LocationTopBar />;
    case 'back':
      return <BackTopBar />;
    case 'food':
      return <FoodTopBar />;
    default:
      return <HomeTopBar />;
  }
};

export default TopBar;
