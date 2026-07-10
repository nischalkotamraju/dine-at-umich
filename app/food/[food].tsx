import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { Container } from '~/components/Container';
import TopBar from '~/components/TopBar';
import { useFoodData } from '~/hooks/useFoodData';
import { getSafePostHog } from '~/services/analytics/posthog';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { cn } from '~/utils/utils';
import NutritionFooter from './components/NutritionFooter';
import NutritionRow from './components/NutritionRow';

const FoodScreen = () => {
  const params = useLocalSearchParams<{
    food: string;
    menu: string;
    category: string;
    location: string;
    favorite: string;
    date: string;
  }>();
  const { food, menu, category, location, favorite, date } = params;
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  const { foodItem, notFound, nutritionData, allergenList, dietaryList } = useFoodData(
    location,
    menu,
    category,
    food,
    favorite === 'true',
    date,
  );

  const analytics = getSafePostHog(usePostHog());

  // Filter out serving size from the table rows (shown separately)
  const nutritionDataFiltered = nutritionData.filter(
    (item) => item.key !== 'Serving Size' && item.key !== 'Calories',
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: analytics only
  useEffect(() => {
    analytics.screen(`${food}`, { location, menu, category });
  }, []);

  const bg = isDarkMode ? '#171717' : '#fff';
  const textColor = isDarkMode ? '#fff' : '#111';
  const subColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const divider = isDarkMode ? '#2a2a2a' : '#F0F0F0';
  const cardBg = isDarkMode ? '#1E1E1E' : '#F9F9F9';
  const border = isDarkMode ? '#333' : '#E5E7EB';

  const cal = foodItem?.nutrition?.calories;
  const protein = foodItem?.nutrition?.protein;
  const carbs = foodItem?.nutrition?.total_carbohydrates;
  const fat = foodItem?.nutrition?.total_fat;

  // The scraper only stores a nutrition row when it could parse calories off
  // the source page (see scripts/scrape-menus.mjs), so nutrition can come
  // back as an object with every field null (not undefined) via the SQL left
  // join. Treat that as "no data" everywhere — cafés, dining halls, etc. —
  // rather than rendering an empty calorie/macro/table block that looks broken.
  const hasNutritionData =
    cal != null ||
    protein != null ||
    carbs != null ||
    fat != null ||
    nutritionDataFiltered.length > 0;

  if (notFound) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack.Screen options={{ title: 'Food' }} />
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, backgroundColor: bg }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }} />
        </View>
        <View style={{ paddingHorizontal: 24 }}>
          <TopBar variant="food" />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: getAccent(isDarkMode),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <UtensilsCrossed size={30} color={isDarkMode ? '#000' : '#fff'} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 16,
              color: textColor,
              letterSpacing: 1,
              textAlign: 'center',
            }}
          >
            ITEM NOT AVAILABLE
          </Text>
          <Text style={{ fontSize: 14, color: subColor, textAlign: 'center', marginTop: 8 }}>
            {food} couldn't be found on today's menu for this location. U-M Dining may not have published it for the
            selected day yet — try pulling to refresh, or check back later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SheetProvider context="food">
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack.Screen options={{ title: 'Food' }} />

        {/* Pull-down indicator */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4, backgroundColor: bg }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#333' : '#E5E7EB' }} />
        </View>

        <Container disableInsets className="mx-0 mt-2">
          <FlashList
            estimatedItemSize={32}
            data={nutritionDataFiltered}
            extraData={isDarkMode}
            renderItem={({ item }) => <NutritionRow item={item} isDarkMode={isDarkMode} />}
            ListHeaderComponent={
              <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 16 }}>
                <TopBar variant="food" />

                {foodItem && (
                  <>
                    {/* Title + dietary badges */}
                    <View>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>
                        {foodItem.name}
                      </Text>
                      {foodItem.price && (
                        <Text style={{ fontSize: 15, fontFamily: 'RobotoMono_500Medium', color: subColor, marginTop: 4 }}>
                          {foodItem.price}
                        </Text>
                      )}
                      {dietaryList.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {dietaryList.map((d) => (
                            <View
                              key={d}
                              style={{
                                backgroundColor: getAccent(isDarkMode),
                                borderRadius: 6,
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#00274C' : '#fff' }}>
                                {d}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {hasNutritionData ? (
                      <>
                        {/* Large calorie display */}
                        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                          <Text
                            style={{
                              fontSize: 72,
                              fontFamily: 'RobotoMono_700Bold',
                              color: getAccent(isDarkMode),
                              lineHeight: 76,
                            }}
                          >
                            {cal ?? '—'}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: subColor,
                              fontFamily: 'RobotoMono_500Medium',
                              marginTop: 4,
                              textTransform: 'uppercase',
                            }}
                          >
                            Calories
                          </Text>
                        </View>

                        {/* Macro row */}
                        <View
                          style={{
                            flexDirection: 'row',
                            backgroundColor: cardBg,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: border,
                            overflow: 'hidden',
                          }}
                        >
                          {[
                            { label: 'Protein', value: protein, unit: 'g' },
                            { label: 'Carbs', value: carbs, unit: 'g' },
                            { label: 'Fat', value: fat, unit: 'g' },
                          ].map(({ label, value, unit }, idx, arr) => (
                            <View
                              key={label}
                              style={{
                                flex: 1,
                                alignItems: 'center',
                                paddingVertical: 14,
                                borderRightWidth: idx < arr.length - 1 ? 1 : 0,
                                borderRightColor: border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 18,
                                  fontFamily: 'RobotoMono_700Bold',
                                  color: textColor,
                                }}
                              >
                                {value != null ? `${value}${unit}` : '—'}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: subColor,
                                  fontFamily: 'RobotoMono_400Regular',
                                  marginTop: 2,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {label}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Nutrition Facts table */}
                        <View style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginBottom: 8 }}>
                            Nutrition Facts
                          </Text>
                          {/* Serving size row */}
                          {foodItem.nutrition?.serving_size && (
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: divider,
                              }}
                            >
                              <Text style={{ fontWeight: '600', color: textColor }}>Serving Size</Text>
                              <Text style={{ color: subColor, fontFamily: 'RobotoMono_400Regular', fontSize: 13 }}>
                                {foodItem.nutrition.serving_size}
                              </Text>
                            </View>
                          )}
                          {/* Calories row */}
                          {cal != null && (
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: divider,
                              }}
                            >
                              <Text style={{ fontWeight: '700', color: textColor }}>Calories</Text>
                              <Text style={{ color: getAccent(isDarkMode), fontFamily: 'RobotoMono_700Bold', fontSize: 14 }}>
                                {cal} kcal
                              </Text>
                            </View>
                          )}
                        </View>
                      </>
                    ) : (
                      <View
                        style={{
                          alignItems: 'center',
                          paddingVertical: 24,
                          gap: 4,
                          backgroundColor: cardBg,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: border,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                          Nutrition Facts Unavailable
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: subColor,
                            textAlign: 'center',
                            paddingHorizontal: 24,
                          }}
                        >
                          This item wasn't published with nutrition information by U-M Dining.
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              foodItem ? (
                <View style={{ paddingBottom: 120 }}>
                  <NutritionFooter
                    ingredients={foodItem.nutrition?.ingredients as string}
                    allergens={allergenList}
                    dietary={dietaryList}
                    isDarkMode={isDarkMode}
                  />
                </View>
              ) : null
            }
          />
        </Container>
      </View>
    </SheetProvider>
  );
};

export default FoodScreen;
