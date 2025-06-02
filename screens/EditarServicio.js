import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const categorias = [
  'Electricista', 'Plomero', 'Pintor', 'Carpintero', 'Cerrajero', 'Mecánico', 'Jardinero',
  'Mudanzas', 'Profesor particular', 'Diseñador gráfico', 'Programador', 'Contador',
  'Fotógrafo', 'Veterinario', 'Asistente virtual', 'Estilista', 'Tatuador', 'Marketing',
  'Traductor', 'Cuidado de niños', 'Cuidado de ancianos', 'Entrenador personal',
  'Técnico de PC', 'Desarrollador web', 'Servicio de limpieza', 'Chofer privado',
  'Decorador de interiores', 'Chef personal', 'Organizador de eventos', 'Masajista',
  'Fletes', 'Albañil', 'Reparaciones en el hogar', 'Community Manager', 'Editor de video',
  'Paseador de perros', 'Atención al cliente', 'Reparación de celulares', 'Profesor de música',

  // Nuevas
  'Soldador', 'Gasista', 'Herrero', 'Asistente contable', 'Psicólogo', 'Kinesiólogo',
  'Nutricionista', 'Enfermero', 'Diseñador UX/UI', 'Ilustrador', 'Guionista', 'Camarógrafo',
  'Gestor de redes', 'Tester QA', 'Coach de vida', 'Terapista ocupacional',
  'Maquillador profesional', 'Manicurista', 'Técnico en refrigeración', 'Montador de muebles',
  'Bartender', 'Mozos para eventos', 'Dj para eventos', 'Instalador de cámaras',
  'Animador infantil', 'Profesor de yoga', 'Instructor de manejo', 'Lavado de autos',
  'guarderia de mascotas', 'Personal de seguridad', 'Coach financiero',
  'Redactor de contenidos', 'Consultor de negocios', 'Instalador de paneles solares',
  'Reparador de electrodomésticos', 'Tapicero', 'Modista', 'Sastre',
  'Montador de estructuras', 'Diseñador industrial', 'Fotógrafo de producto',
  'Traductor jurado', 'Desarrollador de apps', 'Gestor de ecommerce', 'Abogado',
  'Artesano', 'Consultor ambiental', 'Encargado de depósito', 'Camarero',
  'Panadero', 'Pastelero', 'Delivery', 'Personal de limpieza de oficinas'
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
    <ScrollView style={styles.background} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Editar Servicio</Text>

        <TextInput
          style={styles.input}
          placeholder="Título del servicio"
          value={titulo}
          onChangeText={setTitulo}
          placeholderTextColor="#b6e1ea"
        />

        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Descripción (máx. 300 caracteres)"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          maxLength={300}
          placeholderTextColor="#b6e1ea"
        />

        <TextInput
          style={styles.input}
          placeholder="Precio"
          keyboardType="numeric"
          value={precio}
          onChangeText={setPrecio}
          placeholderTextColor="#b6e1ea"
        />

        <TextInput
          style={styles.input}
          placeholder="Horario disponible"
          value={horario}
          onChangeText={setHorario}
          placeholderTextColor="#b6e1ea"
        />

        <Text style={styles.label}>Categoría</Text>
<ScrollView
  style={styles.categoriasScroll}
  contentContainerStyle={styles.categoriasContainer}
>
  {categorias.map((cat) => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoriaBtn,
        categoria === cat && styles.categoriaSeleccionada,
      ]}
      onPress={() => setCategoria(cat)}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.categoriaText,
          categoria === cat && styles.categoriaTextSelected,
        ]}
      >
        {cat}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>


        <TouchableOpacity style={styles.boton} onPress={handleActualizar} activeOpacity={0.85}>
          <Text style={styles.botonTexto}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#E8FAF7', // Turquesa clarito
  },
  scrollContent: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  titulo: {
    fontSize: 27,
    fontWeight: '900',
    color: '#19D4C6',
    marginBottom: 22,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F6FCFC',
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1.2,
    borderColor: '#b6e1ea',
    marginBottom: 14,
    color: '#222',
  },
  label: {
    marginBottom: 9,
    fontWeight: '700',
    color: '#FFA13C',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  categoriasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  categoriaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F6FCFC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#b6e1ea',
    margin: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriaSeleccionada: {
    backgroundColor: '#FFA13C',
    borderColor: '#FFA13C',
  },
  categoriaText: {
    color: '#222',
    fontWeight: '500',
    fontSize: 15,
  },
  categoriaTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  boton: {
    backgroundColor: '#19D4C6',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },
  botonTexto: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.6,
  },categoriasScroll: {
  maxHeight: 180, // Altura máxima visible del scroll de categorías
  marginBottom: 20,
},

});