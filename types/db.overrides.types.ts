import type { MergeDeep } from "type-fest";
import type { Database as DatabaseGenerated, Json } from "./database.types";
import type { LocationParams } from "./location";
import type { CategoriaQueryParams } from "./servicios";
import type { WorkerStatusQueryParams } from "./worker";

type ChatRowOverride = {
  acceso_contratado: boolean | null;
  borrado_por_usuario_1: string | null;
  borrado_por_usuario_2: string | null;
  contratado_id: string | null;
  contratante_id: string | null;
  creado_en: string | null;
  es_ia: boolean | null;
  id: string;
  participant_a: string | null;
  participant_b: string | null;
  participantes: string[] | null;
  servicio_id: string | null;
  updated_at: string | null;
  usuario_1: string | null;
  usuario_2: string | null;
};

type ChatInsertOverride = Partial<ChatRowOverride> & {
  id?: string;
  participant_a?: string | null;
  participant_b?: string | null;
};

type NuevaOfertaRow = {
  id: string;
  created_at: string | null;
  cliente_telefono: string | null;
  nombre_cliente: string | null;
  categoria: string | null;
  descripcion: string | null;
  zona: string | null;
  estado: string | null;
  paso: number | null;
  media_url: string | null;
  video_urls: string | null;
  media_descripcion: string | null;
  historial_conversacion: string | null;
};

type PresupuestoRow = {
  id: number;
  created_at: string | null;
  oferta_id: string | null;
  trabajador_uuid: string | null;
  monto: number | null;
  descripcion: string | null;
  horarios_disponibles: string | null;
  estado: string | null;
};

type UsuarioRowOverride = DatabaseGenerated["public"]["Tables"]["usuarios"]["Row"] & {
  barrio: string | null;
  celular: string | null;
  verificado: boolean | null;
  matricula: Json | string | null;
  antecedentes: Json | string | null;
};

type UsuarioInsertOverride = Omit<
  DatabaseGenerated["public"]["Tables"]["usuarios"]["Insert"],
  "celular"
> & {
  barrio?: string | null;
  celular?: string | null;
  verificado?: boolean | null;
  matricula?: Json | string | null;
  antecedentes?: Json | string | null;
};

type MensajeRowOverride = DatabaseGenerated["public"]["Tables"]["mensajes"]["Row"] & {
  created_at: string | null;
};

type MensajeInsertOverride = DatabaseGenerated["public"]["Tables"]["mensajes"]["Insert"] & {
  created_at?: string | null;
};

type UrgentWorkAlertRow = {
  id: string;
  created_at: string;
  updated_at: string;
  source: "service_request" | "direct_contact" | "chat_message";
  status: "pending" | "accepted" | "cancelled" | "escalation_ready";
  worker_id: string;
  cliente_id: string | null;
  servicio_id: string | null;
  chat_id: string | null;
  notificacion_id: string | null;
  category: string | null;
  title: string;
  body: string;
  attempts_sent: number;
  next_attempt_at: string;
  last_sent_at: string | null;
  escalation_ready_at: string | null;
  metadata: Json;
};

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        chats: {
          Row: ChatRowOverride;
          Insert: ChatInsertOverride;
          Update: Partial<ChatRowOverride>;
        };
        mensajes: {
          Row: MensajeRowOverride;
          Insert: MensajeInsertOverride;
          Update: Partial<MensajeRowOverride>;
        };
        usuarios: {
          Row: UsuarioRowOverride;
          Insert: UsuarioInsertOverride;
          Update: Partial<UsuarioRowOverride>;
        };
        nuevaOferta: {
          Row: NuevaOfertaRow;
          Insert: Partial<NuevaOfertaRow>;
          Update: Partial<NuevaOfertaRow>;
          Relationships: [];
        };
        presupuestos: {
          Row: PresupuestoRow;
          Insert: Partial<PresupuestoRow>;
          Update: Partial<PresupuestoRow>;
          Relationships: [];
        };
        urgent_work_alerts: {
          Row: UrgentWorkAlertRow;
          Insert: Partial<UrgentWorkAlertRow> & {
            source: UrgentWorkAlertRow["source"];
            worker_id: string;
            body: string;
          };
          Update: Partial<UrgentWorkAlertRow>;
          Relationships: [];
        };
      };
      Functions: {
        get_servicios_with_online_workers: {
          Args: LocationParams;
        };
        get_servicios_with_worker_status: {
          Args: LocationParams & CategoriaQueryParams;
        };
        test_get_servicios_with_worker_status: {
          Args: LocationParams & CategoriaQueryParams;
        };
        count_services_by_status_in_radius: {
          Args: LocationParams & CategoriaQueryParams & WorkerStatusQueryParams;
        };
      };
    };
  }
>;

export type UserUpdate = Database["public"]["Tables"]["usuarios"]["Update"];
export type NotificacionRow = Database["public"]["Tables"]["notificaciones"]["Row"];
export type ChatRow = Database["public"]["Tables"]["chats"]["Row"];
export type MensajeRow = Database["public"]["Tables"]["mensajes"]["Row"];
export type ServicioRow = Database["public"]["Tables"]["servicios"]["Row"];
