import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  SectionList
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

// Components & Utils
import { CategorySection } from "./CategorySection";
import LoadingView from "../../components/LoadingView";
import { categoriasPorSeccion } from "../../lib/utils/categorias";

// Hooks
import { useServicesCount } from "../../lib/hooks/useServices";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { withSuspense } from "../withSuspense";
import { useHomeEventsStore } from "../../store/homeEventsStore";

interface CategoryListProps {
  busqueda: string;
  onCategoryPress: (category: string) => void;
  isUserRestricted: boolean;
  // Removed 'refreshing' and 'onRefresh' as they were not used (logic is internal)
}

const AnimatedSectionList =
  Animated.createAnimatedComponent(SectionList);

const CategoryList = ({
  busqueda,
  onCategoryPress,
  isUserRestricted,
}: CategoryListProps) => {
  // 1. Hooks & State
  const { servicios: servicesQuery } = useServicesCount();
  const { settings } = useUserSettings();
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const setHomeDataReady = useHomeEventsStore(s => s.setHomeDataReady);

  // 2. Data Destructuring
  const {
    data: conteosData,
    isLoading,
    error,
    refetch,
    isRefetching
  } = servicesQuery || {};

  const showAllCategories = settings?.showAllCategories ?? true;
  const isRefreshing = (isRefetching ?? false) && isPullingToRefresh;

  // 3. Derived State (Memoization)

  // Create a map for O(1) access to counts
  const conteosMap = useMemo(() => {
    if (!conteosData) return {};
    return conteosData.reduce((acc: Record<string, number>, item: any) => {
      acc[item.categoria] = item.count;
      return acc;
    }, {});
  }, [conteosData]);

  // Filter categories based on search and settings
  const filteredSections = useMemo(() => {
    const searchLower = busqueda.toLowerCase();

    return Object.entries(categoriasPorSeccion).reduce(
      (acc, [seccion, categorias]) => {
        const activeCategories = categorias.filter((cat) => {
          const count = conteosMap[cat] || 0;
          const matchesSearch = cat.toLowerCase().includes(searchLower);
          const hasItemsOrShowAll = showAllCategories || count > 0;

          return matchesSearch && hasItemsOrShowAll;
        });

        if (activeCategories.length > 0) {
          acc.push({
            title: seccion,
            data: [activeCategories], // ⚠️ IMPORTANTE
          });
        }
        return acc;
      },
      [] as { title: string; data: string[][] }[]
    );
  }, [busqueda, conteosMap, showAllCategories]);

  // 4. Handlers
  const handleOnRefresh = useCallback(async () => {
    if (!refetch) return;
    try {
      setIsPullingToRefresh(true);
      await refetch();
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setIsPullingToRefresh(false);
    }
  }, [refetch]);

  // 5. Render Logic
  if (isLoading) {
    return <LoadingView withNavBarMargin />;
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Error al cargar las categorías: {errorMessage}
        </Text>
      </View>
    );
  }

  useEffect(() => {
    setHomeDataReady(true);
  }, []);

  return (
    <SectionList
      sections={filteredSections}
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
          refreshing={isRefreshing}
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

export default withSuspense(
  CategoryList,
  <LoadingView withNavBarMargin />,
);

// 6. Styles
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  centerContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});