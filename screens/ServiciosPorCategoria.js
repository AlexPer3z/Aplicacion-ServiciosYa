import React, { useState, useEffect } from 'react';
import {
  Pressable,
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
import { Ionicons } from '@expo/vector-icons';
import ReportServiceModal from '../components/servicios/ReporteModal';

const screenHeight = Dimensions.get('window').height;

export default function ServiciosPorCategoria() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoria } = route.params;
  const [servicios, setServicios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

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

  // Necesitamos cerral el modal que esta abierto, para luego abrir el del reporte
  const handleReport = (servicio) => {
    cerrarModal();
    setServicioSeleccionado(servicio);
    setReportVisible(true);
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
                  <View style={styles.modalTituloContainer}>
                    <Text style={styles.modalTitulo}>
                      {servicioSeleccionado.titulo}
                    </Text>
                    <Pressable onPress={() => handleReport(servicioSeleccionado)}>
                      <Ionicons name="warning-outline" size={20} color="#FF0000" />
                    </Pressable>
                  </View>
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

      {/* MODAL DE REPORTE */}
      {servicioSeleccionado && (
        <ReportServiceModal
          visible={reportVisible}
          servicio={servicioSeleccionado}
          onClose={() => setReportVisible(false)}
          currentUserId={0} />)}

      {/* NAV INFERIOR */}
      <NavInferior />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#F8F8F8',
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    color: '#19D4C6',
    letterSpacing: .5,
  },
  noServicios: {
    fontSize: 17,
    color: '#FF6B35',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },
  servicioCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    position: 'relative',
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F6F6',
  },
  servicioTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#333',
    marginBottom: 2,
  },
  servicioText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 2,
  },
  pausadoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,107,53,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    zIndex: 1,
  },
  pausadoText: {
    fontWeight: '900',
    textAlign: 'center',
    color: '#fff',
    textShadowColor: '#000',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.2,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#19D4C6',
  },
  modalTexto: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    lineHeight: 21,
  },
  botonContratar: {
    marginTop: 22,
    backgroundColor: '#19D4C6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: .3,
  },
  cancelar: {
    marginTop: 15,
    textAlign: 'center',
    color: '#888',
    fontWeight: '600',
  },
  modalConfirmacion: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.15,
  },
  mensajeConfirmacion: {
    fontSize: 17,
    color: '#19D4C6',
    textAlign: 'center',
    marginBottom: 22,
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#FF6B35',
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.15,
    marginTop: 6,
  },
  botonMapa: {
    backgroundColor: '#19D4C6',
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 23,
    alignSelf: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  botonMapaTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: .1,
  },
});