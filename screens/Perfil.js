import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData.user) {
      Alert.alert('Error', 'No se pudo obtener la sesión');
      setLoading(false);
      return;
    }

    const userId = sessionData.user.id;
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (perfilError) {
      Alert.alert('Error', 'No se pudo obtener el perfil del usuario');
    } else {
      setUserData(perfil);
    }

    setLoading(false);
  };

  const actualizarFotoPerfil = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || result.assets.length === 0) return;

      setUpdating(true);

      const imagen = result.assets[0];
      const nombreArchivo = `${userData.id}-perfil-${Date.now()}.jpg`;

      const file = {
        uri: imagen.uri,
        type: 'image/jpeg',
        name: nombreArchivo,
      };

      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(nombreArchivo, file);

      if (uploadError) {
        Alert.alert('Error al subir imagen', uploadError.message);
        setUpdating(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(nombreArchivo);

      const nuevaUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_perfil: nuevaUrl })
        .eq('id', userData.id);

      if (updateError) {
        Alert.alert('Error al actualizar perfil', updateError.message);
      } else {
        setUserData((prev) => ({ ...prev, foto_perfil: nuevaUrl }));
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (e) {
      Alert.alert('Error inesperado', e.message || 'Ocurrió un error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No se encontraron datos de usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: userData.foto_perfil || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editButton} onPress={actualizarFotoPerfil} disabled={updating}>
          <Text style={styles.editButtonText}>{updating ? 'Subiendo...' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.info}>{userData.nombre}</Text>

        <Text style={styles.label}>Apellido</Text>
        <Text style={styles.info}>{userData.apellido}</Text>

        <Text style={styles.label}>Edad</Text>
        <Text style={styles.info}>{userData.edad}</Text>

        <Text style={styles.label}>DNI</Text>
        <Text style={styles.info}>{userData.dni}</Text>

        <Text style={styles.label}>Domicilio</Text>
        <Text style={styles.info}>{userData.domicilio}</Text>

        <Text style={styles.label}>Código Postal</Text>
        <Text style={styles.info}>{userData.codigo_postal}</Text>

        <Text style={styles.label}>Ciudad</Text>
        <Text style={styles.info}>{userData.ciudad}</Text>

        <Text style={styles.label}>Provincia</Text>
        <Text style={styles.info}>{userData.provincia}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8FAF7', // Fondo turquesa pastel
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#E8FAF7', // Fondo general turquesa pastel
    padding: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#19D4C6', // Turquesa fuerte
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
  },
  editButton: {
    marginTop: 14,
    backgroundColor: '#FFA13C', // Naranja fuerte
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 28,
    elevation: 3,
    shadowColor: '#FFA13C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.19,
    shadowRadius: 5,
    alignSelf: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    borderWidth: 2,
    borderColor: '#19D4C6', // Borde turquesa
    elevation: 2,
    marginTop: 0,
    marginBottom: 36,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  label: {
    fontSize: 13,
    color: '#7E8BA3',
    marginTop: 10,
    marginBottom: 2,
    fontWeight: '600',
  },
  info: {
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 3,
  },
});