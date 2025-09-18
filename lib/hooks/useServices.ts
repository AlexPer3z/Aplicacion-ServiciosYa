import {
  type QueryClient,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Servicio } from "../../types/servicios";
import {
  query as settingsQuery,
} from "./useUserSettings";
import { getLocationParamsFromClient } from "../utils/location";
import type { WorkerStatus } from "../../types/worker";

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
    "get_servicios_with_worker_status",
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
    queryKey: ["user", "services", categoria],
    queryFn: async ({ client }) => {
      const locationParams = getLocationParamsFromClient(client);

      const { data, error } = await supabase.rpc(
        "test_get_servicios_with_worker_status",
        { ...locationParams, p_categoria: categoria },
      );
      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    // sorting: ONLINE first, then AWAY, then OFFLINE, then others; preserve original order within same status
    select: (data) => {
      const statusOrder: Record<string, number> = {
        ONLINE: 0,
        AWAY: 1,
        OFFLINE: 2,
      };
      return data.slice().sort((a, b) => {
        const aOrder = statusOrder[a.worker_status] ?? 99;
        const bOrder = statusOrder[b.worker_status] ?? 99;
        return aOrder - bOrder;
      });
    },
  });
};

export const servicesCountQuerKey = ["user", "services", "count"];


export function useServicesCount() {
  const client = useQueryClient();
  const servicios = useSuspenseQuery({
    queryKey: servicesCountQuerKey,
    queryFn: async ({ client }) => {
      const location = getLocationParamsFromClient(client);
      const OnlyOnlineWorkers = (await client.ensureQueryData(settingsQuery))
        .OnlyOnlineWorkers;
      const worker_status_filter: WorkerStatus[] | null =
        OnlyOnlineWorkers === true ? ["ONLINE"] : null;
      const { data, error } = await supabase.rpc(
        "count_services_by_status_in_radius",
        { ...location, worker_status_filter, p_categoria: null },
      );
      if (error) {
        throw error;
      }
      return data; // debe ser un array tipo [{ categoria: string, count: number }]
    },
  });

  return { servicios };
}

export function clearServicesCache(client: QueryClient) {
  client.invalidateQueries({ queryKey: ["user", "services"] });
}
