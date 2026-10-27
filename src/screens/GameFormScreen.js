import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import { useTheme } from '../theme/ThemeProvider';

export default function GameFormScreen({ route }) {
  const { colors, spacing, radius } = useTheme();
  const prefillGame = route?.params?.prefillGame;
  const existingGame = route?.params?.game;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <AppText variant="title" style={{ marginBottom: spacing.md }}>
        Gamestar • Avaliar Jogo
      </AppText>

      {prefillGame ? (
        <View
          style={[
            styles.prefillBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <AppText variant="caption" tone="muted">
            Jogo selecionado do catálogo:
          </AppText>
          <AppText variant="subtitle" style={styles.centerText}>
            {prefillGame.title}
          </AppText>
          <AppText variant="caption" tone="primary">
            Código do Jogo: #{prefillGame.rawg_id}
          </AppText>
        </View>
      ) : null}

      {existingGame ? (
        <View
          style={[
            styles.prefillBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <AppText variant="caption" tone="muted">
            Editando jogo:
          </AppText>
          <AppText variant="subtitle" style={styles.centerText}>
            {existingGame.title}
          </AppText>
        </View>
      ) : null}

      <AppText variant="body" tone="muted" style={styles.centerText}>
        Esta tela será implementada na Fase 4 para adicionar, editar e excluir
        avaliações usando queries parametrizadas no SQLite.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefillBox: {
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  centerText: {
    textAlign: 'center',
  },
});
