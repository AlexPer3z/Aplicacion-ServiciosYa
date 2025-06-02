// components/BtnLoginGoogle.js
import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '453761258131-3djvd01vqfglrcgcokqih78jhrjmo6oc.apps.googleusercontent.com',
  iosClientId: '453761258131-6anu4ghpi4jv1df72490vo69vj23qq22.apps.googleusercontent.com'
});

export default function BtnLoginGoogle({ onLogin }) {
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn() 
      if (userInfo.data.idToken) {
          onLogin(null, userInfo);
      } else {
        onLogin('no ID token present!',null)
      }  
    } catch (error: any) {
      console.log('BtnLoginGoogle error', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        onLogin('user cancelled the login flow',null)
      } else if (error.code === statusCodes.IN_PROGRESS) {
        onLogin('operation (e.g. sign in) is in progress already',null)
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onLogin('play services not available or outdated',null)
      } else {
        onLogin('Error al iniciar sesión con Google.',null)
      }        
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#4c81e4',
        paddingVertical: 15,
        borderRadius: 30,
        marginBottom: 20,
        alignItems: 'center',
        width: '100%',
        elevation: 5,
        flexDirection: 'row', 
        justifyContent: 'center', 
      }}
      onPress={signIn}
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: '700',
          fontSize: 16,
        }}
      >
        Ingresar con Google
      </Text>

      <Image
        source={require('../assets/google-account-thumbnail.png')}
        style={{
          width: 24,
          height: 24,
          marginLeft: 10,
          borderRadius: 12,
        }}
      />
    </TouchableOpacity>
  );
}
