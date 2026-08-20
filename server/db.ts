import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  connectorApprovalRequests,
  connectorAuditEvents,
  connectorConnections,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Secure connector storage is unavailable. Try again when the service is healthy.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listConnectorConnections(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(connectorConnections).where(eq(connectorConnections.userId, userId));
}

export async function requestConnectorConnection(input: {
  userId: number;
  providerId: "github" | "google_workspace";
  providerLabel: string;
  requestedScopes: string[];
}) {
  const db = requireDb(await getDb());
  const existing = await db
    .select()
    .from(connectorConnections)
    .where(and(eq(connectorConnections.userId, input.userId), eq(connectorConnections.providerId, input.providerId)))
    .limit(1);
  const values = {
    providerLabel: input.providerLabel,
    connectionState: "configuration_required" as const,
    requestedScopesJson: JSON.stringify(input.requestedScopes),
    grantedScopesJson: JSON.stringify([]),
    tokenReference: null,
    lastValidatedAt: null,
    expiresAt: null,
  };
  if (existing[0]) {
    await db.update(connectorConnections).set(values).where(eq(connectorConnections.id, existing[0].id));
    return { ...existing[0], ...values };
  }
  await db.insert(connectorConnections).values({ userId: input.userId, providerId: input.providerId, ...values });
  const created = await db
    .select()
    .from(connectorConnections)
    .where(and(eq(connectorConnections.userId, input.userId), eq(connectorConnections.providerId, input.providerId)))
    .limit(1);
  if (!created[0]) throw new Error("Connector request could not be saved.");
  return created[0];
}

export async function getConnectorConnection(userId: number, connectionId: number) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(connectorConnections)
    .where(and(eq(connectorConnections.id, connectionId), eq(connectorConnections.userId, userId)))
    .limit(1);
  return result[0];
}

export async function revokeConnectorConnection(userId: number, connectionId: number) {
  const db = requireDb(await getDb());
  await db
    .update(connectorConnections)
    .set({ connectionState: "revoked", grantedScopesJson: JSON.stringify([]), tokenReference: null, expiresAt: null })
    .where(and(eq(connectorConnections.id, connectionId), eq(connectorConnections.userId, userId)));
  return getConnectorConnection(userId, connectionId);
}

export async function createApprovalRequest(input: {
  userId: number;
  connectorId: number;
  actionName: string;
  actionSummary: string;
  riskLevel: "low" | "medium" | "high" | "destructive" | "external_publish" | "financial";
  requestedScopes: string[];
  redactedArguments: Record<string, string>;
}) {
  const db = requireDb(await getDb());
  await db.insert(connectorApprovalRequests).values({
    userId: input.userId,
    connectorId: input.connectorId,
    actionName: input.actionName,
    actionSummary: input.actionSummary,
    riskLevel: input.riskLevel,
    approvalStatus: "pending",
    requestedScopesJson: JSON.stringify(input.requestedScopes),
    redactedArgumentsJson: JSON.stringify(input.redactedArguments),
  });
  const created = await db
    .select()
    .from(connectorApprovalRequests)
    .where(and(eq(connectorApprovalRequests.userId, input.userId), eq(connectorApprovalRequests.connectorId, input.connectorId)))
    .orderBy(desc(connectorApprovalRequests.id))
    .limit(1);
  if (!created[0]) throw new Error("Approval request could not be saved.");
  return created[0];
}

export async function listApprovalRequests(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(connectorApprovalRequests).where(eq(connectorApprovalRequests.userId, userId)).orderBy(desc(connectorApprovalRequests.requestedAt));
}

export async function decideApprovalRequest(input: { userId: number; approvalId: number; status: "approved" | "rejected"; decisionNote?: string }) {
  const db = requireDb(await getDb());
  await db
    .update(connectorApprovalRequests)
    .set({ approvalStatus: input.status, decisionNote: input.decisionNote ?? null, decidedAt: new Date() })
    .where(and(eq(connectorApprovalRequests.id, input.approvalId), eq(connectorApprovalRequests.userId, input.userId), eq(connectorApprovalRequests.approvalStatus, "pending")));
  const result = await db
    .select()
    .from(connectorApprovalRequests)
    .where(and(eq(connectorApprovalRequests.id, input.approvalId), eq(connectorApprovalRequests.userId, input.userId)))
    .limit(1);
  return result[0];
}

export async function createAuditEvent(input: {
  userId: number;
  connectorId?: number;
  approvalId?: number;
  eventType: "connection_requested" | "connection_ready" | "connection_revoked" | "approval_requested" | "approval_approved" | "approval_rejected" | "execution_blocked" | "scope_denied";
  severity: "info" | "warning" | "security";
  detail: string;
  metadata?: Record<string, unknown>;
}) {
  const db = requireDb(await getDb());
  await db.insert(connectorAuditEvents).values({
    userId: input.userId,
    connectorId: input.connectorId ?? null,
    approvalId: input.approvalId ?? null,
    eventType: input.eventType,
    severity: input.severity,
    detail: input.detail,
    metadataJson: JSON.stringify(input.metadata ?? {}),
  });
}

export async function listAuditEvents(userId: number, limit = 40) {
  const db = requireDb(await getDb());
  return db.select().from(connectorAuditEvents).where(eq(connectorAuditEvents.userId, userId)).orderBy(desc(connectorAuditEvents.createdAt)).limit(limit);
}
