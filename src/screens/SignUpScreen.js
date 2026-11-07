import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

const MIN_PASSWORD_LENGTH = 6;
const HEADER_KEYBOARD_OFFSET = Platform.select({ ios: 96, android: 84, default: 0 });

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { colors, spacing } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSignUp() {
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setFormError('Preencha todos os campos.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== passwordConfirmation) {
      setFormError('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      await signUp({ email, password, username, displayName });
    } catch (err) {
      setFormError(err.message);
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
          { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Como você quer ser chamado"
          maxLength={40}
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
        />
        <TextField
          label="Nome de usuário"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="ex: gustavo_gamer"
          hint="3 a 20 caracteres: letras minúsculas, números e _"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          maxLength={20}
        />
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          isPassword
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirmar senha"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          placeholder="Digite a senha novamente"
          isPassword
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          hint={
            passwordConfirmation && password !== passwordConfirmation
              ? 'As senhas ainda não coincidem.'
              : undefined
          }
          onSubmitEditing={handleSignUp}
          returnKeyType="go"
        />

        {formError ? (
          <AppText variant="body" tone="danger" accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}

        <Button
          label={isSubmitting ? 'Criando conta...' : 'Criar conta'}
          onPress={handleSignUp}
          disabled={isSubmitting}
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
