import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type { LocationIpInfo } from "../types/location";

export const sessionQueryKey = ["session"];

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: async () => {
    // Esta función se ejecuta una vez para obtener el estado inicial de la sesión.
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error al obtener sesión inicial:", error.message);
      throw error; // Dejar que TanStack Query maneje el estado de error
    }
    return data.session;
  },
  // Los datos de sesión son gestionados por el listener, por lo que no queremos que
  // se vuelvan obsoletos y se vuelvan a buscar automáticamente.
  staleTime: Number.POSITIVE_INFINITY,
  // Mantener los datos de sesión en caché indefinidamente.
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export const perfilQueryKey = ["user", "perfil"];

export const perfilQueryOptions = queryOptions({
  queryKey: perfilQueryKey,
  queryFn: async ({ client }) => {
    const session = client.getQueryData<Session>(sessionQueryKey);
    // Get the user ID from the session
    const userId = session?.user.id;
    if (!userId) {
      throw new Error("userId is required to fetch user profile");
    }
    const { data, error } = await supabase
      .from("usuarios")
      .select("perfil_completo, dni_verificado, foto_perfil, rol, nombre, id")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export const notificationsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user", "notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("mensaje, leido")
        .eq("receptor_id", userId);

      if (error) {
        throw error;
      }
      return data;
    },
  });

export const messagesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user", "messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("id")
        .eq("receptor_id", userId)
        .eq("leido_por_receptor", false);

      if (error) {
        throw error;
      }
      return data;
    },
  });

export const servicesCountQuerKey = ["user", "services", "count"];

export const serviciosCategoriaQueryOptions = (lat: number, lng: number) =>
  queryOptions({
    queryKey: servicesCountQuerKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "count_services_by_status_in_radius",
        {
          search_lat: lat,
          search_lon: lng,
          search_radius_meters: 10000, // 10 km
        },
      );

      if (error) {
        throw error;
      }
      return data;
    },
  });

export const workerStatusQueryOptions = queryOptions({
  queryKey: ["user", "worker", "status"],
  queryFn: async ({ client }) => {
    const session = client.getQueryData<Session>(sessionQueryKey);
    if (!session || !session.user) {
      throw new Error("No session or user found");
    }
    const { data, error } = await supabase
      .from("workers")
      .select("status")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      throw error;
    }
    return data.status;
  },
  refetchInterval: 60 * 1000, // Refetch every minute
});

export const locationIpInfoQueryOptions = queryOptions({
  queryKey: ['user', 'location', 'api'],
  queryFn: async (): Promise<LocationIpInfo> => {
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) {
      throw new Error(`ipinfo.io returned ${response.status}`);
    }
    return response.json();
  },
});
