import React, { useEffect, useState } from 'react';
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  RefreshControl,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect  } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ChatBotModal from '../components/ChatBotModal';



const iconosCategoria = {
  Electricista: require('../assets/icons/electricista.png'),
  Plomero: require('../assets/icons/plomero.png'),
  Pintor: require('../assets/icons/pintor.png'),
  Carpintero: require('../assets/icons/carpintero.png'),
  Cerrajero: require('../assets/icons/cerrajero.png'),
  Mecánico: require('../assets/icons/mecanico.png'),
  Jardinero: require('../assets/icons/jardinero.png'),
  Mudanzas: require('../assets/icons/mudanzas.png'),
  'Profesor particular': require('../assets/icons/profesor_particular.png'),
  'Diseñador gráfico': require('../assets/icons/disenador_grafico.png'),
  Programador: require('../assets/icons/programador.png'),
  Contador: require('../assets/icons/contador.png'),
  Fotógrafo: require('../assets/icons/fotografo.png'),
  Veterinario: require('../assets/icons/veterinario.png'),
  'Asistente virtual': require('../assets/icons/asistente_virtual.png'),
  Estilista: require('../assets/icons/estilista.png'),
  Tatuador: require('../assets/icons/tatuador.png'),
  Marketing: require('../assets/icons/marketing.png'),
  Traductor: require('../assets/icons/traductor.png'),
  'Cuidado de niños': require('../assets/icons/cuidado_ninos.png'),
  'Cuidado de adultos mayores': require('../assets/icons/cuidado_adultos_mayores.png'),
  'Entrenador personal': require('../assets/icons/entrenador_personal.png'),
  'Técnico de PC': require('../assets/icons/tecnico_pc.png'),
  'Desarrollador web': require('../assets/icons/desarrollador_web.png'),
  'Servicio de limpieza': require('../assets/icons/servicio_limpieza.png'),
  'Chofer privado': require('../assets/icons/chofer_privado.png'),
  'Decorador de interiores': require('../assets/icons/decorador_interiores.png'),
  'Chef personal': require('../assets/icons/chef_personal.png'),
  'Organizador de eventos': require('../assets/icons/organizador_eventos.png'),
  Masajista: require('../assets/icons/masajista.png'),
  Fletes: require('../assets/icons/fletes.png'),
  Albañil: require('../assets/icons/albanil.png'),
  'Reparaciones en el hogar': require('../assets/icons/reparaciones_hogar.png'),
  'Community Manager': require('../assets/icons/community_manager.png'),
  'Editor de video': require('../assets/icons/editor_video.png'),
  'Paseador de perros': require('../assets/icons/paseador_perros.png'),
  'Atención al cliente': require('../assets/icons/atencion_cliente.png'),
  'Reparación de celulares': require('../assets/icons/reparacion_celulares.png'),
  'Profesor de música': require('../assets/icons/profesor_musica.png'),
};



const categorias = Object.keys(iconosCategoria);
const categoriasPorSeccion = {
  Hogar: [
    'Electricista',
    'Plomero',
    'Pintor',
    'Carpintero',
    'Cerrajero',
    'Albañil',
    'Reparaciones en el hogar',
    'Decorador de interiores',
    'Servicio de limpieza',
  ],
  Tecnología: [
    'Programador',
    'Técnico de PC',
    'Desarrollador web',
    'Reparación de celulares',
    'Editor de video',
    'Community Manager',
  ],
  Transporte: [
    'Fletes',
    'Mudanzas',
    'Chofer privado',
  ],
  Educación: [
    'Profesor particular',
    'Traductor',
    'Profesor de música',
  ],
  Profesionales: [
    'Contador',
    'Diseñador gráfico',
    'Marketing',
    'Asistente virtual',
    'Atención al cliente',
  ],
  Mascotas: [
    'Paseador de perros',
    'Veterinario',
  ],
  Bienestar: [
    'Entrenador personal',
    'Masajista',
    'Estilista',
    'Tatuador',
    'Chef personal',
  ],
  Eventos: [
    'Organizador de eventos',
    'Fotógrafo',
  ],
  Cuidados: [
    'Cuidado de niños',
    'Cuidado de adultos mayores',
  ],
};
function CategoriaIcon({ categoria }) {
  const icono = iconosCategoria[categoria];
  
  if (!icono) {
    return <Text>Icono no disponible</Text>;
  }

  return (
    <Image
      source={icono}
      style={{ width: 40, height: 40, resizeMode: 'contain' }}
    />
  );
}



