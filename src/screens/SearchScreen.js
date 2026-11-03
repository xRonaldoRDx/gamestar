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
    termo,
    setTermo,
    carregando,
    dados,
    erro,
    buscaRealizada,
    executarBusca,
  } = useGamesSearch();

  const { colors, spacing, radius, shadow } = useTheme();

  function handleSearch() {
    Keyboard.dismiss();
    executarBusca();
  }

  function selecionarJogo(item) {
    navigation.navigate('GameForm', {
      prefillGame: {
        rawg_id: item.rawg_id,
        title: item.title,
        release_year: item.released,
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
        <AppText variant="caption" tone="muted">
          Catálogo Global (busca rápida em texto)
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
          value={termo}
          onChangeText={setTermo}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />

        <Button
          label="Buscar"
          onPress={handleSearch}
          disabled={carregando}
        />
      </View>

      {/* Estado 1: Loading */}
      {carregando ? (
        <View style={[styles.centerBox, { padding: spacing.xl, gap: spacing.sm }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="body" tone="muted">
            Consultando catálogo de jogos...
          </AppText>
        </View>
      ) : null}

      {/* Estado 2: Erro */}
      {!carregando && erro ? (
        <View
          style={[
            styles.errorBox,
            {
              margin: spacing.md,
              padding: spacing.md,
              borderRadius: radius.md,
              borderColor: colors.danger,
              backgroundColor: colors.danger + '1A',
              gap: spacing.xs,
            },
          ]}
        >
          <AppText variant="subtitle" tone="danger">
            Não foi possível concluir a busca
          </AppText>
          <AppText variant="body">{erro}</AppText>
        </View>
      ) : null}

      {/* Estado 3: Sucesso */}
      {!carregando && !erro ? (
        <FlatList
          data={dados}
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
                onPress={() => selecionarJogo(item)}
                hitSlop={6}
                android_ripple={{ color: 'rgba(102, 192, 244, 0.15)' }}
                accessibilityRole="button"
                accessibilityLabel={`Ver capa e detalhes de ${item.title}`}
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
            buscaRealizada ? (
              <EmptyState
                badge="SEM RESULTADOS"
                title="Nenhum jogo encontrado"
                description={`Não encontramos resultados para "${termo}". Verifique o nome digitado ou realize o cadastro manual.`}
                actionLabel="Cadastrar Manualmente"
                onActionPress={() => navigation.navigate('GameForm')}
              />
            ) : (
              <EmptyState
                badge="CATÁLOGO"
                title="Explore nosso catálogo"
                description="Pesquise jogos pelo título e os adicione à sua biblioteca pessoal."
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
  },
  manualLink: {
    fontWeight: '700',
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
