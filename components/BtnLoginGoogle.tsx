// components/BtnLoginGoogle.js
import React from 'react';
//import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
//import Ionicons from '@expo/vector-icons/Ionicons';
//import SocialButton from './SocialButton';
//
//GoogleSignin.configure({
  //webClientId: '453761258131-3djvd01vqfglrcgcokqih78jhrjmo6oc.apps.googleusercontent.com',
  //iosClientId: '453761258131-6anu4ghpi4jv1df72490vo69vj23qq22.apps.googleusercontent.com'
//});

export default function BtnLoginGoogle({ onLogin }:any) {
  /*const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      if (userInfo.data?.idToken) {
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
  };*/

  return (
    /*<SocialButton
      onPress={signIn}
      icon={<Ionicons name="logo-google" size={24} color="#fff" />}
      text="Iniciar con Google"
      backgroundColor="#EA4335"
      textColor="#fff"
      style={{ justifyContent: 'center' }}
      />*/
      <></>
  );
}
