// LoadingView.tsx
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingViewProps {
  withNavBarMargin?: boolean;
}

function LoadingView({ withNavBarMargin = false }: LoadingViewProps) {
  return (
    <View
      style={[
        styles.container,
        withNavBarMargin ? { marginBottom: 100 } : undefined,
      ]}
    >
      <ActivityIndicator size="large" color="#FFA13C" />
    </View>
  );
}

export default LoadingView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});
