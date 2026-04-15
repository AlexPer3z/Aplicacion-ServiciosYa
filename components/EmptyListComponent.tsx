import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const colors = {
  gray: "#767577",
  textPrimary: "#1A1A1A",
  textSecondary: "#5E5E5E",
};

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  title?: string;
  message?: string;
};

export default function EmptyListComponent({
  icon = "inbox",
  title = "No hay elementos",
  message = "No se encontraron resultados.",
}: Props) {
  return (
    <View style={styles.emptyContainer}>
      <Feather name={icon} size={40} color={colors.gray} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
