// components/NavInferior.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../lib/hooks/useUserData'; // Asegúrate de tener este hook



export default function NavInferior() {
    
  const navigation = useNavigation();
  const { perfilCompleto, rol } = useUserData(); // Debe devolver el rol del usuario y si tiene perfil completo
  
  return (
    <View style={styles.nav}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Ionicons name="home-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => perfilCompleto && navigation.navigate('OfrecerServicio')}
        style={[styles.btnPublicar, !perfilCompleto && { backgroundColor: '#ccc' }]}
        disabled={!perfilCompleto}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('MisServicios')}>
        <Ionicons name="list-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ChatIA')}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Configuracion')}>
        <Ionicons name="settings-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {(rol === 'admin' || rol === 'verificador') && (
        <TouchableOpacity onPress={() => navigation.navigate('PerfilesPendientes')}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 12,
  borderTopWidth: 1,
  borderTopColor: '#f26700',
  backgroundColor: '#FFA13C',
  elevation: 10,
},
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#FFA13C',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  btnPublicar: {
    backgroundColor: '#00B9ba',
    padding: 12,
    borderRadius: 30,
    marginHorizontal: 10,
    elevation: 4,
    top: -20,
  },
});