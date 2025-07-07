import type React from "react";
import { forwardRef } from "react";
import {
  TextInput,
  type TextInputProps,
  View,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";

// Definición de las propiedades del componente CustomTextInput
type CustomTextInputProps = TextInputProps & {
  containerStyle?: ViewStyle; // Estilo personalizado para el contenedor
  inputStyle?: TextStyle; // Estilo personalizado para el TextInput
  prependComponent?: React.ReactNode; // Componente a mostrar antes del TextInput
  appendComponent?: React.ReactNode; // Componente a mostrar después del TextInput
};

// Componente CustomTextInput que envuelve TextInput de React Native
const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>(
  (
    {
      containerStyle,
      inputStyle,
      prependComponent,
      appendComponent,
      ...rest // Resto de propiedades de TextInput
    },
    ref, // Referencia para el TextInput
  ) => {
    return (
      // Contenedor principal del componente
      <View style={[styles.container, containerStyle]}>
        {/* Componente opcional a mostrar antes del TextInput */}
        {prependComponent && (
          <View style={styles.iconWrapper}>{prependComponent}</View>
        )}

        {/* Componente TextInput con estilos personalizados */}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor="#999" // Color del placeholder
          {...rest} // Pasa todas las demás propiedades al TextInput
        />

        {/* Componente opcional a mostrar después del TextInput */}
        {appendComponent && (
          <View style={styles.iconWrapper}>{appendComponent}</View>
        )}
      </View>
    );
  },
);

export default CustomTextInput;

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // Disposición horizontal
    alignItems: "center", // Centrado vertical
    borderRadius: 10, // Bordes redondeados
    borderColor: "#ccc", // Color del borde
    borderWidth: 1, // Ancho del borde
    backgroundColor: "#fff", // Color de fondo
    paddingHorizontal: 12, // Padding horizontal
    height: 48, // Altura fija
  },
  iconWrapper: {
    paddingHorizontal: 4, // Espaciado horizontal para los iconos
    justifyContent: "center", // Centrado vertical
    alignItems: "center", // Centrado horizontal
  },
  input: {
    flex: 1, // Ocupa todo el espacio disponible
    fontSize: 16, // Tamaño de fuente
    color: "#000", // Color del texto
    paddingVertical: 0, // Ajuste para alineación en Android
    paddingHorizontal: 8, // Padding horizontal
  },
});
