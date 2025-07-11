import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase'; // Asegúrate que esta ruta esté correcta

import BotonSuscribirme from '../components/BotonSuscribirme';

import BotonVolver from '../components/BotonVolver';

const CATEGORIAS_VALIDAS = [/* ... tus categorías ... */];

export default function PasarelaPago() {
  const route = useRoute();
  const navigation = useNavigation();

  const { categoria, mensaje } = route.params || {}; // ← mensaje opcional

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

  const accesoLibre = () => {
    navigation.navigate('ServiciosPorCategoria', { categoria });
  };

  const [suscriptor, setsuscriptor] = useState(false);
const [verificando, setVerificando] = useState(true);

useEffect(() => {
  const verificarSuscripcion = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('Error al obtener el usuario:', authError);
        setVerificando(false);
        return;
      }

      const userId = authData.user.id;

      const { data, error } = await supabase
        .from('usuarios')
        .select('suscriptor')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener la suscripción:', error);
      } else {
        setsuscriptor(data?.suscriptor === true);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    } finally {
      setVerificando(false);
    }
  };

  verificarSuscripcion();
}, []);


  return (
    <View style={styles.container}>
      <BotonVolver />
      {mensaje && <Text style={styles.mensajeExtra}>{mensaje}</Text>} {/* mensaje opcional */}
      
      <Text style={styles.mensaje}>
        Para explorar todos nuestros profesionales en {categoria}, debe abonar un pago de $1.500 pesos argentinos.
      </Text>

      {loading || verificando ? (
  <ActivityIndicator size="large" color="#27ae60" />
) : suscriptor ? (
  <TouchableOpacity
  style={[styles.boton, { backgroundColor: '#4CAF50' }]}
  onPress={accesoLibre}
>
  <Text style={styles.textoBoton}>✅ Suscripción activa: tienes acceso ilimitado</Text>
</TouchableOpacity>
) : (
  <>
    <TouchableOpacity style={styles.boton} onPress={iniciarPago}>
      <Text style={styles.textoBoton}>Pagar $1.500</Text>
    </TouchableOpacity>

    <BotonSuscribirme />

    <TouchableOpacity style={styles.botonPrueba} onPress={accesoLibre}>
      <Text style={styles.textoBotonPrueba}>Modo invitado</Text>
    </TouchableOpacity>
  </>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FAF7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mensaje: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 38,
    color: '#19D4C6',
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  mensajeExtra: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    color: '#FF8C42',
    fontWeight: '700',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  boton: {
    backgroundColor: '#FFA13C',
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
    backgroundColor: '#19D4C6',
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
