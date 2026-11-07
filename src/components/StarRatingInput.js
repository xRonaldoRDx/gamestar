import React, { useEffect, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { isValidRating } from './RatingLabel';
import { useTheme } from '../theme/ThemeProvider';

const STAR_INDICES = [1, 2, 3, 4, 5];

export default function StarRatingInput({
  value = null,
  onChange,
  disabled = false,
  label = 'Sua Nota',
}) {
  const { colors, spacing, radius } = useTheme();
  const hasNumericRating = isValidRating(value);
  const clampedValue = hasNumericRating ? Math.max(0, Math.min(5, value)) : 0;

  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  }, [onChange, disabled]);

  function updateRatingFromTouchX(touchX) {
    if (disabledRef.current || !onChangeRef.current) return;

    const trackWidth = trackWidthRef.current;
    if (!trackWidth || trackWidth <= 0) return;

    const clampedX = Math.max(0, Math.min(trackWidth, touchX));
    const ratio = clampedX / trackWidth;
    const steppedRating = Math.round(ratio * 5 * 2) / 2;
    const finalRating = Math.max(0, Math.min(5, steppedRating));

    onChangeRef.current(finalRating);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        const touchX = event.nativeEvent.locationX;
        startXRef.current = touchX;
        updateRatingFromTouchX(touchX);
      },
      onPanResponderMove: (_event, gestureState) => {
        const currentX = startXRef.current + gestureState.dx;
        updateRatingFromTouchX(currentX);
      },
    })
  ).current;

  function getStarIconName(starNumber) {
    if (!hasNumericRating) {
      return 'star-outline';
    }
    if (clampedValue >= starNumber) {
      return 'star';
    }
    if (clampedValue >= starNumber - 0.5) {
      return 'star-half';
    }
    return 'star-outline';
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.sectionHeaderRow}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.sectionTitle}>
          {label}
        </AppText>

        <View style={styles.badgeActionsRow}>
          {hasNumericRating && onChange ? (
            <Pressable
              onPress={() => onChange(null)}
              disabled={disabled}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Limpar nota"
            >
              <AppText variant="caption" tone="muted">
                Limpar
              </AppText>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.scoreBadge,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.sm + 2,
                paddingVertical: 2,
              },
            ]}
          >
            <AppText
              variant="subtitle"
              tone="primary"
              numberOfLines={1}
              style={styles.scoreText}
            >
              {hasNumericRating ? `${clampedValue.toFixed(1)} / 5.0` : 'Sem nota'}
            </AppText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            gap: spacing.xs,
          },
        ]}
      >
        <View
          onLayout={(event) => {
            trackWidthRef.current = event.nativeEvent.layout.width;
          }}
          {...panResponder.panHandlers}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={
            hasNumericRating
              ? `Nota atual ${clampedValue.toFixed(1)} de 5 estrelas. Toque ou arraste horizontalmente para alterar.`
              : 'Sem nota atribuída. Toque ou arraste horizontalmente para avaliar.'
          }
          style={styles.starsTrack}
        >
          <View pointerEvents="none" style={styles.starsRow}>
            {STAR_INDICES.map((starNumber) => {
              const iconName = getStarIconName(starNumber);
              const isFilled = hasNumericRating && clampedValue >= starNumber - 0.5;

              return (
                <View key={starNumber} style={styles.starWrapper}>
                  <Ionicons
                    name={iconName}
                    size={40}
                    color={isFilled ? colors.warning : colors.textMuted}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <AppText
          variant="caption"
          tone="muted"
          numberOfLines={1}
          style={styles.helperText}
        >
          Toque ou deslize o dedo sobre as estrelas para avaliar
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
  },
  badgeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreBadge: {
    borderWidth: 1,
    flexShrink: 0,
  },
  scoreText: {
    fontWeight: '800',
  },
  container: {
    borderWidth: 1,
    alignItems: 'center',
  },
  starsTrack: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  starWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    textAlign: 'center',
  },
});
