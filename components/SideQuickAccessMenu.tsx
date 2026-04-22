import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface QuickAccessItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface SideQuickAccessMenuProps {
  onToori360Press?: () => void;
  onCrmPress?: () => void;
  onFacturadorPress?: () => void;
}

const SideQuickAccessMenu: React.FC<SideQuickAccessMenuProps> = ({
  onToori360Press,
  onCrmPress,
  onFacturadorPress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breatheLoop.start();

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    haloLoop.start();

    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: -1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ])
    );
    wiggleLoop.start();

    return () => {
      breatheLoop.stop();
      haloLoop.stop();
      wiggleLoop.stop();
    };
  }, []);

  const items: QuickAccessItem[] = [
    {
      label: "Toori360",
      icon: "globe-outline",
      color: "#069eb3",
      onPress: () => onToori360Press?.(),
    },
    {
      label: "CRM",
      icon: "people-outline",
      color: "#fe971a",
      onPress: () => onCrmPress?.(),
    },
    {
      label: "FacturadorIA",
      icon: "receipt-outline",
      color: "#19D4C6",
      onPress: () => onFacturadorPress?.(),
    },
  ];

  const runPulse = () => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleMenu = () => {
    runPulse();
    if (isOpen) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    } else {
      setIsOpen(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start();
    }
  };

  const closeMenu = () => {
    if (!isOpen) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const handleItemPress = (action: () => void) => {
    closeMenu();
    setTimeout(action, 180);
  };

  const rotateInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  const breathScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const glowScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.9],
  });
  const glowOpacity = halo.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.55, 0],
  });
  const wiggleRotate = wiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-12deg", "12deg"],
  });
  const idleActive = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <View style={styles.container}>
        {isOpen &&
          items.map((item, index) => {
            const verticalOffset = -(75 + index * 68);

            const translateY = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, verticalOffset],
            });
            const scale = progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.85, 1],
            });
            const opacity = progress.interpolate({
              inputRange: [0, 0.25 + index * 0.12, 1],
              outputRange: [0, 0.4, 1],
            });

            return (
              <Animated.View
                key={item.label}
                style={[
                  styles.menuItem,
                  {
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleItemPress(item.onPress)}
                  style={styles.itemRow}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  <View style={styles.labelPill}>
                    <Text style={styles.labelText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

        <Animated.View
          style={[
            styles.glowHalo,
            {
              opacity: Animated.multiply(glowOpacity, idleActive),
              transform: [{ scale: glowScale }],
            },
          ]}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.mainButtonWrapper,
            { transform: [{ scale: Animated.multiply(pulse, breathScale) }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleMenu}
            style={styles.mainButtonTouch}
          >
            <LinearGradient
              colors={["#1ed4e8", "#069eb3", "#045e6e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainButton}
            >
              <Animated.View
                style={{
                  transform: [
                    { rotate: rotateInterpolate },
                    { rotate: wiggleRotate },
                  ],
                }}
              >
                <Ionicons
                  name={isOpen ? "close" : "help"}
                  size={28}
                  color="#fff"
                />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 70,
    left: 10,
    overflow: "visible",
  },
  menuItem: {
    position: "absolute",
    bottom: 6,
    left: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  labelPill: {
    marginLeft: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  labelText: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: 13,
  },
  glowHalo: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1ed4e8",
  },
  mainButtonWrapper: {},
  mainButtonTouch: {
    borderRadius: 28,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 10,
    shadowColor: "#0cc3dc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});

export default SideQuickAccessMenu;
