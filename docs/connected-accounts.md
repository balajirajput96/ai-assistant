# Connected Accounts — User Guide

## Purpose

The **Connected accounts** page gives each signed-in user a dedicated place to view GitHub and Google Workspace connection status, inspect the minimum requested scopes, request a connection review, and disconnect an account. It is reachable from **Settings → Manage connected accounts**.

The page remains informative when the user is signed out. It shows supported providers and requested scopes but blocks every connection action until a user session exists. This prevents anonymous OAuth requests and ensures that approvals and audit events have an accountable owner.

## Account States

| State | Meaning | User action |
|---|---|---|
| Provider setup required | Project credentials, redirect registration, or PKCE callback support are incomplete | Wait for the project administrator to complete protected configuration |
| Not connected | The provider is ready, but the user has not requested access | Request a connection review and inspect scopes |
| Authorization pending | A scope review or provider authorization is incomplete | Review the pending request; no duplicate browser session is created |
| Connected | The provider returned a valid token reference after a secure callback | Use approved read-only features or disconnect the account |
| Disconnected | The connection was revoked or never finalized | Request a new review when needed |

## Scope Review and Disconnect

A connection request only records a user-bound scope review; it does not itself grant access. The user must review requested scopes, the project must have valid provider configuration, and the future server-side OAuth callback must validate PKCE and `state` before a connection reaches **Connected**. GitHub scopes limit OAuth-token access and may be reduced by the user, so feature availability must be based on the scopes actually granted rather than the scopes originally requested.[1]

Disconnecting marks the saved connection state as revoked, clears recorded granted scopes, and writes a security audit event. When live OAuth token storage is enabled, the same action must invalidate the encrypted token reference and invoke the provider’s revocation flow where available.

## Privacy and Safety

The page never displays credentials, tokens, authorization codes, or PKCE verifiers. It does not run external actions in the current prototype. Each consequential action will require an additional action-specific approval even after an account is connected.

## Reference

[1] [GitHub Docs — Scopes for OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
