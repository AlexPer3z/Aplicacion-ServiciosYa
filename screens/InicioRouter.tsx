import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { getUserID } from "../store/authStore";
import type { MainStackParamList } from "../types/navigation";

export default function InicioRouter() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [loading] = useState(true);

  useEffect(() => {
    const verificarRuta = async () => {
      const userId = getUserID();

      if (!userId) {
        navigation.reset({
          index: 0,
          routes: [{ name: "RegistroTrabajador" }],
        });
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("perfil_completo")
        .eq("id", userId)
        .single();

      navigation.reset({
        index: 0,
        routes: [
          {
            name: !error && data?.perfil_completo ? "Home" : "RegistroTrabajador",
          },
        ],
      });
    };

    verificarRuta();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {loading ? <ActivityIndicator size="large" color="#FFA13C" /> : null}
    </View>
  );
}
