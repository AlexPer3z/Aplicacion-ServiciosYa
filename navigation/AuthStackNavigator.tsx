import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginSelect from '../screens/LoginSeleccion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import Login from '../screens/Login';
import Register from '../screens/Register';

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

type AuthStackParamList = {
    LoginSelect: undefined;
    Login: undefined;
    Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='LoginSelect'>
            <Stack.Screen name="LoginSelect" component={withSafeArea(LoginSelect)} />
            <Stack.Screen name="Login" component={withSafeArea(Login)} />
            <Stack.Screen name="Register" component={withSafeArea(Register)} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
});