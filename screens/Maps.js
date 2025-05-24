import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';

export default function Maps() {
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
  style={styles.map}
  styleURL="https://demotiles.maplibre.org/style.json"
>

        <MapLibreGL.Camera
          zoomLevel={12}
          centerCoordinate={[-65.779223, -28.468775]}
        />
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 }
});
