import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

// Packaged at 1x/2x/3x (26/52/78px) so the pixel art is never scaled and stays crisp
const STAR_IMAGE = require('../../assets/brand/gamestar-star.png');
const STAR_SIZE = 26;

/**
 * App mark used as a header title: the pixel star followed by the app name.
 */
export default function HeaderLogo({ title = 'Gamestar' }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[styles.row, { gap: spacing.sm }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={title}
    >
      <Image source={STAR_IMAGE} style={styles.star} />
      <AppText variant="title" style={[styles.title, { color: colors.text }]}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    width: STAR_SIZE,
    height: STAR_SIZE,
  },
  title: {
    fontWeight: '700',
  },
});
