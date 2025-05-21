import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, StatusBar } from 'react-native';

// Screens
import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import CrearPerfil from './screens/CrearPerfil';
import Perfil from './screens/Perfil';
import OfrecerServicio from './screens/OfrecerServicio';
import Configuracion from './screens/Configuracion';
import ConfirmacionServicio from './screens/ConfirmacionServicio';
import CategoriaElectricista from './screens/CategoriaElectricista';
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

// Componente que envuelve cada pantalla con padding top
function withPadding(Component) {
  return (props) => (
    <View style={styles.screenContainer}>
      <Component {...props} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"  // Cambia el color del texto (hora, batería, etc.)
          backgroundColor="#4CAF50" // Establece el color de fondo de la barra de estado
          translucent={false}  // Asegura que la barra no sea transparente
        />
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={withPadding(SplashScreen)} />
          <Stack.Screen name="Login" component={withPadding(Login)} />
          <Stack.Screen name="Register" component={withPadding(Register)} />
          <Stack.Screen name="Home" component={withPadding(Home)} />
          <Stack.Screen name="CrearPerfil" component={withPadding(CrearPerfil)} />
          <Stack.Screen name="Perfil" component={withPadding(Perfil)} />
          <Stack.Screen name="OfrecerServicio" component={withPadding(OfrecerServicio)} />
          <Stack.Screen name="CategoriaElectricista" component={withPadding(CategoriaElectricista)} />
          <Stack.Screen name="ConfirmacionServicio" component={withPadding(ConfirmacionServicio)} />
          <Stack.Screen name="Configuracion" component={withPadding(Configuracion)} />
          <Stack.Screen name="ServiciosPorCategoria" component={withPadding(ServiciosPorCategoria)} />
          <Stack.Screen name="PasarelaPago" component={withPadding(PasarelaPago)} />
          <Stack.Screen name="ChatIA" component={withPadding(ChatIA)} />
          <Stack.Screen name="ChatIndividual" component={withPadding(ChatIndividual)} />
          <Stack.Screen name="MisServicios" component={withPadding(MisServicios)} />
          <Stack.Screen name="EditarServicio" component={withPadding(EditarServicio)} />
          <Stack.Screen name="VerificacionPendiente" component={withPadding(VerificacionPendiente)} />
          <Stack.Screen name="NotificacionesScreen" component={withPadding(NotificacionesScreen)} />
          <Stack.Screen name="DniPendiente" component={withPadding(DniPendiente)} />
          <Stack.Screen name="PerfilesPendientes" component={withPadding(PerfilesPendientes)} />
          <Stack.Screen name="PerfilPendienteDetalle" component={withPadding(PerfilPendienteDetalle)} />
          <Stack.Screen name="Maps" component={Maps} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 30, // Espacio desde la parte superior (mayor que 20 para evitar superposición con la barra de estado)
  },
});
