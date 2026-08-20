export type TaskStatus = "queued" | "planning" | "running" | "waiting" | "blocked" | "completed" | "failed" | "cancelled";
export type RiskLevel = "low" | "medium" | "high" | "destructive" | "external_publish" | "financial";
export type WorkflowStatus = "ready" | "running" | "paused" | "blocked" | "completed";
export type MessageRole = "user" | "assistant";
export type ConnectorProviderId = "github" | "google_workspace";
export type ConnectorConnectionState = "disconnected" | "configuration_required" | "authorization_pending" | "connected" | "revoked" | "error";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";
export type AuditEventType = "connection_requested" | "connection_ready" | "connection_revoked" | "approval_requested" | "approval_approved" | "approval_rejected" | "execution_blocked" | "scope_denied";
export type AuditSeverity = "info" | "warning" | "security";

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

export type ConnectorDefinition = {
  id: ConnectorProviderId;
  label: string;
  description: string;
  authorization: "oauth2_pkce";
  defaultScopes: string[];
  riskLevel: RiskLevel;
  configurationState: "credentials_required" | "ready";
};

export type ConnectorConnection = {
  id: number;
  providerId: ConnectorProviderId;
  providerLabel: string;
  state: ConnectorConnectionState;
  requestedScopes: string[];
  grantedScopes: string[];
  expiresAt?: string | null;
  lastValidatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalRequest = {
  id: number;
  connectorId: number;
  actionName: string;
  actionSummary: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedScopes: string[];
  requestedAt: string;
  decidedAt?: string | null;
  decisionNote?: string | null;
  expiresAt?: string | null;
};

export type AuditEvent = {
  id: number;
  connectorId?: number | null;
  approvalId?: number | null;
  type: AuditEventType;
  severity: AuditSeverity;
  detail: string;
  createdAt: string;
};

export type AssistantSnapshot = {
  messages: ConversationMessage[];
  tasks: AgentTask[];
  workflows: Workflow[];
  memory: MemoryItem[];
};
