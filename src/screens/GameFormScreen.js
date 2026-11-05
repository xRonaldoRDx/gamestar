import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import GameCover from '../components/GameCover';
import ChoiceChips from '../components/ChoiceChips';
import StarRatingInput from '../components/StarRatingInput';
import { GAME_STATUS, STATUS_KEYS } from '../services/games';
import { deleteLibraryEntry, saveLibraryEntry } from '../services/library';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_OPTIONS = STATUS_KEYS.map((key) => ({ value: key, label: GAME_STATUS[key].label }));

// The catalog stores platforms as "PC, PS5, Switch"; an older entry may use a platform
// typed by hand before this picker existed, so it is kept as an option too.
function getPlatformOptions(gamePlatforms, savedPlatform) {
  const platforms = (gamePlatforms || '')
    .split(',')
    .map((platform) => platform.trim())
    .filter(Boolean);

  if (savedPlatform && !platforms.includes(savedPlatform)) {
    platforms.push(savedPlatform);
  }
  return platforms.map((platform) => ({ value: platform, label: platform }));
}

/**
 * Adds, edits or removes a catalog game from the signed-in user's library.
 */
export default function GameFormScreen({ route, navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { game, entry: existingEntry } = route.params;
  const isEditing = Boolean(existingEntry?.id);

  const platformOptions = getPlatformOptions(game.platforms, existingEntry?.platform);
  const hasSinglePlatform = platformOptions.length === 1;

  const [status, setStatus] = useState(existingEntry?.status ?? 'playing');
  const [rating, setRating] = useState(Number(existingEntry?.rating) || 0);
  const [playtime, setPlaytime] = useState(
    existingEntry?.playtime ? String(existingEntry.playtime) : ''
  );
  const [platform, setPlatform] = useState(
    existingEntry?.platform || (hasSinglePlatform ? platformOptions[0].value : '')
  );
  const [reviewText, setReviewText] = useState(existingEntry?.review ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Gamestar • Editar Avaliação' : 'Gamestar • Nova Avaliação',
    });
  }, [isEditing, navigation]);

  function handlePlaytimeChange(text) {
    const digitsOnly = text.replace(/[^0-9]/g, '');
    setPlaytime(digitsOnly);
  }

  async function handleSave() {
    setIsSaving(true);
    setFormError('');

    try {
      await saveLibraryEntry({
        id: existingEntry?.id,
        game_id: game.id,
        status,
        rating,
        playtime,
        platform,
        review: reviewText,
      });
      navigation.goBack();
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível salvar sua avaliação.'));
      setIsSaving(false);
    }
  }

  function handleConfirmDelete() {
    if (!isEditing) return;

    Alert.alert(
      'Excluir Avaliação',
      `Tem certeza que deseja remover "${game.title}" da sua lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await deleteLibraryEntry(existingEntry.id);
              navigation.goBack();
            } catch (err) {
              setFormError(toFriendlyMessage(err, 'Não foi possível excluir esta avaliação.'));
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.coverCard,
            shadow(2),
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
              gap: spacing.md,
            },
          ]}
        >
          <GameCover uri={game.cover_url} width={72} />

          <View style={styles.coverMetaBox}>
            <Badge
              label={isEditing ? 'EDITANDO AVALIAÇÃO' : 'NOVA AVALIAÇÃO'}
              tone={isEditing ? 'success' : 'primary'}
            />
            <AppText variant="subtitle" numberOfLines={2}>
              {game.title}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {[game.release_year, game.developer].filter(Boolean).join(' · ') || '—'}
            </AppText>
          </View>
        </View>

        {formError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger + '1A',
                borderColor: colors.danger,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <AppText variant="subtitle" tone="danger">
              Atenção
            </AppText>
            <AppText variant="body">{formError}</AppText>
          </View>
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Status</AppText>
          <ChoiceChips
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            disabled={isSaving}
            accessibilityPrefix="Status "
          />
        </View>

        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Plataforma</AppText>
          {hasSinglePlatform ? (
            <AppText variant="body" tone="muted">
              Disponível apenas para{' '}
              <AppText variant="body" tone="primary" style={styles.boldText}>
                {platformOptions[0].label}
              </AppText>
            </AppText>
          ) : platformOptions.length > 1 ? (
            <>
              <AppText variant="caption" tone="muted">
                Em qual plataforma você jogou?
              </AppText>
              <ChoiceChips
                options={platformOptions}
                value={platform}
                onChange={setPlatform}
                disabled={isSaving}
                accessibilityPrefix="Plataforma "
              />
            </>
          ) : (
            // Only admin-added games may lack platforms; then the user types it
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                },
              ]}
              placeholder="Ex: PC, Switch"
              placeholderTextColor={colors.textMuted}
              value={platform}
              onChangeText={setPlatform}
              maxLength={40}
              editable={!isSaving}
            />
          )}
        </View>

        <StarRatingInput
          label="Sua Nota (0 a 5 Estrelas)"
          value={rating}
          onChange={setRating}
          disabled={isSaving}
        />

        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Horas jogadas</AppText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                paddingHorizontal: spacing.md,
              },
            ]}
            placeholder="Ex: 42"
            placeholderTextColor={colors.textMuted}
            value={playtime}
            onChangeText={handlePlaytimeChange}
            keyboardType="numeric"
            maxLength={5}
            editable={!isSaving}
          />
        </View>

        <View style={{ gap: spacing.xs }}>
          <AppText variant="subtitle">Avaliação e Comentários</AppText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                padding: spacing.md,
              },
            ]}
            placeholder="Escreva seus pontos fortes, impressões sobre a campanha, jogabilidade e trilha sonora..."
            placeholderTextColor={colors.textMuted}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={5}
            maxLength={2000}
            textAlignVertical="top"
            editable={!isSaving}
          />
        </View>

        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Button
            label={
              isSaving
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Adicionar à Minha Lista'
            }
            onPress={handleSave}
            disabled={isSaving}
          />

          {isEditing ? (
            <View
              style={[
                styles.deleteButtonWrapper,
                {
                  borderRadius: radius.md,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Pressable
                onPress={handleConfirmDelete}
                disabled={isSaving}
                hitSlop={8}
                android_ripple={{ color: 'rgba(229, 72, 77, 0.25)' }}
                accessibilityRole="button"
                accessibilityLabel="Excluir Avaliação"
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    paddingVertical: spacing.sm + 4,
                    backgroundColor: pressed
                      ? colors.danger + '33'
                      : colors.danger + '18',
                    opacity: isSaving ? 0.5 : 1,
                  },
                ]}
              >
                <AppText
                  variant="body"
                  tone="danger"
                  style={styles.deleteButtonText}
                >
                  Excluir Avaliação
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  coverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  coverMetaBox: {
    flex: 1,
    gap: 4,
  },
  errorBanner: {
    borderWidth: 1,
    gap: 4,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    fontSize: 14,
  },
  boldText: {
    fontWeight: '700',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButtonWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  deleteButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontWeight: '700',
  },
});
