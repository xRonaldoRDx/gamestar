import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import AppText from './AppText';
import { GAME_STATUS, STATUS_KEYS } from '../services/games';
import { useTheme } from '../theme/ThemeProvider';

const ALL_OPTION = null;

export default function StatusFilter({ value, onChange }) {
  const { colors, spacing, radius } = useTheme();
  const options = [ALL_OPTION, ...STATUS_KEYS];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
    >
      {options.map((statusKey) => {
        const isSelected = value === statusKey;
        const label = statusKey ? GAME_STATUS[statusKey].label : 'Todos';
        return (
          <Pressable
            key={statusKey ?? 'all'}
            onPress={() => onChange(statusKey)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Filtrar por ${label}`}
            style={[
              styles.chip,
              {
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary + '26' : colors.surface,
              },
            ]}
          >
            <AppText variant="caption" tone={isSelected ? 'primary' : 'muted'} style={styles.label}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
