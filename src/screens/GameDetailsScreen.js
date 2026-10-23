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

      <AppText variant="subtitle" tone="warning" style={{ marginBottom: spacing.md }}>
        Status: {game?.status} | Nota: {game?.rating > 0 ? `${game.rating}/10` : '—'}
      </AppText>

      <AppText
        variant="body"
        tone="muted"
        style={[styles.centerText, { marginBottom: spacing.lg }]}
      >
        Na Fase 5, esta tela fará o carregamento sob demanda (lazy loading) da
        capa oficial via RAWG API usando o rawg_id ({game?.rawg_id ?? 'N/A'}) e
        exibirá a análise completa.
      </AppText>

      <Button
        label="Editar Avaliação (Fase 4)"
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
