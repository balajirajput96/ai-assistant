import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/assistant/screen-header";
import { SettingRow } from "@/components/assistant/setting-row";
import { ScreenContainer } from "@/components/screen-container";
import { providerStatuses } from "@/lib/assistant-state";
import { useAssistant } from "@/lib/assistant-store";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import type { ApprovalRequest, AuditEvent, ConnectorConnection, ConnectorDefinition, ProviderStatus } from "@/shared/assistant-types";

const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SettingsScreen() {
  const { addPreferenceMemory, agentMode, clearMemory, removeMemory, resetLocalData, retainConversation, setAgentMode, setRetainConversation, snapshot } = useAssistant();
  const { isAuthenticated } = useAuth();
  const catalogQuery = trpc.connectors.catalog.useQuery();
  const overviewQuery = trpc.connectors.overview.useQuery(undefined, { enabled: isAuthenticated });
  const providerConfigurationQuery = trpc.connectors.admin.providerConfiguration.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const requestConnection = trpc.connectors.requestConnection.useMutation();
  const decideApproval = trpc.connectors.decideApproval.useMutation();
  const revokeConnection = trpc.connectors.revoke.useMutation();

  const connectionsByProvider = useMemo(
    () => new Map((overviewQuery.data?.connections ?? []).map((connection) => [connection.providerId, connection])),
    [overviewQuery.data?.connections],
  );
  const pendingApprovals = (overviewQuery.data?.approvals ?? []).filter((approval) => approval.status === "pending");
  const recentAudit = (overviewQuery.data?.auditEvents ?? []).slice(0, 4);
  const providerConfiguration = providerConfigurationQuery.data?.providers ?? [];
  const pkce = providerConfigurationQuery.data?.pkcePolicy;

  const refreshSecureState = async () => overviewQuery.refetch();
  const handleError = (message: string) => Alert.alert("Action not completed", message);

  const reset = () => {
    Alert.alert("Reset local assistant data?", "This removes locally stored conversation state, tasks, workflows, and preferences from this device. Connector records are server-side and are not changed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => { resetLocalData(); haptic.medium(); } },
    ]);
  };

  const clearAllMemory = () => {
    Alert.alert("Clear local memory?", "This removes locally stored assistant preferences. Connector records and authorization approvals are not affected.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => { clearMemory(); haptic.medium(); } },
    ]);
  };

  const requestScopeReview = async (definition: ConnectorDefinition, connection?: ConnectorConnection) => {
    if (!isAuthenticated) {
      Alert.alert("Sign-in required", "Connector records, approvals, and audit events are bound to a signed-in account. Sign in before requesting any OAuth scope review.");
      return;
    }
    if (connection?.state === "configuration_required" || connection?.state === "authorization_pending") {
      Alert.alert("OAuth setup is not ready", "Your requested scopes are already recorded. Real OAuth will remain blocked until provider credentials, PKCE redirect validation, and server-side token handling are configured.");
      return;
    }
    try {
      const result = await requestConnection.mutateAsync({ providerId: definition.id });
      await refreshSecureState();
      haptic.success();
      Alert.alert("Scope review created", `${definition.label} scopes are now awaiting your approval. No OAuth browser session or external token was created.`);
      if (!result.oauthStarted) return;
    } catch {
      handleError("The secure connector service is unavailable. No OAuth session was started and no external action was attempted.");
    }
  };

  const decide = async (approval: ApprovalRequest, decision: "approved" | "rejected") => {
    try {
      await decideApproval.mutateAsync({ approvalId: approval.id, decision });
      await refreshSecureState();
      decision === "approved" ? haptic.success() : haptic.medium();
      Alert.alert(
        decision === "approved" ? "Approval recorded" : "Approval rejected",
        decision === "approved"
          ? "The scope review is recorded. OAuth remains blocked until provider credentials and secure PKCE redirect handling are configured."
          : "No OAuth session was started and no token was issued.",
      );
    } catch {
      handleError("The approval decision could not be saved. The requested external action remains blocked.");
    }
  };

  const revoke = (connection: ConnectorConnection) => {
    Alert.alert("Revoke connector request?", `This removes ${connection.providerLabel} from the active connector state and clears all locally recorded granted scopes.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          try {
            await revokeConnection.mutateAsync({ connectionId: connection.id });
            await refreshSecureState();
            haptic.medium();
          } catch {
            handleError("The connector could not be revoked. No external token was affected because production OAuth is not configured.");
          }
        },
      },
    ]);
  };

  const renderProvider = ({ item }: { item: ProviderStatus }) => {
    const color = item.status === "available" ? "#1B9C67" : item.status === "planned" ? "#C98200" : "#61708C";
    const icon = item.status === "available" ? "check-circle" : item.status === "planned" ? "schedule" : "block";
    return (
      <View className="bg-surface border-border" style={styles.providerRow}>
        <MaterialIcons name={icon} size={18} color={color} />
        <View style={styles.providerCopy}><Text className="text-foreground" style={styles.providerTitle}>{item.label}</Text><Text className="text-muted" style={styles.providerDetail}>{item.detail}</Text></View>
      </View>
    );
  };

  const renderConnector = (definition: ConnectorDefinition) => {
    const connection = connectionsByProvider.get(definition.id);
    const isBusy = requestConnection.isPending || revokeConnection.isPending;
    return (
      <View key={definition.id} className="bg-surface border-border" style={styles.connectorCard}>
        <View style={styles.connectorTop}>
          <View style={styles.connectorIcon}><MaterialIcons name={definition.id === "github" ? "code" : "account-circle"} size={20} color="#2F6BFF" /></View>
          <View style={styles.connectorCopy}>
            <Text className="text-foreground" style={styles.connectorTitle}>{definition.label}</Text>
            <Text className="text-muted" style={styles.connectorDetail}>{definition.description}</Text>
          </View>
        </View>
        <View style={styles.scopeRow}><Text style={styles.scopeLabel}>Least-privilege scopes</Text>{definition.defaultScopes.map((scope) => <Text key={scope} style={styles.scopeChip}>{scope}</Text>)}</View>
        <View style={styles.connectionStatus}><MaterialIcons name={connection?.state === "revoked" ? "cancel" : "lock-outline"} size={15} color={connection?.state === "revoked" ? "#A12B3E" : "#C98200"} /><Text className="text-muted" style={styles.connectionStatusText}>{connection ? titleCase(connection.state) : "Credentials required"}</Text></View>
        <Pressable disabled={isBusy} onPress={() => requestScopeReview(definition, connection)} style={({ pressed }) => [styles.connectorAction, isBusy && styles.disabled, pressed && styles.pressed]}>
          {isBusy ? <ActivityIndicator color="#2F6BFF" size="small" /> : <><MaterialIcons name="verified-user" size={17} color="#2F6BFF" /><Text style={styles.connectorActionText}>{connection ? "Review OAuth setup" : "Request scope review"}</Text></>}
        </Pressable>
        {connection && connection.state !== "revoked" && <Pressable onPress={() => revoke(connection)} style={({ pressed }) => [styles.revokeAction, pressed && styles.pressed]}><Text style={styles.revokeText}>Revoke request</Text></Pressable>}
      </View>
    );
  };

  const renderApproval = (approval: ApprovalRequest) => (
    <View key={approval.id} className="bg-surface border-border" style={styles.approvalCard}>
      <View style={styles.approvalTop}><MaterialIcons name="gpp-good" size={20} color="#C98200" /><View style={styles.approvalCopy}><Text className="text-foreground" style={styles.approvalTitle}>{approval.actionName}</Text><Text className="text-muted" style={styles.approvalDetail}>{approval.actionSummary}</Text></View></View>
      <View style={styles.scopeRow}><Text style={styles.scopeLabel}>Scopes</Text>{approval.requestedScopes.map((scope) => <Text key={scope} style={styles.scopeChip}>{scope}</Text>)}</View>
      <View style={styles.approvalButtons}>
        <Pressable disabled={decideApproval.isPending} onPress={() => decide(approval, "rejected")} style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}><Text style={styles.rejectText}>Reject</Text></Pressable>
        <Pressable disabled={decideApproval.isPending} onPress={() => decide(approval, "approved")} style={({ pressed }) => [styles.approveButton, pressed && styles.pressed]}><Text style={styles.approveText}>Approve scope review</Text></Pressable>
      </View>
    </View>
  );

  const renderAudit = (event: AuditEvent) => (
    <View key={event.id} style={styles.auditRow}>
      <View style={[styles.auditDot, event.severity === "security" && styles.auditDotSecurity, event.severity === "warning" && styles.auditDotWarning]} />
      <View style={styles.auditCopy}><Text className="text-foreground" style={styles.auditTitle}>{titleCase(event.type)}</Text><Text className="text-muted" style={styles.auditDetail}>{event.detail}</Text><Text className="text-muted" style={styles.auditTime}>{new Date(event.createdAt).toLocaleString()}</Text></View>
    </View>
  );

  const renderProviderConfiguration = (provider: (typeof providerConfiguration)[number]) => (
    <View key={provider.id} className="bg-surface border-border" style={styles.providerConfigCard}>
      <View style={styles.providerConfigHead}>
        <View style={[styles.readinessPill, provider.ready ? styles.readinessReady : styles.readinessBlocked]}>
          <MaterialIcons name={provider.ready ? "check" : "lock-outline"} size={14} color={provider.ready ? "#14724C" : "#9A6400"} />
          <Text style={[styles.readinessText, provider.ready ? styles.readinessTextReady : styles.readinessTextBlocked]}>{provider.ready ? "Ready" : "Incomplete"}</Text>
        </View>
        <Text className="text-foreground" style={styles.providerConfigTitle}>{provider.label}</Text>
      </View>
      <CredentialReadiness label="Client ID" configured={provider.clientIdConfigured} />
      <CredentialReadiness label="Client secret" configured={provider.clientSecretConfigured} secret />
      <CredentialReadiness label="Exact redirect URI" configured={provider.redirectUriConfigured} value={provider.redirectUri} />
    </View>
  );

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
            <Text className="text-muted" style={styles.sectionLabel}>CONNECTORS & APPROVALS</Text>
            <View className="bg-surface border-border" style={styles.connectorIntro}>
              <MaterialIcons name="shield" size={20} color="#1B9C67" />
              <Text className="text-muted" style={styles.connectorIntroText}>Connector requests use a scope review and audit trail. OAuth does not start until a real provider client, PKCE redirect, server-side token store, and user sign-in are configured.</Text>
            </View>
            {!isAuthenticated && <View style={styles.signInNotice}><MaterialIcons name="lock-outline" size={17} color="#305AAE" /><Text style={styles.signInNoticeText}>Sign in is required before connector records, approvals, or audit history can be accessed.</Text></View>}
            {(catalogQuery.data ?? []).map(renderConnector)}
            {isAuthenticated && pendingApprovals.length > 0 && <><Text className="text-muted" style={styles.inlineSectionLabel}>PENDING SCOPE REVIEWS</Text>{pendingApprovals.map(renderApproval)}</>}
            {isAuthenticated && recentAudit.length > 0 && <><Text className="text-muted" style={styles.inlineSectionLabel}>RECENT AUDIT EVENTS</Text><View className="bg-surface border-border" style={styles.auditGroup}>{recentAudit.map(renderAudit)}</View></>}
            <Text className="text-muted" style={styles.sectionLabel}>OAUTH PROVIDER CONFIGURATION</Text>
            <View className="bg-surface border-border" style={styles.providerConfigurationIntro}>
              <MaterialIcons name="admin-panel-settings" size={20} color="#2F6BFF" />
              <View style={styles.providerConfigurationCopy}>
                <Text className="text-foreground" style={styles.providerConfigurationTitle}>Administrator-only secure setup</Text>
                <Text className="text-muted" style={styles.providerConfigurationDetail}>Client secrets are never entered, displayed, or persisted in the mobile app. This panel reports only redacted server-side readiness.</Text>
              </View>
            </View>
            {!isAuthenticated && <View style={styles.signInNotice}><MaterialIcons name="lock-outline" size={17} color="#305AAE" /><Text style={styles.signInNoticeText}>Sign in with an administrator account to inspect provider readiness. Credentials must be set through protected project secrets.</Text></View>}
            {isAuthenticated && providerConfigurationQuery.isLoading && <View style={styles.configLoading}><ActivityIndicator color="#2F6BFF" size="small" /><Text className="text-muted" style={styles.configLoadingText}>Loading redacted provider configuration…</Text></View>}
            {isAuthenticated && providerConfigurationQuery.isError && <View style={styles.configForbidden}><MaterialIcons name="admin-panel-settings" size={18} color="#9A6400" /><Text style={styles.configForbiddenText}>Provider configuration is visible only to the project administrator. Credential values remain hidden from every client.</Text></View>}
            {providerConfiguration.map(renderProviderConfiguration)}
            {pkce && <View className="bg-surface border-border" style={styles.pkceCard}>
              <View style={styles.pkceHead}><MaterialIcons name="security" size={20} color="#1B9C67" /><View style={styles.pkceCopy}><Text className="text-foreground" style={styles.pkceTitle}>PKCE policy is enforced</Text><Text className="text-muted" style={styles.pkceDetail}>These security controls are fixed by the server and cannot be relaxed from the client.</Text></View></View>
              <View style={styles.pkceRows}>
                <ConfigFact label="Challenge method" value={pkce.method} />
                <ConfigFact label="Verifier length" value={`${pkce.verifierMinLength}–${pkce.verifierMaxLength} characters`} />
                <ConfigFact label="Authorization surface" value={pkce.externalUserAgentRequired ? "External browser required" : "Not configured"} />
                <ConfigFact label="State validation" value={pkce.stateValidationRequired ? "Required" : "Not configured"} />
                <ConfigFact label="Token exchange" value="Server only" />
              </View>
            </View>}
            <Text className="text-muted" style={styles.sectionLabel}>LOCAL MEMORY</Text>
            <View className="bg-surface border-border" style={styles.group}>
              <View style={styles.memoryHeader}><View><Text className="text-foreground" style={styles.memoryTitle}>Saved preferences</Text><Text className="text-muted" style={styles.memoryDetail}>Only device-local entries in this prototype.</Text></View><Pressable onPress={() => { addPreferenceMemory(); haptic.light(); }} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}><Text style={styles.smallActionText}>Add</Text></Pressable></View>
              <FlatList data={snapshot.memory} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={styles.memoryRow}><MaterialIcons name="bookmark-outline" size={17} color="#55709E" /><Text className="text-muted" style={styles.memoryValue}>{item.value}</Text><Pressable onPress={() => { removeMemory(item.id); haptic.medium(); }} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><MaterialIcons name="close" size={15} color="#A12B3E" /></Pressable></View>} ListEmptyComponent={<Text className="text-muted" style={styles.emptyMemory}>No local preferences saved.</Text>} scrollEnabled={false} />
              <Pressable onPress={clearAllMemory} style={({ pressed }) => [styles.outlineDanger, pressed && styles.pressed]}><Text style={styles.outlineDangerText}>Clear local memory</Text></Pressable>
            </View>
            <Text className="text-muted" style={styles.sectionLabel}>CAPABILITY STATUS</Text>
          </>
        }
        ListFooterComponent={<View style={styles.footer}><Text className="text-muted" style={styles.footerCopy}>Connector activity is not external execution. No connected account, browser session, or persistent schedule is enabled unless a verified provider integration is configured and approved.</Text><Pressable onPress={reset} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}><MaterialIcons name="restart-alt" size={18} color="#A12B3E" /><Text style={styles.resetText}>Reset local prototype data</Text></Pressable></View>}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function CredentialReadiness({ label, configured, value, secret = false }: { label: string; configured: boolean; value?: string | null; secret?: boolean }) {
  return (
    <View style={styles.credentialRow}>
      <View style={[styles.credentialDot, configured ? styles.credentialDotReady : styles.credentialDotMissing]} />
      <Text className="text-muted" style={styles.credentialLabel}>{label}</Text>
      <Text className="text-foreground" style={styles.credentialValue}>{configured ? (secret ? "Stored securely" : value ?? "Configured") : "Missing"}</Text>
    </View>
  );
}

function ConfigFact({ label, value }: { label: string; value: string }) {
  return <View style={styles.configFact}><Text className="text-muted" style={styles.configFactLabel}>{label}</Text><Text className="text-foreground" style={styles.configFactValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  listContent: { gap: 8, paddingBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 7, marginTop: 16 },
  inlineSectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 7, marginTop: 13 },
  group: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  divider: { height: 1, marginLeft: 45 },
  connectorIntro: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 10, padding: 13 },
  connectorIntroText: { flex: 1, fontSize: 12, lineHeight: 18 },
  signInNotice: { alignItems: "flex-start", backgroundColor: "#E7EEFF", borderRadius: 14, flexDirection: "row", gap: 8, marginBottom: 10, padding: 11 },
  signInNoticeText: { color: "#305AAE", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  connectorCard: { borderRadius: 18, borderWidth: 1, marginBottom: 9, padding: 14 },
  connectorTop: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  connectorIcon: { alignItems: "center", backgroundColor: "#E8EEFF", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  connectorCopy: { flex: 1 },
  connectorTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  connectorDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  scopeRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  scopeLabel: { color: "#61708C", fontSize: 11, fontWeight: "800", marginRight: 2 },
  scopeChip: { backgroundColor: "#EDF2FF", borderRadius: 999, color: "#305AAE", fontSize: 11, fontWeight: "800", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  connectionStatus: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 11 },
  connectionStatusText: { fontSize: 12, fontWeight: "700" },
  connectorAction: { alignItems: "center", backgroundColor: "#E7EEFF", borderRadius: 11, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 12, minHeight: 40 },
  connectorActionText: { color: "#2F6BFF", fontSize: 13, fontWeight: "800" },
  revokeAction: { alignItems: "center", justifyContent: "center", marginTop: 9, minHeight: 28 },
  revokeText: { color: "#A12B3E", fontSize: 12, fontWeight: "800" },
  approvalCard: { borderRadius: 18, borderWidth: 1, marginBottom: 8, padding: 14 },
  approvalTop: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  approvalCopy: { flex: 1 },
  approvalTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  approvalDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  approvalButtons: { flexDirection: "row", gap: 8, marginTop: 14 },
  rejectButton: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 11, flex: 1, justifyContent: "center", minHeight: 40 },
  rejectText: { color: "#A12B3E", fontSize: 12, fontWeight: "800" },
  approveButton: { alignItems: "center", backgroundColor: "#2F6BFF", borderRadius: 11, flex: 1.8, justifyContent: "center", minHeight: 40 },
  approveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  auditGroup: { borderRadius: 18, borderWidth: 1, padding: 13 },
  auditRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, paddingBottom: 11, paddingTop: 3 },
  auditDot: { backgroundColor: "#2F6BFF", borderRadius: 999, height: 8, marginTop: 5, width: 8 },
  auditDotWarning: { backgroundColor: "#C98200" },
  auditDotSecurity: { backgroundColor: "#A12B3E" },
  auditCopy: { flex: 1 },
  auditTitle: { fontSize: 12, fontWeight: "800", lineHeight: 17 },
  auditDetail: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  auditTime: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  providerConfigurationIntro: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 10, padding: 13 },
  providerConfigurationCopy: { flex: 1 },
  providerConfigurationTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  providerConfigurationDetail: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  configLoading: { alignItems: "center", backgroundColor: "#E7EEFF", borderRadius: 14, flexDirection: "row", gap: 9, marginBottom: 10, padding: 12 },
  configLoadingText: { fontSize: 12, fontWeight: "700" },
  configForbidden: { alignItems: "flex-start", backgroundColor: "#FFF3DC", borderRadius: 14, flexDirection: "row", gap: 9, marginBottom: 10, padding: 12 },
  configForbiddenText: { color: "#7B5507", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  providerConfigCard: { borderRadius: 17, borderWidth: 1, marginBottom: 9, padding: 13 },
  providerConfigHead: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 },
  providerConfigTitle: { fontSize: 14, fontWeight: "800" },
  readinessPill: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 7, paddingVertical: 4 },
  readinessReady: { backgroundColor: "#DFF5E9" },
  readinessBlocked: { backgroundColor: "#FFF0D3" },
  readinessText: { fontSize: 10, fontWeight: "800" },
  readinessTextReady: { color: "#14724C" },
  readinessTextBlocked: { color: "#9A6400" },
  credentialRow: { alignItems: "center", borderTopColor: "#E2E8F2", borderTopWidth: 1, flexDirection: "row", gap: 7, minHeight: 34 },
  credentialDot: { borderRadius: 999, height: 7, width: 7 },
  credentialDotReady: { backgroundColor: "#1B9C67" },
  credentialDotMissing: { backgroundColor: "#C98200" },
  credentialLabel: { flex: 1, fontSize: 11, fontWeight: "700" },
  credentialValue: { fontSize: 11, fontWeight: "800", maxWidth: 150, textAlign: "right" },
  pkceCard: { borderRadius: 17, borderWidth: 1, marginBottom: 8, padding: 13 },
  pkceHead: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  pkceCopy: { flex: 1 },
  pkceTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  pkceDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  pkceRows: { marginTop: 9 },
  configFact: { alignItems: "flex-start", borderTopColor: "#E2E8F2", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  configFactLabel: { fontSize: 11, fontWeight: "700", maxWidth: "42%" },
  configFactValue: { fontSize: 11, fontWeight: "800", maxWidth: "55%", textAlign: "right" },
  memoryHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, paddingTop: 7 },
  memoryTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  memoryDetail: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  smallAction: { backgroundColor: "#E7EEFF", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  smallActionText: { color: "#2F6BFF", fontSize: 12, fontWeight: "800" },
  memoryRow: { alignItems: "center", borderTopColor: "#E2E8F2", borderTopWidth: 1, flexDirection: "row", gap: 8, paddingVertical: 10 },
  memoryValue: { flex: 1, fontSize: 12, lineHeight: 17 },
  remove: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 8, height: 27, justifyContent: "center", width: 27 },
  emptyMemory: { borderTopColor: "#E2E8F2", borderTopWidth: 1, fontSize: 12, paddingVertical: 13 },
  outlineDanger: { alignItems: "center", borderColor: "#E5A9B1", borderRadius: 11, borderWidth: 1, justifyContent: "center", marginBottom: 7, marginTop: 6, minHeight: 40 },
  outlineDangerText: { color: "#A12B3E", fontSize: 13, fontWeight: "800" },
  providerRow: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 13 },
  providerCopy: { flex: 1 },
  providerTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  providerDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  footer: { marginTop: 10 },
  footerCopy: { fontSize: 12, lineHeight: 18, paddingHorizontal: 3 },
  reset: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 13, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 13, minHeight: 44 },
  resetText: { color: "#A12B3E", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
