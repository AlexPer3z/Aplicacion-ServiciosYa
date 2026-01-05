import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Animated, Easing,
  ToastAndroid, Linking
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import fondo from '../assets/fondo.png';
import logo from '../assets/logo.png';
import useAuthSession from '../lib/hooks/useAuthSession';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import AppleSignInButton from "../components/AppleSignInButton"; 
import vexo from '../lib/vexo';
import { useGoogleAuth } from './useGoogleAuth';

WebBrowser.maybeCompleteAuthSession();

const LoginButton = ({ icon, label, onPress, style = {} }) => (
  <TouchableOpacity
    style={[styles.loginButton, style]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.85}
  >
    <MaterialIcons name={icon} size={22} color="#faae4bff" style={styles.loginButtonIcon} />
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

  const { signInWithGoogle } = useGoogleAuth();

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

  const handleEmailLogin = () => {
    vexo.login("email");
    navigation.navigate('Login')
  };

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

      console.log('existingUser ', existingUser);

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

      vexo.login("google");

      // Continúa el flujo normal
      console.log('Inicio de sesión exitoso con Google');

    } catch (err) {
      console.error('Error verificando/insertando usuario:', err);
      setErrorMessage('Error al procesar el usuario.');
    }
  };

  const handleGuestLogin = async () => {
    vexo.login("guest");
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
        <View style={styles.logoLightWrapper}>
          <Image source={logo} style={styles.logo} />
        </View>



        <Text style={styles.appTitle}>SERVICIOS YA</Text>
        <Text style={styles.title}>
          Seleccione su <Text style={styles.bold}>método de inicio de sesión</Text> preferido
        </Text>


        {errorMessage !== '' && <ErrorBox message={errorMessage} />}

        <View style={[styles.buttonsWrapper, { gap: 12, marginBottom: 8, marginTop: 10 }]}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleEmailLogin}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="email"
              size={22}
              style={styles.loginButtonIcon}
            />
            <Text style={styles.loginButtonText}>
              Inicia con tu <Text style={styles.orange}>correo</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={styles.loginButton}
  onPress={handleHuellaLogin}
  activeOpacity={0.85}
>
  <MaterialCommunityIcons
    name="fingerprint"
    size={24}
    style={styles.fingerprintIcon}
  />
  <Text style={styles.loginButtonText}>
    Inicia con tu <Text style={styles.orange}>huella</Text>
  </Text>
</TouchableOpacity>
 
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={() => signInWithGoogle(handleLoginGoogle)}
        >
          <Image
            source={require('../assets/google.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.loginButtonText}>
            Iniciar con Google
          </Text>
        </TouchableOpacity> 


          <AppleSignInButton />
          <LoginButton
            icon="person-outline"
            label="Entrar como invitado"
            onPress={handleGuestLogin}
            style={{ backgroundColor: '#F1F1F1', display: 'none' }}

          />

        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>


        <Text style={[styles.text, { marginTop: 25 }]}>
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
    backgroundColor: '#E6F4F1',
  },

  container: {
    width: '88%',
    paddingVertical: 36,
    paddingHorizontal: 22,
    borderRadius: 40,

    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 15,

    alignItems: 'center',
    backdropFilter: 'blur(12px)',
  },
  orange: {
    color: '#F5A623', // 🔥 naranja exacto de la imagen
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
    resizeMode: 'contain',
  },

  logoLightWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#FFE27A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 25,
  },
  fingerprintIcon: {
    marginRight: 12,
    color: '#8E44AD', // 🟣 morado biométrico (como la imagen)
  },

  logo: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
  },

  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#2D2A6E',
    letterSpacing: 1.3,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },



  title: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 26,
  },

  bold: {
    fontWeight: '800',
    color: '#2D2A6E',
  },

  buttonsWrapper: {
    width: '100%',
    gap: 14,
    marginTop: 10,
  },

  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 999,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },

  loginButtonIcon: {
    marginRight: 12,
    color: '#F5A623', // 🔥 naranja exacto de la imagen
  },

  loginButtonText: {
    color: '#111111', // 🔥 negro real, no gris
    fontWeight: '600', // en la imagen no es ultra bold
    fontSize: 16,
  },


  text: {
    marginTop: 24,
    fontSize: 13,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },

  link: {
    color: '#C0392B',
    fontWeight: '900',
  },

  errorBox: {
    backgroundColor: '#FFEDEC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    borderColor: '#FF7A5C',
    borderWidth: 1,
  },

  errorText: {
    color: '#D84315',
    textAlign: 'center',
    fontWeight: '700',
  },
  registerText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '900',
    color: '#fd9c00ff', // naranja claro
  },

  registerLink: {
    color: '#E67E22', // naranja más fuerte (como la imagen)
    fontWeight: '700',
  },
  text: {
    marginTop: 25,
    fontSize: 13,
    textAlign: 'center',
    color: '#4A4A4A', // gris oscuro real
    lineHeight: 18,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: '800', // antes 900
    color: '#2D2A6E',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

});