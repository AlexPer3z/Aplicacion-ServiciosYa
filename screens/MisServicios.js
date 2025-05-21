import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function MisServicios() {
  const [serviciosPublicados, setServiciosPublicados] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    obtenerServicios();
  }, []);

  const obtenerServicios = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    // Obtener servicios publicados por el usuario
    const { data: publicados, error: errorPublicados } = await supabase
      .from('servicios')
      .select('*')
      .eq('user_id', user.id);

    if (errorPublicados) {
      console.error(errorPublicados);
    } else {
      setServiciosPublicados(publicados);
    }
  };

  const eliminarServicio = async (id) => {
    await supabase.from('servicios').delete().eq('id', id);
    obtenerServicios();
  };

  const pausarServicio = async (id, estadoActual) => {
    await supabase
      .from('servicios')
      .update({ estado: estadoActual === 'pausado' ? 'activo' : 'pausado' })
      .eq('id', id);
    obtenerServicios();
  };

  const editarServicio = (servicio) => {
    navigation.navigate('EditarServicio', { servicio });
  };

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(
        <Ionicons
          key={i}
          name={i <= calificacion ? 'star' : 'star-outline'}
          size={16}
          color="#f1c40f"
        />
      );
    }
    return estrellas;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <TouchableOpacity onPress={() => editarServicio(item)}>
          <Ionicons name="create-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>
      <Text>{item.descripcion}</Text>
      <Text style={styles.estado}>Estado: {item.estado}</Text>
      <Text>Veces contratado: {item.veces_contratado || 0}</Text>
      <View style={styles.estrellas}>
        {renderEstrellas(item.calificacion_promedio || 0)}
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity onPress={() => pausarServicio(item.id, item.estado)}>
          <Text style={styles.boton}>
            {item.estado === 'pausado' ? 'Reanudar' : 'Pausar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => eliminarServicio(item.id)}>
          <Text style={[styles.boton, { color: 'red' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.separador}>Mis Ofertas de Servicios</Text>
      <FlatList
        data={serviciosPublicados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No has publicado ofertas aún.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  titulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  estado: { marginTop: 5, color: '#666' },
  estrellas: { flexDirection: 'row', marginTop: 5 },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  boton: { color: '#007BFF' },
  separador: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
});
