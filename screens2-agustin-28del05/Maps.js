import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Maps() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Mapa de servicios</Text>
      </View>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        <MapLibreGL.Camera
          zoomLevel={12}
          centerCoordinate={[-65.779223, -28.468775]}
        />
      </MapLibreGL.MapView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8FAF7' },
  header: {
    backgroundColor: '#19D4C6',
    paddingTop: 46,
    paddingBottom: 18,
    alignItems: 'center',
    elevation: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    zIndex: 9,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  map: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    backgroundColor: '#FFA13C',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 9,
    shadowColor: '#FFA13C',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
