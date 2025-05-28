import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png'; // Asegúrate de que el path es correcto

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <ActivityIndicator size="large" color="#19D4C6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FFFE', // Turquesa muy claro
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
    borderRadius: 30,
    // Sombra suave para que “flote” un poco
    shadowColor: '#19D4C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
