import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  Suspense,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  Animated,
  TouchableWithoutFeedback,
  Text
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; 
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { withModalProvider } from "../components/sheet/withModalProvider";
import { AuthContext } from "../lib/context/AppContext";

// Custom Hooks
import { useUserSettings } from "../lib/hooks/useUserSettings";
import { useOnboarding } from "../lib/hooks/useOnboarding";
import { useHomeData } from "../lib/hooks/useHomeData";

// Refactored Components
import BottomNavBar from "../components/home/BottomNavBar";
import { CategoryList } from "../components/home/CategoryList";
import { ProfileIncompleteWarning } from "../components/home/ProfileIncompleteWarning";
import { DniPendingWarning } from "../components/home/DniPendingWarning";
import HomeHeader from "../components/HomeHeader";
import ChatBotModal from "../components/ChatBotModal";
import LoadingView from "../components/LoadingView";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation"; 
import { withSuspense } from "../components/withSuspense";
import { supabase } from "../lib/supabase";
import FloatingActionButtonMenu from "../components/FloatingActionButtonMenu";
import HelpVideoModal from "../components/HelpVideoModal";
import { withDropDownProvider } from "../components/forms/withDropDownProvider";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

function Home({ navigation }: Props) {
  const [modalPrimeraVezVisible, setModalPrimeraVezVisible] = useState(false);

  const [authUser, setAuthUser] = useState(null);


useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      console.log("Cambio de sesión detectado:", _event, session);

      if (_event === "SIGNED_OUT") {
  console.log("→ Cerrando sesión, limpiando todo…");

  // 1. Limpiar AsyncStorage
  await AsyncStorage.clear();

  // 2. Limpiar estados internos del Home
  clearHomeData();

  // 3. Limpiar estados globales del AuthContext
  logoutCleanup?.();

  // 4. Redireccionar al login
  navigation.reset({
    index: 0,
    routes: [{ name: "AuthStack" }],
  });

  return;
}

      setAuthUser(session?.user ?? null);
    }
  );

  supabase.auth.getUser().then(({ data }) => {
    setAuthUser(data?.user ?? null);
  });

  return () => listener.subscription.unsubscribe();
}, []);





  const [busqueda, setBusqueda] = useState("");
  const [showCountsOnly, setShowCountsOnly] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const onboardingShown = useRef(false);
  const { logoutCleanup } = useContext(AuthContext);
  // Custom Hooks
  const { startOnboarding } = useOnboarding();
  const { settings, updateSettings } = useUserSettings();
  const {
    rol,
    refreshing,
    askDniVerification,
    askProfileCompletion,
    onRefresh,
  } = useHomeData();
  
  // Notifications & Messages
  const {
    notificationsCount,
    unreadMessagesCount
  } = useContext(AuthContext);
const resetPrimeraVez = async () => {
  try {
    await AsyncStorage.setItem("@primeraVez", "0");
    Alert.alert("Reiniciado", "El contador de primera vez fue reiniciado.");
  } catch (e) {
    console.log("Error reiniciando primera vez:", e);
  }
};


// Funciones de refresco
const refreshHomeData = async (userId: string) => {
  try {
    // Refrescar settings
    if (updateSettings) {
      await updateSettings(await fetchUserSettings(userId));
    }
    // Refrescar home data
    if (onRefresh) {
      onRefresh();
    }
  } catch (e) {
    console.error("Error refrescando datos del home:", e);
  }
};

