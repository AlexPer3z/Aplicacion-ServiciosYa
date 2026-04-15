import React, { memo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMainNavigation } from "../../lib/hooks/useNavigation";
import type { MainStackParamList } from "../../types/navigation";
import { useLinkProps, type LinkProps } from "@react-navigation/native";
import { useIsGuest } from "../../store/authStore";

interface NavButtonProps {
  name: string;
}

function NavButton({
  name,
  ...linkProps
}: NavButtonProps & LinkProps<MainStackParamList>) {
  const props = useLinkProps(linkProps);
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? "#ffd8b0" : "transparent",
          borderRadius: 20,
          padding: 8,
          marginHorizontal: 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name={name} size={28} color="#fff" />
    </Pressable>
  );
}

function BadgeNavButton({
  name,
  badgeCount = 0,
  ...linkProps
}: NavButtonProps & LinkProps<MainStackParamList> & { badgeCount?: number }) {
  const props = useLinkProps(linkProps);
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? "#ffd8b0" : "transparent",
          borderRadius: 20,
          padding: 8,
          marginHorizontal: 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name={name} size={28} color="#fff" />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface BottomNavBarProps {
  unreadMessagesCount?: number;
}

const BottomNavBar = ({ unreadMessagesCount = 0 }: BottomNavBarProps) => {
  const isGuest = useIsGuest();
  const navigation = useMainNavigation();
  const insets = useSafeAreaInsets();

  const handlePressOfferService = async () => {
    navigation.navigate("OfrecerServicio");
  };

  const hanndleCenterPress = () => {
    if (isGuest) {
      Alert.alert(
        "Inicia sesión",
        "Debes iniciar sesión para continuar.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Iniciar sesión", onPress: () => navigation.navigate("AuthStack", { screen: "LoginSelect" }) }
        ]
      );
      return;
    }

    handlePressOfferService();
  };


  return (
    <View style={[styles.navContainer, { marginBottom: insets.bottom }]}>
      <NavButton name="home-outline" screen="Home" />
      <NavButton name="list-outline" screen="MisServicios" />

      {/*<TouchableOpacity
        onPress={hanndleCenterPress}
        style={[
          styles.publishButton,
        ]}>
        <Ionicons name="add-circle-outline" size={36} color="#fff" />
      </TouchableOpacity>*/}

      <BadgeNavButton
        name="chatbubble-ellipses-outline"
        screen="ChatIA"
        badgeCount={unreadMessagesCount}
      />

      <NavButton name="settings-outline" screen="Configuracion" />
    </View>
  );
};

export default memo(BottomNavBar);

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fe971a",
    borderTopWidth: 1,
    borderTopColor: "#f26700",
  },
  navButton: {
    position: "relative",
    padding: 6,
  },
  publishButton: {
    backgroundColor: "#069eb3",
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
    right: -3,
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