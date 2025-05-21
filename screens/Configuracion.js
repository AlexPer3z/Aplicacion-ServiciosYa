import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function Configuracion({ navigation }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAbsent, setIsAbsent] = useState(false)
  const [passwordValid, setPasswordValid] = useState(true)
  const [passwordMatch, setPasswordMatch] = useState(true)

  const validarContrasena = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      number: hasNumber,
      specialChar: hasSpecialChar,
    }
  }

  const verificarContraseñas = (password, confirmPassword) => {
    setPasswordMatch(password === confirmPassword)
  }

  const handlePasswordChange = (password) => {
    setPassword(password)
    const valid = validarContrasena(password)
    setPasswordValid(valid.length && valid.upperCase && valid.number && valid.specialChar)
    verificarContraseñas(password, confirmPassword)
  }

  const handleConfirmPasswordChange = (confirmPassword) => {
    setConfirmPassword(confirmPassword)
    verificarContraseñas(password, confirmPassword)
  }

  const cambiarContrasena = async () => {
    if (!passwordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos.')
      return
    }
    if (!passwordMatch) {
      Alert.alert('Error', 'Las contraseñas no coinciden.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      Alert.alert('Error al cambiar la contraseña', error.message)
    } else {
      Alert.alert('Éxito', 'Contraseña cambiada correctamente')
    }
  }

  const toggleModoAusente = () => {
    setIsAbsent(!isAbsent)
    Alert.alert('Modo Ausente', isAbsent ? 'Has desactivado el modo ausente.' : 'Estás en modo ausente.')
  }

  const invitarAmigo = () => {
    Alert.alert('Invitar a un amigo', 'La función de invitar a un amigo está en desarrollo.')
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      navigation.replace('Login')
    } else {
      Alert.alert('Error al cerrar sesión', error.message)
    }
  }

  return (
    <ScrollView style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Configuraciones</Text>

        <Text style={styles.optionText}>Cambiar Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          secureTextEntry
          value={password}
          onChangeText={handlePasswordChange}
        />
        <TextInput
          style={styles.input}
          placeholder="Repetir nueva contraseña"
          secureTextEntry
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
        />

        <TouchableOpacity style={styles.button} onPress={cambiarContrasena}>
          <Text style={styles.buttonText}>Guardar Contraseña</Text>
        </TouchableOpacity>

        <View style={styles.requisitosContainer}>
          <Text style={[styles.requisito, password.length >= 8 ? styles.valid : styles.invalid]}>
            • Al menos 8 caracteres.
          </Text>
          <Text style={[styles.requisito, /[A-Z]/.test(password) ? styles.valid : styles.invalid]}>
            • Una letra mayúscula.
          </Text>
          <Text style={[styles.requisito, /\d/.test(password) ? styles.valid : styles.invalid]}>
            • Un número.
          </Text>
          <Text style={[styles.requisito, /[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.valid : styles.invalid]}>
            • Un carácter especial.
          </Text>
          <Text style={[styles.requisito, passwordMatch ? styles.valid : styles.invalid]}>
            • Las contraseñas coinciden.
          </Text>
        </View>

        

        <Text style={styles.optionText}>Invitar a un Amigo</Text>
        <TouchableOpacity style={styles.button} onPress={invitarAmigo}>
          <Text style={styles.buttonText}>Invitar</Text>
        </TouchableOpacity>

        <Text style={styles.optionText}>Cerrar Sesión</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    margin: 20,
    backgroundColor: '#f0f4f8',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    opacity: 0.9,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#3335',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
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
  requisitosContainer: {
    marginBottom: 15,
  },
  requisito: {
    fontSize: 14,
    marginVertical: 3,
  },
  valid: {
    color: 'green',
  },
  invalid: {
    color: 'red',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
})
