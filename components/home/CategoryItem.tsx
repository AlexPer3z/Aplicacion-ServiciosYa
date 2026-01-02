import React from "react";
import { Text, TouchableOpacity, StyleSheet, Image, View } from "react-native";
import { iconosCategoria } from "../../lib/utils/categorias";

interface CategoryIconProps {
  categoria: string;
}

export const CategoryIcon = ({ categoria }: CategoryIconProps) => {
  const icono = iconosCategoria[categoria];
  return icono ? <View renderToHardwareTextureAndroid={false}>
  <Image source={icono} style={styles.iconImage} />
</View>
 : null;
};

interface CategoryItemProps {
  categoria: string;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}

export const CategoryItem = ({
  categoria,
  count,
  onPress,
  disabled,
}: CategoryItemProps) => (
  <TouchableOpacity
    style={[styles.container, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.iconContainer}>
      <CategoryIcon categoria={categoria} />
    </View>
    <Text style={styles.name}>{categoria}</Text>
    {count > 0 && <Text style={styles.count}>{count} ofertas</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
  alignItems: "center",
  backgroundColor: "#fafafa",
  borderRadius: 12,
  elevation: 4,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  marginRight: 12,
  marginVertical: 8,
  minWidth: 120,
  maxWidth: 160,
  height: 180,
},
  disabled: { opacity: 0.6 },
  iconContainer: { marginBottom: 8 },
  iconImage: { width: 155 , height: 100, resizeMode: "cover" , borderRadius: 12, borderBottomLeftRadius:0, borderBottomRightRadius:0 },
  name: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
    fontWeight: "700",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  count: { fontSize: 12, color: "#FF6B35", fontWeight: "900", marginTop: 4, marginBottom:8  },
  iconContainer: {
  marginBottom: 8,
  width: 155,
  height: 100,
},

});
