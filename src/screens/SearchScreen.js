import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getRawgApiKey,
  searchGames,
  setRawgApiKey,
} from '../services/rawgApi';
import { colors, radius, shadow, spacing } from '../theme/tokens';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(getRawgApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(!getRawgApiKey());

  // Três estados da interface (Loading, Sucesso/Dados, Erro)
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  async function executarBusca() {
    if (!query.trim()) {
      setErro('Digite o nome de um jogo para pesquisar.');
      return;
    }

    Keyboard.dismiss();
    setCarregando(true);
    setErro('');
    setBuscaRealizada(true);

    try {
      setRawgApiKey(apiKeyInput);
      const resultados = await searchGames(query);
      setDados(resultados);
    } catch (e) {
      setErro(e.message || 'Erro inesperado ao consultar a RAWG API.');
      setDados([]);
    } finally {
      setCarregando(false);
    }
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
    <View style={styles.container}>
      {/* Configuração rápida de API Key (caso não esteja no .env) */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => setShowKeyConfig((prev) => !prev)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Configurar chave da RAWG API"
        >
          <Text style={styles.keyToggleText}>
            {showKeyConfig
              ? '▲ Ocultar Chave da RAWG API'
              : '⚙ Configurar Chave da RAWG API'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('GameForm')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar jogo manualmente sem usar a API"
        >
          <Text style={styles.manualEntryText}>Cadastro Manual →</Text>
        </Pressable>
      </View>

      {showKeyConfig && (
        <View style={styles.keyBox}>
          <Text style={styles.keyLabel}>
            RAWG API Key (ou defina EXPO_PUBLIC_RAWG_API_KEY no .env):
          </Text>
          <TextInput
            style={styles.keyInput}
            placeholder="Cole sua chave gratuita de rawg.io/apidocs"
            placeholderTextColor={colors.textSecondary}
            value={apiKeyInput}
            onChangeText={(text) => {
              setApiKeyInput(text);
              setRawgApiKey(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {/* Barra de Pesquisa */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ex: Hollow Knight, Elden Ring, Celeste..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={executarBusca}
          returnKeyType="search"
        />

        <View style={[styles.searchButtonWrapper, shadow(1)]}>
          <Pressable
            onPress={executarBusca}
            disabled={carregando}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            accessibilityRole="button"
            accessibilityLabel="Executar busca na RAWG API"
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchButtonPressed,
              carregando && styles.searchButtonDisabled,
            ]}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>
      </View>

      {/* Estado 1: Loading */}
      {carregando && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Consultando catálogo RAWG...</Text>
        </View>
      )}

      {/* Estado 2: Erro */}
      {!carregando && Boolean(erro) && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Não foi possível concluir a busca</Text>
          <Text style={styles.errorMessage}>{erro}</Text>
        </View>
      )}

      {/* Estado 3: Sucesso (Lista de Resultados somente em texto) */}
      {!carregando && !erro && (
        <FlatList
          data={dados}
          keyExtractor={(item) => String(item.rawg_id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={[styles.resultCardWrapper, shadow(1)]}>
              <Pressable
                onPress={() => selecionarJogo(item)}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${item.title}, lançado em ${item.released}`}
                style={({ pressed }) => [
                  styles.resultCard,
                  pressed && styles.resultCardPressed,
                ]}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultMeta} numberOfLines={1}>
                    Ano: {item.released}
                    {item.genres ? ` • ${item.genres}` : ''}
                  </Text>
                </View>

                <View style={styles.rightBadge}>
                  {item.metacritic ? (
                    <View style={styles.metacriticBadge}>
                      <Text style={styles.metacriticText}>
                        MC {item.metacritic}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.selectActionText}>Selecionar</Text>
                </View>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            buscaRealizada ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>
                  Nenhum jogo encontrado para "{query}".
                </Text>
              </View>
            ) : (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>
                  Pesquise pelo título do jogo na RAWG API para importar seu ID
                  oficial sem carregar imagens pesadas na listagem.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  keyToggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  manualEntryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  keyBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  keyInput: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 14,
  },
  searchButtonWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  centerBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  errorBox: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: spacing.xs,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  errorMessage: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  resultCardWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 68,
    gap: spacing.md,
  },
  resultCardPressed: {
    backgroundColor: colors.surfacePressed,
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  rightBadge: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metacriticBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metacriticText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  selectActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
