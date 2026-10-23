import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

export default function Badge({ label, tone = 'primary' }) {
  const { colors, spacing, radius } = useTheme();

  const baseColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.textMuted,
  }[tone] || colors.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: baseColor + '22',
          borderColor: baseColor,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 2,
        },
      ]}
    >
      <AppText variant="caption" style={{ color: baseColor, fontWeight: '700' }}>
        {String(label).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
});
