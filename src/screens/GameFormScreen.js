import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export default function GameFormScreen({ route }) {
  const prefillGame = route?.params?.prefillGame;
  const existingGame = route?.params?.game;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulário de Avaliação</Text>

      {prefillGame && (
        <View style={styles.prefillBox}>
          <Text style={styles.prefillLabel}>Jogo selecionado na RAWG:</Text>
          <Text style={styles.prefillTitle}>{prefillGame.title}</Text>
          <Text style={styles.prefillId}>RAWG ID: {prefillGame.rawg_id}</Text>
        </View>
      )}

      {existingGame && (
        <View style={styles.prefillBox}>
          <Text style={styles.prefillLabel}>Editando jogo:</Text>
          <Text style={styles.prefillTitle}>{existingGame.title}</Text>
        </View>
      )}

      <Text style={styles.description}>
        Esta tela será implementada na Fase 4 para adicionar, editar e excluir
        avaliações no SQLite.
      </Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  prefillBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  prefillLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  prefillTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  prefillId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
