import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useRef } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { useFiltersStore } from '~/store/useFiltersStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';
import { cn } from '~/utils/utils';

type Props = {
  query: string;
  setQuery: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSearchFocused: boolean;
};

const SearchBar = ({ query, setQuery, onFocus, onBlur, isSearchFocused }: Props) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const filters = useFiltersStore((state) => state.filters);
  const inputRef = useRef<TextInput>(null);

  const hasFilters = filters.favorites ||
    Object.values(filters.dietary).some(Boolean) ||
    Object.values(filters.allergens).some(Boolean);

  const handleCancel = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setQuery('');
    onBlur?.();
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: isDarkMode ? '#242424' : '#F2F2F7',
        }}
      >
        <Search size={16} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: 15,
            color: isDarkMode ? '#fff' : '#000',
          }}
          placeholder="Search menu..."
          value={query}
          onChangeText={setQuery}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        ) : !isSearchFocused ? (
          <TouchableOpacity
            onPress={() => {
              router.push('/location-filter');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{ paddingLeft: 10 }}
          >
            <View>
              <SlidersHorizontal size={17} color={hasFilters ? getAccent(isDarkMode) : isDarkMode ? '#6B7280' : '#9CA3AF'} strokeWidth={2} />
              {hasFilters && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: 3, backgroundColor: getAccent(isDarkMode) }} />
              )}
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
      {isSearchFocused && (
        <TouchableOpacity onPress={handleCancel}>
          <Text style={{ fontSize: 13, fontFamily: 'RobotoMono_700Bold', color: getAccent(isDarkMode) }}>
            CANCEL
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
