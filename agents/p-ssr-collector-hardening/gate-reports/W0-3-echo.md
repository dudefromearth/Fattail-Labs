# W0-3 — Echo dashboard review

**Project:** SSR Collector Hardening  
**Agent:** Echo  
**Date:** 2026-08-18  
**Surface:** existing Chain Snapshot dash only — `server/market_data/ssr_snapshot_dash.py` · `:5055`  
**Spec:** `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` §10 Dashboard bullets · SSR-H-L6 · §16  
**HI Spec:** v1.0 §2 (operator dialect) — this is **not** member chrome  
**Parents:** seed `agents/p-ssr-collector-hardening/seeds/W0-3-echo-dash.md` · Coach stamp §0 hole / “existing dashboard only”

**Not done:** no implementation, no second app or port, no collector restart, no MiniTwo bind, no Labs `/admin` or member route.

---

## Verdict

| Gate | Callsign | Verdict |
|------|----------|---------|
| Operator HIG / hole vs no-session / phase + counters | **Echo** | **APPROVED** |

**GO.** Spec dashboard clauses fit the as-built `:5055` board. Charlie extends that PAGE only. Binding grammar below is law for implementation; it does not invent a surface.

Not BUILD AUTHORITY (W0-G + Coach still required). Tango / Hotel correctly unseated — this is operator archive honesty, not a trader-learner chrome change.

---

## Coach content intact?

**Yes.** Nothing of Coach’s was removed or rewritten in the spec.

- Dashboard **holes** = true holes only.  
- Separate muted **no session** indicator **if useful**.  
- Everything logs to the **existing** dashboard. **No second dashboard.**  
- Phase-aware scheduling; empty outside session is not a hole.

Echo **resolves** Coach’s “if useful” (does not drop it): the muted indicator **is useful** and is **required when the hardening flag is on**. Rationale in §2. Juliet / Lima may fold that resolution into the spec after Coach accepts; this report does not edit the Spec.

---

## 1. As-built (read, not restyled)

`PAGE` in `ssr_snapshot_dash.py` is a standalone StudioOne operator board: dark local tokens, 2s poll, read-only disk + clock. It is **not** Labs web kit.

| Region | As-built | Echo read |
|--------|----------|-----------|
| Header chips | `#phase` + clock + cadence + wake | Status **readouts**, not controls. Phase classes already exist: `gth` / `pre` / `rth` / `extended` / `closed` / `weekend`. |
| Header control | Day `<select>` | Sole header control. Keep. |
| Process row | tap · chain_feed · sym_feed · dash — `.dot.on` / `.dot.off` | Equal-weight operator cards. Down is alarming. |
| Stats row | Snaps · Symbols · Latest IV · Latest greeks · **Latest holes** · Last snap | **Latest holes** is already the alarming counter (`.bad` if `> 0`, `.ok` if `0`). |
| Symbol table | Hole column: `.bad` + name, else `.ok` | True-hole cell stays alarming. |
| Tokens | `--bad` / `--closed` `#ff6b6b` · `--ok` / `--rth` `#3dd68c` · `--idle` / `--muted` `#8b95a5` · `--ext` gold · `--pre` blue · gth purple | Approved **local** skin for this page. |

Phase chips already do the job. Do not mint a second chip set for Coach session-map aliases (`premarket` / `postmarket`). Chrome shows `phase_at` tokens. Map files may alias; the dash does not.

**Dialect exemption (locked):** do not import `web/components/ui`, Labs member tokens, 44pt header chrome, or `/admin` shell. Local `:root` CSS variables on this PAGE are the skin. No emoji chrome (already clean). Closed/weekend chips already share `--bad` red as **clock** color — leave that as-built tonight; do not recast them, and do not reuse that chip class for no-session.

---

## 2. Hole vs no-session (the ask)

Coach’s live failure is visual: 14 expected GTH empties paint the holes card **permanently red**. That is a false alarm. After L5/L6, those names are **not** holes.

If the holes card simply goes green and the 14 names vanish from the table (dash today lists only snap files), the operator cannot tell **expected empty** from **collector forgot a name**. That swaps a false alarm for missing inventory. Same honesty problem, quieter.

**Therefore the muted indicator is useful. Required when `LABS_SSR_HARDENING` is on.**

| State | Card / cell | Color | Word |
|-------|-------------|-------|------|
| True hole (L5: expected missing **or** interval exceeded) | Stats **Holes**; table Hole cell | `.bad` (`--bad`) if count `> 0`; `.ok` if `0` | **Holes** / the named hole string |
| Unscheduled this phase | Stats **No session**; table Hole cell | `.idle` / `--muted` **only** | **No session** |
| Scheduled, snap present, no hole | table Hole cell | `.ok` | `ok` (as-built) |

**Never** paint no-session with `--bad`, `.chip.closed`, `--ext`, or `.ok`.  
**Never** paint a true hole muted. Holes stay alarming.

Flag **off:** do **not** show the No session card. Tonight’s poll-all still writes empties as holes; a muted sibling would double-count and lie. Flag-off dash looks as today.

---

## 3. Control grammar — phase + counters

One language. Three placements. No new primitive.

