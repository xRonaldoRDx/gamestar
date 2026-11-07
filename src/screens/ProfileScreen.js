import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
  buildCacheBustedAvatarUrl,
  followUser,
  getProfile,
  getProfileStats,
  isFollowing,
  unfollowUser,
  uploadProfileAvatar,
} from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const UPLOAD_ERROR_MESSAGE = 'Não foi possível enviar a imagem. Tente novamente.';
const DEFAULT_STATS = { total: 0, completed: 0, followers: 0, following: 0 };

function mapProfileToViewModel(rawProfile = {}) {
  const resolvedUri = buildCacheBustedAvatarUrl(rawProfile?.avatarUrl ?? rawProfile?.avatar_url);
  return {
    ...rawProfile,
    displayName: rawProfile?.displayName ?? rawProfile?.display_name ?? '',
    display_name: rawProfile?.display_name ?? rawProfile?.displayName ?? '',
    avatarUrl: resolvedUri,
    avatar_url: resolvedUri,
  };
}

export default function ProfileScreen({ route, navigation }) {
  const { userId: currentUserId, signOut, reloadProfile, updateAuthProfile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const userId = route?.params?.userId ?? currentUserId;
  const isOwnProfile = userId === currentUserId;

  const [statusFilter, setStatusFilter] = useState(null);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const { data, setData, isLoading, isRefreshing, error, refresh } = useFocusLoader(async () => {
    if (!userId) return null;

    const [profile, stats, library, following] = await Promise.all([
      getProfile(userId),
      getProfileStats(userId),
      getUserLibrary(userId),
      isOwnProfile ? false : isFollowing(currentUserId, userId),
    ]);

    return {
      profile: mapProfileToViewModel(profile),
      stats: stats ?? DEFAULT_STATS,
      library: Array.isArray(library) ? library : [],
      following: Boolean(following),
    };
  }, [userId, currentUserId, isOwnProfile]);

  useLayoutEffect(() => {
    if (data?.profile?.username && !isOwnProfile) {
      navigation.setOptions({ title: `@${data.profile.username}` });
    }
  }, [navigation, data?.profile?.username, isOwnProfile]);

  async function handleSelectAvatar() {
    if (!isOwnProfile || isUploadingAvatar) return;
    setAvatarError('');

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        const permissionMessage = 'Permita o acesso à galeria para alterar sua foto.';
        setAvatarError(permissionMessage);
        Alert.alert('Permissão necessária', permissionMessage);
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      setIsUploadingAvatar(true);
      const updatedProfile = await uploadProfileAvatar(currentUserId, pickerResult.assets[0]);
      const uri = buildCacheBustedAvatarUrl(
        updatedProfile.avatarUrl ?? updatedProfile.avatar_url,
        Date.now()
      );

      const nextProfile = {
        ...(data?.profile ?? {}),
        ...updatedProfile,
        avatarUrl: uri,
        avatar_url: uri,
      };

      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: nextProfile,
            }
          : prev
      );
      updateAuthProfile(nextProfile);
      await reloadProfile();
    } catch (err) {
      const friendlyMessage = toFriendlyMessage(err, UPLOAD_ERROR_MESSAGE);
      setAvatarError(friendlyMessage);
      Alert.alert('Erro no upload', friendlyMessage);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleToggleFollow() {
    if (!data) return;
    setIsTogglingFollow(true);
    const wasFollowing = Boolean(data.following);

    try {
      if (wasFollowing) await unfollowUser(currentUserId, userId);
      else await followUser(userId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              following: !wasFollowing,
              stats: {
                ...(prev.stats ?? DEFAULT_STATS),
                followers: (prev.stats?.followers ?? 0) + (wasFollowing ? -1 : 1),
              },
            }
          : prev
      );
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

  if (error && !data) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (isLoading || !data || !data.profile) {
    return <LoadingState message="Carregando perfil..." />;
  }

  const {
    profile: userProfile,
    stats = DEFAULT_STATS,
    library,
    following = false,
  } = data;

  const safeLibrary = Array.isArray(library) ? library : [];
  const visibleEntries = statusFilter
    ? safeLibrary.filter((entry) => entry?.status === statusFilter)
    : safeLibrary;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <Pressable
          disabled={!isOwnProfile || isUploadingAvatar}
          onPress={handleSelectAvatar}
          accessibilityRole={isOwnProfile ? 'button' : undefined}
          accessibilityLabel={isOwnProfile ? 'Alterar foto de perfil' : undefined}
          style={styles.avatarContainer}
        >
          <Avatar profile={userProfile} size={72} />
          {isOwnProfile ? (
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                  borderRadius: radius.pill,
                },
              ]}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.background} />
              )}
            </View>
          ) : null}
        </Pressable>

        <View style={styles.flex}>
          <AppText variant="title">
            {userProfile.displayName || userProfile.display_name || userProfile.username}
          </AppText>
          <AppText variant="body" tone="muted">
            @{userProfile.username}
          </AppText>
        </View>
      </View>

      {avatarError ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {avatarError}
        </AppText>
      ) : null}

      {userProfile.bio ? <AppText variant="body">{userProfile.bio}</AppText> : null}

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

      {isOwnProfile && userProfile.is_admin ? (
        <Button label="Painel do administrador" onPress={() => navigation.navigate('Admin')} />
      ) : null}

      {isOwnProfile ? (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Button
            label="Editar perfil"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile', { profile: userProfile })}
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
      keyExtractor={(item, index) => (item?.id ? String(item.id) : `entry-${index}`)}
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
  avatarContainer: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
