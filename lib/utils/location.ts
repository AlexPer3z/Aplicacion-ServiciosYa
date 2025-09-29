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
import * as Location from "expo-location";

export function locationQueryString(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

export function getLocationName(location: LocationGeocodedAddress) {
  const name =
    `${location?.city}, ${location?.region}, ${location?.isoCountryCode}` ||
    "N/A";
  return name;
}

export async function getLocationParamsFromClient(client: QueryClient): Promise<LocationParams> {
  const settings = client.getQueryData(query.queryKey) || {};

  console.log("Solicitando ubicación al iniciar sesión...");

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      // 1️⃣ Intentamos obtener la última ubicación conocida (rápido)
      let location = await Location.getLastKnownPositionAsync();

      if (!location) {
        // 2️⃣ Si no hay última ubicación, pedimos una nueva
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000,
          timeout: 10000,
        });
      } else {
        console.log("📌 Usando lastKnownPosition mientras llega la ubicación exacta...");
        // 🔄 Pedimos en segundo plano una más actualizada
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000,
          timeout: 10000,
        }).then((freshLocation) => {
          if (freshLocation) {
            updateClientWithCoords(client, settings, freshLocation.coords);
          }
        });
      }

      const coords = location.coords;
      updateClientWithCoords(client, settings, coords);

      return {
        search_lat: coords.latitude,
        search_lon: coords.longitude,
        search_radius_meters: settings?.searchRadius ?? 5000,
      };
    } else {
      console.warn("Permiso de ubicación denegado");
      return { search_lat: null, search_lon: null, search_radius_meters: null };
    }
  } catch (e) {
    console.warn("Error obteniendo ubicación:", e);
    return { search_lat: null, search_lon: null, search_radius_meters: null };
  }
}

// 👉 función helper para no repetir código
async function updateClientWithCoords(client: QueryClient, settings: any, coords: { latitude: number; longitude: number }) {
  const baseSettings = {
    ...settings,
    lastGPSLocation: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      city: null,
      country: null,
      fullAddress: [],
    },
    useGPS: true,
  };
  client.setQueryData(query.queryKey, baseSettings);

  try {
    const geocoded = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    console.log("📍 reverseGeocodeAsync:", geocoded);

    const firstResult = geocoded[0];
    const cityName =
      firstResult?.city ||
      firstResult?.district ||
      firstResult?.region || // provincia
      firstResult?.subregion ||
      "Desconocida";

    const countryName = firstResult?.country ?? "Desconocido";

    client.setQueryData(query.queryKey, {
      ...baseSettings,
      lastGPSLocation: {
        ...baseSettings.lastGPSLocation,
        city: cityName,
        country: countryName,
        fullAddress: geocoded,
      },
    });
  } catch (err) {
    console.warn("Error en reverseGeocode:", err);
  }
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
