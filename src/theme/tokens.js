import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
};

export const colors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfacePressed: '#26354D',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#6366F1',
  primaryPressed: '#4F46E5',
  accent: '#F59E0B',
  success: '#34D399',
  danger: '#EF4444',
};

export const statusColors = {
  Playing: { bg: 'rgba(99, 102, 241, 0.18)', text: '#818CF8', border: '#6366F1' },
  Completed: { bg: 'rgba(52, 211, 153, 0.18)', text: '#34D399', border: '#10B981' },
  Backlog: { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24', border: '#F59E0B' },
  Dropped: { bg: 'rgba(239, 68, 68, 0.18)', text: '#F87171', border: '#EF4444' },
};

export function shadow(level = 1) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: level * 2 },
      shadowOpacity: 0.08 + level * 0.04,
      shadowRadius: level * 3,
    },
    android: {
      elevation: level * 2,
    },
    default: {},
  });
}
