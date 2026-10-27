import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import GameListItem from '../components/GameListItem';
import { useBacklog } from '../contexts/BacklogContext';
import { useTheme } from '../theme/ThemeProvider';

export default function HomeScreen({ navigation }) {
  const { jogos, carregando, erro, carregarBacklog } = useBacklog();
  const { colors, spacing, radius } = useTheme();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarBacklog();
    });
    return unsubscribe;
  }, [navigation, carregarBacklog]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra de Topo */}
      <View
        style={[
          styles.headerBanner,
          {
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomColor: colors.border,
            gap: spacing.sm,
          },
        ]}
      >
        <View style={styles.headerTextGroup}>
          <AppText variant="title">Gamestar Backlog</AppText>
          <AppText variant="caption" tone="muted">
            {jogos.length === 1
              ? '1 jogo no acervo'
              : `${jogos.length} jogos no acervo`}
          </AppText>
        </View>

        <Button
          label="+ Adicionar"
          onPress={() => navigation.navigate('Search')}
        />
      </View>

      {/* Estado 1: Loading */}
      {carregando ? (
        <View style={[styles.centerBox, { padding: spacing.xl, gap: spacing.sm }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="body" tone="muted">
            Carregando sua biblioteca...
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
              gap: spacing.sm,
            },
          ]}
        >
          <AppText variant="subtitle" tone="danger">
            Erro ao carregar o Backlog
          </AppText>
          <AppText variant="body">{erro}</AppText>
          <Button
            label="Tentar Novamente"
            variant="secondary"
            onPress={carregarBacklog}
            style={styles.retryButton}
          />
        </View>
      ) : null}

      {/* Estado 3: Sucesso com FlatList */}
      {!carregando && !erro ? (
        <FlatList
          data={jogos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          renderItem={({ item }) => (
            <GameListItem
              item={item}
              onPress={() => navigation.navigate('GameDetails', { game: item })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              badge="BIBLIOTECA VAZIA"
              title="Sua biblioteca está vazia"
              description="Você ainda não registrou nenhum jogo no Gamestar. Pesquise títulos no catálogo ou adicione manualmente."
              actionLabel="+ Buscar Jogos"
              onActionPress={() => navigation.navigate('Search')}
            />
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
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTextGroup: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    borderWidth: 1,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
});
