export const URGENT_WORK_CHANNEL_ID = "urgent-work";
export const URGENT_WORK_SOUND = "urgent-work.wav";

type UrgentWorkAlertSource = "service_request" | "direct_contact" | "chat_message";

type UrgentWorkPushParams = {
  to: string | null | undefined;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
};

type CreateUrgentWorkAlertParams = {
  supabase: any;
  source: UrgentWorkAlertSource;
  workerId: string | null | undefined;
  clienteId?: string | null;
  servicioId?: string | number | null;
  chatId?: string | null;
  notificacionId?: string | null;
  category?: string | null;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function sendUrgentWorkPush({
  to,
  title = "Tenes trabajo urgente",
  body,
  data,
}: UrgentWorkPushParams) {
  if (!to) return null;

  return fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      priority: "high",
      channelId: URGENT_WORK_CHANNEL_ID,
      sound: URGENT_WORK_SOUND,
      title,
      body,
      data,
    }),
  });
}

export async function createUrgentWorkAlert({
  supabase,
  source,
  workerId,
  clienteId,
  servicioId,
  chatId,
  notificacionId,
  category,
  title = "Tenes trabajo urgente",
  body,
  metadata = {},
}: CreateUrgentWorkAlertParams) {
  if (!workerId) return null;

  return supabase.from("urgent_work_alerts").insert({
    source,
    worker_id: workerId,
    cliente_id: clienteId ?? null,
    servicio_id: servicioId == null ? null : String(servicioId),
    chat_id: chatId ?? null,
    notificacion_id: notificacionId ?? null,
    category: category ?? null,
    title,
    body,
    metadata,
  });
}