export default function Home() {
  const navigation = useNavigation();
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [mostrarCartelDNI, setMostrarCartelDNI] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState(categorias);
  const [rol, setRol] = useState(null);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [conteosPorCategoria, setConteosPorCategoria] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  


  useEffect(() => {
    let isMounted = true;

    cargarDatos();
    actualizarConteos();

    const canalServicios = supabase
      .channel('servicios-cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'servicios' },
        () => actualizarConteos()
      )
      .subscribe();

    const canalNotificaciones = supabase
      .channel('notificaciones-cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones' },
        () => cargarDatos()
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(canalServicios);
      supabase.removeChannel(canalNotificaciones);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Confirmación', '¿Deseas salir de la app?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );


  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('perfil_completo, dni_verificado, foto_perfil, rol')
      .eq('id', user.id)
      .single();

    if (perfil) {
      setPerfilCompleto(perfil.perfil_completo === true);
      setMostrarCartelDNI(perfil.perfil_completo && !perfil.dni_verificado);
      setFotoPerfil(perfil.foto_perfil || null);
      setRol(perfil.rol || null);
    }

    const { data: notifs } = await supabase
      .from('notificaciones')
      .select('mensaje, leido')
      .eq('receptor_id', user.id);

    setNotificaciones(notifs || []);
    const noLeidas = (notifs || []).filter(n => n.leido_por_receptor === false).length;
    setNotificacionesNoLeidas(noLeidas);
    // Obtener mensajes no leídos para mostrar contador
const { data: mensajes, error: errorMensajes } = await supabase
  .from('mensajes')
  .select('id')
  .eq('receptor_id', user.id)
  .eq('leido_por_receptor', false);

const mensajesNoLeidos = mensajes?.length || 0;
console.log('Mensajes no leídos:', mensajesNoLeidos);

  };

  const actualizarConteos = async () => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('categoria, estado');

    if (error) {
      console.error('Error al obtener servicios:', error);
      return;
    }

    const conteos = {};

    data.forEach(servicio => {
      const categoria = servicio.categoria;
      const estadoLimpio = servicio.estado?.replace(/['"]+/g, '').trim(); // elimina comillas

      if (estadoLimpio === 'activo' && categoria) {
        if (!conteos[categoria]) {
          conteos[categoria] = 1;
        } else {
          conteos[categoria]++;
        }
      }
    });

    setConteosPorCategoria(conteos);
  } catch (err) {
    console.error('Error en actualizarConteos:', err);
  }
};


  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    await actualizarConteos();
    setRefreshing(false);
  };

  const irACategoria = (categoria) => {
    navigation.navigate('PasarelaPago', { categoria });
  };
  useEffect(() => {
  console.log('Conteos actuales por categoría:', conteosPorCategoria);
}, [conteosPorCategoria]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.saludoContainer}>
            <Text style={styles.saludo}>¡Soluciones Ya!</Text>
            <Text style={styles.subtitulo}>¿Qué necesitás hoy?</Text>
          </View>
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificacionesScreen')}
              style={styles.iconButton}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {notificacionesNoLeidas > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificacionesNoLeidas}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => perfilCompleto && navigation.navigate('Perfil')}
              disabled={!perfilCompleto}
              style={styles.iconButton}
            >
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={36} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buscadorContainer}>
          <Ionicons name="search" size={22} color="#333" style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Buscar categoría..."
            placeholderTextColor="#333"
            style={styles.buscador}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
      </View>

      {!perfilCompleto && (
        <View style={styles.cartelPerfilIncompleto}>
          <View style={styles.cartelIconoTexto}>
            <Ionicons name="alert-circle-outline" size={28} color="#ff4d4d" style={{ marginRight: 10 }} />
            <Text style={styles.cartelTexto}>
              Aún no completaste tu perfil. Para usar todas las funciones, completalo ahora.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.botonCrearPerfil}
            onPress={() => navigation.navigate('CrearPerfil')}
          >
            <Text style={styles.botonTexto}>Completar perfil</Text>
          </TouchableOpacity>
        </View>
      )}

      {mostrarCartelDNI && (
        <View style={styles.cartelDNI}>
          <Ionicons name="document-text-outline" size={24} color="#333" style={{ marginRight: 8 }} />
          <Text style={styles.textoCartelDNI}>
            Verificación de D.N.I pendiente. Se te notificará cuando sea verificado. Máximo 24h hábiles.
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(categoriasPorSeccion).map(([seccion, cats]) => {
          const filtradas = cats.filter(cat =>
            cat.toLowerCase().includes(busqueda.toLowerCase())
          );

          if (filtradas.length === 0) return null;

          return (
            <View key={seccion} style={styles.seccionContainer}>
              <Text style={styles.seccionTitulo}>{seccion}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filtradas.map(categoria => (
                  <TouchableOpacity
                    key={categoria}
                    style={[styles.categoriaItem, (!perfilCompleto || mostrarCartelDNI) && { opacity: .5 }]}
                    onPress={() =>{ if (!perfilCompleto) {
              alert('Debes completar tu perfil antes de contratar a algun servicio.');
              return;
            }
            if (mostrarCartelDNI) {
              alert('Debes verificar tu DNI antes de contratar a algun servicio.');
              return;
            } irACategoria(categoria)}}
                  >
                    <View style={styles.iconoCategoria}>
                      <CategoriaIcon categoria={categoria} />
                    </View>
                    <Text style={styles.nombreCategoria}>{categoria}</Text>
                    {conteosPorCategoria[categoria] > 0 && (
  <Text style={styles.cantidadServicios}>
    {conteosPorCategoria[categoria] + ' ofertas'}
  </Text>
)}


                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (!perfilCompleto) {
              alert('Debes completar tu perfil antes de ofrecer un servicio.');
              return;
            }
            if (mostrarCartelDNI) {
              alert('Debes verificar tu DNI antes de ofrecer un servicio.');
              return;
            }
            navigation.navigate('OfrecerServicio');
          }}
          style={[styles.btnPublicar, (!perfilCompleto || mostrarCartelDNI) && { backgroundColor: '#ccc' }]}
        >
          <Ionicons name="add-circle-outline" size={36} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('MisServicios')}>
          <Ionicons name="list-outline" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ChatIA')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Configuracion')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>

        {(rol === 'admin' || rol === 'verificador') && (
          <TouchableOpacity onPress={() => navigation.navigate('PerfilesPendientes')}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      {/* --- BOTÓN FLOTANTE PARA ABRIR CHATBOT --- */}
      <TouchableOpacity
        onPress={() => setChatVisible(true)}
        style={styles.botonChatFlotante}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>

      {/* --- MODAL DEL CHATBOT --- */}
      <ChatBotModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
   
    
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },

  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 12,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
bienvenida: {
  fontSize: 20,
  fontWeight: '700',
  color: '#222',
  flex: 1,
},
topRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 15, // no funciona en React Native, reemplazar con margin
},
iconButton: {
  marginLeft: 15,
  position: 'relative',
},
badge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#ff3b30',
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
  shadowColor: '#ff3b30',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 3,
  elevation: 4,
},
badgeText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: '700',
  textAlign: 'center',
  lineHeight: 14,
},
avatar: {
  width: 38,
  height: 38,
  borderRadius: 19,
  borderWidth: 1,
  borderColor: '#ddd',
  backgroundColor: '#eee',
},


  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  buscador: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  categoriaItem: {
    width: '45%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 2,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  categoriaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginVertical: 10,
    color: '#FFA987',
  },

  scrollHorizontal: {
    paddingLeft: 10,
  },

  categoriaItemHorizontal: {
    width: 110,
    backgroundColor: '#f9f9f9',
    
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 15,
    elevation: 3,
    margin: 10,
    marginRight: 0,
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },

  btnPublicar: {
    backgroundColor: '#00B9ba',
    padding: 12,
    borderRadius: 30,
    marginHorizontal: 10,
    elevation: 4,
    top: -20,
  },

  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    zIndex: 10,
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  contadorTexto: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3b3',
    marginTop: 4,
  },
   header: {
    backgroundColor: '#00B8A9', // Amarillo mockup
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  saludoContainer: {
    flex: 1,
  },
  saludo: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitulo: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f00',
    borderRadius: 10,
  minWidth: 16,
  paddingHorizontal: 4,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
   buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
    marginHorizontal: 20,
    marginTop: -0,
    borderRadius: 15,
    paddingVertical: 8,
    marginBottom: 10
  },
  buscador: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },



