import type React from "react";
import { Text, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { LocationData } from "../../types/location";

interface LocationChipProps {
  location: LocationData | null;
}



const LocationChip: React.FC<LocationChipProps> = ({ location }) => {
  const [locationText, setLocationText] = useState<string>("Cargando ubicación");

  useEffect(() => {
    if (location) {
      const { city, country } = location;
      setLocationText(
        city ? `${city}, ${country}` : country || "Ubicación desconocida",
      );
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <View style={styles.chip}>
        <Ionicons
          name="location-outline"
          size={14}
          color="white"
          style={styles.icon}
        />
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {locationText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    // borderWidth: 1,
    // borderColor: "white",
    overflow: "hidden",
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
    maxWidth: 150,
    includeFontPadding: false,
  },
});

export default LocationChip;