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
import BotonVolver from '../components/BotonVolver';
import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import SelectDropdown from 'react-native-select-dropdown' 


import * as Location from "expo-location";
import { useEffect } from "react";


type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
async function mostrarUsuario() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error obteniendo usuario:", error);
  } else {
    console.log("El usuario obtenido es:", data.user);
  }
}

mostrarUsuario();

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

   // Estado para saber si está en Bolivia
  const [isBolivia, setIsBolivia] = useState(false);


  // Paso 2
  const [direccionDni, setDireccionDni] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [numeroDni, setNumeroDni] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [fotoDniPerfil, setFotoDniPerfil] = useState<string | null>(null);

  // Paso 3
  const [experiencia, setExperiencia] = useState("");
  const [referencias, setReferencias] = useState("");
  const [experienciaAcademica, setExperienciaAcademica] = useState("");

  // Paso 4
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

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


  const handleNext = async () => {
    console.log(`Avanzando al paso ${step + 1}...`);

    if (step === 1) {
      console.log("Validando datos del paso 1...");
      if (!nombre.trim() || !apellido.trim() || !edad || !sexo.trim() || !numeroCelular.trim()) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
      }

      const edadNum = parseInt(edad);
      if (isNaN(edadNum) || edadNum < 16 || edadNum > 100) {
        Alert.alert("Edad inválida", "Debes ser mayor de 16 años.");
        return;
      }

      if (numeroCelular.length < 8) {
        Alert.alert("Celular inválido", "El número de celular debe tener al menos 8 dígitos.");
        return;
      }

      if (!aceptaResponsabilidad) {
        Alert.alert("Requiere aceptar", "Debes aceptar la responsabilidad para continuar.");
        return;
      }
    }

    if (step === 2) {
      if (!numeroDni.trim() || !direccionDni.trim() || !fechaNacimiento.trim()) {
  Alert.alert("Faltan datos", "Debes completar todos los campos del paso 2.");
  return;
}

if (isBolivia && !fotoDniPerfil) {
  Alert.alert("Falta foto", "Debes subir la selfie con DNI porque estás en Bolivia.");
  return;
}

      if (!/^\d{7,8}$/.test(numeroDni)) {
        Alert.alert("DNI inválido", "Debe ser un número de DNI válido.");
        return;
      }
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaNacimiento)) {
        Alert.alert("Fecha inválida", "Usá el formato DD/MM/AAAA.");
        return;
      }

    }


    if (step === 4) {
      if (!aceptaTerminos) {
        Alert.alert("Debes aceptar", "Es necesario aceptar los términos y condiciones.");
        return;
      }

      console.log("Subiendo imágenes y guardando en Supabase...");

      try {
        const nombreFrontal = `${uuid.v4()}_dni_frontal.jpg`;
        const nombreTrasero = `${uuid.v4()}_dni_trasero.jpg`;


        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("el usuario obtenido es:", supabase.auth.getUser())
        if (authError || !user) {
          console.error("Error obteniendo usuario:", authError);
          Alert.alert("Error", "No se pudo obtener la información del usuario.");
          return;
        }

        console.log("Verificando si el usuario existe en la tabla 'usuarios'...");
        const { data: usuarioExistente, error: selectError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id);

        if (selectError) {
          console.error("Error al verificar existencia del usuario:", selectError.message);
          Alert.alert("Error", "No se pudo verificar la existencia del usuario.");
          return;
        }

        if (!usuarioExistente || usuarioExistente.length === 0) {
          console.warn("El usuario no existe en la tabla 'usuarios'.");
          Alert.alert("Error", "El usuario no está registrado en la tabla 'usuarios'.");
          return;
        }

        console.log("Usuario encontrado. Procediendo a guardar datos...");

        // Subir imágenes con la lógica ideal
        const nombreFotoPerfil = `${uuid.v4()}_perfil.jpg`;
        const urlFotoPerfil = fotoPerfil ? await subirImagen(fotoPerfil, nombreFotoPerfil) : null;

        // Subir imágenes con la lógica ideal
        const nombreFotoDniPerfil = `${uuid.v4()}_dni_perfil.jpg`;
        const urlFotoDniPerfil =
  isBolivia && fotoDniPerfil
    ? await subirImagen(fotoDniPerfil, `${uuid.v4()}_dni_perfil.jpg`)
    : null;



        const { data, error } = await supabase
          .from("usuarios")
          .update([
            {
              rol: "worker",
              nombre,
              apellido,
              edad: parseInt(edad),
              sexo,
              celular: numeroCelular,
              dni: numeroDni,
              domicilio: direccionDni,
              fecha_nacimiento: fechaNacimiento,
              foto_perfil: urlFotoPerfil,
              foto_dni_perfil: urlFotoDniPerfil,
              experiencia,
              referencias,
              experiencia_academica: experienciaAcademica,
              perfil_completo: true,
              creditos: 0,
              dni_verificado: true
            },
          ])
          .eq("id", user.id)
          .select(); // <-- esto agrega los datos actualizados al log

        console.log("Resultado del update:", { data, error });

        if (error) {
          console.error("Error al guardar en Supabase:", error.message);
          Alert.alert("Error", "No se pudo guardar la información. Intenta más tarde.");
          return;
        }

        console.log("Registro completo. Navegando a pagoInicial...");
        navigation.navigate("pagoInicial");
      } catch (err) {
        console.error("Error en el proceso final:", err);
        Alert.alert("Error", "Ocurrió un error al registrar tus datos.");
      }

      return;
    }


    setStep(step + 1);
  };

  const subirImagen = async (uri: string, nombreBase: string) => {
    console.log("Preparando imagen para subir:", nombreBase);
    const { data: { user } } = await supabase.auth.getUser();
    const nombreArchivo = `${user.id}-${nombreBase}-${Date.now()}.jpg`;

    const fileData = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
    console.log("Tamaño de imagen (bytes):", buffer.length);

    const { error } = await supabase.storage
      .from("imagenes")
      .upload(nombreArchivo, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Error subiendo imagen a Supabase Storage:", error.message);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("imagenes")
      .getPublicUrl(nombreArchivo);

    console.log("URL pública generada:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  };

  const handleBack = () => {
    if (step > 1) {
      console.log(`Retrocediendo al paso ${step - 1}`);
      setStep(step - 1);
    }
  };


  useEffect(() => {
    const verificarPais = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permiso de ubicación denegado");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync(location.coords);

      if (address?.isoCountryCode === "BO") {
        setIsBolivia(true);
        console.log("Estás en Bolivia 🇧🇴");
      } else {
        setIsBolivia(false);
        console.log("Estás fuera de Bolivia");
      }
    };

    verificarPais();
  }, []);


  return (
    <ImageBackground
      source={require("../assets/fondoRegister.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <BotonVolver /> 
        <View style={styles.overlay}>
          <Text style={styles.title}>Registro</Text>

          <KeyboardAwareScrollView style={{width:'100%'}}>
            {step === 1 && (
              <>
                <TextInput
                  placeholder="Nombre"
                  placeholderTextColor="#4e827d"
                  value={nombre}
                  onChangeText={setNombre}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Apellido"
                  placeholderTextColor="#4e827d"
                  value={apellido}
                  onChangeText={setApellido}
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
                 <SelectDropdown
                    data={[
                      {title: 'Masculino', value: 'masculino'},
                      {title: 'Femenino', value: 'femenino'},
                    ]}
                    onSelect={(selectedItem, index) => {
                      setSexo(selectedItem.value)
                    }}
                    renderButton={(selectedItem, isOpened) => {
                      return (
                        <View style={styles.dropdownButtonStyle}>
                          <Text style={[
                            styles.dropdownButtonTxtStyle,
                            !selectedItem && {color: '#999'}
                          ]}>
                            {(selectedItem && selectedItem.title) || 'Sexo'}
                          </Text>
                        </View>
                      );
                    }}
                    renderItem={(item, index, isSelected) => {
                      return (
                        <View style={{...styles.dropdownItemStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
                          <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
                        </View>
                      );
                    }}
                    showsVerticalScrollIndicator={false}
                    dropdownStyle={styles.dropdownMenuStyle}
                  />
                <TextInput
                  placeholder="Número de celular"
                  placeholderTextColor="#4e827d"
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
    <TextInput
      placeholder="Número de DNI"
      placeholderTextColor="#4e827d"
      value={numeroDni}
      onChangeText={setNumeroDni}
      keyboardType="numeric"
      style={styles.input}
    />
    <TextInput
      placeholder="Dirección (como figura en el DNI)"
      placeholderTextColor="#4e827d"
      value={direccionDni}
      onChangeText={setDireccionDni}
      style={styles.input}
    />
    <TextInput
      placeholder="Fecha de nacimiento (DD/MM/AAAA)"
      placeholderTextColor="#4e827d"
      value={fechaNacimiento}
      onChangeText={setFechaNacimiento}
      style={styles.input}
    />

    {/* Campo foto DNI SOLO si estás en Bolivia */}
    {isBolivia && (
      <View style={styles.fotoWrapper}>
        <Text style={styles.label}>Foto de perfil con DNI</Text>
        <Text style={styles.label}>*Selfie del usuario sosteniendo el DNI</Text>
        {fotoDniPerfil ? (
          <Image source={{ uri: fotoDniPerfil }} style={styles.foto} />
        ) : (
          <View style={[styles.foto, styles.fotoPlaceholder2]}>
            <Image 
              source={require('../assets/fotoperfildni.png')} 
              style={styles.fotoEjemplo}
            />
            <View style={styles.textoSuperpuesto}>
              <Text style={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.5)", padding: 5 }}>
                *Foto selfie del usuario con DNI
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.botonFoto}
          onPress={() => pedirFoto(setFotoDniPerfil)}
        >
          <Text style={styles.botonFotoTexto}>Tomar foto</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* Foto de perfil (siempre obligatoria) */}
    <View style={styles.fotoWrapper}>
      <Text style={styles.label}>Foto de perfil</Text>
      <Text style={styles.label}>*Selfie del usuario</Text>
      {fotoPerfil ? (
        <Image source={{ uri: fotoPerfil }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.fotoPlaceholder]}>
          <Text style={{ color: "#999" }}>*Foto selfie del usuario</Text>
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
                <TextInput
                  placeholder="Descripción de experiencia laboral (mínimo 70 caracteres, solo obligatorio para los trabajadores)"
                  placeholderTextColor="#4e827d"
                  value={experiencia}
                  onChangeText={setExperiencia}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, { height: 100, textAlignVertical: "top" }]}
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
          </KeyboardAwareScrollView>
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
    marginTop: 100,
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
    justifyContent:'space-evenly',
    marginTop: 20,
    marginBottom:50
  },
  fotosContainer: {
    flexDirection: "column",
    width: "100%",
    gap: 20,
  },
  fotoWrapper: {
    alignItems: "center",
    marginTop: 20,
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
  fotoPlaceholder2: {
    position: 'relative',
    overflow: 'hidden',
  },
  fotoEjemplo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textoSuperpuesto: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
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
  dropdownButtonStyle: {
      width: '100%',
      height: 50, 
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,

      backgroundColor: "#fff", 
      padding: 14,
      marginVertical: 10,
      fontSize: 16,
      borderColor: "#E8C547",
      borderWidth: 1, 
    },
    dropdownButtonTxtStyle: {
      flex: 1,
      fontSize: 16, 
    },
    dropdownButtonArrowStyle: {
      fontSize: 28,
    },
    dropdownButtonIconStyle: {
      fontSize: 28,
      marginRight: 8,
    },
    dropdownMenuStyle: {
      backgroundColor: '#E9ECEF',
      borderRadius: 8,
    },
    dropdownItemStyle: {
      width: '100%',
      flexDirection: 'row',
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
    },
    dropdownItemTxtStyle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
      color: '#151E26',
    },
    dropdownItemIconStyle: {
      fontSize: 28,
      marginRight: 8,
    },
});
