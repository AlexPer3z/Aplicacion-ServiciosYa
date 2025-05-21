import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';

export default function OfrecerServicio({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [horario, setHorario] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [userId, setUserId] = useState(null);

  const categoriasDisponibles = [
    'Electricista', 'Plomero', 'Pintor', 'Carpintero', 'Cerrajero', 'Mecánico', 'Jardinero',
    'Mudanzas', 'Profesor particular', 'Diseñador gráfico', 'Programador', 'Contador',
    'Fotógrafo', 'Veterinario', 'Asistente virtual', 'Estilista', 'Tatuador', 'Marketing',
    'Traductor', 'Cuidado de niños', 'Cuidado de ancianos', 'Entrenador personal',
    'Técnico de PC', 'Desarrollador web', 'Servicio de limpieza', 'Chofer privado',
    'Decorador de interiores', 'Chef personal', 'Organizador de eventos', 'Masajista',
    'Fletes', 'Albañil', 'Reparaciones en el hogar', 'Community Manager', 'Editor de video',
    'Paseador de perros', 'Atención al cliente', 'Reparación de celulares', 'Profesor de música'
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        Alert.alert('Error', 'No se pudo obtener el usuario');
        console.error('Error al obtener el usuario:', error);
      }
    };

    getUser();
  }, []);

  const handleSubmit = async () => {
    if (!titulo || !categoria || !horario || !precio || !descripcion) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se pudo obtener el usuario. Asegúrate de estar logueado.');
      return;
    }

    const servicio = {
      user_id: userId,
      titulo,
      categoria,
      horario,
      precio,
      descripcion,
    };

    try {
      const { data, error } = await supabase
        .from('servicios')
        .insert([servicio]);

      if (error) {
        console.error('Error de Supabase:', error);
        throw new Error(error.message || 'Error desconocido de Supabase');
      }

      Alert.alert('Éxito', 'Servicio creado correctamente.');
      navigation.navigate('Home');
    } catch (err) {
      console.error('Error al insertar el servicio:', err.message);
      Alert.alert('Error', `No se pudo crear el servicio: ${err.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Publicar un Servicio</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Título del servicio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Electricista a domicilio"placeholderTextColor="#888"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoria}
            onValueChange={(itemValue) => setCategoria(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona una categoría" value="" />
            {categoriasDisponibles.map((cat, index) => (
              <Picker.Item key={index} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Horario</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Lunes a Viernes de 9 a 18hs"placeholderTextColor="#888"
          value={horario}
          onChangeText={setHorario}
        />

        <Text style={styles.label}>Precio</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio aprox, Ej: $5000 por hora"
          placeholderTextColor="#888"
          value={precio}
          onChangeText={setPrecio}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Breve descripción (máx 300 caracteres)"placeholderTextColor="#888"
          value={descripcion}
          onChangeText={(text) => {
            if (text.length <= 300) setDescripcion(text);
          }}
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Publicar Servicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    color: '#333'
  },
  label: {
    fontSize: 14,
    color: '#000',
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 5,
    marginBottom: 15,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#222'
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#00B8A9',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
