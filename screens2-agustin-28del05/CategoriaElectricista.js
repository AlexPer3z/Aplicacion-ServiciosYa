import React from 'react';
import { View, Text, FlatList } from 'react-native';

const electricistas = [
  { id: '1', nombre: 'Juan Pérez', precio: '$1000', horarios: 'Lunes a Viernes de 9:00 a 18:00' },
  { id: '2', nombre: 'Ana Rodríguez', precio: '$1200', horarios: 'Martes a Sábado de 10:00 a 19:00' },
  { id: '3', nombre: 'Carlos Gómez', precio: '$900', horarios: 'Lunes a Viernes de 8:00 a 17:00' },
  { id: '4', nombre: 'Laura Fernández', precio: '$1100', horarios: 'Lunes a Domingo de 10:00 a 20:00' },
];

export default function CategoriaElectricista() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Ofertas de Electricistas</Text>

      <FlatList
        data={electricistas}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.nombre}</Text>
            <Text>Precio: {item.precio}</Text>
            <Text>Horarios: {item.horarios}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
