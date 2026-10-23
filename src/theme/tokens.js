import { Platform } from 'react-native';

/**
 * DESIGN TOKENS - GAMESTAR
 * Nenhum valor visual fica solto nos componentes.
 * Centraliza escala de espacamento, raios, tipografia, cores semanticas (claro/escuro) e sombra.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.3 },
  mono: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
};

const palette = {
  ink900: '#0F172A',
  ink800: '#1E293B',
  ink700: '#26354D',
  ink600: '#334155',
  slate400: '#94A3B8',
  slate200: '#CBD5E1',
  slate100: '#E6E9F0',
  white: '#FFFFFF',
  indigo: '#6366F1',
  indigoDark: '#4F46E5',
  mint: '#2BB9A3',
  amber: '#F2A93B',
  red: '#E5484D',
};

export const lightColors = {
  background: palette.slate100,
  surface: palette.white,
  surfaceAlt: '#F4F6FA',
  border: '#DEE3EC',
  text: palette.ink900,
  textMuted: '#5D667C',
  textInverse: palette.white,
  primary: palette.indigo,
  primaryPressed: palette.indigoDark,
  success: palette.mint,
  warning: palette.amber,
  danger: palette.red,
};

export const darkColors = {
  background: palette.ink900,
  surface: palette.ink800,
  surfaceAlt: palette.ink700,
  border: palette.ink600,
  text: '#F8FAFC',
  textMuted: palette.slate400,
  textInverse: palette.ink900,
  primary: palette.indigo,
  primaryPressed: palette.indigoDark,
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FF6369',
};

export function shadow(level = 1) {
  if (level <= 0) return {};
  return Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: level * 2 },
      shadowOpacity: 0.06 + level * 0.03,
      shadowRadius: level * 3,
    },
    android: {
      elevation: level * 2,
    },
    default: {
      boxShadow: `0px ${level * 2}px ${level * 4}px rgba(0,0,0,0.15)`,
    },
  });
}
