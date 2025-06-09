import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen2 from 'expo-splash-screen';
import { useAuth } from './lib/hooks/useAuth';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/reactQuery';
import AnimatedSwitcher from './components/AnimatedSwitcher';

import MainStackNavigator from './navigation/MainAppStackNavigator';
import AuthStackNavigator from './navigation/AuthStackNavigator';

SplashScreen2.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const { isInitializing, isAuth } = useAuth(queryClient);

  if (isInitializing) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AnimatedSwitcher condition={isAuth}>
              <MainStackNavigator />
              <AuthStackNavigator />
            </AnimatedSwitcher>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

