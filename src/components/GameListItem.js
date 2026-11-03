import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_TONE = {
  Jogando: 'primary',
  Zerado: 'success',
  Pausado: 'warning',
  'Lista de Desejos': 'neutral',
  Abandonado: 'danger',
  Playing: 'primary',
  Completed: 'success',
  Backlog: 'warning',
  Dropped: 'danger',
};

export default function GameListItem({ item, onPress }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const badgeTone = STATUS_TONE[item.status] || 'warning';

  // Leitura EXCLUSIVA de URI local para não consumir dados de rede na lista
  const hasLocalImage = Boolean(item.cover_uri && item.cover_uri.startsWith('file://'));

  return (
    <View
      style={[
        styles.cardWrapper,
        shadow(2),
        {
          borderRadius: radius.md,
          marginBottom: spacing.sm + 2,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={6}
        android_ripple={{ color: 'rgba(102, 192, 244, 0.15)' }}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${item.title}, ano ${item.release_year || 'N/A'}, nota ${item.rating}, status ${item.status}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? colors.cardPressed : colors.card,
          },
        ]}
      >
        {/* Lado Esquerdo: Miniatura da Capa (Exclusivamente Local ou Placeholder Estético) */}
        <View
          style={[
            styles.coverContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.sm,
            },
          ]}
        >
          {hasLocalImage ? (
            <Image
              source={{ uri: item.cover_uri }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <AppText variant="caption" tone="primary" style={styles.placeholderLogo}>
                GAME
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.placeholderSub}>
                OFFLINE
              </AppText>
            </View>
          )}
        </View>

        {/* Lado Direito: Nome, Ano, Nota e Status */}
        <View style={[styles.infoContainer, { gap: spacing.xs }]}>
          <View style={styles.topRow}>
            <AppText
              variant="subtitle"
              numberOfLines={1}
              style={[styles.gameTitle, { color: colors.text }]}
            >
              {item.title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {item.release_year ? String(item.release_year) : '—'}
            </AppText>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.ratingBadge}>
              <AppText variant="caption" tone="muted">
                NOTA
              </AppText>
              <AppText
                variant="subtitle"
                tone="warning"
                style={styles.ratingNumber}
              >
                {item.rating > 0 ? `★ ${Number(item.rating).toFixed(1)}/5.0` : 'Sem nota'}
              </AppText>
            </View>

            <Badge label={item.status} tone={badgeTone} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minHeight: 88,
  },
  coverContainer: {
    width: 64,
    height: 80,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  placeholderLogo: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placeholderSub: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gameTitle: {
    flex: 1,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  ratingNumber: {
    fontWeight: '700',
  },
});
