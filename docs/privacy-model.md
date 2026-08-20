# AI Assistant — Privacy Model

## Privacy Posture

The product uses data minimization: it processes only the data needed for a requested feature, keeps it for the documented retention period, and gives the user controls to inspect, export, and delete retained information. The local prototype currently stores only device-local assistant state and does not connect third-party accounts.

## Data Categories and Controls

| Data category | Proposed purpose | Default storage | User control |
|---|---|---|---|
| Conversation content | Produce a response and preserve selected history | Local encrypted store; server only where a provider request is necessary | Delete conversation, disable local retention, export |
| Task and workflow records | Show progress and audit user-approved actions | Local store; durable server state only for enabled backend workflows | Pause, cancel, delete where allowed, export |
| Documents/media | User-authorized analysis | Encrypted object storage only after upload feature exists | Remove source, inspect source attribution, export |
| Connector tokens | Access an explicitly connected service | Server-side secret store, never device logs or source code | View connection, revoke, reauthorize |
| Diagnostics | Reliability, abuse prevention, and cost control | Redacted telemetry with short retention | Opt-out where appropriate and disclosure in policy |

## Permission and Disclosure Rules

Microphone, camera, files, and notification permissions are sensitive. The client should request them only immediately before a user-initiated feature and offer a working non-permission fallback. Google Play requires transparent disclosure of access, collection, use, handling, and sharing, including data handling by third-party AI integrations; developers remain responsible for third-party compliance.[1]

For any unexpected sensitive-data access, the product must show a prominent, feature-specific in-app disclosure before the permission request and obtain affirmative consent. The privacy policy must be available in the app and through a publicly accessible URL, describe data handling and retention, and include a privacy contact.[1]

## Retention and Deletion

Conversation retention should default to local storage with a setting to disable persistence. Cloud workflows, uploaded files, and audit events require separately documented retention windows before release. If accounts are introduced, the service must implement a discoverable in-app and external account-deletion route; Google Play states that freezing an account is not a substitute for deletion.[1]

## Reference

[1] [Google Play Console Help — User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
