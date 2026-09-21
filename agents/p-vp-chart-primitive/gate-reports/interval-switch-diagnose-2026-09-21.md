# Interval-switch diagnose — root cause named, no patches applied

**Date:** 2026-09-21
**Machine:** StudioTwo (Next `:3000` + Labs API `:4000`, both freshly started for this session), consumer of StudioOne `:4010/:4011/:4012` per TOPO-1.
**Authority:** Coach handoff, "Volume Profile (Visible Range) — Interval-Switch Failure." First Task only — reproduce, name root cause, **no patching**.
**Verified against:** live browser repro (DevTools Network + Console via Chrome automation) + actual source on this checkout (`c2a437ba` + uncommitted dashboard-only changes, none touching VP). Docs (Arch 35/37, feature audit, manifest) read first, cross-checked against code — one correction noted below (§5).

---

## First Task — answered

> "Confirm whether the interval-change request ever leaves the browser... This one answer splits the problem in half."

**The request leaves the browser.** Every interval switch fires real `fetch()` calls (visible in the Network tab). The failure is **not** a request that never leaves, and — with one caveated exception (§4) — **not** a hung await either. It is a **swallowed error**: the client code deliberately converts non-2xx responses into a normal-shaped "empty" result with no `throw`, no `console.error`, nothing. Confirmed directly: across dozens of 422s and 500s during this session, `read_console_messages(onlyErrors)` returned **zero** errors or exceptions, in any tab, at any point.

That silence is not a bug in the reporting — it's the code working exactly as written. See §3.

---

## Root cause 1 of 3 — invalid `tf` sent directly for "grouped" intervals (422)

