import { useWindowDimensions } from 'react-native';

// Reference design width — a standard iPhone (13/14/15) viewport. Every other
// screen size scales relative to this so text, icons, and spacing grow/shrink
// proportionally instead of looking cramped on small phones (SE) or
// comically oversized on large ones (Pro Max) / tablets.
const BASELINE_WIDTH = 390;
const BASELINE_HEIGHT = 844;

/**
 * Moderately scales a size based on screen width, damped by `factor` so
 * things like font sizes don't grow linearly with screen width (which would
 * look absurd on a tablet) — only a fraction of the scale difference is
 * applied.
 */
function moderateScale(size: number, width: number, factor = 0.3): number {
  const scale = width / BASELINE_WIDTH;
  return size + (scale - 1) * size * factor;
}

/**
 * Hook exposing screen-size-aware scaling helpers for the current window
 * dimensions. Re-renders automatically on rotation/multitasking resize since
 * it's backed by `useWindowDimensions`.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // iPads / split-view / large-format devices — worth capping how far
  // moderateScale grows so cards don't become oversized on a tablet.
  const isTablet = width >= 768;
  const isSmallScreen = width <= 375; // iPhone SE / mini and similar
  const clampedWidth = Math.min(width, isTablet ? 600 : width);

  const scale = (size: number, factor = 0.3) => Math.round(moderateScale(size, clampedWidth, factor));
  const verticalScale = (size: number) => Math.round((height / BASELINE_HEIGHT) * size);

  return { width, height, isTablet, isSmallScreen, scale, verticalScale };
}
