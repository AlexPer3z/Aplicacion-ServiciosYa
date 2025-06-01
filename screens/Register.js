import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Image, Alert
} from 'react-native';
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
    const { data, error } = await supabase.auth.signUp({ email, password });
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
      <Icon
        name={cumple ? 'check-circle' : 'cancel'}
        color={cumple ? '#10b981' : '#fb923c'}
        size={18}
      />
      <Text style={{ color: cumple ? '#10b981' : '#fb923c', marginLeft: 8, fontWeight: '600' }}>
        {texto}
      </Text>
    </View>
  );

  return (
    <ImageBackground source={fondo} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        {showMessage ? (
          <View style={styles.messageContainer}>
            <Icon name="check-circle" size={44} color="#19D4C6" style={{ marginBottom: 14 }} />
            <Text style={styles.modalTitle}>¡Verificá tu correo!</Text>
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
              placeholderTextColor="#7bc1ba"
              onChangeText={setEmail}
              value={email}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#7bc1ba"
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                value={password}
                style={styles.passwordInput}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={24} color="#19D4C6" />
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
              placeholderTextColor="#7bc1ba"
              secureTextEntry={!showPassword}
              onChangeText={setRepeatPassword}
              value={repeatPassword}
              style={styles.input}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (!email || !esSegura || password !== repeatPassword) && { backgroundColor: '#a0a0a0' }
              ]}
              onPress={handleRegister}
              disabled={!email || !esSegura || password !== repeatPassword}
            >
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
    backgroundColor: 'rgba(255,255,255,0.97)',
    margin: 16,
    borderRadius: 22,
    padding: 24,
    shadowColor: '#00B8A9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
  },
  logo: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 20,
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    color: '#19D4C6',
    letterSpacing: .6
  },
  input: {
    backgroundColor: '#f7fdfc',
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
    marginBottom: 15,
    borderWidth: 1.4,
    borderColor: '#40BFC1',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fdfc',
    borderRadius: 13,
    borderWidth: 1.4,
    borderColor: '#40BFC1',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: '#222',
  },
  requisitosContainer: {
    marginBottom: 15,
    backgroundColor: '#eafaf8',
    borderRadius: 12,
    padding: 10,
  },
  requisito: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#19D4C6',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: .3
  },
  registerText: {
    textAlign: 'center',
    color: '#FF6B35',
    fontSize: 15,
    marginTop: 12,
    fontWeight: 'bold'
  },
  messageContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 22,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 7,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    color: '#19D4C6'
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 22,
    marginTop: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: .5
  },
});