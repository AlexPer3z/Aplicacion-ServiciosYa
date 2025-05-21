import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilesPendientes() {
  const navigation = useNavigation();
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerPerfilesPendientes();
  }, []);

  const obtenerPerfilesPendientes = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, dni, foto_perfil, dni_frente, dni_dorso')  // Asegúrate de que los nombres de las columnas sean correctos
      .filter('dni_verificado', 'is', false)
      .filter('perfil_completo', 'is', true);

    if (error) {
      console.error('Error al traer perfiles:', error);
    } else {
      console.log('Data recibida:', data);
      if (!data || data.length === 0) {
        console.log('No hay perfiles que cumplan los filtros.');
      }
    }

    setPerfiles(data || []);
    setCargando(false);
  };

  const verificarPerfil = async (usuarioId) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ dni_verificado: true })
      .eq('id', usuarioId);

    if (!error) {
      setPerfiles((prev) => prev.filter((u) => u.id !== usuarioId));
      Alert.alert('Perfil verificado');
    }
  };

  const rechazarPerfil = async (usuarioId) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ perfil_completo: false })
      .eq('id', usuarioId);

    if (!error) {
      setPerfiles((prev) => prev.filter((u) => u.id !== usuarioId));
      Alert.alert('Perfil rechazado');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.perfilCard}>
      <View style={styles.headerCard}>
        <Image source={{ uri: item.foto_perfil }} style={styles.avatar} />
        <View>
          <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>DNI (frente y dorso)</Text>
      <View style={styles.dniContainer}>
        {item.dni_frente ? (
          <Image
            source={{ uri: item.dni_frente }}  
            style={styles.dniImg}
          />
        ) : (
          <Text style={styles.errorTexto}>DNI frente no disponible</Text>
        )}

        {item.dni_dorso ? (
          <Image
            source={{ uri: item.dni_dorso }}   
            style={styles.dniImg}
          />
        ) : (
          <Text style={styles.errorTexto}>DNI dorso no disponible</Text>
        )}
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity onPress={() => verificarPerfil(item.id)} style={styles.btnAceptar}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.txtBtn}>Verificar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => rechazarPerfil(item.id)} style={styles.btnRechazar}>
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.txtBtn}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.navigate('PerfilPendienteDetalle', { perfil: item })} 
          style={styles.btnVerDetalles}
        >
          <Text style={styles.txtBtn}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfiles Pendientes de Verificación</Text>
      {cargando ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 30 }} />
      ) : perfiles.length === 0 ? (
        <Text style={styles.sinPerfiles}>No hay perfiles pendientes para revisar.</Text>
      ) : (
        <FlatList
          data={perfiles}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 15 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  sinPerfiles: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  },
  perfilCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  nombre: { fontSize: 16, fontWeight: '600', color: '#333' },
  email: { fontSize: 14, color: '#777' },
  subtitulo: { fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#444' },
  dniContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dniImg: { width: '48%', height: 150, borderRadius: 8 },
  errorTexto: { color: '#dc3545', fontSize: 14, fontStyle: 'italic' },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  btnAceptar: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRechazar: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txtBtn: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  btnVerDetalles: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
