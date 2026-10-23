import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) {
  const { colors, spacing, radius, shadow } = useTheme();

  const skin = {
    primary: {
      bg: colors.primary,
      bgPressed: colors.primaryPressed,
      fg: '#FFFFFF',
      border: 'transparent',
    },
    secondary: {
      bg: colors.surfaceAlt,
      bgPressed: colors.border,
      fg: colors.text,
      border: colors.border,
    },
    ghost: {
      bg: 'transparent',
      bgPressed: colors.surfaceAlt,
      fg: colors.primary,
      border: 'transparent',
    },
  }[variant] || {
    bg: colors.primary,
    bgPressed: colors.primaryPressed,
    fg: '#FFFFFF',
    border: 'transparent',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: skin.border,
          backgroundColor: pressed ? skin.bgPressed : skin.bg,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && Platform.OS === 'ios' ? 0.98 : 1 }],
        },
        variant === 'primary' && !pressed ? shadow(1) : null,
        style,
      ]}
    >
      <AppText variant="body" style={[styles.label, { color: skin.fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
