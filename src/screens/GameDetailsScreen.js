import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';

export default function GameDetailsScreen({ route, navigation }) {
  const { colors, spacing } = useTheme();
  const game = route?.params?.game;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <AppText variant="title" style={[styles.centerText, { marginBottom: spacing.xs }]}>
        {game?.title || 'Detalhes do Jogo'}
      </AppText>

      <AppText variant="subtitle" tone="warning" style={{ marginBottom: spacing.xs }}>
        Status: {game?.status} | Nota: {game?.rating > 0 ? `★ ${Number(game.rating).toFixed(1)}/5.0` : 'Sem nota'}
      </AppText>

      <AppText variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
        Tempo jogado: {game?.playtime ? `${game.playtime}h` : '0h'}
      </AppText>

      {game?.review_text ? (
        <AppText
          variant="body"
          style={[styles.centerText, { marginBottom: spacing.md }]}
        >
          "{game.review_text}"
        </AppText>
      ) : null}

      <AppText
        variant="caption"
        tone="muted"
        style={[styles.centerText, { marginBottom: spacing.lg }]}
      >
        Na Fase 5, esta tela exibirá o painel detalhado completo da análise.
      </AppText>

      <Button
        label="Editar ou Excluir Avaliação"
        onPress={() => navigation.navigate('GameForm', { game })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
