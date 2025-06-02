import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const obtenerUsuarioActual = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  };

  const cargarNotificaciones = async () => {
    setLoading(true);
    const userId = await obtenerUsuarioActual();

    if (!userId) {
      console.error('No se encontró un usuario autenticado.');
      setLoading(false);
      return;
    }

    const { data: notis, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('receptor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener notificaciones:', error.message);
      setLoading(false);
      return;
    }

    const emisorIds = [...new Set(notis.map((n) => n.emisor_id))];
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, foto_perfil')
      .in('id', emisorIds);

    if (errorUsuarios) {
      console.error('Error al obtener usuarios:', errorUsuarios.message);
      setLoading(false);
      return;
    }

    const notisConFoto = notis.map((n) => {
      const usuario = usuarios?.find((u) => u.id === n.emisor_id);
      return {
        ...n,
        foto_perfil: usuario?.foto_perfil || null,
      };
    });

    setNotificaciones(notisConFoto);
    setLoading(false);
  };

  const marcarComoLeida = async (id) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id);

    if (!error) {
      setNotificaciones((prev) =>
        prev.map((item) => (item.id === id ? { ...item, leido: true } : item))
      );
    }
  };

  const eliminarNotificacion = async (id) => {
    const { error } = await supabase.from('notificaciones').delete().eq('id', id);
    if (!error) {
      setNotificaciones((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const eliminarTodasNotificaciones = async () => {
    const userId = await obtenerUsuarioActual();
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('receptor_id', userId);

    if (!error) {
      setNotificaciones([]);
    }
  };

  const aceptarNotificacion = async (notificacion) => {
  const userId = await obtenerUsuarioActual();
  if (!userId) {
    Alert.alert('Error', 'No se pudo identificar al usuario.');
    return;
  }

  if (!notificacion?.emisor_id || !notificacion?.id) {
    Alert.alert('Error', 'Faltan datos de la notificación.');
    return;
  }

  // Actualizar estado de notificación
const { error: errorEstado } = await supabase
  .from('notificaciones')
  .update({ estado: "aceptado" })
  .eq('id', notificacion.id);

if (!errorEstado) {
  console.log('Estado actualizado correctamente a "aceptado"');
}

Alert.alert('✅ Servicio confirmado', 'Has aceptado la solicitud.');

await marcarComoLeida(notificacion.id);

  // Verificar si ya existe un chat entre estos usuarios
  const { data: chatExistente, error: errorCheck } = await supabase
    .from('chats')
    .select('*')
    .or(
      `and(usuario_1.eq.${userId},usuario_2.eq.${notificacion.emisor_id}),and(usuario_1.eq.${notificacion.emisor_id},usuario_2.eq.${userId})`
    )
    .maybeSingle();

  if (errorCheck) {
    Alert.alert('Error', 'No se pudo verificar chats existentes.');
    return;
  }

  if (chatExistente) {
  Alert.alert('Ya existe un chat', 'Ya tienes un chat con esta persona.');

  supabase
  .from('mensajes')
  .insert({
    chat_id: chatExistente.id,
    contenido: `📢 **IMPORTANTE** 📢

Este chat ha sido creado exclusivamente para que puedas coordinar y acordar los detalles del servicio con el trabajador.

⚠️ **Soluciones Ya no se hace responsable** por la calidad del servicio ofrecido ni por cualquier eventualidad durante su ejecución.

⭐ **Al finalizar el servicio, desde este chat podrás dejar tu calificación y opinión sobre el trabajador para ayudar a otros usuarios.**

────────────────────────────`,

emisor_id: userId,
    fecha_creacion: new Date().toISOString(),
  })
  .then(({ error }) => {
    if (error) {
      console.error('Error al enviar mensaje ticket:', error.message);
    }
    navigation.navigate('ChatIndividual', {
      chatId: chatExistente.id,
      otroUsuarioId: notificacion.emisor_id,
    });
  })
  .catch((error) => {
    console.error('Error en promesa mensajes:', error.message);
    navigation.navigate('ChatIndividual', {
      chatId: chatExistente.id,
      otroUsuarioId: notificacion.emisor_id,
    });
  });

return;

}



  // Crear nuevo chat
const { data: nuevoChat, error: errorNuevoChat } = await supabase
  .from('chats')
  .insert([{
    usuario_1: userId,
    usuario_2: notificacion.emisor_id,
    contratante_id: notificacion.emisor_id,
    contratado_id: userId,
  }])
  .select()
  .single();

if (errorNuevoChat || !nuevoChat) {
  Alert.alert('Error al crear el chat', errorNuevoChat?.message || 'Error desconocido');
  return;
}


// Mensaje automático importante
const mensajeImportante = `📢 **IMPORTANTE** 📢

Este chat ha sido creado exclusivamente para que puedas coordinar y acordar los detalles del servicio con el trabajador.

⚠️ **Soluciones Ya no se hace responsable** por la calidad del servicio ofrecido ni por cualquier eventualidad durante su ejecución.

⭐ **Al finalizar el servicio, desde este chat podrás dejar tu calificación y opinión sobre el trabajador para ayudar a otros usuarios.**

────────────────────────────`;

// Mensaje automático de comprobante
const mensajeTicket = `🎫 Se ha concretado una propuesta de trabajo. Este chat funcionará como comprobante. Puedes coordinar los detalles del servicio aquí.`;

// Insertar ambos mensajes automáticos
const { error: errorMensajes } = await supabase
  .from('mensajes')
  .insert([
    {
      chat_id: nuevoChat.id,
      emisor_id: userId,
      contenido: mensajeImportante,
      fecha_creacion: new Date().toISOString(),
    },
    {
      chat_id: nuevoChat.id,
      emisor_id: userId,
      contenido: mensajeTicket,
      fecha_creacion: new Date().toISOString(),
    }
  ]);

if (errorMensajes) {
  console.error('Error al enviar mensajes automáticos:', errorMensajes.message);
}

// Redirigir al chat recién creado
navigation.navigate('ChatIndividual', {
  chatId: nuevoChat.id,
  otroUsuarioId: notificacion.emisor_id,
});

  };
  const rechazarNotificacion = async (id) => {
  const { error } = await supabase
    .from('notificaciones')
    .update({ estado: 'rechazado' })
    .eq('id', id);

  if (!error) {
    await eliminarNotificacion(id);
    Alert.alert('❌ Solicitud rechazada', 'Has rechazado la solicitud.');
  } else {
    Alert.alert('Error', 'No se pudo rechazar la solicitud.');
  }
};


  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.item, !item.leido && styles.noLeido]}>
      {item.foto_perfil && (
        <Image source={{ uri: item.foto_perfil }} style={styles.fotoPerfil} />
      )}
      <Text style={styles.mensaje}>{item.mensaje}</Text>
      <Text style={styles.fecha}>
        {new Date(item.created_at).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </Text>
      <View style={styles.botones}>
        {!item.leido ? (
          <>
            <TouchableOpacity 
              style={[styles.boton, styles.botonAceptar]}
              onPress={() => aceptarNotificacion(item)}
            >
              <Text style={styles.botonTexto}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boton, styles.botonRechazar]}
              onPress={() => rechazarNotificacion(item.id)}
            >
              <Text style={styles.botonTexto}>Rechazar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.boton, styles.botonEliminar]}
            onPress={() => eliminarNotificacion(item.id)}
          >
            <Text style={styles.botonTexto}>Eliminar</Text>
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
  Estado: {item.estado || 'pendiente'}
</Text>

      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Notificaciones</Text>
      {notificaciones.length === 0 ? (
        <Text style={styles.sinNotificaciones}>No tienes notificaciones aún.</Text>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
      {notificaciones.length > 0 && (
        <TouchableOpacity
          style={styles.eliminarTodoBoton}
          onPress={eliminarTodasNotificaciones}
        >
          <Text style={styles.botonTexto}>Eliminar todas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E8FAF7', // turquesa claro
  },
  titulo: {
    fontSize: 25,
    fontWeight: '900',
    marginVertical: 14,
    textAlign: 'center',
    color: '#19D4C6',
    letterSpacing: 1,
  },
  item: {
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 15,
    borderRadius: 22,
    elevation: 5,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  noLeido: {
    borderLeftWidth: 5,
    borderLeftColor: '#FFA13C', // naranja
    backgroundColor: '#FEF8F5',
  },
  mensaje: {
    fontSize: 16,
    marginBottom: 7,
    fontWeight: '600',
    color: '#222',
    paddingRight: 55, // para la foto de perfil
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    paddingRight: 55,
  },
  botones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
    gap: 7,
  },
  boton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 18,
    marginRight: 8,
    marginTop: 3,
    fontWeight: '700',
    elevation: 2,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  botonAceptar: {
    backgroundColor: '#19D4C6',
  },
  botonRechazar: {
    backgroundColor: '#FFA13C',
  },
  botonEliminar: {
    backgroundColor: '#e04d4d',
  },
  eliminarTodoBoton: {
    backgroundColor: '#e04d4d',
    padding: 13,
    borderRadius: 20,
    marginTop: 22,
    alignItems: 'center',
    elevation: 3,
  },
  sinNotificaciones: {
    textAlign: 'center',
    fontSize: 17,
    color: '#888',
    marginTop: 55,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fotoPerfil: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'absolute',
    top: 17,
    right: 18,
    borderWidth: 2,
    borderColor: '#19D4C6',
    backgroundColor: '#E8FAF7',
  },
});