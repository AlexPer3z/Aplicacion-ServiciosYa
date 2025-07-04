import "react-native-gesture-handler";

import React, {  } from "react";
import {
  NavigationContainer,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen2 from "expo-splash-screen";
import { useAuth } from "./lib/hooks/useAuth";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./lib/reactQuery";
import AnimatedSwitcher from "./components/AnimatedSwitcher";
import ToastManager from "toastify-react-native";
import { AppProvider } from './lib/context/AppContext';
import MainStackNavigator from "./navigation/MainAppStackNavigator";
import AuthStackNavigator from "./navigation/AuthStackNavigator";
import { navegationLinkin } from "./lib/utils/navegation";
import { useNotificationHandler } from "./lib/hooks/useNotificationHandler";

SplashScreen2.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const { isInitializing, isAuth } = useAuth(queryClient);
  const { navigationRef, handleInitialNotification } = useNotificationHandler();

  if (isInitializing) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={navegationLinkin}
            onReady={handleInitialNotification}
          >
            <AnimatedSwitcher condition={isAuth}>
              <MainStackNavigator />
              <AuthStackNavigator />
            </AnimatedSwitcher>
            <ToastManager showCloseIcon={false} />
          </NavigationContainer>
          </AppProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
