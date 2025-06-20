// src/hooks/useHomeData.js
import { useState, useEffect, useCallback, use } from "react";
import { supabase } from "../supabase";
import { Alert, BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  perfilQueryOptions,
  servicesCountQuerKey,
  sessionQueryOptions,
} from "../queryOptions";
import queryClient from "../reactQuery";

interface UserData {
  rol: string;
  perfilCompleto: boolean;
  notificacionesNoLeidas: number;
  foto_perfil: string | null;
}

export const useHomeData = () => {
  const [conteosPorCategoria, setConteosPorCategoria] = useState({});
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [askDniVerification, setAskDniVerification] = useState(false);
  const [askProfileCompletion, setAskProfileCompletion] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { data: session } = useQuery(sessionQueryOptions);
  const { data: userData } = useQuery(perfilQueryOptions);

  const cargarDatos = useCallback(async () => {
    if (session?.user) {
      const { count: notifsCount } = await supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("receptor_id", session.user.id)
        .eq("leido_por_receptor", false);
      setUnreadNotificationsCount(notifsCount || 0);
    }

    // const perfilCompleto = perfil?.perfil_completo || false;
    // const mostrarCartelDNI = perfilCompleto && !perfil?.dni_verificado;
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: servicesCountQuerKey });
    setRefreshing(false);
  };

  useEffect(() => {
    cargarDatos();

    const subscriptions = [
      supabase
        .channel("servicios-cambios")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "servicios" },
          () =>
            queryClient.invalidateQueries({ queryKey: servicesCountQuerKey }),
        )
        .subscribe(),
      supabase
        .channel("notificaciones-cambios")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notificaciones" },
          () => cargarDatos(),
        )
        .subscribe(),
    ];

    return () => {
      for (const sub of subscriptions) {
        supabase.removeChannel(sub);
      }
    };
  }, [cargarDatos]);

  // Handle Back Button to exit app
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Confirmación", "¿Deseas salir de la app?", [
          { text: "Cancelar", style: "cancel", onPress: () => null },
          { text: "Salir", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  useEffect(() => {
    if (userData) {
      let { perfil_completo, dni_verificado } = userData;
      perfil_completo = perfil_completo ?? false;
      dni_verificado = dni_verificado ?? false;

      setAskDniVerification(perfil_completo && !dni_verificado);
      setAskProfileCompletion(!perfil_completo);
    }
  }, [userData]);

  return {
    ...userData,
    askDniVerification,
    askProfileCompletion,
    conteosPorCategoria,
    refreshing,
    onRefresh,
  };
};
