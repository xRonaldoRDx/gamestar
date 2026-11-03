import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { useGamesSearch } from '../hooks/useGamesSearch';
import { useTheme } from '../theme/ThemeProvider';

export default function SearchScreen({ navigation }) {
  const {
    searchQuery,
    setSearchQuery,
    isLoading,
    games,
    error,
    hasSearched,
    isMockMode,
    searchGames,
    enableMockMode,
  } = useGamesSearch();

  const { colors, spacing, radius, shadow } = useTheme();

  function handleSearch() {
    Keyboard.dismiss();
    searchGames();
  }

  function handleSelectGame(item) {
    navigation.navigate('GameForm', {
      prefillGame: {
        rawg_id: item.rawg_id,
        title: item.title,
        release_year: item.released,
        remote_cover_url: item.background_image || '',
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          Catálogo de Jogos (busca rápida em texto)
        </AppText>

        <Pressable
          onPress={() => navigation.navigate('GameForm')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar jogo manualmente"
        >
          <AppText variant="caption" tone="primary" style={styles.manualLink}>
            Cadastro Manual →
          </AppText>
        </Pressable>
      </View>

      {isMockMode ? (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: colors.warning + '22',
              borderBottomColor: colors.warning,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
            },
          ]}
        >
          <Badge label="Modo Offline Ativo" tone="warning" />
          <AppText
            variant="caption"
            tone="muted"
            numberOfLines={1}
            style={styles.offlineBannerText}
          >
            Pesquisando na base local de demonstração
          </AppText>
        </View>
      ) : null}

      <View
        style={[
          styles.searchBar,
          {
            padding: spacing.md,
            gap: spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: radius.md,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
            },
          ]}
          placeholder="Digite o título do jogo..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />

        <Button
          label="Buscar"
          onPress={handleSearch}
          disabled={isLoading}
        />
      </View>

      {isLoading ? (
        <View style={[styles.centerBox, { padding: spacing.xl, gap: spacing.sm }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="body" tone="muted">
            Consultando catálogo de jogos...
          </AppText>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={[
            styles.errorBox,
            {
              margin: spacing.md,
              padding: spacing.md,
              borderRadius: radius.md,
              borderColor: colors.danger,
              backgroundColor: colors.danger + '1A',
              gap: spacing.sm,
            },
          ]}
        >
          <AppText variant="subtitle" tone="danger">
            Não foi possível conectar ao servidor de jogos.
          </AppText>

          <AppText variant="body" tone="muted">
            {error}
          </AppText>

          <View
            style={[
              styles.fallbackButtonWrapper,
              shadow(1),
              {
                borderRadius: radius.md,
                borderColor: colors.primary,
                marginTop: spacing.xs,
              },
            ]}
          >
            <Pressable
              onPress={enableMockMode}
              hitSlop={8}
              android_ripple={{ color: 'rgba(102, 192, 244, 0.25)' }}
              accessibilityRole="button"
              accessibilityLabel="Carregar dados de demonstração"
              style={({ pressed }) => [
                styles.fallbackButton,
                {
                  paddingVertical: spacing.sm + 4,
                  paddingHorizontal: spacing.md,
                  backgroundColor: pressed ? colors.cardPressed : colors.card,
                },
              ]}
            >
              <AppText
                variant="body"
                tone="primary"
                numberOfLines={1}
                style={styles.fallbackButtonText}
              >
                Carregar dados de demonstração
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <FlatList
          data={games}
          keyExtractor={(item) => String(item.rawg_id)}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.resultCardWrapper,
                shadow(1),
                {
                  borderRadius: radius.md,
                  marginBottom: spacing.sm,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => handleSelectGame(item)}
                hitSlop={6}
                android_ripple={{ color: 'rgba(102, 192, 244, 0.15)' }}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${item.title}`}
                style={({ pressed }) => [
                  styles.resultCard,
                  {
                    padding: spacing.md,
                    gap: spacing.md,
                    backgroundColor: pressed
                      ? colors.cardPressed
                      : colors.card,
                  },
                ]}
              >
                <View style={styles.resultInfo}>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    Ano: {item.released}
                    {item.genres ? ` • ${item.genres}` : ''}
                  </AppText>
                </View>

                <View style={styles.rightBadge}>
                  {item.metacritic ? (
                    <Badge label={`★ ${item.metacritic}`} tone="success" />
                  ) : null}
                  <AppText
                    variant="caption"
                    tone="primary"
                    style={styles.selectText}
                  >
                    Avaliar →
                  </AppText>
                </View>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            hasSearched ? (
              <EmptyState
                badge="SEM RESULTADOS"
                title="Nenhum jogo encontrado. Tente outro nome."
                description={`Não encontramos resultados para "${searchQuery}". Verifique o nome digitado ou realize o cadastro manual.`}
                actionLabel="Cadastrar Manualmente"
                onActionPress={() => navigation.navigate('GameForm')}
              />
            ) : (
              <EmptyState
                badge={isMockMode ? 'MODO OFFLINE ATIVO' : 'CATÁLOGO'}
                title={
                  isMockMode
                    ? 'Base de demonstração pronta'
                    : 'Explore nosso catálogo'
                }
                description={
                  isMockMode
                    ? 'Digite o nome de um jogo na barra de pesquisa acima para buscar na base local offline.'
                    : 'Pesquise jogos pelo título e os adicione à sua biblioteca pessoal.'
                }
              />
            )
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 8,
  },
  manualLink: {
    fontWeight: '700',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 8,
  },
  offlineBannerText: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    minHeight: 48,
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    borderWidth: 1,
  },
  fallbackButtonWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  fallbackButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  resultCardWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 68,
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  rightBadge: {
    alignItems: 'flex-end',
    gap: 4,
  },
  selectText: {
    fontWeight: '700',
  },
});
