import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

import BotonSuscribirme from '../components/BotonSuscribirme';
import BotonVolver from '../components/BotonVolver';

export default function PasarelaPago() {
  const navigation = useNavigation();

  const [urlPago, setUrlPago] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suscriptor, setsuscriptor] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        Alert.alert("Error", "No se pudo identificar al usuario.");
        return;
      }

      const userId = authData.user.id;

      if (url.includes('pago-exitoso')) {
        try {
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({ creditos: supabase.rpc('incrementar_credito', { user_id_input: userId }) })
            .eq('id', userId);

          if (updateError) {
            console.error("Error al sumar crédito:", updateError);
            Alert.alert("Error", "El pago fue exitoso pero no se pudo actualizar tu crédito.");
          } else {
            Alert.alert("✅ Crédito agregado", "Tu pago fue exitoso y ahora tienes un crédito disponible.");
          }

          navigation.goBack();
        } catch (err) {
          console.error("Error inesperado al sumar crédito:", err);
          Alert.alert("Error", "Algo salió mal al procesar tu pago.");
        }
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

  useEffect(() => {
    if (urlPago) {
      Linking.openURL(urlPago);
    }
  }, [urlPago]);

  const iniciarPago = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://backend-pagos.onrender.com/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: "cargar_credito" }), // ahora sin categoría
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
          console.error('Error al obtener datos del usuario:', error);
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
      <Text style={styles.mensaje}>
        Para cargar créditos a tu cuenta, realiza un pago único de $1.000 pesos argentinos.
      </Text>

      {loading || verificando ? (
        <ActivityIndicator size="large" color="#27ae60" />
      ) : suscriptor ? (
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert("Suscriptor", "Tu suscripción está activa.")}
        >
          <Text style={styles.textoBoton}>✅ Ya sos suscriptor. No necesitás comprar créditos.</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity style={styles.boton} onPress={iniciarPago}>
            <Text style={styles.textoBoton}>Cargar crédito ($1.000)</Text>
          </TouchableOpacity>

          <BotonSuscribirme />
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
});

