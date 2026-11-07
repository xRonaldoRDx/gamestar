import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useFocusLoader } from '../hooks/useFocusLoader';
import { createGameRequest, getMyGameRequests, REQUEST_STATUS } from '../services/requests';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const HEADER_KEYBOARD_OFFSET = Platform.select({ ios: 96, android: 84, default: 0 });

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

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardRoot, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={HEADER_KEYBOARD_OFFSET}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <AppText variant="body" tone="muted">
            Não encontrou um jogo na busca? Conte qual é e nós adicionamos ao catálogo.
          </AppText>
          <TextField
            label="Nome do jogo *"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            autoComplete="off"
            autoCorrect={false}
            textContentType="none"
          />
          <TextField
            label="Plataforma"
            value={platform}
            onChangeText={setPlatform}
            placeholder="Ex: Switch, PS2, Mobile"
            maxLength={60}
            autoComplete="off"
            autoCorrect={false}
            textContentType="none"
          />
          <TextField
            label="Observação"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={300}
            placeholder="Ano, desenvolvedora ou qualquer detalhe que ajude a encontrar o jogo"
            autoComplete="off"
            autoCorrect={false}
            textContentType="none"
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

        {(myRequests ?? []).map((item) => {
          const status = REQUEST_STATUS[item.status];
          const canOpenGame = item.status === 'approved' && item.game_id;
          return (
            <Pressable
              key={String(item.id)}
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
              <View style={styles.keyboardRoot}>
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
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
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
