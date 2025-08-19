// CityInput.tsx
import React, {  } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  GooglePlacesAutocomplete,
  type GooglePlaceData,
  type GooglePlaceDetail,
} from "react-native-google-places-autocomplete";
import type { LocationItem } from "../../types/location"; // Adjust path if needed

interface CityInputProps {
  onCitySelected: (location: LocationItem) => void;
  placeholder?: string;
  label?: string;
  initialValue?: string; // To set an initial text value if needed
}

export default function CityInput({
  onCitySelected,
  label = "Ciudad",
  placeholder = "Buscar ciudad…",
  initialValue = "",
}: CityInputProps) {
  // Use both `data` and `details` for the most robust information
  const handlePress = (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null,
  ) => {
    if (!details) return;

    // IMPROVEMENT: More robust way to get the city name.
    // 'locality' is the city. Fallback to what the user saw in the list.
    const cityName =
      details.address_components.find((c) => c.types.includes("locality"))
        ?.long_name || data.structured_formatting.main_text;

    const countryCode = details.address_components.find((c) =>
      c.types.includes("country"),
    )?.short_name;

    const location: LocationItem = {
      name: cityName,
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
      isoCountryCode: countryCode,
    };

    onCitySelected(location);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: "es",
          types: "(cities)", // Restrict results to cities
        }}
        fetchDetails={true} // Necessary to get `details` object in onPress
        onPress={handlePress}
        styles={{
          textInput: styles.input,
          container: styles.autocompleteContainer,
          listView: styles.listView, // Ensures dropdown appears over other content
        }}
        enablePoweredByContainer={false}
        textInputProps={{
          placeholderTextColor: "#999",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    // The container needs a zIndex if other elements might overlap it
    zIndex: 1000,
  },
  label: {
    fontSize: 15,
    color: "#19D4C6",
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8ECE8",
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: "#333",
    // Resetting default styles from the library
    height: 48,
  },
  autocompleteContainer: {
    flex: 0, // Prevents the container from expanding
  },
  listView: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8ECE8",
    marginTop: 4,
  },
});
