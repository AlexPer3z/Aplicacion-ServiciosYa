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
  const { data } = await supabase
    .from("chats")
    .select(`
        id,
        usuario_1,
        usuario_2,
        servicio_id,
        borrado_por_usuario_1,
        borrado_por_usuario_2,
        mensajes (
          id,
          leido_por_receptor,
          remitente_id,
          contenido,
          creado_en
        )
      `)
    .or(`usuario_1.eq.${userId},usuario_2.eq.${userId}`)
    .order("id", { ascending: false })
    .throwOnError();

  // ids de los usuarios del chat
  const user_ids = data
    .map((chat) => getPartner(chat.usuario_1, chat.usuario_2, userId))
    .filter((id) => id !== null);
  // ids de los servicios
  const servicios_ids = (data || [])
    .map((chat) => chat.servicio_id)
    .filter((id) => id !== null)
    .map((id) => Number(id));

  // nombres de los usuarios del chat
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, foto_perfil")
    .in("id", user_ids)
    .throwOnError();
  // servicios
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, titulo, descripcion, categoria, horario")
    .in("id", servicios_ids)
    .throwOnError();

  const chats: ChatItem[] = [];
  for (const chat of data) {
    const partnerID = getPartner(chat.usuario_1, chat.usuario_2, userId) ?? "";
    const servicio_id = chat.servicio_id ? Number(chat.servicio_id) : 0;
    const user = usuarios.find((n) => n.id === partnerID);
    const servicio = servicios.find((s) => s.id === servicio_id);
    if (!user || !servicio) continue;

    // obtener cantidad de mensajes no leidos
    const fechaBorrado =
      chat.usuario_1 === userId
        ? chat.borrado_por_usuario_1
        : chat.borrado_por_usuario_2;
    const mensajesFiltrados = fechaBorrado
      ? chat.mensajes.filter(
          (m) => new Date(m.creado_en ?? "") > new Date(fechaBorrado),
        )
      : chat.mensajes;

    const noLeidos = mensajesFiltrados.filter(
      (msg) => !msg.leido_por_receptor && msg.remitente_id !== userId,
    ).length;

    // obtener el ultimo mensaje
    const mensaje =
      mensajesFiltrados?.[mensajesFiltrados.length - 1]?.contenido ||
      "Entra para comenzar a chatear";

    const title = `${user?.nombre ?? "Usuario"} - ${servicio?.titulo ?? "Servicio"}`;
    const avatar = user?.foto_perfil ?? "https://picsum.photos/id/9/200/300";

    chats.push({
      id: chat.id,
      avatar,
      title,
      noLeidos,
      mensaje,
      usuario_1: chat.usuario_1 ? chat.usuario_1 : "",
      usuario_2: chat.usuario_2 ? chat.usuario_2 : "",
      servicio,
    });
  }

  return chats;
}

export async function deleteChat(columna: string, id: string) {
  await supabase
    .from("chats")
    .update({ [columna]: new Date().toISOString() })
    .eq("id", id)
    .throwOnError();
}

export const fetchUserChatQueryOptions = queryOptions({
  queryKey: ["user", "chats"],
  queryFn: fetchUserChats,
  structuralSharing: true,
});
