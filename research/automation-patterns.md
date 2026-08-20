# Automation Patterns

## Pattern Selection

Durable automation must be separated from the client. Mobile processes can be stopped and background execution is constrained, so the app should submit a policy-approved job to a server worker and subscribe to state updates. The worker owns idempotency, retries, cancellation, and concurrent-run protection.

| Pattern | Use case | Required protection |
|---|---|---|
| Manual low-risk plan | Local drafting, task decomposition, user review | Local audit record and transparent status |
| Scheduled workflow | Recurring report, cleanup, reminder | Server scheduler, idempotency key, overlap prevention, pause/cancel |
| Webhook/event workflow | Approved event from an official API | Signature verification, replay protection, source allow-list |
| Approval wait state | Publish, destructive, connector, or financial operation | Task becomes `WAITING` or `BLOCKED`; no background bypass |

Firebase scheduled functions are backed by Cloud Scheduler and can trigger work on fixed schedules. Its documentation cautions that a new scheduled instance may start while a previous execution is still running, so handlers need overlap and idempotency controls.[1]

## Reference

[1] [Firebase — Schedule functions](https://firebase.google.com/docs/functions/schedule-functions)
