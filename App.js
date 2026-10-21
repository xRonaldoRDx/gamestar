import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/services/database';
import { colors } from './src/theme/tokens';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import GameFormScreen from './src/screens/GameFormScreen';
import GameDetailsScreen from './src/screens/GameDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err) {
        setDbError(err.message || 'Falha ao iniciar o banco de dados.');
      }
    }

    setup();
  }, []);

  if (dbError) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>Erro no Banco: {dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Inicializando banco local...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Gamestar Backlog' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Buscar na RAWG' }}
          />
          <Stack.Screen
            name="GameForm"
            component={GameFormScreen}
            options={{ title: 'Avaliar Jogo' }}
          />
          <Stack.Screen
            name="GameDetails"
            component={GameDetailsScreen}
            options={{ title: 'Detalhes do Jogo' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
