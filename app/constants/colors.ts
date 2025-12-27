const BaseColors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#EFF6FF",
  secondary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  white: "#FFFFFF",
  black: "#000000",
};

export const lightPalette = {
  ...BaseColors,
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
};

export const darkPalette = {
  ...BaseColors,
  background: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#334155",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  border: "#334155",
  primaryLight: "#1E293B", // Override for dark mode
};

const Colors = lightPalette; // Default for static imports

export default Colors;
