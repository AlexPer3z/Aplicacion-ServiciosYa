import { Text, StyleSheet, Pressable, View } from "react-native";
import colors from "../../lib/constants/colors";
import SheetContainer from "../sheet/SheetContainer";
import type { WorkerStatus, WorkerStatusLabels } from "../../types/worker";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import {
  workerStatusQueryOptions,
} from "../../lib/queryOptions";
import {
  getLocationParamsFromClient,
  locationQueryString,
} from "../../lib/utils/location";
import showToast from "../../lib/toast";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { getUserFromClient } from "../../lib/utils/user";

const workStatusLabels: WorkerStatusLabels = {
  ONLINE: "En línea",
  OFFLINE: "Desconectado",
  BUSY: "Ocupado",
  ON_BREAK: "En descanso",
};

const workStatusDescriptions: Record<WorkerStatus, string> = {
  ONLINE: "Disponible para recibir nuevos trabajos.",
  OFFLINE: "No visible para clientes, no recibirá solicitudes.",
  BUSY: "Actualmente atendiendo un servicio.",
  ON_BREAK: "Tomando un descanso, no recibirá nuevas solicitudes.",
};

// Dummy async function to simulate status update
async function updateWorkerStatus(status: WorkerStatus, client: QueryClient) {
  const user = getUserFromClient(client);
  const location = getLocationParamsFromClient(client);

  const { error } = await supabase.from("workers").upsert(
    {
      user_id: user.id,
      status: status,
      last_seen_at: new Date().toISOString(),
      location: locationQueryString(
        location.search_lat || 0,
        location.search_lon || 0,
      ),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error(error.message);
  }
}

function SelectWorkStateSheetView() {
  const client = useQueryClient();
  const { dismiss } = useBottomSheetModal();
  const { mutate, isPending } = useMutation({
    mutationFn: (status: WorkerStatus) => updateWorkerStatus(status, client),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: workerStatusQueryOptions.queryKey,
      });
      dismiss();
    },
    onError(error, variables, context) {
      showToast.error("Error al actualizar estado", error.message);
    },
  });

  return (
    <SheetContainer>
      <Text style={styles.sheetTitle}>Actualizar disponibilidad</Text>
      <View style={styles.contentContainer}>
        {Object.entries(workStatusLabels).map(([key, label]) => (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.statusButtonPressed,
            ]}
            onPress={() => mutate(key as WorkerStatus)}
            disabled={isPending}
          >
            <Text style={styles.statusLabel}>{label}</Text>
            <Text style={styles.statusDescription}>
              {workStatusDescriptions[key as WorkerStatus]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.disclaimer}>
        Si no estás activo en la app durante 10 minutos, tu estado se cambiará
        automáticamente a "Desconectado".
      </Text>
    </SheetContainer>
  );
}

export default SelectWorkStateSheetView;

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 16, // Reduced padding
    backgroundColor: colors.background,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
    marginBottom: 18,
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    gap: 10, // Less vertical gap
  },
  statusButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10, // Less vertical padding
    paddingHorizontal: 14, // Less horizontal padding
    marginVertical: 2, // Less margin
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border || "#e0e0e0", // Subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  statusButtonPressed: {
    backgroundColor: colors.primaryLight,
  },
  statusLabel: {
    fontSize: 16, // Smaller font
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2, // Less margin
  },
  statusDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 6,
  },
});
