import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { connectorCatalog, getConnectorDefinition } from "../shared/connectors";
import { oauthProviderConfiguration, pkcePolicy, resolveProviderConfiguration } from "../shared/oauth-configuration";
import type { ApprovalRequest, AuditEvent, ConnectorConnection, ConnectorProviderId } from "../shared/assistant-types";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const providerIdSchema = z.enum(["github", "google_workspace"]);
const approvalDecisionSchema = z.enum(["approved", "rejected"]);

const toIso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const parseStringArray = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

function mapConnection(row: Awaited<ReturnType<typeof db.listConnectorConnections>>[number]): ConnectorConnection {
  return {
    id: row.id,
    providerId: row.providerId as ConnectorProviderId,
    providerLabel: row.providerLabel,
    state: row.connectionState,
    requestedScopes: parseStringArray(row.requestedScopesJson),
    grantedScopes: parseStringArray(row.grantedScopesJson),
    expiresAt: toIso(row.expiresAt),
    lastValidatedAt: toIso(row.lastValidatedAt),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapApproval(row: Awaited<ReturnType<typeof db.listApprovalRequests>>[number]): ApprovalRequest {
  return {
    id: row.id,
    connectorId: row.connectorId,
    actionName: row.actionName,
    actionSummary: row.actionSummary,
    riskLevel: row.riskLevel,
    status: row.approvalStatus,
    requestedScopes: parseStringArray(row.requestedScopesJson),
    requestedAt: new Date(row.requestedAt).toISOString(),
    decidedAt: toIso(row.decidedAt),
    decisionNote: row.decisionNote,
    expiresAt: toIso(row.expiresAt),
  };
}

function mapAudit(row: Awaited<ReturnType<typeof db.listAuditEvents>>[number]): AuditEvent {
  return {
    id: row.id,
    connectorId: row.connectorId,
    approvalId: row.approvalId,
    type: row.eventType,
    severity: row.severity,
    detail: row.detail,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  assistant: router({
    chat: publicProcedure
      .input(z.object({ message: z.string().trim().min(1).max(6000), agentMode: z.boolean().default(false) }))
      .mutation(async ({ input }) => {
        const mode = input.agentMode ? "agent planning mode" : "conversation mode";
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are AI Assistant, a concise, trustworthy mobile assistant. You are operating in a prototype with no browser, connected accounts, files, microphone, scheduler, or external tool execution. Never imply that you performed an external action, accessed a document, searched the web, changed an account, or scheduled work. For consequential requests, outline a safe plan and state which user approval or integration would be required. Keep answers under 220 words and use short paragraphs.",
              },
              { role: "system", content: `Current interaction mode: ${mode}.` },
              { role: "user", content: input.message },
            ],
          });
          const rawContent = response.choices[0]?.message?.content;
          const answer = typeof rawContent === "string" ? rawContent.trim() : "";
          return {
            status: "ready" as const,
            answer: answer || "I could not form a response. Please try again.",
            suggestedTask: input.agentMode
              ? { title: "Review assistant plan", summary: "Review the proposed plan before connecting tools or approving external actions.", riskLevel: "low" as const }
              : null,
          };
        } catch (error) {
          console.error("[assistant.chat] model request failed", error);
          return {
            status: "degraded" as const,
            answer: "The assistant model is temporarily unavailable. Your request is still visible in this local session, but no external action was attempted.",
            suggestedTask: null,
          };
        }
      }),
  }),

  connectors: router({
    catalog: publicProcedure.query(() => connectorCatalog),

    admin: router({
      providerConfiguration: adminProcedure.query(() => ({
        providers: oauthProviderConfiguration.map((provider) => resolveProviderConfiguration(provider, process.env)),
        pkcePolicy,
      })),
    }),

    overview: protectedProcedure.query(async ({ ctx }) => {
      const [connections, approvals, auditEvents] = await Promise.all([
        db.listConnectorConnections(ctx.user.id),
        db.listApprovalRequests(ctx.user.id),
        db.listAuditEvents(ctx.user.id),
      ]);
      return { connections: connections.map(mapConnection), approvals: approvals.map(mapApproval), auditEvents: auditEvents.map(mapAudit) };
    }),

    requestConnection: protectedProcedure
      .input(z.object({ providerId: providerIdSchema }))
      .mutation(async ({ ctx, input }) => {
        const definition = getConnectorDefinition(input.providerId);
        if (!definition) throw new TRPCError({ code: "NOT_FOUND", message: "Connector provider is not supported." });

        const connection = await db.requestConnectorConnection({
          userId: ctx.user.id,
          providerId: definition.id,
          providerLabel: definition.label,
          requestedScopes: definition.defaultScopes,
        });
        await db.createAuditEvent({
          userId: ctx.user.id,
          connectorId: connection.id,
          eventType: "connection_requested",
          severity: "info",
          detail: `${definition.label} connection request created with least-privilege scopes. OAuth was not started because project credentials are not configured.`,
          metadata: { providerId: definition.id, requestedScopes: definition.defaultScopes },
        });

        const pending = (await db.listApprovalRequests(ctx.user.id)).find(
          (approval) => approval.connectorId === connection.id && approval.approvalStatus === "pending" && approval.actionName === `Authorize ${definition.label} scopes`,
        );
        const approval =
          pending ??
          (await db.createApprovalRequest({
            userId: ctx.user.id,
            connectorId: connection.id,
            actionName: `Authorize ${definition.label} scopes`,
            actionSummary: `Approve the proposed ${definition.label} scope request. Approval does not start OAuth or grant an access token until provider credentials, PKCE, redirect validation, and the external consent flow are configured.`,
            riskLevel: definition.riskLevel,
            requestedScopes: definition.defaultScopes,
            redactedArguments: { provider: definition.id, grant: "oauth2_pkce", token: "never stored in client" },
          }));
        if (!pending) {
          await db.createAuditEvent({
            userId: ctx.user.id,
            connectorId: connection.id,
            approvalId: approval.id,
            eventType: "approval_requested",
            severity: "warning",
            detail: `Approval is required before ${definition.label} OAuth configuration can proceed.`,
            metadata: { requestedScopes: definition.defaultScopes },
          });
        }
        return { connection: mapConnection(connection), approval: mapApproval(approval), oauthStarted: false };
      }),

    decideApproval: protectedProcedure
      .input(z.object({ approvalId: z.number().int().positive(), decision: approvalDecisionSchema, note: z.string().trim().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const approval = await db.decideApprovalRequest({ userId: ctx.user.id, approvalId: input.approvalId, status: input.decision, decisionNote: input.note });
        if (!approval) throw new TRPCError({ code: "NOT_FOUND", message: "Approval request was not found." });
        if (approval.approvalStatus !== input.decision) {
          throw new TRPCError({ code: "CONFLICT", message: "This approval request has already been decided." });
        }
        await db.createAuditEvent({
          userId: ctx.user.id,
          connectorId: approval.connectorId,
          approvalId: approval.id,
          eventType: input.decision === "approved" ? "approval_approved" : "approval_rejected",
          severity: input.decision === "approved" ? "info" : "warning",
          detail:
            input.decision === "approved"
              ? "Scope request approved. OAuth remains blocked until provider credentials and validated PKCE redirect handling are configured."
              : "Scope request rejected. No OAuth authorization was started and no token was issued.",
          metadata: { decisionNote: input.note ?? null },
        });
        return { approval: mapApproval(approval), oauthStarted: false };
      }),

    revoke: protectedProcedure
      .input(z.object({ connectionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const connection = await db.revokeConnectorConnection(ctx.user.id, input.connectionId);
        if (!connection) throw new TRPCError({ code: "NOT_FOUND", message: "Connector connection was not found." });
        await db.createAuditEvent({
          userId: ctx.user.id,
          connectorId: connection.id,
          eventType: "connection_revoked",
          severity: "security",
          detail: `${connection.providerLabel} connector was revoked. Any future production token reference must be invalidated server-side.`,
        });
        return { connection: mapConnection(connection) };
      }),
  }),
});

export type AppRouter = typeof appRouter;