### 3.1 Phase (header)

| Slot | Grammar |
|------|---------|
| `#phase` chip | Clock token, `toUpperCase()` as today (`GTH`, `PRE`, `RTH`, `EXTENDED`, `CLOSED`, `WEEKEND`). Existing class list only. |
| Role | Readout. Not a filter. Not a segmented control. Not a session-map editor. |
| Do not | Add a second “session” chip, GTH-4 vs all-18 toggle, or Coach-alias labels on the chip. |

Day `<select>` remains the only header control.

### 3.2 Counters (stats row — same `.card` grid)

Order when flag on:

1. Snaps — neutral  
2. Symbols — **scheduled / snapped** count (not 18 including no-session)  
3. Latest IV — scheduled only (see §3.4)  
4. Latest greeks — scheduled only  
5. **Holes** — alarming; rename from “Latest holes” when the number is the L5 day/true-hole count (interval-exceeded is not “latest snap only”)  
6. **No session** — muted sibling, immediately after Holes  
7. Last snap — age, as-built  

Hierarchy: **one primary alarm in this row = Holes.** No session must not compete (no red, no larger type, no filled chip).

### 3.3 Symbol table (flag on)

Unscheduled names **appear** as muted inventory rows. Do **not** write hole-shaped snaps to populate them (L5/L6). Dash reads the session map + clock.

| Cell | Unscheduled row | True-hole row |
|------|-----------------|---------------|
| Symbol | label, default text color | as-built |
| Snaps | `0` | as-built |
| Last / Phase | `—` / current clock phase, muted ok | as-built |
| Rows / IV / Greeks | `—`, **not** `.bad` | as-built (IV `.bad` only when a **scheduled** snap lacks IV) |
| Hole | `no session` + `.idle` | named hole + `.bad` |

Do not add a second table or a “skipped” tab.

### 3.4 Do not let IV / greeks go red for no-session

As-built: `Latest IV` is `.bad` when `latest_with_iv` is `0`; per-row IV is `.bad` when `iv_count` is `0`. If muted rows are included in those denominators, GTH will stay red for the wrong reason.

**Lock:** IV / greeks cards and per-row IV/greeks classes count **scheduled (or snapped) names only**.

### 3.5 Watchdog / heartbeat (P2 — same board, later packet)

Reuse the process-card grammar. Do not add toasts, Slack chrome, or a banner farm. Alert channel is still OPEN.

| Heartbeat | Paint |
|-----------|-------|
| Fresh, live phase, scheduled nonempty | `.ok` + age |
| Silent `> 60s`, live phase, scheduled nonempty | `.bad` + age (dead-man — **alarming**, same family as Holes / process-down) |
| Lawful `closed` / `weekend` sleep | `.idle` + `sleep` — not down, not a hole |

### 3.6 `AUDIT.json` (P4 — same board)

When the file exists on the cache day tree: one muted line or card in the existing `main` grid. Not a new page. Not a gold-volume `stat`/`open` on the request path (dash already reads SSD cache only).

---

## 4. Spec §16 checklist

| Add (when flag on) | Echo |
|--------------------|------|
| True-hole count (L5/L6) | **Keep** existing holes card; alarming; rename **Holes** when the number is L5 |
| Muted no-session count/indicator | **Required** (resolves “if useful”). Stats card + muted table rows. |
| Watchdog / heartbeat age | **Same process-card grammar** when P2 ships |
| Today’s `AUDIT.json` summary when present | **One muted embed** when P4 ships |

| Do not | Echo |
|--------|------|
| A second app, port, or member route | **Block** if anyone proposes it |
| MiniTwo bind | Out of Echo; Foxtrot / as-built |
| Polling Massive from the dash | Already true; keep |
| Gold-volume `stat`/`open` on the request path | Already true; keep |

---

## 5. Out of scope tonight (not a RETURN)

- Restyling closed/weekend chips so they no longer share `--bad` (clock vs hole collision is as-built; do not touch mid-GTH).  
- Migrating this PAGE onto Labs tokens / 44pt member hits.  
- Session-map **contents** (which names have GTH). Echo paints the map; Coach / Alpha own the table. Lima’s GTH observation is not a chrome change.  
- Cadence number, alert channel, collector restart.

---

## 6. Implementation notes for Charlie (after W0-G + Coach)

- Touch **only** `ssr_snapshot_dash.py` `PAGE` + the JSON the dash already serves (`summarize_day` / status). No React. No new launchd label for a second UI.  
- Flag-off paint path = today’s HTML. Flag-on adds Holes semantics + No session card/rows + (later) heartbeat/audit.  
- Words: **Holes** · **No session**. Sentence case on the new card. No `NO SESSION` chip. No emoji.  
- Color: existing `--bad` / `--ok` / `--idle` only for this pair. No new hex.

---

## Bench delta

1. Echo law for this board: **holes alarming, no-session muted and required when flag on**, existing phase chips reused, no second dashboard.  
2. Next Charlie pass cannot invent a Labs-kit restyle or a GTH filter; the packet above is the composition.  
3. Flag-off must not show No session (avoids lying next to still-red GTH empties).

---

**Echo: APPROVED.**  
**GO.**
