import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../services/profiles';
import { toFriendlyMessage } from '../services/supabase';
import { useTheme } from '../theme/ThemeProvider';

const MAX_BIO_LENGTH = 160;
const HEADER_KEYBOARD_OFFSET = Platform.select({ ios: 96, android: 84, default: 0 });

export default function EditProfileScreen({ route, navigation }) {
  const { userId, reloadProfile } = useAuth();
  const { colors, spacing } = useTheme();
  const { profile } = route.params;

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSave() {
    setIsSaving(true);
    setFormError('');
    try {
      await updateProfile(userId, { display_name: displayName, bio });
      await reloadProfile();
      navigation.goBack();
    } catch (err) {
      setFormError(toFriendlyMessage(err, 'Não foi possível salvar o perfil.'));
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
          @{profile.username}
        </AppText>
        <TextField
          label="Nome"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
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
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />

        {formError ? (
          <AppText variant="body" tone="danger">
            {formError}
          </AppText>
        ) : null}

        <Button label={isSaving ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={isSaving} />
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
