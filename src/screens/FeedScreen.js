import React, { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { getActivityFeed } from '../services/library';
import { buildCacheBustedAvatarUrl } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

export default function FeedScreen({ navigation }) {
  const { userId, profile: currentUserProfile } = useAuth();
  const { colors, spacing } = useTheme();

  const [entries, setEntries] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedOnce = useRef(false);

  const fetchFeed = useCallback(
    async (mode = 'focus') => {
      if (!userId) return;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else if (!hasLoadedOnce.current) {
        setIsLoading(true);
      }
      setError('');

      try {
        const feedEntries = await getActivityFeed(userId);
        setEntries(Array.isArray(feedEntries) ? feedEntries : []);
        hasLoadedOnce.current = true;
      } catch (err) {
        setError(toFriendlyMessage(err, 'Não foi possível carregar o feed.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchFeed('focus');
    }, [fetchFeed])
  );

  if (error && !entries) {
    return <ErrorState message={error} onRetry={() => fetchFeed('refresh')} />;
  }

  if (isLoading || !entries) {
    return <LoadingState message="Carregando atividades..." />;
  }

  const synchronizedEntries = entries.map((entry) => {
    const isCurrentUserEntry = entry.user_id === userId && Boolean(currentUserProfile);
    if (!isCurrentUserEntry) {
      return entry;
    }

    const latestAvatarUri = buildCacheBustedAvatarUrl(
      currentUserProfile.avatarUrl ?? currentUserProfile.avatar_url
    );

    return {
      ...entry,
      profile: {
        ...entry.profile,
        ...currentUserProfile,
        avatarUrl: latestAvatarUri,
        avatar_url: latestAvatarUri,
      },
    };
  });

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={synchronizedEntries}
      keyExtractor={(item, index) => (item?.id ? String(item.id) : `feed-${index}`)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchFeed('refresh')}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <ActivityCard
          entry={item}
          onPressProfile={() => navigation.navigate('Profile', { userId: item.user_id })}
          onPressGame={() => navigation.navigate('GameDetails', { gameId: item.game_id })}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          badge="FEED VAZIO"
          title="Nada por aqui ainda"
          description="Adicione jogos à sua lista e siga outros jogadores para ver o que eles estão jogando."
          actionLabel="Encontrar jogadores"
          onActionPress={() => navigation.navigate('PeopleTab')}
        />
      }
    />
  );
}
