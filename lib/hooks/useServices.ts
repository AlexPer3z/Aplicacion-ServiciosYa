import {
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Servicio } from "../../types/servicios";
import {
  queryKey,
  queryKey as settingsQueryKey,
  type UserSettings,
} from "./useUserSettings";
import { useCallback } from "react";

const fetchServiciosByCategory = async (
  categoria: string,
): Promise<Servicio[]> => {
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("categoria", categoria);

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const fetchServiciosCountByCategory = async () => {
  const { data, error } = await supabase.rpc("count_active_by_category");
  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const fetchServiciosCatgoryByRadius = async (
  categoria_filter: string,
  search_lat: number,
  search_lon: number,
  search_radius_meters: number,
) => {
  const { data, error } = await supabase.rpc(
    "get_services_by_category_in_radius",
    {
      search_lat,
      search_lon,
      categoria_filter,
      search_radius_meters,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const useServicesByCategory = (categoria: string) => {
  return useSuspenseQuery({
    queryKey: ["servicios", categoria],
    queryFn: async ({ client }) => {
      const settings = client.getQueryData<UserSettings>(settingsQueryKey);
      if (!settings) {
        throw Error("La configuracion del usuario no esta disponible.");
      }
      // si el gps esta desactivado se utiliza la api global para obtener los servicios
      if (!settings.useGPS || !settings.lastGPSLocation) {
        return fetchServiciosByCategory(categoria);
      }

      return await fetchServiciosCatgoryByRadius(
        categoria,
        settings.lastGPSLocation.latitude,
        settings.lastGPSLocation.longitude,
        settings.searchRadius,
      );
    },
  });
};

export const servicesCountQuerKey = ["user", "services", "count"];

import { useQuery } from "@tanstack/react-query";

export function useServicesCount() {
  const servicios = useQuery({
    queryKey: ["conteo-servicios"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_active_by_category");

      if (error) throw new Error(error.message);
      return data; // debe ser un array tipo [{ categoria: string, count: number }]
    },
  });

  return { servicios };
}

