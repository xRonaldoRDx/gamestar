import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Session is persisted in expo-sqlite's localStorage so the login survives app restarts.
// Stays null when .env is missing; App renders a setup notice instead of crashing.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function toFriendlyMessage(error, fallback = 'Algo deu errado. Tente novamente.') {
  if (!error) return fallback;

  const message = String(error.message || '').toLowerCase();

  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('user already registered')) return 'Já existe uma conta com este e-mail.';
  if (message.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('unable to validate email') || message.includes('invalid format')) return 'E-mail inválido.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('network request failed') || message.includes('fetch failed')) {
    return 'Falha de conexão. Verifique sua internet.';
  }
  if (error.code === '23505') return 'Este registro já existe.';

  console.error('[Supabase]', error);
  return fallback;
}
