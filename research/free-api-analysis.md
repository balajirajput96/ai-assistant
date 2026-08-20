# Free and Low-Cost API Analysis

## Conclusion

The initial AI path should be Firebase AI Logic with a provider selected at configuration time. Firebase documents support for both Gemini Developer API and Agent Platform Gemini API providers, a mobile proxy boundary, App Check, per-user rate controls, and a potential Developer API free tier.[1] No fixed quota, price, model identifier, or regional availability is assumed here because these change.

| Option | Use in roadmap | Cost/availability assumption | Guardrail |
|---|---|---|---|
| Firebase AI Logic + Gemini Developer API | Primary prototype-to-product model path | May offer a free tier; verify before enabling | App Check, per-user rate limit, quota dashboard |
| Firebase AI Logic + Agent Platform Gemini API | Enterprise-grade alternative | Billing and deployment eligibility require verification | Same provider abstraction and budget controls |
| Local device state | Offline history and preferences | No per-request inference cost | Encryption, data deletion controls |
| Official third-party APIs | Future GitHub, search, calendar, and tool connections | Quotas and OAuth eligibility vary by provider | Official API only, consent and scope minimization |

## Reference

[1] [Firebase — Gemini API using Firebase AI Logic](https://firebase.google.com/docs/ai-logic)
