import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { BacklogProvider } from './src/contexts/BacklogContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BacklogProvider>
          <AppNavigator />
        </BacklogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
