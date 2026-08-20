import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const connectorConnections = mysqlTable(
  "connector_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    providerId: mysqlEnum("providerId", ["github", "google_workspace"]).notNull(),
    providerLabel: varchar("providerLabel", { length: 80 }).notNull(),
    connectionState: mysqlEnum("connectionState", ["disconnected", "configuration_required", "authorization_pending", "connected", "revoked", "error"]).notNull(),
    requestedScopesJson: text("requestedScopesJson").notNull(),
    grantedScopesJson: text("grantedScopesJson").notNull(),
    tokenReference: varchar("tokenReference", { length: 255 }),
    lastValidatedAt: timestamp("lastValidatedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("connector_connections_user_provider_unique").on(table.userId, table.providerId),
    index("connector_connections_user_idx").on(table.userId),
  ],
);

export const connectorApprovalRequests = mysqlTable(
  "connector_approval_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    connectorId: int("connectorId").notNull().references(() => connectorConnections.id, { onDelete: "cascade" }),
    actionName: varchar("actionName", { length: 160 }).notNull(),
    actionSummary: text("actionSummary").notNull(),
    riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "destructive", "external_publish", "financial"]).notNull(),
    approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected", "expired", "cancelled"]).notNull(),
    requestedScopesJson: text("requestedScopesJson").notNull(),
    redactedArgumentsJson: text("redactedArgumentsJson").notNull(),
    decisionNote: varchar("decisionNote", { length: 500 }),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    decidedAt: timestamp("decidedAt"),
    expiresAt: timestamp("expiresAt"),
  },
  (table) => [index("connector_approvals_user_status_idx").on(table.userId, table.approvalStatus)],
);

export const connectorAuditEvents = mysqlTable(
  "connector_audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    connectorId: int("connectorId").references(() => connectorConnections.id, { onDelete: "set null" }),
    approvalId: int("approvalId").references(() => connectorApprovalRequests.id, { onDelete: "set null" }),
    eventType: mysqlEnum("eventType", ["connection_requested", "connection_ready", "connection_revoked", "approval_requested", "approval_approved", "approval_rejected", "execution_blocked", "scope_denied"]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "security"]).notNull(),
    detail: text("detail").notNull(),
    metadataJson: text("metadataJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("connector_audit_events_user_created_idx").on(table.userId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ConnectorConnectionRow = typeof connectorConnections.$inferSelect;
export type ConnectorApprovalRequestRow = typeof connectorApprovalRequests.$inferSelect;
export type ConnectorAuditEventRow = typeof connectorAuditEvents.$inferSelect;
