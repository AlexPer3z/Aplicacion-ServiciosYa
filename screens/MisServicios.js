import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import BotonVolver from '../components/BotonVolver';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function MisServicios() {
  const [serviciosPublicados, setServiciosPublicados] = useState([]);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      obtenerServicios();
    }, [])
  );

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
      .from('servicios_with_coords')
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
        <TouchableOpacity 
          onPress={() => editarServicio(item)}
          style={[styles.buttonContainer, styles.editButton]}
        > 
           <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text>{item.descripcion}</Text>
      <Text style={styles.estado}>
        Estado: {item.estado ? item.estado.replace(/'/g, '') : ''}
      </Text>
      <Text>Veces contratado: {item.veces_contratado || 0}</Text>
      <View style={styles.estrellas}>
        {renderEstrellas(item.calificacion_promedio || 0)}
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity 
            onPress={() => pausarServicio(item.id, item.estado)}
            style={styles.buttonContainer}
          >
            <View style={styles.button}>
              <Icon 
                name={item.estado === 'pausado' ? 'play' : 'pause'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.buttonText}>
                {item.estado === 'pausado' ? ' Reanudar' : ' Pausar'}
              </Text>
            </View>
          </TouchableOpacity>

        
          <TouchableOpacity 
            onPress={() => eliminarServicio(item.id)}
            style={styles.buttonContainer}
          >
            <View style={[styles.button, { backgroundColor: '#ff4444' }]}>
              <Icon name="trash" size={16} color="#fff" />
              <Text style={styles.buttonText}> Eliminar</Text>
            </View>
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <BotonVolver />
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
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10, paddingTop:80 },
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
    marginTop: 25,
  },
  boton: { color: '#007BFF' },
  separador: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  buttonContainer: {
    marginHorizontal: 5, // Espacio entre botones
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff', // Azul para el botón de pausa/reanudar
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  editButton: {
    backgroundColor: '#19D4C6',  
    width: 40,  
    height: 40,
    borderRadius: 20,  
    justifyContent: 'center',  
    alignItems: 'center',  
    elevation: 2, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
