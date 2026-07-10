import { ArrowUp } from 'lucide-react-native';
import { Animated, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '~/store/useSettingsStore';
import { getAccent } from '~/utils/colors';

interface ScrollToTopButtonProps {
  visible: boolean;
  animationValue: Animated.Value;
  onPress: () => void;
}

const ScrollToTopButton = ({ visible, animationValue, onPress }: ScrollToTopButtonProps) => {
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const scaleAnim = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={{
        opacity: animationValue,
        transform: [{ scale: scaleAnim }],
        position: 'absolute',
        bottom: 40,
        right: 40,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        className="size-12 items-center justify-center rounded-full shadow-md"
        style={{ backgroundColor: getAccent(isDarkMode) }}
        activeOpacity={0.8}
      >
        <ArrowUp size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ScrollToTopButton;
