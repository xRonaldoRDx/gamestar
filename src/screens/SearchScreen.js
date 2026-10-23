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
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
          },
        ]}
      >
        <AppText variant="caption" tone="muted">
          Catálogo oficial RAWG (modo leve sem imagens)
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
          placeholder="Ex: Elden Ring, Hollow Knight, Celeste..."
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
            Consultando catálogo RAWG...
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
            paddingBottom: spacing.xl,
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
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => selecionarJogo(item)}
                hitSlop={6}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${item.title}, lançado em ${item.released}`}
                style={({ pressed }) => [
                  styles.resultCard,
                  {
                    padding: spacing.md,
                    gap: spacing.md,
                    backgroundColor: pressed
                      ? colors.surfaceAlt
                      : colors.surface,
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
                    <Badge label={`MC ${item.metacritic}`} tone="success" />
                  ) : null}
                  <AppText
                    variant="caption"
                    tone="primary"
                    style={styles.selectText}
                  >
                    Selecionar
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
                description={`Não encontramos resultados para "${termo}". Verifique a grafia ou cadastre manualmente.`}
                actionLabel="Cadastrar Manualmente"
                onActionPress={() => navigation.navigate('GameForm')}
              />
            ) : (
              <EmptyState
                badge="BUSCA RAWG"
                title="Explore o catálogo da RAWG"
                description="Digite o título de um jogo acima para importar seu ID oficial sem carregar imagens pesadas na listagem."
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
    fontSize: 15,
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
