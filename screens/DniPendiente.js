import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Hook de navegación

export default function DniPendiente() {
  const navigation = useNavigation(); // Inicializando navegación

  return (
    <View style={styles.container}>
      <MaterialIcons name="hourglass-empty" size={60} color="#f4b400" />
      <Text style={styles.title}>Verificación en Proceso</Text>
      <Text style={styles.subtitle}>
        Estamos revisando tu documento de identidad. Este proceso puede demorar hasta 24 horas en días hábiles.
      </Text>
      <Image
        source={require('../assets/revision.png')} // Asegúrate de tener una imagen opcional en /assets
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.note}>
        Te notificaremos cuando esté aprobado. Gracias por tu paciencia.
      </Text>

      {/* Botón para redirigir a Home */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Ir a la pantalla inicial</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#4CAF50', // Color verde para el botón
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
