# AI Assistant — Security Model

## Security Objective

The product must ensure that a model response cannot silently gain authority over user data, external accounts, or consequential actions. Security design therefore treats the model, retrieved content, connector responses, and user-provided documents as untrusted inputs until validated by application code and policy.

## Control Model

| Threat | Primary controls | Evidence to retain |
|---|---|---|
| Prompt injection from a webpage, file, or connector | Treat content as data; isolate tool instructions; schema-validate tool proposals; restrict context; require policy approval | Input origin, proposed tool call, policy decision |
| Over-privileged connector | OAuth scopes minimized per tool; connection health, tool inventory, revocation, and reauthorization | Scope grant, connector ID, consent time, revocation event |
| Unsafe tool call | Server-side allow-list; typed schema; risk class; timeout; idempotency key; human approval when required | Tool args redacted as needed, approval decision, result status |
| Secret exposure | No secrets in APK, source control, client logs, chat memory, or error messages; server-side secret storage and rotation | Secret scan results, access event metadata |
| Account or session compromise | OAuth, device secure storage, short sessions, token refresh/revocation, rate limits | Authentication event, session expiry, failed-auth telemetry |
| Data loss or destructive action | Confirmation UI, policy gate, explicit operation preview, backup/retention policy, soft-delete where justified | User confirmation, task ID, completion or rollback state |

## MCP and Connector Controls

The MCP specification explicitly notes that tool access can enable arbitrary data access and code execution paths. It says users must understand and explicitly consent to data access and operations, retain control, and receive clear authorization interfaces.[1] The production connector manager must therefore show the provider, endpoint, discovered tools, scopes, risk classification, health, and last check. No tool is implicitly trusted because a server is reachable.

## Risk Policy

| Risk class | Examples | Default behavior |
|---|---|---|
| Low | Local summarization, draft generation, local test execution | Run after standard validation and audit |
| Medium | Draft branch creation, internal configuration update | Show preview and require an explicit approval setting |
| High | Public publishing, production setting changes, bulk communications | Per-action confirmation and restrictive connector scope |
| Destructive | Deleting cloud data, revoking access, irreversible mutation | Separate confirmation, recovery check, and audit event |
| Financial | Payments, transfers, purchases, investment actions | Unsupported unless a dedicated regulated implementation and approval policy are verified |

## Reference

[1] [Model Context Protocol Specification — Security and Trust & Safety](https://modelcontextprotocol.io/specification/2026-07-28)
