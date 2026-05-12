// PasarelaPagoWorker.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Linking,
  Modal,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/context/AppContext';

export default function PasarelaPagoWorker() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { notificacion } = params;
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [trabajadorId, setTrabajadorId] = useState<string | null>(null);

  const { loadUnreadMessages, loadNotifications } = useContext(AuthContext);

  const obtenerUsuarioActual = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user.id;
  };

  useEffect(() => {
    const crearPreferencia = async () => {
      const id = await obtenerUsuarioActual();
      if (!id) return;

      setTrabajadorId(id);

      try {
        const response = await fetch('https://backend-pagos.onrender.com/crear-pago-registro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json', // 👈 agregar esto
  },
  body: JSON.stringify({
    descripcion: 'Pago para aceptar trabajo',
    monto: 1000,
    email: 'trabajador@example.com',
  }),
});

const data = await response.json();

if (response.ok && data?.url) {
  await Linking.openURL(data.url);
  setMostrarModal(true);
} else {
  console.error('Error en respuesta:', data);
  alert('No se pudo generar el pago');
  navigation.goBack();
}

      } catch (error) {
        console.error(error);
        alert('Ocurrió un error al procesar el pago');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    crearPreferencia();
  }, []);

  const manejarPagoExitoso = async () => {
    if (!trabajadorId) return;

    await supabase
      .from('notificaciones')
      .update({ estado: 'aceptado', leido: true })
      .eq('id', notificacion.id);

    loadNotifications();

    // chats.participant_a < participant_b (CHECK constraint)
    const [participantA, participantB] = [trabajadorId, notificacion.emisor_id].slice().sort();

    const { data: chatExistente } = await supabase
      .from('chats')
      .select('id')
      .eq('participant_a', participantA)
      .eq('participant_b', participantB)
      .maybeSingle();

    let chatId;
    if (chatExistente) {
      chatId = chatExistente.id;
    } else {
      const { data: nuevoChat } = await supabase
        .from('chats')
        .insert({ participant_a: participantA, participant_b: participantB })
        .select('id')
        .single();

      chatId = nuevoChat.id;

      await supabase.from('mensajes').insert([
        {
          chat_id: chatId,
          remitente_id: trabajadorId,
          contenido: `📢 **IMPORTANTE** 📢\n\nEste chat ha sido creado exclusivamente para coordinar los detalles del servicio.\n\n⚠️ SolucionesYa no se hace responsable por la ejecución del servicio.\n⭐ Al finalizar, deja tu calificación.`,
        },
        {
          chat_id: chatId,
          remitente_id: trabajadorId,
          contenido: `🎫 Se ha concretado una propuesta de trabajo. Este chat funcionará como comprobante.`,
        },
      ]);
    }

    loadUnreadMessages();

    navigation.replace('ChatIndividual', {
      chatId,
      usuarioId1: participantA,
      usuarioId2: participantB,
    });
  };

  const cancelarPago = () => {
    setMostrarModal(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Modal transparent visible={mostrarModal} animationType="fade">
      <View style={styles.modalFondo}>
        <View style={styles.modalContenido}>
          <Text style={styles.titulo}>¿Completaste el pago?</Text>
          <Text style={{ textAlign: 'center', marginBottom: 24 }}>
            Una vez realizado, confirmá para continuar.
          </Text>
          <Pressable style={styles.boton} onPress={manejarPagoExitoso}>
            <Text style={styles.textoBoton}>Sí, pagué</Text>
          </Pressable>
          <Pressable style={styles.boton} onPress={cancelarPago}>
            <Text style={styles.textoBoton}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    elevation: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  boton: {
    backgroundColor: '#FFA13C',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 24,
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#FFA13C',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
