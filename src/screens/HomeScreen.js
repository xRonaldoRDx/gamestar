import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import GameListItem from '../components/GameListItem';
import { colors, radius, shadow, spacing } from '../theme/tokens';

const MOCK_BACKLOG = [
  {
    id: 1,
    rawg_id: 3498,
    title: 'Grand Theft Auto V',
    status: 'Completed',
    rating: 9.5,
    playtime: 85,
    achievements: 42,
    review_text: 'Campanha excelente e mundo aberto muito detalhado.',
    added_at: '2026-10-01T10:00:00.000Z',
    updated_at: '2026-10-15T18:30:00.000Z',
  },
  {
    id: 2,
    rawg_id: 3328,
    title: 'The Witcher 3: Wild Hunt',
    status: 'Playing',
    rating: 10.0,
    playtime: 64,
    achievements: 31,
    review_text: 'Narrativa impecável e missões secundárias memoráveis.',
    added_at: '2026-10-05T14:20:00.000Z',
    updated_at: '2026-10-18T21:10:00.000Z',
  },
  {
    id: 3,
    rawg_id: 4200,
    title: 'Portal 2',
    status: 'Completed',
    rating: 9.8,
    playtime: 14,
    achievements: 28,
    review_text: 'Design de puzzles genial do início ao fim.',
    added_at: '2026-10-08T09:15:00.000Z',
    updated_at: '2026-10-12T16:45:00.000Z',
  },
  {
    id: 4,
    rawg_id: 58175,
    title: 'God of War',
    status: 'Backlog',
    rating: 0,
    playtime: 0,
    achievements: 0,
    review_text: 'Na fila para jogar nas férias.',
    added_at: '2026-10-19T11:00:00.000Z',
    updated_at: '2026-10-19T11:00:00.000Z',
  },
  {
    id: 5,
    rawg_id: 28,
    title: 'Red Dead Redemption 2',
    status: 'Dropped',
    rating: 7.5,
    playtime: 12,
    achievements: 5,
    review_text: 'Pausado temporariamente por falta de tempo.',
    added_at: '2026-10-20T19:00:00.000Z',
    updated_at: '2026-10-20T19:00:00.000Z',
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.headerTitle}>Meu Backlog</Text>
          <Text style={styles.headerSubtitle}>
            {MOCK_BACKLOG.length} jogos registrados (Modo Texto Rápido)
          </Text>
        </View>

        <View style={[styles.addButtonWrapper, shadow(2)]}>
          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={8}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
            accessibilityRole="button"
            accessibilityLabel="Buscar e adicionar novo jogo"
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={MOCK_BACKLOG}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <GameListItem
            item={item}
            onPress={() => navigation.navigate('GameDetails', { game: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum jogo no seu backlog ainda.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButtonWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
