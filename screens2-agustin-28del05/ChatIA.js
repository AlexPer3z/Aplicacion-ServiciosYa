import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Nuevo: color y fondo para íconos de servicio
const servicioIcono = (nombre) => {
  if (nombre.toLowerCase().includes('electricista')) return { icon: '💡', color: '#1FCFC0' };
  if (nombre.toLowerCase().includes('plomero')) return { icon: '🔧', color: '#FFB24A' };
  if (nombre.toLowerCase().includes('niñera')) return { icon: '👶', color: '#1FCFC0' };
  if (nombre.toLowerCase().includes('pintor')) return { icon: '🎨', color: '#FFB24A' };
  return { icon: '🛠️', color: '#B6E1EA' };
};

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
      setLoading(false);
      return;
    }

    const chatsFormateados = await Promise.all(
      chatsData.map(async (chat) => {
        const otroUsuarioId = chat.usuario_1 === user.id ? chat.usuario_2 : chat.usuario_1;

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('nombre, foto_perfil')
          .eq('id', otroUsuarioId)
          .single();

        const { data: servicio } = await supabase
          .from('servicios')
          .select('titulo')
          .eq('id', chat.servicio_id)
          .single();

        const ultimoMensaje = chat.mensajes?.[chat.mensajes.length - 1]?.contenido || 'Entra para comenzar a chatear';

        return {
          id: chat.id,
          nombre: usuario?.nombre || 'Usuario desconocido',
          avatar: usuario?.foto_perfil || 'https://i.pravatar.cc/100',
          mensaje: ultimoMensaje,
          servicioId: chat.servicio_id,
          servicioTitulo: servicio?.titulo || 'Servicio',
        };
      })
    );

    setChats(chatsFormateados);
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    const { icon, color } = servicioIcono(item.servicioTitulo);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.chatItem,
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.94 },
        ]}
        onPress={() =>
          navigation.navigate('ChatIndividual', {
            chatId: item.id,
            nombre: item.nombre,
            servicioId: item.servicioId,
          })
        }
      >
        {/* Ícono de servicio dentro de círculo colorido */}
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Text style={styles.serviceIcon}>{icon}</Text>
        </View>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.textos}>
          <Text style={styles.nombre}>
            {item.nombre}
          </Text>
          <Text style={styles.mensaje} numberOfLines={1}>
            {item.mensaje}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#FFA13C" style={styles.chevronIcon} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tus chats</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FFA13C" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Botón flotante nuevo chat */}
      <TouchableOpacity
        style={styles.botonNuevoChat}
        onPress={() => navigation.navigate('Servicios')}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FAF7', // Turquesa clarito
    paddingTop: 46,
    paddingHorizontal: 12,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#202B3A',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#b6e1ea88',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  serviceIcon: {
    fontSize: 22,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#19D4C6',
    backgroundColor: '#F3FFFE',
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202B3A',
    marginBottom: 1,
  },
  mensaje: {
    fontSize: 14,
    color: '#6A6A6A',
    marginTop: 2,
  },
  chevronIcon: {
    marginLeft: 10,
    color: '#FFA13C',
  },
  botonNuevoChat: {
    position: 'absolute',
    bottom: 34,
    right: 18,
    backgroundColor: '#FFA13C',
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FFA13C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
