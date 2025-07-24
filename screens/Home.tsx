import React, { useState, useContext, useCallback, useEffect, Suspense } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { withModalProvider } from "../components/sheet/withModalProvider";
import { AuthContext } from '../lib/context/AppContext';

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
import FloatingButtonMenu from "../components/FloatingButtonMenu";
import { withSuspense } from "../components/withSuspense";
import { supabase } from "../lib/supabase";
import FloatingActionButtonMenu from "../components/FloatingActionButtonMenu";
import HelpVideoModal from "../components/HelpVideoModal";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

function Home({ navigation }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [showCountsOnly, setShowCountsOnly] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);

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
    startNotificationCounter,
    unreadMessagesCount,
    startMessageCounter,
  } = useContext(AuthContext);

  // Lanzar contadores y suscripciones en tiempo real
  useEffect(() => {
    startNotificationCounter();
    startMessageCounter();

    const notifSub = supabase
      .channel('public:notificaciones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones' },
        () => startNotificationCounter()
      )
      .subscribe();

    const msgSub = supabase
      .channel('public:mensajes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mensajes' },
        () => startMessageCounter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifSub);
      supabase.removeChannel(msgSub);
    };
  }, []);

  // Onboarding
  useFocusEffect(
    useCallback(() => {
      if (settings && !settings.onBoardingComplete) {
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
    navigation.navigate("ServiciosPorCategoria", { categoria });
  };

  const isUserRestricted = askDniVerification || askProfileCompletion;

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <ImageBackground
        source={require("../assets/fondo_home.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
            <HomeHeader
              onSearch={setBusqueda}
              onShowCountsOnlyChange={(value) => setShowCountsOnly(value)}
              notificationsCount={notificationsCount}
              unreadMessagesCount={unreadMessagesCount}
            />

          
          {askProfileCompletion && (
            <ProfileIncompleteWarning
              onPress={() => navigation.navigate("CrearPerfil")}
            />
          )}

          {askDniVerification && <DniPendingWarning />}
          
       
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
            videoSource={require("../assets/video.mp4")}
          />

          <ChatBotModal
            visible={chatVisible}
            onClose={() => setChatVisible(false)}
          />
        </View>
      </ImageBackground>

      <BottomNavBar
        unreadMessagesCount={unreadMessagesCount}
      />
      
    </SafeAreaView>
  );
}

export default withModalProvider(withSuspense(Home, <LoadingView />));

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#00B8A9" },
  background: { flex: 1 },
  container: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.40)" },
});
