import { useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import type { NavigationContainerRef } from "@react-navigation/native";
import type { MainStackParamList } from "../../types/navigation";

export const useNotificationHandler = () => {
  const navigationRef =
    useRef<NavigationContainerRef<MainStackParamList>>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (data?.screen && typeof data.screen === "string") {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(
            data.screen as keyof MainStackParamList,
            data.params,
          );
        }
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
