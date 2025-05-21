import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Alert
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import fondo from '../assets/fondo.png'; // o './assets/logo.png' según la ubicación del archivo
import logo from '../assets/logo.png'; // o './assets/logo.png' según la ubicación del archivo


export default function Register({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validarPassword = (pass) => ({
    longitud: pass.length >= 8,
    mayuscula: /[A-Z]/.test(pass),
    minuscula: /[a-z]/.test(pass),
    numero: /[0-9]/.test(pass),
    simbolo: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
  });

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const requisitos = validarPassword(password);
  const esSegura = Object.values(requisitos).every(Boolean);

  const handleRegister = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Formato inválido', 'Por favor ingresa un email válido.');
      return;
    }

    if (!esSegura) {
      Alert.alert('Contraseña débil', 'La contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        Alert.alert('Correo en uso', 'Este correo ya está registrado.');
      } else {
        Alert.alert('Error al registrarse', error.message);
      }
      return;
    }

    if (data.user) {
      // Guarda el email del usuario en la tabla "usuarios"
      await supabase.from('usuarios').insert([
        { id: data.user.id, email: email }
      ]);

      // Redirige a pantalla de verificación
      Alert.alert('Verifica tu correo', 'Te enviamos un correo para confirmar tu cuenta.');
      navigation.replace('VerificacionPendiente');
    }
  };


const signInWithGoogle = async () => {
  console.log("Accediste");

  // Usa el proxy de Expo para asegurar compatibilidad OAuth
    // Redirección manual (debe coincidir con la registrada en Google)
  const redirectTo = 'https://auth.expo.io/@alex_6775/appTrabajo';

  console.log("Redirect URI:", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Error al iniciar sesión con Google:', error.message);
    return;
  }

  const authUrl = data?.url;
  console.log("authUrl es:", authUrl);

  if (authUrl) {
    console.log("Intentando abrir navegador...");
    
    // Usa promptAsync para abrir el navegador y manejar el flujo OAuth
    const result = await AuthSession.promptAsync({ url: authUrl, useProxy: true });

    if (result.type === 'success') {
      console.log("Autenticación exitosa:", result.params);
    } else {
      console.log("Autenticación cancelada o fallida:", result.type);
    }

    console.log("Se cerró navegador");
  }
};



  const renderRequisito = (cumple, texto) => (
    <View style={styles.requisito}>
      <Icon name={cumple ? 'check-circle' : 'cancel'} color={cumple ? 'green' : 'gray'} size={18} />
      <Text style={{ color: cumple ? 'green' : 'gray', marginLeft: 6 }}>{texto}</Text>
    </View>
  );

  return (
    <ImageBackground
      source={fondo}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={logo}
          style={styles.logo}
        />
        <Text style={styles.title}>Crear Cuenta</Text>

        <TextInput
          placeholder="Correo Electrónico"
          placeholderTextColor="#999"
          onChangeText={setEmail}
          value={email}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            value={password}
            style={styles.passwordInput}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.requisitosContainer}>
          {renderRequisito(requisitos.longitud, 'Mínimo 8 caracteres')}
          {renderRequisito(requisitos.mayuscula, 'Una mayúscula')}
          {renderRequisito(requisitos.minuscula, 'Una minúscula')}
          {renderRequisito(requisitos.numero, 'Un número')}
          {renderRequisito(requisitos.simbolo, 'Un símbolo')}
        </View>

        <TextInput
          placeholder="Repetir Contraseña"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          onChangeText={setRepeatPassword}
          value={repeatPassword}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.googleButton}
  onPress={() => {
    console.log('Botón de registro con Google presionado');
    signInWithGoogle();
  }}
>
  <Icon  style={{ marginRight: 10 }} />
  <Text style={styles.googleButtonText}>Registrarte con Google</Text>
</TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.registerText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#f0f4f8',
    margin: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    opacity: .9
    },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 20,
   },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  requisitosContainer: {
    marginBottom: 15,
  },
  requisito: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#40BFC1',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    marginTop: 10,
  },
});