import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 3,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
};

export const typography = {
  display: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.3 },
  mono: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
};

const PALETTE = {
  DEEP_DARK: '#171A21',
  NAVY_SURFACE: '#1B2838',
  SLATE_BAR: '#2A475E',
  SLATE_PRESSED: '#345774',
  SLATE_BORDER: '#1E3547',
  HIGHLIGHT_BLUE: '#66C0F4',
  HIGHLIGHT_BLUE_DARK: '#419AC9',
  TEXT_LIGHT: '#F5F7FA',
  TEXT_MUTED: '#C7D5E0',
  ACCENT_GREEN: '#A4D007',
  ACCENT_AMBER: '#F2A93B',
  ACCENT_RED: '#E5484D',
};

export const darkColors = {
  background: PALETTE.DEEP_DARK,
  surface: PALETTE.NAVY_SURFACE,
  surfaceAlt: PALETTE.SLATE_PRESSED,
  card: PALETTE.SLATE_BAR,
  cardPressed: PALETTE.SLATE_PRESSED,
  border: PALETTE.SLATE_BORDER,
  text: PALETTE.TEXT_LIGHT,
  textMuted: PALETTE.TEXT_MUTED,
  textInverse: PALETTE.DEEP_DARK,
  primary: PALETTE.HIGHLIGHT_BLUE,
  primaryPressed: PALETTE.HIGHLIGHT_BLUE_DARK,
  accent: PALETTE.HIGHLIGHT_BLUE,
  success: PALETTE.ACCENT_GREEN,
  warning: PALETTE.ACCENT_AMBER,
  danger: PALETTE.ACCENT_RED,
};

export const lightColors = {
  ...darkColors,
};

export function shadow(level = 1) {
  if (level <= 0) return {};
  return Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: level * 2 },
      shadowOpacity: 0.3 + level * 0.05,
      shadowRadius: level * 3,
    },
    android: {
      elevation: level * 2,
    },
    default: {
      boxShadow: `0px ${level * 2}px ${level * 4}px rgba(0,0,0,0.3)`,
    },
  });
}
