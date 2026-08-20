import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { RiskBadge, StatusBadge } from "@/components/assistant/badges";
import { EmptyState } from "@/components/assistant/empty-state";
import { ScreenHeader } from "@/components/assistant/screen-header";
import { ScreenContainer } from "@/components/screen-container";
import { useAssistant } from "@/lib/assistant-store";
import { haptic } from "@/lib/haptics";
import type { Workflow } from "@/shared/assistant-types";

export default function WorkflowsScreen() {
  const { addWorkflow, runWorkflow, snapshot } = useAssistant();

  const startWorkflow = (workflow: Workflow) => {
    const result = runWorkflow(workflow.id);
    if (result.requiresApproval) {
      haptic.warning();
      Alert.alert("Approval and connector required", "This workflow remains blocked. The prototype cannot access repositories or create external changes.");
      return;
    }
    haptic.success();
    Alert.alert("Local plan started", "A planning task has been added to Tasks. Review it before connecting any external service.");
  };

  const renderWorkflow = ({ item }: { item: Workflow }) => (
    <View className="bg-surface border-border" style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.workflowIcon}>
          <MaterialIcons name="account-tree" size={21} color="#2F6BFF" />
        </View>
        <View style={styles.cardCopy}>
          <Text className="text-foreground" style={styles.cardTitle}>{item.name}</Text>
          <Text className="text-muted" style={styles.cardDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <RiskBadge riskLevel={item.riskLevel} />
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.actionList}>
        {item.actions.map((action, index) => (
          <View key={action} style={styles.actionLine}>
            <Text style={styles.actionIndex}>{index + 1}</Text>
            <Text className="text-muted" style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={() => startWorkflow(item)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <MaterialIcons name={item.approvalRequired ? "lock-outline" : "play-arrow"} size={19} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{item.approvalRequired ? "Review approval gate" : "Start local plan"}</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={snapshot.workflows}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkflow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Workflows" subtitle="Reusable plans with visible safety gates." icon="account-tree" />
            <View className="bg-surface border-border" style={styles.intro}>
              <MaterialIcons name="verified-user" size={20} color="#1B9C67" />
              <Text className="text-muted" style={styles.introText}>Low-risk planning can run locally. External, destructive, and publishing actions remain blocked until verified integrations and approval rules exist.</Text>
            </View>
            <Pressable
              onPress={() => {
                haptic.light();
                addWorkflow();
              }}
              style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="add" size={19} color="#2F6BFF" />
              <Text style={styles.newButtonText}>New local workflow</Text>
            </Pressable>
          </>
        }
        ListEmptyComponent={<EmptyState icon="account-tree" title="No workflows yet" detail="Create a local workflow to turn a repeated planning process into a reviewable template." />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { gap: 12, paddingBottom: 28 },
  intro: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 12, padding: 13 },
  introText: { flex: 1, fontSize: 12, lineHeight: 18 },
  newButton: { alignItems: "center", borderColor: "#B9CAFA", borderRadius: 14, borderStyle: "dashed", borderWidth: 1.5, flexDirection: "row", gap: 7, justifyContent: "center", marginBottom: 4, minHeight: 48 },
  newButtonText: { color: "#2F6BFF", fontSize: 14, fontWeight: "800" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  workflowIcon: { alignItems: "center", backgroundColor: "#E8EEFF", borderRadius: 13, height: 40, justifyContent: "center", width: 40 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  cardDescription: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  actionList: { gap: 7, marginBottom: 16, marginTop: 15 },
  actionLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  actionIndex: { color: "#5473A8", fontSize: 11, fontWeight: "800", width: 14 },
  actionText: { flex: 1, fontSize: 13, lineHeight: 18 },
  primaryButton: { alignItems: "center", backgroundColor: "#2F6BFF", borderRadius: 13, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
