import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function DniPendiente() {
  const navigation = useNavigation();

  return (
    <View style={styles.background}>
      <View style={styles.card}>
        <MaterialIcons name="hourglass-empty" size={65} color="#FFA13C" style={{marginBottom: 6}} />
        <Text style={styles.title}>Verificación en Proceso</Text>
        <Text style={styles.subtitle}>
          Estamos revisando tu documento de identidad. Este proceso puede demorar hasta 24 horas en días hábiles.
        </Text>
        <Image
          source={require('../assets/revision.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.note}>
          Te notificaremos cuando esté aprobado. Gracias por tu paciencia.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Ir a la pantalla inicial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#E8FAF7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 35,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#19D4C6',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 16,
    elevation: 7,
    maxWidth: 420,
    width: '100%',
  },
  title: {
    fontSize: 27,
    fontWeight: '900',
    marginVertical: 13,
    color: '#19D4C6',
    textAlign: 'center',
    letterSpacing: 0.7,
  },
  subtitle: {
    fontSize: 17,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  image: {
    width: 160,
    height: 160,
    marginVertical: 6,
  },
  note: {
    fontSize: 15,
    color: '#FFA13C',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    marginTop: 27,
    paddingVertical: 13,
    paddingHorizontal: 46,
    backgroundColor: '#FFA13C',
    borderRadius: 24,
    shadowColor: '#FFA13C88',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
