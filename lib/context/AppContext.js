import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from './../supabase'; 

export const AuthContext = createContext(); 

export const AppProvider = ({ children }) => {
    
    const [notificationsCount, setNotificationsCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); 
    
    const intervalNotiRef = useRef(null);
    const intervalMessageRef = useRef(null);

    const getCurrentUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        return data.user.id;
    };

    const loadNotifications = async () => {
        const userId = await getCurrentUser();
    
        if (!userId) {
          console.error('No se encontró un usuario autenticado.');
          return;
        }
    
        const { data: notis, error } = await supabase
          .from('notificaciones')
          .select('id')
          .eq('receptor_id', userId)
          .eq('leido', false)
          .order('created_at', { ascending: false });
    
        if (error) {
          console.error('Error al obtener notificaciones:', error.message);
          return;
        }
    
        setNotificationsCount(notis.length);
        console.log('loadNotifications ',notis.length);
    };  
     
    const startNotificationCounter = () => {
        if (intervalNotiRef.current) {
            clearInterval(intervalNotiRef.current);
            intervalNotiRef.current = null;
        }

        loadNotifications(); 

        intervalNotiRef.current = setInterval(() => {
            loadNotifications();
        }, 30000);
    };
 
    const loadUnreadMessages = async () => {
        const userId = await getCurrentUser();

        if (!userId) {
            console.error('No se encontró un usuario autenticado.');
            return;
        }

        // Paso 1: obtener todos los chats en los que participa
        const { data: chatsData, error: chatsError } = await supabase
            .from('chats')
            .select('id')
            .or(`usuario_1.eq.${userId},usuario_2.eq.${userId}`)
            .order('id', { ascending: false });

        if (chatsError) {
            console.error('Error al obtener los chats:', chatsError.message);
            return;
        }

        let totalNoLeidos = 0;

        // Paso 2: recorrer cada chat y consultar los mensajes no leídos del otro usuario
        for (const chat of chatsData) {
            const { data: mensajesData, error: mensajesError } = await supabase
                .from('mensajes')
                .select('id')
                .eq('chat_id', chat.id)
                .eq('leido_por_receptor', false)
                .neq('remitente_id', userId); // mensajes enviados por otra persona

            if (mensajesError) {
                console.error(`Error al obtener mensajes del chat ${chat.id}:`, mensajesError.message);
                continue;
            }

            totalNoLeidos += mensajesData.length;
        }

        setUnreadMessagesCount(totalNoLeidos);
        console.log('loadUnreadMessages:', totalNoLeidos);
    };

     
    const startMessageCounter = () => {
        if (intervalMessageRef.current) {
            clearInterval(intervalMessageRef.current);
            intervalMessageRef.current = null;
        }

        loadUnreadMessages(); 

        intervalMessageRef.current = setInterval(() => {
            loadUnreadMessages();
        }, 30000);
    };

    return (
        <AuthContext.Provider
            value={{
                notificationsCount,
                unreadMessagesCount,
                loadNotifications,
                startNotificationCounter,
                loadUnreadMessages,
                startMessageCounter,
            }}>
            {children}
        </AuthContext.Provider>
    );
}