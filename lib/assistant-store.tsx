import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import {
  createInitialSnapshot,
  createMemory,
  createMessage,
  createTask,
  isApprovalRequired,
  taskProgress,
} from "@/lib/assistant-state";
import type { AgentTask, AssistantSnapshot, ConversationMessage, RiskLevel, TaskStatus, Workflow } from "@/shared/assistant-types";

const STORAGE_KEY = "ai-assistant.snapshot.v1";

type AssistantContextValue = {
  snapshot: AssistantSnapshot;
  hydrated: boolean;
  agentMode: boolean;
  retainConversation: boolean;
  setAgentMode: (value: boolean) => void;
  setRetainConversation: (value: boolean) => void;
  addMessage: (role: ConversationMessage["role"], content: string, agentMode?: boolean) => void;
  addTask: (input: { title: string; summary: string; riskLevel?: RiskLevel; status?: TaskStatus; source: AgentTask["source"] }) => void;
  changeTaskStatus: (id: string, status: TaskStatus) => void;
  runWorkflow: (id: string) => { requiresApproval: boolean; workflow?: Workflow };
  addWorkflow: () => void;
  removeMemory: (id: string) => void;
  addPreferenceMemory: () => void;
  clearMemory: () => void;
  resetLocalData: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<AssistantSnapshot>(createInitialSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [retainConversation, setRetainConversation] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored || !active) return;
        const parsed = JSON.parse(stored) as { snapshot?: AssistantSnapshot; agentMode?: boolean; retainConversation?: boolean };
        if (parsed.snapshot) setSnapshot(parsed.snapshot);
        if (typeof parsed.agentMode === "boolean") setAgentMode(parsed.agentMode);
        if (typeof parsed.retainConversation === "boolean") setRetainConversation(parsed.retainConversation);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ snapshot, agentMode, retainConversation })).catch(() => undefined);
  }, [agentMode, hydrated, retainConversation, snapshot]);

  const addMessage = useCallback((role: ConversationMessage["role"], content: string, messageAgentMode = false) => {
    setSnapshot((previous) => ({ ...previous, messages: [...previous.messages, createMessage(role, content, messageAgentMode)] }));
  }, []);

  const addTask = useCallback((input: { title: string; summary: string; riskLevel?: RiskLevel; status?: TaskStatus; source: AgentTask["source"] }) => {
    setSnapshot((previous) => ({ ...previous, tasks: [createTask(input), ...previous.tasks] }));
  }, []);

  const changeTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setSnapshot((previous) => ({
      ...previous,
      tasks: previous.tasks.map((task) =>
        task.id === id ? { ...task, status, progress: taskProgress(status), updatedAt: new Date().toISOString() } : task,
      ),
    }));
  }, []);

  const runWorkflow = useCallback((id: string) => {
    let selected: Workflow | undefined;
    setSnapshot((previous) => {
      selected = previous.workflows.find((workflow) => workflow.id === id);
      if (!selected) return previous;
      const requiresApproval = selected.approvalRequired || isApprovalRequired(selected.riskLevel);
      const timestamp = new Date().toISOString();
      const status = requiresApproval ? "blocked" : "running";
      const workflow = { ...selected, status, lastRun: timestamp } as Workflow;
      const task = createTask({
        title: selected.name,
        summary: requiresApproval
          ? "This workflow is blocked until a real approval and connector layer is configured."
          : "Local workflow plan started. Review its proposed actions before connecting external tools.",
        riskLevel: selected.riskLevel,
        status: requiresApproval ? "blocked" : "planning",
        source: "workflow",
      });
      return {
        ...previous,
        workflows: previous.workflows.map((item) => (item.id === id ? workflow : item)),
        tasks: [task, ...previous.tasks],
      };
    });
    return { requiresApproval: selected ? selected.approvalRequired || isApprovalRequired(selected.riskLevel) : false, workflow: selected };
  }, []);

  const addWorkflow = useCallback(() => {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: "Weekly planning review",
      description: "Prepare a local planning checklist from your latest assistant requests.",
      trigger: "manual",
      actions: ["Collect goals", "Identify blockers", "Draft priorities"],
      status: "ready",
      riskLevel: "low",
      approvalRequired: false,
    };
    setSnapshot((previous) => ({ ...previous, workflows: [workflow, ...previous.workflows] }));
  }, []);

  const removeMemory = useCallback((id: string) => {
    setSnapshot((previous) => ({ ...previous, memory: previous.memory.filter((item) => item.id !== id) }));
  }, []);

  const addPreferenceMemory = useCallback(() => {
    setSnapshot((previous) => ({
      ...previous,
      memory: [createMemory("Prefer concise, source-aware project updates."), ...previous.memory],
    }));
  }, []);

  const clearMemory = useCallback(() => {
    setSnapshot((previous) => ({ ...previous, memory: [] }));
  }, []);

  const resetLocalData = useCallback(() => {
    setSnapshot(createInitialSnapshot());
    setAgentMode(false);
    setRetainConversation(true);
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      hydrated,
      agentMode,
      retainConversation,
      setAgentMode,
      setRetainConversation,
      addMessage,
      addTask,
      changeTaskStatus,
      runWorkflow,
      addWorkflow,
      removeMemory,
      addPreferenceMemory,
      clearMemory,
      resetLocalData,
    }),
    [addMessage, addPreferenceMemory, addTask, addWorkflow, agentMode, changeTaskStatus, clearMemory, hydrated, removeMemory, resetLocalData, retainConversation, runWorkflow, snapshot],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used inside AssistantProvider");
  return context;
}
