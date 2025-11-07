import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  TextInput,
  Image,
} from "react-native";
import LocationChip from "./location/LocationChip";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { perfilQueryOptions } from "../lib/queryOptions";
import { useMainNavigation } from "../lib/hooks/useNavigation";
import OptionsButton from "./home/OptionsButton";
import { useUserSettings } from "../lib/hooks/useUserSettings";
import WorkerState from "./home/WorkerState";
import { isGuest, isWorker } from "../lib/utils/user";
import OnlineFilterCheckBox from "./home/OnlineFilterCheckBox";
import ProgressChip from "./home/ProgressChip";

interface HomeHeaderProps {
  onSearch: (query: string) => void;
  onShowCountsOnlyChange: (value: boolean) => void;
  notificationsCount: number;
  unreadMessagesCount: number;
}

function HomeHeader({
  onSearch,
  onShowCountsOnlyChange,
  notificationsCount,
  unreadMessagesCount,
}: HomeHeaderProps) {
  const navigation = useMainNavigation();
  const { settings } = useUserSettings();
  const [soloConServicios, setSoloConServicios] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { data: perfil } = useQuery(perfilQueryOptions);
  const useGPS = settings?.useGPS ?? false;
  const rol = perfil?.rol ?? "user";

  useEffect(() => {
    onSearch(busqueda.trim());
  }, [busqueda, onSearch]);

  useEffect(() => {
    onShowCountsOnlyChange(soloConServicios);
  }, [soloConServicios, onShowCountsOnlyChange]);

  return (
    <View style={styles.header}>
      <View style={{ marginHorizontal: 15 }}>
        <View style={styles.headerTop}>
          <View style={styles.saludoContainer}>
            <Text style={styles.saludo}>¡Servicios Ya!</Text>
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
            <TouchableOpacity
              onPress={() =>
                perfil?.perfil_completo && navigation.navigate("Perfil")
              }
              disabled={!perfil?.perfil_completo}
              style={styles.iconButton}
            >
              {perfil?.foto_perfil ? (
                <Image
                  source={{ uri: perfil?.foto_perfil }}
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={36} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.filtroContainer, { marginVertical: 6 }]}>
          {useGPS && settings && (
            <LocationChip
              location={settings.customLocation ?? settings?.lastGPSLocation}
            />
          )}
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.buscadorContainer}>
            <Ionicons
              name="search"
              size={22}
              color="#333"
              style={{ marginLeft: 12 }}
            />
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

        <View style={styles.filtroContainer}>
          <OnlineFilterCheckBox style={styles.filtroColumn} />
          {isWorker(rol) ? (
            <WorkerState style={styles.filtroColumn} />
          ) : (
            <View style={styles.filtroColumn} />
          )}
        </View>
        {!isGuest(rol) && (
          <ProgressChip
            label="Mis Logros"
          />
        )}
      </View>
    </View>
  );
}

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#00B8A9",
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    color: "#fff",
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
    backgroundColor: "rgb(255, 255, 255)",
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
  filtroContainer: {
    flexDirection: "row",
    gap: 8,
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
