// lib/notificaciones.js

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registrarTokenPush() {
  try {
    if (!Device.isDevice) {
      console.log('Las notificaciones solo funcionan en dispositivos físicos.');
      return;
    }

    // Verificar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado.');
      return;
    }

    // Obtener token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log('Expo Push Token:', token);

    // Obtener el usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && token) {
      // Guardar token en Supabase
      await supabase
        .from('usuarios')
        .update({ expo_token: token })
        .eq('id', user.id);

      // Guardar localmente
      await AsyncStorage.setItem('expo_token', token);
    }
  } catch (error) {
    console.error('Error al registrar el token de notificaciones:', error);
  }
}
