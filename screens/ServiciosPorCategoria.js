import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import NavInferior from '../components/NavInferior';
import { useUserData } from '../lib/hooks/useUserData';


const screenHeight = Dimensions.get('window').height;

export default function ServiciosPorCategoria() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoria } = route.params;
  const [servicios, setServicios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);

  useEffect(() => {
    const fetchServicios = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('categoria', categoria);

      if (error) {
        console.error('Error al obtener servicios:', error.message);
        Alert.alert('Error', 'No se pudieron cargar los servicios.');
      } else {
        setServicios(data);
      }
    };

    fetchServicios();
  }, [categoria]);

  const abrirModal = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setServicioSeleccionado(null);
  };

  const contratarServicio = async () => {
    cerrarModal();
    setConfirmacionVisible(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario actual');
      }

      const compradorId = user.id;
      const createdAt = new Date().toISOString();
      const mensaje = `Un usuario ha solicitado tu servicio: ${servicioSeleccionado.titulo}`;

      await supabase.from('servicios_contratados').insert([
        {
          servicio_id: servicioSeleccionado.id,
          contratante_id: compradorId,
          contratado_id: servicioSeleccionado.user_id,
        },
      ]);

      await supabase.from('notificaciones').insert([
        {
          receptor_id: servicioSeleccionado.user_id,
          emisor_id: compradorId,
          mensaje,
          created_at: createdAt,
        },
      ]);

      const { data: receptorUsuario } = await supabase
        .from('usuarios')
        .select('expo_token')
        .eq('id', servicioSeleccionado.user_id)
        .single();

      if (receptorUsuario?.expo_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: receptorUsuario.expo_token,
            sound: 'default',
            title: '¡Nueva solicitud!',
            body: mensaje,
          }),
        });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Servicios de {categoria}</Text>

        <TouchableOpacity
          style={styles.botonMapa}
          onPress={() =>
            navigation.navigate('Maps', {
              categoria,
              servicios,
            })
          }
        >
          <Text style={styles.botonMapaTexto}>Ver en Mapa 🗺️</Text>
        </TouchableOpacity>

        {servicios.length === 0 ? (
          <Text style={styles.noServicios}>
            No hay servicios disponibles en esta categoría.
          </Text>
        ) : (
          servicios.map((servicio) => (
            <TouchableOpacity
              key={servicio.id}
              style={styles.servicioCard}
              onPress={() => {
                if (servicio.estado !== 'pausado') {
                  abrirModal(servicio);
                } else {
                  Alert.alert(
                    'Este servicio está pausado',
                    'No se puede contratar este servicio por el momento.'
                  );
                }
              }}
            >
              <Text style={styles.servicioTitle}>{servicio.titulo}</Text>
              <Text style={styles.servicioText}>Precio: {servicio.precio}</Text>
              <Text style={styles.servicioText}>Horario: {servicio.horario}</Text>

              {servicio.estado === 'pausado' && (
                <View style={styles.pausadoOverlay}>
                  <Text style={styles.pausadoText}>
                    Anuncio pausado temporalmente por el dueño
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* MODAL DETALLE DEL SERVICIO */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalFondo}>
            <View style={styles.modalContenido}>
              {servicioSeleccionado && (
                <>
                  <Text style={styles.modalTitulo}>{servicioSeleccionado.titulo}</Text>
                  <Text style={styles.modalTexto}>Precio: {servicioSeleccionado.precio}</Text>
                  <Text style={styles.modalTexto}>Horario: {servicioSeleccionado.horario}</Text>
                  <Text style={styles.modalTexto}>Descripción: {servicioSeleccionado.descripcion}</Text>

                  <TouchableOpacity style={styles.botonContratar} onPress={contratarServicio}>
                    <Text style={styles.botonTexto}>Contratar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={cerrarModal}>
                    <Text style={styles.cancelar}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* MODAL DE CONFIRMACIÓN */}
        <Modal
          visible={confirmacionVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setConfirmacionVisible(false)}
        >
          <View style={styles.modalFondo}>
            <View style={styles.modalConfirmacion}>
              <Text style={styles.mensajeConfirmacion}>
                ✅ La propuesta fue enviada al trabajador. Ahora debes esperar que acepte la solicitud.
              </Text>
              <TouchableOpacity
                style={styles.botonVolver}
                onPress={() => {
                  setConfirmacionVisible(false);
                  navigation.navigate('Home');
                }}
              >
                <Text style={styles.botonTexto}>Volver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* NAV INFERIOR */}
      <NavInferior />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F8F8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#00B8A9',
  },
  noServicios: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 30,
  },
  servicioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    position: 'relative',
  },
  servicioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  servicioText: {
    fontSize: 14,
    color: '#555',
  },
  pausadoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 144, 56, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 1,
  },
  pausadoText: {
    fontWeight: '900',
    textAlign: 'center',
    color: '#fff',
    textShadowColor: '#000',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: screenHeight * 0.8,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  modalTexto: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  botonContratar: {
    marginTop: 20,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelar: {
    marginTop: 15,
    textAlign: 'center',
    color: '#888',
  },
  modalConfirmacion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
  },
  mensajeConfirmacion: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  botonMapa: {
    backgroundColor: '#17a2b8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  botonMapaTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
