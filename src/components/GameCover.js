import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

// IGDB box art (t_cover_big) is portrait, 264x374
const COVER_ASPECT_RATIO = 264 / 374;

/**
 * expo-image keeps covers in a memory + disk cache, so lists do not
 * re-download images while scrolling.
 */
export default function GameCover({ uri, width = 64, style }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.box,
        {
          width,
          height: Math.round(width / COVER_ASPECT_RATIO),
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <AppText variant="caption" tone="primary" style={styles.placeholder}>
          GAME
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
