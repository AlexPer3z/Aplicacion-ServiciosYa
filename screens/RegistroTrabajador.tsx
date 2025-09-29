import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Switch,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import * as Location from "expo-location";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function RegistroTrabajadorSimplificado() {
  const navigation = useNavigation<NavigationProp>();

  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [numeroCelular, setNumeroCelular] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);

  const [location, setLocation] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);

  // 🔹 Función que chequea si la ubicación está dentro de Bolivia
  const isInBolivia = (lat: number, lon: number) => {
    // Bounding box aproximado de Bolivia
    const minLat = -23.0; // sur
    const maxLat = -9.5;  // norte
    const minLon = -69.6; // oeste
    const maxLon = -57.5; // este

    const inside =
      lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;

    console.log("Ubicación:", { lat, lon });
    console.log("¿Está en Bolivia?", inside);
    return inside;
  };

  // 🔹 Pedir ubicación al montar
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permiso de ubicación denegado");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      isInBolivia(coords.latitude, coords.longitude);
    })();
  }, []);

  const handleSubmit = async () => {
  if (!nombre.trim() || !edad || !numeroCelular.trim()) {
    Alert.alert("Error", "Todos los campos son obligatorios.");
    return;
  }

  const edadNum = parseInt(edad);
  if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
    Alert.alert("Edad inválida", "Debes ser mayor de 18 años.");
    return;
  }

  if (numeroCelular.length < 8) {
    Alert.alert("Celular inválido", "El número de celular debe tener al menos 8 dígitos.");
    return;
  }

  if (!aceptaTerminos) {
    Alert.alert("Debes aceptar", "Es necesario aceptar los términos y condiciones.");
    return;
  }

  if (!location) {
    Alert.alert("Ubicación requerida", "No se pudo obtener tu ubicación.");
    return;
  }

  setLoading(true);
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      Alert.alert("Error", "No se pudo obtener la información del usuario.");
      setLoading(false);
      return;
    }

    const enBolivia = isInBolivia(location.latitude, location.longitude);

    let updateData;
    let redirectTo: keyof MainStackParamList;

    if (enBolivia) {
      // ✅ Dentro de Bolivia → sin créditos, pago deshabilitado
      updateData = {
        rol: "worker",
        nombre,
        edad: edadNum,
        celular: numeroCelular,
        perfil_completo: true,
        pago: false,
        creditos: 0,
        dni_verificado: true,
      };
      redirectTo = "pagoInicial";
    } else {
      // ❌ Fuera de Bolivia → créditos y pago habilitados
      updateData = {
        rol: "worker",
        nombre,
        edad: edadNum,
        celular: numeroCelular,
        perfil_completo: true,
        pago: true,
        creditos: 2,
        dni_verificado: true,
      };
      redirectTo = "Home";
    }

    const { error } = await supabase
      .from("usuarios")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error("Error al guardar en Supabase:", error);
      Alert.alert("Error", "No se pudo guardar la información. Intenta más tarde.");
      setLoading(false);
      return;
    }

    Alert.alert("Registro completado", "Tus datos se guardaron correctamente.", [
      { text: "OK", onPress: () => navigation.navigate(redirectTo) },
    ]);
  } catch (err) {
    console.error("Error en el registro:", err);
    Alert.alert("Error", "Ocurrió un error al registrar tus datos.");
  } finally {
    setLoading(false);
  }
};


  return (
    <ImageBackground
      source={require("../assets/fondoRegister.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Registro</Text>

        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor="#4e827d"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <TextInput
          placeholder="Edad"
          placeholderTextColor="#4e827d"
          value={edad}
          onChangeText={setEdad}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Número de celular(agregar codigo de pais)"
          placeholderTextColor="#4e827d"
          value={numeroCelular}
          onChangeText={setNumeroCelular}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <View style={styles.switchContainer}>
          <Switch
            value={aceptaTerminos}
            onValueChange={setAceptaTerminos}
            trackColor={{ false: "#767577", true: "#E8C547" }}
            thumbColor={aceptaTerminos ? "#A4D4AE" : "#f4f3f4"}
          />
          <Text style={styles.switchLabel}>Acepto los términos y condiciones</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Guardando..." : "Finalizar Registro"}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    marginTop: 100,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: { fontSize: 24, color: "#4A7C84", fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    fontSize: 16,
    borderColor: "#E8C547",
    borderWidth: 1,
    width: "100%",
  },
  button: {
    backgroundColor: "#E8C547",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    minWidth: 120,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchContainer: { flexDirection: "row", alignItems: "center", marginVertical: 12, width: "100%" },
  switchLabel: { marginLeft: 12, flex: 1, fontSize: 14, color: "#4A7C84" },
});
