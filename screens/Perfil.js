import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import BotonVolver from '../components/BotonVolver';
import { useQuery } from '@tanstack/react-query';
import { perfilQueryOptions } from '../lib/queryOptions';
import { getUserID } from '../store/authStore';

export default function Perfil() {
  const { data: userData, isLoading, refetch } = useQuery({...perfilQueryOptions, staleTime: 200, refetchOnMount: true});
  const [updating, setUpdating] = useState(false);

  const actualizarFotoPerfil = async () => {
    try {
      const userId = getUserID();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || result.assets.length === 0) return;

      setUpdating(true);

      const imagen = result.assets[0];
      const response = await fetch(imagen.uri);
      const fileData = await response.arrayBuffer();

      const fileExt = imagen.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}-perfil-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      const contentType = imagen.mimeType || 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(filePath, fileData, {
          contentType: contentType,
          upsert: false
        });

      if (uploadError) {
        Alert.alert('Error al subir imagen', uploadError.message);
        setUpdating(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filePath);

      const nuevaUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_perfil: nuevaUrl })
        .eq('id', userId);

      if (updateError) {
        Alert.alert('Error al actualizar perfil', updateError.message);
      } else {
        await refetch();
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (e) {
      Alert.alert('Error inesperado', e.message || 'Ocurrió un error');
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
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
      <BotonVolver />
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

        <Text style={styles.label}>Correo</Text>
        <Text style={styles.info}>{userData.email}</Text>

        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.info}>{userData.nombre}</Text>

        <Text style={styles.label}>Edad</Text>
        <Text style={styles.info}>{userData.edad}</Text>
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