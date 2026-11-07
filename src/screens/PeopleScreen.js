import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import TextField from '../components/TextField';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { searchProfiles } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const SEARCH_DEBOUNCE_MS = 350;

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

export default function PeopleScreen({ navigation }) {
  const { userId } = useAuth();
  const { colors, spacing } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
      };
    }, [])
  );

  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await searchProfiles(searchQuery);
        if (!isCancelled) {
          const safeResults = Array.isArray(results) ? results : [];
          setProfiles(
            safeResults.filter((profile) => Boolean(profile?.id) && profile.id !== userId)
          );
        }
      } catch (err) {
        if (!isCancelled) setError(toFriendlyMessage(err, 'Não foi possível buscar usuários.'));
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, userId]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

      {isLoading ? <LoadingState message="Procurando jogadores..." /> : null}
      {!isLoading && error ? <ErrorState message={error} /> : null}

      {!isLoading && !error ? (
        <FlatList
          data={profiles}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `profile-${index}`)}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <UserCard
              profile={item}
              onPress={() => navigation.navigate('Profile', { userId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              badge="NINGUÉM AQUI"
              title="Nenhum jogador encontrado"
              description={
                searchQuery
                  ? `Ninguém com "${searchQuery}" no nome.`
                  : 'Chame seus amigos para criar uma conta no Gamestar!'
              }
            />
          }
        />
      ) : null}
    </KeyboardAvoidingView>
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
});
