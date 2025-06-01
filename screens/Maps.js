import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Button, Platform, PermissionsAndroid, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export default function Maps() {
  const webviewRef = useRef(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Pedir permisos y obtener ubicación
  useEffect(() => {
    (async () => {
      let granted = false;

      if (Platform.OS === 'android') {
        const androidPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        granted = androidPermission === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === 'granted';
      }

      setLocationPermission(granted);

      if (granted) {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
      } else {
        Alert.alert('Permiso denegado', 'La app necesita acceso a la ubicación para mostrar el mapa.');
      }

      setLoading(false);
    })();
  }, []);

  // 2. Código HTML del mapa (solo se genera cuando hay permisos)
  const mapHtml = userLocation ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var userMarker = null;
        var googleLikeIcon = L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        function updateUserLocation(lat, lng) {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            userMarker = L.marker([lat, lng], { icon: googleLikeIcon }).addTo(map).bindPopup('Tu ubicación');
          }
          map.setView([lat, lng], 15);
        }

        updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
      </script>
    </body>
    </html>
  ` : '';

  // 3. Función para centrar después
  const centerOnUser = () => {
    if (userLocation && webviewRef.current) {
      const jsCode = `
        map.setView([${userLocation.latitude}, ${userLocation.longitude}], 15);
        true;
      `;
      webviewRef.current.injectJavaScript(jsCode);
    }
  };

  // 4. Mostrar loader mientras se cargan permisos y ubicación
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {locationPermission && userLocation ? (
        <>
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
          />
          <View style={styles.buttonContainer}>
            <Button title="Centrar en mi ubicación" onPress={centerOnUser} />
          </View>
        </>
      ) : (
        <View style={styles.permissionError}>
          <Button title="Reintentar permisos" onPress={() => setLoading(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
