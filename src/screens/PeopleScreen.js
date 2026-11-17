import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import KeyboardAwareView from '../components/KeyboardAwareView';
import { useFocusEffect } from '@react-navigation/native';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SegmentedTabs from '../components/SegmentedTabs';
import TextField from '../components/TextField';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { getFollowerProfiles, getFollowingProfiles, searchProfiles } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const SEARCH_DEBOUNCE_MS = 350;

const PEOPLE_TAB = {
  FOLLOWING: 'following',
  FOLLOWERS: 'followers',
};

const EMPTY_TAB_STATE = {
  [PEOPLE_TAB.FOLLOWING]: {
    badge: 'NINGUÉM AINDA',
    title: 'Você ainda não segue ninguém',
    description: 'Busque jogadores pelo nome ou @usuário no campo acima e siga quem você conhece.',
  },
  [PEOPLE_TAB.FOLLOWERS]: {
    badge: 'NINGUÉM AINDA',
    title: 'Ninguém segue você ainda',
    description: 'Registre seus jogos e avaliações: quem curtir seu perfil pode começar a seguir você.',
  },
};

function UserCard({ profile, onPress }) {
  const { colors, spacing, radius } = useTheme();
  const displayName = profile?.display_name?.trim() || profile?.username || 'Jogador';
  const username = profile?.username || 'usuario';
  const bio = profile?.bio?.trim() || '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${displayName}`}
      style={({ pressed }) => [
        styles.row,
        {
          gap: spacing.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.cardPressed : colors.card,
        },
      ]}
    >
      <Avatar profile={profile} size={44} />
      <View style={styles.flex}>
        <AppText variant="subtitle" numberOfLines={1}>
          {displayName}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          @{username}
          {bio ? ` · ${bio}` : ''}
        </AppText>
      </View>
    </Pressable>
  );
}

// Searches every user while the field has text; returns null while the field is empty
function useProfileSearch(searchQuery, userId) {
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults(null);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    let isCancelled = false;
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      setSearchError('');
      try {
        const profiles = await searchProfiles(trimmedQuery);
        if (!isCancelled) {
          setResults(profiles.filter((profile) => Boolean(profile?.id) && profile.id !== userId));
        }
      } catch (err) {
        if (!isCancelled) setSearchError(toFriendlyMessage(err, 'Não foi possível buscar usuários.'));
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, userId]);

  return { results, isSearching, searchError };
}

export default function PeopleScreen({ navigation }) {
  const { userId } = useAuth();
  const { colors, spacing } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(PEOPLE_TAB.FOLLOWING);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
      };
    }, [])
  );

  // Both lists load together so each tab can show its count; reloaded on focus
  // because following someone happens on their profile screen
  const {
    data: connections,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useFocusLoader(async () => {
    const [following, followers] = await Promise.all([
      getFollowingProfiles(userId),
      getFollowerProfiles(userId),
    ]);
    return { following, followers };
  }, [userId]);

  const { results: searchResults, isSearching, searchError } = useProfileSearch(searchQuery, userId);
  const isSearchMode = searchResults !== null || isSearching;

  const handlePressProfile = useCallback(
    (profile) => navigation.navigate('Profile', { userId: profile.id }),
    [navigation]
  );

  const tabs = [
    {
      key: PEOPLE_TAB.FOLLOWING,
      label: connections ? `Seguindo (${connections.following.length})` : 'Seguindo',
    },
    {
      key: PEOPLE_TAB.FOLLOWERS,
      label: connections ? `Seguidores (${connections.followers.length})` : 'Seguidores',
    },
  ];

  function renderContent() {
    if (isSearchMode) {
      if (isSearching) return <LoadingState message="Procurando jogadores..." />;
      if (searchError) return <ErrorState message={searchError} />;
      return (
        <ProfileList
          profiles={searchResults}
          onPressProfile={handlePressProfile}
          header={
            <AppText variant="caption" tone="muted" style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>
              RESULTADOS PARA "{searchQuery.trim().toUpperCase()}"
            </AppText>
          }
          emptyState={
            <EmptyState
              badge="NINGUÉM AQUI"
              title="Nenhum jogador encontrado"
              description={`Ninguém com "${searchQuery.trim()}" no nome ou @usuário.`}
            />
          }
        />
      );
    }

    if (isLoading) return <LoadingState message="Carregando suas conexões..." />;
    if (error && !connections) return <ErrorState message={error} onRetry={refresh} />;

    const profiles = activeTab === PEOPLE_TAB.FOLLOWING ? connections.following : connections.followers;
    const emptyTabState = EMPTY_TAB_STATE[activeTab];

    return (
      <ProfileList
        profiles={profiles}
        onPressProfile={handlePressProfile}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        header={
          <View style={{ marginBottom: spacing.md }}>
            <SegmentedTabs
              tabs={tabs}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              accessibilityPrefix="Mostrar "
            />
          </View>
        }
        emptyState={
          <EmptyState
            badge={emptyTabState.badge}
            title={emptyTabState.title}
            description={emptyTabState.description}
          />
        }
      />
    );
  }

  return (
    <KeyboardAwareView
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TextField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nome ou @usuário"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          returnKeyType="search"
          accessibilityLabel="Buscar pessoas"
        />
      </View>

      {renderContent()}
    </KeyboardAwareView>
  );
}

function ProfileList({ profiles, onPressProfile, header, emptyState, refreshControl }) {
  const { spacing } = useTheme();

  return (
    <FlatList
      data={profiles}
      keyExtractor={(item, index) => (item?.id ? String(item.id) : `profile-${index}`)}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyState}
      renderItem={({ item }) => <UserCard profile={item} onPress={() => onPressProfile(item)} />}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});
