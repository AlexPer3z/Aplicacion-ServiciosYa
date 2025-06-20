import type { LocationGeocodedAddress } from "expo-location";

export function locationQueryString(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

export function getLocationName(location: LocationGeocodedAddress) {
  const name =
    `${location?.city}, ${location?.region}, ${location?.isoCountryCode}` ||
    "N/A";
  return name;
}
