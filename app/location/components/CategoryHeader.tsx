import { ChevronDown } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS } from '~/utils/colors';
import { cn } from '~/utils/utils';

interface CategoryHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const CategoryHeader = React.memo(({ title, isExpanded, onToggle }: CategoryHeaderProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: isDarkMode ? '#fff' : '#000', letterSpacing: -0.2 }}>
        {title}
      </Text>
      <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
        <ChevronDown size={16} color={isDarkMode ? '#9CA3AF' : COLORS['um-grey']} />
      </View>
    </TouchableOpacity>
  );
});

export default CategoryHeader;
