import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

import { CategoryItem } from "./CategoryItem";

interface CategorySectionProps {
  title: string;
  categories: string[];
  conteos: Record<string, number>;
  onCategoryPress: (category: string) => void;
  disabled?: boolean;
  iconUrls?: Record<string, string | null | undefined>;
}

export const CategorySection = ({
  title,
  categories,
  conteos,
  onCategoryPress,
  disabled,
  iconUrls,
}: CategorySectionProps) => {
  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
  horizontal
  data={categories}
  extraData={categories}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <CategoryItem
      categoria={item}
      count={conteos[item] || 0}
      onPress={() => onCategoryPress(item)}
      disabled={disabled}
      iconoUrl={iconUrls?.[item]}
    />
  )}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}

  // 🔥 CLAVES
  initialNumToRender={4}
  maxToRenderPerBatch={4}
  windowSize={2}
  removeClippedSubviews={true}
  updateCellsBatchingPeriod={50}
/>


    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: {
    fontWeight: "900",
    color: "#333",
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 26,
    borderRadius: 10,
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  scrollContent: { paddingLeft: 16 },
});
// {
//   "backgroundColor": "white",
//   "paddingVertical": 6,
//   "paddingHorizontal": 26,
//   "borderRadius": 10,
//   "marginTop": 20,
//   "marginLeft": 3,
//   "alignSelf": "flex-start",
//   "marginBottom": 8,
//   "elevation": 3,
//   "shadowOffset": {
//     "width": 0,
//     "height": 1
//   },
//   "shadowOpacity": 0.2,
//   "shadowRadius": 2,
//   "fontWeight": 900,
//   "color": "#333"
// }
