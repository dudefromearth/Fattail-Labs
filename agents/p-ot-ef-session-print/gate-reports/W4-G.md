# W4-G — OPF session envelope on three surfaces

**Verdict:** **PASS**  
**Date:** 2026-08-16  
**Agent:** Delta  
**Seed / criteria:** Plan §8 W4-G · Coach W4-G packet (no `seeds/W4-G-delta.md` on disk) · `seeds/W4-1-alpha-envelope.md` done-when  
**Closes:** Envelope on ladder / package-quote / resolve · AT-SESS-1 fixture · no client Massive.  
**Does not close:** Client consume (W5) · Edit / closed-market loop (W6) · AT-SESS-2…7 matrix (W8).

This gate writes **this file only**. Product tree was not edited.

Work was treated as guilty. Each row was checked against the cited file or a live command, not the board’s live table.

---

## Criteria (restated)

| Check | Pass if | Result |
|-------|---------|--------|
| Writer exists · Redis-only | `server/opf/session.py` exists; `read_massive_session_doc` is Redis L0 only (no Massive HTTP) | **PASS** |
| Three surfaces | `opf_session` attached on package-quote, resolve, and ladder | **PASS** |
| AT-SESS-1 fixture | Envelope tests exist and run green | **PASS** — `21 passed in 0.23s` |
| H1 | `session.py` never writes `mb:session:market_status` | **PASS** |
| H3 | A test asserts post-OPF29 is not `print_quality=live` | **PASS** |
| OD-SESS-4 | `GET /api/me/market/session-status` still exists | **PASS** |
| No chrome · no client Massive | This packet did not add Analyzer badges or a Massive hop in `web/` | **PASS** |

W1-G · W2-G · W3-G are already **PASS**. W4 was allowed to fire.

**Defects:** none.

---

## 1. Writer — Redis-only L0 read

**File:** `server/opf/session.py` (on disk, untracked at gate time).

`read_massive_session_doc` (lines 81–97):

- Imports `bus_enabled` + `get_store` from the market bus.
- Returns `None` if the bus is off or the store is missing.
- Reads `store.get_json(MASSIVE_SESSION_KEY)` where `MASSIVE_SESSION_KEY == "mb:session:market_status"`.
- Returns the doc only when `session_doc_usable`; otherwise `None`.
- Broad `except` returns `None` (named incomplete upstream, not a clock).

Ripgrep of that file for `MassiveClient`, `marketstatus`, `/v1/`, `urllib`, `httpx`, `requests`: **no matches**.

The only `set` / `write` / `publish` hits in `session.py` are comments stating the writer must **not** write the L0 key, plus `frozenset(...)`. No `set_json`.

Live proof: `test_h1_read_does_not_call_massive` patches `MassiveClient` to raise; `test_read_massive_session_doc_never_writes` records `set_json` and asserts `writes == []`. Both green (see §3).

---

## 2. Three surfaces carry `opf_session`

Facts required (W4-1 / H2): `market` · `printing` · `print_quality` · `as_of` · `generation_as_of`. Envelope sits **beside** `mark_mode` / `mark_source`.

### 2.1 Package-quote

`server/opf/package.py`:

- Imports `build_opf_session`.
- Every `quote()` return goes through `_with_session` (skew-fail path and complete path).
- `_session_for_quote` calls `build_opf_session(...)`.

`server/routes/pricing.py` `POST /api/me/pricing/package-quote` includes `"opf_session": quote.get("opf_session")` in the HTTP body.

### 2.2 Resolve

`server/opf/resolve.py`:

- After the pack runner, `out["opf_session"] = _session_for_resolve(...)`.
- `_session_for_resolve` calls `build_opf_session(...)`.

`server/routes/pricing.py` `POST /api/me/pricing/resolve` returns `out` unchanged, so the envelope rides the HTTP response.

### 2.3 Ladder

`server/routes/chain_ladder.py`:

- All three response modes (`unchanged`, `diff`, `full`) include `"opf_session": session`.
- `_opf_session_for_ladder` calls `build_opf_session` (Redis L0 read only — comment + import; no Massive hop in that helper).

Existing ladder `MassiveClient` import is the **chain-fetch** path, not the envelope writer. Out of this gate’s H1 ask.

No new HTTP route. India dual-truth / Mike auth for a new route: **not triggered**.

---

## 3. AT-SESS-1 fixture + live pytest

**Fixture:** `server/tests/test_opf_session_envelope.py`  
Maps CL-21 / AT-SESS-1 (plus CL-11, CL-13, H1, H3, OD-SESS-3, OD-SESS-4).

Command (this gate, live):

```text
cd /Users/ernie/Fattail-Labs/server && .venv/bin/python -m pytest tests/test_opf_session_envelope.py -q --tb=line
.....................                                                    [100%]
21 passed in 0.23s
```

Exit code **0**. 21 collected, 21 passed.

Surface assertions in that file:

| Surface | Test |
|---------|------|
| Compute / H2 keys | `_assert_envelope` on every compute case |
| Package-quote (core) | `test_cl21_package_quote_carries_opf_session` |
| Resolve (core) | `test_cl21_resolve_carries_opf_session` |
| Package-quote + resolve HTTP | `test_cl21_http_package_quote_and_resolve` |
| Ladder HTTP | `test_cl21_ladder_http_carries_opf_session` |
| `mark_mode` still present | package-quote core + HTTP (`assert q.get("mark_mode")`) |

