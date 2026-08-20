import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/assistant/screen-header";
import { useAssistant } from "@/lib/assistant-store";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { ConversationMessage } from "@/shared/assistant-types";

const prompts = [
  "Help me plan a research brief",
  "Turn this into a task plan",
  "What needs approval before I proceed?",
];

export default function ChatScreen() {
  const { addMessage, addTask, agentMode, setAgentMode, snapshot } = useAssistant();
  const [draft, setDraft] = useState("");
  const chatMutation = trpc.assistant.chat.useMutation();

  const submit = async (prompt?: string) => {
    const message = (prompt ?? draft).trim();
    if (!message || chatMutation.isPending) return;
    haptic.light();
    addMessage("user", message, agentMode);
    setDraft("");
    try {
      const result = await chatMutation.mutateAsync({ message, agentMode });
      addMessage("assistant", result.answer, agentMode);
      if (result.suggestedTask) {
        addTask({ ...result.suggestedTask, status: "planning", source: "chat" });
      }
      if (result.status === "ready") haptic.success();
    } catch {
      addMessage(
        "assistant",
        "The assistant service could not be reached. No request was sent to an external tool, and no action was taken on your behalf.",
        agentMode,
      );
    }
  };

  const renderMessage = ({ item }: { item: ConversationMessage }) => {
    const userMessage = item.role === "user";
    return (
      <View style={[styles.messageRow, userMessage ? styles.userRow : styles.assistantRow]}>
        {!userMessage && (
          <View className="bg-primary" style={styles.avatar}>
            <MaterialIcons name="auto-awesome" size={14} color="#FFFFFF" />
          </View>
        )}
        <View className={userMessage ? "bg-primary" : "bg-surface border-border"} style={[styles.messageBubble, !userMessage && styles.assistantBubble]}>
          <Text style={[styles.messageText, userMessage ? styles.userText : styles.assistantText]}>{item.content}</Text>
          {item.agentMode && <Text style={[styles.modeLabel, userMessage ? styles.userModeLabel : styles.assistantModeLabel]}>Agent plan</Text>}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <ScreenHeader title="AI Assistant" subtitle="Plan clearly. Act only with permission." icon="auto-awesome" />
        <View className="bg-surface border-border" style={styles.agentStrip}>
          <View style={styles.agentCopy}>
            <Text className="text-foreground" style={styles.agentTitle}>Agent mode</Text>
            <Text className="text-muted" style={styles.agentDetail}>Creates a reviewable task plan; it does not run external actions.</Text>
          </View>
          <Switch
            value={agentMode}
            onValueChange={(value) => {
              haptic.medium();
              setAgentMode(value);
            }}
            trackColor={{ false: "#CBD5E5", true: "#83A5FF" }}
            thumbColor={agentMode ? "#2F6BFF" : "#FFFFFF"}
          />
        </View>
        <FlatList
          data={snapshot.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          style={styles.messages}
          ListFooterComponent={chatMutation.isPending ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
        />
        <FlatList
          horizontal
          data={prompts}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.promptList}
          style={styles.promptScroller}
          renderItem={({ item }) => (
            <Pressable onPress={() => submit(item)} style={({ pressed }) => [styles.prompt, pressed && styles.pressed]}>
              <Text style={styles.promptText}>{item}</Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
        />
        <View className="bg-surface border-border" style={styles.composer}>
          <Pressable
            accessibilityLabel="Explain attachment availability"
            onPress={() => Alert.alert("Attachments are not connected", "File upload and document parsing are planned. This control does not access device files in the current prototype.")}
            style={({ pressed }) => [styles.composerAction, pressed && styles.pressed]}
          >
            <MaterialIcons name="attach-file" size={21} color="#55709E" />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={agentMode ? "Describe the outcome you want to plan…" : "Ask anything…"}
            placeholderTextColor="#7E8DA8"
            multiline
            maxLength={6000}
            returnKeyType="send"
            onSubmitEditing={() => submit()}
            style={styles.input}
            className="text-foreground"
          />
          <Pressable
            accessibilityLabel="Explain voice availability"
            onPress={() => Alert.alert("Voice is not connected", "Voice capture needs device permission and a tested transcription service before it can be enabled.")}
            style={({ pressed }) => [styles.composerAction, pressed && styles.pressed]}
          >
            <MaterialIcons name="mic-none" size={20} color="#55709E" />
          </Pressable>
          <Pressable
            accessibilityLabel="Send message"
            disabled={!draft.trim() || chatMutation.isPending}
            onPress={() => submit()}
            style={({ pressed }) => [styles.sendButton, (!draft.trim() || chatMutation.isPending) && styles.disabled, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-upward" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function TypingIndicator() {
  return (
    <View className="bg-surface border-border" style={styles.typing}>
      <ActivityIndicator color="#2F6BFF" size="small" />
      <Text className="text-muted" style={styles.typingText}>Thinking through a safe response…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  agentStrip: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, marginBottom: 10, padding: 13 },
  agentCopy: { flex: 1 },
  agentTitle: { fontSize: 14, fontWeight: "800", lineHeight: 19 },
  agentDetail: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  messages: { flex: 1 },
  messagesContent: { gap: 12, paddingBottom: 12, paddingTop: 8 },
  messageRow: { alignItems: "flex-end", flexDirection: "row", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  avatar: { alignItems: "center", borderRadius: 10, height: 28, justifyContent: "center", width: 28 },
  messageBubble: { borderRadius: 18, maxWidth: "84%", paddingHorizontal: 14, paddingVertical: 11 },
  assistantBubble: { borderWidth: 1 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: "#22304A" },
  modeLabel: { fontSize: 10, fontWeight: "800", marginTop: 6, textTransform: "uppercase" },
  userModeLabel: { color: "#DDE7FF" },
  assistantModeLabel: { color: "#56709D" },
  promptList: { gap: 8, paddingBottom: 10, paddingTop: 2 },
  promptScroller: { flexGrow: 0, maxHeight: 48 },
  prompt: { backgroundColor: "#E7EEFF", borderRadius: 999, maxWidth: 220, paddingHorizontal: 12, paddingVertical: 9 },
  promptText: { color: "#305AAE", fontSize: 12, fontWeight: "700", lineHeight: 16 },
  composer: { alignItems: "flex-end", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 4, marginBottom: 12, padding: 7 },
  composerAction: { alignItems: "center", borderRadius: 12, height: 38, justifyContent: "center", width: 34 },
  input: { flex: 1, fontSize: 15, lineHeight: 20, maxHeight: 100, minHeight: 38, paddingHorizontal: 4, paddingVertical: 7 },
  sendButton: { alignItems: "center", backgroundColor: "#2F6BFF", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  typing: { alignItems: "center", alignSelf: "flex-start", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  typingText: { fontSize: 12, fontWeight: "600" },
});
