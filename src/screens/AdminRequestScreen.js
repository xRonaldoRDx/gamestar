import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import GameSearchResults from '../components/GameSearchResults';
import TextField from '../components/TextField';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useGamesSearch } from '../hooks/useGamesSearch';
import { importIgdbGame } from '../services/games';
import { resolveGameRequests } from '../services/requests';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Resolves a group of requests for the same title: link it to a catalog/IGDB
 * game, add it by hand, or reject it.
 */
export default function AdminRequestScreen({ route, navigation }) {
  const { colors, spacing, radius } = useTheme();
  const { group } = route.params;
  const requestIds = group.requests.map((request) => request.id);

  const {
    searchQuery,
    setSearchQuery,
    isLoading,
    catalogGames,
    igdbGames,
    error,
    igdbWarning,
    searchGames,
  } = useGamesSearch(group.title);
  const [importingIgdbId, setImportingIgdbId] = useState(null);

  // Starts with the requested title so the admin usually only has to pick a result
  useEffect(() => {
    searchGames(group.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveWithGame(gameId) {
    await resolveGameRequests(requestIds, { status: 'approved', gameId });
    navigation.goBack();
  }

  function confirmApproval(game, importGame) {
    Alert.alert('Aprovar pedido', `Vincular o pedido "${group.title}" ao jogo "${game.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprovar',
        onPress: async () => {
          try {
            const catalogGame = await importGame();
            await approveWithGame(catalogGame.id);
          } catch (err) {
            setImportingIgdbId(null);
            Alert.alert('Erro', toFriendlyMessage(err, err.message));
          }
        },
      },
    ]);
  }

  function confirmRejection() {
    Alert.alert('Recusar pedido', `Recusar o pedido "${group.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: async () => {
          try {
            await resolveGameRequests(requestIds, { status: 'rejected' });
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erro', toFriendlyMessage(err, 'Não foi possível recusar.'));
          }
        },
      },
    ]);
  }

  const notes = group.requests.filter((request) => request.note || request.platform);

  const header = (
    <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
      <View
        style={[
          styles.infoBox,
          {
            gap: spacing.xs,
            padding: spacing.md,
            borderRadius: radius.md,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <AppText variant="subtitle">{group.title}</AppText>
        <AppText variant="caption" tone="muted">
          Pedido por {group.requests.map((request) => `@${request.requester?.username}`).join(', ')}
        </AppText>
        {notes.map((request) => (
          <AppText key={request.id} variant="body" tone="muted">
            • {[request.platform, request.note].filter(Boolean).join(' — ')}
          </AppText>
        ))}
      </View>

      <View style={[styles.row, { gap: spacing.sm }]}>
        <TextField
          style={styles.flex}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => searchGames()}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar jogo para este pedido"
        />
        <Button label="Buscar" onPress={() => searchGames()} disabled={isLoading} />
      </View>

      {igdbWarning ? (
        <AppText variant="caption" tone="warning">
          Catálogo IGDB indisponível: {igdbWarning}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        Toque no jogo certo para aprovar o pedido.
      </AppText>
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
      <Button
        label="Não está na IGDB: cadastrar manualmente"
        variant="secondary"
        onPress={() => navigation.navigate('NewGame', { title: group.title, requestIds })}
      />
      <Button label="Recusar pedido" variant="ghost" onPress={confirmRejection} />
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {isLoading ? <LoadingState message="Procurando jogos..." /> : null}
      {!isLoading && error ? <ErrorState message={error} /> : null}
      {!isLoading && !error ? (
        <GameSearchResults
          catalogGames={catalogGames}
          igdbGames={igdbGames}
          importingIgdbId={importingIgdbId}
          onPressCatalogGame={(game) => confirmApproval(game, async () => game)}
          onPressIgdbGame={(game) =>
            confirmApproval(game, () => {
              setImportingIgdbId(game.igdb_id);
              return importIgdbGame(game.igdb_id);
            })
          }
          ListHeaderComponent={header}
          ListFooterComponent={footer}
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
    alignItems: 'flex-start',
  },
  infoBox: {
    borderWidth: 1,
  },
});
