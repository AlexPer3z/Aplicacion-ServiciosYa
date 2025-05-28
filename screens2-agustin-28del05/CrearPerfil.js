import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function FormularioRegistroDNI() {
  // ... tu lógica exactamente igual ...

  // (no la repito por espacio, solo pego el render y los estilos adaptados)

  return (
    <ScrollView contentContainerStyle={styles.background} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.titulo}>Completá tu perfil</Text>

        <Text style={styles.subtitulo}>Foto de perfil</Text>
        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => seleccionarImagen(setFotoPerfil, 'fotoPerfil')}
          disabled={subiendo}
        >
          <Text style={styles.buttonOutlineText}>Seleccionar foto de perfil</Text>
        </TouchableOpacity>
        {fotoPerfil && (
          <Image source={{ uri: fotoPerfil }} style={styles.imagenCircular} />
        )}
        {validaciones.fotoPerfil && (
          <Text style={styles.validacion}>✔️ Foto seleccionada</Text>
        )}

        {/* Nombre */}
        <TextInput
          style={[styles.input, nombre !== '' && !validaciones.nombre && styles.inputError]}
          placeholder="Nombre"
          value={nombre}
          onChangeText={(text) => {
            setNombre(text);
            setValidaciones((prev) => ({ ...prev, nombre: /^[a-zA-Z\s]+$/.test(text) }));
          }}
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.nombre ? (
          <Text style={styles.validacion}>✔️ Nombre válido</Text>
        ) : (
          nombre !== '' && (
            <Text style={styles.invalidacion}>⚠️ Solo se permiten letras.</Text>
          )
        )}

        {/* Apellido */}
        <TextInput
          style={[styles.input, apellido !== '' && !validaciones.apellido && styles.inputError]}
          placeholder="Apellido"
          value={apellido}
          onChangeText={(text) => {
            setApellido(text);
            setValidaciones((prev) => ({ ...prev, apellido: /^[a-zA-Z\s]+$/.test(text) }));
          }}
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.apellido ? (
          <Text style={styles.validacion}>✔️ Apellido válido</Text>
        ) : (
          apellido !== '' && (
            <Text style={styles.invalidacion}>⚠️ Solo se permiten letras.</Text>
          )
        )}

        {/* Edad */}
        <TextInput
          style={[styles.input, edad !== '' && !validaciones.edad && styles.inputError]}
          placeholder="Edad"
          value={edad}
          onChangeText={(text) => {
            setEdad(text);
            setValidaciones((prev) => ({
              ...prev,
              edad: /^[0-9]+$/.test(text) && parseInt(text) > 18,
            }));
          }}
          keyboardType="numeric"
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.edad ? (
          <Text style={styles.validacion}>✔️ Edad válida</Text>
        ) : (
          edad !== '' && (
            <Text style={styles.invalidacion}>⚠️ Debes ser mayor de 18 años.</Text>
          )
        )}

        {/* DNI */}
        <TextInput
          style={[styles.input, dni !== '' && !validaciones.dni && styles.inputError]}
          placeholder="DNI"
          value={dni}
          onChangeText={(text) => {
            setDni(text);
            setValidaciones((prev) => ({
              ...prev,
              dni: /^[0-9]{8}$/.test(text),
            }));
          }}
          keyboardType="numeric"
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.dni ? (
          <Text style={styles.validacion}>✔️ DNI válido</Text>
        ) : (
          dni !== '' && (
            <Text style={styles.invalidacion}>⚠️ El DNI debe tener 8 dígitos.</Text>
          )
        )}

        {/* Foto frente DNI */}
        <Text style={styles.subtitulo}>Foto frente del DNI</Text>
        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => seleccionarImagen(setFotoFrente, 'fotoFrente')}
          disabled={subiendo}
        >
          <Text style={styles.buttonOutlineText}>Seleccionar imagen frente</Text>
        </TouchableOpacity>
        {fotoFrente && (
          <Image source={{ uri: fotoFrente }} style={styles.imagen} />
        )}
        {validaciones.fotoFrente && (
          <Text style={styles.validacion}>✔️ Imagen seleccionada</Text>
        )}

        {/* Foto dorso DNI */}
        <Text style={styles.subtitulo}>Foto dorso del DNI</Text>
        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => seleccionarImagen(setFotoDorso, 'fotoDorso')}
          disabled={subiendo}
        >
          <Text style={styles.buttonOutlineText}>Seleccionar imagen dorso</Text>
        </TouchableOpacity>
        {fotoDorso && (
          <Image source={{ uri: fotoDorso }} style={styles.imagen} />
        )}
        {validaciones.fotoDorso && (
          <Text style={styles.validacion}>✔️ Imagen seleccionada</Text>
        )}

        {/* Ciudad */}
        <Text style={styles.subtitulo}>Ciudad</Text>
        <View style={[styles.pickerContainer, ciudad !== '' && !validaciones.ciudad && styles.inputError]}>
          <Picker
            selectedValue={ciudad}
            onValueChange={(value) => {
              setCiudad(value);
              setValidaciones((prev) => ({ ...prev, ciudad: value !== '' }));
            }}
            enabled={!subiendo}
            style={styles.picker}
            dropdownIconColor="#19D4C6"
          >
            <Picker.Item label="Seleccione una ciudad" value="" />
            {ciudadesCatamarca.map((c, index) => (
              <Picker.Item key={index} label={c} value={c} />
            ))}
          </Picker>
        </View>
        {validaciones.ciudad ? (
          <Text style={styles.validacion}>✔️ Ciudad seleccionada</Text>
        ) : (
          ciudad !== '' && (
            <Text style={styles.invalidacion}>⚠️ Debes seleccionar una ciudad.</Text>
          )
        )}

        {/* Domicilio */}
        <TextInput
          style={[styles.input, domicilio !== '' && !validaciones.domicilio && styles.inputError]}
          placeholder="Domicilio"
          value={domicilio}
          onChangeText={(text) => {
            setDomicilio(text);
            setValidaciones((prev) => ({ ...prev, domicilio: text.trim().length > 0 }));
          }}
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.domicilio ? (
          <Text style={styles.validacion}>✔️ Domicilio válido</Text>
        ) : (
          domicilio !== '' && (
            <Text style={styles.invalidacion}>⚠️ El domicilio no puede estar vacío.</Text>
          )
        )}

        {/* Calle */}
        <TextInput
          style={[styles.input, calle !== '' && !validaciones.calle && styles.inputError]}
          placeholder="Calle"
          value={calle}
          onChangeText={(text) => {
            setCalle(text);
            setValidaciones((prev) => ({ ...prev, calle: text.trim().length > 0 }));
          }}
          placeholderTextColor="#b6e1ea"
        />
        {validaciones.calle ? (
          <Text style={styles.validacion}>✔️ Calle válida</Text>
        ) : (
          calle !== '' && (
            <Text style={styles.invalidacion}>⚠️ La calle no puede estar vacía.</Text>
          )
        )}

        {/* Switch */}
        <View style={styles.switchContainer}>
          <Switch
            trackColor={{ false: '#b5e0e7', true: '#FFA13C' }}
            thumbColor={aceptaTerminos ? '#19D4C6' : '#f4f3f4'}
            ios_backgroundColor="#b5e0e7"
            value={aceptaTerminos}
            onValueChange={(value) => {
              setAceptaTerminos(value);
              setValidaciones((prev) => ({ ...prev, terminos: value }));
            }}
          />
          <Text style={styles.switchLabel}>Acepto los términos y condiciones</Text>
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          style={[
            styles.buttonPrincipal,
            {
              backgroundColor: Object.values(validaciones).every((valor) => valor) ? '#19D4C6' : '#b5e0e7',
            },
          ]}
          onPress={enviarFormulario}
          disabled={!Object.values(validaciones).every((valor) => valor) || subiendo}
        >
          <Text style={styles.buttonPrincipalText}>
            {subiendo ? 'Enviando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flexGrow: 1,
    backgroundColor: '#E8FAF7', // Fondo turquesa clarito
    paddingVertical: 22,
    paddingHorizontal: 6,
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 9,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#19D4C6',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFA13C',
    marginTop: 18,
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F6FCFC',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.2,
    borderColor: '#b6e1ea',
    marginBottom: 8,
    color: '#202B3A',
  },
  inputError: {
    borderColor: '#E45757',
    backgroundColor: '#FFEAEA',
  },
  validacion: {
    color: '#19D4C6',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  invalidacion: {
    color: '#E45757',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#F6FCFC',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#b6e1ea',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: '#202B3A',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: '#19D4C6',
    backgroundColor: '#F6FCFC',
    borderRadius: 19,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonOutlineText: {
    color: '#19D4C6',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonPrincipal: {
    marginTop: 15,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonPrincipalText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 0.7,
  },
  imagen: {
    width: '100%',
    height: 170,
    resizeMode: 'cover',
    borderRadius: 18,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#19D4C6',
    backgroundColor: '#F6FCFC',
    shadowColor: '#19D4C6',
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  imagenCircular: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginVertical: 10,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#19D4C6',
    backgroundColor: '#F6FCFC',
    shadowColor: '#19D4C6',
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
});
