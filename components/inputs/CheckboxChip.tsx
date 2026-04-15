import type React from "react";
import { Text, StyleSheet, Pressable, type ViewStyle, type StyleProp } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// A map to hold style values for each size
const sizeMap = {
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    iconSize: 14,
    fontSize: 12,
    iconMarginRight: 4,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    iconSize: 16,
    fontSize: 14,
    iconMarginRight: 4,
  },
  lg: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    iconSize: 20,
    fontSize: 16,
    iconMarginRight: 6,
  },
};

interface CheckboxChipProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg'; // New size prop
  style?: StyleProp<ViewStyle>;
}

const CheckboxChip: React.FC<CheckboxChipProps> = ({
  label,
  checked,
  onPress,
  size = "md", // Default size is 'md'
  style,
}) => {
  // Get the style values for the current size
  const currentSize = sizeMap[size];

  // Determine the color for the icon and label based on the checked state
  const color = checked ? styles.labelChecked.color : styles.label.color;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        // Apply size-specific styles
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
        },
        // Apply conditional styles
        checked && styles.chipChecked,
        pressed && styles.chipPressed,
        style,
      ]}
    >
      <Ionicons
        // Use a filled checkbox when checked for better visual distinction
        name={checked ? "checkbox" : "square-outline"}
        size={currentSize.iconSize}
        color={color}
        style={[styles.icon, { marginRight: currentSize.iconMarginRight }]}
      />
      <Text
        style={[
          styles.label,
          { fontSize: currentSize.fontSize },
          checked && styles.labelChecked,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Base chip style (size-specific properties are now applied dynamically)
  chip: {
    height: "100%",
    backgroundColor: "#fe971a",
    flexDirection: "row",
    alignItems: "center",
  },
  // Style when the chip is checked
  chipChecked: {
    backgroundColor: "#fe971a",
  },
  // Style when the chip is being pressed
  chipPressed: {
    opacity: 0.9,
  },
  // Base icon style (margin is now dynamic)
  icon: {},
  // Base label style (fontSize is now dynamic)
  label: {
    color: "white",
    fontWeight: "500",
    maxWidth: 150,
    includeFontPadding: false,
  },
  // Style for the label when the chip is checked
  labelChecked: {
    color: "white",
    fontWeight: "700",
  },
});

export default CheckboxChip;