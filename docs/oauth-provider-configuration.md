# OAuth Provider Configuration and PKCE Policy

## Secure Configuration Boundary

The provider-configuration panel is a **readiness dashboard**, not a credential-entry form. It is intentionally restricted to project administrators and reports only whether a client ID, client secret, and exact redirect URI are configured. The mobile client never receives a client secret, access token, refresh token, authorization code, or PKCE verifier.

| Provider | Protected configuration keys | Mobile visibility |
|---|---|---|
| GitHub | `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`, `OAUTH_GITHUB_REDIRECT_URI` | Presence indicators and redacted redirect URI only |
| Google Workspace | `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_GOOGLE_REDIRECT_URI` | Presence indicators and redacted redirect URI only |

The client-secret value must be added later through protected project settings, not typed into a chat, stored in local state, or included in the Android bundle. Until all three values are present for a provider, the user interface labels the configuration as **Incomplete** and external authorization remains blocked.

## PKCE Policy

The configuration service displays, but does not permit editing of, the production PKCE policy. RFC 8252 requires public native app clients to use PKCE and recommends using an external user-agent rather than an embedded web view for authorization.[1] Google’s installed-app guidance specifies the S256 code-challenge method, a high-entropy verifier with a 43–128-character range, a state value for request validation, and exact redirect-URI matching.[2]

| Policy control | Enforced value | Reason |
|---|---|---|
| Challenge method | `S256` | Avoids plaintext verifier transport |
| Verifier length | 43–128 characters | Conforms to provider guidance for high-entropy verifiers |
| Authorization surface | System browser or secure browser tab | Keeps provider credentials outside the application rendering context |
| State validation | Required | Binds redirect responses to the initiating request and reduces request forgery risk |
| Token exchange | Server only | Prevents client-secret and refresh-token exposure in the mobile application |

## Operational Flow After Credentials Are Added

The next implementation stage must create a short-lived authorization transaction on the server, generate and persist a one-time `state` value plus PKCE verifier reference, open the provider’s authorization URL in an external browser, validate the returned state and exact redirect, exchange the authorization code on the server, encrypt the resulting token reference, and write an audit event. The existing scope approval must be checked again at execution time; it is not a substitute for provider authorization or an action-specific approval.

> The configuration panel is intentionally informative. It does not expose an “override” control because a client-side toggle must never weaken server-enforced PKCE, redirect validation, or token-handling policy.

## References

[1] [IETF RFC 8252 — OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/html/rfc8252)

[2] [Google for Developers — OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)
