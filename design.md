# AI Assistant — Mobile Interface Design

## Product Intent

AI Assistant is a mobile-first command center for conversational AI, research, documents, task orchestration, and user-controlled automations. The initial build prioritizes a clear, locally usable interface that demonstrates the core product flow without implying that unavailable providers, connected accounts, or background services are active.

## Screen List and Content

| Screen | Primary content | Core functionality |
|---|---|---|
| Chat | Conversation thread, quick prompts, attachment affordance, agent-mode switch, message composer | Send a local draft request, inspect assistant response, toggle assisted-agent framing, create a task from a prompt |
| Workflows | Workflow list, run state, risk badge, approval requirement, new-workflow sheet | Start, pause, resume, cancel, and review locally simulated low-risk workflows; higher-risk actions remain approval-gated |
| Tasks | Task queue, status filters, progress summaries, task detail sheet | Review planned/running/completed/blocked tasks and cancel pending local tasks |
| Memory | Local preference cards, memory categories, deletion controls | View, add, and remove locally stored preferences; clear all local memories after confirmation |
| Settings | Privacy controls, provider availability, theme, notifications and data controls | Configure device-local preferences and inspect explicit unavailable states for providers and connectors |
| Document detail sheet | Document metadata, source scope, processing status | Present the proposed document-intelligence pipeline and an honest unavailable state until file parsing is connected |
| Research detail sheet | Research plan, source criteria, verification labels | Show a proposed research workflow and distinguish draft planning from verified external research |

## Portrait Layout and One-Handed Interaction

All primary screens are designed for a 9:16 portrait viewport. The bottom tab bar exposes the four most frequent destinations—Chat, Workflows, Tasks, and Settings—with reachability for a thumb. The primary chat composer remains visually anchored at the bottom, with attachment and voice affordances placed at the outer edges to prevent accidental taps. Risk-bearing actions are surfaced in sheets with a distinct confirmation control rather than being hidden in menus.

The visual hierarchy follows familiar iOS conventions: a large but restrained page title, standard 44pt-or-larger touch targets, grouped settings rows, and sheets for focused secondary actions. The same layout remains Android-friendly through platform-neutral React Native components and clear Material icon fallbacks.

## Key User Flows

| User objective | Flow |
|---|---|
| Ask the assistant for help | Open **Chat** → enter a request or tap a quick prompt → optionally enable **Agent mode** → send → receive a transparent local prototype response and task suggestion |
| Run a safe workflow | Open **Workflows** → tap **New workflow** → choose a low-risk template → review its actions and local-only constraint → start → inspect step status in **Tasks** |
| Review autonomous-action safety | Open a workflow → inspect risk level and approval requirement → tap **Request approval** for elevated actions → remain blocked until a real approval service is connected |
| Manage memory | Open **Settings** → open **Memory** → remove one preference or clear local memories → confirm destructive action → see updated state |
| Understand provider and connector status | Open **Settings** → inspect provider status → see available, planned, and unavailable capabilities without fake-connect controls |

## Color and Typography Choices

The brand uses **Midnight Ink** (`#0B1220`) as the quiet dark foundation, **Signal Blue** (`#2F6BFF`) for decisive actions and selected controls, **Aqua Circuit** (`#18B6C9`) for assistant and intelligence accents, and **Soft Cloud** (`#F6F8FC`) for light-mode surfaces. Workflow safety is communicated through **Verified Green** (`#1B9C67`), **Caution Amber** (`#C98200`), and **Guardrail Red** (`#C43D4B`), never through color alone. The type scale favors a compact, high-legibility hierarchy with large section titles, 16pt body copy, and 13pt metadata.

## Interaction Principles

The interface never presents a control as functional unless it has a meaningful local action or a clear unavailable explanation. Actions with external, destructive, financial, or publishing implications require a visible risk state and a confirmation step. Long-running or remote functions are described as planned capabilities until their backend, authorization, and policy controls are implemented and tested.

## Initial Domain Vocabulary

| Entity | Purpose | Key fields |
|---|---|---|
| ConversationMessage | One locally retained chat entry | id, role, content, createdAt, attachmentType |
| AgentTask | A planned or executing unit of work | id, title, status, riskLevel, progress, createdAt, updatedAt |
| Workflow | Reusable ordered task template | id, name, trigger, actions, status, riskLevel, approvalRequired |
| MemoryItem | User-controlled local preference or note | id, category, value, createdAt, sensitive |
| ProviderStatus | Capability health and availability state | id, label, capability, status, detail |
| AuditEvent | Transparent record of user-initiated local action | id, action, riskLevel, status, createdAt |