scrollContainer: {
  paddingBottom: 80,
},
seccionContainer: {
  margin: 24,
  marginLeft: 0,
  marginRight:0,
  paddingHorizontal: 0,
  paddingLeft:10
},
seccionTitulo: {
  fontSize: 18,
  fontWeight: '900',
  marginBottom: 8,
  color: '#FF6B35',
},
categoriaItem: {
  alignItems: 'center',
  marginRight: 16,
  backgroundColor: '#fafafa',
  padding: 10,
  borderRadius: 10,
  elevation: 5,
  margin:10,
  paddingVertical: 10,
  minWidth: 120,
  maxWidth: 240,
},
iconoCategoria: {
  marginBottom: 8,   
},
nombreCategoria: {
  fontSize: 10,
  textAlign: 'center',
  color: '#333',
  flexShrink: 0,       // Permite que el texto se encoja si es necesario
  flexWrap: 'wrap',    // Permite que el texto haga salto de línea si es muy largo
  width: '100%',
  fontWeight:700       // Para que el texto use todo el ancho disponible
},
cantidadServicios: {
  fontSize:12,
  color: '#FF6B35',
  textAlign: 'center',
  width:60,
  fontWeight: 900
},
cartelPerfilIncompleto: {
  backgroundColor: '#fff0f0',
  borderLeftWidth: 5,
  borderLeftColor: '#ff4d4d',
  padding: 15,
  margin: 15,
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},

cartelIconoTexto: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

cartelTexto: {
  flex: 1,
  color: '#333',
  fontSize: 15,
  lineHeight: 20,
},

botonCrearPerfil: {
  alignSelf: 'flex-start',
  backgroundColor: '#ff4d4d',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20,
},

botonTexto: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
cartelDNI: {
  backgroundColor: '#fefefe',
  borderLeftWidth: 4,
  borderLeftColor: '#ffd700',
  padding: 12,
  marginHorizontal: 16,
  marginTop: 10,
  borderRadius: 8,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},

textoCartelDNI: {
  flex: 1,
  color: '#333',
  fontSize: 14,
},

botonVerificar: {
  backgroundColor: '#ffd700',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
},

textoBoton: {
  color: '#333',
  fontWeight: 'bold',
  fontSize: 13,
},
 botonChatFlotante: {
    position: 'absolute',
    bottom: 90, // justo arriba del nav inferior
    right: 20,
    backgroundColor: '#f62',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // sombra para android
    shadowColor: '#000', // sombra ios
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

});
