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
    backgroundColor: '#fcfcfc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fa4',
  },
  botonCalificar: {
    backgroundColor: '#fa4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  textoBotonCalificar: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  mensajeContainer: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 6,
  },
  mensajeDerecha: {
    alignSelf: 'flex-end',
    backgroundColor: '#4e73df',
  },
  mensajeIzquierda: {
    alignSelf: 'flex-start',
    backgroundColor: '#323232',
  },
  textoMensaje: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopColor: '#eee',
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  botonEnviar: {
    marginLeft: 10,
    backgroundColor: '#4e73df',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#070',
  },
  estrellasContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  botonModal: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 6,
  },
  botonDenunciar: {
    backgroundColor: '#dd5555',
  },
  botonEnviarCalificacion: {
    backgroundColor: '#4e73df',
  },
  textoBotonModal: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  botonCerrarModal: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
