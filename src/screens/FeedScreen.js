import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import ActivityCard from '../components/ActivityCard';
import EmptyState from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { getActivityFeed } from '../services/library';
import { useTheme } from '../theme/ThemeProvider';

export default function FeedScreen({ navigation }) {
  const { userId } = useAuth();
  const { colors, spacing } = useTheme();

  const { data, isLoading, isRefreshing, error, refresh } = useFocusLoader(
    () => getActivityFeed(userId),
    [userId]
  );

  if (isLoading) return <LoadingState message="Carregando atividades..." />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={data}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
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
