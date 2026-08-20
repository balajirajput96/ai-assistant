import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/assistant/screen-header";
import { SettingRow } from "@/components/assistant/setting-row";
import { ScreenContainer } from "@/components/screen-container";
import { providerStatuses } from "@/lib/assistant-state";
import { useAssistant } from "@/lib/assistant-store";
import { haptic } from "@/lib/haptics";
import type { ProviderStatus } from "@/shared/assistant-types";

export default function SettingsScreen() {
  const {
    addPreferenceMemory,
    agentMode,
    clearMemory,
    removeMemory,
    resetLocalData,
    retainConversation,
    setAgentMode,
    setRetainConversation,
    snapshot,
  } = useAssistant();

  const reset = () => {
    Alert.alert("Reset local assistant data?", "This removes locally stored conversation state, tasks, workflows, and preferences from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => { resetLocalData(); haptic.medium(); } },
    ]);
  };

  const clearAllMemory = () => {
    Alert.alert("Clear local memory?", "This removes locally stored assistant preferences. It does not affect external accounts because none are connected.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => { clearMemory(); haptic.medium(); } },
    ]);
  };

  const renderProvider = ({ item }: { item: ProviderStatus }) => {
    const color = item.status === "available" ? "#1B9C67" : item.status === "planned" ? "#C98200" : "#61708C";
    const icon = item.status === "available" ? "check-circle" : item.status === "planned" ? "schedule" : "block";
    return (
      <View className="bg-surface border-border" style={styles.providerRow}>
        <MaterialIcons name={icon} size={18} color={color} />
        <View style={styles.providerCopy}>
          <Text className="text-foreground" style={styles.providerTitle}>{item.label}</Text>
          <Text className="text-muted" style={styles.providerDetail}>{item.detail}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={providerStatuses}
        keyExtractor={(item) => item.id}
        renderItem={renderProvider}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <ScreenHeader title="Settings" subtitle="Control what stays local and what needs connection." icon="tune" />
            <Text className="text-muted" style={styles.sectionLabel}>ASSISTED OPERATION</Text>
            <View className="bg-surface border-border" style={styles.group}>
              <SettingRow icon="account-tree" title="Agent mode" detail="Prefer reviewable task plans in chat." value={agentMode} onValueChange={(value) => { setAgentMode(value); haptic.medium(); }} />
              <View className="bg-border" style={styles.divider} />
              <SettingRow icon="history" title="Keep local conversation" detail="Retain this prototype's chat state on this device." value={retainConversation} onValueChange={(value) => { setRetainConversation(value); haptic.medium(); }} />
            </View>
            <Text className="text-muted" style={styles.sectionLabel}>LOCAL MEMORY</Text>
            <View className="bg-surface border-border" style={styles.group}>
              <View style={styles.memoryHeader}>
                <View><Text className="text-foreground" style={styles.memoryTitle}>Saved preferences</Text><Text className="text-muted" style={styles.memoryDetail}>Only device-local entries in this prototype.</Text></View>
                <Pressable onPress={() => { addPreferenceMemory(); haptic.light(); }} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}><Text style={styles.smallActionText}>Add</Text></Pressable>
              </View>
              <FlatList
                data={snapshot.memory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.memoryRow}>
                    <MaterialIcons name="bookmark-outline" size={17} color="#55709E" />
                    <Text className="text-muted" style={styles.memoryValue}>{item.value}</Text>
                    <Pressable onPress={() => { removeMemory(item.id); haptic.medium(); }} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><MaterialIcons name="close" size={15} color="#A12B3E" /></Pressable>
                  </View>
                )}
                ListEmptyComponent={<Text className="text-muted" style={styles.emptyMemory}>No local preferences saved.</Text>}
                scrollEnabled={false}
              />
              <Pressable onPress={clearAllMemory} style={({ pressed }) => [styles.outlineDanger, pressed && styles.pressed]}><Text style={styles.outlineDangerText}>Clear local memory</Text></Pressable>
            </View>
            <Text className="text-muted" style={styles.sectionLabel}>CAPABILITY STATUS</Text>
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text className="text-muted" style={styles.footerCopy}>Provider status reflects this prototype's configuration. Connected accounts, MCP tools, persistent schedules, and external publishing are not enabled here.</Text>
            <Pressable onPress={reset} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}><MaterialIcons name="restart-alt" size={18} color="#A12B3E" /><Text style={styles.resetText}>Reset local prototype data</Text></Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { gap: 8, paddingBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 7, marginTop: 16 },
  group: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  divider: { height: 1, marginLeft: 45 },
  memoryHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, paddingTop: 7 },
  memoryTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  memoryDetail: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  smallAction: { backgroundColor: "#E7EEFF", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  smallActionText: { color: "#2F6BFF", fontSize: 12, fontWeight: "800" },
  memoryRow: { alignItems: "center", borderTopColor: "#E2E8F2", borderTopWidth: 1, flexDirection: "row", gap: 8, paddingVertical: 10 },
  memoryValue: { flex: 1, fontSize: 12, lineHeight: 17 },
  remove: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 8, height: 27, justifyContent: "center", width: 27 },
  emptyMemory: { borderTopColor: "#E2E8F2", borderTopWidth: 1, fontSize: 12, paddingVertical: 13 },
  outlineDanger: { alignItems: "center", borderColor: "#E5A9B1", borderRadius: 11, borderWidth: 1, marginBottom: 7, marginTop: 6, minHeight: 40, justifyContent: "center" },
  outlineDangerText: { color: "#A12B3E", fontSize: 13, fontWeight: "800" },
  providerRow: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 13 },
  providerCopy: { flex: 1 },
  providerTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  providerDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  footer: { marginTop: 10 },
  footerCopy: { fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  reset: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 13, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 13, minHeight: 44 },
  resetText: { color: "#A12B3E", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
