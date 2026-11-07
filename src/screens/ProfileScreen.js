import React, { useLayoutEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import GameListItem from '../components/GameListItem';
import StatusFilter from '../components/StatusFilter';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { getUserLibrary } from '../services/library';
import {
  followUser,
  getProfile,
  getProfileStats,
  isFollowing,
  unfollowUser,
} from '../services/profiles';
import { useTheme } from '../theme/ThemeProvider';

export default function ProfileScreen({ route, navigation }) {
  const { userId: currentUserId, signOut } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const userId = route?.params?.userId ?? currentUserId;
  const isOwnProfile = userId === currentUserId;

  const [statusFilter, setStatusFilter] = useState(null);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const { data, setData, isLoading, isRefreshing, error, refresh } = useFocusLoader(async () => {
    const [profile, stats, library, following] = await Promise.all([
      getProfile(userId),
      getProfileStats(userId),
      getUserLibrary(userId),
      isOwnProfile ? false : isFollowing(currentUserId, userId),
    ]);
    return { profile, stats, library, following };
  }, [userId, currentUserId, isOwnProfile]);

  useLayoutEffect(() => {
    if (data?.profile && !isOwnProfile) {
      navigation.setOptions({ title: `@${data.profile.username}` });
    }
  }, [navigation, data?.profile, isOwnProfile]);

  async function handleToggleFollow() {
    setIsTogglingFollow(true);
    const wasFollowing = data.following;
    try {
      if (wasFollowing) await unfollowUser(currentUserId, userId);
      else await followUser(userId);
      // Updates counters locally instead of refetching the whole profile
      setData({
        ...data,
        following: !wasFollowing,
        stats: { ...data.stats, followers: data.stats.followers + (wasFollowing ? -1 : 1) },
      });
    } catch {
      Alert.alert('Ops', 'Não foi possível atualizar. Tente novamente.');
    } finally {
      setIsTogglingFollow(false);
    }
  }

  function handleConfirmSignOut() {
    Alert.alert('Sair da conta', 'Deseja mesmo sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  if (isLoading) return <LoadingState message="Carregando perfil..." />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  const { profile, stats, library, following } = data;
  const visibleEntries = statusFilter
    ? library.filter((entry) => entry.status === statusFilter)
    : library;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <Avatar profile={profile} size={72} />
        <View style={styles.flex}>
          <AppText variant="title">{profile.display_name || profile.username}</AppText>
          <AppText variant="body" tone="muted">
            @{profile.username}
          </AppText>
        </View>
      </View>

      {profile.bio ? <AppText variant="body">{profile.bio}</AppText> : null}

      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <StatItem label="Jogos" value={stats.total} />
        <StatItem label="Zerados" value={stats.completed} />
        <StatItem label="Seguidores" value={stats.followers} />
        <StatItem label="Seguindo" value={stats.following} />
      </View>

      {isOwnProfile && profile.is_admin ? (
        <Button label="Painel do administrador" onPress={() => navigation.navigate('Admin')} />
      ) : null}

      {isOwnProfile ? (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Button
            label="Editar perfil"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile', { profile })}
            style={styles.flex}
          />
          <Button label="Sair" variant="ghost" onPress={handleConfirmSignOut} />
        </View>
      ) : (
        <Button
          label={following ? 'Seguindo ✓' : 'Seguir'}
          variant={following ? 'secondary' : 'primary'}
          onPress={handleToggleFollow}
          disabled={isTogglingFollow}
        />
      )}

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={visibleEntries}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      renderItem={({ item }) => (
        <GameListItem
          entry={item}
          onPress={() => navigation.navigate('GameDetails', { gameId: item.game_id })}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          badge="SEM JOGOS"
          title={statusFilter ? 'Nada nesta categoria' : 'Nenhum jogo ainda'}
          description={
            isOwnProfile
              ? 'Busque um jogo e registre o que você está jogando ou já zerou.'
              : 'Este usuário ainda não registrou jogos aqui.'
          }
        />
      }
    />
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <AppText variant="title" tone="primary">
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
});
