// components/AppleSignInButton.tsx
import * as React from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Button } from "react-native";
import { supabase } from "../lib/supabase"; // Ajustar según tu path

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "apptrabajo",
});

export default function AppleSignInButton() {
  const handleAppleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: redirectUri,
      },
    });

    if (error) {
      console.log("Error al iniciar sesión con Apple:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return <Button title="Iniciar sesión con Apple" onPress={handleAppleLogin} />;
}
