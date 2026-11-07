import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Single-choice chip grid used by the review form (status, platform).
 * `options` is a list of { value, label }.
 */
export default function ChoiceChips({ options, value, onChange, disabled = false, accessibilityPrefix = '' }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[styles.grid, { gap: spacing.sm }]}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <View
            key={option.value}
            style={[
              styles.chipWrapper,
              {
                borderRadius: radius.md,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => onChange(option.value)}
              disabled={disabled}
              hitSlop={6}
              android_ripple={{ color: 'rgba(102, 192, 244, 0.2)' }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${accessibilityPrefix}${option.label}`}
              style={({ pressed }) => [
                styles.chip,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 2,
                  backgroundColor: isSelected
                    ? colors.primary + '28'
                    : pressed
                    ? colors.cardPressed
                    : colors.surface,
                },
              ]}
            >
              <AppText
                variant="body"
                numberOfLines={1}
                style={{
                  color: isSelected ? colors.primary : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                }}
              >
                {option.label}
              </AppText>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chipWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
