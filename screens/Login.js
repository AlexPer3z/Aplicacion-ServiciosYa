// screens/Login.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Animated, Easing, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { registrarTokenPush } from '../lib/notificaciones';
import fondo from '../assets/fondo.png'; // o './assets/logo.png' según la ubicación del archivo
import logo from '../assets/logo.png'; // o './assets/logo.png' según la ubicación del archivo


WebBrowser.maybeCompleteAuthSession();

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    <ImageBackground
          source={fondo}
          style={styles.background}
          resizeMode="cover"
        >
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Image
          source={logo}
          style={styles.logo}
        />
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
          />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ccc',
              paddingVertical: 10,
              marginBottom: 20,
              fontSize: 16,
              color: '#333',
            }}
          />
        </View>

        <TouchableOpacity style={{
          backgroundColor: '#00bfa6',
          paddingVertical: 15,
          borderRadius: 30,
          marginBottom: 20,
          alignItems: 'center',
          width: '100%',
          elevation: 5,
        }} onPress={handleLogin}>
          <Text style={{
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
          }}>Ingresar</Text>
        </TouchableOpacity>

        
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
  },
  container: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: 5,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  registerText: {
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
});
