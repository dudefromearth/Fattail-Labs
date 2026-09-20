# Practice Position Lifecycle — status (2026-09-14)

**Machine:** StudioTwo · branch `main`  
**origin/main SHA:** `186a74ff` (`fix(trade-log): second click on a selected row deselects`)  
**Filed:** 2026-09-14 after PPL3-G PASS and a stopped land-to-main.

This is a snapshot, not a stamp and not a GO.

---

## One-line

PPL0–PPL3 are **PASS** on the StudioTwo working tree. PPL3 is **not on `origin/main`**. PPL4 and B1 product code have **not started**.

---

## Phase board

Board: `agents/p-practice-position-lifecycle/ORCHESTRATOR.md`  
Spec: `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` v0.1.1 BUILD AUTHORITY  
Plan: `docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`  
Token: `agents/go/PPL0-W0.md` **STAMPED GO** · **DL-702**

| Phase | Job | State | On origin/main? |
|-------|-----|-------|-----------------|
| **PPL0** | Board · spec v0.1.1 · seating | **PASS** `PPL0-G.md` | Yes (earlier) |
| **PPL1** | Characterization lock | **PASS** `PPL1-G.md` | Yes (earlier) |
| **PPL2** | Read models (slot SoR) | **PASS** `PPL2-G.md` | Yes (earlier) |
| **PPL3** | API 422 + DELETE 409 + kit confirm | **PASS** `PPL3-G.md` locally | **No** — commit stopped (dirty tree) |
| **PPL4** | Import end-state | **Blocked** | — |
| **B1** (PPL5+) | Events → chrome → re-recognition → import | Planning only. Product code **illegal** until PPL3-G **and** PPL4-G | Planning files untracked; `PPLB1-W0` unstamped |

B1 spec v0.4 and plan v1.1 exist on disk as untracked planning. They do not authorize build.

---

## PPL3 (local PASS, not pushed)

**Gate:** `agents/p-practice-position-lifecycle/gate-reports/PPL3-G.md`  
**DL drafted locally (not on origin):** DL-703 in `Architecture/00-decision-log.md`  
**Matcher FIFO:** not edited.

| Path | After PPL3 |
|------|------------|
| `POST` / `PATCH` `TO_CLOSE` | Four gates. **422** without payload override |
| `DELETE` paired/partial open | **409**, names blocking close id. Unmatched open still 200. Cross-member **404** |
| Import commit | Ungated (**OD-25**) |
| Sheet + blotter bulk trash | Kit `useConfirm` / `AlertDialog`. No `window.confirm` |

**Evidence (PPL3-G):** trade-log pytest cluster **74 passed** in 3.75s. AT-PPL-6/7 inverted. AT-PPL-11/12 added. Isolation test: peer DELETE is 404, not 409.

Overrides (payload, never cookie): `allow_orphan_close`, `allow_account_mismatch`, `allow_partial_units`, `allow_structure_drift`.

### Why it is not on origin/main

Coach asked to land PPL3 only if the tree contained **only** the PPL3 packet. It did not. Commit/push **stopped**. SHA not recorded on the board.

**PPL3 packet (unstaged, ready when Coach says go):**

- `server/trade_log_domain/close_gates.py` (untracked)
- `server/routes/trade_log/trades.py`
- `server/tests/test_trade_log.py`
- `server/tests/test_trade_log_domain.py`
- `server/tests/test_capital_positions.py`
- `web/components/trade-log/TradeSheet.tsx`
- `web/app/app/trade-log/page.tsx`
- `Architecture/00-decision-log.md`
- `Architecture/15-trade-log-manual-management.md`
- `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`
- `agents/p-practice-position-lifecycle/ORCHESTRATOR.md`
- `agents/p-practice-position-lifecycle/characterization-list.md`
- `agents/p-practice-position-lifecycle/gate-reports/PPL3-G.md`
- `agents/p-practice-position-lifecycle/gate-reports/ppl3-close-writers.md`
- `agents/p-practice-position-lifecycle/gate-reports/PPL3-2-mike-isolation.md`
- `agents/p-practice-position-lifecycle/reviews/ECHO-PPL3-kit-confirm.md`