const clearHomeData = async () => {
  try {
    // 1. Limpiar estados locales
    setAuthUser(null);
    setBusqueda("");
    setChatVisible(false);
    setVideoVisible(false);
    resetAuthContext?.();

    // 2. Limpiar AsyncStorage usado en el Home
    await AsyncStorage.multiRemove([
      "@primeraVez",
      "@hasSeenHelpVideo"
    ]);

    // 3. Limpiar settings
    if (updateSettings) {
      await updateSettings({
        useBiometric: false,
        onBoardingComplete: false
      });
    }

    // 4. Limpiar home data del hook
    if (onRefresh) {
      onRefresh(); // se limpia automáticamente al no haber usuario
    }
    

    console.log("✔ TODOS los datos del Home fueron limpiados.");
  } catch (e) {
    console.error("Error en clearHomeData:", e);
  }
};


 useEffect(() => {
  if (!authUser) return;     // ⛔ NO ejecutar si no hay usuario

  const checkPrimeraVez = async () => {
    try {
      const value = await AsyncStorage.getItem("@primeraVez");
      let count = value ? parseInt(value) : 0;

      if (count < 2) {
        setModalPrimeraVezVisible(true);
        await AsyncStorage.setItem("@primeraVez", (count + 1).toString());
      }
    } catch (e) {
      console.log("Error leyendo primeraVez:", e);
    }
  };

  checkPrimeraVez();
}, [authUser]);   // 👈 IMPORTANTE


  // Verificar si el usuario ha visto el video al cargar el componente
  useEffect(() => {
  if (!authUser) return;   // ⛔ NO ejecutar sin usuario

  const checkFirstTime = async () => {
    try {
      const value = await AsyncStorage.getItem("@hasSeenHelpVideo");

      if (value === null) {
        setVideoVisible(true);
        await AsyncStorage.setItem("@hasSeenHelpVideo", "true");
      }
    } catch (e) {
      console.error("Error al leer AsyncStorage:", e);
    }
  };

  checkFirstTime();
}, [authUser]);    // 👈 El hook depende del usuario


  // Lanzar contadores y suscripciones en tiempo real
  /*useEffect(() => {
    startNotificationCounter();
    startMessageCounter();

    const notifSub = supabase
      .channel("public:notificaciones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificaciones" },
        () => startNotificationCounter(),
      )
      .subscribe();

    const msgSub = supabase
      .channel("public:mensajes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes" },
        () => startMessageCounter(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(msgSub);
    };
  }, []);*/

  // Onboarding
  

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
const handleOpenProfile = () => {
  if (rol === "guest") {
    Alert.alert(
      "Acceso restringido",
      "Debes registrarte para acceder al perfil.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Registrarme", onPress: () => navigation.navigate("AuthStack", { screen: "LoginSelect" }) }
      ]
    );
    return;
  }

  navigation.navigate("Perfil");
};

useEffect(() => {
  if (!authUser) return;

  console.log("Usuario listo → refrescando home…");

  onRefresh();          // refresca rol, perfil, verificaciones
  updateSettings?.(authUser);

}, [authUser]);



const handleCategoryPress = async (categoria: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Usuario no autenticado");
      return;
    }

    // Consultar si el usuario tiene pago = true/false
    const { data, error } = await supabase
      .from("usuarios")
      .select("pago")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error al obtener campo pago:", error);
      return;
    }

   if (data?.pago) {
  // ✅ Pago activo → continuar flujo normal

  // Registrar evento (no bloquea la navegación)
  (async () => {
    try {
      const response = await fetch(
        "https://insightpulse.store/api/registrar_evento.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo_evento: "categoria_visitada",
            datos: {
              usuario_id: user.id,
              categoria: categoria,
            },
          }),
        }
      );

      const result = await response.json();
      console.log("Respuesta del backend:", result);
    } catch (error) {
      console.error("Error al registrar categoría:", error);
    }
  })();

  // 👉 Redirigir automáticamente
  navigation.navigate("ServiciosPorCategoria", { categoria });
} else {
      // ❌ Pago inactivo → bloquear flujo y redirigir a pagoInicial
      Alert.alert(
        "Verificación requerida",
        "Realiza la verificación de identidad antes de continuar a contratar para la seguridad de los usuarios.",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Verificar",
            onPress: () => navigation.navigate("pagoInicial")
          }
        ]
      );
    }
  } catch (error) {
    console.error("Error en handleCategoryPress:", error);
  }
};


useEffect(() => {
  const registrarActividad = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) {
        console.warn("Usuario no autenticado");
        return;
      }

      const response = await fetch("https://insightpulse.store/api/registrar_evento.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_evento: "actividad",
          datos: {
            usuario_id: userId
          }
        })
      });

      const result = await response.json();
      console.log("Actividad registrada:", result);
    } catch (error) {
      console.error("Error al registrar actividad:", error);
    }
  };

  registrarActividad();
}, []);


  const isUserRestricted = askDniVerification || askProfileCompletion;

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <HomeHeader
            onSearch={setBusqueda}
            onShowCountsOnlyChange={(value) => setShowCountsOnly(value)}
            notificationsCount={notificationsCount}
            unreadMessagesCount={unreadMessagesCount}
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
            refreshing={refreshing}
            onRefresh={onRefresh}
          />

          <FloatingActionButtonMenu
            onHelpPress={() => setVideoVisible(true)}
            onChatPress={() => setChatVisible(true)}
          />

          <HelpVideoModal
            visible={videoVisible}
            onClose={() => setVideoVisible(false)}
            videoSource={require("../assets/video_2.mp4")}
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
        onPress={() => setModalPrimeraVezVisible(false)}
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
  withModalProvider(withSuspense(Home, <LoadingView />)),
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#069eb3" },
  background: { flex: 1, backgroundColor: "#0882b3ff" },
  container: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0)" },
});
