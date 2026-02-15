/**
 * App color palette for light and dark themes.
 * AuthColors contains colors specific to authentication screens.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Authentication screen colors based on design
export const AuthColors = {
  // Gradient colors for Get Started screen
  gradientStart: '#E8996E',
  gradientEnd: '#A75B58',
  
  // Primary button
  primaryButton: '#C1766B',
  primaryButtonText: '#FFFFFF',
  
  // Secondary button (Get Started)
  secondaryButton: '#F5F5F5',
  secondaryButtonText: '#4A4A4A',
  
  // Input fields
  inputBackground: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputText: '#333333',
  inputPlaceholder: '#9E9E9E',
  
  // Labels and text
  labelText: '#FFFFFF',
  titleText: '#FFFFFF',
  subtitleText: 'rgba(255, 255, 255, 0.8)',
  linkText: '#FFFFFF',
  
  // Overlay for background image
  overlay: 'rgba(0, 0, 0, 0.3)',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
