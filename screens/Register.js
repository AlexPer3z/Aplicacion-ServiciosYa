import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Alert
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import fondo from '../assets/fondo.png';
import logo from '../assets/logo.png';

export default function Register({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

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
      await supabase.from('usuarios').insert([{ id: data.user.id, email }]);
      setShowMessage(true);
    }
  };

  

  const renderRequisito = (cumple, texto) => (
    <View style={styles.requisito}>
      <Icon name={cumple ? 'check-circle' : 'cancel'} color={cumple ? 'green' : 'gray'} size={18} />
      <Text style={{ color: cumple ? 'green' : 'gray', marginLeft: 6 }}>{texto}</Text>
    </View>
  );

  return (
    <ImageBackground source={fondo} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        {showMessage ? (
          <View style={styles.messageContainer}>
            <Text style={styles.modalTitle}>Verifica tu correo</Text>
            <Text style={styles.modalMessage}>
              Te enviamos un correo para confirmar tu cuenta. Una vez verificado, podrás iniciar sesión.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowMessage(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.modalButtonText}>Ir a Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Image source={logo} style={styles.logo} />
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

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.registerText}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          </>
        )}
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
    opacity: 0.95,
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
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 15,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#40BFC1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
