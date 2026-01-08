import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Suspense } from "react";
import LocationChip from "./location/LocationChip";
import { Ionicons } from "@expo/vector-icons";
import { useMainNavigation } from "../lib/hooks/useNavigation";
import OptionsButton from "./home/OptionsButton";
import WorkerState from "./home/WorkerState";
import OnlineFilterCheckBox from "./home/OnlineFilterCheckBox";
import ProgressChip from "./home/ProgressChip";
import { useIsGuest } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { perfilQueryOptions } from "../lib/queryOptions";

interface HomeHeaderProps {
  onSearch: (query: string) => void;
  onShowCountsOnlyChange: (value: boolean) => void;
}

function HomeHeader({ onSearch, onShowCountsOnlyChange }: HomeHeaderProps) {
  const navigation = useMainNavigation();
  const notificationsCount = useNotificationStore((state) => state.unreadCount);
  const isGuest = useIsGuest();
  const [busqueda, setBusqueda] = useState("");

  const handleGuestProfileClick = React.useCallback(() => {
    Alert.alert(
      "Acceso restringido",
      "Debes registrarte para acceder a tu perfil.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Registrarme",
          onPress: () => navigation.navigate("AuthStack", { screen: "LoginSelect" }),
        },
      ]
    );
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(busqueda.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, onSearch]);

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.headerTop}>
          <View style={styles.saludoContainer}>
            <Text style={styles.saludo}>¡Servicios <Text style={styles.saludo2}>Ya!</Text></Text>
            <Text style={styles.subtitulo}>¿Qué necesitás hoy?</Text>
          </View>

          <View style={styles.iconsContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("NotificacionesScreen")}
              style={styles.iconButton}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {notificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {isGuest ? (
              <TouchableOpacity
                onPress={handleGuestProfileClick}
                style={styles.iconButton}
              >
                <Ionicons name="person-circle-outline" size={36} color="#fff" />
              </TouchableOpacity>
            ) : (
              <Suspense
                fallback={
                  <View style={styles.iconButton}>
                    <Ionicons name="person-circle-outline" size={36} color="#fff" />
                  </View>
                }
              >
                <ProfileAvatar />
              </Suspense>
            )}
          </View>
        </View>

        <View style={[styles.filtroContainer, styles.locationContainer]}>
          <LocationChip />
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.buscadorContainer}>
            <Ionicons name="search" size={22} color="#333" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar categoría..."
              placeholderTextColor="#333"
              style={styles.buscador}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <OptionsButton />
        </View>

        {!isGuest && (
          <GuestContent onShowCountsOnlyChange={onShowCountsOnlyChange} />
        )}
      </View>
    </View>
  );
}

const GuestContent = React.memo(
  ({ onShowCountsOnlyChange }: { onShowCountsOnlyChange: (value: boolean) => void }) => {
    const [soloConServicios, setSoloConServicios] = useState(false);

    useEffect(() => {
      onShowCountsOnlyChange(soloConServicios);
    }, [soloConServicios, onShowCountsOnlyChange]);

    return (
      <>
        <View style={styles.filtroContainer}>
          <OnlineFilterCheckBox style={styles.filtroColumn} />
          <WorkerState style={styles.filtroColumn} />
        </View>
        <ProgressChip label="Mis Logros" />
      </>
    );
  }
);

export default HomeHeader;


function ProfileAvatar() {
  const navigation = useMainNavigation();
  const { data: perfil } = useSuspenseQuery(perfilQueryOptions);

  const handlePress = React.useCallback(() => {
    if (!perfil?.perfil_completo) {
      Alert.alert("Perfil incompleto", "Completa tu perfil antes de continuar.", [
        { text: "OK" },
      ]);
      return;
    }
    navigation.navigate("Perfil");
  }, [perfil?.perfil_completo, navigation]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
      {perfil?.foto_perfil ? (
        <Image source={{ uri: perfil.foto_perfil }} style={styles2.avatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={36} color="#fff" />
      )}
    </TouchableOpacity>
  );
}


const styles2 = StyleSheet.create({
  iconButton: {
    marginLeft: 12,
    padding: 6,
    position: "relative",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#069eb3",
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  container: {
    marginHorizontal: 15,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saludoContainer: {
    flex: 1,
  },
  saludo: {
    color: "#2D2A6E",
    fontSize: 30,
    fontWeight: "900",
  },
  saludo2: {
    color: "#fe971a",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitulo: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buscadorContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 8,
  },
  buscador: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  searchIcon: {
    marginLeft: 12,
  },
  filtroContainer: {
    flexDirection: "row",
    gap: 8,
  },
  locationContainer: {
    marginVertical: 6,
  },
  filtroColumn: {
    flex: 1,
  },
  iconButton: {
    marginLeft: 12,
    padding: 6,
    position: "relative",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#f00",
    borderRadius: 10,
    minWidth: 16,
    paddingHorizontal: 4,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});