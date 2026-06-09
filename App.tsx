import "react-native-gesture-handler";

import React, { useEffect } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import * as SplashScreen2 from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";
import AnimatedSwitcher from "./components/AnimatedSwitcher";
import { AppProvider } from "./lib/context/AppContext";
import { useAuth } from "./lib/hooks/useAuth";
import { useNotificationHandler } from "./lib/hooks/useNotificationHandler";
import queryClient from "./lib/reactQuery";
import { supabase } from "./lib/supabase";
import { navegationLinkin } from "./lib/utils/navegation";
import AuthStackNavigator from "./navigation/AuthStackNavigator";
import MainStackNavigator from "./navigation/MainAppStackNavigator";
// vexo-analytics desactivado temporalmente en arranque: si inicializa antes de la UI puede bloquear el render.
// import { vexo } from 'vexo-analytics';
// vexo('758249de-a9ff-461d-82b8-aed7f221472b')

SplashScreen2.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const { isInitialized, isAuth } = useAuth(queryClient);
  const { navigationRef, handleInitialNotification } = useNotificationHandler();
  useEffect(() => {
    const extraerTokens = (url: string) => {
      const hash = url.split("#")[1] || "";
      const query = url.split("?")[1] || "";
      const params = new URLSearchParams(hash || query);

      return {
        type: params.get("type"), // recovery
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token"),
      };
    };

    const manejarUrl = async (url: string) => {
      const { type, access_token, refresh_token } = extraerTokens(url);

      if (type === "recovery" && access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) manejarUrl(url);
    });

    const sub = Linking.addEventListener("url", (event) => {
      manejarUrl(event.url);
    });

    return () => sub.remove();
  }, []);

  if (!isInitialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style="light"
          backgroundColor="#069eb3"
          translucent={false}
        />
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
