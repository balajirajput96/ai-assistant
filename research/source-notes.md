# Architecture Research Notes

## Connected Tool Safety

The Model Context Protocol describes connections between AI applications and external data sources or tools. Its security guidance emphasizes that users must understand and explicitly consent to data access and operations, retain control over shared data and actions, and receive clear authorization interfaces. The future integration layer therefore needs separate tool discovery, permission, approval, and revocation surfaces rather than treating an MCP connection as automatically trusted.[1]

## Function Execution Boundary

The Gemini function-calling documentation makes the execution boundary explicit: a model proposes a function name and arguments, while the application extracts, validates, and performs the function itself. The application then returns a tool result to the model for a user-facing completion. The production roadmap consequently places input-schema validation, policy evaluation, authorization, audit logging, timeout handling, and result validation in the orchestration layer, outside the model response path.[2]

## References

[1] [Model Context Protocol Specification — Security and Trust & Safety](https://modelcontextprotocol.io/specification/2026-07-28)

[2] [Google AI for Developers — Function calling with the Gemini API](https://ai.google.dev/gemini-api/docs/function-calling)

[3] [Firebase — Gemini API using Firebase AI Logic](https://firebase.google.com/docs/ai-logic)

[4] [Android Developers — Guide to app architecture](https://developer.android.com/topic/architecture)

[5] [Firebase — Schedule functions](https://firebase.google.com/docs/functions/schedule-functions)

[6] [Android Developers — Target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)

[7] [Google Play Console Help — User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)

[8] [Google Play Console Help — Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
