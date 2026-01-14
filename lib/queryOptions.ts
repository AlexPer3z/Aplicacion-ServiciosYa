import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type { Coords } from "../types/location";
import { getUserID } from "../store/authStore";
import { query } from "./hooks/useUserSettings";

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
  queryFn: async () => {
    const userId = getUserID();
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        "perfil_completo, dni_verificado, foto_perfil, rol, nombre, id, suscriptor, creditos, referral_code, email, edad",
      )
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },
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
  queryFn: async () => {
    const { data } = await supabase
      .from("workers")
      .select("status")
      .eq("user_id", getUserID())
      .single();
    console.log(`Worker status: ${data?.status}`);
    return data ? data.status : "OFFLINE";
  },
});

export const locationIpInfoQueryOptions = queryOptions<Coords>({
  queryKey: ["user", "location", "api"],
  queryFn: async () => {
    const response = await fetch("http://ip-api.com/json/");
    if (!response.ok) {
      throw new Error(`ip-api.com returned ${response.status}`);
    }
    const data = await response.json();
    return {
      latitude: data.lat,
      longitude: data.lon,
      city: data.city || "N/A",
      country: data.countryCode || "N/A",
    };
  },

  staleTime: 120 * 1000,
});

export const userServiceCountQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["user", "services", "count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("servicios")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);

      if (error) {
        throw error;
      }
      return count ?? 0;
    },
  });

export const userServiceListQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["user", "services", "list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .eq("user_id", id);

      if (error) {
        throw error;
      }
      return data ?? [];
    },
  });

export const userCreditQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["user", "credit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("creditos")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }
      return data?.creditos ?? 0;
    },
  });

export const misServicionQueryOptions = queryOptions({
  queryKey: ["user", "mis_servicios"],
  queryFn: async () => {
    const userId = getUserID();
    const { data } = await supabase
      .from("servicios_with_coords")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .throwOnError();
    return data;
  },
});
