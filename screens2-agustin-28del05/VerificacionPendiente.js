import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png'; // (opcional, si tenés el logo)

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
      navigation.replace('Home');
    } else {
      navigation.replace('Inicio');
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
      {/* Si querés el logo arriba, dejá esta línea */}
      <Image source={logo} style={styles.logo} />

      <Text style={styles.title}>Verificá tu correo</Text>
      <Text style={styles.text}>
        Te enviamos un enlace de verificación a tu email. Una vez verificado, tocá continuar.
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
    backgroundColor: '#F6FFFE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#00B8A9',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 16,
    color: '#222',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500'
  },
  button: {
    backgroundColor: '#19D4C6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.17,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#B0DFE8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 15,
    color: '#979797',
    marginTop: 10,
    fontStyle: 'italic'
  },
  reenviarButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 13,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reenviarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.1,
  },
});
