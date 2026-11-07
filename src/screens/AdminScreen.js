import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/ScreenState';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { getPendingRequestGroups } from '../services/requests';
import { useTheme } from '../theme/ThemeProvider';

export default function AdminScreen({ navigation }) {
  const { colors, spacing, radius } = useTheme();
  const { data, isLoading, isRefreshing, error, refresh } = useFocusLoader(getPendingRequestGroups);

  if (isLoading) return <LoadingState message="Carregando pedidos..." />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={data}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          <AppText variant="body" tone="muted">
            Pedidos de jogos que os usuários não encontraram. Os mais pedidos aparecem primeiro.
          </AppText>
          <Button
            label="+ Cadastrar jogo manualmente"
            variant="secondary"
            onPress={() => navigation.navigate('NewGame')}
          />
        </View>
      }
      renderItem={({ item }) => {
        const platforms = [...new Set(item.requests.map((request) => request.platform).filter(Boolean))];
        return (
          <Pressable
            onPress={() => navigation.navigate('AdminRequest', { group: item })}
            accessibilityRole="button"
            accessibilityLabel={`Analisar pedido de ${item.title}`}
            style={({ pressed }) => [
              styles.row,
              {
                gap: spacing.sm,
                padding: spacing.md,
                marginBottom: spacing.sm,
                borderRadius: radius.md,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.cardPressed : colors.card,
              },
            ]}
          >
            <View style={styles.flex}>
              <AppText variant="subtitle" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {platforms.join(', ') || 'Plataforma não informada'}
              </AppText>
            </View>
            <Badge
              label={item.requests.length === 1 ? '1 pedido' : `${item.requests.length} pedidos`}
              tone="warning"
            />
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          badge="TUDO EM DIA"
          title="Nenhum pedido pendente"
          description="Quando alguém pedir um jogo que não está no catálogo, ele aparece aqui."
        />
      }
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
});
