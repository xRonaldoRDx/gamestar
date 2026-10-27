import { Platform } from 'react-native';

/**
 * DESIGN TOKENS - GAMESTAR
 * Tema escuro com fundos azul-acinzentados (#171A21, #1B2838),
 * barras de conteúdo (#2A475E) e destaques em azul vibrante (#66C0F4).
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

const palette = {
  deepDark: '#171A21',         // Fundo principal escuro
  navySurface: '#1B2838',      // Superfície de cabeçalho / container
  slateBar: '#2A475E',         // Barras horizontais e cartões médios
  slatePressed: '#345774',     // Estado pressionado / contraste
  slateBorder: '#1E3547',      // Bordas sutis
  highlightBlue: '#66C0F4',    // Cor primária de destaque
  highlightBlueDark: '#419AC9',// Primária ativa / pressionada
  textLight: '#F5F7FA',        // Texto principal
  textMuted: '#C7D5E0',        // Texto secundário e metadados
  accentGreen: '#A4D007',      // Destaque de sucesso / concluído
  accentAmber: '#F2A93B',      // Destaque de backlog / pendente
  accentRed: '#E5484D',        // Destaque de drop / erro
};

export const darkColors = {
  background: palette.deepDark,
  surface: palette.navySurface,
  surfaceAlt: palette.slatePressed,
  card: palette.slateBar,
  cardPressed: palette.slatePressed,
  border: palette.slateBorder,
  text: palette.textLight,
  textMuted: palette.textMuted,
  textInverse: palette.deepDark,
  primary: palette.highlightBlue,
  primaryPressed: palette.highlightBlueDark,
  accent: palette.highlightBlue,
  success: palette.accentGreen,
  warning: palette.accentAmber,
  danger: palette.accentRed,
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
