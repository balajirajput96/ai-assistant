import { StyleSheet, Text, View } from "react-native";

import type { RiskLevel, TaskStatus, WorkflowStatus } from "@/shared/assistant-types";

const riskLabels: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Review",
  high: "Approval required",
  destructive: "Destructive",
  external_publish: "External publish",
  financial: "Financial",
};

const statusLabels: Record<TaskStatus | WorkflowStatus, string> = {
  queued: "Queued",
  planning: "Planning",
  running: "Running",
  waiting: "Waiting",
  blocked: "Blocked",
  completed: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
  ready: "Ready",
  paused: "Paused",
};

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const isCaution = riskLevel !== "low";
  return (
    <View style={[styles.badge, isCaution ? styles.cautionBadge : styles.safeBadge]}>
      <Text style={[styles.badgeText, isCaution ? styles.cautionText : styles.safeText]}>{riskLabels[riskLevel]}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: TaskStatus | WorkflowStatus }) {
  const tone = status === "blocked" || status === "failed" ? styles.blockedBadge : status === "completed" ? styles.completeBadge : styles.neutralBadge;
  const textTone = status === "blocked" || status === "failed" ? styles.blockedText : status === "completed" ? styles.completeText : styles.neutralText;
  return (
    <View style={[styles.badge, tone]}>
      <Text style={[styles.badgeText, textTone]}>{statusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  safeBadge: { backgroundColor: "#E2F6ED" },
  safeText: { color: "#167B53" },
  cautionBadge: { backgroundColor: "#FFF0CF" },
  cautionText: { color: "#925D00" },
  neutralBadge: { backgroundColor: "#E8EDFB" },
  neutralText: { color: "#405784" },
  completeBadge: { backgroundColor: "#E2F6ED" },
  completeText: { color: "#167B53" },
  blockedBadge: { backgroundColor: "#FCE6E9" },
  blockedText: { color: "#A12B3E" },
});
