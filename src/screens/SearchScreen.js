import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export default function SearchScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Jogo (RAWG API)</Text>
      <Text style={styles.description}>
        Esta tela será implementada na Fase 3 para consultar jogos na RAWG API.
      </Text>

      <View style={styles.buttonWrapper}>
        <Pressable
          onPress={() => navigation.navigate('GameForm')}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Ir para Formulário (Fase 4)</Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
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
