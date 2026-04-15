import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function VerificacionPendiente({ navigation }) {
  const [verificado, setVerificado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) {
        setVerificado(true);
        clearInterval(intervalo);
      }
    }, 3000); // verificar cada 3 segundos

    return () => clearInterval(intervalo);
  }, []);

  const manejarContinuar = async () => {
    setCargando(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'No se pudo obtener el usuario.');
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('perfil_completo')
      .eq('id', user.id)
      .single();

    if (error) {
      Alert.alert('Error', 'No se pudo consultar el perfil.');
      setCargando(false);
      return;
    }

    if (data.perfil_completo === false) {
      navigation.replace('Home'); // o la pantalla que corresponda
    } else {
      // En caso de tener ya el perfil completo
      navigation.replace('Inicio'); // por si tenés otra pantalla
    }

    setCargando(false);
  };

  const reenviarCorreoConfirmacion = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'No se pudo obtener el usuario.');
      return;
    }

    const { error } = await supabase.auth.resendConfirmationEmail(user.email);

    if (error) {
      Alert.alert('Error', 'No se pudo reenviar el correo de confirmación.');
      return;
    }

    Alert.alert('Correo reenviado', 'Te hemos enviado un nuevo enlace de verificación.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu correo</Text>
      <Text style={styles.text}>
        Te enviamos un enlace de verificación a tu email. Una vez verificado, toca continuar.
      </Text>

      <TouchableOpacity
        style={[styles.button, !verificado && styles.disabledButton]}
        onPress={manejarContinuar}
        disabled={!verificado || cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continuar</Text>
        )}
      </TouchableOpacity>

      {!verificado && (
        <Text style={styles.textSmall}>Esperando verificación del email...</Text>
      )}

      <TouchableOpacity
        style={styles.reenviarButton}
        onPress={reenviarCorreoConfirmacion}
      >
        <Text style={styles.reenviarButtonText}>Reenviar correo de verificación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4B9CD3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  textSmall: {
    fontSize: 14,
    color: '#777',
    marginTop: 10,
  },
  reenviarButton: {
    backgroundColor: '#ff9900',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
  },
  reenviarButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
