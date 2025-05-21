import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const categorias = [
  'Electricista', 'Plomero', 'Pintor', 'Carpintero', 'Cerrajero',
  'Mecánico', 'Jardinero', 'Mudanzas', 'Profesor particular',
  'Diseñador gráfico', 'Programador', 'Contador', 'Fotógrafo',
  'Veterinario', 'Asistente virtual', 'Estilista', 'Tatuador',
  'Marketing', 'Traductor', 'Cuidado de niños', 'Cuidado de ancianos',
  'Entrenador personal', 'Técnico de PC', 'Desarrollador web',
  'Servicio de limpieza', 'Chofer privado', 'Decorador de interiores',
  'Chef personal', 'Organizador de eventos', 'Masajista', 'Fletes',
  'Albañil', 'Reparaciones en el hogar', 'Community Manager',
  'Editor de video', 'Paseador de perros', 'Atención al cliente',
  'Reparación de celulares', 'Profesor de música',
];

export default function EditarServicio() {
  const navigation = useNavigation();
  const route = useRoute();
  const { servicio } = route.params;

  const [titulo, setTitulo] = useState(servicio.titulo);
  const [descripcion, setDescripcion] = useState(servicio.descripcion);
  const [precio, setPrecio] = useState(servicio.precio);
  const [horario, setHorario] = useState(servicio.horario);
  const [categoria, setCategoria] = useState(servicio.categoria);

  const handleActualizar = async () => {
    if (!titulo || !descripcion || !precio || !horario || !categoria) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const { error } = await supabase
      .from('servicios')
      .update({
        titulo,
        descripcion,
        precio,
        horario,
        categoria
      })
      .eq('id', servicio.id);

    if (error) {
      Alert.alert('Error al actualizar', error.message);
    } else {
      Alert.alert('Éxito', 'Servicio actualizado');
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Editar Servicio</Text>

      <TextInput
        style={styles.input}
        placeholder="Título del servicio"
        value={titulo}
        onChangeText={setTitulo}
      />

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descripción (máx. 300 caracteres)"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        maxLength={300}
      />

      <TextInput
        style={styles.input}
        placeholder="Precio"
        keyboardType="numeric"
        value={precio}
        onChangeText={setPrecio}
      />

      <TextInput
        style={styles.input}
        placeholder="Horario disponible"
        value={horario}
        onChangeText={setHorario}
      />

      <Text style={styles.label}>Categoría</Text>
      <ScrollView style={styles.categorias}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoriaBtn,
              categoria === cat && styles.categoriaSeleccionada,
            ]}
            onPress={() => setCategoria(cat)}
          >
            <Text style={{ color: categoria === cat ? '#fff' : '#000' }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.boton} onPress={handleActualizar}>
        <Text style={styles.botonTexto}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  label: { marginBottom: 5, fontWeight: 'bold' },
  categorias: { maxHeight: 200, marginBottom: 20 },
  categoriaBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  categoriaSeleccionada: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  boton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  botonTexto: { color: '#fff', fontSize: 16 },
});
