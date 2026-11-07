import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import KeyboardAwareView from '../components/KeyboardAwareView';
import { useFocusEffect } from '@react-navigation/native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import GameSearchResults from '../components/GameSearchResults';
import TextField from '../components/TextField';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useGamesSearch } from '../hooks/useGamesSearch';
import { importIgdbGame } from '../services/games';
import { useTheme } from '../theme/ThemeProvider';

export default function SearchScreen({ navigation }) {
  const { colors, spacing } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    isLoading,
    catalogGames,
    igdbGames,
    error,
    igdbWarning,
    hasSearched,
    searchGames,
    resetSearch,
  } = useGamesSearch();
  const [importingIgdbId, setImportingIgdbId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetSearch();
      };
    }, [resetSearch])
  );

  async function handleOpenIgdbGame(igdbGame) {
    setImportingIgdbId(igdbGame.igdb_id);
    try {
      const game = await importIgdbGame(igdbGame.igdb_id);
      navigation.navigate('GameDetails', { gameId: game.id });
    } catch (err) {
      Alert.alert('Não foi possível abrir', err.message);
    } finally {
      setImportingIgdbId(null);
    }
  }

  const hasResults = catalogGames.length > 0 || igdbGames.length > 0;

  function getFooterMessage() {
    if (!hasSearched) {
      return 'Busque jogos de qualquer plataforma: PC, consoles, mobile e clássicos.';
    }
    return hasResults
      ? 'Não achou o jogo? Peça para adicionarmos.'
      : `Nenhum resultado para "${searchQuery}". Peça para adicionarmos.`;
  }

  return (
    <KeyboardAwareView
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.searchBar,
          { padding: spacing.md, gap: spacing.sm, borderBottomColor: colors.border },
        ]}
      >
        <TextField
          style={styles.flex}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => searchGames()}
          placeholder="Digite o título do jogo..."
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          accessibilityLabel="Buscar jogo"
        />
        <Button label="Buscar" onPress={() => searchGames()} disabled={isLoading} />
      </View>

      {isLoading ? <LoadingState message="Procurando jogos..." /> : null}
      {!isLoading && error ? <ErrorState title="Não foi possível buscar" message={error} /> : null}

      {!isLoading && !error ? (
        <GameSearchResults
          catalogGames={catalogGames}
          igdbGames={igdbGames}
          importingIgdbId={importingIgdbId}
          onPressCatalogGame={(game) => navigation.navigate('GameDetails', { gameId: game.id })}
          onPressIgdbGame={handleOpenIgdbGame}
          ListHeaderComponent={
            igdbWarning ? (
              <AppText variant="caption" tone="warning" style={{ marginBottom: spacing.sm }}>
                Catálogo IGDB indisponível: {igdbWarning}
              </AppText>
            ) : null
          }
          ListFooterComponent={
            <View style={[styles.footer, { marginTop: spacing.lg, gap: spacing.sm }]}>
              <AppText variant="body" tone="muted" style={styles.centerText}>
                {getFooterMessage()}
              </AppText>
              <Button
                label="Pedir um jogo"
                variant="secondary"
                onPress={() => navigation.navigate('RequestGame', { title: searchQuery })}
              />
              <AppText variant="caption" tone="muted">
                Dados de jogos fornecidos pela IGDB.com
              </AppText>
            </View>
          }
        />
      ) : null}
    </KeyboardAwareView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  footer: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
