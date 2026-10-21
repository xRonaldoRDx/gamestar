import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export default function GameDetailsScreen({ route, navigation }) {
  const game = route?.params?.game;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{game?.title || 'Detalhes do Jogo'}</Text>
      <Text style={styles.meta}>
        Status: {game?.status} | Nota: {game?.rating ?? '—'}/10
      </Text>
      <Text style={styles.description}>
        Na Fase 5, esta tela fará o carregamento sob demanda (lazy loading) da
        capa oficial via RAWG API usando o rawg_id ({game?.rawg_id}) e exibirá a
        análise completa.
      </Text>

      <View style={styles.buttonWrapper}>
        <Pressable
          onPress={() => navigation.navigate('GameForm', { game })}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Editar Avaliação (Fase 4)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});
