import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type LoadingIndicatorProps = {
  loading?: boolean;
  size?: number;
  color?: string;
  children?: React.ReactNode;
};

const LoadingIndicator = ({
  loading = true,
  size = 32,
  color = "#000",
  children,
}: LoadingIndicatorProps) => {
  // Animation values
  const rotation = useSharedValue(0);
  const transitionProgress = useSharedValue(loading ? 1 : 0);

  // Handle loading state changes
  React.useEffect(() => {
    if (loading) {
      transitionProgress.value = withTiming(1, { duration: 200 });
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // Infinite repetition
      );
    } else {
      transitionProgress.value = withTiming(0, { duration: 200 });
      rotation.value = withTiming(0);
    }
  }, [loading]);

  // Loading icon animation (fixed to 'autorenew' icon)
  const loadingStyle = useAnimatedStyle(() => ({
    opacity: transitionProgress.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: interpolate(transitionProgress.value, [0, 1], [0.9, 1]) },
    ],
    position: "absolute",
  }));

  // Content animation
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0, 1], [1, 0]),
    transform: [
      { scale: interpolate(transitionProgress.value, [0, 1], [1, 0.9]) },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Loading state (fixed icon) */}
      <Animated.View style={loadingStyle}>
        <MaterialCommunityIcons name="loading" size={size} color={color} />
      </Animated.View>

      {/* Normal state (content) */}
      <Animated.View style={contentStyle}>
        {children || (
          <MaterialIcons name="check-circle" size={size} color={color} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
});

export default LoadingIndicator;
