import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function ChatIndividual({ route, navigation }) {
  const { chatId, nombre, servicioId } = route.params;
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuarioId, setUsuarioId] = useState(null);
  const flatListRef = useRef(null);
  const intervalRef = useRef(null);

  // Estado para el modal y calificación
  const [modalVisible, setModalVisible] = useState(false);
  const [estrellas, setEstrellas] = useState(0);

  useEffect(() => {
    obtenerUsuarioYMensajes();

    intervalRef.current = setInterval(() => {
      cargarMensajes();
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatId]);

  const obtenerUsuarioYMensajes = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('No se pudo obtener el usuario:', error);
        return;
      }
      setUsuarioId(user.id);
      cargarMensajes();
    } catch (error) {
      console.error('Error en obtenerUsuarioYMensajes:', error);
    }
  };

  const cargarMensajes = async () => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('chat_id', chatId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('Error al cargar mensajes:', error.message);
      return;
    }

    setMensajes(data);

    // Marcar como leídos los mensajes que no son míos (yo soy el receptor)
    const mensajesNoLeidos = data.filter(
      (msg) => msg.remitente_id !== usuarioId && !msg.leido_por_receptor
    );

    if (mensajesNoLeidos.length > 0) {
      const ids = mensajesNoLeidos.map((msg) => msg.id);
      await supabase
        .from('mensajes')
        .update({ leido_por_receptor: true })
        .in('id', ids);
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  } catch (error) {
    console.error('Error en cargarMensajes:', error);
  }
};



  const enviarMensaje = async () => {
  if (!nuevoMensaje.trim()) return;

  try {
    const { error } = await supabase.from('mensajes').insert({
      chat_id: chatId,
      remitente_id: usuarioId,
      contenido: nuevoMensaje.trim(),
      leido_por_emisor: true, // Emisor ya lo leyó
    });

    if (error) {
      console.error('Error al enviar mensaje:', error.message);
    } else {
      setNuevoMensaje('');
      cargarMensajes();
    }
  } catch (error) {
    console.error('Error en enviarMensaje:', error);
  }
};


  const manejarCalificarServicio = () => {
    setModalVisible(true);
  };

  const manejarDenunciar = () => {
    Alert.alert(
      'Denunciar servicio',
      '¿Estás seguro que quieres denunciar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: () => {
            setModalVisible(false);
            Alert.alert('Servicio denunciado', 'Gracias por tu reporte.');
            // TODO: lógica para marcar el servicio denunciado
          },
        },
      ]
    );
  };

  const actualizarCalificacionYEliminarChat = async () => {
    Alert.alert("Calificacion enviada")
  }

  const renderItem = ({ item }) => {
    const esMio = item.remitente_id === usuarioId;
    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeDerecha : styles.mensajeIzquierda,
        ]}
      >
        <Text style={styles.textoMensaje}>{item.contenido}</Text>
      </View>
    );
  };

  const renderEstrellas = () => {
    let estrellasArray = [];
    for (let i = 1; i <= 5; i++) {
      estrellasArray.push(
        <TouchableOpacity key={i} onPress={() => setEstrellas(i)} activeOpacity={0.7}>
          <Ionicons
            name={i <= estrellas ? 'star' : 'star-outline'}
            size={32}
            color="#f5c518"
            style={{ marginHorizontal: 5 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.estrellasContainer}>{estrellasArray}</View>;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.titulo}>{nombre} - Contratante</Text>
        <TouchableOpacity
          style={styles.botonCalificar}
          onPress={manejarCalificarServicio}
          activeOpacity={0.7}
        >
          <Text style={styles.textoBotonCalificar}>Calificar servicio</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={nuevoMensaje}
          onChangeText={setNuevoMensaje}
          placeholder="Escribe un mensaje..."
          multiline={true}
        />
        <TouchableOpacity onPress={enviarMensaje} style={styles.botonEnviar} activeOpacity={0.7}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de calificación */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Califica el servicio</Text>

            {renderEstrellas()}

            <TouchableOpacity
              style={[styles.botonModal, styles.botonDenunciar]}
              onPress={manejarDenunciar}
            >
              <Text style={styles.textoBotonModal}>Denunciar servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonModal, styles.botonEnviarCalificacion]}
              onPress={actualizarCalificacionYEliminarChat}
            >
              <Text style={styles.textoBotonModal}>Enviar calificación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCerrarModal}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FAF7', // Turquesa clarito
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19D4C6', // Turquesa fuerte
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#19D4C6AA',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'left',
  },
  botonCalificar: {
    backgroundColor: '#FFA13C',
    padding: 9,
    borderRadius: 22,
    marginLeft: 10,
    elevation: 2,
  },
  // Burbujas de chat
  mensajeContainer: {
    maxWidth: '78%',
    padding: 13,
    borderRadius: 22,
    marginVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  mensajeDerecha: {
    alignSelf: 'flex-end',
    backgroundColor: '#19D4C6',
  },
  mensajeIzquierda: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFA13C',
  },
  textoMensaje: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopColor: '#d0ece9',
    borderTopWidth: 1,
    backgroundColor: '#E8FAF7',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#222',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#B6E1EA',
  },
  botonEnviar: {
    backgroundColor: '#FFA13C',
    borderRadius: 18,
    padding: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA13C77',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  // MODAL
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(34, 34, 34, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 26,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#19D4C6',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 18,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#19D4C6',
    textAlign: 'center',
  },
  estrellasContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  botonModal: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 28,
    alignItems: 'center',
    marginVertical: 6,
  },
  botonDenunciar: {
    backgroundColor: '#E45757',
  },
  botonEnviarCalificacion: {
    backgroundColor: '#19D4C6',
  },
  textoBotonModal: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  botonCerrarModal: {
    position: 'absolute',
    top: 10,
    right: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 3,
  },
});