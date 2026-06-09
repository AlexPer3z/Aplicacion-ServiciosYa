export type TooriBridgePedido = {
  id: number | string;
  categoria: string;
  zona: string;
  descripcion: string;
  estado: string;
  paso: number;
  createdAt?: string | null;
  mediaUrl?: string | null;
  videoUrls?: string[] | string | null;
  presupuestoEstimado?: number | string | null;
  yaRespondio?: boolean;
};

export type TooriBridgePedidoResponse = {
  ok: boolean;
  count: number;
  pedidos: TooriBridgePedido[];
  error?: string;
};

export type TooriBridgeSyncPrestadorPayload = {
  appUserId: string;
  nombre: string;
  telefono: string;
  email?: string;
  oficios: string[];
  ciudad?: string;
  provincia?: string;
  barrio?: string;
  verificado?: boolean;
};

export type TooriBridgeResponderPedidoPayload = {
  ofertaId: number | string;
  appUserId: string;
  nombre?: string;
  telefono?: string;
  accion: "presupuesto" | "no_disponible" | "no";
  monto?: number;
  horariosDisponibles?: string;
  descripcion?: string;
};

export type TooriBridgeResponse<T = unknown> = {
  ok: boolean;
  error?: string;
} & T;
