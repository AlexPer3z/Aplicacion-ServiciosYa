import React, { memo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { isAdmin, isUser, isWorker } from "../../lib/utils/user";
import { useMainNavigation } from "../../lib/hooks/useNavigation";
import { useSuspenseProfile } from "../../lib/hooks/useUser";
import type { MainStackParamList } from "../../types/navigation";
import { useLinkProps, type LinkProps } from "@react-navigation/native";

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

const BottomNavBar = () => {
  const { rol, isUserRestricted } = useSuspenseProfile();
  const navigation = useMainNavigation();
  const insets = useSafeAreaInsets();

  const handlePressOfferService = () => {
    if (isUserRestricted) {
      Alert.alert(
        "Acción no permitida",
        "Debes completar y verificar tu perfil para ofrecer un servicio.",
      );
      return;
    }
    navigation.navigate("OfrecerServicio");
  };

  const hanndleCenterPress = () => {
    if (isUser(rol)) {
      navigation.navigate("OnlineWorkers");
      return;
    }

    handlePressOfferService();
  };

  return (
    <View style={[styles.navContainer, { marginBottom: insets.bottom }]}>
      <NavButton name="home-outline" screen="Home" />
      <NavButton name="list-outline" screen="MisServicios" />

      {!isAdmin(rol) && (
        <TouchableOpacity
          onPress={hanndleCenterPress}
          style={[
            styles.publishButton,
            isUserRestricted && styles.disabledButton,
          ]}
          disabled={isUserRestricted}
        >
          {isUser(rol) && (
            <MaterialCommunityIcons
              name="clipboard-list"
              size={36}
              color="white"
            />
          )}
          {isWorker(rol) && (
            <Ionicons name="add-circle-outline" size={36} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      <NavButton name="chatbubble-ellipses-outline" screen="ChatIA" />
      <NavButton name="settings-outline" screen="Configuracion" />

      {isAdmin(rol) && (
        <NavButton
          name="shield-checkmark-outline"
          screen="PerfilesPendientes"
        />
      )}
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
    backgroundColor: "#FFA13C",
    borderTopWidth: 1,
    borderTopColor: "#f26700",
  },
  publishButton: {
    backgroundColor: "#00B9ba",
    padding: 12,
    borderRadius: 30,
    top: -25,
    elevation: 5,
  },
  disabledButton: { backgroundColor: "#ccc" },
});
