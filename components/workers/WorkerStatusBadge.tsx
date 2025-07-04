import { View, Text, StyleSheet } from "react-native";
import type { WorkerStatus } from "../../types/worker";

const statusConfig: Record<
  WorkerStatus,
  { label: string; bgColor: string; dotColor: string }
> = {
  ONLINE: { label: "En línea", bgColor: "rgba(255, 255, 255, 0.3)", dotColor: "#fff" },
  OFFLINE: { label: "Desconectado", bgColor: "#B0B0B0", dotColor: "#fff" },
  BUSY: { label: "Ocupado", bgColor: "#FFA13C", dotColor: "#fff" },
  ON_BREAK: { label: "En descanso", bgColor: "#2196F3", dotColor: "#fff" },
};

interface WorkerStatusBadgeProps {
  status: WorkerStatus;
}

export default function WorkerStatusBadge({ status }: WorkerStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.OFFLINE;
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  text: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
