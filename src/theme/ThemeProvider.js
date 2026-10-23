import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, shadow, spacing, typography } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');

  const value = useMemo(() => {
    const effective = mode === 'system' ? systemScheme ?? 'dark' : mode;
    const isDark = effective === 'dark';

    return {
      mode,
      setMode,
      isDark,
      scheme: effective,
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      shadow,
    };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  }
  return ctx;
}
