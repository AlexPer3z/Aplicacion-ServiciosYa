import React, { createContext, useState, useRef, useEffect } from "react";
import { supabase } from "./../supabase";

export const AuthContext = createContext();

export const AppProvider = ({ children }) => {
  const logoutCleanup = () => {
    setUnreadMessagesCount(0);
    setLocation(null);

    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
  };

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const [location, setLocation] = useState(null);

  const messageChannelRef = useRef(null);

  const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  };

  const loadUnreadMessagesCount = async () => {
    const userId = await getCurrentUser();
    if (!userId) return;

    // Obtener todos los chats donde participa el usuario
    const { data: chatsData, error: chatsError } = await supabase
      .from("chats")
      .select("id")
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

    if (chatsError || !chatsData) return;

    const chatIds = chatsData.map((c) => c.id);
    if (chatIds.length === 0) {
      setUnreadMessagesCount(0);
      return;
    }

    // Contar mensajes no leídos de todos esos chats en una sola consulta
    const { count, error } = await supabase
      .from("mensajes")
      .select("*", { count: "exact", head: true })
      .in("chat_id", chatIds)
      .eq("leido", false)
      .neq("remitente_id", userId);

    if (!error) setUnreadMessagesCount(count || 0);
  };

  // Inicializa realtime listener una vez al montar
  useEffect(() => {
    let isMounted = true;

    const setupRealtime = async () => {
      await loadUnreadMessagesCount();

      const userId = await getCurrentUser();
      if (!userId) return;

      // Limpia cualquier suscripción previa
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }

      // Escucha cambios en la tabla notificaciones para este usuario
      const channelMessage = supabase
        .channel("public:mensajes")
        .on(
          "postgres_changes",
          {
            event: "*", // puedes filtrar por 'INSERT' y 'UPDATE' si no necesitas DELETE
            schema: "public",
            table: "mensajes",
          },
          (payload) => {
            if (isMounted) {
              const msg = payload.new;
              // Filtrar rápido: si el usuario no está involucrado, ignorar
              //if (msg.remitente_id === userId || msg.receptor_id === userId) {
              // Solo en este caso actualizar tu contador
              loadUnreadMessagesCount();
              //}
            }
          },
        )
        .subscribe();

      messageChannelRef.current = channelMessage;
    };

    setupRealtime();

    return () => {
      isMounted = false;

      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        unreadMessagesCount,
        loadUnreadMessages: loadUnreadMessagesCount,

        // ✅ agregar ubicación global
        location,
        setLocation,

        logoutCleanup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
