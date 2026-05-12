import { queryOptions } from "@tanstack/react-query";
import { getUserID } from "../../store/authStore";
import { supabase } from "../supabase";
import type { ServicioRow } from "../../types/db.overrides.types";

export interface ChatItem {
  id: string;
  avatar?: string;
  title: string;
  mensaje: string;
  date?: string;
  noLeidos: number;
  usuario_1: string;
  usuario_2: string;
  servicio: Partial<ServicioRow>;
}

function getPartner(
  user_1: string | null,
  user_2: string | null,
  userId: string,
) {
  return user_1 === userId ? user_2 : user_1;
}

async function fetchUserChats() {
  const userId = getUserID();

  // Query 1: solo metadata de chats (sin mensajes embebidos, mucho más liviano)
  const { data: chatsData } = await supabase
    .from("chats")
    .select("id, participant_a, participant_b, updated_at")
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .throwOnError();

  if (!chatsData || chatsData.length === 0) return [];

  const chatIds = chatsData.map((c) => c.id);
  const user_ids = chatsData
    .map((chat) => getPartner(chat.participant_a, chat.participant_b, userId))
    .filter((id) => id !== null);

  // Queries 2 y 3 en paralelo (independientes entre sí)
  const [usuariosRes, msgsRes] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nombre, foto_perfil")
      .in("id", user_ids),
    supabase
      .from("mensajes")
      .select("chat_id, contenido, created_at, leido, remitente_id")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false }),
  ]);

  const usuarios = usuariosRes.data ?? [];
  const msgs = msgsRes.data ?? [];

  // Agrupar mensajes por chat_id (vienen DESC, así que [0] es el último)
  const msgsByChat = new Map<string, typeof msgs>();
  for (const msg of msgs) {
    const arr = msgsByChat.get(msg.chat_id) ?? [];
    arr.push(msg);
    msgsByChat.set(msg.chat_id, arr);
  }

  const chats: ChatItem[] = [];
  for (const chat of chatsData) {
    const partnerID =
      getPartner(chat.participant_a, chat.participant_b, userId) ?? "";
    const user = usuarios.find((n) => n.id === partnerID);
    if (!user) {
      console.warn("[fetchUserChats] partner no encontrado en `usuarios`:", {
        chatId: chat.id,
        partnerID,
      });
    }

    const chatMsgs = msgsByChat.get(chat.id) ?? [];
    const lastMsg = chatMsgs[0]; // ya viene ordenado DESC
    const noLeidos = chatMsgs.filter(
      (m) => !m.leido && m.remitente_id !== userId,
    ).length;

    chats.push({
      id: chat.id,
      avatar: user?.foto_perfil ?? "https://picsum.photos/id/9/200/300",
      title: user?.nombre ?? "Usuario",
      noLeidos,
      mensaje: lastMsg?.contenido || "Entra para comenzar a chatear",
      usuario_1: chat.participant_a ?? "",
      usuario_2: chat.participant_b ?? "",
      servicio: {},
    });
  }

  return chats;
}

export async function deleteChat(_columna: string, id: string) {
  // El schema nuevo no tiene soft-delete por usuario (borrado_por_usuario_1/2).
  // Hacemos hard-delete del chat — la FK ON DELETE CASCADE en mensajes los limpia.
  await supabase
    .from("chats")
    .delete()
    .eq("id", id)
    .throwOnError();
}

export const fetchUserChatQueryOptions = queryOptions({
  queryKey: ["user", "chats"],
  queryFn: fetchUserChats,
  structuralSharing: true,
});
