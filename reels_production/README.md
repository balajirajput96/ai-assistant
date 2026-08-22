# 3000 Hindi Research Reels

This workspace records the planned and verified production state of each Hindi educational reel. A reel is never marked complete unless its source record, script, narration, vertical media, captions, quality-control result, and Drive upload evidence are all present.

The directory is organized around four records: `topic_registry.csv` prevents duplicate topic-angle pairs, `source_metadata/` stores source-level verification, `reels/` holds per-reel deliverables, and `progress/` holds durable batch and failure state. The first production batch contains reels `0001` through `0030`; only Reel `0001` is currently planned.

## Completion Contract

| Stage | Required evidence | Completion rule |
|---|---|---|
| Research | Source metadata with a source type, URL or DOI, access date, claim classification, and limitations | At least one suitable source supports every important factual claim |
| Script | Hindi script with hook, explanation, evidence label, takeaway, and source references | Script avoids false certainty and distinguishes evidence from opinion or belief |
| Narration | Hindi voice audio and measured duration | Voice is intelligible and usable for a vertical short-form edit |
| Visuals | Original vertical visual assets or licensed/public-domain media references | No unsupported visual claim is introduced |
| Captions | Time-aligned Hindi subtitle file | Captions match the spoken narration closely |
| QC | JSON result covering factual support, duration, aspect ratio, audio, caption sync, and file integrity | All mandatory checks pass; a failure is retained with its reason |
| Delivery | Drive file and parent-folder identifiers | The final media and source metadata have both uploaded successfully |

## Claim Labels

| Label | Permitted wording pattern | Not permitted |
|---|---|---|
| Scientific evidence | “अध्ययनों में…”, “औसतन…”, “कुछ शोध संकेत देते हैं…” | One study treated as settled fact, or correlation presented as causation |
| Hypothesis / model | “एक प्रस्तावित व्याख्या है…”, “यह मॉडल कहता है…” | Presenting an unconfirmed mechanism as a proven fact |
| Expert interpretation | “कुछ विशेषज्ञों का मत है…” | Invented expert consensus or a quotation not present in a source |
| Philosophy / spirituality | “दार्शनिक दृष्टि से…”, “आध्यात्मिक परंपरा में…” | Presenting belief as experimentally established neuroscience |

## File Naming

`Reel_0001_<short-slug>/` contains `script_hi.md`, `sources.json`, `captions_hi.srt`, `qc.json`, `reel_0001.mp4`, and `drive_upload.json`. Failed outputs are moved to a `failed/` subdirectory and retain an explicit `failure.json`; they are not silently skipped.
