import React, { useCallback, useMemo } from "react";
import {
  RefreshControl,
  Text,
  View,
  SectionList,
  StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";

import { CategorySection } from "./CategorySection";
import { categoriasPorSeccion } from "../../lib/utils/categorias";
import { useServicesCount } from "../../lib/hooks/useServices";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import LoadingView from "../../components/LoadingView";

interface CategoryListProps {
  busqueda: string;
  onCategoryPress: (category: string) => void;
  isUserRestricted: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

const AnimatedSectionList =
  Animated.createAnimatedComponent(SectionList);

export const CategoryList = ({
  busqueda,
  onCategoryPress,
  isUserRestricted,
  refreshing,
  onRefresh,
}: CategoryListProps) => {
  const { servicios: serviciosCount } = useServicesCount();
  const conteos = serviciosCount?.data;
  const isLoading = serviciosCount?.isLoading;
  const isFetching = serviciosCount?.isFetching;
  const error = serviciosCount?.error;
  const refetch = serviciosCount?.refetch;

  const { settings } = useUserSettings();
  const showAllCategories = settings?.showAllCategories ?? true;

  // 🔹 Map categoria → cantidad
  const conteosMap = useMemo(() => {
    return (conteos ?? []).reduce((acc: Record<string, number>, item) => {
      acc[item.categoria] = item.count;
      return acc;
    }, {});
  }, [conteos]);

  // 🔹 Filtrar categorías
  const filteredCategorias = useMemo(() => {
    return Object.entries(categoriasPorSeccion).reduce(
      (acc, [seccion, categorias]) => {
        const filtradas = categorias.filter((cat) => {
          const count = conteosMap[cat] || 0;
          return (
            (showAllCategories || count > 0) &&
            cat.toLowerCase().includes(busqueda.toLowerCase())
          );
        });

        if (filtradas.length > 0) {
          acc.push({
            title: seccion,
            data: [filtradas], // ⚠️ IMPORTANTE
          });
        }

        return acc;
      },
      [] as { title: string; data: string[][] }[]
    );
  }, [busqueda, conteosMap, showAllCategories]);

  const handleOnRefresh = useCallback(() => {
    refetch?.();
    onRefresh();
  }, [refetch, onRefresh]);

  if (isLoading) {
    return <LoadingView withNavBarMargin />;
  }

  if (error instanceof Error) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: "red", textAlign: "center" }}>
          Error al cargar las categorías: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <AnimatedSectionList
      sections={filteredCategorias}
      keyExtractor={(_, index) => index.toString()}

      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}

      renderItem={({ item, section }) => (
        <CategorySection
          title={section.title}
          categories={item}
          conteos={conteosMap}
          onCategoryPress={onCategoryPress}
          disabled={isUserRestricted}
        />
      )}

      refreshControl={
        <RefreshControl
          colors={["#00B8A9", "#fe971a"]}
          refreshing={isFetching || refreshing}
          onRefresh={handleOnRefresh}
        />
      }

      contentContainerStyle={{ paddingBottom: 120 }}

      // 🔥 VIRTUALIZACIÓN REAL
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
      removeClippedSubviews
    />
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
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
  },
});
