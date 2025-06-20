import React, { useState, useCallback, Suspense } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { withModalProvider } from "../components/sheet/withModalProvider";

// Custom Hooks
import { useUserSettings } from "../lib/hooks/useUserSettings";
import { useOnboarding } from "../lib/hooks/useOnboarding";
import { useHomeData } from "../lib/hooks/useHomeData";

// Refactored Components
import { BottomNavBar } from "../components/home/BottomNavBar";
import { CategoryList } from "../components/home/CategoryList";
import { ProfileIncompleteWarning } from "../components/home/ProfileIncompleteWarning";
import { DniPendingWarning } from "../components/home/DniPendingWarning";
import HomeHeader from "../components/HomeHeader"; // Assuming this is the top bar with search
import ChatBotModal from "../components/ChatBotModal";
import LoadingView from "../components/LoadingView";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

function Home({ navigation }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [showCountsOnly, setShowCountsOnly] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  // Custom Hooks for logic
  const { startOnboarding } = useOnboarding();
  const { settings, updateSettings } = useUserSettings();
  const {
    rol,
    refreshing,
    askDniVerification,
    askProfileCompletion,
    onRefresh,
  } = useHomeData();

  // Onboarding Logic
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
    navigation.navigate("PasarelaPago", { categoria });
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
          />

          {askProfileCompletion && (
            <ProfileIncompleteWarning
              onPress={() => navigation.navigate("CrearPerfil")}
            />
          )}

          {askDniVerification && <DniPendingWarning />}

          <Suspense fallback={<LoadingView withNavBarMargin />}>
            <CategoryList
              busqueda={busqueda}
              onCategoryPress={handleCategoryPress}
              isUserRestricted={isUserRestricted}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </Suspense>

          <TouchableOpacity
            onPress={() => setChatVisible(true)}
            style={styles.fab}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          </TouchableOpacity>

          <ChatBotModal
            visible={chatVisible}
            onClose={() => setChatVisible(false)}
          />
        </View>
      </ImageBackground>

      <BottomNavBar rol={rol ?? "user"} isUserRestricted={isUserRestricted} />
    </SafeAreaView>
  );
}

export default withModalProvider(Home);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#00B8A9" },
  background: { flex: 1 },
  container: { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.40)" },
  fab: {
    position: "absolute",
    bottom: 90, // Adjust to be above the BottomNavBar
    right: 24,
    backgroundColor: "#FFA13C",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});
