import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FloatingActionButtonMenuProps {
  onChatPress: () => void;
  onHelpPress: () => void;
}

const FloatingActionButtonMenu: React.FC<FloatingActionButtonMenuProps> = ({
  onChatPress,
  onHelpPress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (isOpen) {
      // Cerrar menú
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIsOpen(false));
    } else {
      // Abrir menú
      setIsOpen(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeMenu = () => {
    if (isOpen) {
      toggleMenu();
    }
  };

  const handleButtonPress = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <View style={styles.container}>
        {/* Botones del menú */}
        {isOpen && (
          <View style={styles.menuContainer}>
            {/* Botón de ayuda */}
            <Animated.View
              style={[
                styles.menuItem,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: translateYAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -140],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleButtonPress(onHelpPress)}
                style={[styles.button, { backgroundColor: "#19D4C6" }]}
              >
                <Ionicons name="help" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* Botón de chat */}
            <Animated.View
              style={[
                styles.menuItem,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: translateYAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -70],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleButtonPress(onChatPress)}
                style={[styles.button, { backgroundColor: "#FFA13C" }]}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Botón principal */}
        <TouchableOpacity onPress={toggleMenu} style={styles.mainButton}>
          <Ionicons name={isOpen ? "close" : "menu"} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 70,
    right: 10,
  },
  menuContainer: {
    position: "absolute",
    bottom: 55,
    right: 0,
  },
  menuItem: {
    position: "absolute",
    right: 0,
  },
  mainButton: {
    backgroundColor: "#00B8A9",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 10,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    marginBottom: 10,
  },
});

export default FloatingActionButtonMenu;