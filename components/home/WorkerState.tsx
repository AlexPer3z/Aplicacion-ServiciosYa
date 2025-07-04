import { View, Text, StyleSheet, Pressable } from "react-native";
import type { WorkerStatus } from "../../types/worker";
import { memo, useCallback, useEffect, useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import SelectWorkStateSheetView from "../workers/SelectWorkStateSheetView";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { workerStatusQueryOptions } from "../../lib/queryOptions";
import { supabase } from "../../lib/supabase";
import { getUserFromClient } from "../../lib/utils/user";
import type { StyleProp, ViewStyle } from "react-native";

type Labels = {
  [P in WorkerStatus]: string;
};

const workStatusLabels: Labels = {
  ONLINE: "En línea",
  OFFLINE: "Desconectado",
  BUSY: "Ocupado",
  ON_BREAK: "En descanso",
};

const statusColors: Record<WorkerStatus, string> = {
  ONLINE: "#43D675", // Green
  OFFLINE: "#F44336", // Red
  BUSY: "#FFB300", // Amber
  ON_BREAK: "#42A5F5", // Blue
};

function WorkState({ style }: { style?: StyleProp<ViewStyle> }) {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    ...workerStatusQueryOptions,
    initialData: "OFFLINE",
  });
  const color = statusColors[status];

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    const updateLastSeen = async () => {
      if (status === "ONLINE") {
        const user = getUserFromClient(queryClient);
        if (user?.id) {
          const { error } = await supabase.from("workers").upsert(
            {
              user_id: user.id,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          if (error) {
            // Optionally handle/log error
            console.error("Failed to update last_seen_at:", error);
          }
        }
      }
    };

    const interval = setInterval(updateLastSeen, 3 * 60 * 1000); // 3 minutes

    // Run immediately on mount if ONLINE
    updateLastSeen();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, queryClient]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          { borderColor: color },
          pressed && { opacity: 0.9 },
          style,
        ]}
        onPress={handlePresentModalPress}
      >
        <View style={styles.labelContainer}>
          <Text style={styles.updateLabel}>Actualizar disponibilidad</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.circle, { backgroundColor: color }]} />
          <Text style={styles.text}>{workStatusLabels[status]}</Text>
        </View>
      </Pressable>
      <BottomSheetModal ref={bottomSheetModalRef}>
        <SelectWorkStateSheetView />
      </BottomSheetModal>
    </>
  );
}

export default memo(WorkState);

const styles = StyleSheet.create({
  container: {
    // flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA13C",
    borderRadius: 16,
    // borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: "space-around",
    flex: 1,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 3,
    borderWidth: 2,
    borderColor: "white",
  },
  text: {
    fontSize: 16,
    color: "white",
    fontWeight: "700",
    marginRight: 3,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  labelContainer: {
    alignItems: "flex-start",
  },
  updateLabel: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.9,
    marginLeft: 2,
    marginBottom: 2,
    fontWeight: "500",
  },
});
