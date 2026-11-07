import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import ActivityCard from '../components/ActivityCard';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import GameCover from '../components/GameCover';
import { isValidRating } from '../components/RatingLabel';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { GAME_SOURCE_LABEL, getGameById, importIgdbGame, isGameStale } from '../services/games';
import { getGameReviews } from '../services/library';
import { useTheme } from '../theme/ThemeProvider';

const SUMMARY_PREVIEW_LINES = 4;

function computeAverageRating(reviews) {
  const validRatings = reviews
    .map((review) => review.rating)
    .filter((rating) => isValidRating(rating));

  if (validRatings.length === 0) return null;
  return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
}

export default function GameDetailsScreen({ route, navigation }) {
  const { userId } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const { gameId } = route.params;
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const { data, setData, isLoading, isRefreshing, error, refresh } = useFocusLoader(async () => {
    const [game, reviews] = await Promise.all([getGameById(gameId), getGameReviews(gameId)]);
    return { game, reviews };
  }, [gameId]);

  useLayoutEffect(() => {
    if (data?.game) navigation.setOptions({ title: data.game.title });
  }, [navigation, data?.game]);

  const isStale = data?.game ? isGameStale(data.game) : false;
  useEffect(() => {
    if (!isStale) return;
    importIgdbGame(data.game.igdb_id)
      .then((freshGame) => setData((current) => ({ ...current, game: freshGame })))
      .catch((err) => console.warn('[GameDetails] Background refresh failed:', err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStale]);

  if (isLoading) return <LoadingState message="Carregando jogo..." />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  const { game, reviews } = data;
  const ownEntry = reviews.find((review) => review.user_id === userId);
  const communityReviews = reviews.filter((review) => review.user_id !== userId);
  const averageRating = computeAverageRating(reviews);
  const completedCount = reviews.filter((review) => review.status === 'completed').length;
  const criticRating =
    typeof game.critic_rating === 'number'
      ? game.critic_rating
      : game.critic_rating != null
      ? Number(game.critic_rating)
      : null;

  const openForm = () => navigation.navigate('GameForm', { game, entry: ownEntry });

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <View style={[styles.hero, { gap: spacing.md }]}>
        <GameCover uri={game.cover_url} width={120} />
        <View style={[styles.flex, { gap: spacing.xs }]}>
          <AppText variant="title">{game.title}</AppText>
          <AppText variant="body" tone="muted">
            {[game.release_year, game.developer].filter(Boolean).join(' · ') || 'Sem informações extras'}
          </AppText>
          {game.genres ? (
            <AppText variant="caption" tone="muted">
              {game.genres}
            </AppText>
          ) : null}
          {game.platforms ? (
            <AppText variant="caption" tone="primary">
              {game.platforms}
            </AppText>
          ) : null}
          <Badge label={GAME_SOURCE_LABEL[game.source] ?? game.source} tone="neutral" />
        </View>
      </View>

      {game.summary ? (
        <Pressable
          onPress={() => setIsSummaryExpanded((expanded) => !expanded)}
          accessibilityRole="button"
          accessibilityLabel={isSummaryExpanded ? 'Recolher descrição' : 'Expandir descrição'}
        >
          <AppText
            variant="body"
            tone="muted"
            numberOfLines={isSummaryExpanded ? undefined : SUMMARY_PREVIEW_LINES}
          >
            {game.summary}
          </AppText>
          <AppText variant="caption" tone="primary">
            {isSummaryExpanded ? 'Ver menos' : 'Ver mais'}
          </AppText>
        </Pressable>
      ) : null}

      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.sm,
          },
        ]}
      >
        <StatItem label="Jogadores" value={reviews.length} />
        <StatItem label="Zeraram" value={completedCount} />
        <StatItem
          label="Comunidade"
          value={isValidRating(averageRating) ? `★ ${averageRating.toFixed(1)}` : '—'}
        />
        <StatItem
          label="Crítica"
          value={isValidRating(criticRating) ? `★ ${criticRating.toFixed(1)}` : '—'}
        />
      </View>

      {ownEntry ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted" style={styles.sectionTitle}>
            SUA AVALIAÇÃO
          </AppText>
          <ActivityCard
            entry={ownEntry}
            showGame={false}
            onPressProfile={() => navigation.navigate('Profile', { userId })}
          />
          <Button label="Editar minha avaliação" variant="secondary" onPress={openForm} />
        </View>
      ) : (
        <Button label="+ Adicionar à minha lista" onPress={openForm} />
      )}

      <AppText variant="caption" tone="muted" style={[styles.sectionTitle, { marginTop: spacing.sm }]}>
        COMUNIDADE ({communityReviews.length})
      </AppText>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={communityReviews}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderItem={({ item }) => (
        <ActivityCard
          entry={item}
          showGame={false}
          onPressProfile={() => navigation.navigate('Profile', { userId: item.user_id })}
        />
      )}
      ListEmptyComponent={
        <AppText variant="body" tone="muted">
          Ninguém mais registrou este jogo ainda.
        </AppText>
      }
    />
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <AppText variant="subtitle" tone="primary">
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statsBar: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});
