import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { createAdminGame, searchCatalogGames } from '../services/games';
import { resolveGameRequests } from '../services/requests';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_RELEASE_YEAR = 1950;
const HEADER_KEYBOARD_OFFSET = Platform.select({ ios: 96, android: 84, default: 0 });

export default function NewGameScreen({ route, navigation }) {
  const { colors, spacing } = useTheme();
  const requestIds = route?.params?.requestIds ?? [];

  const [title, setTitle] = useState(route?.params?.title ?? '');
  const [releaseYear, setReleaseYear] = useState('');
  const [platforms, setPlatforms] = useState('');
  const [genres, setGenres] = useState('');
  const [developer, setDeveloper] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Informe o nome do jogo.');
      return;
    }
    const yearNumber = releaseYear ? Number(releaseYear) : null;
    if (yearNumber != null && (yearNumber < MIN_RELEASE_YEAR || yearNumber > CURRENT_YEAR + 5)) {
      setFormError('Informe um ano válido.');
      return;
    }
    if (coverUrl.trim() && !/^https:\/\//.test(coverUrl.trim())) {
      setFormError('O link da capa deve começar com https://');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const similarGames = await searchCatalogGames(trimmedTitle);
      const duplicate = similarGames.find(
        (game) => game.title.toLowerCase() === trimmedTitle.toLowerCase()
      );
      if (duplicate) {
        setFormError(`"${duplicate.title}" já está no catálogo. Use a busca para vinculá-lo ao pedido.`);
        setIsSaving(false);
        return;
      }

      const game = await createAdminGame({
        title: trimmedTitle,
        release_year: yearNumber,
        platforms,
        genres,
        developer,
        cover_url: coverUrl,
      });

      if (requestIds.length) {
        await resolveGameRequests(requestIds, { status: 'approved', gameId: game.id });
      }

      Alert.alert('Jogo adicionado', `"${game.title}" já está disponível no catálogo.`);
      navigation.replace('GameDetails', { gameId: game.id });
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível cadastrar o jogo.'));
      setIsSaving(false);
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
          { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="body" tone="muted">
          Use apenas para jogos que não existem na IGDB. O jogo fica disponível para todos.
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
          label="Ano de lançamento"
          value={releaseYear}
          onChangeText={(text) => setReleaseYear(text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder={String(CURRENT_YEAR)}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Plataformas"
          value={platforms}
          onChangeText={setPlatforms}
          placeholder="Ex: Switch, PS5"
          maxLength={80}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Gêneros"
          value={genres}
          onChangeText={setGenres}
          placeholder="Ex: Aventura, RPG"
          maxLength={80}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Desenvolvedora"
          value={developer}
          onChangeText={setDeveloper}
          placeholder="Ex: Nintendo"
          maxLength={80}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Link da capa"
          value={coverUrl}
          onChangeText={setCoverUrl}
          placeholder="https://..."
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          keyboardType="url"
          hint="Imagem vertical, de preferência no formato de caixa do jogo"
        />

        {formError ? (
          <AppText variant="body" tone="danger">
            {formError}
          </AppText>
        ) : null}

        <Button
          label={isSaving ? 'Cadastrando...' : requestIds.length ? 'Cadastrar e aprovar pedido' : 'Cadastrar jogo'}
          onPress={handleSave}
          disabled={isSaving}
        />
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
});
