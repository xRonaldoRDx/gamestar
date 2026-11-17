import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Pill-style tab switcher shown at the top of a screen (Feed, People).
 * `tabs` is a list of { key, label }.
 */
export default function SegmentedTabs({ tabs, activeTab, onSelectTab, accessibilityPrefix = '' }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.xs,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelectTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${accessibilityPrefix}${tab.label}`}
            style={({ pressed }) => [
              styles.tabButton,
              {
                backgroundColor: isSelected ? colors.primary : 'transparent',
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText variant="subtitle" tone={isSelected ? 'inverse' : 'muted'} style={styles.tabLabel}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontWeight: '700',
  },
});
