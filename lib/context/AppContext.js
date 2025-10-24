import React, { createContext, useState, useRef, useEffect } from 'react';
import { supabase } from './../supabase'; 

export const AuthContext = createContext(); 

export const AppProvider = ({ children }) => {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const [location, setLocation] = useState(null);
  
  const notificationChannelRef = useRef(null);
  const messageChannelRef = useRef(null);


  const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  };

  // Usamos count sin traer registros
  const loadNotificationsCount = async () => {
    const userId = await getCurrentUser();
    if (!userId) {
      console.error('No se encontró un usuario autenticado.');
      return;
    }

    const { count, error } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('receptor_id', userId)
      .eq('leido', false);

    if (error) {
      console.error('Error al obtener notificaciones:', error.message);
      return;
    }

    setNotificationsCount(count || 0);
    console.log('loadNotifications count', count);
  };

  const loadUnreadMessagesCount = async () => {
    const userId = await getCurrentUser();
    if (!userId) return;

    // Obtener todos los chats donde participa el usuario
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('id')
      .or(`usuario_1.eq.${userId},usuario_2.eq.${userId}`);

    if (chatsError || !chatsData) return;

    const chatIds = chatsData.map((c) => c.id);
    if (chatIds.length === 0) {
      setUnreadMessagesCount(0);
      return;
    }

    // Contar mensajes no leídos de todos esos chats en una sola consulta
    const { count, error } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds)
      .eq('leido_por_receptor', false)
      .neq('remitente_id', userId);

    if (!error) setUnreadMessagesCount(count || 0);
  };

  // Inicializa realtime listener una vez al montar
  useEffect(() => {
    let isMounted = true;

    const setupRealtime = async () => {
      await loadNotificationsCount();
      await loadUnreadMessagesCount();

      const userId = await getCurrentUser();
      if (!userId) return;

      // Limpia cualquier suscripción previa
      if (notificationChannelRef.current) {
        supabase.removeChannel(notificationChannelRef.current);
      }

      // Escucha cambios en la tabla notificaciones para este usuario
      const channel = supabase
        .channel('public:notificaciones')
        .on(
          'postgres_changes',
          {
            event: '*', // puedes filtrar por 'INSERT' y 'UPDATE' si no necesitas DELETE
            schema: 'public',
            table: 'notificaciones',
            filter: `receptor_id=eq.${userId}`
          },
          (payload) => {
            if (isMounted) {
              //console.log('Cambio en notificaciones:', payload);
              loadNotificationsCount(); // recalcula el contador 
            }
          }
        )
        .subscribe();

      notificationChannelRef.current = channel;

      // Limpia cualquier suscripción previa
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }

      // Escucha cambios en la tabla notificaciones para este usuario
      const channelMessage = supabase
        .channel('public:mensajes')
        .on(
          'postgres_changes',
          {
            event: '*', // puedes filtrar por 'INSERT' y 'UPDATE' si no necesitas DELETE
            schema: 'public',
            table: 'mensajes', 
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
          }
        )
        .subscribe();

      messageChannelRef.current = channelMessage;
    }; 

    setupRealtime();

    return () => {
      isMounted = false;
      if (notificationChannelRef.current) {
        supabase.removeChannel(notificationChannelRef.current);
        notificationChannelRef.current = null;
      }

      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, []);

  return (
  <AuthContext.Provider
    value={{
      notificationsCount,
      loadNotifications: loadNotificationsCount,
      unreadMessagesCount,
      loadUnreadMessages: loadUnreadMessagesCount,

      // ✅ agregar ubicación global
      location,
      setLocation,
    }}
  >
    {children}
  </AuthContext.Provider>
);

};
