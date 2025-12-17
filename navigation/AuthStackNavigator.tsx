import type React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginSelect from '../screens/LoginSeleccion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import Login from '../screens/Login';
import Register from '../screens/Register';
import type { AuthStackParamList } from '../types/navigation';
import VerificacionPendiente from '../screens/VerificacionPendiente';
import RecuperarContrasena from "../screens/RecuperarContrasena";
import NuevaContrasena from "../screens/NuevaContrasena";


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

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='LoginSelect'>
            <Stack.Screen name="LoginSelect" component={withSafeArea(LoginSelect)} />
            <Stack.Screen name="Login" component={withSafeArea(Login)} />
            <Stack.Screen name="Register" component={withSafeArea(Register)} />
            <Stack.Screen
                name="VerificacionPendiente"
                component={withSafeArea(VerificacionPendiente)}
            />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
});
