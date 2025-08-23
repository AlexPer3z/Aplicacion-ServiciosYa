import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BotonVolver from '../components/BotonVolver';
import { supabase } from "../lib/supabase"; 


export default function PagoInicial() {
  const navigation = useNavigation();
  const [urlPago, setUrlPago] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  
useEffect(() => {
  const handleDeepLink = async ({ url }: { url: string }) => {
    if (url.includes('pago-exitoso')) {
      try {
        // obtener usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert("Error", "No se encontró usuario autenticado.");
          return;
        }

        // actualizar campo pago en la BD
        const { error } = await supabase
          .from("usuarios")
         .update({ pago: true })
          .eq("id", user.id);

        if (error) {
          console.error("Error al actualizar pago:", error);
          Alert.alert("Error", "El pago fue exitoso pero no se pudo actualizar tu estado.");
          return;
        }

        Alert.alert(
          "Registro exitoso",
          "Tu cuenta ha sido registrada correctamente. ¡Bienvenido!"
        );

        navigation.navigate('Home');
      } catch (err) {
        console.error("Error en pago-exitoso:", err);
      }

    } else if (url.includes('pago-fallido')) {
      Alert.alert('Pago fallido', 'No se pudo completar el registro.');
    } else if (url.includes('pago-pendiente')) {
      Alert.alert('Pago pendiente', 'Tu pago está siendo procesado.');
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
  setLoading(true);
  try {
    const res = await fetch('https://backend-pagos.onrender.com/crear-pago-registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        descripcion: 'Pago único de registro de cuenta',
        monto: 1,
        email: 'usuario@ejemplo.com',
      }),
    });

    const data = await res.json();

    if (res.ok && data.url) {
      setUrlPago(data.url);
    } else {
      Alert.alert('Error', data.error || 'No se pudo generar el link de pago.');
    }
  } catch (error) {
    Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
  }
  setLoading(false);
};



  useEffect(() => {
    if (urlPago) {
      Linking.openURL(urlPago);
    }
  }, [urlPago]);

  return (
    <View style={styles.container}>
      <BotonVolver />
      <Text style={styles.mensajePrincipal}>
        Para completar tu registro y por tu seguridad necesitamos realizar una verificación de pagos para validar tu identidad  <Text style={{ fontWeight: 'bold' }}>$1.000</Text>.
      </Text>
      <Text style={styles.mensajeAclaracion}>
        Este es un pago único y exclusivo por el alta de tu cuenta.{"\n"}
        <Text style={{ fontWeight: 'bold' }}>No volverás a pagar esto nunca más.</Text>
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFA13C" />
      ) : (
        <>
        <TouchableOpacity style={styles.botonPago} onPress={iniciarPago}>
          <Text style={styles.textoBoton}>Pagar $1.000 y registrar cuenta</Text>
        </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mensajePrincipal: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 24,
    color: '#4A7C84',
    lineHeight: 28,
  },
  mensajeAclaracion: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    color: '#555',
    lineHeight: 22,
  },
  botonPago: {
    backgroundColor: '#FFA13C',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 22,
    elevation: 5,
    shadowColor: '#FFA13C',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  textoBoton: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
