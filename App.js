import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppText from './src/components/AppText';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { isSupabaseConfigured } from './src/services/supabase';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isSupabaseConfigured ? (
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        ) : (
          <MissingConfigNotice />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function MissingConfigNotice() {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm }]}
    >
      <AppText variant="title" tone="warning">
        Supabase não configurado
      </AppText>
      <AppText variant="body" tone="muted" style={styles.centerText}>
        Crie o arquivo .env na raiz do projeto (copie o .env.example), preencha a URL e a
        publishable key do Supabase e reinicie o servidor com npx expo start --clear.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
