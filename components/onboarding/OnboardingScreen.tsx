import * as Haptics from 'expo-haptics';
import { ChevronLeft, X } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { getSafePostHog } from '~/services/analytics/posthog';
import { ONBOARDING_STEPS, useOnboardingStore } from '~/store/useOnboardingStore';
import { useSettingsStore } from '~/store/useSettingsStore';
import { COLORS, getAccent } from '~/utils/colors';
import { cn } from '~/utils/utils';
import { Container } from '../Container';
import WelcomeScreen from './screens/WelcomeScreen';

// Permissions are requested natively by the OS when the app actually needs
// them (e.g. opening the map, enabling notifications), and can be re-enabled
// anytime from Settings — so onboarding is just a single welcome screen.
const ONBOARDING_SCREENS = [ONBOARDING_STEPS.WELCOME];

interface OnboardingScreenProps {
  isOnboardingComplete: boolean;
  // When true, the onboarding flow is shown as a dismissible preview (e.g.
  // launched from Settings) rather than the real first-run flow — it won't
  // fire onboarding analytics events or touch onboarding-completion state,
  // and adds a close button so it can be exited at any step.
  isPreview?: boolean;
  onClose?: () => void;
}

const OnboardingScreen = ({ isOnboardingComplete, isPreview, onClose }: OnboardingScreenProps) => {
  const { width } = useWindowDimensions();
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  const posthog = usePostHog();
  const analytics = getSafePostHog(posthog);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const currentStepShared = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const { currentStep, setCurrentStep, completeOnboarding } = useOnboardingStore();
  const [hasTrackedStart, setHasTrackedStart] = React.useState(false);

  // Track onboarding start only once
  React.useEffect(() => {
    if (!isPreview && !isOnboardingComplete && !hasTrackedStart) {
      analytics.capture('onboarding_start', {
        onboarding_version: '1.0',
        timestamp: new Date().toISOString(),
      });
      setHasTrackedStart(true);
    }
  }, [isPreview, isOnboardingComplete, hasTrackedStart, analytics]);

  // Previewing reuses the same global step-position state as the real
  // onboarding flow, which is left pointing past the last step once
  // onboarding has actually been completed — always start a preview back at
  // the first screen.
  React.useEffect(() => {
    if (isPreview) setCurrentStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      isScrolling.value = true;
    },
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      if (!isScrolling.value) return;

      const newStep = Math.round(event.contentOffset.x / width);
      if (newStep !== currentStepShared.value) {
        currentStepShared.value = newStep;
        runOnJS(setCurrentStep)(newStep);
      }
    },
    onMomentumEnd: () => {
      isScrolling.value = false;
    },
  });

  const goToNext = useCallback(() => {
    const nextStep = Math.min(currentStep + 1, ONBOARDING_SCREENS.length - 1);
    if (nextStep === currentStep) return;

    currentStepShared.value = nextStep;
    setCurrentStep(nextStep);
    scrollRef.current?.scrollTo({ x: nextStep * width, y: 0, animated: true });
  }, [currentStep, width, scrollRef, setCurrentStep, currentStepShared]);

  const goToPrevious = useCallback(() => {
    const prevStep = Math.max(currentStep - 1, 0);
    if (prevStep === currentStep) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    currentStepShared.value = prevStep;
    setCurrentStep(prevStep);
    scrollRef.current?.scrollTo({ x: prevStep * width, y: 0, animated: true });
  }, [currentStep, width, scrollRef, setCurrentStep, currentStepShared]);

  const handleComplete = () => {
    if (isPreview) {
      onClose?.();
      return;
    }

    analytics.capture('onboarding_completed', {
      onboarding_version: '1.1',
    });

    completeOnboarding();
  };

  const renderScreen = (stepId: string, index: number) => {
    switch (stepId) {
      case ONBOARDING_STEPS.WELCOME:
        return <WelcomeScreen key={index} width={width} />;
      default:
        return null;
    }
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 50, stiffness: 400 });
    opacity.value = withSpring(0.8, { damping: 50, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 50, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 50, stiffness: 400 });
  };

  const handlePress = () => {
    // Ensure animation resets on press
    scale.value = withSpring(1, { damping: 50, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 50, stiffness: 400 });

    if (currentStep === ONBOARDING_SCREENS.length - 1) {
      handleComplete();
    } else {
      goToNext();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={isPreview ? true : !isOnboardingComplete}
    >
      <Container className={cn('mx-0', isDarkMode ? 'bg-neutral-900' : 'bg-white')}>
        {ONBOARDING_SCREENS.length > 1 ? (
          <View className="flex-row items-center px-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goToPrevious}
              disabled={currentStep === 0}
              className={cn('rounded-full', currentStep === 0 ? 'opacity-0' : 'opacity-100')}
            >
              <ChevronLeft
                size={24}
                color={isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey']}
              />
            </TouchableOpacity>

            <View className="flex-1 items-center justify-center px-4">
              <ProgressIndicator
                step={currentStep}
                totalSteps={ONBOARDING_SCREENS.length}
                className="w-[180px]"
              />
            </View>

            {isPreview ? (
              <TouchableOpacity activeOpacity={0.8} onPress={onClose} className="rounded-full">
                <X size={22} color={isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey']} />
              </TouchableOpacity>
            ) : (
              <View className="w-6" />
            )}
          </View>
        ) : (
          isPreview && (
            <View className="flex-row items-center justify-end px-6">
              <TouchableOpacity activeOpacity={0.8} onPress={onClose} className="rounded-full">
                <X size={22} color={isDarkMode ? COLORS['um-grey-dark-mode'] : COLORS['um-grey']} />
              </TouchableOpacity>
            </View>
          )
        )}

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {ONBOARDING_SCREENS.map((stepId, index) => renderScreen(stepId, index))}
        </Animated.ScrollView>

        <View className="px-4">
          <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[
              animatedStyle,
              {
                width: '100%',
                // Bottom corners echo the device's screen corner radius so the
                // button nests into the bottom of the screen; the top stays
                // subtly rounded. (~device content radius minus the px-4 inset.)
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
                paddingVertical: 16,
                backgroundColor: getAccent(isDarkMode),
              },
            ]}
          >
            <Text
              style={{
                fontFamily: 'RobotoMono_700Bold',
                fontSize: 13,
                letterSpacing: 1,
                textAlign: 'center',
                color: isDarkMode ? '#000' : '#fff',
              }}
            >
              {(currentStep === ONBOARDING_SCREENS.length - 1 ? 'Finish' : 'Continue').toUpperCase()}
            </Text>
          </AnimatedPressable>
        </View>
      </Container>
    </Modal>
  );
};

export default OnboardingScreen;
