import { createClient } from "npm:@supabase/supabase-js@2";

interface MensajeRecord {
  id: string;
  chat_id: string;
  remitente_id: string;
  contenido: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: MensajeRecord;
  schema: "public";
  old_record: null | MensajeRecord;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "mensajes") {
      return new Response(
        JSON.stringify({ ok: false, reason: "ignored event" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const msg = payload.record;

    // Buscar el chat para saber los participantes
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("participant_a, participant_b")
      .eq("id", msg.chat_id)
      .single();

    if (chatErr || !chat) {
      return new Response(
        JSON.stringify({ ok: false, reason: "chat_not_found", err: chatErr?.message }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // El receptor es el participante distinto del remitente
    const receptorId = chat.participant_a === msg.remitente_id
      ? chat.participant_b
      : chat.participant_a;

    // expo_token del receptor + nombre del remitente en paralelo
    const [{ data: receptor }, { data: remitente }] = await Promise.all([
      supabase
        .from("usuarios")
        .select("expo_token")
        .eq("id", receptorId)
        .maybeSingle(),
      supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", msg.remitente_id)
        .maybeSingle(),
    ]);

    if (!receptor?.expo_token) {
      return new Response(
        JSON.stringify({ ok: false, reason: "no_expo_token", receptorId }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const title = remitente?.nombre
      ? `Nuevo mensaje de ${remitente.nombre}`
      : "Nuevo mensaje";

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify({
        to: receptor.expo_token,
        priority: "high",
        sound: "default",
        title,
        body: msg.contenido,
        data: {
          screen: "ChatIndividual",
          params: {
            chatId: msg.chat_id,
            usuarioId1: chat.participant_a,
            usuarioId2: chat.participant_b,
          },
        },
      }),
    }).then((r) => r.json());

    return new Response(JSON.stringify({ ok: true, expo: expoRes }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
});
