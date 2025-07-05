import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Switch,
  Linking,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";

import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function RegistroTrabajador() {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(1);

  // Paso 1
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [numeroCelular, setNumeroCelular] = useState("");
  const [aceptaResponsabilidad, setAceptaResponsabilidad] = useState(false);

  // Paso 2
  const [dniFrontal, setDniFrontal] = useState<string | null>(null);
  const [dniTrasero, setDniTrasero] = useState<string | null>(null);
  const [numeroDni, setNumeroDni] = useState("");

  // Paso 3
  const [experiencia, setExperiencia] = useState("");
  const [referencias, setReferencias] = useState("");
  const [experienciaAcademica, setExperienciaAcademica] = useState("");

  // Paso 4
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Toma de fotos
  const pedirFoto = async (
    setFoto: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso denegado",
        "Para tomar la foto necesitamos permiso de cámara."
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (
        !nombre.trim() ||
        !apellido.trim() ||
        !edad ||
        !sexo.trim() ||
        !numeroCelular.trim()
      ) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
      }
      const edadNum = parseInt(edad);
      if (isNaN(edadNum) || edadNum < 16 || edadNum > 100) {
        Alert.alert("Edad inválida", "Debes ser mayor de 16 años.");
        return;
      }
      if (numeroCelular.length < 8) {
        Alert.alert(
          "Celular inválido",
          "El número de celular debe tener al menos 8 dígitos."
        );
        return;
      }
      if (!aceptaResponsabilidad) {
        Alert.alert(
          "Requiere aceptar",
          "Debes aceptar la responsabilidad para continuar."
        );
        return;
      }
    }

    if (step === 2) {
      if (!dniFrontal || !dniTrasero) {
        Alert.alert("Falta foto del DNI", "Debes subir ambas fotos del DNI.");
        return;
      }
      if (!/^\d{7,8}$/.test(numeroDni)) {
        Alert.alert("DNI inválido", "Debe ser un numero de DNI valido.");
        return;
      }
    }

    if (step === 3) {
      if (experiencia.trim().length < 70) {
        Alert.alert(
          "Experiencia insuficiente",
          "Describe tu experiencia con al menos 70 caracteres."
        );
        return;
      }
      if (!experienciaAcademica.trim()) {
        Alert.alert("Falta información", "Debes completar la experiencia académica.");
        return;
      }
    }

    if (step === 4) {
      if (!aceptaTerminos) {
        Alert.alert("Debes aceptar", "Es necesario aceptar los términos y condiciones.");
        return;
      }

      try {
        // Subir imágenes con la lógica ideal
        const nombreFrontal = `${uuid.v4()}_dni_frontal.jpg`;
        const nombreTrasero = `${uuid.v4()}_dni_trasero.jpg`;

        const urlFrontal = await subirImagen(dniFrontal!, nombreFrontal);
        const urlTrasero = await subirImagen(dniTrasero!, nombreTrasero);

        // Insertar en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("usuarios").update([
          {
            rol: "worker",
            nombre,
            apellido,
            edad: parseInt(edad),
            sexo,
            celular: numeroCelular,
            dni: numeroDni,
            dni_frente: urlFrontal,
            dni_dorso: urlTrasero,
            experiencia,
            referencias,
            experiencia_academica: experienciaAcademica,
            perfil_completo: true,
          },
        ])
        .eq("id", user.id);

        if (error) {
          console.error("Error al guardar en Supabase:", error.message);
          Alert.alert("Error", "No se pudo guardar la información. Intenta más tarde.");
          return;
        }

        navigation.navigate("pagoInicial");
      } catch (err) {
        Alert.alert("Error", "Ocurrió un error al registrar tus datos.");
        console.error(err);
      }

      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Función subirImagen actualizada para usar base64 + Buffer.from igual que tu lógica ideal
  const seleccionarImagen = async (setImage, tipo) => {
  try {
    let result;

    // Para DNI frente y dorso, usar la cámara
    if (tipo === 'fotoFrente' || tipo === 'fotoDorso') {
      const permisoCamara = await ImagePicker.requestCameraPermissionsAsync();
      if (!permisoCamara.granted) {
        Alert.alert('Permiso requerido', 'Se necesita permiso para usar la cámara.');
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
    } else {
      // Para otros usos (como la foto de perfil), se permite elegir desde galería
      const permisoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permisoGaleria.granted) {
        Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
        return;
      }

      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
    }
  } catch (error) {
    console.log('Error seleccionando imagen:', error);
  }
};

