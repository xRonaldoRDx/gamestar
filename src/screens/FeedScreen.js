import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import ActivityCard from '../components/ActivityCard';
import AppText from '../components/AppText';
import EmptyState from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useFeedViewModel } from '../hooks/useFeedViewModel';
import { FEED_TYPE } from '../services/library';
import { useTheme } from '../theme/ThemeProvider';

const FEED_TABS = [
  { key: FEED_TYPE.FOLLOWING, label: 'Following' },
  { key: FEED_TYPE.TRENDING, label: 'Trending' },
];

export default function FeedScreen({ navigation }) {
  const { userId, profile: currentUserProfile } = useAuth();
  const { colors, spacing, radius } = useTheme();

  const {
    activeTab,
    entries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isOfflineFallback,
    error,
    handleSelectTab,
    refresh,
    loadNextPage,
  } = useFeedViewModel({ userId, currentUserProfile });

  const handlePressProfile = useCallback(
    (targetUserId) => {
      navigation.navigate('Profile', { userId: targetUserId });
    },
    [navigation]
  );

  const handlePressGame = useCallback(
    (targetGameId) => {
      navigation.navigate('GameDetails', { gameId: targetGameId });
    },
    [navigation]
  );

  const handleNavigatePeopleTab = useCallback(() => {
    navigation.navigate('PeopleTab');
  }, [navigation]);

  const handleNavigateSearchTab = useCallback(() => {
    navigation.navigate('SearchTab');
  }, [navigation]);

  const keyExtractor = useCallback(
    (item, index) => `${item?.id ?? 'feed'}-${index}`,
    []
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ActivityCard
        entry={item}
        onPressProfile={handlePressProfile}
        onPressGame={handlePressGame}
      />
    ),
    [handlePressGame, handlePressProfile]
  );

  const toggleHeader = useMemo(
    () => (
      <View style={{ marginBottom: spacing.md, gap: spacing.xs }}>
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
          {FEED_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSelectTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Alternar para feed ${tab.label}`}
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
                <AppText
                  variant="subtitle"
                  tone={isSelected ? 'inverse' : 'muted'}
                  style={styles.tabLabel}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {isOfflineFallback ? (
          <View
            style={[
              styles.offlineBanner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.warning,
                borderRadius: radius.sm,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" tone="warning">
              Modo offline: exibindo avaliações salvas localmente.
            </AppText>
          </View>
        ) : null}
      </View>
    ),
    [activeTab, colors, handleSelectTab, isOfflineFallback, radius, spacing]
  );

  const listFooter = useMemo(
    () =>
      isLoadingMore ? (
        <View style={{ paddingVertical: spacing.md }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null,
    [colors.primary, isLoadingMore, spacing.md]
  );

  const isFollowingTab = activeTab === FEED_TYPE.FOLLOWING;

  const listEmpty = useMemo(
    () =>
      isFollowingTab ? (
        <EmptyState
          badge="FOLLOWING VAZIO"
          title="Nenhuma avaliação de quem você segue"
          description="Siga outros jogadores para acompanhar as avaliações mais recentes deles ou explore a aba Trending."
          actionLabel="Encontrar jogadores"
          onActionPress={handleNavigatePeopleTab}
        />
      ) : (
        <EmptyState
          badge="TRENDING VAZIO"
          title="Nenhuma avaliação em alta"
          description="Avalie jogos e dê upvote nas melhores análises da comunidade."
          actionLabel="Buscar jogos"
          onActionPress={handleNavigateSearchTab}
        />
      ),
    [handleNavigatePeopleTab, handleNavigateSearchTab, isFollowingTab]
  );

  if (error && !entries) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          {toggleHeader}
        </View>
        <ErrorState message={error} onRetry={refresh} />
      </View>
    );
  }

  if (isLoading || !entries) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          {toggleHeader}
        </View>
        <LoadingState message="Carregando atividades..." />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={entries}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={toggleHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={listEmpty}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      onEndReached={loadNextPage}
      onEndReachedThreshold={0.4}
      removeClippedSubviews={true}
      initialNumToRender={5}
      maxToRenderPerBatch={3}
      updateCellsBatchingPeriod={50}
      windowSize={5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  offlineBanner: {
    borderWidth: 1,
    alignItems: 'center',
  },
});
