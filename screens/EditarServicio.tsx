import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { categoriasDisponibles } from "../lib/utils/categorias";
import LocationInput from "../components/location/LocationInput";
import type { LocationItem } from "../types/location";
import { withModalProvider } from "../components/sheet/withModalProvider";
import { withDropDownProvider } from "../components/forms/withDropDownProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { locationQueryString } from "../lib/utils/location";
import showToast from "../lib/toast";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import BotonVolver from "../components/BotonVolver";

type Props = NativeStackScreenProps<MainStackParamList, "EditarServicio">;

function EditarServicio({ route, navigation }: Props) {
  const { servicio } = route.params;

  const [titulo, setTitulo] = useState(servicio.titulo);
  const [descripcion, setDescripcion] = useState(servicio.descripcion);
  const [precio, setPrecio] = useState(servicio.precio);
  const [horario, setHorario] = useState(servicio.horario);
  const [categoria, setCategoria] = useState(servicio.categoria);

  const handleActualizar = async () => {
    if (!titulo || !descripcion || !precio || !horario || !categoria) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    const { error } = await supabase
      .from("servicios")
      .update({
        titulo,
        descripcion,
        precio,
        horario,
        categoria,
      })
      .eq("id", servicio.id);

    if (error) {
      Alert.alert("Error al actualizar", error.message);
    } else {
      Alert.alert("Éxito", "Servicio actualizado");
      navigation.goBack();
    }
  };

  const handleUpdateLocation = async (location: LocationItem) => {
    const { error } = await supabase
      .from("servicios")
      .update({
        location: locationQueryString(location.lat, location.lng),
      })
      .eq("id", servicio.id);

    if (error) {
      showToast.error(
        "Ocurrio un error",
        "No se pudo actualizar la ubicación del servicio",
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E8FAF7" }}>
      <View
        style={[styles.background,styles.scrollContent]} 
      >
        <BotonVolver />
        <View style={styles.card}>
          <KeyboardAwareScrollView>
            <Text style={styles.titulo}>Editar Servicio</Text>

            <TextInput
              style={styles.input}
              placeholder="Título del servicio"
              value={titulo}
              onChangeText={setTitulo}
              placeholderTextColor="#b6e1ea"
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Descripción (máx. 300 caracteres)"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={300}
              placeholderTextColor="#b6e1ea"
            />
            <LocationInput
              onChange={(value) => handleUpdateLocation(value)}
              initialValue={{ lat: servicio.latitude, lng: servicio.longitude }}
            />

            <TextInput
              style={styles.input}
              placeholder="Precio"
              keyboardType="numeric"
              value={precio}
              onChangeText={setPrecio}
              placeholderTextColor="#b6e1ea"
            />

            <TextInput
              style={styles.input}
              placeholder="Horario disponible"
              value={horario}
              onChangeText={setHorario}
              placeholderTextColor="#b6e1ea"
            />

            <Text style={styles.label}>Categoría</Text>
            <ScrollView
              style={styles.categoriasScroll}
              contentContainerStyle={styles.categoriasContainer}
            >
              {categoriasDisponibles.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoriaBtn,
                    categoria === cat && styles.categoriaSeleccionada,
                  ]}
                  onPress={() => setCategoria(cat)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.categoriaText,
                      categoria === cat && styles.categoriaTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.boton}
              onPress={handleActualizar}
              activeOpacity={0.85}
            >
              <Text style={styles.botonTexto}>Guardar Cambios</Text>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default withDropDownProvider(withModalProvider(EditarServicio));

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E8FAF7", // Turquesa clarito
  },
  scrollContent: {
    paddingVertical: 24,
    alignItems: "center",
  },
  card: {
    marginTop:50,
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: "#19D4C6",
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  titulo: {
    fontSize: 27,
    fontWeight: "900",
    color: "#19D4C6",
    marginBottom: 22,
    textAlign: "center",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#F6FCFC",
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1.2,
    borderColor: "#b6e1ea",
    marginBottom: 14,
    color: "#222",
  },
  label: {
    marginBottom: 9,
    fontWeight: "700",
    color: "#FFA13C",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  categoriaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#F6FCFC",
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#b6e1ea",
    margin: 4,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoriaSeleccionada: {
    backgroundColor: "#FFA13C",
    borderColor: "#FFA13C",
  },
  categoriaText: {
    color: "#222",
    fontWeight: "500",
    fontSize: 15,
  },
  categoriaTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  boton: {
    backgroundColor: "#19D4C6",
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#19D4C6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },
  botonTexto: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  categoriasScroll: {
    maxHeight: 180, // Altura máxima visible del scroll de categorías
    marginBottom: 20,
  },
});
