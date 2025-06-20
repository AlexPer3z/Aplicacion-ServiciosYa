import { BottomSheetView } from "@gorhom/bottom-sheet";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Color definitions
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

interface SettingSwitchProps {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

interface RadiusOptionProps {
  label: string;
  value: number;
  isSelected: boolean;
  onSelect: (value: number) => void;
}

const SettingSwitch = ({
  label,
  subtitle,
  value,
  onValueChange,
}: SettingSwitchProps) => {
  return (
    <View style={styles.switchContainer}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        trackColor={{ false: colors.gray, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.lightGray}
        ios_backgroundColor={colors.darkGray}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
};

const RadiusOption = ({
  label,
  value,
  isSelected,
  onSelect,
}: RadiusOptionProps) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(value)}
      style={[styles.radiusOption, isSelected && styles.radiusOptionSelected]}
    >
      <Text
        style={[
          styles.radiusOptionText,
          isSelected && styles.radiusOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

function OptionsSheetView() {
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const bottomNavBarHeight = insets.bottom;
  const { settings, updateSettings } = useUserSettings();
  // Track initial render
  const isInitialRender = useRef(true);

  const useGps = settings?.useGPS ?? true;
  const showAllCategories = settings?.showAllCategories ?? true;
  const locationRadius = settings?.searchRadius ?? 5000; // Default to 5km

  const handleGPSSwitch = useCallback(() => {
    updateSettings({ useGPS: !useGps });
  }, [useGps, updateSettings]);

  const handleCategoriesSwitch = useCallback(() => {
    updateSettings({ showAllCategories: !showAllCategories });
  }, [showAllCategories, updateSettings]);

  const handleRadiusSelect = useCallback(
    (radius: number) => {
      updateSettings({ searchRadius: radius });
    },
    [updateSettings],
  );

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Only invalidate when useGps changes AFTER initial render
    client.invalidateQueries({ queryKey: ["user", "services"] });
  }, [useGps, client]);

  const radiusOptions = [
    { value: 1000, label: "1KM" },
    { value: 3000, label: "3KM" },
    { value: 5000, label: "5KM" },
    { value: 10000, label: "10KM" },
  ];

  return (
    <BottomSheetView
      style={[
        styles.sheetContainer,
        { paddingBottom: bottomNavBarHeight + 20 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.sheetTitle}>Ajustes</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>

          <SettingSwitch
            label="Habilitar ubicación"
            subtitle="Usa tu ubicación actual para encontrar servicios cercanos"
            value={useGps}
            onValueChange={handleGPSSwitch}
          />

          {useGps && (
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Radio de búsqueda</Text>
              <View style={styles.radiusOptionsContainer}>
                {radiusOptions.map((option) => (
                  <RadiusOption
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    isSelected={locationRadius === option.value}
                    onSelect={handleRadiusSelect}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <SettingSwitch
            label="Mostrar todas las categorías"
            subtitle="Muestra categorías incluso si no hay servicios cercanos disponibles"
            value={showAllCategories}
            onValueChange={handleCategoriesSwitch}
          />
        </View>
      </View>
    </BottomSheetView>
  );
}

export default OptionsSheetView;

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 24,
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
  settingsContainer: {
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  switchLabelContainer: {
    flex: 1,
    gap: 4,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radiusContainer: {
    gap: 8,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  radiusOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  radiusOption: {
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 70,
    alignItems: "center",
  },
  radiusOptionSelected: {
    backgroundColor: colors.primary,
  },
  radiusOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  radiusOptionTextSelected: {
    color: colors.background,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.primaryLighter,
    marginVertical: 8,
  },
});
