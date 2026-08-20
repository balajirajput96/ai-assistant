# AI Assistant — Product Requirements

## Product Definition

AI Assistant is a mobile companion for conversational assistance, document understanding, research planning, task orchestration, and user-governed automations. It must present a simple chat-first experience while maintaining explicit boundaries between drafting, local processing, approved automation, and external execution.

The current repository is an **interactive prototype**, not a production release. It provides server-backed text responses, local task and workflow state, risk labels, approval-gated workflow states, and local memory controls. It does **not** yet provide verified connectors, file ingestion, voice capture, web research, persistent schedules, cloud synchronization, or a Play-ready native Kotlin application.

## Target Users and Primary Jobs

| User | Primary job | Product response |
|---|---|---|
| Individual knowledge worker | Turn a request into a clear plan or draft | Chat, quick prompts, agent-plan mode, and reviewable task records |
| Research-oriented user | Organize evidence before making a conclusion | Research plan, source criteria, citation-aware document pipeline in the roadmap |
| Developer or project contributor | Plan a repository change without accidental mutation | GitHub proposal workflow that remains blocked until authorization and approval are implemented |
| Privacy-conscious user | Control retained context and consequential actions | Local-memory viewer, delete/reset controls, visible provider state, and explicit risk labels |

## Functional Scope

| Capability | Prototype status | Production acceptance criterion |
|---|---:|---|
| Text chat | Implemented | Provider abstraction, retries, response citations where applicable, usage reporting, and graceful provider failure |
| Agent planning | Implemented locally | Orchestrator with typed states, policy checks, audit records, tool results, and user-visible approvals |
| Workflows and tasks | Implemented locally | Durable backend jobs, idempotency keys, retry policy, pause/cancel, and execution history |
| Memory | Implemented locally | Scoped storage, sensitivity classification, export/delete, and retention enforcement |
| Documents and RAG | Planned | Upload, malware scanning, parser, chunking, embeddings, retrieval, source and page citations |
| Voice and media | Planned | Permission-aware capture, server-side transcription, accessible spoken output, and media-specific failure paths |
| Web research | Planned | Search, source selection, extraction, corroboration, citations, and a verified/inferred/uncertain distinction |
| Connected apps and MCP | Planned | Discovery, OAuth or token lifecycle, permission scopes, health checks, revocation, and approval gates |

## Non-Functional Requirements

The production application shall separate interface, business, and data concerns; retain data in a stable source of truth; and use unidirectional state updates. These align with Android's recommended architectural principles for scalable and testable applications.[1] The deployed experience must remain usable when a provider, network, or optional integration is unavailable. It must never represent a draft, plan, or unavailable integration as an action that was actually performed.

## Supported Platforms and Delivery Decision

The current implementation is a React Native/Expo mobile prototype because it is suitable for rapid interface validation. The requested production target remains **Android with Kotlin and Jetpack Compose**. The production migration should use a feature-modular, single-activity Compose design with `ViewModel` state holders, repository interfaces, coroutines, dependency injection, and offline-first local persistence.[1]

## Acceptance Boundaries

External publishing, data deletion beyond the local device, financial activity, repository mutation, schedule creation, connector authorization, and account actions are all **high-consequence** operations. They shall be unavailable unless the future policy engine classifies the action, validates arguments, verifies authorization, records an audit event, and obtains the approval required by the configured risk policy.

## References

[1] [Android Developers — Guide to app architecture](https://developer.android.com/topic/architecture)
