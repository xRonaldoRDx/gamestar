import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../theme/ThemeProvider';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import GameFormScreen from '../screens/GameFormScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
          options={{ title: 'Gamestar' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Gamestar • Buscar Jogo' }}
        />
        <Stack.Screen
          name="GameForm"
          component={GameFormScreen}
          options={{ title: 'Gamestar • Avaliar Jogo' }}
        />
        <Stack.Screen
          name="GameDetails"
          component={GameDetailsScreen}
          options={{ title: 'Gamestar • Detalhes' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
