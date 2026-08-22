# Bounded Batch Operating Model

## Chosen Operating Mode

Production operates as a **bounded batch pipeline**. A batch contains 30 planned reels, but only one reel may enter the research-to-media flow at a time. A later reel remains queued until the current reel has either uploaded successfully or has a durable blocked/failed record with an actionable reason.

| Gate | Required before advancing | Failure behavior |
|---|---|---|
| Topic reservation | Unique `duplicate_key` and `planned` state in the registry | Refuse reservation and log the collision |
| Research | Source metadata and claim boundaries | Mark blocked; do not write a script as factual |
| Script | Hindi narration separates evidence, hypothesis, and belief | Return to research with a revision reason |
| Media | Narration, visuals, captions, and vertical render | Retain failed artifact and retry record |
| QC | Evidence, duration, ratio, audio, captions, and integrity all pass | No Drive upload |
| Upload | Video plus source/QC metadata is confirmed in Drive | Keep `verified`, retry idempotently |

## Batch Rules

The batch state stores the next reel, retry cap, current batch, and failure history. A completed upload advances `next_reel` only after the Drive file inventory is verified. The queue records topic concepts only; it does not claim that a planned topic has already been researched or supported by evidence.

## Continuation Limit

The local tracker is reusable across sessions, but it is not treated as a 24/7 process. Each bounded session starts by validating `topic_registry.csv`, `production_status.json`, `failures.json`, and the relevant Drive folder before selecting the next queued reel.
