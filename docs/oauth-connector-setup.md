# OAuth Connector, Approval, and Audit Design

## Current Product State

The application now records a user-bound connector request, proposed least-privilege scopes, an explicit scope-approval decision, revocation intent, and append-only audit events. This is an **authorization framework**, not a live GitHub or Google Workspace integration: no OAuth client ID, client secret, authorization URL, browser session, access token, refresh token, or external API call is present in the current build.

## Why the Flow Is Deliberately Blocked

Native applications are public clients and must not treat a bundled secret as confidential. RFC 8252 requires public native clients to use PKCE and recommends starting authorization in an external user agent rather than an embedded web view.[1] The production flow must therefore originate in a system browser or secure browser tab, bind a high-entropy `state` value and PKCE verifier to a short-lived server record, validate the redirect and issuer, exchange the code server-side, and store only an encrypted server-side token reference.

| Step | Current implementation | Production requirement |
|---|---|---|
| Provider catalog | GitHub and Google Workspace definitions | Register a verified OAuth client per provider and environment |
| Scope selection | Static, low-privilege default scopes | Feature-specific scopes, a visible consent explanation, and no scope escalation without a new approval |
| Authorization | Blocked with a transparent configuration-required state | External browser authorization code flow with PKCE and exact redirect validation |
| Token handling | No token is issued or stored | Server-side encrypted secret store; client receives only connection state and expiry metadata |
| Approval | User approves or rejects the proposed scopes | Bind approval to connector, scopes, action digest, expiry, and a one-time execution nonce |
| Audit | Database records request, decision, and revocation state | Append-only storage, redacted metadata, correlation ID, retention policy, and export capability |
| Revocation | Marks the connection revoked and clears recorded granted scopes | Call provider revocation endpoint where supported, delete token reference, invalidate jobs, and record outcome |

## Provider Scope Policy

GitHub scopes limit the access a token receives and do not grant permissions beyond the user's own access. GitHub also notes that users may grant fewer scopes than requested, so the server must verify granted scopes and degrade functionality rather than assuming success.[2] The initial catalog requests only `read:user` for GitHub. It does not request `repo`, `workflow`, `delete_repo`, `admin:*`, publishing, or write-oriented scopes.

The Google catalog begins with OpenID Connect identity scopes only. Google advises choosing scopes before implementation, notes that broad scope requests reduce consent likelihood, and requires a valid client registration and redirect URI match. Its installed-app guidance describes PKCE with an S256 challenge and a state value to mitigate request forgery.[3]

## Approval Policy

Scope consent and action approval are distinct. A user may approve a scope review without authorizing an actual external write, publication, or destructive action. Every consequential action must create a fresh approval request showing the target, the redacted action summary, risk classification, requested scopes, expiry, and a reject option. Approval alone must not bypass provider authorization or application policy.

| Risk | Default behavior |
|---|---|
| Read-only identity or public metadata | Require connector scope approval and audit record; no background execution |
| Private data read | Require scope approval, a source disclosure, and a short-lived task context |
| External write or draft creation | Require an action-specific approval after connector authorization |
| Publish, delete, organization administration, or financial action | Deny by default until a dedicated policy, recovery path, and per-action approval are implemented |

## Operational Setup Checklist

Before enabling a real provider, the development team must register the OAuth client, configure a claimed HTTPS redirect or provider-supported Android redirect, store client credentials only in server secrets, enable PKCE S256, validate `state`, constrain exact redirect URIs, set token encryption and rotation, implement revocation, add provider health checks, and complete provider-specific privacy disclosures. The first real connector should be tested using a non-production account and a read-only scope before any write capability is proposed.

## References

[1] [IETF RFC 8252 — OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/html/rfc8252)

[2] [GitHub Docs — Scopes for OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

[3] [Google for Developers — OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)
