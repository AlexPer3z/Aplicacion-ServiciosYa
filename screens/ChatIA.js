import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function Chat() {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerChats();
  }, []);

  const obtenerChats = async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('No se pudo obtener el usuario:', userError);
      setLoading(false);
      return;
    }

    const { data: chatsData, error } = await supabase
      .from('chats')
      .select(`
        id,
        usuario_1,
        usuario_2,
        servicio_id,
        mensajes (
          contenido,
          creado_en
        )
      `)
      .or(`usuario_1.eq.${user.id},usuario_2.eq.${user.id}`)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al cargar chats:', error.message);
      setLoading(false);
      return;
    }

    const chatsFormateados = await Promise.all(
      chatsData.map(async (chat) => {
        const otroUsuarioId = chat.usuario_1 === user.id ? chat.usuario_2 : chat.usuario_1;

        const { data: usuario, error: errorUsuario } = await supabase
          .from('usuarios')
          .select('nombre, foto_perfil')
          .eq('id', otroUsuarioId)
          .single();

        if (errorUsuario) {
          console.error('Error al obtener datos del usuario:', errorUsuario.message);
        }

        const ultimoMensaje = chat.mensajes?.[chat.mensajes.length - 1]?.contenido || 'Entra para comenzar a chatear';

        return {
          id: chat.id,
          nombre: usuario?.nombre || 'Usuario desconocido',
          avatar: usuario?.foto_perfil || 'https://via.placeholder.com/100',
          mensaje: ultimoMensaje,
          servicioId: chat.servicio_id, // <--- agrego servicioId aquí
        };
      })
    );

    setChats(chatsFormateados);
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatIndividual', {
        chatId: item.id,
        nombre: item.nombre,
        servicioId: item.servicioId, // <--- paso servicioId
      })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.textos}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.mensaje} numberOfLines={1}>{item.mensaje}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#30D5C8" style={styles.chevronIcon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📨 Tus chats</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF7E5F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FF7E5F',
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  mensaje: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chevronIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
