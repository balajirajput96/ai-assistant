# AI Assistant — Release Plan

## Release Gates

The current build is a prototype. A production release may not be declared until each release gate has objective evidence. Any unavailable gate is a **blocker**, not a minor warning.

| Gate | Required evidence | Current state |
|---|---|---|
| Native Android implementation | Kotlin/Jetpack Compose build, device tests, signed release artifact | Not started; prototype uses Expo |
| Provider safety | App Check, quota controls, provider fallback tests, secret review | Partially designed; not production-verified |
| Documents and media | Parser security tests, source citation tests, storage lifecycle | Not started |
| Connectors and MCP | Consent, scopes, revocation, health checks, injection tests, audit logs | Not started |
| Automation | Durable worker, idempotency, concurrency, retry/cancel tests, user pause controls | Not started |
| Privacy | Published policy, disclosure flows, export/delete, retention record, third-party inventory | Not started |
| Play compliance | Target SDK validation, Data safety form, store listing, screenshots, app access instructions | Not started |
| Operational readiness | Crash monitoring, latency dashboards, incident runbook, backup/restore verification | Not started |

## Delivery Stages

| Stage | Outcome | Exit condition |
|---|---|---|
| 1. Prototype validation | Chat-first interface, local tasks/workflows, trustworthy unavailable states | Usability feedback and deterministic app tests pass |
| 2. Native foundation | Kotlin/Compose client, repositories, secure storage, provider abstraction | Offline and failure recovery tests pass |
| 3. Controlled intelligence | Gemini/Firebase AI Logic integration, document pipeline, citation model | Security review and source-grounding tests pass |
| 4. Approved integrations | OAuth connectors, GitHub plan mode, MCP discovery, permission layer | Scope/revocation/approval tests pass |
| 5. Durable automation | Server workflows, scheduler, logs, cancellation, notifications | Idempotency and duplicate-trigger tests pass |
| 6. Release candidate | Store assets, policies, security/privacy reviews, accessibility and device matrix | All gates are signed off |

## Google Play Release Requirements

Google's current guidance says that beginning **August 31, 2026**, new apps and app updates submitted to Play must target Android 16 (API level 36) or higher.[1] The release pipeline must also maintain an accurate Data safety declaration for all collected or shared data, including third-party SDK behavior; this form is required for published apps outside an internal-only test track.[2]

## References

[1] [Android Developers — Target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)

[2] [Google Play Console Help — Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
