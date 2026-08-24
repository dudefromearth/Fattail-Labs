# WA-3-1 — wiki_refs + linkage pass (Alpha)

**Plan:** Wiki Agent v0.1.2 · **GO WA-3** · **DL-548/549**  
**Isolation:** wiki tree. Build, do not reuse a missing engine.

## In scope

Migration `wiki_refs` + reverse-pass overflow queue. FULLTEXT + title boost. Thresholds from env (fail-loud at pass time). Above-threshold `[[wikilinks]]` in the draft. Below-threshold on the **admin board card**. Reverse pass → revision drafts + **one rollup card**; overflow queryable, nothing dropped. Hook from discharge after ingest.

## Out of scope

Member `/app/wiki` rail. Embeddings. Session. Registration. Course/help/IKI trees.

## Completion

Kilo WA-3-G rows including rider volume.
