import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Beef,
  ChevronLeft,
  Egg,
  Fish,
  Flame,
  Leaf,
  Milk,
  MoonStar,
  Nut,
  PiggyBank,
  RotateCwIcon,
  Salad,
  Shell,
  Sparkles,
  Sprout,
  TreePine,
  Wheat,
  WheatOff,
  Star,
  Droplet,
} from 'lucide-react-native';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFiltersStore } from '~/store/useFiltersStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent, getAccentTint } from '~/utils/colors';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 10;
const CARD_RADIUS = 14;

const ALLERGENS: { key: string; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'beef',         label: 'Beef',            Icon: Beef },
  { key: 'egg',          label: 'Eggs',            Icon: Egg },
  { key: 'fish',         label: 'Fish',            Icon: Fish },
  { key: 'milk',         label: 'Milk',            Icon: Milk },
  { key: 'oats',         label: 'Oats',            Icon: Sprout },
  { key: 'peanuts',      label: 'Peanuts',         Icon: Nut },
  { key: 'pork',         label: 'Pork',            Icon: PiggyBank },
  { key: 'sesame_seeds', label: 'Sesame Seed',     Icon: Sparkles },
  { key: 'shellfish',    label: 'Shellfish',       Icon: Shell },
  { key: 'soy',          label: 'Soy',             Icon: Droplet },
  { key: 'tree_nuts',    label: 'Tree Nuts',       Icon: TreePine },
  { key: 'wheat',        label: 'Wheat/Gluten',    Icon: Wheat },
  { key: 'deep_fried',   label: 'Deep Fried',      Icon: Flame },
];

const PREFERENCES: { key: string; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'gluten_free',  label: 'Gluten Free',   Icon: WheatOff },
  { key: 'halal',        label: 'Halal',         Icon: MoonStar },
  { key: 'spicy',        label: 'Spicy',         Icon: Flame },
  { key: 'vegan',        label: 'Vegan',         Icon: Leaf },
  { key: 'vegetarian',   label: 'Vegetarian',    Icon: Salad },
  { key: 'kosher',       label: 'Kosher',        Icon: Star },
];

export default function LocationFilterModal() {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const { filters, toggleAllergenFilter, toggleDietaryFilter, resetFilters } = useFiltersStore();

  const bg = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDarkMode ? '#2C2C2E' : '#fff';
  const subColor = isDarkMode ? '#636366' : '#8E8E93';
  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const ROW_COLS = 3;
  const chipSize = (width - PADDING * 2 - GAP * (ROW_COLS - 1)) / ROW_COLS;

  const allergenAccent = isDarkMode ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
  const preferenceAccent = isDarkMode ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)';
  const allergenBorder = isDarkMode ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)';
  const preferenceBorder = isDarkMode ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.2)';

  const Chip = ({
    label, Icon, isSelected, onPress, extraStyle, accent,
  }: { label: string; Icon: React.ComponentType<any>; isSelected: boolean; onPress: () => void; extraStyle?: object; accent: string; accentBorder: string }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        width: chipSize,
        paddingVertical: 14,
        borderRadius: CARD_RADIUS,
        backgroundColor: isSelected ? getAccent(isDarkMode) : accent,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: isSelected ? getAccent(isDarkMode) : 'transparent',
        ...extraStyle,
      }}
    >
      <Icon size={22} color={isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#111'} strokeWidth={1.8} />
      <Text style={{ fontSize: 10, fontFamily: 'RobotoMono_500Medium', textAlign: 'center', color: isSelected ? (isDarkMode ? '#000' : '#fff') : isDarkMode ? '#fff' : '#111', paddingHorizontal: 4 }} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 24, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={() => { haptic(); router.back(); }}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16 }}
        >
          <ChevronLeft size={24} color={getAccent(isDarkMode)} />
          <Text style={{ fontSize: 16, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>BACK</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: isDarkMode ? '#fff' : '#000', letterSpacing: -0.5 }}>Filters</Text>
            <Text style={{ fontSize: 14, color: subColor, marginTop: 3 }}>Refine your menu view</Text>
          </View>
          <TouchableOpacity
            onPress={() => { resetFilters(); haptic(); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              borderRadius: 20, borderWidth: 1.5,
              borderColor: getAccent(isDarkMode),
              paddingHorizontal: 12, paddingVertical: 6,
              backgroundColor: getAccentTint(isDarkMode),
            }}
          >
            <RotateCwIcon size={14} color={getAccent(isDarkMode)} />
            <Text style={{ fontSize: 12, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: PADDING }}>
        {/* Allergens */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#EF4444' }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>Allergens</Text>
          </View>
          <Text style={{ fontSize: 13, color: subColor, marginBottom: 14 }}>Exclude items containing these</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {ALLERGENS.map(({ key, label, Icon }) => (
              <Chip
                key={key}
                label={label}
                Icon={Icon}
                isSelected={!!filters.allergens[key]}
                onPress={() => { toggleAllergenFilter(key); haptic(); }}
                accent={allergenAccent}
                accentBorder={allergenBorder}
              />
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>Preferences</Text>
          </View>
          <Text style={{ fontSize: 13, color: subColor, marginBottom: 14 }}>Show only items matching these</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {PREFERENCES.map(({ key, label, Icon }) => {
              return (
                <Chip
                  key={key}
                  label={label}
                  Icon={Icon}
                  isSelected={!!filters.dietary[key]}
                  onPress={() => { toggleDietaryFilter(key); haptic(); }}
                  accent={preferenceAccent}
                  accentBorder={preferenceBorder}
                />
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
