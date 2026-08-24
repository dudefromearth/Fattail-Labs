# SC-3-G Delta Gate — poll S1+S2 GET-only (2026-08-24)

**Gate:** plan v1.0 SC-3-G  
**Spec:** Source Contract v0.1.4 · **GO SC-3** · **DL-571**  
**Verdict: PASS**

Delta did not modify the work under review.

No Factory tree. No emitters. No MiniTwo. OD-6 unpublish HELD. S3 is SC-3b.

## Allowlist

| Path | Role |
|------|------|
| `server/wiki_agent_poller.py` | `poll_courses_source` / `poll_help_source` |
| `server/wiki_source_poll_tick.py` | 15m local tick; MiniTwo not required |
| `server/tests/test_wiki_source_contract_poll.py` | Kilo |
| `Architecture/00-decision-log.md` | **DL-571** |

WA-2 `poll_courseware` / `poll_help` (`source_change`) left in place for
existing characterization. P2 tick uses the Source Contract adapters.

## Evidence

```
tests/test_wiki_source_contract_poll.py + test_wiki_agent_wa2.py
15 passed in 1.32s
tests/test_wiki*.py  101 passed in 4.70s
```

| Claim | Proof |
|-------|--------|
| GET-only | `test_poller_get_only` — calls GET list+detail; `request("POST")` raises `poller may only GET` |
| L10 hash wins | `test_l10_signal_new_same_hash_no_compose` — pointer signal `created`, watermark hash matches, `composed is False`, git log seed-only |
| Disposition always | every item returns `status` + `reason` (`hash_unchanged` or accepted/failed-partial) |
| Published change lands | `test_published_change_envelope_and_watermark` — envelope + watermark + draft page |
| Missing signal still hashes | `test_missing_signal_still_hashes` |
| MiniTwo not required | tick docstring: 15 minutes local; `mini_two` not configured |

## Residual

- **SC-3b** — Factory Deploy publication signal does not exist yet.
- S4 poll (OD-10), S6 (OD-7), OD-6 unpublish remain holds.
