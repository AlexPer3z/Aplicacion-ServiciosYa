import type React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type PressableStateCallbackType,
} from "react-native";
import colors from "../../lib/constants/colors";

interface ListButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean; // New prop to control compact mode
}

const ListButton: React.FC<ListButtonProps> = ({
  icon,
  title,
  description,
  onPress,
  badge,
  disabled = false,
  style,
  compact = false, // Default to false to maintain existing behavior
}) => {
  const getContainerStyle = ({
    pressed,
  }: PressableStateCallbackType): ViewStyle | ViewStyle[] =>
    [
      compact ? styles.compactContainer : styles.container,
      pressed && styles.pressed,
      disabled && styles.disabled,
      style,
    ].filter(Boolean) as ViewStyle[];

  return (
    <Pressable
      style={getContainerStyle}
      onPress={onPress}
      disabled={disabled}
      android_ripple={{
        color: colors.primaryLighter,
        borderless: false,
        radius: 200,
      }}
    >
      <View
        style={compact ? styles.compactIconContainer : styles.iconContainer}
      >
        {icon}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={compact ? styles.compactTitle : styles.title}>
            {title}
          </Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={compact ? styles.compactDescription : styles.description}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  } as ViewStyle,

  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  } as ViewStyle,

  pressed: {
    backgroundColor: colors.primaryLighter,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,

  disabled: {
    opacity: 0.5,
  } as ViewStyle,

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  } as ViewStyle,

  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  } as ViewStyle,

  contentContainer: {
    flex: 1,
    gap: 4,
  } as ViewStyle,

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as ViewStyle,

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  } as TextStyle,

  compactTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  } as TextStyle,

  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: "justify",
  } as TextStyle,

  compactDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 16,
    textAlign: "justify",
  } as TextStyle,

  badge: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  } as ViewStyle,

  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  } as TextStyle,
});

export default ListButton;
