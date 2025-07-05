import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase'; // ajustá el path si es necesario

export default function InicioRouter() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarRuta = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('perfil_completo')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SeleccionRol' }],
        });
      } else if (data.perfil_completo === true) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SeleccionRol' }],
        });
      }
    };

    verificarRuta();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FFA13C" />
    </View>
  );
}
