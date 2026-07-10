import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Apple,
  Beef,
  CakeSlice,
  ChevronRight,
  Coffee,
  Cookie,
  Droplet,
  Egg,
  Fish,
  Flame,
  HeartIcon,
  Leaf,
  Milk,
  MoonStar,
  Nut,
  PiggyBank,
  Pizza,
  RotateCwIcon,
  Salad,
  Sandwich,
  Shell,
  Soup,
  Sparkles,
  Sprout,
  Star,
  TreePine,
  Utensils,
  Wheat,
  WheatOff,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { FoodItem } from '~/services/database/database';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';

// Exported so other screens (e.g. search results) can render the exact same
// allergen/preference icons as these cards do, instead of drifting out of
// sync with a separately-maintained copy of this logic.
export const ALLERGEN_ICON_MAP: Record<string, { Icon: React.ComponentType<any>; type: 'allergen' | 'preference' }> = {
  beef:         { Icon: Beef,     type: 'allergen' },
  egg:          { Icon: Egg,      type: 'allergen' },
  fish:         { Icon: Fish,     type: 'allergen' },
  milk:         { Icon: Milk,     type: 'allergen' },
  oats:         { Icon: Sprout,   type: 'allergen' },
  peanuts:      { Icon: Nut,      type: 'allergen' },
  pork:         { Icon: PiggyBank, type: 'allergen' },
  sesame_seeds: { Icon: Sparkles, type: 'allergen' },
  shellfish:    { Icon: Shell,    type: 'allergen' },
  soy:          { Icon: Droplet,  type: 'allergen' },
  tree_nuts:    { Icon: TreePine, type: 'allergen' },
  wheat:        { Icon: Wheat,    type: 'allergen' },
  deep_fried:   { Icon: Flame,    type: 'allergen' },
  gluten_free:  { Icon: WheatOff, type: 'preference' },
  halal:        { Icon: MoonStar, type: 'preference' },
  spicy:        { Icon: Flame,    type: 'preference' },
  vegan:        { Icon: Leaf,     type: 'preference' },
  vegetarian:   { Icon: Salad,    type: 'preference' },
  kosher:       { Icon: Star,     type: 'preference' },
};

export const getCategoryIcon = (categoryName: string, isDarkMode = true) => {
  const c = (categoryName ?? '').toLowerCase();
  const size = 20;
  const sw = 1.8;
  const iconColor = getAccent(isDarkMode);
  if (c.includes('cereal') || c.includes('oatmeal') || c.includes('porridge') || c.includes('soup'))
    return <Soup size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('bak') || c.includes('muffin') || c.includes('pastry') || c.includes('cake') || c.includes('bread') || c.includes('scone'))
    return <CakeSlice size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('donut') || c.includes('doughnut') || c.includes('cookie'))
    return <Cookie size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('pizza'))
    return <Pizza size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('salad') || c.includes('fruit') || c.includes('apple'))
    return <Apple size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('sandwich') || c.includes('wrap') || c.includes('burger') || c.includes('sub'))
    return <Sandwich size={size} color={iconColor} strokeWidth={sw} />;
  if (c.includes('coffee') || c.includes('drink') || c.includes('beverage') || c.includes('juice') || c.includes('tea'))
    return <Coffee size={size} color={iconColor} strokeWidth={sw} />;
  return <Utensils size={size} color={iconColor} strokeWidth={sw} />;
};

const FoodComponent = ({
  food,
  selectedMenu,
  categoryName,
  location,
  date,
  onFavorite,
  isFavorite,
  isFavoriteScreen = false,
  showExtraInfo = true,
}: {
  food: FoodItem;
  selectedMenu: string;
  categoryName: string;
  location: string;
  date?: string;
  onFavorite: (food: FoodItem) => Promise<void>;
  isFavorite: boolean;
  isFavoriteScreen?: boolean;
  showExtraInfo?: boolean;
}) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = async () => {
    router.push({
      pathname: `/food/[food]`,
      params: {
        food: food.name as string,
        menu: selectedMenu,
        category: categoryName,
        location,
        favorite: isFavoriteScreen ? 'true' : 'false',
        date: date ?? '',
      },
    });
  };

  const cardBg = isDarkMode ? '#242424' : '#F8F9FA';

  const handleFavoritePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onFavorite(food);
  };

  return (
    <Reanimated.View style={animatedStyle}>
      <View
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 8,
          backgroundColor: cardBg,
        }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 13,
            backgroundColor: cardBg,
          }}
        >
          {/* Category icon */}
          {showExtraInfo && (
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: getAccentTint(isDarkMode),
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {getCategoryIcon(categoryName, isDarkMode)}
            </View>
          )}

          <FoodContent
            food={food}
            categoryName={categoryName}
            showExtraInfo={showExtraInfo}
            isDarkMode={isDarkMode}
          />

          {showExtraInfo && (
            <Pressable
              onPress={handleFavoritePress}
              hitSlop={10}
              style={{ padding: 4, flexShrink: 0 }}
            >
              <HeartIcon
                size={19}
                color={getAccent(isDarkMode)}
                fill={isFavorite ? getAccent(isDarkMode) : 'transparent'}
                strokeWidth={1.8}
              />
            </Pressable>
          )}
        </Pressable>
      </View>
    </Reanimated.View>
  );
};

const FoodContent = ({
  food,
  showExtraInfo,
  isDarkMode,
}: {
  food: FoodItem;
  categoryName: string;
  showExtraInfo: boolean;
  isDarkMode: boolean;
}) => {
  const cal = food.nutrition?.calories;
  const protein = food.nutrition?.protein;
  const carbs = food.nutrition?.total_carbohydrates;
  const hasMacros = cal != null || protein != null || carbs != null;

  const macroText = [
    cal != null ? `${cal} calories` : null,
    protein != null ? `${protein}g protein` : null,
    carbs != null ? `${carbs}g carbs` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            numberOfLines={2}
            style={{ fontSize: 14, fontFamily: 'RobotoMono_500Medium', color: isDarkMode ? '#fff' : '#000', letterSpacing: -0.3, flexShrink: 1 }}
          >
            {food.name}
          </Text>
          {food.price && (
            <Text
              style={{ fontSize: 12, fontFamily: 'RobotoMono_500Medium', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              {food.price}
            </Text>
          )}
        </View>


        {showExtraInfo && hasMacros && (
          <Text style={{ fontSize: 11, fontFamily: 'RobotoMono_400Regular', color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
            {macroText}
          </Text>
        )}

        {showExtraInfo && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {food.allergens && (() => {
              const entries = Object.entries(food.allergens).filter(
                ([key, value]) => value === true && ALLERGEN_ICON_MAP[key]
              );
              const allergens = entries.filter(([key]) => ALLERGEN_ICON_MAP[key].type === 'allergen');
              const preferences = entries.filter(([key]) => ALLERGEN_ICON_MAP[key].type === 'preference');
              return [...preferences, ...allergens].map(([key]) => {
                const { Icon, type } = ALLERGEN_ICON_MAP[key];
                const iconColor = type === 'allergen' ? '#EF4444' : '#22C55E';
                const bgColor = type === 'allergen' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)';
                return (
                  <View key={key} style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={12} color={iconColor} strokeWidth={1.8} />
                  </View>
                );
              });
            })()}
          </View>
        )}
      </View>

      <ChevronRight size={16} color={isDarkMode ? '#4B5563' : '#D1D5DB'} />
    </>
  );
};

export default FoodComponent;
