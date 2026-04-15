import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const DniPendingWarning = () => (
  <View style={styles.container}>
    <Ionicons
      name="document-text-outline"
      size={24}
      color="#333"
      style={styles.icon}
    />
    <Text style={styles.text}>
      Verificación de DNI pendiente. Se te notificará al ser aprobado (máx. 24h
      hábiles).
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fefefe",
    borderLeftWidth: 4,
    borderLeftColor: "#ffd700",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  icon: { marginRight: 8 },
  text: { flex: 1, color: "#333", fontSize: 14 },
});
