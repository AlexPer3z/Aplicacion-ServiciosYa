import { useCallback, useEffect } from "react";
import { deleteChat, fetchUserChatQueryOptions, type ChatItem } from "../lib/utils/chat";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View, Text, FlatList, Alert, TouchableOpacity, Image } from "react-native";
import BotonVolver from "../components/BotonVolver";
import { Ionicons } from "@expo/vector-icons";
import { getUserID } from "../store/authStore";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import type { MensajeRow } from "../types/db.overrides.types";
import LoadingView from "../components/LoadingView";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

function ChatList() {
    const navigation = useNavigation<NavigationProp>();
    const { data, refetch, isLoading } = useQuery({
        ...fetchUserChatQueryOptions,
        staleTime: 200,
    });

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    useEffect(() => {
        const userId = getUserID();

        const channel = supabase.channel(`realtime-chats-${userId}`);
        const messagesChannel = supabase.channel(`realtime-mensajes-${userId}`);

        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chats',
                },
                (payload) => {
                    const newRecord = payload.new as any;
                    const oldRecord = payload.old as any;

                    const involvesUser =
                        (newRecord?.participant_a === userId || newRecord?.participant_b === userId) ||
                        (oldRecord?.participant_a === userId || oldRecord?.participant_b === userId);

                    if (involvesUser) {
                        refetch();
                    }
                }
            )
            .subscribe();

        messagesChannel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'mensajes' },
                async () => {
                    // El nuevo schema de mensajes no tiene receptor_id.
                    // Refetch siempre: el query del lado del cliente ya filtra solo chats del usuario.
                    refetch();
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(messagesChannel);
        };
    }, [refetch]);

    const eliminarChat = async (item: ChatItem) => {
        try {
            await deleteChat("", item.id);
            refetch();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "No se pudo eliminar el chat");
        }
    };

    const renderItem = ({ item }: { item: ChatItem }) => {
        const handleEliminar = () => {
            Alert.alert(
                "Eliminar chat",
                "¿Seguro que deseas eliminar este chat? No podrás ver los mensajes antiguos.",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => await eliminarChat(item)
                    }
                ]
            );
        };
        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatIndividual', {
                    chatId: item.id,
                    nombre: item.title,
                    servicio: item.servicio,
                    usuarioId1: item.usuario_1,
                    usuarioId2: item.usuario_2,
                    servicioId: String(item.servicio.id ?? ""),
                })}
                onLongPress={handleEliminar}
            >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.textos}>
                    <Text style={styles.nombre}>{item.title}</Text>
                    <Text style={styles.mensaje} numberOfLines={1}>{item.mensaje}</Text>
                </View>
                <View style={{ position: 'relative' }}>
                    <Ionicons name="chevron-forward" size={22} color="#30D5C8" style={styles.chevronIcon} />
                    {item.noLeidos > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.noLeidos}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={isLoading ? <LoadingView /> : null}
            contentContainerStyle={{ paddingBottom: 20 }}
        />
    );
}

function ChatListScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>📨 Tus chats</Text>
            <BotonVolver />
            <ChatList />
        </View>
    );
}

export default ChatListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8FAF7',
        paddingTop: 46,
        paddingHorizontal: 12
    },
    titulo: {
        fontSize: 32,
        fontWeight: '800',
        color: '#202B3A',
        marginBottom: 20,
        paddingTop: 30,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: '#b6e1ea88',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 18,
        padding: 14,
        shadowColor: '#1FCFC020',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 2
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#069eb3',
        backgroundColor: '#F3FFFE'
    },
    textos: {
        flex: 1
    },
    nombre: {
        fontSize: 17,
        fontWeight: '700',
        color: '#202B3A',
        marginBottom: 1
    },
    mensaje: {
        fontSize: 14,
        color: '#6A6A6A',
        marginTop: 2
    },
    chevronIcon: {
        marginLeft: 10,
        color: '#FFA13C'
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 25,
        backgroundColor: '#FF5A5F',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
