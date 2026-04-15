
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions, // Keep platform for potential future use
} from "react-native";

// 1. Import the new component
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker";
import { withModalProvider } from "../components/sheet/withModalProvider";
import LocationInput from "../components/location/LocationInput";
import { withDropDownProvider } from "../components/forms/withDropDownProvider";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { categoriasDisponibles } from "../lib/utils/categorias";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LocationItem } from "../types/location";
import { locationQueryString } from "../lib/utils/location";
import type { MainStackParamList } from "../types/navigation";
import BotonVolver from "../components/BotonVolver";
import SelectDropdown from 'react-native-select-dropdown'
import GenericAutocomplete from "../components/GenericAutocomplete";
import vexo from "../lib/vexo";
import { getUserID } from "../store/authStore";
import showToast from "../lib/toast";

type Props = NativeStackScreenProps<MainStackParamList, "OfrecerServicio">;

function OfrecerServicio({ navigation }: Props) {
  // ... (all your state and functions remain exactly the same)
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [horario, setHorario] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState<LocationItem>();

  const handleSubmit = async () => {
    if (
      !titulo ||
      !categoria ||
      !horario ||
      !precio ||
      !descripcion ||
      !ubicacion
    ) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    const userId = getUserID();

    try {
      // 🔹 Si el usuario ya pagó, crear el servicio
      const servicio = {
        user_id: userId,
        titulo,
        categoria,
        horario,
        precio: Number(precio),
        descripcion,
        location: locationQueryString(ubicacion.lat, ubicacion.lng),
        country: ubicacion.isoCountryCode,
      };

      const { data, error } = await supabase.from("servicios").insert(servicio);
      vexo.servicio(servicio.titulo);

      if (error) {
        console.error("Error de Supabase:", error);
        throw new Error(error.message || "Error desconocido de Supabase");
      }
      showToast.success("Éxito", "Servicio creado correctamente.");
      navigation.goBack();
    } catch (err: any) {
      console.error("Error al insertar el servicio:", err.message);
      Alert.alert("Error", `No se pudo crear el servicio: ${err.message}`);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E8FAF7" }}>
      <BotonVolver />
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled={true}
        extraScrollHeight={Platform.OS === "ios" ? 20 : 0} // Optional: fine-tune scroll distance
        enableOnAndroid={true}
      >
        <Text style={[styles.title, { marginTop: 20 }]}>Publicar un Servicio</Text>

        <View style={styles.inputContainer}>
          {/* All your inputs remain the same */}
          <Text style={styles.label}>Título del servicio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Electricista a domicilio"
            placeholderTextColor="#888"
            value={titulo}
            onChangeText={setTitulo}
          />

          <GenericAutocomplete<string>
            label="Categoría"
            data={categoriasDisponibles}
            onSelectItem={(value) => setCategoria(value ?? "")}
            placeholder="Ej: Categoria"
            itemToDropdownItem={(value) => ({
              id: value,
              title: value,
              payload: value,
            })}
            dropdownProps={{
              InputComponent: TextInput,
              flatListProps: undefined,
              suggestionsListContainerStyle: undefined,
              suggestionsListMaxHeight: Dimensions.get('window').height * 0.4
            }}
          />

          <Text style={styles.label}>Horario</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Lunes a Viernes de 9 a 18hs"
            placeholderTextColor="#888"
            value={horario}
            onChangeText={setHorario}
          />

          <Text style={styles.label}>Precio</Text>
          <TextInput
            style={styles.input}
            placeholder="Precio aprox, Ej: $5000 por hora"
            placeholderTextColor="#888"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />

          <LocationInput onChange={(value) => setUbicacion(value)} />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Breve descripción (máx 300 caracteres)"
            placeholderTextColor="#888"
            value={descripcion}
            onChangeText={(text) => {
              if (text.length <= 300) setDescripcion(text);
            }}
            multiline
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Publicar Servicio</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default withDropDownProvider(withModalProvider(OfrecerServicio));

const styles = StyleSheet.create({
  // 3. Adjust the styles. The main container now handles the background.
  container: {
    flex: 1,
    backgroundColor: "#E8FAF7",
  },
  // The content container handles padding and growth.
  scrollContentContainer: {
    padding: 20,
    marginBottom: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
    color: "#19D4C6",
    letterSpacing: 0.5,
  },
  // ... rest of the styles are unchanged
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    elevation: 8,
    shadowColor: "#19D4C6",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: "#19D4C6",
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8ECE8",
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#C8ECE8",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#222",
    fontSize: 17,
    backgroundColor: "#FAFAFA",
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: "#FFA13C", // Naranja
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#FFA13C",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  dropdownButtonStyle: {
    height: 50,
    width: "100%",
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
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
