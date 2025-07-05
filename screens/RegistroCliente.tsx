import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Switch,
  Platform,
  Image,
  Alert,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";

import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";
import uuid from "react-native-uuid";


type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function RegistroCliente() {
  const navigation = useNavigation<NavigationProp>();

  // Paso actual
  const [step, setStep] = useState(1);

  // Paso 1 datos personales
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [numeroCelular, setNumeroCelular] = useState("");

  // Paso 2 fotos y dni
  const [dniFrontal, setDniFrontal] = useState<string | null>(null);
  const [dniTrasero, setDniTrasero] = useState<string | null>(null);
  const [numeroDni, setNumeroDni] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);


  // Paso 3 aceptación
  const [acepto, setAcepto] = useState(false);

  // Función para pedir foto con expo-image-picker
  const pedirFoto = async (setFoto: React.Dispatch<React.SetStateAction<string | null>>) => {
    let permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso denegado", "Para tomar la foto necesitamos permiso de cámara.");
      return;
    }
    let resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  };

  // Validar paso antes de avanzar
  const validarPaso = () => {
    if (step === 1) {
      if (!nombre || !apellido || !edad || !sexo) {
        Alert.alert("Completa todos los campos");
        return false;
      }
    }
    if (step === 2) {
      if (!dniFrontal || !dniTrasero || !numeroDni) {
        Alert.alert("Subí las fotos del DNI y completá el número");
        return false;
      }
    }
    if (step === 3) {
      if (!acepto) {
        Alert.alert("Debes aceptar los términos y condiciones");
        return false;
      }
    }
    return true;
  };

  // Avanzar paso
  const siguiente = () => {
    if (validarPaso()) {
      if (step < 3) setStep(step + 1);
      else navigation.navigate("pagoInicial"); // Finaliza el formulario
    }
  };

  // Retroceder paso
  const anterior = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  // Componente para links
  const LinkTexto = ({ url, texto }: { url: string; texto: string }) => (
    <Text
      style={styles.link}
      onPress={() => {
        Linking.openURL(url).catch(() => {
          Alert.alert("Error", "No se pudo abrir el enlace");
        });
      }}
    >
      {texto}
    </Text>
  );

  const finalizarRegistro = async () => {
  if (!validarPaso()) return;

  try {
    // Subir imágenes del DNI al storage
    const subirImagen = async (uri: string, tipo: string) => {
      const nombreArchivo = `${tipo}_${uuid.v4()}.jpg`;
      const { data, error } = await supabase.storage
        .from("fotos-perfil")
        .upload(nombreArchivo, {
          uri,
          type: "image/jpeg",
          name: nombreArchivo,
        } as any);
      if (error) throw error;
      const urlPublica = supabase.storage.from("fotos-perfil").getPublicUrl(nombreArchivo).data.publicUrl;
      return urlPublica;
    };
    // Subir imágenes con la lógica ideal
        const nombreFrontal = `${uuid.v4()}_dni_frontal.jpg`;
        const nombreTrasero = `${uuid.v4()}_dni_trasero.jpg`;

        const urlFrontal = await subirImagen(dniFrontal!, nombreFrontal);
        const urlTrasero = await subirImagen(dniTrasero!, nombreTrasero);

        const nombreFotoPerfil = `${uuid.v4()}_perfil.jpg`;
        const urlFotoPerfil = fotoPerfil ? await subirImagen(fotoPerfil, nombreFotoPerfil) : null;


        // Insertar en Supabase
        const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("usuarios").update({
      nombre,
      apellido,
      edad: Number(edad),
      sexo,
      celular: numeroCelular,
      dni: numeroDni,
      dni_frente: urlFrontal,
      dni_dorso: urlTrasero,
      rol: "user",
      foto_perfil: urlFotoPerfil,
      perfil_completo: true,
    })
    .eq("id", user.id);

    if (insertError) throw insertError;

    navigation.navigate("pagoInicial");
  } catch (error: any) {
    console.error("Error al registrar usuario:", error.message);
    Alert.alert("Error", "Ocurrió un error al guardar tus datos. Intentá de nuevo.");
  }
};


  return (
    <ImageBackground
      source={require("../assets/fondoRegister.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Registro - Cliente (Paso {step} de 3)</Text>

        {step === 1 && (
          <>
            <TextInput
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
            <TextInput
              placeholder="Apellido"
              value={apellido}
              onChangeText={setApellido}
              style={styles.input}
            />
            <TextInput
              placeholder="Edad"
              value={edad}
              onChangeText={setEdad}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Sexo"
              value={sexo}
              onChangeText={setSexo}
              style={styles.input}
            />
            <TextInput
                          placeholder="Número de celular"
                          value={numeroCelular}
                          onChangeText={setNumeroCelular}
                          keyboardType="phone-pad"
                          style={styles.input}
                        />
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.fotosContainer}>
              <View style={styles.fotoWrapper}>
                <Text style={styles.label}>Foto frontal del DNI</Text>
                {dniFrontal ? (
                  <Image source={{ uri: dniFrontal }} style={styles.foto} />
                ) : (
                  <View style={[styles.foto, styles.fotoPlaceholder]}>
                    <Text style={{ color: "#999" }}>No hay foto</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.botonFoto}
                  onPress={() => pedirFoto(setDniFrontal)}
                >
                  <Text style={styles.botonFotoTexto}>Tomar foto</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fotoWrapper}>
                <Text style={styles.label}>Foto trasera del DNI</Text>
                {dniTrasero ? (
                  <Image source={{ uri: dniTrasero }} style={styles.foto} />
                ) : (
                  <View style={[styles.foto, styles.fotoPlaceholder]}>
                    <Text style={{ color: "#999" }}>No hay foto</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.botonFoto}
                  onPress={() => pedirFoto(setDniTrasero)}
                >
                  <Text style={styles.botonFotoTexto}>Tomar foto</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              placeholder="Número de DNI"
              value={numeroDni}
              onChangeText={setNumeroDni}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.fotoWrapper}>
  <Text style={styles.label}>Foto de perfil</Text>
  {fotoPerfil ? (
    <Image source={{ uri: fotoPerfil }} style={styles.foto} />
  ) : (
    <View style={[styles.foto, styles.fotoPlaceholder]}>
      <Text style={{ color: "#999" }}>No hay foto</Text>
    </View>
  )}
  <TouchableOpacity
    style={styles.botonFoto}
    onPress={() => pedirFoto(setFotoPerfil)}
  >
    <Text style={styles.botonFotoTexto}>Tomar foto</Text>
  </TouchableOpacity>
</View>

          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.subtitulo}>Links legales:</Text>
            <LinkTexto
              url="https://inicio.serviciosya.info/politicas-de-privacidad.html"
              texto="Políticas de Privacidad"
            />
            <LinkTexto
              url="https://inicio.serviciosya.info/Terminos-y-condiciones.html"
              texto="Términos y Condiciones"
            />

            <View style={styles.switchRow}>
              <Switch value={acepto} onValueChange={setAcepto} />
              <Text style={styles.switchText}>Acepto los términos y condiciones</Text>
            </View>

            <Text style={styles.leyenda}>
              ServiciosYa es una plataforma de conexión entre trabajadores y clientes, y no asume responsabilidad alguna por las tareas o el desempeño de los trabajadores.
            </Text>
          </>
        )}

        <View style={styles.botonesNav}>
          {step > 1 && (
            <TouchableOpacity style={styles.botonNav} onPress={anterior}>
              <Text style={styles.botonNavTexto}>Anterior</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.botonNav} onPress={step < 3 ? siguiente : finalizarRegistro}>
  <Text style={styles.botonNavTexto}>
    {step < 3 ? "Siguiente" : "Finalizar"}
  </Text>
</TouchableOpacity>

        </View>
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
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    color: "#4A7C84",
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    fontSize: 16,
    borderColor: "#A4D4AE",
    borderWidth: 1,
    width: 300,
  },
  fotosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 320,
    marginBottom: 10,
  },
  fotoWrapper: {
    alignItems: "center",
    flex: .5,
    marginHorizontal: 5,
  },
  foto: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  fotoPlaceholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  botonFoto: {
    backgroundColor: "#4A7C84",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botonFotoTexto: {
    color: "white",
    fontWeight: "600",
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#4A7C84",
  },
  link: {
    color: "#FaaB35",
    textDecorationLine: "underline",
    fontSize: 20,
    marginVertical: 4,
    fontWeight:'900',
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#4A7C84",
  },
  leyenda: {
    fontSize: 19,
    fontStyle: "italic",
    textAlign: "center",
    color: "#777",
    marginHorizontal: 20,
    fontWeight:'700',
  },
  botonesNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 300,
    marginTop: 20,
  },
  botonNav: {
    backgroundColor: "#A4D4AE",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  botonNavTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
