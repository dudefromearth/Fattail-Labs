# VP Profile API — Contract v1.3

**Status:** FROZEN interface contract. **Supersedes:**
VP-API-Contract-v1_2_1.md (sha1 08f036c8262cd2548af533e5d587eafe4fc36d97).
**Date:** 2026-09-18
**Change (sole):** live price streaming (Coach directive: each
ticker must have a live streaming price). Everything in v1.2.1
carries forward unchanged.

## Added: live stream

```
GET /v1/stream/{source_symbol}          (SSE)
```

Events, JSON per line:

- `tick` — `{ "t": <UTC ns>, "p": 6558.25, "s": 12 }` — live
  trades, server-throttled to a display cadence (≤ ~4 Hz
  aggregate; config), price on the instrument's tick grid.
- `bar` — `{ "timeframe": "1m", "t": <bar open ns>, "o":…, "h":…,
  "l":…, "c":…, "v":… }` — emitted on bar close per timeframe.
- `gen` — `{ "kind": "developing", "profile_generation_id": "…" }`
  — new developing generation available (replaces polling).
- `hb` — heartbeat with last-print age; silence beyond N s means
  reconnect (client backs off per SSE norms).

## Rules (normative)

1. **Source of truth unchanged:** streamed ticks/bars are DISPLAY
   updates; the authoritative record remains the served payloads —
   the client reconciles the developing bar and profile against
   the next payload (A14.8 honesty; a stream is never invented
   data, it is the tape relayed).
2. **Collector isolation:** the stream is fed by tailing the
   ingest store the collectors write — collectors are never
   modified or burdened (CP-1). Stream lag over store write is
   milliseconds; the honest last-print age rides the heartbeat.
3. **Access:** computing-class only, like all /v1/*; member
   browsers receive the stream via the Labs backend relay
   (display path, A2 clause 6 pattern) — one upstream SSE per
   backend, fanned out to sessions.
4. Every symbol in the served registry streams by construction —
   no per-symbol stream code (VP-L3).

## Unchanged from v1.2.1

All endpoints, envelopes (tick block included), coverage law,
caching/ETag transport, dual-source XSP, 403 deny, error set.
Mock fidelity: mock adds a canned stream fixture (ticks, one bar
close, one gen event, heartbeat).
