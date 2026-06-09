import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Switch,
  Alert,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { AuthContext } from "../lib/context/AppContext";
import { syncPrestadorConToori } from "../lib/tooriApi";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function RegistroTrabajadorSimplificado() {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [busquedaCategoria, setBusquedaCategoria] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [dni, setDni] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [matriculaArchivos, setMatriculaArchivos] = useState<any[]>([]);
  const [antecedentesArchivos, setAntecedentesArchivos] = useState<any[]>([]);
  const [antiguedad, setAntiguedad] = useState("");

  const navigation = useNavigation<NavigationProp>();
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [numeroCelular, setNumeroCelular] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const { location, setLocation } = useContext(AuthContext);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(true);
  const [procesandoModal, setProcesandoModal] = useState(false);

  const isInBolivia = (lat: number, lon: number) => {
    return lat >= -23.0 && lat <= -9.5 && lon >= -69.6 && lon <= -57.5;
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true });
      if (!error && data) setCategorias(data.map((c) => c.nombre));
    })();
  }, []);

  const categoriasFiltradas = categorias.filter(
    (c) =>
      c.toLowerCase().includes(busquedaCategoria.toLowerCase()) &&
      !categoriasSeleccionadas.includes(c)
  );

  const agregarCategoria = (cat: string) => {
    if (categoriasSeleccionadas.length >= 3) {
      Alert.alert("Máximo 3 categorías");
      return;
    }
    setCategoriasSeleccionadas([...categoriasSeleccionadas, cat]);
    setBusquedaCategoria("");
    setMostrarDropdown(false);
  };

  const quitarCategoria = (cat: string) => {
    setCategoriasSeleccionadas(categoriasSeleccionadas.filter((c) => c !== cat));
  };

  const seleccionarFotoPerfil = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert("Permiso requerido", "Debes permitir acceso a la galería.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets.length > 0) {
        setFotoPerfil(result.assets[0].uri);
      }
    } catch (e) {
      console.log("Error seleccionando foto:", e);
    }
  };

  const seleccionarArchivos = async (
    lista: any[],
    setLista: (v: any[]) => void,
    tipo: "imagen" | "pdf"
  ) => {
    if (lista.length >= 3) {
      Alert.alert("Máximo 3 archivos");
      return;
    }
    try {
      if (tipo === "imagen") {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert("Permiso requerido");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
        });
        if (!result.canceled && result.assets.length > 0) {
          setLista([...lista, { uri: result.assets[0].uri, tipo: "imagen", nombre: `imagen_${Date.now()}.jpg` }]);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          setLista([...lista, { uri: asset.uri, tipo: "pdf", nombre: asset.name }]);
        }
      }
    } catch (e) {
      console.log("Error seleccionando archivo:", e);
    }
  };

  const subirArchivo = async (uri: string, nombre: string, contentType: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    const nombreArchivo = `${user?.id}-${nombre}-${Date.now()}`;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const { error } = await supabase.storage
      .from("imagenes")
      .upload(nombreArchivo, buffer, { contentType, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("imagenes").getPublicUrl(nombreArchivo);
    return data.publicUrl;
  };

  const subirFoto = async (uri: string) => {
    return await subirArchivo(uri, "perfil.jpg", "image/jpeg");
  };

  const subirListaArchivos = async (lista: any[]) => {
    const urls: string[] = [];
    for (const archivo of lista) {
      const contentType = archivo.tipo === "pdf" ? "application/pdf" : "image/jpeg";
      const url = await subirArchivo(archivo.uri, archivo.nombre, contentType);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (
      !nombre.trim() || !edad || !numeroCelular.trim() ||
      categoriasSeleccionadas.length === 0 || !dni.trim() ||
      !ciudad.trim() || !provincia.trim() || !antiguedad.trim()
    ) {
      Alert.alert("Error", "Todos los campos obligatorios deben completarse.");
      return;
    }
    const edadNum = parseInt(edad);
    if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
      Alert.alert("Edad inválida", "Debes ser mayor de 18 años.");
      return;
    }
    const antiguedadNum = parseFloat(antiguedad.replace(",", "."));
    if (isNaN(antiguedadNum) || antiguedadNum < 0) {
      Alert.alert("Antigüedad inválida", "Ingresa un número válido.");
      return;
    }
    if (numeroCelular.length < 8) {
      Alert.alert("Celular inválido", "El número debe tener al menos 8 dígitos.");
      return;
    }
    if (!aceptaTerminos) {
      Alert.alert("Debes aceptar los términos y condiciones.");
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
        Alert.alert("Error", "No se pudo obtener el usuario.");
        return;
      }

      let urlFotoPerfil = null;
      if (fotoPerfil) {
        try { urlFotoPerfil = await subirFoto(fotoPerfil); } catch (e) {
          Alert.alert("Error", "No se pudo subir la foto.");
        }
      }

      let matriculaUrls: string[] = [];
      let antecedentesUrls: string[] = [];

      if (matriculaArchivos.length > 0) {
        matriculaUrls = await subirListaArchivos(matriculaArchivos);
      }
      if (antecedentesArchivos.length > 0) {
        antecedentesUrls = await subirListaArchivos(antecedentesArchivos);
      }

      const verificado = matriculaUrls.length > 0 && antecedentesUrls.length > 0;
      const enBolivia = isInBolivia(location.latitude, location.longitude);
      const domicilio = `${ciudad}, ${provincia}${barrio ? ", " + barrio : ""}`;

      const updateData: any = {
        rol: "worker",
        nombre,
        edad: edadNum,
        celular: numeroCelular,
        categoria: categoriasSeleccionadas,
        dni,
        domicilio,
        ciudad,
        provincia,
        barrio: barrio || null,
        antiguedad: antiguedadNum,
        matricula: matriculaUrls.length > 0 ? matriculaUrls[0] : null,
        antecedentes: antecedentesUrls.length > 0 ? antecedentesUrls[0] : null,
        verificado,
        perfil_completo: true,
        dni_verificado: true,
        pago: !enBolivia,
        creditos: 0,
      };

      if (urlFotoPerfil) updateData.foto_perfil = urlFotoPerfil;

      const { error } = await supabase.from("usuarios").update(updateData).eq("id", user.id);
      if (error) {
        Alert.alert("Error", "No se pudo guardar la información.");
        return;
      }

      const syncResult = await syncPrestadorConToori({
        appUserId: user.id,
        nombre,
        telefono: numeroCelular,
        email: user.email ?? null,
        oficios: categoriasSeleccionadas,
        ciudad,
        provincia,
        barrio: barrio || null,
        verificado,
      });

      if (!syncResult.ok && !syncResult.skipped) {
        console.warn("No se pudo sincronizar prestador con Toori/Mica", syncResult.error, syncResult.raw);
      }

      const redirectTo = enBolivia ? "pagoInicial" : "Home";
      Alert.alert("Registro completado", "Tus datos se guardaron correctamente.", [
        { text: "OK", onPress: () => navigation.navigate(redirectTo as any) },
      ]);
    } catch (err) {
      Alert.alert("Error", "Ocurrió un error al registrar tus datos.");
    } finally {
      setLoading(false);
    }
  };

  const elegirContratar = async () => {
    try {
      setProcesandoModal(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { Alert.alert("Error", "No se pudo obtener el usuario."); return; }
      const { error } = await supabase.from("usuarios").update({
        rol: "user", perfil_completo: true, dni_verificado: true,
      }).eq("id", user.id);
      if (error) { Alert.alert("Error", "No se pudo actualizar el perfil."); return; }
      setMostrarModal(false);
      navigation.reset({ index: 0, routes: [{ name: "Home" as any }] });
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema.");
    } finally {
      setProcesandoModal(false);
    }
  };

  return (
    <ImageBackground source={require("../assets/fondoRegister.png")} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            <Modal visible={mostrarModal} transparent animationType="fade">
              <View style={styles.modalContainer}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>¿Qué buscas?</Text>
                  <TouchableOpacity style={styles.modalButton} onPress={elegirContratar} disabled={procesandoModal}>
                    <Text style={styles.modalButtonText}>{procesandoModal ? "Procesando..." : "Contratar"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalSecondary]} onPress={() => setMostrarModal(false)}>
                    <Text style={styles.modalSecondaryText}>Ofrecer servicio</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.overlay}>
              <Text style={styles.title}>Registro</Text>

              {/* Foto de perfil */}
              <Text style={styles.label}>Foto de perfil</Text>
              <TouchableOpacity onPress={seleccionarFotoPerfil} style={styles.fotoButton}>
                <Text style={styles.fotoButtonText}>Seleccionar foto</Text>
              </TouchableOpacity>
              {fotoPerfil && (
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Image source={{ uri: fotoPerfil }} style={styles.avatarPreview} />
                </View>
              )}

              {/* Campos básicos */}
              <TextInput placeholder="Nombre completo" placeholderTextColor="#4e827d" value={nombre} onChangeText={setNombre} style={styles.input} />
              <TextInput placeholder="Edad" placeholderTextColor="#4e827d" value={edad} onChangeText={setEdad} keyboardType="numeric" style={styles.input} />
              <TextInput placeholder="Número de celular (con código de país)" placeholderTextColor="#4e827d" value={numeroCelular} onChangeText={setNumeroCelular} keyboardType="phone-pad" style={styles.input} />
              <TextInput placeholder="DNI" placeholderTextColor="#4e827d" value={dni} onChangeText={setDni} keyboardType="numeric" style={styles.input} />

              {/* Ubicación */}
              <TextInput placeholder="Provincia" placeholderTextColor="#4e827d" value={provincia} onChangeText={setProvincia} style={styles.input} />
              <TextInput placeholder="Ciudad" placeholderTextColor="#4e827d" value={ciudad} onChangeText={setCiudad} style={styles.input} />
              <TextInput placeholder="Barrio (opcional)" placeholderTextColor="#4e827d" value={barrio} onChangeText={setBarrio} style={styles.input} />

              {/* Categorías con buscador */}
              <Text style={styles.label}>Especialidad (hasta 3)</Text>
              <View style={{ width: "100%", zIndex: 10 }}>
                <TextInput
                  placeholder="Buscar categoría..."
                  placeholderTextColor="#4e827d"
                  value={busquedaCategoria}
                  onChangeText={(t) => { setBusquedaCategoria(t); setMostrarDropdown(true); }}
                  onFocus={() => setMostrarDropdown(true)}
                  style={styles.input}
                />
                {mostrarDropdown && categoriasFiltradas.length > 0 && (
                  <View style={styles.dropdown}>
                    {categoriasFiltradas.slice(0, 8).map((cat) => (
                      <TouchableOpacity key={cat} onPress={() => agregarCategoria(cat)} style={styles.dropdownItem}>
                        <Text style={styles.dropdownText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.tagsContainer}>
                {categoriasSeleccionadas.map((cat) => (
                  <View key={cat} style={styles.tag}>
                    <Text style={styles.tagText}>{cat}</Text>
                    <TouchableOpacity onPress={() => quitarCategoria(cat)}>
                      <Text style={styles.tagClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TextInput placeholder="Años de antigüedad (ej: 2,5)" placeholderTextColor="#4e827d" value={antiguedad} onChangeText={setAntiguedad} keyboardType="numeric" style={styles.input} />

              {/* Matrícula */}
              <Text style={styles.label}>Matrícula (opcional, hasta 3 archivos)</Text>
              <View style={styles.archivosBotones}>
                <TouchableOpacity style={styles.archivoBtn} onPress={() => seleccionarArchivos(matriculaArchivos, setMatriculaArchivos, "imagen")}>
                  <Text style={styles.archivoBtnText}>📷 Imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.archivoBtn} onPress={() => seleccionarArchivos(matriculaArchivos, setMatriculaArchivos, "pdf")}>
                  <Text style={styles.archivoBtnText}>📄 PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.archivosPreview}>
                {matriculaArchivos.map((a, i) => (
                  <View key={i} style={styles.archivoChip}>
                    <Text style={styles.archivoChipText} numberOfLines={1}>{a.nombre}</Text>
                    <TouchableOpacity onPress={() => setMatriculaArchivos(matriculaArchivos.filter((_, idx) => idx !== i))}>
                      <Text style={styles.tagClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Antecedentes */}
              <Text style={styles.label}>Antecedentes penales (opcional, hasta 3 archivos)</Text>
              <View style={styles.archivosBotones}>
                <TouchableOpacity style={styles.archivoBtn} onPress={() => seleccionarArchivos(antecedentesArchivos, setAntecedentesArchivos, "imagen")}>
                  <Text style={styles.archivoBtnText}>📷 Imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.archivoBtn} onPress={() => seleccionarArchivos(antecedentesArchivos, setAntecedentesArchivos, "pdf")}>
                  <Text style={styles.archivoBtnText}>📄 PDF</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.archivosPreview}>
                {antecedentesArchivos.map((a, i) => (
                  <View key={i} style={styles.archivoChip}>
                    <Text style={styles.archivoChipText} numberOfLines={1}>{a.nombre}</Text>
                    <TouchableOpacity onPress={() => setAntecedentesArchivos(antecedentesArchivos.filter((_, idx) => idx !== i))}>
                      <Text style={styles.tagClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Términos */}
              <View style={styles.switchContainer}>
                <Switch value={aceptaTerminos} onValueChange={setAceptaTerminos} trackColor={{ false: "#767577", true: "#E8C547" }} thumbColor={aceptaTerminos ? "#A4D4AE" : "#f4f3f4"} />
                <TouchableOpacity onPress={() => Linking.openURL("https://inicio.tooriserviciosya.info/Terminos-y-condiciones.html")}>
                  <Text style={[styles.switchLabel, { textDecorationLine: "underline" }]}>Acepto los términos y condiciones</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Guardando..." : "Finalizar Registro"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    marginTop: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: { fontSize: 24, color: "#4A7C84", fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "600", color: "#4A7C84", marginBottom: 6, alignSelf: "flex-start" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    fontSize: 16,
    borderColor: "#4b4e6d",
    borderWidth: 1,
    width: "100%",
  },
  button: {
    backgroundColor: "#4b4e6d",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchContainer: { flexDirection: "row", alignItems: "center", marginVertical: 12, width: "100%" },
  switchLabel: { marginLeft: 12, flex: 1, fontSize: 14, color: "#4A7C84" },
  fotoButton: { backgroundColor: "#4b4e6d", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10 },
  fotoButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  avatarPreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "#4b4e6d" },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4b4e6d",
    borderRadius: 10,
    width: "100%",
    maxHeight: 200,
    zIndex: 99,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownText: { fontSize: 15, color: "#333" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10, width: "100%" },
  tag: { flexDirection: "row", alignItems: "center", backgroundColor: "#4b4e6d", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tagText: { color: "#fff", fontSize: 13 },
  tagClose: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  archivosBotones: { flexDirection: "row", gap: 10, marginBottom: 8, width: "100%" },
  archivoBtn: { flex: 1, backgroundColor: "#4b4e6d", padding: 10, borderRadius: 10, alignItems: "center" },
  archivoBtnText: { color: "#fff", fontSize: 14 },
  archivosPreview: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, width: "100%" },
  archivoChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8f4f8", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, maxWidth: "48%" },
  archivoChipText: { color: "#4b4e6d", fontSize: 12, flex: 1 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#4A7C84", marginBottom: 24 },
  modalButton: { width: "100%", backgroundColor: "#4b4e6d", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalSecondary: { backgroundColor: "#F1F1F1" },
  modalSecondaryText: { color: "#4A7C84", fontSize: 16, fontWeight: "600" },
});
