import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { RiskBadge, StatusBadge } from "@/components/assistant/badges";
import { EmptyState } from "@/components/assistant/empty-state";
import { ScreenHeader } from "@/components/assistant/screen-header";
import { ScreenContainer } from "@/components/screen-container";
import { filterTasks } from "@/lib/assistant-state";
import { useAssistant } from "@/lib/assistant-store";
import { haptic } from "@/lib/haptics";
import type { AgentTask, TaskStatus } from "@/shared/assistant-types";

type Filter = "all" | "active" | "blocked" | "complete";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "blocked", label: "Blocked" },
  { id: "complete", label: "Complete" },
];

function nextStatus(status: TaskStatus): TaskStatus {
  if (status === "queued") return "planning";
  if (status === "planning") return "running";
  if (status === "running" || status === "waiting") return "completed";
  return status;
}

export default function TasksScreen() {
  const { changeTaskStatus, snapshot } = useAssistant();
  const [filter, setFilter] = useState<Filter>("all");
  const tasks = filterTasks(snapshot.tasks, filter);

  const advance = (task: AgentTask) => {
    if (task.status === "blocked") {
      haptic.warning();
      Alert.alert("Task is blocked", "An approval or external integration is required. This prototype cannot bypass the safety policy.");
      return;
    }
    const next = nextStatus(task.status);
    if (next === task.status) return;
    changeTaskStatus(task.id, next);
    if (next === "completed") haptic.success();
    else haptic.light();
  };

  const actionLabel = (task: AgentTask) => {
    if (task.status === "blocked") return "View requirement";
    if (task.status === "queued") return "Start planning";
    if (task.status === "planning") return "Begin local run";
    if (task.status === "running" || task.status === "waiting") return "Mark reviewed";
    return "Completed";
  };

  const renderTask = ({ item }: { item: AgentTask }) => (
    <View className="bg-surface border-border" style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.taskIcon}>
          <MaterialIcons name={item.source === "workflow" ? "account-tree" : "auto-awesome"} size={19} color="#2F6BFF" />
        </View>
        <View style={styles.cardCopy}>
          <Text className="text-foreground" style={styles.title}>{item.title}</Text>
          <Text className="text-muted" style={styles.summary}>{item.summary}</Text>
        </View>
      </View>
      <View style={styles.badges}><RiskBadge riskLevel={item.riskLevel} /><StatusBadge status={item.status} /></View>
      <View style={styles.progressBlock}>
        <View style={styles.progressHead}><Text className="text-muted" style={styles.progressLabel}>Local progress</Text><Text className="text-muted" style={styles.progressLabel}>{item.progress}%</Text></View>
        <Text style={styles.progressGlyph}>{item.progress >= 100 ? "● ● ● ●" : item.progress >= 55 ? "● ● ◐ ○" : item.progress >= 20 ? "● ◐ ○ ○" : "○ ○ ○ ○"}</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable disabled={item.status === "completed" || item.status === "cancelled" || item.status === "failed"} onPress={() => advance(item)} style={({ pressed }) => [styles.advance, (item.status === "completed" || item.status === "cancelled" || item.status === "failed") && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.advanceText}>{actionLabel(item)}</Text>
        </Pressable>
        {!["completed", "cancelled", "failed"].includes(item.status) && (
          <Pressable onPress={() => { changeTaskStatus(item.id, "cancelled"); haptic.medium(); }} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={17} color="#A12B3E" />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Tasks" subtitle="Trace each plan, action, and safety decision." icon="check-circle-outline" />
            <FlatList
              horizontal
              data={filters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => { setFilter(item.id); haptic.light(); }} style={({ pressed }) => [styles.filter, filter === item.id && styles.filterActive, pressed && styles.pressed]}>
                  <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              )}
              contentContainerStyle={styles.filterList}
              showsHorizontalScrollIndicator={false}
            />
          </>
        }
        ListEmptyComponent={<EmptyState icon="task-alt" title="No tasks in this view" detail="Ask for an agent plan or start a workflow to create a transparent, locally tracked task." />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { gap: 12, paddingBottom: 28 },
  filterList: { gap: 8, paddingBottom: 12 },
  filter: { backgroundColor: "#E9EDF5", borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  filterActive: { backgroundColor: "#2F6BFF" },
  filterText: { color: "#51617B", fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: "#FFFFFF" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: "row", gap: 11 },
  taskIcon: { alignItems: "center", backgroundColor: "#E8EEFF", borderRadius: 13, height: 38, justifyContent: "center", width: 38 },
  cardCopy: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  summary: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  progressBlock: { backgroundColor: "#F2F5FB", borderRadius: 13, marginTop: 14, paddingHorizontal: 11, paddingVertical: 9 },
  progressHead: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11, fontWeight: "700" },
  progressGlyph: { color: "#2F6BFF", fontSize: 13, letterSpacing: 3, marginTop: 5 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  advance: { alignItems: "center", backgroundColor: "#2F6BFF", borderRadius: 12, flex: 1, justifyContent: "center", minHeight: 42 },
  advanceText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  cancel: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 12, justifyContent: "center", width: 42 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
