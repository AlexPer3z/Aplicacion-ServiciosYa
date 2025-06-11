import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import Home from '../screens/Home';
import ChatIA from '../screens/ChatIA';
import ChatIndividual from '../screens/ChatIndividual';
import Configuracion from '../screens/Configuracion';
import CrearPerfil from '../screens/CrearPerfil';
import DniPendiente from '../screens/DniPendiente';
import EditarServicio from '../screens/EditarServicio';
import Maps from '../screens/Maps';
import MisServicios from '../screens/MisServicios';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import OfrecerServicio from '../screens/OfrecerServicio';
import PasarelaPago from '../screens/PasarelaPago';
import Perfil from '../screens/Perfil';
import PerfilesPendientes from '../screens/PerfilesPendientes';
import PerfilPendienteDetalle from '../screens/PerfilPendienteDetalle';
import ServiciosPorCategoria from '../screens/ServiciosPorCategoria';
import VerificacionPendiente from '../screens/VerificacionPendiente';

interface WithSafeAreaProps {
    [key: string]: any;
}

function withSafeArea<P extends WithSafeAreaProps>(Component: React.ComponentType<P>) {
    return (props: P) => (
        <SafeAreaView style={styles.screenContainer}>
            <Component {...props} />
        </SafeAreaView>
    );
}

type MainStackParamList = {
    Home: undefined;
    CrearPerfil: undefined;
    Perfil: undefined;
    OfrecerServicio: undefined;
    Configuracion: undefined;
    ServiciosPorCategoria: undefined;
    PasarelaPago: undefined;
    ChatIA: undefined;
    ChatIndividual: undefined;
    MisServicios: undefined;
    EditarServicio: undefined;
    VerificacionPendiente: undefined;
    NotificacionesScreen: undefined;
    DniPendiente: undefined;
    PerfilesPendientes: undefined;
    PerfilPendienteDetalle: undefined;
    Maps: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Home'>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="CrearPerfil" component={withSafeArea(CrearPerfil)} />
            <Stack.Screen name="Perfil" component={withSafeArea(Perfil)} />
            <Stack.Screen name="OfrecerServicio" component={withSafeArea(OfrecerServicio)} />
            <Stack.Screen name="Configuracion" component={withSafeArea(Configuracion)} />
            <Stack.Screen name="ServiciosPorCategoria" component={ServiciosPorCategoria} />
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
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
});