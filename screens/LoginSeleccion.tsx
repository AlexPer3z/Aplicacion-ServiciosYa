import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Animated, Easing,
  ToastAndroid, Linking
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { registrarTokenPush } from '../lib/notificaciones';
import fondo from '../assets/fondo.png';
import logo from '../assets/logo.png';
import useAuthSession from '../lib/hooks/useAuthSession';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import BtnLoginGoogle from '../components/BtnLoginGoogle';
import { saveAuthSession } from '../lib/storage';

import AppleSignInButton from "../components/AppleSignInButton";

WebBrowser.maybeCompleteAuthSession();

const LoginButton = ({ icon, label, onPress, style = {} }) => (
  <TouchableOpacity
    style={[styles.loginButton, style]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.85}
  >
    <MaterialIcons name={icon} size={22} color="#fff" style={styles.loginButtonIcon} />
    <Text style={styles.loginButtonText}>{label}</Text>
  </TouchableOpacity>
);

const ErrorBox = ({ message }) => (
  <View style={styles.errorBox}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

export default function LoginSelect({ navigation }) {
  const [errorMessage, setErrorMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const { biometricLogin } = useAuthSession({
    onAuthSuccess: () => navigation.replace('Home'),
    onError: (error) => ToastAndroid.show(error.message, ToastAndroid.SHORT)
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // registrarTokenPush();
  }, []);

  const handleEmailLogin = () => navigation.navigate('Login');

  const handleHuellaLogin = async () => {
    try {
      await biometricLogin();
    } catch (e) {
      setErrorMessage('No se pudo iniciar sesión con huella.');
    }
  };

  const handleLoginGoogle = async (errorResponse, response) => {
    if (errorResponse) {
      setErrorMessage(errorResponse);
      return;
    }

    // Iniciar sesión con el token de Google
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    });
    if (error) {
      setErrorMessage('Error al iniciar sesión con Google.');
    }

    // Verificar si el usuario existe en la tabla "usuarios"
    const userId = data.user?.id;
    const userEmail = data.user?.email;

    if (!userId || !userEmail) {
      setErrorMessage('No se pudo obtener información del usuario.');
      return;
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('existingUser ',existingUser);

      // Si no se encuentra, insertarlo
      if (existingUser == null) { 
        console.log('registrar usuario ');
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([{ id: userId, email: userEmail }]);

        if (insertError) {
          console.error('Error insertando nuevo usuario:', insertError);
          setErrorMessage('Error al guardar información del usuario.');
          return;
        }
      }

      // Continúa el flujo normal
      console.log('Inicio de sesión exitoso con Google');

    } catch (err) {
      console.error('Error verificando/insertando usuario:', err);
      setErrorMessage('Error al procesar el usuario.');
    }
  };

  const handleFacebookSuccess = () => {
    // navigation.replace('Home');
  };
  const handleGuestLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'guest@example.com',
      password: 'guestpassword',
    });

    if (error) {
      console.log('Error al loguear invitado:', error.message);
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'InicioRouter' }],
    });
  };
  
  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Error al abrir el enlace:", err));
  };


  return (
    <ImageBackground source={fondo} style={styles.background} resizeMode="cover">
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Seleccione su método de inicio de sesión preferido</Text>
        {errorMessage !== '' && <ErrorBox message={errorMessage} />}

        <View style={[styles.buttonsWrapper, { gap: 12, marginBottom: 8, marginTop: 10 }]}>
          <LoginButton
            icon="email"
            label="Inicia con tu correo"
            onPress={handleEmailLogin}
          />
          <LoginButton
            icon="fingerprint"
            label="Inicia con tu huella"
            onPress={handleHuellaLogin}
          />
          <BtnLoginGoogle onLogin={handleLoginGoogle} />
          <AppleSignInButton />
          <LoginButton
            icon="person-outline"
            label="Entrar como invitado"
            onPress={handleGuestLogin}
            style={{ backgroundColor: '#A9A9A9' }} // gris suave
          />

        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
 
 
        <Text style={[styles.text,{marginTop:25}]}>
          Al usar esta aplicación, aceptas nuestros{' '}
          <Text 
            style={styles.link}
            onPress={() => openURL('https://inicio.serviciosya.info/Terminos-y-condiciones.html')}
          >
            Términos y Condiciones
          </Text>{' '}
          y nuestra{' '}
          <Text 
            style={styles.link}
            onPress={() => openURL('https://inicio.serviciosya.info/politicas-de-privacidad.html')}
          >
            Política de Privacidad
          </Text>.
        </Text> 

      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#E8FAF7',
  },
  container: {
    width: '88%',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    elevation: 9,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 22,
    alignSelf: 'center',
    borderRadius: 45,
    borderColor: '#19D4C6',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#19D4C6',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: '#FBE9E7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF7043',
    width: '100%',
    shadowColor: '#FF7043',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  errorText: {
    color: '#FF7043',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonsWrapper: {
    width: '100%',
    marginBottom: 18,
  },
  loginButton: {
    backgroundColor: '#00bfa6',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginButtonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  socialWrapper: {
    width: '100%',
    marginTop: 10,
    marginBottom: 8,
    gap: 10,
  },
  registerText: {
    textAlign: 'center',
    color: '#FFA13C',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
  },
    text: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});