import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { LoadingState } from '../components/ScreenState';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import PeopleScreen from '../screens/PeopleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import GameFormScreen from '../screens/GameFormScreen';
import NewGameScreen from '../screens/NewGameScreen';
import RequestGameScreen from '../screens/RequestGameScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminRequestScreen from '../screens/AdminRequestScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  FeedTab: { active: 'home', inactive: 'home-outline' },
  SearchTab: { active: 'search', inactive: 'search-outline' },
  PeopleTab: { active: 'people', inactive: 'people-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

function useHeaderOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
  };
}

function MainTabs() {
  const { colors } = useTheme();
  const headerOptions = useHeaderOptions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOptions,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        // On Android the tab bar would otherwise sit on top of the keyboard
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="FeedTab" component={FeedScreen} options={{ title: 'Gamestar', tabBarLabel: 'Feed' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Buscar Jogo', tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="PeopleTab" component={PeopleScreen} options={{ title: 'Jogadores', tabBarLabel: 'Pessoas' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Meu Perfil', tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  const { session, isLoading } = useAuth();
  const headerOptions = useHeaderOptions();

  if (isLoading) {
    return <LoadingState message="Abrindo o Gamestar..." />;
  }

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* Both themes use dark backgrounds, so status bar text is always light */}
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{ ...headerOptions, contentStyle: { backgroundColor: colors.background } }}
      >
        {session ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="GameDetails" component={GameDetailsScreen} options={{ title: 'Jogo' }} />
            <Stack.Screen name="GameForm" component={GameFormScreen} options={{ title: 'Gamestar • Avaliação' }} />
            <Stack.Screen name="RequestGame" component={RequestGameScreen} options={{ title: 'Pedir um Jogo' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Pedidos de Jogos' }} />
            <Stack.Screen name="AdminRequest" component={AdminRequestScreen} options={{ title: 'Analisar Pedido' }} />
            <Stack.Screen name="NewGame" component={NewGameScreen} options={{ title: 'Cadastrar Jogo' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Criar Conta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
