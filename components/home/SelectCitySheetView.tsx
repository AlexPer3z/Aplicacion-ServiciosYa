import { useState } from "react";
import colors from "../../lib/constants/colors";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { type City, CityAutocomplete } from "../inputs/CityAutocomplete";
import SheetContainer from "../sheet/SheetContainer";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { cityToLocationData } from "../../lib/utils/location";
import { useSuspenseQuery } from "@tanstack/react-query";
import { locationIpInfoQueryOptions } from "../../lib/queryOptions";
import { withSuspense } from "../withSuspense";
import LoadingView from "../LoadingView";
import { GenericButton } from "../GenericButtom";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocationStore } from "../../store/locationStore";

function SelectCitySheetView() {
  const { effectiveLocation, source, setCustomLocation, clearCustomLocation } = useLocationStore();
  const [initialLocation, setInitialLocation] = useState(effectiveLocation);
  const { updateSettings, settings } = useUserSettings();
  const { data: locationInfo, error } = useSuspenseQuery(
    locationIpInfoQueryOptions,
  );

  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(false); // 🔹 estado loading
  const country = error ? "AR" : locationInfo.country;

  const queryClient = useQueryClient();

  const [currentLocation, setCurrentLocation] = useState(effectiveLocation);
  const canClear = initialLocation !== currentLocation || source === "custom";

  const handleSubmit = async () => {
    if (!city) return;
    setLoading(true);
    try {

      const newLocation = cityToLocationData(city);
      await setCustomLocation(newLocation);
      await updateSettings({ customLocation: newLocation });

      // 🔹 Actualizamos el estado local inmediatamente
      setCurrentLocation(newLocation);

      queryClient.invalidateQueries({ queryKey: ["user", "services"] });
    } finally {
      setLoading(false);
    }
  };


  const handleClearCity = async () => {
    setLoading(true);
    try {
      await updateSettings({ customLocation: null });
      setCity(null);
      clearCustomLocation();
      queryClient.invalidateQueries({ queryKey: ["user", "services"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetContainer style={styles.sheetContainer}>
      <Text style={styles.sheetTitle}>Selecciona tu ciudad</Text>

      {/* Display current city info if set, otherwise show GPS info */}
      <View style={styles.currentCityContainer}>
        <View style={styles.currentCityHeader}>
          <MaterialIcons
            name="location-on"
            size={20}
            color={colors.primary || "#3b82f6"}
            style={styles.locationIcon}
          />
          <View style={styles.currentCityInfo}>
            <Text style={styles.currentCityTitle}>Ciudad actual</Text>
            <Text style={styles.currentCityText}>
              {currentLocation?.city}, {currentLocation?.country}
            </Text>
          </View>
          {canClear && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCity}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.infoTextLong}>
        {source === "custom"
          ? "Puedes cambiar tu ciudad personalizada o eliminarla para usar tu ubicación GPS automática."
          : "Si no seleccionas una ciudad específica, utilizaremos tu ubicación GPS para mostrarte contenido relevante de tu área."}
      </Text>

      <View style={styles.autocompleteContainer}>
        <CityAutocomplete
          label="Ciudad"
          countryCode={country}
          onSelectCity={(city) => {
            console.log("Ciudad seleccionada:", city);
            setCity(city || null);
          }}
          placeholder="Selecciona una ciudad"
          dropdownProps={{ direction: "down" }}
        />
      </View>


      <GenericButton
        title={loading ? "Cargando..." : "Actualizar"} // 🔹 cambia título si carga
        onPress={handleSubmit}
        style={styles.button}
        disabled={loading || !city} // 🔹 deshabilitado mientras carga
      />
    </SheetContainer>
  );
}

export default withSuspense(
  SelectCitySheetView,
  <LoadingView withNavBarMargin />,
);

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  infoTextLong: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  autocompleteContainer: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  currentCityContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gpsLocationContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f0fdf4", // Light green background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0", // Light green border
  },
  currentCityHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  gpsLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 12,
  },
  currentCityInfo: {
    flex: 1,
  },
  gpsLocationInfo: {
    flex: 1,
  },
  currentCityTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gpsLocationTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#065f46", // Dark green
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentCityText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  gpsLocationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669", // Green
    lineHeight: 20,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
});
