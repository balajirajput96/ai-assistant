import type {
  AgentTask,
  AssistantSnapshot,
  ConversationMessage,
  MemoryItem,
  ProviderStatus,
  RiskLevel,
  TaskStatus,
  Workflow,
} from "@/shared/assistant-types";

const now = () => new Date().toISOString();

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const providerStatuses: ProviderStatus[] = [
  {
    id: "assistant-model",
    label: "Assistant model",
    capability: "Text responses",
    status: "available",
    detail: "Server-side assistant responses are available when the project service is healthy.",
  },
  {
    id: "document-intelligence",
    label: "Document intelligence",
    capability: "PDF, text, and structured data",
    status: "planned",
    detail: "The upload, parsing, and source-citation pipeline is not connected in this prototype.",
  },
  {
    id: "voice",
    label: "Voice interaction",
    capability: "Speech input and spoken output",
    status: "planned",
    detail: "Device permissions and a tested transcription pipeline are required before voice actions can run.",
  },
  {
    id: "connectors",
    label: "Connected tools",
    capability: "MCP and third-party services",
    status: "planned",
    detail: "OAuth scope reviews and audit records are available after sign-in. Real provider authorization requires server credentials and validated PKCE redirects.",
  },
];

const starterMessages: ConversationMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "I’m ready to help you think, plan, and organize work. This prototype keeps external actions assisted: it will never claim to browse, publish, or change an account unless a verified integration is connected.",
    createdAt: now(),
  },
];

const starterWorkflows: Workflow[] = [
  {
    id: "research-brief",
    name: "Research briefing",
    description: "Plan a source-aware research brief and produce a reviewable outline.",
    trigger: "manual",
    actions: ["Clarify the question", "Plan sources", "Draft an outline"],
    status: "ready",
    riskLevel: "low",
    approvalRequired: false,
  },
  {
    id: "document-review",
    name: "Document review",
    description: "Prepare a review checklist for a supplied document and identify requested outputs.",
    trigger: "manual",
    actions: ["Confirm scope", "Check source coverage", "Draft findings"],
    status: "ready",
    riskLevel: "low",
    approvalRequired: false,
  },
  {
    id: "github-draft",
    name: "GitHub change proposal",
    description: "Plan a change, test strategy, and draft pull-request checklist for a connected repository.",
    trigger: "manual",
    actions: ["Inspect requirements", "Propose branch plan", "Prepare review checklist"],
    status: "blocked",
    riskLevel: "high",
    approvalRequired: true,
  },
];

const starterMemory: MemoryItem[] = [
  {
    id: "memory-assisted",
    category: "preference",
    value: "Use assisted mode for consequential actions.",
    sensitive: false,
    createdAt: now(),
  },
];

export function createInitialSnapshot(): AssistantSnapshot {
  return {
    messages: starterMessages.map((message) => ({ ...message })),
    tasks: [],
    workflows: starterWorkflows.map((workflow) => ({ ...workflow, actions: [...workflow.actions] })),
    memory: starterMemory.map((item) => ({ ...item })),
  };
}

export function createMessage(role: ConversationMessage["role"], content: string, agentMode = false): ConversationMessage {
  return { id: uid("message"), role, content, agentMode, createdAt: now() };
}

export function createTask(input: {
  title: string;
  summary: string;
  riskLevel?: RiskLevel;
  status?: TaskStatus;
  source: AgentTask["source"];
}): AgentTask {
  const timestamp = now();
  return {
    id: uid("task"),
    title: input.title,
    summary: input.summary,
    status: input.status ?? "queued",
    riskLevel: input.riskLevel ?? "low",
    progress: input.status === "completed" ? 100 : 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: input.source,
  };
}

export function createMemory(value: string): MemoryItem {
  return {
    id: uid("memory"),
    category: "preference",
    value,
    sensitive: false,
    createdAt: now(),
  };
}

export function isApprovalRequired(riskLevel: RiskLevel): boolean {
  return ["high", "destructive", "external_publish", "financial"].includes(riskLevel);
}

export function taskProgress(status: TaskStatus): number {
  const progress: Record<TaskStatus, number> = {
    queued: 0,
    planning: 20,
    running: 55,
    waiting: 70,
    blocked: 0,
    completed: 100,
    failed: 0,
    cancelled: 0,
  };
  return progress[status];
}

export function filterTasks(tasks: AgentTask[], filter: "all" | "active" | "blocked" | "complete"): AgentTask[] {
  if (filter === "active") return tasks.filter((task) => ["queued", "planning", "running", "waiting"].includes(task.status));
  if (filter === "blocked") return tasks.filter((task) => task.status === "blocked");
  if (filter === "complete") return tasks.filter((task) => ["completed", "cancelled", "failed"].includes(task.status));
  return tasks;
}
