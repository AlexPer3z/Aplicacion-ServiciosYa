import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

/**
 * Componente ModalFooter renderiza botones de acción o un indicador de carga para diálogos modals.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isLoading - Si es true, muestra un indicador de carga en lugar de botones.
 * @param {function} props.onCancel - Función de callback invocada cuando se presiona el botón de cancelar.
 * @param {function} props.onSubmit - Función de callback invocada cuando se presiona el botón principal.
 * @param {Object} [props.buttonContainerStyle] - Estilo opcional para el contenedor de botones.
 * @param {Object} [props.primaryButtonStyle] - Estilo opcional para el contenedor del botón principal.
 * @param {Object} [props.primaryButtonTextStyle] - Estilo opcional para el texto del botón principal.
 * @param {Object} [props.cancelButtonStyle] - Estilo opcional para el contenedor del botón de cancelar.
 * @param {Object} [props.cancelButtonTextStyle] - Estilo opcional para el texto del botón de cancelar.
 * @param {string} [props.activityIndicatorColor] - Color opcional para el indicador de carga.
 * @returns {JSX.Element} El componente ModalFooter renderizado.
 */
const ModalFooter = ({
  isLoading,
  onCancel,
  onSubmit,
  buttonContainerStyle,
  primaryButtonStyle,
  primaryButtonTextStyle,
  cancelButtonStyle,
  cancelButtonTextStyle,
  activityIndicatorColor,
  cancelButtonText = 'Cancelar',
  submitButtonText = 'Enviar',
}) => (
  <View style={[styles.buttonContainer, buttonContainerStyle]}>
    {isLoading ? (
      <ActivityIndicator size="large" color={activityIndicatorColor || "#FF7E5F"} />
    ) : (
      <>
        <TouchableOpacity style={[styles.botonCancelarContainer, cancelButtonStyle]} onPress={onCancel}>
          <Text style={[styles.cancelar, cancelButtonTextStyle]}>{cancelButtonText}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.botonPrimaryContainer, primaryButtonStyle]} onPress={onSubmit}>
          <Text style={[styles.botonPrimaryText, primaryButtonTextStyle]}>{submitButtonText}</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  botonPrimaryContainer: {
    marginTop: 20,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonCancelarContainer: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelar: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
});

export default ModalFooter;