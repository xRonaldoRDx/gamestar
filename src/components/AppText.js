import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function AppText({
  variant = 'body',
  tone = 'default',
  style,
  children,
  ...rest
}) {
  const { typography, colors } = useTheme();

  const toneColor = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    warning: colors.warning,
    danger: colors.danger,
    success: colors.success,
    inverse: colors.textInverse,
  }[tone] || colors.text;

  return (
    <Text style={[typography[variant], { color: toneColor }, style]} {...rest}>
      {children}
    </Text>
  );
}
