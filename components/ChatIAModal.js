// components/ChatIAModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { consultarIA } from '../lib/huggingface';

export default function ChatIAModal({ visible, onClose }) {
  const [mensaje, setMensaje] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviarPregunta = async () => {
    setCargando(true);
    const res = await consultarIA(mensaje);
    setRespuesta(res);
    setCargando(false);
  };
console.log("visible:", visible); // ✅ Esta sí está disponible


  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose} style={styles.cerrar}>
            <Text style={styles.cerrarTexto}>✖</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>🤖 Chat de Ayuda</Text>

          <TextInput
            style={styles.input}
            placeholder="Escribe tu pregunta..."
            value={mensaje}
            onChangeText={setMensaje}
          />

          <TouchableOpacity
            style={styles.boton}
            onPress={enviarPregunta}
            disabled={cargando}
          >
            <Text style={styles.botonTexto}>
              {cargando ? 'Consultando...' : 'Enviar'}
            </Text>
          </TouchableOpacity>

          {respuesta ? (
            <ScrollView style={styles.respuestaBox}>
              <Text style={styles.respuestaTexto}>{respuesta}</Text>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  cerrar: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  cerrarTexto: {
    fontSize: 20,
    color: '#555',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  boton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
  },
  botonTexto: {
    color: '#fff',
    textAlign: 'center',
  },
  respuestaBox: {
    marginTop: 20,
  },
  respuestaTexto: {
    fontSize: 16,
    color: '#333',
  },
});
