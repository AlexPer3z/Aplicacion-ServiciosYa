import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function PerfilDetalle({ route }) {
  const { perfil } = route.params;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [imgAmpliada, setImgAmpliada] = useState(null);

  const verificarPerfil = async () => {
    const { error } = await supabase
      .from('usuarios')
      .update({ dni_verificado: true })
      .eq('id', perfil.id);

    if (!error) {
      Alert.alert('¡Éxito!', 'Perfil verificado correctamente');
      navigation.goBack();
    }
  };

  const rechazarPerfil = async () => {
    Alert.alert(
      'Rechazar perfil',
      '¿Seguro que querés rechazar este perfil? Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('usuarios')
              .update({ perfil_completo: false })
              .eq('id', perfil.id);

            if (!error) {
              Alert.alert('Perfil rechazado');
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const handleAmpliarImagen = (uri) => {
    setImgAmpliada(uri);
    setModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.titulo}>
          {perfil.nombre} {perfil.apellido}
        </Text>
        <Text style={styles.email}>{perfil.email}</Text>
        <View style={styles.divisor} />
        <Text style={styles.label}>DNI:</Text>
        <Text style={styles.valorDNI}>{perfil.dni || 'No disponible'}</Text>

        <Text style={styles.label}>DNI Frente</Text>
        <TouchableOpacity
          onPress={() => perfil.dni_frente && handleAmpliarImagen(perfil.dni_frente)}
          activeOpacity={perfil.dni_frente ? 0.7 : 1}
        >
          {perfil.dni_frente ? (
            <Image source={{ uri: perfil.dni_frente }} style={styles.dniImg} />
          ) : (
            <Text style={styles.errorTexto}>DNI frente no disponible</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>DNI Dorso</Text>
        <TouchableOpacity
          onPress={() => perfil.dni_dorso && handleAmpliarImagen(perfil.dni_dorso)}
          activeOpacity={perfil.dni_dorso ? 0.7 : 1}
        >
          {perfil.dni_dorso ? (
            <Image source={{ uri: perfil.dni_dorso }} style={styles.dniImg} />
          ) : (
            <Text style={styles.errorTexto}>DNI dorso no disponible</Text>
          )}
        </TouchableOpacity>

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
      </View>

      {/* Modal imagen ampliada */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <Image source={{ uri: imgAmpliada }} style={styles.imgGrande} />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cerrarModal}>
            <Text style={{ color:'#fff', fontSize:17, fontWeight:'bold'}}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 18,
    backgroundColor: '#f0fdfc'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginBottom: 30,
    marginTop: 8,
    alignItems: 'center'
  },
  titulo: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: .2
  },
  email: {
    fontSize: 15,
    color: '#7b8ca0',
    marginBottom: 10,
    fontWeight: '600',
    textAlign: 'center'
  },
  divisor: {
    borderBottomColor: '#f5b889',
    borderBottomWidth: 2,
    width: '45%',
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 5
  },
  label: {
    color: '#00B8A9',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 13,
    textAlign: 'center'
  },
  valorDNI: {
    color: '#FF6B35',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center'
  },
  dniImg: {
    width: 230,
    height: 140,
    borderRadius: 15,
    marginVertical: 8,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFA987',
    backgroundColor: '#f8fafc'
  },
  errorTexto: {
    color: '#dc3545',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    width: '100%',
    gap: 14
  },
  btnAceptar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19D4C6',
    borderRadius: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    elevation: 2,
    marginRight: 8
  },
  btnRechazar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    elevation: 2,
    marginLeft: 8
  },
  txtBtn: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.91)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  imgGrande: {
    width: '92%',
    height: '72%',
    resizeMode: 'contain',
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 3,
    borderColor: '#19D4C6'
  },
  cerrarModal: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 34,
    alignItems: 'center'
  }
});