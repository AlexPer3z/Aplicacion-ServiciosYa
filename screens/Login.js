import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Animated, Easing, FlatList,
  ToastAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { registrarTokenPush } from '../lib/notificaciones';
import fondo from '../assets/fondo.png';
import logo from '../assets/logo.png';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAuthSession from '../lib/hooks/useAuthSession';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

WebBrowser.maybeCompleteAuthSession();

const validateEmail = (email) => {
  // Simple regex for email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isBiometricAvailable, biometricLogin, emailLogin } = useAuthSession({
    onAuthSuccess: () => navigation.replace('Home'),
    onError: (error) => ToastAndroid.show(error.message, ToastAndroid.SHORT)
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '787321467289-onc37jg8ueum1dkkjk5nhjgudnhdhfd8.apps.googleusercontent.com',
    redirectUri,
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
    const cargarCorreos = async () => {
      const data = await AsyncStorage.getItem('correosGuardados');
      if (data) setEmailSuggestions(JSON.parse(data));
    };
    cargarCorreos();
  }, []);

  useEffect(() => {
    registrarTokenPush();
  }, []);

  const guardarCorreo = async (nuevoCorreo) => {
    const data = await AsyncStorage.getItem('correosGuardados');
    const lista = data ? JSON.parse(data) : [];
    if (!lista.includes(nuevoCorreo)) {
      const nuevaLista = [nuevoCorreo, ...lista];
      await AsyncStorage.setItem('correosGuardados', JSON.stringify(nuevaLista));
      setEmailSuggestions(nuevaLista);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (!usuario) {
      setErrorMessage('El correo electrónico no está registrado.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    const user = data?.user;

    if (error) {
      setErrorMessage('Contraseña incorrecta o error al iniciar sesión.');
      return;
    }

    if (!user.email_confirmed_at) {
      navigation.replace('VerificacionPendiente');
      return;
    }

    await guardarCorreo(email);
    navigation.replace('Home');
  };

  const ErrorBox = ({ message }) => (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );

  useEffect(() => {
    const autenticarConGoogle = async () => {
      if (response?.type === 'success') {
        const { id_token } = response.params;

        const base64Url = id_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(atob(base64));
        const googleEmail = decodedPayload.email;

        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', googleEmail)
          .single();

        if (usuario) {
          await AsyncStorage.setItem('correoLogueado', googleEmail);
          await guardarCorreo(googleEmail);
          navigation.replace('Home');
        } else {
          setErrorMessage('Tu correo de Google no está registrado en la app.');
        }
      }
    };
    autenticarConGoogle();
  }, [response]);

  return (
    <ImageBackground source={fondo} style={styles.background} resizeMode="cover">
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Iniciar Sesión</Text>
        {errorMessage !== '' && <ErrorBox message={errorMessage} />}

        <View style={{ width: '100%', marginBottom: 20 }}>
          <TextInput
            placeholder="Correo Electrónico"
            placeholderTextColor="#999"
            onChangeText={setEmail}
            value={email}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ccc',
              paddingVertical: 10,
              marginBottom: 20,
              fontSize: 16,
              color: '#333',
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#ccc',
                paddingVertical: 10,
                fontSize: 16,
                color: '#333',
                paddingRight: 38,
                marginBottom: 20,
              }}
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 0,
                top: 6,
                height: 32,
                width: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
            >
              <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={25} color="#bbb" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#00bfa6',
            paddingVertical: 15,
            borderRadius: 30,
            marginBottom: 20,
            alignItems: 'center',
            width: '100%',
            elevation: 5,
          }}
          onPress={handleLogin}
        >
          <Text style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
          }}>Ingresar</Text>
        </TouchableOpacity>

           {isBiometricAvailable && (<View style={{ alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity
            style={styles.fingerprintButton}
            onPress={biometricLogin}
            activeOpacity={0.7}
          >
            <MaterialIcons name="fingerprint" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fingerprintLabel}>Usar huella digital</Text>
        </View>)}

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#19D4C6',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F6FCFC',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1.3,
    borderColor: '#b6e1ea',
    marginBottom: 16,
    color: '#222',
    width: '100%',
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
  fingerprintButton: {
    backgroundColor: '#00bfa6',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    marginBottom: 2,
  },
  fingerprintLabel: {
    color: '#00bfa6',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 0,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF7043',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#19D4C6',
    paddingVertical: 15,
    borderRadius: 28,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
    elevation: 6,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.8,
  },
  registerText: {
    textAlign: 'center',
    color: '#FFA13C',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
  },
});