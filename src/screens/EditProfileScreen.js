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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/AppText';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import {
  buildCacheBustedAvatarUrl,
  removeProfileAvatar,
  updateProfile,
  uploadProfileAvatar,
} from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const MAX_BIO_LENGTH = 160;
const UPLOAD_ERROR_MESSAGE = 'Não foi possível enviar a imagem. Tente novamente.';
const REMOVE_ERROR_MESSAGE = 'Não foi possível remover a foto. Tente novamente.';

function mapProfileToViewModel(rawProfile = {}) {
  const resolvedUri = buildCacheBustedAvatarUrl(rawProfile.avatarUrl ?? rawProfile.avatar_url);
  return {
    ...rawProfile,
    displayName: rawProfile.displayName ?? rawProfile.display_name ?? '',
    display_name: rawProfile.display_name ?? rawProfile.displayName ?? '',
    avatarUrl: resolvedUri,
    avatar_url: resolvedUri,
  };
}

export default function EditProfileScreen({ route, navigation }) {
  const { userId, reloadProfile, updateAuthProfile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const initialProfile = route?.params?.profile ?? {};

  const [userProfile, setUserProfile] = useState(() => mapProfileToViewModel(initialProfile));
  const [displayName, setDisplayName] = useState(
    initialProfile.displayName ?? initialProfile.display_name ?? ''
  );
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isBusy = isSaving || isUploadingAvatar || isRemovingAvatar;
  const hasAvatar = Boolean(userProfile.avatarUrl);

  async function handleSelectAvatar() {
    if (isBusy) return;
    setFormError('');

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        const permissionMessage = 'Permita o acesso à galeria para escolher uma foto de perfil.';
        setFormError(permissionMessage);
        Alert.alert('Permissão necessária', permissionMessage);
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      setIsUploadingAvatar(true);
      const selectedAsset = pickerResult.assets[0];
      const updatedProfile = await uploadProfileAvatar(userId, selectedAsset);
      const uri = buildCacheBustedAvatarUrl(
        updatedProfile.avatarUrl ?? updatedProfile.avatar_url,
        Date.now()
      );

      const nextProfile = {
        ...userProfile,
        ...updatedProfile,
        avatarUrl: uri,
        avatar_url: uri,
      };

      setUserProfile(nextProfile);
      updateAuthProfile(nextProfile);
      await reloadProfile();
    } catch (err) {
      const friendlyMessage = toFriendlyMessage(err, UPLOAD_ERROR_MESSAGE);
      setFormError(friendlyMessage);
      Alert.alert('Erro no upload', friendlyMessage);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (isBusy || !hasAvatar) return;
    setFormError('');
    setIsRemovingAvatar(true);

    try {
      const updatedProfile = await removeProfileAvatar(userId);
      const nextProfile = {
        ...userProfile,
        ...updatedProfile,
        avatarUrl: null,
        avatar_url: null,
      };
      setUserProfile(nextProfile);
      updateAuthProfile(nextProfile);
      await reloadProfile();
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
        avatar_url: userProfile.avatarUrl,
      });
      const uri = savedProfile.avatar_url
        ? buildCacheBustedAvatarUrl(savedProfile.avatar_url, Date.now())
        : null;

      const nextProfile = {
        ...userProfile,
        ...savedProfile,
        avatarUrl: uri,
        avatar_url: uri,
      };

      setUserProfile(nextProfile);
      updateAuthProfile(nextProfile);
      await reloadProfile();
      navigation.goBack();
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível salvar o perfil.'));
      setIsSaving(false);
    }
  }

  const previewProfile = {
    ...userProfile,
    displayName,
    display_name: displayName,
  };

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

        {formError ? (
          <AppText variant="body" tone="danger" accessibilityLiveRegion="polite">
            {formError}
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
