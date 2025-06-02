// screens/PasarelaPago.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';

const CATEGORIAS_VALIDAS = [
  // Categorías originales
  'Electricista', 'Plomero', 'Gasista', 'Pintor', 'Carpintero', 'Albañil',
  'Cerrajero', 'Mecánico', 'Jardinero', 'Niñera', 'Cocinero', 'Mudanzas',
  'Diseñador', 'Programador', 'Fotógrafo', 'Veterinario', 'Profesor',
  'Abogado', 'Contador', 'Peluquero', 'Masajista', 'Maquilladora', 'DJ',
  'Decorador', 'Coach', 'Psicólogo', 'Tatuador', 'Editor de video',
  'Community Manager', 'Traductor', 'Animador', 'Soldador', 'Tapicero',
  'Costurera', 'Chofer', 'Reparación de PC', 'Reparación de celulares',
  'Delivery', 'Camarero', 'Mozo', 'Personal trainer',

  // Nuevas categorías adicionales
  'Reparaciones en el hogar',
  'Decorador de interiores',
  'Servicio de limpieza',
  'Técnico de PC',
  'Desarrollador web',
  'Fletes',
  'Chofer privado',
  'Profesor particular',
  'Profesor de música',
  'Diseñador gráfico',
  'Marketing',
  'Asistente virtual',
  'Atención al cliente',
  'Paseador de perros',
  'Entrenador personal',
  'Estilista',
  'Chef personal',
  'Organizador de eventos',
  'Cuidado de niños',
  'Cuidado de adultos mayores'
];


export default function PasarelaPago() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoria } = route.params;

  const [urlPago, setUrlPago] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (url.includes('pago-exitoso')) {
      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud fue enviada correctamente, ahora espera que el trabajador acepte.'
      );

      navigation.navigate('ServiciosPorCategoria', { categoria });
      } else if (url.includes('pago-fallido')) {
        Alert.alert('Pago fallido', 'No se pudo completar el pago.');
        navigation.goBack();
      } else if (url.includes('pago-pendiente')) {
        Alert.alert('Pago pendiente', 'Tu pago está siendo procesado.');
        navigation.goBack();
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const iniciarPago = async () => {
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      Alert.alert('Categoría inválida', 'La categoría seleccionada no es válida.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://backend-pagos.onrender.com/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria }),
      });

      const data = await res.json();

      if (res.ok && data.init_point) {
        setUrlPago(data.init_point);
      } else {
        Alert.alert('Error', data.error || 'No se pudo generar el link de pago.');
      }
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
    }
    setLoading(false);
  };

  if (urlPago) {
    Linking.openURL(urlPago);
    return null;
  }

  const irAModoPrueba = () => {
    navigation.navigate('ServiciosPorCategoria', { categoria });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mensaje}>
        Para explorar todos nuestros profesionales en {categoria}, debe abonar un pago de $1.500 pesos argentinos.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#27ae60" />
      ) : (
        <>
          <TouchableOpacity style={styles.boton} onPress={iniciarPago}>
            <Text style={styles.textoBoton}>Pagar $1.500</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonPrueba} onPress={irAModoPrueba}>
            <Text style={styles.textoBotonPrueba}>Modo de prueba</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FAF7', // Turquesa claro
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mensaje: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 38,
    color: '#19D4C6', // Turquesa “Servicios Ya”
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  boton: {
    backgroundColor: '#FFA13C', // Naranja fuerte
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 24,
    marginBottom: 18,
    elevation: 6,
    shadowColor: '#FFA13C',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  botonPrueba: {
    backgroundColor: '#19D4C6', // Turquesa fuerte
    paddingVertical: 15,
    paddingHorizontal: 44,
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  textoBotonPrueba: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});