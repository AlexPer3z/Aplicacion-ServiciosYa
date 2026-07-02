import { createClient } from "npm:@supabase/supabase-js@2";

type UrgentWorkAlert = {
  id: string;
  created_at: string;
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
  metadata: Record<string, unknown>;
};

const EXPO_API_URL = "https://exp.host/--/api/v2/push/send";
const URGENT_WORK_CHANNEL_ID = "urgent-work";
const URGENT_WORK_SOUND = "urgent_work.wav";
const RETRY_MINUTES = [2, 10, 30, 60];

function nextAttemptAt(createdAt: string, attemptsSentAfterCurrent: number) {
  const nextMinute = RETRY_MINUTES[attemptsSentAfterCurrent];
  if (nextMinute == null) return null;

  const next = new Date(createdAt);
  next.setMinutes(next.getMinutes() + nextMinute);
  return next.toISOString();
}

function reminderCopy(alert: UrgentWorkAlert) {
  const attempt = alert.attempts_sent + 1;

  if (attempt >= 4) {
    return {
      title: "Ultimo aviso: trabajo urgente",
      body: "Respondelo ahora. Si no hay respuesta, el pedido puede pasar a otro prestador.",
    };
  }

  if (attempt === 3) {
    return {
      title: "Trabajo urgente pendiente",
      body: "El cliente sigue esperando respuesta. Revisalo cuanto antes.",
    };
  }

  return {
    title: alert.title || "Tenes trabajo urgente",
    body: alert.body,
  };
}

async function sendExpoPush(token: string, alert: UrgentWorkAlert) {
  const { title, body } = reminderCopy(alert);

  const res = await fetch(EXPO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
    },
    body: JSON.stringify({
      to: token,
      priority: "high",
      channelId: URGENT_WORK_CHANNEL_ID,
      sound: URGENT_WORK_SOUND,
      title,
      body,
      data: {
        type: "urgent_work_retry",
        alertId: alert.id,
        source: alert.source,
        screen: alert.chat_id ? "ChatIndividual" : "MisServicios",
        params: alert.chat_id
          ? {
              chatId: alert.chat_id,
              usuarioId1: alert.cliente_id,
              usuarioId2: alert.worker_id,
            }
          : { screen: "Solicitudes" },
      },
    }),
  });

  return res.json();
}

async function escalateToAlternativeWorker(supabase: any, alert: UrgentWorkAlert) {
  if (!alert.category || !alert.cliente_id) return null;

  const { data: candidates } = await supabase
    .from("usuarios")
    .select("id, expo_token, nombre, categoria")
    .eq("rol", "worker")
    .eq("perfilPublico", true)
    .neq("id", alert.worker_id)
    .ilike("categoria", `%${alert.category}%`)
    .limit(10);

  const candidate = (candidates || []).find((user: any) => user.expo_token);
  if (!candidate?.id) return null;

  const title = "Nuevo trabajo disponible";
  const body = `Un cliente necesita ${alert.category}. Respondelo cuanto antes.`;

  const { data: notificacion } = await supabase
    .from("notificaciones")
    .insert({
      receptor_id: candidate.id,
      emisor_id: alert.cliente_id,
      mensaje: body,
      servicio_id: alert.servicio_id,
    })
    .select("id")
    .single();

  const { data: newAlert } = await supabase
    .from("urgent_work_alerts")
    .insert({
      source: alert.source,
      worker_id: candidate.id,
      cliente_id: alert.cliente_id,
      servicio_id: alert.servicio_id,
      notificacion_id: notificacion?.id ?? null,
      category: alert.category,
      title,
      body,
      metadata: {
        parent_alert_id: alert.id,
        escalated_from_worker_id: alert.worker_id,
      },
    })
    .select("*")
    .single();

  if (candidate.expo_token && newAlert) {
    await sendExpoPush(candidate.expo_token, newAlert);
    await supabase
      .from("urgent_work_alerts")
      .update({
        attempts_sent: 1,
        last_sent_at: new Date().toISOString(),
        next_attempt_at: nextAttemptAt(newAlert.created_at, 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", newAlert.id);
  }

  return candidate.id;
}

Deno.serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ ok: false, error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date().toISOString();

  const { data: alerts, error } = await supabase
    .from("urgent_work_alerts")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", now)
    .lt("attempts_sent", RETRY_MINUTES.length)
    .order("next_attempt_at", { ascending: true })
    .limit(100);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const alert of (alerts || []) as UrgentWorkAlert[]) {
    if (alert.notificacion_id) {
      const { data: notification } = await supabase
        .from("notificaciones")
        .select("estado, leido")
        .eq("id", alert.notificacion_id)
        .maybeSingle();

      if (notification?.estado === "aceptado" || notification?.leido === true) {
        await supabase
          .from("urgent_work_alerts")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", alert.id);
        skipped++;
        continue;
      }
    }

    if (alert.chat_id && alert.cliente_id) {
      const { data: reply } = await supabase
        .from("mensajes")
        .select("id")
        .eq("chat_id", alert.chat_id)
        .eq("remitente_id", alert.worker_id)
        .gt("created_at", alert.created_at)
        .limit(1)
        .maybeSingle();

      if (reply) {
        await supabase
          .from("urgent_work_alerts")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", alert.id);
        skipped++;
        continue;
      }
    }

    const { data: worker } = await supabase
      .from("usuarios")
      .select("expo_token")
      .eq("id", alert.worker_id)
      .maybeSingle();

    if (!worker?.expo_token) {
      await supabase
        .from("urgent_work_alerts")
        .update({
          attempts_sent: alert.attempts_sent + 1,
          next_attempt_at: nextAttemptAt(alert.created_at, alert.attempts_sent + 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);
      skipped++;
      continue;
    }

    try {
      await sendExpoPush(worker.expo_token, alert);
      const attemptsAfterCurrent = alert.attempts_sent + 1;
      const nextAt = nextAttemptAt(alert.created_at, attemptsAfterCurrent);
      const isLastAttempt = attemptsAfterCurrent >= RETRY_MINUTES.length;

      await supabase
        .from("urgent_work_alerts")
        .update({
          attempts_sent: attemptsAfterCurrent,
          last_sent_at: new Date().toISOString(),
          next_attempt_at: nextAt,
          status: isLastAttempt ? "escalation_ready" : "pending",
          escalation_ready_at: isLastAttempt ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);

      if (isLastAttempt) {
        const escalatedToWorkerId = await escalateToAlternativeWorker(supabase, alert);
        if (escalatedToWorkerId) {
          await supabase
            .from("urgent_work_alerts")
            .update({
              metadata: {
                ...(alert.metadata || {}),
                escalated_to_worker_id: escalatedToWorkerId,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", alert.id);
        }
      }

      sent++;
    } catch (e) {
      failed++;
      await supabase
        .from("urgent_work_alerts")
        .update({
          updated_at: new Date().toISOString(),
          metadata: {
            ...(alert.metadata || {}),
            last_error: e instanceof Error ? e.message : String(e),
          },
        })
        .eq("id", alert.id);
    }
  }

  return Response.json({
    ok: true,
    due: alerts?.length || 0,
    sent,
    skipped,
    failed,
  });
});
