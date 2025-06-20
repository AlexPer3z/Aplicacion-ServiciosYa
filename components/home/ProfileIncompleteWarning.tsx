import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileIncompleteWarningProps {
  onPress: () => void;
}

export const ProfileIncompleteWarning = ({
  onPress,
}: ProfileIncompleteWarningProps) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Ionicons
        name="alert-circle-outline"
        size={28}
        color="#ff4d4d"
        style={styles.icon}
      />
      <Text style={styles.text}>
        Para usar todas las funciones, completa tu perfil.
      </Text>
    </View>
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Completar perfil</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff0f0",
    borderLeftWidth: 5,
    borderLeftColor: "#ff4d4d",
    padding: 15,
    margin: 16,
    borderRadius: 10,
    elevation: 3,
  },
  content: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  icon: { marginRight: 10 },
  text: { flex: 1, color: "#333", fontSize: 15, lineHeight: 20 },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
