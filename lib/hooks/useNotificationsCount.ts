import { useEffect, useRef } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { useNotificationStore } from '../../store/notificationStore';
import { getUserID } from '../../store/authStore';

export const useNotificationsCount = () => {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const { setUnreadCount, incrementUnread, decrementUnread, resetUnread } = useNotificationStore();

    useEffect(() => {
        const userId = getUserID();
        // Fetch initial unread count
        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('notificaciones')
                    .select('*', { count: 'exact', head: true })
                    .eq('receptor_id', userId)
                    .eq('leido', false);

                if (error) {
                    console.error('Error fetching unread count:', error);
                    return;
                }
                setUnreadCount(count || 0);
            } catch (error) {
                console.error('Error in fetchUnreadCount:', error);
            }
        };

        fetchUnreadCount();

        // Set up real-time subscription
        channelRef.current = supabase
            .channel('notificaciones-count')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `receptor_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('Notification change:', payload.eventType);

                    switch (payload.eventType) {
                        case 'INSERT':
                            // New notification - check if unread
                            if (!payload.new.leido) {
                                incrementUnread();
                            }
                            break;

                        case 'UPDATE': {
                            // Check if read status changed
                            const wasUnread = !payload.old.leido;
                            const isNowRead = payload.new.leido;

                            if (wasUnread && isNowRead) {
                                decrementUnread();
                            } else if (!wasUnread && !isNowRead) {
                                incrementUnread();
                            }
                            break;
                        }

                        case 'DELETE':
                            // If deleted notification was unread, decrement
                            if (!payload.old.leido) {
                                decrementUnread();
                            }
                            break;
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        // Cleanup
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                resetUnread();
            }
        };
    }, []);
};