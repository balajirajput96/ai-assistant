import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { ConnectorConnection } from "@/shared/assistant-types";

type AccountProvider = {
  id: "github" | "google_workspace";
  label: string;
  description: string;
  defaultScopes: string[];
  configurationReady: boolean;
};

const displayState = (connection?: ConnectorConnection, configured = false) => {
  if (connection?.state === "connected") return { label: "Connected", tone: "ready" as const, icon: "check-circle" as const };
  if (connection?.state === "authorization_pending") return { label: "Authorization pending", tone: "warning" as const, icon: "hourglass-top" as const };
  if (connection?.state === "configuration_required" || !configured) return { label: "Provider setup required", tone: "warning" as const, icon: "settings" as const };
  if (connection?.state === "revoked") return { label: "Disconnected", tone: "muted" as const, icon: "link-off" as const };
  return { label: "Not connected", tone: "muted" as const, icon: "link-off" as const };
};

export default function AccountsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const publicCatalogQuery = trpc.connectors.catalog.useQuery();
  const accountCatalogQuery = trpc.connectors.accountCatalog.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const overviewQuery = trpc.connectors.overview.useQuery(undefined, { enabled: isAuthenticated });
  const requestConnection = trpc.connectors.requestConnection.useMutation();
  const revokeConnection = trpc.connectors.revoke.useMutation();
  const connections = overviewQuery.data?.connections ?? [];
  const providers: AccountProvider[] = isAuthenticated
    ? ((accountCatalogQuery.data?.providers ?? []) as AccountProvider[])
    : (publicCatalogQuery.data ?? []).map((provider) => ({
        id: provider.id,
        label: provider.label,
        description: provider.description,
        defaultScopes: provider.defaultScopes,
        configurationReady: false,
      }));

  const refresh = async () => {
    await Promise.all([accountCatalogQuery.refetch(), overviewQuery.refetch()]);
  };

  const requestConnectionReview = async (provider: AccountProvider, connection?: ConnectorConnection) => {
    if (!isAuthenticated) {
      Alert.alert("Sign-in required", "Sign in before connecting an account. Connection requests, approvals, and audit records are bound to your account.");
      return;
    }
    if (!provider.configurationReady) {
      Alert.alert("Provider is not ready", `${provider.label} has not been configured by the project administrator. You can review its requested scopes later, but no browser authorization can start yet.`);
      return;
    }
    if (connection?.state === "configuration_required" || connection?.state === "authorization_pending") {
      Alert.alert("Scope review already exists", "Your existing connection request is awaiting the necessary approval and OAuth callback setup. No additional browser session has been started.");
      return;
    }
    try {
      await requestConnection.mutateAsync({ providerId: provider.id });
      await refresh();
      haptic.success();
      Alert.alert("Scope review created", `Review the ${provider.label} scopes in Settings before any OAuth browser authorization is allowed.`);
    } catch {
      Alert.alert("Connection request unavailable", "No external authorization was started. Please try again when the account service is available.");
    }
  };

  const disconnect = (connection: ConnectorConnection) => {
    Alert.alert("Disconnect this account?", "This removes the saved account connection state and clears recorded granted scopes. Once live OAuth is enabled, server-side token revocation will also run.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          try {
            await revokeConnection.mutateAsync({ connectionId: connection.id });
            await refresh();
            haptic.medium();
          } catch {
            Alert.alert("Disconnect did not complete", "The connection remains unchanged. No external token was affected.");
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Return to Settings" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#2F6BFF" /></Pressable>
          <View style={styles.titleCopy}><Text className="text-foreground" style={styles.title}>Connected accounts</Text><Text className="text-muted" style={styles.subtitle}>Choose what the assistant may access—never more.</Text></View>
        </View>

        <View style={styles.securityCallout}><MaterialIcons name="shield" size={20} color="#1B9C67" /><Text style={styles.securityText}>Each connection uses a separate scope review. You can disconnect at any time; approval is required before any future consequential action.</Text></View>

        {!isAuthenticated && <View style={styles.signInCard}><MaterialIcons name="lock-outline" size={20} color="#305AAE" /><View style={styles.signInCopy}><Text style={styles.signInTitle}>Sign in to manage accounts</Text><Text style={styles.signInDetail}>This page never connects an account anonymously. Sign in first to bind scopes, approvals, and audit history to you.</Text></View></View>}

        {isAuthenticated && accountCatalogQuery.isLoading && <View style={styles.loading}><ActivityIndicator color="#2F6BFF" /><Text className="text-muted" style={styles.loadingText}>Loading your account connections…</Text></View>}
        {isAuthenticated && accountCatalogQuery.isError && <View style={styles.errorState}><MaterialIcons name="error-outline" size={19} color="#A12B3E" /><Text style={styles.errorText}>Your account connections could not be loaded. No OAuth action is available until the secure service responds.</Text></View>}

        {providers.map((provider) => {
          const connection = connections.find((item) => item.providerId === provider.id);
          const state = displayState(connection, provider.configurationReady);
          const isBusy = requestConnection.isPending || revokeConnection.isPending;
          const connected = connection?.state === "connected";
          return (
            <View key={provider.id} className="bg-surface border-border" style={styles.accountCard}>
              <View style={styles.cardTop}>
                <View style={styles.providerIcon}><MaterialIcons name={provider.id === "github" ? "code" : "account-circle"} size={23} color="#2F6BFF" /></View>
                <View style={styles.cardCopy}><Text className="text-foreground" style={styles.providerTitle}>{provider.label}</Text><Text className="text-muted" style={styles.providerDetail}>{provider.description}</Text></View>
              </View>
              <View style={styles.stateRow}><MaterialIcons name={state.icon} size={16} color={state.tone === "ready" ? "#14724C" : state.tone === "warning" ? "#9A6400" : "#61708C"} /><Text style={[styles.stateText, state.tone === "ready" ? styles.stateReady : state.tone === "warning" ? styles.stateWarning : styles.stateMuted]}>{state.label}</Text></View>
              <Text className="text-muted" style={styles.scopeHeading}>REQUESTED SCOPES</Text>
              <View style={styles.scopeRow}>{provider.defaultScopes.map((scope) => <Text key={scope} style={styles.scopeChip}>{scope}</Text>)}</View>
              {connected && connection?.grantedScopes.length ? <Text className="text-muted" style={styles.grantedText}>Granted: {connection.grantedScopes.join(", ")}</Text> : <Text className="text-muted" style={styles.grantedText}>No account token is stored on this device.</Text>}
              {connected ? (
                <Pressable disabled={isBusy} onPress={() => disconnect(connection)} style={({ pressed }) => [styles.disconnectButton, isBusy && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="link-off" size={18} color="#A12B3E" /><Text style={styles.disconnectText}>Disconnect account</Text></Pressable>
              ) : (
                <Pressable disabled={isBusy} onPress={() => requestConnectionReview(provider, connection)} style={({ pressed }) => [styles.connectButton, isBusy && styles.disabled, pressed && styles.pressed]}>{isBusy ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialIcons name={provider.configurationReady ? "link" : "lock-outline"} size={18} color="#FFFFFF" /><Text style={styles.connectText}>{provider.configurationReady ? "Request connection" : "Provider setup required"}</Text></>}</Pressable>
              )}
            </View>
          );
        })}

        <View style={styles.footerNote}><Text className="text-muted" style={styles.footerText}>A request to connect does not grant access by itself. OAuth opens only after administrator configuration, your scope approval, validated PKCE, and a secure provider callback are in place.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  topBar: { alignItems: "flex-start", flexDirection: "row", gap: 12, marginBottom: 18 },
  backButton: { alignItems: "center", backgroundColor: "#E7EEFF", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  titleCopy: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, lineHeight: 31 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  securityCallout: { alignItems: "flex-start", backgroundColor: "#E7F7EE", borderRadius: 16, flexDirection: "row", gap: 10, marginBottom: 11, padding: 13 },
  securityText: { color: "#176541", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  signInCard: { alignItems: "flex-start", backgroundColor: "#E7EEFF", borderRadius: 17, flexDirection: "row", gap: 10, marginBottom: 11, padding: 14 },
  signInCopy: { flex: 1 },
  signInTitle: { color: "#274E96", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  signInDetail: { color: "#305AAE", fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 2 },
  loading: { alignItems: "center", backgroundColor: "#E7EEFF", borderRadius: 14, flexDirection: "row", gap: 9, marginBottom: 11, padding: 12 },
  loadingText: { fontSize: 12, fontWeight: "700" },
  errorState: { alignItems: "flex-start", backgroundColor: "#FCE6E9", borderRadius: 14, flexDirection: "row", gap: 9, marginBottom: 11, padding: 12 },
  errorText: { color: "#8E2636", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  accountCard: { borderRadius: 20, borderWidth: 1, marginBottom: 11, padding: 15 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  providerIcon: { alignItems: "center", backgroundColor: "#E8EEFF", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  cardCopy: { flex: 1 },
  providerTitle: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  providerDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  stateRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 12 },
  stateText: { fontSize: 12, fontWeight: "800" },
  stateReady: { color: "#14724C" },
  stateWarning: { color: "#9A6400" },
  stateMuted: { color: "#61708C" },
  scopeHeading: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7, marginTop: 14 },
  scopeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  scopeChip: { backgroundColor: "#E7EEFF", borderRadius: 999, color: "#305AAE", fontSize: 11, fontWeight: "800", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  grantedText: { fontSize: 11, lineHeight: 16, marginTop: 11 },
  connectButton: { alignItems: "center", backgroundColor: "#2F6BFF", borderRadius: 12, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 14, minHeight: 43 },
  connectText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  disconnectButton: { alignItems: "center", backgroundColor: "#FCE6E9", borderRadius: 12, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 14, minHeight: 43 },
  disconnectText: { color: "#A12B3E", fontSize: 13, fontWeight: "800" },
  footerNote: { paddingHorizontal: 4, paddingTop: 4 },
  footerText: { fontSize: 12, lineHeight: 18 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
