import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  ImageBackground} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { withModalProvider } from "../components/sheet/withModalProvider";
import { AuthContext } from "../lib/context/AppContext";

// Custom Hooks
import { useUserSettings } from "../lib/hooks/useUserSettings";
import { useOnboarding } from "../lib/hooks/useOnboarding";
import { useHomeData } from "../lib/hooks/useHomeData";

// Refactored Components
import BottomNavBar from "../components/home/BottomNavBar";
import CategoryList from "../components/home/CategoryList";
import { ProfileIncompleteWarning } from "../components/home/ProfileIncompleteWarning";
import { DniPendingWarning } from "../components/home/DniPendingWarning";
import HomeHeader from "../components/HomeHeader";
import ChatBotModal from "../components/ChatBotModal";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import FloatingActionButtonMenu from "../components/FloatingActionButtonMenu";
import { withDropDownProvider } from "../components/forms/withDropDownProvider";
import { getUserID, useIsGuest } from "../store/authStore";
import { HomeEventRenderer } from "../components/home/HomeEventRenderer";
import { useHomeEventsStore } from "../store/homeEventsStore";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

function Home({ navigation }: Props) {
  const [authUser, setAuthUser] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [showCountsOnly, setShowCountsOnly] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const onboardingShown = useRef(false);
  const isGuest = useIsGuest()
  // Custom Hooks
  const { startOnboarding } = useOnboarding();
  const { settings, updateSettings } = useUserSettings();
  const {
    askDniVerification,
    askProfileCompletion,
  } = useHomeData();
  const isFocused = useIsFocused();
  const { setHomeVisible, setHomeDataReady } = useHomeEventsStore();

  // Notifications & Messages
  const { unreadMessagesCount } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      if (!onboardingShown.current && settings && !settings.onBoardingComplete) {
        onboardingShown.current = true;
        startOnboarding((results) =>
          updateSettings({
            useBiometric: results.useBiometric,
            onBoardingComplete: true,
          }),
        );
      }
    }, [settings]),
  );

  const handleCategoryPress = (categoria: string) => {
    if (isGuest) {
      return;
    }

    fetch("https://insightpulse.store/api/registrar_evento.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo_evento: "categoria_visitada",
        datos: {
          usuario_id: getUserID(),
          categoria: categoria
        }
      })
    }).catch(error => {
      console.error("Error al registrar evento:", error);
    });

    // Navegar después de registrar
    navigation.navigate("ServiciosPorCategoria", { categoria });
  };


  useEffect(() => {
    const registrarActividad = async () => {
      try {
        const response = await fetch("https://insightpulse.store/api/registrar_evento.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo_evento: "actividad",
            datos: {
              usuario_id: getUserID()
            }
          })
        });
      } catch (error) {
        console.error("Error al registrar actividad:", error);
      }
    };

    registrarActividad();
  }, []);

  useEffect(() => {
    setHomeVisible(isFocused);
    if (!isFocused) {
      setHomeDataReady(false);
    }
  }, [isFocused, setHomeVisible, setHomeDataReady]);

  const isUserRestricted = askDniVerification || askProfileCompletion;

  return (
    <SafeAreaView style={styles.safeArea}>
        <HomeEventRenderer />
        <View style={styles.container}>
          <HomeHeader
            onSearch={setBusqueda}
            onShowCountsOnlyChange={(value) => setShowCountsOnly(value)}
          />

          {authUser && askProfileCompletion && (
            <ProfileIncompleteWarning
              onPress={() => navigation.navigate("CrearPerfil")}
            />
          )}

          {authUser && askDniVerification && <DniPendingWarning />}

          <CategoryList
            busqueda={busqueda}
            onCategoryPress={handleCategoryPress}
            isUserRestricted={isUserRestricted}
          />

          <FloatingActionButtonMenu
            onHelpPress={() => setVideoVisible(true)}
            onChatPress={() => setChatVisible(true)}
          />
          <ChatBotModal
            visible={chatVisible}
            onClose={() => setChatVisible(false)}
          />

          {modalPrimeraVezVisible && (
  <View
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    }}
  >
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 25,
        width: "90%",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#333", textAlign: "center" }}>
        ¡Bienvenido a ServiciosYa! 👋
      </Text>

      <Text style={{ fontSize: 16, color: "#444", marginBottom: 25, textAlign: "center" }}>
        ¿Qué querés hacer hoy?
      </Text>

      {/* Botón Contratar */}
      <TouchableOpacity
        onPress={() => setModalPrimeraVezVisible(false)}
        style={{
          backgroundColor: "#00B8A9",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 12
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
          Contratar
        </Text>
      </TouchableOpacity>

      {/* Botón Ofrecer Servicio */}
      <TouchableOpacity
  onPress={() => {
    setModalPrimeraVezVisible(false);
    navigation.navigate("OfrecerServicio");
  }}
  style={{
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  }}
>
  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
    Ofrecer un servicio
  </Text>
</TouchableOpacity>

    </View>
  </View>
)}


        </View>

      <BottomNavBar unreadMessagesCount={unreadMessagesCount} />
    </SafeAreaView>
  );
}

export default withDropDownProvider(
  withModalProvider(Home),
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#069eb3" },
  background: { flex: 1, backgroundColor: "#0882b3ff" },
  container: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0)" },
});
