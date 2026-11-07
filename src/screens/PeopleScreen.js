import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
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

export default function PeopleScreen({ navigation }) {
  const { userId } = useAuth();
  const { colors, spacing, radius } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounced so typing does not fire one request per keystroke
  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await searchProfiles(searchQuery);
        if (!isCancelled) setProfiles(results.filter((profile) => profile.id !== userId));
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
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TextField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nome ou @usuário"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar pessoas"
        />
      </View>

      {isLoading ? <LoadingState message="Procurando jogadores..." /> : null}
      {!isLoading && error ? <ErrorState message={error} /> : null}

      {!isLoading && !error ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('Profile', { userId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${item.display_name || item.username}`}
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
              <Avatar profile={item} />
              <View style={styles.flex}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {item.display_name || item.username}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  @{item.username}
                  {item.bio ? ` · ${item.bio}` : ''}
                </AppText>
              </View>
            </Pressable>
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
    borderWidth: 1,
  },
});
