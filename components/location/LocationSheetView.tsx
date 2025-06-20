import { BottomSheetView } from "@gorhom/bottom-sheet";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../../lib/hooks/useLocation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import LoadingIndicator from "../LoadingIndicator";
import { useEffect, useMemo, useState } from "react";
import type { LocationItem } from "../../types/location";
import { useUserSettingsSuspense } from "../../lib/hooks/useUserSettings";
import { withSuspense } from "../withSuspense";
import LoadingView from "../LoadingView";
import { ManualSelectLocation } from "./ManualSelectLocation";
import { getLocationName } from "../../lib/utils/location";

// Reuse the same color scheme
const colors = {
  primary: "#00B8A9",
  primaryLight: "#5DD0C5",
  primaryLighter: "#A0E6DF",
  primaryDark: "#00897B",
  secondary: "#FFA13C",
  secondaryLight: "#FFB96A",
  secondaryLighter: "#FFD4A8",
  gray: "#767577",
  lightGray: "#F5F5F5",
  darkGray: "#3E3E3E",
  textPrimary: "#1A1A1A",
  textSecondary: "#5E5E5E",
  background: "#FFFFFF",
};

interface LocationInputProps {
  initialValue?: LocationItem | null;
  onLocationSelected?: (location: LocationItem) => void;
}

function LocationSheetView({
  onLocationSelected,
  initialValue,
}: LocationInputProps) {
  const insets = useSafeAreaInsets();
  const { data: settings } = useUserSettingsSuspense();
  const useGps = settings?.useGPS;
  const { location, isLoading } = useLocation();
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);

  const currentLocation = useMemo(() => {
    if (!location) return null;
    return {
      name: getLocationName(location.fullAddress[0]),
      lat: location.latitude,
      lng: location.longitude,
      isoCountryCode: location.fullAddress[0]?.isoCountryCode || "N/A",
    };
  }, [location]);

  useEffect(() => {
    if (currentLocation && useGps) {
      setSelectedItem(currentLocation);
    } else if (initialValue) {
      setSelectedItem(initialValue);
    }
  }, [currentLocation, useGps, initialValue]);

  const handleSubmit = () => {
    if (selectedItem && onLocationSelected) {
      onLocationSelected(selectedItem);
    }
  };

  const submitDisabled = !selectedItem;

  return (
    <BottomSheetView
      style={[styles.sheetContainer]}
    >
      <View style={styles.header}>
        <Text style={styles.sheetTitle}>Elige tu ubicación</Text>
      </View>

      <View style={styles.content}>
        {useGps ? (
          <View style={styles.gpsContainer}>
            {initialValue && (
              <View style={styles.locationCard}>
                <Text style={styles.cardLabel}>Ubicación guardada</Text>
                <View style={styles.locationRow}>
                  <MaterialIcons
                    name="location-pin"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationName}>{initialValue.name}</Text>
                    <Text style={styles.coordinates}>
                      lat: {initialValue.lat.toFixed(4)}, lng:{" "}
                      {initialValue.lng.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.locationCard}>
              <Text style={styles.cardLabel}>Tu ubicación actual</Text>
              <View style={styles.locationRow}>
                {isLoading ? (
                  <LoadingIndicator size={20} color={colors.primary} />
                ) : (
                  <MaterialIcons
                    name="my-location"
                    size={20}
                    color={colors.primary}
                  />
                )}

                <View style={styles.locationDetails}>
                  {currentLocation ? (
                    <>
                      <Text style={styles.locationName}>
                        {currentLocation.name}
                      </Text>
                      <Text style={styles.coordinates}>
                        lat: {location?.latitude.toFixed(4)}, lng:{" "}
                        {location?.longitude.toFixed(4)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.locationName}>
                      {isLoading
                        ? "Detectando ubicación..."
                        : "Ubicación no disponible"}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <ManualSelectLocation
              onChange={setSelectedItem}
              // initialValue={initialValue}
            />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            submitDisabled && styles.submitButtonDisabled,
            pressed && !submitDisabled && styles.submitButtonPressed,
          ]}
          onPress={handleSubmit}
          disabled={submitDisabled}
        >
          <Text style={styles.submitButtonText}>Actualizar ubicación</Text>
        </Pressable>
      </View>
    </BottomSheetView>
  );
}

export default withSuspense(
  LocationSheetView,
  <LoadingView withNavBarMargin />,
);

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLighter,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  content: {
    gap: 24,
  },
  gpsContainer: {
    gap: 16,
  },
  manualContainer: {
    marginBottom: 8,
  },
  locationCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationDetails: {
    flex: 1,
    marginLeft: 16,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 13,
    color: colors.gray,
    fontFamily: "monospace",
  },
  submitButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
