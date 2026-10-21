import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export default function GameFormScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulário de Avaliação</Text>
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
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
