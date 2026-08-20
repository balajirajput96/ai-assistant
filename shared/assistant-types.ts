export type MessageRole = "assistant" | "user";
export type TaskStatus = "queued" | "planning" | "running" | "waiting" | "blocked" | "completed" | "failed" | "cancelled";
export type RiskLevel = "low" | "medium" | "high" | "destructive" | "external_publish" | "financial";
export type WorkflowStatus = "ready" | "running" | "paused" | "blocked" | "completed";

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  agentMode?: boolean;
};

export type AgentTask = {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  riskLevel: RiskLevel;
  progress: number;
  createdAt: string;
  updatedAt: string;
  source: "chat" | "workflow" | "manual";
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "scheduled" | "event";
  actions: string[];
  status: WorkflowStatus;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  lastRun?: string;
};

export type MemoryItem = {
  id: string;
  category: "preference" | "task" | "session";
  value: string;
  sensitive: boolean;
  createdAt: string;
};

export type ProviderStatus = {
  id: string;
  label: string;
  capability: string;
  status: "available" | "planned" | "unavailable";
  detail: string;
};

export type AssistantSnapshot = {
  messages: ConversationMessage[];
  tasks: AgentTask[];
  workflows: Workflow[];
  memory: MemoryItem[];
};
