import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { supabase } from '../lib/supabase'; // Ajustá la ruta según tu proyecto

const BACKEND_URL = 'https://backend-pagos.onrender.com'; // Cambiá por tu backend real

export default function BotonSuscribirme() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error obteniendo usuario:', error.message);
        Alert.alert('Error', 'No se pudo obtener la información del usuario.');
        return;
      }
      if (user?.email) setEmail(user.email);
      else Alert.alert('Error', 'No se encontró el email del usuario.');
    }
    fetchUser();
  }, []);

  const manejarSuscripcion = async () => {
    if (!email) {
      Alert.alert('Error', 'No se encontró tu email. Por favor inicia sesión nuevamente.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/crear-suscripcion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.init_point) {
        Linking.openURL(data.init_point);
      } else {
        Alert.alert('Error', data.error || 'No se pudo iniciar la suscripción.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error de conexión', 'No se pudo contactar al servidor.');
    }
    setLoading(false);
  };

  return (
    <TouchableOpacity
      style={styles.boton}
      onPress={manejarSuscripcion}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.texto}>Suscribirme por $5.000</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: 'gold',
    paddingVertical: 24,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  texto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
