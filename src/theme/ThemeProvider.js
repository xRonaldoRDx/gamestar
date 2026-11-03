import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, shadow, spacing, typography } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');

  const value = useMemo(() => {
    const effectiveScheme = mode === 'system' ? systemScheme ?? 'dark' : mode;
    const isDark = effectiveScheme === 'dark';

    return {
      mode,
      setMode,
      isDark,
      scheme: effectiveScheme,
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
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return context;
}
