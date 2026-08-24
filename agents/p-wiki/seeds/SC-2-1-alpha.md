# SC-2-1 — Push compose (Alpha)

`POST /api/wiki-agent/push` admin cookie. Infer Source Contract envelope
(`source_kind=admin_push`, `acquired_by=push`, `content_hash` of body).
L12 thin → `failed-partial`, no git, retries 0. Else wrap frontmatter
`status: draft`, git, board `awaiting_approval`, watermark. No LLM rewrite
of Coach’s artifact (L4).
