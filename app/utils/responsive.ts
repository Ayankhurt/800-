import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 14 Pro - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Responsive scaling functions
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Get responsive dimensions
export const getResponsiveDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 768,
});

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  base: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  "2xl": moderateScale(24),
  "3xl": moderateScale(28),
  "4xl": moderateScale(32),
};

// Responsive spacing
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  base: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  "2xl": moderateScale(32),
  "3xl": moderateScale(40),
  "4xl": moderateScale(48),
};




