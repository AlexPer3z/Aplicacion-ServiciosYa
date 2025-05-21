import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function PerfilDetalle({ route }) {
  const { perfil } = route.params;
  const navigation = useNavigation();

  const verificarPerfil = async () => {
    const { error } = await supabase
      .from('usuarios')
      .update({ dni_verificado: true })
      .eq('id', perfil.id);

    if (!error) {
      Alert.alert('Éxito', 'Perfil verificado');
      navigation.goBack();
    }
  };

  const rechazarPerfil = async () => {
    const { error } = await supabase
      .from('usuarios')
      .update({ perfil_completo: false })
      .eq('id', perfil.id);

    if (!error) {
      Alert.alert('Perfil rechazado');
      navigation.goBack();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.titulo}>{perfil.nombre} {perfil.apellido}</Text>
      <Text style={styles.subtitulo}>Email: {perfil.email}</Text>
      <Text style={styles.subtitulo}>DNI: {perfil.dni ? perfil.dni : 'No disponible'}</Text>

      <Text style={styles.subtitulo}>DNI Frente</Text>
      {perfil.dni_frente ? (
        <Image source={{ uri: perfil.dni_frente }} style={styles.dniImg} />
      ) : (
        <Text style={styles.errorTexto}>DNI frente no disponible</Text>
      )}

      <Text style={styles.subtitulo}>DNI Dorso</Text>
      {perfil.dni_dorso ? (
        <Image source={{ uri: perfil.dni_dorso }} style={styles.dniImg} />
      ) : (
        <Text style={styles.errorTexto}>DNI dorso no disponible</Text>
      )}

      <View style={styles.acciones}>
        <TouchableOpacity onPress={verificarPerfil} style={styles.btnAceptar}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.txtBtn}>Verificar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={rechazarPerfil} style={styles.btnRechazar}>
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.txtBtn}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#f9f9f9'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginTop: 20
  },
  dniImg: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginVertical: 10
  },
  errorTexto: {
    color: '#dc3545',
    fontSize: 14,
    fontStyle: 'italic'
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 50,
  },
  btnAceptar: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRechazar: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txtBtn: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
