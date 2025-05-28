import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';

export default function ConfirmacionServicio({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/845/845646.png' }}
          style={styles.successImage}
        />
        <Text style={styles.title}>¡Servicio Publicado!</Text>
        <Text style={styles.subtitle}>
          Tu servicio ahora está visible para todos los usuarios.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.82}
        >
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8FAF7', // Turquesa clarito
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 34,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: '#19D4C6',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    elevation: 7,
  },
  successImage: {
    width: 120,
    height: 120,
    marginBottom: 18,
    tintColor: '#19D4C6', // Da un toque turquesa al ícono
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    color: '#19D4C6',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#777',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FFA13C',
    paddingVertical: 15,
    paddingHorizontal: 45,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#FFA13C99',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
