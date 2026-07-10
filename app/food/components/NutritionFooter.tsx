import React from 'react';
import { Text, View } from 'react-native';

interface NutritionFooterProps {
  ingredients?: string;
  allergens: string[];
  dietary: string[];
  isDarkMode?: boolean;
}

interface FooterRowProps {
  label: string;
  value: string;
  isDarkMode?: boolean;
  showDivider: boolean;
}

const FooterRow = ({ label, value, isDarkMode, showDivider }: FooterRowProps) => {
  const textColor = isDarkMode ? '#D1D5DB' : '#111';
  const dividerColor = isDarkMode ? '#2a2a2a' : '#F0F0F0';

  return (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ paddingVertical: 8 }}>
        <Text style={{ color: textColor }}>
          <Text style={{ fontWeight: '700' }}>{label} </Text>
          <Text style={{ fontWeight: '400' }}>{value}</Text>
        </Text>
      </View>
      {showDivider && <View style={{ height: 1, backgroundColor: dividerColor }} />}
    </View>
  );
};

const NutritionFooter = React.memo(
  ({ ingredients, allergens, dietary, isDarkMode }: NutritionFooterProps) => (
    <>
      <FooterRow
        label="Allergens:"
        value={allergens.join(', ') || 'None'}
        isDarkMode={isDarkMode}
        showDivider
      />
      <FooterRow
        label="Dietary:"
        value={dietary.join(', ') || 'None'}
        isDarkMode={isDarkMode}
        showDivider
      />
      <FooterRow
        label="Ingredients:"
        value={ingredients || 'N/A'}
        isDarkMode={isDarkMode}
        showDivider={false}
      />
    </>
  ),
);

export default NutritionFooter;
