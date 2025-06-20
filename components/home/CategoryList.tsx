import React, { useCallback, useMemo } from "react";
import { RefreshControl } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { CategorySection } from "./CategorySection";
import { categoriasPorSeccion } from "../../lib/utils/categorias";
import { useServicesCount } from "../../lib/hooks/useServices";
import { useUserSettings } from "../../lib/hooks/useUserSettings";

interface CategoryListProps {
  busqueda: string;
  onCategoryPress: (category: string) => void;
  isUserRestricted: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

const AnimatedScrollView = Animated.ScrollView;

export const CategoryList = ({
  busqueda,
  onCategoryPress,
  isUserRestricted,
  refreshing,
  onRefresh,
}: CategoryListProps) => {
  const {
    servicios: { data: conteos, isFetching },
    refetch,
  } = useServicesCount();
  const { settings } = useUserSettings();
  const showAllCategories = settings?.showAllCategories ?? true;

  const conteosMap = useMemo(() => {
    return conteos.reduce((acc: Record<string, number>, item) => {
      acc[item.categoria] = item.count;
      return acc;
    }, {});
  }, [conteos]);

  const filteredCategorias = useMemo(() => {
    return Object.entries(categoriasPorSeccion).reduce(
      (acc, [seccion, categorias]) => {
        acc[seccion] = categorias.filter((cat) => {
          const count = conteosMap[cat] || 0;
          return (
            (showAllCategories || count > 0) &&
            cat.toLowerCase().includes(busqueda.toLowerCase())
          );
        });
        return acc;
      },
      {} as Record<string, string[]>,
    );
  }, [showAllCategories, busqueda, conteosMap]);

  const handleOnRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <AnimatedScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          colors={["#00B8A9", "#FFA13C"]}
          refreshing={isFetching}
          onRefresh={handleOnRefresh}
        />
      }
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
    >
      {Object.entries(filteredCategorias).map(
        ([seccion, categorias], index) => {
          // Skip rendering empty sections
          if (categorias.length === 0) return null;

          return (
            <Animated.View
              key={seccion}
              entering={FadeInDown.delay(index * 100)
                .springify()
                .damping(14)}
              layout={Layout.springify()}
            >
              <CategorySection
                title={seccion}
                categories={categorias}
                conteos={conteosMap}
                onCategoryPress={onCategoryPress}
                disabled={isUserRestricted}
              />
            </Animated.View>
          );
        },
      )}
    </AnimatedScrollView>
  );
};
