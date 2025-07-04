import type { LocationGeocodedAddress } from "expo-location";

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  fullAddress: LocationGeocodedAddress[];
}

export interface LocationItem {
  name?: string;
  lat: number;
  lng: number;
  isoCountryCode?: string;
}

export interface LocationParams {
  search_lat: number | null;
  search_lon: number | null;
  search_radius_meters: number | null;
}
