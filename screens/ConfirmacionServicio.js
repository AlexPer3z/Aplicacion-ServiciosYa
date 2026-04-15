import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';

export default function ConfirmacionServicio({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));  // Valor inicial de la animación

  useEffect(() => {
    // Inicia la animación para el "fade-in" al cargar la pantalla
    Animated.timing(fadeAnim, {
      toValue: 1,  // Finaliza la animación con un valor de opacidad 1
      duration: 1000,  // Duración de la animación
      useNativeDriver: true,  // Usamos el driver nativo para mayor rendimiento
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/845/845646.png' }}
        style={styles.successImage}
      />

      <Text style={styles.title}>¡Servicio Publicado!</Text>
      <Text style={styles.subtitle}>Tu servicio ahora está visible para todos los usuarios.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
