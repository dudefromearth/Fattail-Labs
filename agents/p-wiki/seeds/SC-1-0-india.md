# SC-1-0 — Portal seam (India)

**Plan:** GO SC-1 · Source Contract v0.1.4 · **DL-568**

## Seam (named)

One portal: `POST /api/wiki-agent/contracts`. **No second portal. No second store.**

| Signal | Schema |
|--------|--------|
| `source_kind` present | Source Contract v0.1.4 (required set §2.1–2.2) |
| `kind=session` and no `source_kind` | Unchanged (parent III.3/III.4) |
| `kind=source_change` \| `registration` and no `source_kind` | As-built WA-1 (poll adapters become SC-3 later) |

`source_kind` closed: `help_guide` · `course` · `iki_factory_template` · `transcript` · `youtube` · `blog` · `admin_push`. Unrecognized → loud abort, ledger `rejected`.

Optional `acquired_by` when present: `poll` · `push` · `subscribe` · `skill`.

Watermark: Wiki-side table `wiki_source_watermarks` keyed `(source_kind, source_id)` → `content_hash`, `seen_at`. Not source-system state (L9). No body column (L5).

Ledger kind for these rows: `source_contract`. Page bytes stay in git. SC-1 does not compose.
