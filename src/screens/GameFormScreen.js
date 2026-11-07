import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import KeyboardAwareView from '../components/KeyboardAwareView';
import AppText from '../components/AppText';
import Badge from '../components/Badge';
import Button from '../components/Button';
import GameCover from '../components/GameCover';
import ChoiceChips from '../components/ChoiceChips';
import { isValidRating } from '../components/RatingLabel';
import StarRatingInput from '../components/StarRatingInput';
import { GAME_STATUS, STATUS_KEYS } from '../services/games';
import { deleteLibraryEntry, saveLibraryEntry } from '../services/library';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_OPTIONS = STATUS_KEYS.map((key) => ({ value: key, label: GAME_STATUS[key].label }));
const SCROLL_TO_BOTTOM_DELAY_MS = 150;

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

function getInitialRating(entryRating) {
  if (isValidRating(entryRating)) {
    return entryRating;
  }
  if (typeof entryRating === 'string' && entryRating.trim() !== '') {
    const parsedRating = Number(entryRating);
    return Number.isNaN(parsedRating) ? null : parsedRating;
  }
  return null;
}

export default function GameFormScreen({ route, navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { game, entry: existingEntry } = route.params;
  const isEditing = Boolean(existingEntry?.id);
  const scrollViewRef = useRef(null);

  const platformOptions = getPlatformOptions(game.platforms, existingEntry?.platform);
  const hasSinglePlatform = platformOptions.length === 1;

  const [status, setStatus] = useState(existingEntry?.status ?? 'playing');
  const [rating, setRating] = useState(() => getInitialRating(existingEntry?.rating));
  const [playtime, setPlaytime] = useState(
    existingEntry?.playtime !== null && existingEntry?.playtime !== undefined
      ? String(existingEntry.playtime)
      : ''
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

  function scrollToReviewInput() {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, SCROLL_TO_BOTTOM_DELAY_MS);
  }

  async function handleSave() {
    setIsSaving(true);
    setFormError('');

    try {
      await saveLibraryEntry({
        id: existingEntry?.id,
        game_id: game.id,
        status,
        rating: isValidRating(rating) ? rating : null,
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
    <KeyboardAwareView
      style={[styles.keyboardRoot, { backgroundColor: colors.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            gap: spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
              autoComplete="off"
              autoCorrect={false}
              textContentType="none"
              importantForAutofill="no"
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
            autoComplete="off"
            autoCorrect={false}
            textContentType="none"
            importantForAutofill="no"
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
            onFocus={scrollToReviewInput}
            onContentSizeChange={scrollToReviewInput}
            multiline
            numberOfLines={5}
            maxLength={2000}
            textAlignVertical="top"
            scrollEnabled={false}
            editable={!isSaving}
            autoComplete="off"
            autoCorrect={false}
            textContentType="none"
            importantForAutofill="no"
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
    </KeyboardAwareView>
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
