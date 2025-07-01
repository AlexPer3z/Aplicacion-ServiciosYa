import React from "react";
import { View, TouchableOpacity, StyleSheet, Alert, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavBarProps {
  rol: string;
  isUserRestricted: boolean;
  unreadMessagesCount?: number;
}

interface NavButtonProps {
  name: string;
  screen: string;
  badgeCount?: number;  // para el badge de notificaciones/mensajes
}

export const BottomNavBar = ({
  rol,
  isUserRestricted,
  unreadMessagesCount = 0,
}: BottomNavBarProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePressOfferService = () => {
    if (isUserRestricted) {
      Alert.alert(
        "Acción no permitida",
        "Debes completar y verificar tu perfil para ofrecer un servicio."
      );
      return;
    }
    navigation.navigate("OfrecerServicio");
  };

  // Botón Nav que puede mostrar badge
  const NavButton = ({ name, screen, badgeCount = 0 }: NavButtonProps) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(screen)}
      style={styles.navButton}
    >
      <Ionicons name={name} size={28} color="#fff" />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.navContainer, { paddingBottom: insets.bottom }]}>
      <NavButton name="home-outline" screen="Home" />
      <NavButton name="list-outline" screen="MisServicios" />

      <TouchableOpacity
        onPress={handlePressOfferService}
        style={[styles.publishButton, isUserRestricted && styles.disabledButton]}
        disabled={isUserRestricted}
      >
        <Ionicons name="add-circle-outline" size={36} color="#fff" />
      </TouchableOpacity>

      <NavButton
        name="chatbubble-ellipses-outline"
        screen="ChatIA"
        badgeCount={unreadMessagesCount}
      />

      <NavButton name="settings-outline" screen="Configuracion" />

      {(rol === "admin" || rol === "verificador") && (
        <NavButton name="shield-checkmark-outline" screen="PerfilesPendientes" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFA13C",
    borderTopWidth: 1,
    borderTopColor: "#f26700",
  },
  navButton: {
    position: "relative",
    padding: 6,
  },
  publishButton: {
    backgroundColor: "#00B9ba",
    padding: 12,
    borderRadius: 30,
    top: -25,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#f00",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
