import type { QueryClient } from "@tanstack/react-query";
import type { LocationGeocodedAddress } from "expo-location";
import type { LocationParams } from "../../types/location";
import { query } from "../hooks/useUserSettings";

export function locationQueryString(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

export function getLocationName(location: LocationGeocodedAddress) {
  const name =
    `${location?.city}, ${location?.region}, ${location?.isoCountryCode}` ||
    "N/A";
  return name;
}

export function getLocationParamsFromClient(
  client: QueryClient,
): LocationParams {
  const settings = client.getQueryData(query.queryKey);
  if (!settings || !settings.lastGPSLocation || !settings.useGPS) {
    return {
      search_lat: null,
      search_lon: null,
      search_radius_meters: null,
    };
  }
  return {
    search_lat: settings.lastGPSLocation.latitude,
    search_lon: settings.lastGPSLocation.longitude,
    search_radius_meters: settings.searchRadius,
  };
}