**Also dirty — not this packet (do not `git add -A`):**

- Modified: `web/next.config.ts` (studiotwo `allowedDevOrigins`), `docs/evidence/session-volume-profile/P-SV14-accretion-steps.md`
- Untracked: B1 specs/plans/board/token, LIM notes, session-volume-profile board/docs, `.grok/skills/chain-idea-view/`, `agents/agents.zip`, `agents/bench-pb/`, `package-lock.json`

---

## PPL4 blockers (Coach disposes; no silent default)

PPL4 packets **do not start** until these three are ticked on the GO token. Verbatim sources: spec v0.1.1 §12 / §11, `PPL0-W0`, DL-702, plan v1.1, stub `PPL4-0-od-gated-stub.md`.

### OD-9 — coverage window

Status table (spec §12): **Coverage window on `member_trade_log_imports` · OPEN — PPL4.**

Owns: column names, types, nullability, backfill, and whether from/to is member-declared, inferred from min/max `exec_at`, or both. SQL not locked. Sketch names `coverage_from` / `coverage_to`. NULL window ≠ unbounded. `import_id IS NULL` stays Orphan close. Member sentence already approved: *“opened before your imported history.”*

### OD-22 — declarations store

Status table (spec §12): **Shape of the declarations store · OPEN — PPL4.**

Law already: **new object, never a fake fill.** Must not insert `TO_OPEN`/`TO_CLOSE`, set `m.close`, bypass FIFO, or fabricate a debit/credit. India/Alpha own table/shape, identity scope, how derivation reads them. Privacy DS-4 parent amend when it lands. No schema in the spec draft.

### FI-PPL-1 — day-book / blotter hold direction

Spec §11: **Hold-boundary agreement direction** (both still Open named / both drop-or-explain / named fourth-state), **distinct from OD-23’s ownership of `30`**. **FLAGGED · FI-PPL-1.** PPL-7 cannot be “one answer” until Coach names the direction. Number stays 30 unless OD-23 (already disposed: stays 30, typo-guard).

---

## Two facts PPL7 / B1 UC-X1 need (from the PPL3 writers)

### Partial close requires `allow_partial_units`

A close whose GCD units ≠ the **paired open’s original** GCD units **422s** without `allow_partial_units`. The flag is **not** “within remaining units.” It does not read `slot_remaining`.

- 5-unit open closed with 5 → no flag
- 1 of 5 → **flag required**
- leftover 4 of that same 5-unit open → **flag still required** (`4 ≠ 5`)

Code: `server/trade_log_domain/close_gates.py` (`open_u` vs `close_u`); sheet twin `web/components/trade-log/TradeSheet.tsx` (`tradeUnitQty`).

### `allow_structure_drift` is per-request payload

Read from that request’s JSON by `overrides_from_body`. Wired in `trades.py` `_close_gate_or_422`. Never a cookie, never ambient config. Import commit does not call the module (OD-25). B1 manual leg-out (UC-X1) riding this flag is a **named per-request override**, not a standing exemption.

---

## What is not happening

- No PPL4 product code
- No B1 product code (`PPL5-W0` not created as a build stamp)
- No MiniTwo / DudeTwo deploy
- `:3000` / `:4000` not stopped
- Matcher FIFO, LIM, QFRIC, XS, `AnalyzerPositionsList.tsx` not touched in this packet

---

## Next (Coach)

1. Land PPL3: allow staging **only** the packet list above (extras stay out), then commit/push.  
2. Dispose **OD-9**, **OD-22**, **FI-PPL-1** on the token before PPL4.  
3. B1 stays planning until PPL4-G PASSes.

---

*Sources: `PPL3-G.md`, `ppl3-close-writers.md`, `PPL0-W0.md`, spec v0.1.1 §11–§12, plan v1.1, DL-702 (on origin) / DL-703 (local only), git status 2026-09-14 against `186a74ff`.*
