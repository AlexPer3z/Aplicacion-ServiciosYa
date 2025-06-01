import 'react-native-gesture-handler';

import React, { useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Screens
import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import CrearPerfil from './screens/CrearPerfil';
import Perfil from './screens/Perfil';
import OfrecerServicio from './screens/OfrecerServicio';
import Configuracion from './screens/Configuracion';
import SplashScreen from './screens/SplashScreen';
import ServiciosPorCategoria from './screens/ServiciosPorCategoria';
import PasarelaPago from './screens/PasarelaPago';
import ChatIA from './screens/ChatIA';
import ChatIndividual from './screens/ChatIndividual';
import MisServicios from './screens/MisServicios';
import EditarServicio from './screens/EditarServicio';
import VerificacionPendiente from './screens/VerificacionPendiente';
import NotificacionesScreen from './screens/NotificacionesScreen';
import DniPendiente from './screens/DniPendiente';
import PerfilesPendientes from './screens/PerfilesPendientes';
import PerfilPendienteDetalle from './screens/PerfilPendienteDetalle';
import Maps from './screens/Maps';

const Stack = createNativeStackNavigator();

// Componente que envuelve cada pantalla con SafeArea
function withSafeArea(Component) {
  return (props) => (
    <SafeAreaView style={styles.screenContainer}>
      <Component {...props} />
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    (async () => {
      await NavigationBar.setVisibilityAsync("hidden");
      await NavigationBar.setBehaviorAsync("immersive");
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#4CAF50"
            translucent={false}
          />
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={withSafeArea(SplashScreen)} />
            <Stack.Screen name="Login" component={withSafeArea(Login)} />
            <Stack.Screen name="Register" component={withSafeArea(Register)} />
            <Stack.Screen name="Home" component={withSafeArea(Home)} />
            <Stack.Screen name="CrearPerfil" component={withSafeArea(CrearPerfil)} />
            <Stack.Screen name="Perfil" component={withSafeArea(Perfil)} />
            <Stack.Screen name="OfrecerServicio" component={withSafeArea(OfrecerServicio)} />
            <Stack.Screen name="Configuracion" component={withSafeArea(Configuracion)} />
            <Stack.Screen name="ServiciosPorCategoria" component={withSafeArea(ServiciosPorCategoria)} />
            <Stack.Screen name="PasarelaPago" component={withSafeArea(PasarelaPago)} />
            <Stack.Screen name="ChatIA" component={withSafeArea(ChatIA)} />
            <Stack.Screen name="ChatIndividual" component={withSafeArea(ChatIndividual)} />
            <Stack.Screen name="MisServicios" component={withSafeArea(MisServicios)} />
            <Stack.Screen name="EditarServicio" component={withSafeArea(EditarServicio)} />
            <Stack.Screen name="VerificacionPendiente" component={withSafeArea(VerificacionPendiente)} />
            <Stack.Screen name="NotificacionesScreen" component={withSafeArea(NotificacionesScreen)} />
            <Stack.Screen name="DniPendiente" component={withSafeArea(DniPendiente)} />
            <Stack.Screen name="PerfilesPendientes" component={withSafeArea(PerfilesPendientes)} />
            <Stack.Screen name="PerfilPendienteDetalle" component={withSafeArea(PerfilPendienteDetalle)} />
            <Stack.Screen name="Maps" component={Maps} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});
