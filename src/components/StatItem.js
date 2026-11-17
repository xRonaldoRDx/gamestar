import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

export default function StatItem({ label, value, onPress, valueVariant = 'title' }) {
  const { colors, radius } = useTheme();

  const content = (
    <>
      <AppText variant={valueVariant} tone="primary">
        {value}
      </AppText>
      <View style={styles.labelRow}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        {onPress ? <Ionicons name="chevron-forward" size={12} color={colors.textMuted} /> : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.item}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${label.toLowerCase()}: ${value}`}
      style={({ pressed }) => [
        styles.item,
        { borderRadius: radius.sm, backgroundColor: pressed ? colors.cardPressed : 'transparent' },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
