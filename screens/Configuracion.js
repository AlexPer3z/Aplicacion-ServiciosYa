import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { removeAuthSession } from '../lib/storage'
import { useUserSettings } from '../lib/hooks/useUserSettings'
import BotonVolver from '../components/BotonVolver';
export default function Configuracion({ navigation }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordValid, setPasswordValid] = useState(true)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [rol, setRol] = useState(null)

  const { settings } = useUserSettings()

  useEffect(() => {
    const fetchRol = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        Alert.alert('Error', 'No se pudo obtener el usuario autenticado.')
        return
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userData.user.id)
        .single()

      if (error) {
        Alert.alert('Error', 'No se pudo obtener el rol del usuario.')
        return
      }

      setRol(data.rol)
    }

    fetchRol()
  }, [])

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

  const invitarAmigo = () => {
    Alert.alert('Invitar a un amigo', 'La función de invitar a un amigo está en desarrollo.')
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error al cerrar sesión', error.message)
    }
  }

  const eliminarCuenta = async () => {
    if (rol === 'guest') {
      Alert.alert(
        'Acción no permitida',
        'Los usuarios invitados no pueden eliminar su cuenta.'
      )
      return
    }

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { data: user, error: userError } = await supabase.auth.getUser()
            if (userError) {
              Alert.alert('Error', 'No se pudo obtener el usuario.')
              return
            }

            const { error: deleteError } = await supabase.rpc('eliminar_usuario', {
              uid: user.user.id
            })

            if (deleteError) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta.')
              return
            }

            await supabase.auth.signOut()
            await removeAuthSession()
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          },
        },
      ]
    )
  }

  return (
    <>
    <BotonVolver />
    <ScrollView style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Configuración</Text>

        {/* Mostrar el rol */}
        {rol && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#555' }}>
              Rol: <Text style={{ color: '#19D4C6' }}>{rol}</Text>
            </Text>
          </View>
        )}

        {/* CAMBIAR CONTRASEÑA */}
        <View style={styles.section}>
          <Text style={styles.optionText}>Cambiar Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Nueva contraseña"
            secureTextEntry
            value={password}
            onChangeText={handlePasswordChange}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Repetir nueva contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholderTextColor="#999"
          />

          <View style={styles.requisitosContainer}>
            <Text style={[styles.requisito, password.length >= 8 ? styles.valid : styles.invalid]}>
              {password.length >= 8 ? '✔' : '○'} Al menos 8 caracteres.
            </Text>
            <Text style={[styles.requisito, /[A-Z]/.test(password) ? styles.valid : styles.invalid]}>
              {/[A-Z]/.test(password) ? '✔' : '○'} Una letra mayúscula.
            </Text>
            <Text style={[styles.requisito, /\d/.test(password) ? styles.valid : styles.invalid]}>
              {/\d/.test(password) ? '✔' : '○'} Un número.
            </Text>
            <Text style={[styles.requisito, /[!@#$%^&*(),.?":{}|<>]/.test(password) ? styles.valid : styles.invalid]}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✔' : '○'} Un carácter especial.
            </Text>
            <Text style={[styles.requisito, passwordMatch ? styles.valid : styles.invalid]}>
              {passwordMatch ? '✔' : '○'} Las contraseñas coinciden.
            </Text>
          </View>

          <TouchableOpacity style={styles.buttonOrange} onPress={cambiarContrasena}>
            <Text style={styles.buttonText}>Guardar Contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* INVITAR */}
        <View style={styles.section}>
          <Text style={styles.optionText}>Invitar a un Amigo</Text>
          <TouchableOpacity style={styles.buttonTurquoise} onPress={invitarAmigo}>
            <Text style={styles.buttonText}>Invitar</Text>
          </TouchableOpacity>
        </View>

        {/* CERRAR SESIÓN */}
        <View style={styles.section}>
          <Text style={styles.optionText}>Cerrar Sesión</Text>
          <TouchableOpacity style={styles.buttonOrange} onPress={handleLogout}>
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* ELIMINAR CUENTA */}
        <View style={styles.section}>
          <Text style={styles.optionText}>Eliminar Cuenta</Text>
          <TouchableOpacity
            style={[styles.buttonOrange, { backgroundColor: '#D9534F' }]}
            onPress={eliminarCuenta}
          >
            <Text style={styles.buttonText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#E8FAF7', // turquesa clarito
  },
  container: {
    margin: 18,
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 24,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 7,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    color: '#19D4C6',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 34,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    color: '#202B3A',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
    marginBottom: 13,
    borderWidth: 1.3,
    borderColor: '#b6e1ea',
  },
  buttonTurquoise: {
    backgroundColor: '#19D4C6',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  buttonOrange: {
    backgroundColor: '#FFA13C',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#FFA13C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  requisitosContainer: {
    marginBottom: 16,
  },
  requisito: {
    fontSize: 14,
    marginVertical: 1,
  },
  valid: {
    color: '#19D4C6',
    fontWeight: '700',
  },
  invalid: {
    color: '#A1A1A1',
  },
})
