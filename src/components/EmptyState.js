import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import Button from './Button';
import { useTheme } from '../theme/ThemeProvider';

export default function EmptyState({
  badge = 'GAMESTAR',
  title,
  description,
  actionLabel,
  onActionPress,
}) {
  const { colors, spacing, radius, shadow } = useTheme();

  return (
    <View
      style={[
        styles.container,
        shadow(1),
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.xl,
          marginTop: spacing.lg,
        },
      ]}
    >
      <View style={styles.badgeWrapper}>
        <Badge label={badge} tone="primary" />
      </View>

      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>

      <AppText variant="body" tone="muted" style={styles.description}>
        {description}
      </AppText>

      {actionLabel && onActionPress ? (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
  },
});
