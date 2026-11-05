import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { createGameRequest, getMyGameRequests, REQUEST_STATUS } from '../services/requests';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Users cannot add games themselves; they ask the admins, who add the game
 * from IGDB or by hand. Also lists the user's previous requests.
 */
export default function RequestGameScreen({ route, navigation }) {
  const { userId } = useAuth();
  const { colors, spacing, radius } = useTheme();

  const [title, setTitle] = useState(route?.params?.title ?? '');
  const [platform, setPlatform] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: myRequests, refresh } = useFocusLoader(() => getMyGameRequests(userId), [userId]);

  async function handleSubmit() {
    if (!title.trim()) {
      setFormError('Informe o nome do jogo.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      await createGameRequest({ title, platform, note });
      setTitle('');
      setPlatform('');
      setNote('');
      refresh();
      Alert.alert('Pedido enviado', 'Vamos analisar e avisar aqui quando o jogo for adicionado.');
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível enviar o pedido.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const form = (
    <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
      <AppText variant="body" tone="muted">
        Não encontrou um jogo na busca? Conte qual é e nós adicionamos ao catálogo.
      </AppText>
      <TextField label="Nome do jogo *" value={title} onChangeText={setTitle} maxLength={120} />
      <TextField
        label="Plataforma"
        value={platform}
        onChangeText={setPlatform}
        placeholder="Ex: Switch, PS2, Mobile"
        maxLength={60}
      />
      <TextField
        label="Observação"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={300}
        placeholder="Ano, desenvolvedora ou qualquer detalhe que ajude a encontrar o jogo"
      />

      {formError ? (
        <AppText variant="body" tone="danger">
          {formError}
        </AppText>
      ) : null}

      <Button
        label={isSubmitting ? 'Enviando...' : 'Enviar pedido'}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />

      {myRequests?.length ? (
        <AppText variant="caption" tone="muted" style={[styles.sectionTitle, { marginTop: spacing.md }]}>
          MEUS PEDIDOS
        </AppText>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={myRequests ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={form}
        renderItem={({ item }) => {
          const status = REQUEST_STATUS[item.status];
          const canOpenGame = item.status === 'approved' && item.game_id;
          return (
            <Pressable
              disabled={!canOpenGame}
              onPress={() => navigation.navigate('GameDetails', { gameId: item.game_id })}
              accessibilityRole={canOpenGame ? 'button' : undefined}
              style={[
                styles.requestRow,
                {
                  gap: spacing.sm,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  borderRadius: radius.md,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View style={styles.flex}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {item.title}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {[item.platform, new Date(item.created_at).toLocaleDateString('pt-BR')]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              <Badge label={status.label} tone={status.tone} />
            </Pressable>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
