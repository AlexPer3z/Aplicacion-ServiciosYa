import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function SeleccionRol() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ImageBackground
      source={require("../assets/fondoRegister.png")} // Asegurate de tener esta imagen
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>¿Qué estás buscando?</Text>

        <TouchableOpacity
          style={[styles.button, styles.botonCliente]}
          onPress={() => navigation.navigate("RegistroCliente")}
        >
          <Text style={styles.buttonText}>Buscar trabajadores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.botonTrabajador]}
          onPress={() => navigation.navigate("RegistroTrabajador")}
        >
          <Text style={styles.buttonText}>Ofrecer mis servicios</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "130%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)", // capa semitransparente
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    color: "#4A7C84",
    marginBottom: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  botonCliente: {
    backgroundColor: "#19D4C6",
  },
  botonTrabajador: {
    backgroundColor: "#FaaB35",
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
  },
});
