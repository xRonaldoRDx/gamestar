import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase, toFriendlyMessage } from '../services/supabase';
import { getProfile, isUsernameAvailable, USERNAME_PATTERN } from '../services/profiles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getProfile(userId));
    } catch (err) {
      console.error('[AuthContext] Failed to load profile:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // supabase-js recommends not awaiting other Supabase calls inside this callback
      setTimeout(() => loadProfile(nextSession?.user.id), 0);
    });

    // Token refresh only runs while the app is in the foreground
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      listener.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(toFriendlyMessage(error, 'Não foi possível entrar.'));
  }, []);

  const signUp = useCallback(async ({ email, password, username, displayName }) => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      throw new Error('O usuário deve ter de 3 a 20 caracteres: letras minúsculas, números ou _.');
    }
    if (!(await isUsernameAvailable(normalizedUsername))) {
      throw new Error('Este nome de usuário já está em uso.');
    }

    // The profiles row is created by a database trigger from this metadata
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: normalizedUsername, display_name: displayName.trim() } },
    });
    if (error) throw new Error(toFriendlyMessage(error, 'Não foi possível criar a conta.'));

    if (!data.session) {
      throw new Error(
        'Conta criada, mas o Supabase exige confirmação de e-mail. Desative "Confirm email" no painel ou confirme pelo link recebido.'
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const reloadProfile = useCallback(
    () => loadProfile(session?.user.id),
    [loadProfile, session]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        userId: session?.user.id ?? null,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
