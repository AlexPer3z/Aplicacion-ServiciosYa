import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

import BotonSuscribirme from '../components/BotonSuscribirme';
import BotonVolver from '../components/BotonVolver';

import * as Location from "expo-location";

async function detectarPais(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    console.log("📍 Ubicación:", location.coords);

    const geocode = await Location.reverseGeocodeAsync(location.coords);

    if (geocode.length > 0) {
      console.log("🌎 País detectado:", geocode[0].country, geocode[0].isoCountryCode);
      return geocode[0].isoCountryCode; // "BO", "AR", etc.
    }

    return null;
  } catch (err) {
    console.error("❌ Error detectando país:", err);
    return null;
  }
}





export default function PasarelaPago() {
  const navigation = useNavigation();

  const [urlPago, setUrlPago] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suscriptor, setsuscriptor] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [pais, setPais] = useState(null);

useEffect(() => {
  // ⚠️ Para debug: forzar Bolivia
  //setPais("Bolivia");

  // 👉 En producción usar la API real
  detectarPais().then((paisDetectado) => {
    setPais(paisDetectado);
    console.log("El país actual es:", paisDetectado);
  });
}, []);



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
          // 1. Traer créditos actuales
          const { data: userData, error: getError } = await supabase
            .from('usuarios')
            .select('creditos')
            .eq('id', userId)
            .single();

          if (getError) {
            console.error("Error al obtener créditos:", getError);
            Alert.alert("Error", "No se pudo verificar tu saldo actual.");
            return;
          }

          const creditosActuales = userData?.creditos || 0;
          const nuevosCreditos = creditosActuales + 1;

          // 2. Guardar sumando +1
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({ creditos: nuevosCreditos })
            .eq('id', userId);

          if (updateError) {
            console.error("Error al actualizar créditos:", updateError);
            Alert.alert("Error", "El pago fue exitoso pero no se pudo actualizar tu crédito.");
          } else {
            Alert.alert("✅ Crédito agregado", "Tu pago fue exitoso y ahora tienes un crédito más en tu cuenta.");
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
    const { data: authData, error: authError } = await supabase.auth.getUser();
if (authError || !authData?.user) {
  Alert.alert("Error", "No se pudo identificar al usuario.");
  setLoading(false);
  return;
}

const userId = authData.user.id;
const email = authData.user.email; // 👈 extraer email también
let endpoint = "";
let body = {};

if (pais === "BO") {
  endpoint = "https://backend-pagos.onrender.com/crear-pago-libelula";
  body = {
    motivo: "cargar_credito",
    userId,
    email,        // 👈 agregado
    monto: 10,    // Bs
  };
} else {
  endpoint = "https://backend-pagos.onrender.com/crear-preferencia";
  body = {
    motivo: "cargar_credito",
    userId,
    monto: 1000,
  };
}


    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const url = data.url || data.init_point || data.url_pasarela_pagos;
    if (res.ok && url) {
      setUrlPago(url);
    } else {
      Alert.alert("Error", data.error || "No se pudo generar el link de pago.");
    }
  } catch (error) {
    Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
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
  Para cargar créditos a tu cuenta, realiza un pago único de{" "}
  {pais === "BO" ? "10 bs" : "$1.000 pesos Argentinos"}.
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
    <Text style={styles.textoBoton}>
      Cargar crédito ({pais === "BO" ? "10 bs" : "$1.000"})
    </Text>
  </TouchableOpacity>

  {/* 👇 Ocultamos el botón si está en Bolivia */}
  {pais !== "BO" && <BotonSuscribirme />}
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
