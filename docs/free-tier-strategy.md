# AI Assistant — Free-Tier and Cost-Control Strategy

## Principle

The product should be **free-first, not free-forever by assumption**. A capability is enabled only after its current quota, regional availability, data terms, rate limits, and operational cost have been verified. User-visible quota status must distinguish remaining allowance, temporary provider failure, and unconfigured capability.

## Service Matrix

| Service class | Intended purpose | Low-cost starting path | Required controls | Fallback |
|---|---|---|---|---|
| Model inference | Text, structured plans, vision, and multimodal analysis | Firebase AI Logic with the selected Gemini provider, subject to current provider terms | Per-user limits, App Check, model allow-list, payload caps, usage telemetry | Lower-cost approved model, then a clear unavailable state |
| Local persistence | Recent chat, task drafts, preferences | Encrypted device storage/database | Encryption, retention limits, export/delete | Session-only behavior |
| Cloud state | Auth, multi-device sync, audit records | Managed database only after a user-value threshold is established | Least privilege, tenant isolation, data retention | Local-only mode |
| File processing | User-authorized documents and media | Server-side object storage and parse queue | Type/size limits, malware scanning, encryption, delete lifecycle | Client warning that processing is unavailable |
| Scheduled work | Durable reminders and low-risk workflows | Server-side scheduler and worker | Idempotency, concurrency cap, user pause/cancel, cost guard | Manual execution |
| Connected apps | OAuth-based external tools and repositories | Official APIs only | Scope minimization, consent, revocation, audit logs | Plan-only workflow |

Firebase documents that Firebase AI Logic can expose Gemini models through client SDKs and supports Firebase App Check and configurable per-user rate limits. Its specific free-tier availability and pricing vary by selected provider and should be confirmed at release time.[1]

## Cost Controls

The application should enforce message-length and attachment-size limits before inference, select a lower-cost model for simple classification and extraction, and reserve higher-capability models for explicit user requests or a policy-approved escalation. Retrieval results should cap source count and chunk count. Background work must use queue-level concurrency limits and cancellation checks. A monthly project budget, per-user soft cap, and circuit breaker must prevent accidental overrun.

## Graceful Degradation

When a primary provider is unavailable or a quota is exhausted, the response order is: approved secondary provider, explicitly supported on-device or local capability, then a truthful unavailable state. The interface must never invent an answer, cite a source it did not retrieve, or imply that a workflow ran when an upstream service failed.

## Reference

[1] [Firebase — Gemini API using Firebase AI Logic](https://firebase.google.com/docs/ai-logic)
