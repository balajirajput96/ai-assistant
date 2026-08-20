# UX Analysis

## Design Direction

The interface should be chat-first but not chat-only. The user needs a visible transition from a conversational request to a task, workflow, approval, and result. The prototype uses four reachable destinations—Chat, Workflows, Tasks, and Settings—to make this transition legible without exposing a dense control panel on first launch.

## Design Rules

| UX concern | Product response |
|---|---|
| User cannot tell whether the assistant acted | Separate drafts, local plans, blocked tasks, and completed work using plain labels and status badges |
| User may miss a high-risk consequence | Display risk before the action, then use an explicit approval step rather than a toggle hidden in settings |
| Capability is not configured | Show an unavailable explanation, not a false connect or run control |
| Mobile interaction is constrained | Keep primary navigation and message composer in the lower reach zone; use short sheets for secondary actions |
| Accessibility | Maintain readable type, visible labels, 44pt-or-larger interactive targets, and do not rely on color alone |

The approach follows Android's recommendation that app UI be driven from data models and update through one-directional state changes, which also improves recovery under process interruption.[1]

## Reference

[1] [Android Developers — Guide to app architecture](https://developer.android.com/topic/architecture)
