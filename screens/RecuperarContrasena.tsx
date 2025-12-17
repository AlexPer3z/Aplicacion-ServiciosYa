import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../lib/supabase";

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviarLink = async () => {
    if (!email.trim()) {
      Alert.alert("Falta el email", "Ingresá tu email para enviarte el link.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "serviciosya://reset-password",
    });

    setCargando(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert(
      "Listo",
      "Te enviamos un link a tu correo para crear una nueva contraseña."
    );
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        Recuperar contraseña
      </Text>

      <Text style={{ opacity: 0.8 }}>
        Ingresá tu email y te mandamos un link para recuperar el acceso.
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={enviarLink}
        disabled={cargando}
        style={{
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
          opacity: cargando ? 0.6 : 1,
          backgroundColor: "#16C2B8",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          {cargando ? "Enviando..." : "Enviar link"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
