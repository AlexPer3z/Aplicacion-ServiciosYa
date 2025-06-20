// app/hooks/useAuth.ts
import { useEffect, useCallback } from "react";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { Alert, AppState, type AppStateStatus } from "react-native";
import { supabase } from "../supabase";
import type { Session } from "@supabase/supabase-js";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { lastUserId } from "../storage";
import { clearSettingsToStorage, queryKey } from "./useUserSettings";
import { sessionQueryOptions } from "../queryOptions";

// Prevenir que la pantalla de inicio se oculte automáticamente antes de que estemos listos
SplashScreen.preventAutoHideAsync();

// Definir y exportar la clave de consulta para consistencia en toda la aplicación
export const sessionQueryKey = ["session"];

/**
 * Un hook para inicializar y gestionar la sesión del usuario.
 * Está diseñado para llamarse una vez en el componente raíz (ej. App.tsx),
 * pasando la instancia de queryClient directamente.
 *
 * @param queryClient - La instancia del cliente TanStack Query.
 */
export function useAuth(queryClient: QueryClient) {
  // Usar `useQuery` para obtener la sesión inicial.
  // Pasamos el `queryClient` directamente, por lo que funciona fuera de un <QueryClientProvider>.
  const {
    data: session,
    // isPending es el equivalente moderno de isLoading y es perfecto para el estado de inicialización.
    isPending: isInitializing,
  } = useQuery(sessionQueryOptions, queryClient);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const { url } = event;
    const fragment = url.split("#")[1];
    if (!fragment) return;

    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      // `setSession` activará el listener `onAuthStateChange` abajo,
      // que luego actualizará la caché de TanStack Query.
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Error de sesión URL:", error.message);
        Alert.alert(
          "Error de inicio de sesión",
          "No se pudo procesar la redirección de login",
        );
      }
    } else {
      const errorDescription = params.get("error_description");
      if (errorDescription) Alert.alert("Error OAuth", errorDescription);
    }
  }, []);

  // Configurar listeners para el estado de autenticación y deep linking
  useEffect(() => {
    // 1. Comprobación inicial de deep link para cuando la app se inicia desde una URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // 2. Listener de cambios de estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Actualizar manualmente la caché de consultas cuando cambia el estado de autenticación.
      // Este es el modelo "push" que mantiene nuestros datos actualizados.
      queryClient.setQueryData(sessionQueryKey, newSession);
      if (_event === "SIGNED_IN" && newSession)
        onSignedIn(newSession, queryClient);
    });

    // 3. Listener de deep link para cuando la app ya está en ejecución
    const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

    // 4. Función de limpieza
    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
    // Las dependencias son estables, por lo que este efecto se ejecuta solo una vez.
  }, [queryClient, handleDeepLink]);

  // Ocultar la pantalla de inicio una vez que se completa la obtención inicial de la sesión
  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Limpieza al desmontar
    return () => {
      subscription.remove();
    };
  }, []);

  // Manejar cambio de usuario y limpieza de almacenamiento
  useEffect(() => {
    const handleUserChange = async () => {
      if (!session?.user) return;

      try {
        const storedUserId = await lastUserId.get();
        const currentUserId = session.user.id;

        if (storedUserId && storedUserId !== currentUserId) {
          // Limpiar almacenamiento específico del usuario cuando inicia sesión un usuario diferente
          await clearSettingsToStorage(); // Reemplazar con tu clave
          queryClient.invalidateQueries({
            queryKey: queryKey,
          });
        }

        // Actualizar el último ID de usuario en el almacenamiento
        await lastUserId.set(currentUserId);
      } catch (error) {
        console.error("Error al manejar cambio de usuario:", error);
      }
    };

    handleUserChange();
  }, [session?.user?.id, queryClient]); // Solo se ejecuta cuando cambia el ID de usuario

  return {
    session,
    isInitializing,
    isAuth: !!session?.user,
  };
}

function onSignedIn(session: Session, client: QueryClient) {
  // TODO
}
