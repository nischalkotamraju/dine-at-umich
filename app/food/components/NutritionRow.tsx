import React from 'react';
import { Text, View } from 'react-native';

import { COLORS } from '~/utils/colors';
import {
  BENEFICIAL_NUTRITION,
  DAILY_VALUES,
  INDENTED_NUTRITION,
  NUTRITION_UNITS,
  PERCENT_ONLY_NUTRITION,
} from '~/data/AllergenInfo';

interface NutritionRowProps {
  item: { key: string; value: unknown };
  isDarkMode?: boolean;
}

// FDA rule of thumb: 5% DV or less is low, 20% DV or more is high. For
// nutrients you want to limit (fat, sodium, sugar, etc.) high = bad = red.
// For beneficial nutrients (protein, fiber, vitamins, calcium, iron) it's
// the opposite — high = good = green, low = red.
function percentageColor(percentage: number, isBeneficial: boolean): string {
  if (isBeneficial) {
    if (percentage >= 20) return COLORS['status-open'];
    if (percentage <= 5) return COLORS['status-closed'];
    return COLORS['um-maize'];
  }
  if (percentage >= 20) return COLORS['status-closed'];
  if (percentage <= 5) return COLORS['status-open'];
  return COLORS['um-maize'];
}

const NutritionRow = React.memo(({ item, isDarkMode }: NutritionRowProps) => {
  const isPercentOnly = PERCENT_ONLY_NUTRITION.has(item.key);
  const isBeneficial = BENEFICIAL_NUTRITION.has(item.key);
  const nutrientValue = parseFloat(String(item.value ?? 0));
  const percentage = isPercentOnly
    ? Math.round(nutrientValue)
    : DAILY_VALUES[item.key]
      ? Math.round((nutrientValue / DAILY_VALUES[item.key]) * 100)
      : null;

  const isIndented = INDENTED_NUTRITION.has(item.key);
  const textColor = isDarkMode ? '#D1D5DB' : '#111';
  const valueColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const dividerColor = isDarkMode ? '#2a2a2a' : '#F0F0F0';

  return (
    <View style={{ paddingHorizontal: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: isIndented ? 16 : 0,
          paddingVertical: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {item.key === 'Trans Fat' ? (
            <Text style={{ color: textColor, fontWeight: isIndented ? '400' : '700' }}>
              <Text style={{ fontStyle: 'italic' }}>Trans</Text>
              {' Fat'}
            </Text>
          ) : (
            <Text style={{ color: textColor, fontWeight: isIndented ? '400' : '700' }}>
              {item.key}
            </Text>
          )}
          {!isPercentOnly && (
            <Text style={{ color: valueColor, fontFamily: 'RobotoMono_400Regular', fontSize: 13 }}>
              {item.key === 'Calories'
                ? ` ${item.value} kcal`
                : ` ${item.value}${NUTRITION_UNITS[item.key] ?? ''}`}
            </Text>
          )}
        </View>
        {percentage !== null && (
          <Text
            style={{
              color: percentageColor(percentage, isBeneficial),
              fontFamily: 'RobotoMono_700Bold',
              fontSize: 13,
            }}
          >
            {percentage}%
          </Text>
        )}
      </View>
      <View style={{ height: 1, backgroundColor: dividerColor }} />
    </View>
  );
});

export default NutritionRow;
