import type React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type GestureResponderEvent,
} from "react-native";

export interface GenericButtonProps
  extends Omit<PressableProps, "style" | "children"> {
  title: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const GenericButton: React.FC<GenericButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    if (loading) {
      return;
    }
    onPress?.(event);
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.text, isDisabled && styles.textDisabled, textStyle]}>
        {loading ? "Cargando…" : title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fe971a", // secondary
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#F5F5F5", // lightGray
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: "#FFFFFF", // background
    fontSize: 16,
    fontWeight: "600",
  },
  textDisabled: {
    color: "#767577", // gray
  },
});
