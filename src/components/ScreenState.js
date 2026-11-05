import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Button from './Button';
import { useTheme } from '../theme/ThemeProvider';

export function LoadingState({ message = 'Carregando...' }) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.center, { padding: spacing.xl, gap: spacing.sm }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="body" tone="muted">
        {message}
      </AppText>
    </View>
  );
}

export function ErrorState({ title = 'Algo deu errado', message, onRetry }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.errorBox,
        {
          margin: spacing.md,
          padding: spacing.md,
          borderRadius: radius.md,
          borderColor: colors.danger,
          backgroundColor: colors.danger + '1A',
          gap: spacing.sm,
        },
      ]}
    >
      <AppText variant="subtitle" tone="danger">
        {title}
      </AppText>
      {message ? <AppText variant="body">{message}</AppText> : null}
      {onRetry ? (
        <Button label="Tentar novamente" variant="secondary" onPress={onRetry} style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    borderWidth: 1,
  },
  retry: {
    alignSelf: 'flex-start',
  },
});
