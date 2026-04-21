import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import type { NavigationContainerRef } from "@react-navigation/native";
import type { MainStackParamList } from "../../types/navigation";

// Mostrar notificaciones incluso con la app en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotificationHandler = () => {
  const navigationRef =
    useRef<NavigationContainerRef<MainStackParamList>>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (data?.screen !== "ChatIndividual" && typeof data.screen === "string") {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(
            data.screen as keyof MainStackParamList,
            data.params,
          );
        }
      }else if (data?.screen === "ChatIndividual") {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(
            "ChatIndividual",
            data.params,
          );
        }
        return;
      }
    },
    [],
  );

  const handleInitialNotification = useCallback(async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) handleNotificationResponse(response);
  }, [handleNotificationResponse]);

  // Setup ongoing notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => subscription.remove();
  }, [handleNotificationResponse]);

  return {
    navigationRef,
    handleInitialNotification,
  };
};