The UI offers 11 intervals (`web/lib/saTheme.ts` `SA_INTERVAL_GROUPS`): `1m 2m 5m 10m 30m 1h 2h 4h 1d 2d 7d`. The member OHLC hop (`server/routes/vp_display.py` → `history_app.py`) accepts **only** `1m|5m|15m|1h|1d` — everything else is `422 tf must be 1m|5m|15m|1h|1d`. This is documented, known law (Arch 35 §"Data path", feature audit §"Honest gaps" #2) — there's a `nativeOhlcTf()` mapper in `web/lib/saView.ts` meant to translate `10m → 5m` (etc.) before the OHLC fetch, then `resampleOhlc()` client-side to synthesize the display bars.

**Verified live:** switching the interval select to `10m` fires

```
GET /api/app/vp/v1/ohlc/ES?tf=10m&contract=ESZ2026   → 422
GET /api/app/vp/v1/ohlc/ES?tf=10m&lookback_days=0    → 422  (fires 2–3×)
```

`tf=10m` is sent **as-is** — the native-mapping step is not applied on this fetch path. Switching to a *native* interval (`5m`, `1m`, `1h`) works cleanly: `200`, candles repaint, VP updates. **7 of the 11 selectable intervals (`2m 10m 30m 2h 4h 2d 7d`) are affected; the 4 native ones are not.**

This alone would explain "10m does nothing." It does **not** by itself explain "5m/1m does nothing," which the report also named — see Root cause 2.

---

## Root cause 2 of 3 — StudioOne hop client is not thread-safe (the dominant bug)

This is the one that matters most, and it's independent of which `tf` was picked.

**Verified live:** on a plain page load — before touching the interval control at all — the Labs API log (`/tmp/labs-api.log`, this session) shows:

```
GET /api/app/vp/v1/window/SPX?...   → 500 Internal Server Error   (×11 across the session)
GET /api/app/vp/v1/health           → 500 Internal Server Error
```

Traceback, every time, bottoms out at:

```
File "server/sa_dev/vp_client.py", line 185, in _once
    c.request("GET", path, headers=hdrs)
File ".../http/client.py", line 1195, in putrequest
    raise CannotSendRequest(self.__state)
http.client.CannotSendRequest: Request-sent
```

**Why:** `server/sa_dev/vp_client.py` line 138:

```python
_POOL: dict[tuple[str, int], Any] = {}   # module-level, one connection per (host, port)
```

One raw `http.client.HTTPConnection` is created per StudioOne host and reused **forever**, shared across every request, from every thread — with **zero locking** (confirmed: no `Lock`, no `threading` import anywhere in the file). FastAPI runs this sync route handler via `run_in_threadpool` (confirmed in the traceback: `anyio.to_thread.run_sync`). `http.client.HTTPConnection` keeps request/response state on the single socket (`Idle` vs `Request-sent`) and is documented as unsafe for concurrent use. The Visible Range widget fires several concurrent hop calls per interaction (`window`, `range`, `ohlc`, `stream`, `health`, `contracts` — observed 3–7 near-simultaneous requests per single interval switch, and 6+ on page load alone). Any time two land on the shared connection at once, the second one's `putrequest()` throws.

**This is a race, not a deterministic failure** — which is exactly why the bug "feels" intermittent and why a clean reload followed by one single switch sometimes works while a second switch (more concurrent traffic queued) fails. It was introduced in `e0f87a07` ("perf(vp): pin hop... DL-750" — a keep-alive optimization) **before** REQ-007 (`21bb236c`) shipped the traffic pattern (multiple concurrent window fetches per interaction) that now reliably triggers it. It is not a new regression from anything touched this week; REQ-007 just exposed a latent defect.

**Consequence for the feature's own premise:** because `/window` 500s on the large majority of requests this session, the blue histogram bars visible throughout this repro are very likely `mockBinsFromCandles()` (`web/lib/saVpBand.ts`) — the client-side candle-occupancy **fallback**, not server-computed bins. The core "server always computes real bins" promise (REQ-007 v2 law, DL-788) is not holding right now, silently.

---

## Root cause 3 of 3 — every failure is swallowed by design, not by accident

`web/lib/saDelivery.ts`, `network()`:

```ts
if (!r.ok) {
  if (hit) return { body: hit.body, fromCache: true, stale: true, status: r.status, ... };
  return { body: null, fromCache: false, stale: false, status: r.status, ms, etag: null };
}
```

No `throw`. No `console.error`. A 422/500/401 becomes a **normally-resolved** promise shaped exactly like success, just with `body: null`.

The consumer, `ingest()` in `web/components/sa/SaPriceChart.tsx` (line 319), **never inspects `r.status` at all** — only `r.body?.named_state` and `r.body?.bars`. On failure:
- if `cachedBars.length` (a local cache hit for that exact URL) is non-empty → does **nothing**, no signal whatsoever;
- otherwise → `setErr("No OHLC")`, which renders as one line of `text-zinc-400` (muted gray) text (`data-testid="sa-price-chart-empty"`) overlapping the chart canvas — present in the DOM, but easy to miss against a dark chart, especially with old candles still painted around it.

**This is the actual mechanism behind "not even the candlesticks repaint... the chart just sits there, [with] a silent error."** The report's own prediction was exactly right — it named the shape of the bug before I found the line.

---

## What this means for the two Prime Suspects

| Suspect | Verdict |
|---|---|
| **#1 Pipeline/API coupling** | Partially right, but not in the way described. The `/window` and `/ohlc` calls are already separate, simple endpoints (Arch 37 confirms `/window` takes just `from_t`/`to_t`/`row` — it's already close to "give me bins between these two timestamps"). The real coupling problem is **volume of concurrency**: many endpoints (window, range, ohlc, stream, health, contracts, sa-surface) all fire together per interaction and collide on the shared connection (root cause 2). Simplifying the API surface further wouldn't fix the underlying thread-safety bug — it would just make collisions less frequent. |
| **#2 Primitive teardown** | Not observed. The VP-band effect (`SaPriceChart.tsx` line 575, deps include `prefs.priceTf`) unconditionally resets its flight-guard (`flightRef.current = {inflight:false, pending:false}`) at the top of every run — a stale guard from a prior interval cannot survive into the next one. No evidence the primitive is torn down with its parent series on interval change; the OHLC effect and VP-band effect are separate, independently-keyed effects, and both re-ran correctly across every switch tested. This suspect can likely be retired. |

---

## §4 — one anomaly not fully isolated (needs a clean re-test, not a fix)

Once, after 10m (422×2) → 1m in rapid succession without a reload, the second switch produced **zero** outgoing network requests at all — the closest thing to a literal "does nothing." This could not be reproduced on a clean reload doing the same 1h→1m native-to-native transition (that one worked cleanly, 200/200, candles repainted correctly). Two explanations remain open:
1. A genuine stuck client-side guard specific to rapid back-to-back switches through a failing interval, not caught by the effect audit above, or
2. An artifact of how this session's synthetic interval changes were triggered (native `<select>` value-setter + dispatched `change` event, back-to-back with only ~3s between them — a real user re-opening a dropdown takes longer).

**Recommendation:** re-test with actual mouse clicks (not synthetic events) and a few seconds of natural pause between switches before treating this as a fourth root cause.

## §5 — one correction to the existing docs

The Docs Manifest (`docs/Options-Lab-Visible-Range-Volume-Profile-Docs-Manifest-2026-09-20.md`) and Arch 35/37 describe the pipeline as working and REQ-007 as functionally complete modulo the POC/VA hold. Live evidence this session says the `/window` path is failing on the clear majority of calls due to root cause 2 — the docs describe the intended/as-designed shape correctly, but overstate how often it's actually succeeding right now. Recommend a follow-up doc note once root cause 2 is fixed and re-verified.

## §6 — also found in passing, not part of this bug

- `GET`/`PUT /api/me/sa-surface` → `400` on every single load and every settings change, all session. Separate, pre-existing, unrelated to interval switching — member surface prefs are not persisting at all right now.
- This repro ran Monday during the live Sunday-evening Globex session, **not** pinned to a static historical range as the handoff asked. Root causes 1–3 are code-level and data-independent, so they hold regardless — but the §4 anomaly and the exact frequency of root-cause-2 collisions should be re-verified against a fixed historical date range to fully rule out live-feed timing as a contributing factor.

---

## Explicitly not done (per instruction)

No code was patched. `server/sa_dev/vp_client.py`, `web/lib/saVpBand.ts`, `web/lib/saDelivery.ts`, `web/lib/saView.ts`, and `web/components/sa/SaPriceChart.tsx` are all unmodified. Dev stack (Next `:3000` pid, API `:4000` pid) left running from this session for the next step; logs at `/tmp/labs-api.log` / `/tmp/labs-web.log`.

## Suggested next step (not started)

In root-cause order: (1) fix `nativeOhlcTf` wiring so grouped intervals fetch their native `tf` before resampling — small, contained; (2) replace the raw `_POOL` in `vp_client.py` with something thread-safe — `httpx` is already a project dependency (`requirements.txt`) and has correct connection pooling for exactly this shape, or at minimum add a per-key `threading.Lock` around `_once()`; (3) make `network()`/`ingest()` status-aware — log on non-2xx and surface a real, visible named state (matching the OPF doctrine's "representable or named failure," not a muted gray caption) instead of silently returning `body: null`.
