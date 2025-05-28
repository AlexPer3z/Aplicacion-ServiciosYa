import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../lib/supabase';

export default function HabilitarHuella({ navigation, route }) {
  const { userId } = route.params;

  const manejarHabilitacion = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica.');
      navigation.replace('Home');
      return;
    }

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Habilitar inicio con huella',
    });

    if (resultado.success) {
      await supabase
        .from('usuarios')
        .update({ huella_digital: true })
        .eq('id', userId);

      Alert.alert('Listo', 'La autenticación biométrica ha sido habilitada.');
    }

    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>¿Querés habilitar el inicio con huella digital?</Text>
      <TouchableOpacity style={styles.boton} onPress={manejarHabilitacion}>
        <Text style={styles.textoBoton}>Sí, habilitar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.boton, styles.botonNo]} onPress={() => navigation.replace('Home')}>
        <Text style={styles.textoBoton}>No, gracias</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  titulo: { fontSize: 20, textAlign: 'center', marginBottom: 30 },
  boton: {
    backgroundColor: '#4B9CD3',
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: 'center',
  },
  botonNo: {
    backgroundColor: '#ccc',
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