AT-SESS-1 is **fixtured and green**. Remaining AT-SESS-2…7 / W2 matrix stay **W8**.

---

## 4. H1 — no write of `mb:session:market_status` from `session.py`

| Probe | Evidence |
|-------|----------|
| Source | `read_massive_session_doc` only `get_json`. No `set_json`. |
| Constant | `MASSIVE_SESSION_KEY = "mb:session:market_status"` — read target, not a write target. |
| Test | `test_read_massive_session_doc_never_writes` — stub store; `writes == []`. Green. |
| L0 writer remains `sym_feed` | `server/market_data/sym_feed.py` still `store.set_json("mb:session:market_status", ...)`. Untouched by this packet’s envelope writer. |

---

## 5. H3 — post-expiry is not `print_quality=live`

`compute_opf_session` forces `quality = "last_print"` when `past_opf29_expiry` is true (comment: “H3: live forbidden after that contract's OPF29 instant”).

Tests that assert the fact (all green in §3):

```python
# test_h3_no_live_after_pm_expiry_even_if_extended
assert env["print_quality"] != "live"
assert env["print_quality"] == "last_print"

# test_h3_open_book_after_tau_still_not_live
assert env["print_quality"] != "live"

# test_h3_package_quote_0dte_after_pm_expiry
assert q["opf_session"]["print_quality"] != "live"
```

`test_h3_no_live_after_pm_expiry_even_if_extended` pins the clock **after** `expiry_instant(exp, settlement="pm")` with Massive still `extended-hours`. That is the H3 sentence.

---

## 6. OD-SESS-4 — `/session-status` still exists

`server/routes/market_session.py`:

```python
@router.get("/api/me/market/session-status")
def get_session_status(request: Request) -> dict[str, Any]:
```

W4 extracted `_open_from_massive_doc` / `_printing_from_massive_doc` into `opf.session` and left the route. Redis-first, then the existing Massive fallback (labeled shim until W5). **Not deleted.**

Live: `test_od_sess_4_session_status_route_not_deleted` → HTTP 200, body has `open` and `source`. Green.

The shim’s Massive fallback is **not** the envelope writer. H1 applies to `session.py`, not this keep-alive route.

---

## 7. No Analyzer chrome · no client Massive from this packet

| Probe | Evidence |
|-------|----------|
| `git diff --name-only -- web/` | **empty** (no tracked `web/` source in this packet) |
| `git status --short -- web/` | only `?? web/test-results/` (Playwright residue, not product UI) |
| `opf_session` / `print_quality` in `web/` | **no matches** |
| `opf_session` in `web/lib/` | **no matches** |
| Echo badge words (`No print`, `Held residual`) in `web/**/*.{ts,tsx}` | **no matches** |
| `Pre/post` in `web/` | `OpfRiskAnalyzer.tsx` lines 771 / 794 — last commit `3bc034c` (Show / additive book / midnight-ET EXPIRED), **not** this packet |

Pre-existing Builder / Analyzer “last print” / “Off market” copy is as-built, not W4 chrome. W5 owns Echo labels on chrome.

W5 seed `seeds/W5-1-charlie-consume.md` is still **STUB** (“Do **not** fire now”). This gate does not implement W5 or W6.

---

## 8. Adjacent / collateral

| Item | Finding |
|------|---------|
| W1-G · W2-G · W3-G | All **PASS** on disk. W4 fire was legal. |
| OD-SESS-3 | `kind_defaults` now carries `rth_open` / `rth_close` (index 16:15 · equity/ETF 16:00). `product_session_bounds` reads that profile. Tests in the envelope file + `test_kind_defaults_session_bounds_od_sess_3`. |
| `mark_mode` | Still on package-quote payload. Envelope sits beside it (H2). |
| H4 | `_assert_envelope` forbids `HELD/RESIDUAL` / `held_residual` in the session blob. Session `last_print` is not collapsed into Law C. |
| Missing L0 doc | `test_missing_session_doc_is_named_incomplete_not_clock` → `market=closed`, `printing=False`, `print_quality=none`. Not a client clock. |
| Collateral pytest | `test_symbol_profile.py` + `test_opf_package_quote_api.py` + envelope file: **`27 passed in 0.26s`**. |
| Second WS | None added. No `web/` source in the packet. |
| New route | None. |

---

## 9. Holes (FAIL / BLOCK defects)

**None.**

- Writer exists and is Redis-only.  
- All three surfaces carry the five-fact envelope.  
- AT-SESS-1 fixture is on disk and green (`21 passed`).  
- H1: no L0 write from `session.py`.  
- H3: post-expiry is not `live`.  
- `/session-status` remains.  
- No Analyzer chrome and no client Massive from this packet.

---

## Next

- **W5** (Charlie consume) and **W6** (Charlie Edit / no outage loop) **may fire** in parallel. This gate does **not** implement them.  
- Juliet expands `seeds/W5-1-charlie-consume.md` and `seeds/W6-1-charlie-edit.md` before those packets run.  
- W5 must use W1 Echo words; clock / raw `/session-status` cease to be member SoR when the envelope is present; Show + additive book stay independent (DL-394).  
- W8 still owns the full AT-SESS / W2 matrix.  
- Juliet updates the board. Lima does not need a new DL for an envelope-land PASS (DL-397 / DL-398 already hold WHETHER and OD-SESS).

**End of W4-G.**
