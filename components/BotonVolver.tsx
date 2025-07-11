import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const BotonVolver = ({ texto = 'Volver' }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity style={styles.boton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#4A7C84" />
        <Text style={styles.texto}>{texto}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 999,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  texto: {
    marginLeft: 6,
    color: '#4A7C84',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BotonVolver;
