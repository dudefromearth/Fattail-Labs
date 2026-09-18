# India pre-flight — VP-API-Contract-v1.3 2026-09-18

**Machine:** StudioTwo · no spec-body invention · Coach expected triple

| File | Lines | sha1 | `## ` | Last heading | Verdict |
|------|------:|------|------:|--------------|---------|
| `Specs/VP-API-Contract-v1_3.md` | 51 | `d57dc51ef52c6e6ec1fa0c20be5544cac6c2cb82` | 3 | `## Unchanged from v1.2.1` | **MATCH** (bytes identical to courier) |

**Law:** Sole change vs v1.2.1 is live stream `GET /v1/stream/{source_symbol}` (SSE): tick / bar / gen / hb. Source of truth remains served payloads (A14.8). Stream tails the ingest store — collectors untouched (CP-1). Computing-class; Labs relay one upstream per backend. Every registry symbol streams by construction (VP-L3).

**Does not.** Invent hashes. Stop `:3000`/`:4000`. Touch chain_feed.

**§ Bench delta:** Contract v1.3 is FROZEN stream law. INFRA `/v1/stream` on the sidecar is **not** seated as of this pre-flight (Labs `sa_dev.stream` mock/relay exists on the HW tree only).

**§ Flagged ideas:** inventory intact
