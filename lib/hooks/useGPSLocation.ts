// hooks/useGPSLocation.ts
import { useEffect } from "react";
import {
  fetchUserLocation,
  PERMISSION_DENIED_ERROR,
  userLocationQueryOptions,
} from "./useLocation";
import { useUserSettings } from "./useUserSettings";
import { useQuery } from "@tanstack/react-query";

export function useGPSLocation() {
  const { settings, updateSettings } = useUserSettings();
  const useGPS = settings?.useGPS ?? false;
  const { data: location, error } = useQuery({
    ...userLocationQueryOptions,
    enabled: useGPS,
  });

  useEffect(() => {
    if (location) {
      updateSettings({ lastGPSLocation: location });
    }
  }, [location, updateSettings]);

  useEffect(() => {
    if (error && error.message === PERMISSION_DENIED_ERROR) {
      updateSettings({ useGPS: false });
    }
  }, [error]);
}