// Función para subir imagen a Supabase Storage (en bucket 'imagenes')
const subirImagen = async (uri, nombreBase) => {
  const user = (await supabase.auth.getUser()).data.user;
  const nombreArchivo = `${user.id}-${nombreBase}-${Date.now()}.jpg`;

  const fileData = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const buffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('imagenes')
    .upload(nombreArchivo, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('imagenes')
    .getPublicUrl(nombreArchivo);

  return publicUrlData.publicUrl;
};


  // --- Aquí sigue todo igual (UI, estilos, etc.) ---

  return (
    <ImageBackground
      source={require("../assets/fondoRegister.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.overlay}>
        <Text style={styles.title}>Registro - Trabajador</Text>

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
            <View style={styles.switchContainer}>
              <Switch
                value={aceptaResponsabilidad}
                onValueChange={setAceptaResponsabilidad}
                trackColor={{ false: "#767577", true: "#E8C547" }}
                thumbColor={aceptaResponsabilidad ? "#A4D4AE" : "#f4f3f4"}
              />
              <Text style={styles.switchLabel}>
                Declaro ser máximo responsable de los servicios ofrecidos
              </Text>
            </View>
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
          </>
        )}

        {step === 3 && (
          <>
            <TextInput
              placeholder="Descripción de experiencia laboral (mínimo 70 caracteres)"
              value={experiencia}
              onChangeText={setExperiencia}
              multiline
              numberOfLines={4}
              style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            />
            <TextInput
              placeholder="Referencias laborales (opcional)"
              value={referencias}
              onChangeText={setReferencias}
              multiline
              numberOfLines={3}
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            />
            <TextInput
              placeholder="Experiencia académica"
              value={experienciaAcademica}
              onChangeText={setExperienciaAcademica}
              multiline
              numberOfLines={3}
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            />
          </>
        )}

        {step === 4 && (
          <>
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL(
                  "https://inicio.serviciosya.info/politicas-de-privacidad.html"
                )
              }
            >
              Políticas de Privacidad
            </Text>
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL(
                  "https://inicio.serviciosya.info/Terminos-y-condiciones.html"
                )
              }
            >
              Términos y Condiciones
            </Text>

            <View style={styles.switchContainer}>
              <Switch
                value={aceptaTerminos}
                onValueChange={setAceptaTerminos}
                trackColor={{ false: "#767577", true: "#E8C547" }}
                thumbColor={aceptaTerminos ? "#A4D4AE" : "#f4f3f4"}
              />
              <Text style={styles.switchLabel}>Acepto las políticas y términos</Text>
            </View>

            <Text style={styles.subtitulo}>
              ServiciosYa es una plataforma de conexión entre trabajadores y clientes, y no asume responsabilidad alguna por las tareas o el desempeño de los trabajadores.
            </Text>
          </>
        )}

        <View style={styles.buttonsRow}>
          {step > 1 && (
            <TouchableOpacity style={[styles.button, styles.buttonBack]} onPress={handleBack}>
              <Text style={[styles.buttonText, styles.buttonTextBack]}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{step === 4 ? "Finalizar" : "Siguiente"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  buttonBack: {
    backgroundColor: "#A4D4AE",
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonTextBack: {
    color: "#4A7C84",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    width: "100%",
  },
  switchLabel: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    color: "#4A7C84",
  },
  link: {
    color: "#4A7C84",
    fontWeight: "600",
    fontSize: 16,
    marginVertical: 8,
    textDecorationLine: "underline",
  },
  subtitulo: {
    marginTop: 12,
    fontSize: 14,
    color: "#4A7C84",
    fontStyle: "italic",
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  fotosContainer: {
    flexDirection: "column",
    width: "100%",
    gap: 20,
  },
  fotoWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#4A7C84",
    marginBottom: 8,
  },
  foto: {
    width: 220,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  fotoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  botonFoto: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4A7C84",
    borderRadius: 10,
  },
  botonFotoTexto: {
    color: "#fff",
    fontWeight: "600",
  },
});
