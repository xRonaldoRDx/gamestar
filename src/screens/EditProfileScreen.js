import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import KeyboardAwareView from '../components/KeyboardAwareView';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { buildCacheBustedAvatarUrl, removeProfileAvatar, updateProfile } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const MAX_BIO_LENGTH = 160;
const REMOVE_ERROR_MESSAGE = 'Não foi possível remover a foto. Tente novamente.';

export default function EditProfileScreen({ route, navigation }) {
  const { userId, reloadProfile, updateAuthProfile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const initialProfile = route?.params?.profile ?? {};

  const [userProfile, setUserProfile] = useState(() => ({
    ...initialProfile,
    avatar_url: buildCacheBustedAvatarUrl(initialProfile.avatar_url),
  }));
  const [displayName, setDisplayName] = useState(initialProfile.display_name ?? '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const { isUploadingAvatar, avatarError, pickAndUploadAvatar } = useAvatarUpload();
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isBusy = isSaving || isUploadingAvatar || isRemovingAvatar;
  const hasAvatar = Boolean(userProfile.avatar_url);

  async function applyProfileUpdate(updatedProfile) {
    const nextProfile = { ...userProfile, ...updatedProfile };
    setUserProfile(nextProfile);
    updateAuthProfile(nextProfile);
    await reloadProfile();
  }

  async function handleSelectAvatar() {
    if (isBusy) return;
    setFormError('');
    const updatedProfile = await pickAndUploadAvatar();
    if (updatedProfile) setUserProfile((current) => ({ ...current, ...updatedProfile }));
  }

  async function handleRemoveAvatar() {
    if (isBusy || !hasAvatar) return;
    setFormError('');
    setIsRemovingAvatar(true);

    try {
      await applyProfileUpdate(await removeProfileAvatar(userId));
    } catch (err) {
      const friendlyMessage = toFriendlyMessage(err, REMOVE_ERROR_MESSAGE);
      setFormError(friendlyMessage);
      Alert.alert('Erro', friendlyMessage);
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  async function handleSave() {
    if (isBusy) return;
    setIsSaving(true);
    setFormError('');

    try {
      const savedProfile = await updateProfile(userId, {
        display_name: displayName,
        bio,
        avatar_url: userProfile.avatar_url,
      });
      await applyProfileUpdate({
        ...savedProfile,
        avatar_url: buildCacheBustedAvatarUrl(savedProfile.avatar_url),
      });
      navigation.goBack();
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível salvar o perfil.'));
      setIsSaving(false);
    }
  }

  const previewProfile = { ...userProfile, display_name: displayName };
  const visibleError = formError || avatarError;

  return (
    <KeyboardAwareView
      style={[styles.keyboardRoot, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.avatarSection, { gap: spacing.sm, marginBottom: spacing.xs }]}>
          <Pressable
            onPress={handleSelectAvatar}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            style={styles.avatarButton}
          >
            <Avatar profile={previewProfile} size={88} />
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                  borderRadius: radius.pill,
                },
              ]}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.background} />
              )}
            </View>
          </Pressable>

          <AppText variant="body" tone="muted">
            @{userProfile.username}
          </AppText>

          <View style={[styles.photoActionsRow, { gap: spacing.md }]}>
            <Pressable
              onPress={handleSelectAvatar}
              disabled={isBusy}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Escolher nova foto na galeria"
            >
              <AppText variant="caption" tone="primary" style={styles.photoActionText}>
                {isUploadingAvatar ? 'Enviando foto...' : 'Alterar Foto'}
              </AppText>
            </Pressable>

            {hasAvatar ? (
              <Pressable
                onPress={handleRemoveAvatar}
                disabled={isBusy}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Remover foto de perfil"
              >
                <AppText variant="caption" tone="danger" style={styles.photoActionText}>
                  {isRemovingAvatar ? 'Removendo...' : 'Remover Foto'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <TextField
          label="Nome"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
          editable={!isBusy}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={MAX_BIO_LENGTH}
          hint={`${bio.length}/${MAX_BIO_LENGTH}`}
          placeholder="Conte que tipo de jogo você curte"
          editable={!isBusy}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />

        {visibleError ? (
          <AppText variant="body" tone="danger" accessibilityLiveRegion="polite">
            {visibleError}
          </AppText>
        ) : null}

        <Button
          label={isSaving ? 'Salvando...' : 'Salvar'}
          onPress={handleSave}
          disabled={isBusy}
        />
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
  avatarSection: {
    alignItems: 'center',
  },
  avatarButton: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionText: {
    fontWeight: '700',
  },
});
