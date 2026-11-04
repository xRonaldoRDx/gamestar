import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setFormError('Preencha e-mail e senha.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      // On success the navigator swaps to the signed-in screens by itself
      await signIn(email, password);
    } catch (err) {
      setFormError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: spacing.lg,
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.lg,
            gap: spacing.md,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.lg, gap: spacing.xs }}>
          <AppText variant="display" tone="primary">
            Gamestar
          </AppText>
          <AppText variant="body" tone="muted">
            Registre o que você joga, zera e abandona — e veja o que seus amigos estão jogando.
          </AppText>
        </View>

        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          isPassword
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
        />

        {formError ? (
          <AppText variant="body" tone="danger" accessibilityLiveRegion="polite">
            {formError}
          </AppText>
        ) : null}

        <Button
          label={isSubmitting ? 'Entrando...' : 'Entrar'}
          onPress={handleSignIn}
          disabled={isSubmitting}
        />
        <Button
          label="Criar uma conta"
          variant="ghost"
          onPress={() => navigation.navigate('SignUp')}
          disabled={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
