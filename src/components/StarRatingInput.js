import React, { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { useTheme } from '../theme/ThemeProvider';

const STARS = [1, 2, 3, 4, 5];

/**
 * Componente interativo de avaliação (0.0 a 5.0 em passos de 0.5) via toque e arraste (Swipe to Rate).
 * Construído manualmente com PanResponder nativo e @expo/vector-icons, sem bibliotecas externas.
 */
export default function StarRatingInput({
  value = 0,
  onChange,
  disabled = false,
  label = 'Sua Nota',
}) {
  const { colors, spacing, radius } = useTheme();
  const numericValue = Math.max(0, Math.min(5, Number(value) || 0));

  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  }, [onChange, disabled]);

  function calcularNotaPorPosicaoX(posX) {
    if (disabledRef.current || !onChangeRef.current) return;

    const largura = trackWidthRef.current;
    if (!largura || largura <= 0) return;

    const xLimitado = Math.max(0, Math.min(largura, posX));
    const proporcao = xLimitado / largura;

    // Converte a proporção horizontal (0..1) para a escala 0..5 em incrementos de 0.5
    const notaCalculada = Math.round(proporcao * 5 * 2) / 2;
    const notaFinal = Math.max(0, Math.min(5, notaCalculada));

    onChangeRef.current(notaFinal);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        startXRef.current = touchX;
        calcularNotaPorPosicaoX(touchX);
      },
      onPanResponderMove: (_evt, gestureState) => {
        const currentX = startXRef.current + gestureState.dx;
        calcularNotaPorPosicaoX(currentX);
      },
    })
  ).current;

  function obterIconeEstrela(starNumber) {
    if (numericValue >= starNumber) {
      return 'star';
    }
    if (numericValue >= starNumber - 0.5) {
      return 'star-half';
    }
    return 'star-outline';
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {/* Cabeçalho da seção com título à esquerda e nota visível à direita (sem overflow) */}
      <View style={styles.sectionHeaderRow}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.sectionTitle}>
          {label}
        </AppText>

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
            {numericValue.toFixed(1)} / 5.0
          </AppText>
        </View>
      </View>

      {/* Container interativo das estrelas com PanResponder */}
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
          accessibilityLabel={`Nota atual ${numericValue.toFixed(1)} de 5 estrelas. Toque ou arraste horizontalmente para alterar.`}
          style={styles.starsTrack}
        >
          {/* pointerEvents="none" garante que locationX seja sempre relativo à trilha inteira */}
          <View pointerEvents="none" style={styles.starsRow}>
            {STARS.map((starNumber) => {
              const iconName = obterIconeEstrela(starNumber);
              const isFilled = numericValue >= starNumber - 0.5;

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
