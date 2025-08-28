import type { QueryClient } from "@tanstack/react-query";
import type { LocationGeocodedAddress } from "expo-location";
import type {
  LocationData,
  LocationItem,
  LocationParams,
} from "../../types/location";
import { query } from "../hooks/useUserSettings";
import type { City } from "../../components/inputs/CityAutocomplete";
import countries from "../constants/country";

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
  // si el gps esta utiliza parametros null
  if (!settings || !settings.lastGPSLocation || !settings.useGPS) {
    return {
      search_lat: null,
      search_lon: null,
      search_radius_meters: null,
    };
  }
  // si el usuario selecciono una ciudad manualmente le da prioridad a la seleccion
  if (settings.customLocation) {
    return {
      search_lat: settings.customLocation.latitude,
      search_lon: settings.customLocation.longitude,
      search_radius_meters: settings.searchRadius,
    };
  }
  // devuelve la ultima ubicacion del gps
  return {
    search_lat: settings.lastGPSLocation.latitude,
    search_lon: settings.lastGPSLocation.longitude,
    search_radius_meters: settings.searchRadius,
  };
}

export function cityToLocationItem(city: City): LocationItem {
  const country = countries.find(
    (country) => country.code === city.country_code,
  );

  return {
    name: `${city.name}, ${country?.name ?? "N/A"}`,
    lat: city.latitude,
    lng: city.longitude,
    isoCountryCode: city.country_code,
  };
}

export function cityToLocationData(city: City): LocationData {
  const country =
    countries.find((country) => country.code === city.country_code)?.name ??
    "N/A";
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    city: city.name,
    country: country,
    fullAddress: [],
  };
}
