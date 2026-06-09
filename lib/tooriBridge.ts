import Constants from "expo-constants";
import type {
  TooriBridgePedidoResponse,
  TooriBridgeResponderPedidoPayload,
  TooriBridgeResponse,
  TooriBridgeSyncPrestadorPayload,
} from "../types/tooriBridge";
import { supabase } from "./supabase";

type TooriBridgeExtra = {
  tooriBridge?: {
    baseUrl?: string;
    syncToken?: string;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as TooriBridgeExtra;

const DEFAULT_BASE_URL = "https://tooriserviciosya.com/api/app";

export const TOORI_BRIDGE_BASE_URL =
  process.env.EXPO_PUBLIC_TOORI_APP_API_BASE_URL ||
  extra.tooriBridge?.baseUrl ||
  DEFAULT_BASE_URL;

const TOORI_BRIDGE_TOKEN =
  process.env.EXPO_PUBLIC_TOORI_APP_SYNC_TOKEN ||
  extra.tooriBridge?.syncToken ||
  "";

export function isTooriBridgeConfigured() {
  return Boolean(TOORI_BRIDGE_BASE_URL);
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function getBridgeAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || TOORI_BRIDGE_TOKEN;
}

async function requestBridge<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const authToken = await getBridgeAuthToken();
  if (!authToken) {
    throw new Error(
      "Falta sesión de usuario o EXPO_PUBLIC_TOORI_APP_SYNC_TOKEN para conectar la app con Web/Mica.",
    );
  }

  const response = await fetch(
    `${normalizeBaseUrl(TOORI_BRIDGE_BASE_URL)}/${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...(options.headers ?? {}),
      },
    },
  );

  const text = await response.text();
  let json: TooriBridgeResponse | Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { ok: false, error: text || "Respuesta no JSON del puente Toori" };
  }

  if (!response.ok || json?.ok === false) {
    const message =
      typeof json?.error === "string"
        ? json.error
        : `Error ${response.status} en puente Toori`;
    throw new Error(message);
  }

  return json as T;
}

export function syncPrestador(payload: TooriBridgeSyncPrestadorPayload) {
  return requestBridge<
    TooriBridgeResponse<{ action: string; marketplaceId?: string }>
  >("sync-prestador.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPedidosDisponibles(payload: {
  appUserId: string;
  telefono?: string;
  oficios: string[];
  ciudad?: string;
  provincia?: string;
  limit?: number;
}) {
  return requestBridge<TooriBridgePedidoResponse>("pedidos-disponibles.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function responderPedido(payload: TooriBridgeResponderPedidoPayload) {
  return requestBridge<
    TooriBridgeResponse<{ action: string; ofertaId: string | number }>
  >("responder-pedido.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getEstadoPedido(ofertaId: string | number, appUserId: string) {
  const params = new URLSearchParams({
    ofertaId: String(ofertaId),
    appUserId,
  });
  return requestBridge<TooriBridgeResponse>(
    `estado-pedido.php?${params.toString()}`,
    {
      method: "GET",
    },
  );
}
