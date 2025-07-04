import type React from "react";
import { type ColorValue, StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenContainerProps = {
  children: React.ReactNode;
  color?: ColorValue;
  style?: ViewStyle;
};

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  color = "#fff",
  style,
}) => (
  <SafeAreaView style={[styles.container, { backgroundColor: color }, style]}>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenContainer;
