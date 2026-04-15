import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
      navigation.replace('Home');
    } else {
      // Escucha cambios de sesión
      const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          navigation.replace('Home');
        } else {
          navigation.replace('LoginSelect');
        }
      });

      // Timeout de fallback al Login (por si no se dispara el listener)
      const timeout = setTimeout(() => navigation.replace('LoginSelect'), 3000);

      return () => {
        subscription.subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }
  };

  checkSession();
}, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
