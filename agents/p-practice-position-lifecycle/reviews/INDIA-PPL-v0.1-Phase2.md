# INDIA — Phase 2 Spec & Architecture Review

**Agent:** India  
**Date:** 2026-09-14  
**Subject:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (**DRAFT**, Juliet Phase 1)  
**Workflow:** spec-create-review-workflow Phase 2. Verdict is **build readiness** only. Spec not edited. Parents not edited. No board, no seeds, no migrations.

**Read (this pass):**

- Agent charter `agents/bench/india.md` · doctrine (esp. §11, §15) · first-principles · spec-create-review-workflow
- Draft spec v0.1 (full)
- `docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md` (analysis law)
- `docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md` (HEAD `87ab8748`)
- Trade Log v1.1 §4, §5, §8, §9, §16
- Arch 15 (full, esp. §4, §8, §9)
- Import Batches Spec (file v1.0, as-built v1.1) §3, §5, §6a, §9
- Positions View v0.2 §1 V2/V4, §5.1, §5.3
- OPF Truth · Elegant Failure Doctrine v1.1 (analogy only — Laws A/B cited, not imported)
- DL-539 (doctrine §15) · DL-193 (Practice entitlement) · Privacy Spec v0.1 §2.1 DS-4
- Source grep: `m.get("close")` consumers under `server/`

---

## Up front (required if true)

This pass **did not change or drop** anything Coach wrote. The spec file was not edited. Objections sit here, labeled India.

Juliet’s up-front Coach Content Law notes in the draft are accepted: B0 v1.1 contract items, both Coach phrases, ODs transcribed not answered, matcher rewrite PARKED, SQL/declarations/API keys labeled as sketches.

---

## Bench delta

What the next invocation can do that this one could not:

1. **Write-path SoR is the C1-2 hole.** Gating `POST /trades` only, while also saying import-adjacent callers cannot bypass, recreates UI theater on PATCH and turns C2-1 into a 422 wall on import commit. The seam must be a **table** (gated | excepted-pending-OD | out-of-scope) per write path, plus an OPEN OD for import commit. Do not answer the OD in Phase 2.
2. **Remaining qty lives on the match slot** (`closes[]` / `slot_remaining`), not on `open_qty_and_avg_cost(trade)`. That helper sees only the fill. PPL-2 consumers must read the matcher output.
3. **Coverage window (OD-9) is per-batch.** An orphan close reads the window on **its** `import_id`. `NULL` ≠ unbounded and ≠ “opened before your imported history.” Manual/automated orphans (`import_id IS NULL`) stay Orphan close. Matcher remains pairing SoR — a later import that brings the missing open **pairs**; the window is then irrelevant.
4. **C2-4 triad does not need a `close_kind` column.** Distinguishing imported expire vs synthetic vs member close is `(stored TO_CLOSE × entry_source × synthetic flag)`. Distinguishing imported EXPIRED from imported sold-to-close is **stricter** and is not stored today (adapter collapses EXPIRED → `TO_CLOSE`). Flag, do not invent a fake fill.
5. **OD-23 is the wrong question for PPL-7.** Ownership of the number 30 ≠ the **direction** of day-book/blotter agreement. W3 cannot implement “one answer” until Coach names the direction.
6. **GET `/api/me/trade-log/opens` is a PPL-2 consumer** (`trades.py` `m.close is None`). It sits in the in-scope tree and currently treats a 1-of-5 remainder as a fully unmatched open.
7. **Declarations are a new Family B artifact.** Privacy Spec §2.1 **DS-4** must be named as a parent amend when OD-22 lands. Coverage-window columns ride the existing `member_trade_log_imports` row (already Family B).
8. **Phase 5 must seat this program.** AGENTS.md already names three active trees (LIM · QFRIC · XS). This draft correctly creates no board; a BUILD stamp needs a DL that this is an additional active program (or that it waits). Isolation list is otherwise sound.

---

## Coach content intact?

Yes — all Coach / B0 v1.1 text retained in the draft; India objections are in this file, not inlined as deletions. Both phrases **partial-residual** (C1) and **unfinished cycle** (C2) remain; no third English word invented as law; OD-21 left to Hotel.

---

## Blocks (invariant | law | system only)

Required Juliet edits so Echo/Tango/Hotel can review a packetable spec. **Do not answer ODs. Do not de-scope C1 or C2. Do not rewrite the matcher.**

### B1 — System / fail-loud · write-path SoR incomplete (PPL-3 · C1-2)

**Cites:** Spec §5.2, §7.1, §11 (FLAGGED import-commit idea), C1-2 (B0 §1.1 / source audit B2), PPL-3, first-principles law 1 (do not parallel a second gate surface).

§5.2 moves the four close gates to the API (422, overrides in payload) on `POST /api/me/trade-log/trades`, then says domain validators live so **“import-adjacent callers cannot bypass by skipping the sheet.”** The next paragraph says applying the **orphan-close** gate as a hard 422 on import would refuse truncated-history files — the C2-1 case this Spec exists to **explain**. Those two sentences cannot both be packet law.

§7.1 specifies POST only. Arch 15 §7 already has `PATCH /trades/{id}`. A create-then-PATCH of `pos_effect` / legs / account / qty is the same C1-2 bypass with extra steps. Juliet flagged PATCH as opinion; India treats the **unenumerated write path** as a system hole, not as taste.

**Required change (do not answer product):** add a write-path table covering every path that can insert or re-key a `TO_CLOSE`:

| Path | Close-gate application |
|------|------------------------|
| `POST /api/me/trade-log/trades` (member close) | gated **or** excepted-pending-OD |
| `PATCH /api/me/trade-log/trades/{id}` (becomes / re-keys a close) | gated **or** excepted-pending-OD |
| `POST /api/me/trade-log/import/commit` | gated **or** excepted-pending-OD |

Promote “how the four gates apply to import commit vs coverage-window orphans” from §11 FLAGGED into **§12 as an OPEN OD** (do not dispose). Until that table and OD exist, W2 cannot be seeded without recreating TradeSheet theater or 422-ing C2-1.

**India opinion (not the block; Coach may discard):** member POST (and PATCH re-key) take the four gates; import commit does **not** hard-422 the orphan-close gate; coverage window explains truncated orphans after commit. Partial-units / drift on broker files are part of that same OD, not a silent “import is ungated forever.”

### B2 — System / Family B · Privacy parent omitted for declarations (PPL-9 · DS-4)

**Cites:** Spec §0.3, §4.1, §4.6, §7.4, PPL-9, OD-22; `Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md` §2.1 **DS-4**; doctrine principle 9 (documentation parity); India invariant 4 (schema traces to spec).

Declarations are a **new object**, identity-scoped, never a fake fill. That is a new Family B artifact. DS-4: new Family B artifacts **must** be added to the Privacy named-consumers table before production write. §0.3 names Trade Log, Arch 15, Positions View, Import Batches — not Privacy.

**Required change:** add Member Data Privacy Spec v0.1 to §0.3 as a **named later amend** when OD-22 is disposed (table row + retention/export/admin). Do not design the declarations table in this pass. Coverage-window columns on existing `member_trade_log_imports` are additive on an already-listed Family B table and do not themselves trigger DS-4.

### B3 — System / PPL-2 · read-model consumer list not exhaustive

**Cites:** Spec §5.1, §0.2 in-scope trees (`server/routes/trade_log/`, `server/capital_positions.py`, `server/trade_log_domain/`), C1-1 (B0 §1.1 / source audit B1), first-principles law 1, PPL-2, PPL-12.

§5.1 lists blotter status, badges, issues, `findPairedClose` / `canDeleteTrade`, `open_qty_and_avg_cost`, `positions_valuation`. Source still keys **`m.close is None`** on in-scope (or capital-adjacent) callers the table omits:

- `GET /api/me/trade-log/opens` — `server/routes/trade_log/trades.py` (~329): `opens = [m["open"] for m in matched if m.get("close") is None]`. This is the server unmatched-open SoR. A 1-of-5 remainder is still “unmatched” at the matcher grain (`m.close is None`) and would be bulk-deletable / Close-listed as if fully open unless this consumer is named.
- `server/campaign_phase_reports.py` `_open_structures` / free-cash: same `m.close is None` plus `open_qty_and_avg_cost(trade)` — residual **capital** overstatement, the worse half of C1-1. Not in the in-scope file list; not Campaign chrome.

`open_qty_and_avg_cost(trade)` cannot see `slot_remaining`. Remaining units are on the **match slot**. PPL-2 must say that, or Alpha will invent a parallel remaining-qty function or leave free-cash lying.

**Required change:** declare §5.1 exhaustive for in-scope product surfaces (blotter, sheet, GET `/opens`, Positions / `positions_valuation`, day-book). Name leftover `m.close`-only callers as **inherit-via-domain / GO-allowlist / out-of-scope**. Do not open Campaign UI. Do not leave GET `/opens` unnamed. State: **qty SoR is the match slot**, not the fill helper.

---

## Opinions / recommendations (not blocks — Coach may discard)

### O1 — OD-9 shape review (not a decision)

India does **not** dispose OD-9. Shape constraints to put beside the OPEN OD for Coach/Alpha:

1. Table is `member_trade_log_imports` (already corrected vs Trade Log §4.6 `*_import_batches`). Additive only.
2. Window is **per batch**. An orphan close reads `coverage_*` on **its** `import_id`.
3. `import_id IS NULL` (manual / automated orphan) → not an explained boundary; remains Orphan close.
4. **`NULL` window ≠ unbounded** and ≠ the member sentence *“opened before your imported history.”* NULL = unknown coverage → today’s orphan behavior until backfill.
5. Matcher stays pairing SoR. If a later batch contains the missing open, the close **pairs**; the window is not consulted.
6. Recycle-bin imports (`deleted_at`, Import Batches §6a): live derivation reads live rows only (trashed trades already left the live tables). Do not redesign recycle.
7. DATE vs DATETIME: file coverage is calendar-shaped; compare against `exec_at` on the same clock as matching. `as_of` TZ is already §11 FLAGGED — do not lock TZ here.
8. Do not infer min/max `exec_at` as law (already Juliet). SQL in §7.3 stays a sketch; **not over-specified as law**. Pass on that check.

### O2 — OD-22 shape review (not a decision)

India does **not** dispose OD-22.

1. New object, never a row in `member_trade_log_trades`. Already law (PPL-9 / PPL-12).
2. Identity-scoped. Mike on isolation. Privacy DS-4 via **B2**.
3. Natural attachment is the **close fill being explained** (and/or the import batch for “this file’s unpaired closes are truncated”). Do not lock the key here.
4. Derivation reads declarations **after** `match_open_close`. Must not set `m.close`, must not insert `TO_OPEN`/`TO_CLOSE`, must not fabricate a debit/credit, must not bypass FIFO.
5. Packets that persist declarations **cannot start** until Coach disposes — already §0.4 / §13 W3. Keep.

### O3 — Import commit vs close gates (the labeled Juliet opinion)

Juliet is right that orphan-gate 422 on import is a C2-1 wall. That must not remain a labeled opinion next to a sentence that forbids bypass. See **B1**.

Recommended split (Coach disposes via the new OD): **honesty gates on member writes; explanation on imported history.** Not “import is ungated forever” (C1-2 named the bypass) and not “import is 422” (C2-1). Coverage window (OD-9) is the C2-1 instrument. Import-batch DELETE (soft recycle) is a different endpoint from blotter-row 409 (PPL-4) — do not apply PPL-4 to Import Manager.

### O4 — Two Coach phrases / fourth state (OD-21 Hotel)

Spec §4.4 / §6.2 keeps **both** phrases, specs need + derivation, leaves the member-facing token OPEN. India does **not** pick the English word.

Domain note (not vocabulary): they are **two predicates** that may share a token:

| Phrase | Predicate |
|--------|-----------|
| partial-residual | open slot, `closes[]` non-empty, `slot_remaining > 0` |
| unfinished cycle (truncated-import orphan, other incomplete book) | unpaired close (or other named gap) explained by window / declarations |

B0’s “absorbing” sentence is transcribed, not treated as deletion of partial-residual. W1 may emit a **machine key** without locking Autofilter copy. Echo/Hotel own chrome and OD-21.

`blotter_status_by_id` lives in `matching.py` but is a **read model**. Changing it to consume `closes[]` is PPL-2, not a PPL-1 matcher rewrite. Seeds must not touch FIFO / quantity consumption (`match_open_close` lines that `test_partial_close_leaves_remaining_units_open` locks).

### O5 — C2-4 provenance / no `close_kind`

After parse, ToS `EXPIRED`/`ASSIGN`/`EXERCISE` is stored as `TO_CLOSE` at 0; the broker Pos Effect is dropped (`trade_log_io.py` `_EXPIRE_POS_EFFECTS` → `pos_effect=TO_CLOSE`).

**Triad as written** (imported expire close · synthetic expire-worthless · member close) is distinguishable **without** a new column:

| Kind | Discriminator |
|------|----------------|
| Synthetic | derived row, `synthetic` flag, `id = -open.id`, never persisted |
| Member close | stored `TO_CLOSE`, `entry_source=manual` (or `automated`) |
| Imported close (incl. expire) | stored `TO_CLOSE`, `entry_source=import` |

India does not require `close_kind` for §9.2 item 8. Stricter “Expired (imported)” vs “Closed (imported)” needs persisted broker Pos Effect — **FI-PPL-2**, not a fake fill.

### O6 — Parent honesty (named amends are the right pattern)

§0.3 is the correct form. Specific honesty notes when those parents are versioned (not this pass):

| Parent | India |
|--------|--------|
| Trade Log §16.6 “one open to one close” | STALE vs source and vs **this same spec’s §8**. Named. Keep. |
| Trade Log §8 quantity-aware partials | Keep; do not re-introduce one-open-to-one-close. |
| Trade Log §4.6 `member_trade_log_import_batches` | Named. Live table is `member_trade_log_imports` (migration `119`). |
| Trade Log §16.5 gates “Before POST” / live in `TradeSheet.save()` | Named; B1 is the write-path completion of that amend. |
| Trade Log §5 Status · §16.9 Open:N | Status grows with §4.4 / OD-21. Open:N already superseded by Autofilter (Arch 15 §5.4 / DL-586). Versioning must **not** restore Open:N. |
| Arch 15 §9 “Partial close residual units in domain” | STALE vs matcher; true of read models. Named. |
| Arch 15 §4.3 / §8 gates as UI | Named. |
| Positions View v0.2 §5.1 “fills over remaining open qty” | **Already law.** PPL implements it; as-built `open_qty_and_avg_cost` / `positions_valuation` overstate. The parent amend is an as-built honesty note, not a new qty law. |
| Import Batches | Filename v1.0 / as-built v1.1 already noted. Recycle-bin §6a is not blotter-row delete. Named. |

Until Coach Phase 5, production continues as-built (spec closing line). Correct.

### O7 — PPL-7 hold-boundary direction

Law “one hold rule, one answer on every surface” is packetable as a **constraint**, not as an implementation. OD-23 asks whether 30 is curriculum-owned or a technical cap. That is not “both still Open (named)” vs “both drop / explain” vs fourth-state. **FI-PPL-1.** Do not pick. Add an OPEN OD or fold a direction question into §12 so W3 cannot invent it. Not a Phase 2 block — Echo/Tango can review the law without the direction; W3 is after Phase 5 and already OD-gated.

### O8 — Isolation / DL-539

PPL-11 freeze list (LIM, QFRIC, XS, `AnalyzerPositionsList.tsx`, Market Bus, OPF store/builder, Template Runner, IKI, MiniTwo, DudeTwo) is correct for this draft. Matcher freeze is correctly **also** isolation.

Nits (not blocks):

- “Third tree” is stale vs AGENTS.md (LIM + QFRIC + XS already). Phase 5 DL must seat PPL as an additional active program or sequence it. This draft creates no board — acceptable.
- Sessions / GSC is another isolated tree; add to the freeze list when the GO token is written.
- `capital_positions.positions_valuation` comments mention OPF option packages. Qty change is in-scope; **do not** open OPF store/builder or a new mark path (already Spec §4.3 / V3).
- `campaign_phase_reports.py` is not Campaign chrome. If free-cash must stop overstating residual, it is a PPL-2 allowlist file (B3), not a DL-539 three-OK into Campaigns.

StudioTwo only if/when a GO names it. Correct.

### O9 — Product boundary / Build On What Exists

Practice trade log only. No Options Lab. OPF is Law B **analogy** (named, calm state vs silence or a numeric lie). Spec correctly forbids OPF named-state catalog on the blotter. No MSC. No Market Bus. No IB adapter. Stamp S-3 deferred. Matcher rewrite PARKED (would break `test_partial_close_leaves_remaining_units_open`). Client/server pairing-rule copies stay; display grain must align the way pairing already does — not a third matcher.

Journal / Reports consume `trade_log_domain`. Changing `blotter_status_by_id` / day-book inside the domain is the SoR path; this Spec does not restyle those apps. Correct.

Entitlement DL-193 unchanged. Family B: no cross-identity leak; new writes identity-scoped.

### O10 — Schema / migrations

Sketched, not applied. Spec is the basis (India invariant 4). §7.3 SQL is labeled sketch; OD-9 owns names/types/nullability/backfill. §7.4 no declarations schema. Pass: SQL is **not** over-specified as law.

W0 characterization without behavior change is the right first slice. Packets that depend on OPEN ODs cannot start — already §0.4.7 / §13. After B1, the new import-commit OD joins that gate.

### O11 — HTTP codes

422 on gate failure, 409 on delete-order conflict: fail-loud and HTTP-correct. 404 on missing/wrong identity stays. Overrides opt-in per request, never cookie/ambient — correct.

### O12 — Autofilter / W1

§7.5 / §8.5 / §13 W1: do not lock a new Autofilter **word** until OD-21; C1 acceptance still uses **partial-residual**; do not ship a state the filter cannot name. Machine key vs member token is Echo/Hotel. India: W1 may change derivation (not orphan, qty 4, delete guard sees `closes[]`) with a stable machine key; copy waits.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-PPL-1 | Hold-boundary **agreement direction** (both still Open named / both drop-or-explain / named fourth-state), distinct from OD-23’s ownership of `30` | PPL-7 cannot be implemented as “one answer” until Coach names the direction. OD-23 answers a different question. Spec correctly does not pick. | Coach + Hotel + India |
| FI-PPL-2 | Persist broker Pos Effect (`EXPIRED` / `ASSIGN` / `EXERCISE`) on the **existing** fill for expire-vs-STC labelling | Not required for the C2-4 triad (O5). Adapter drops the string today. A `close_kind` column is not a fake fill, but it is new schema — only if Coach wants the chip to say “Expired (imported)” vs “Closed (imported).” | Coach + Hotel |

Juliet’s §11 inventory (OD-19/21/23/24, as_of TZ, non-integer `unit_qty`, PATCH, import-commit, IB, S-3, matcher rewrite PARKED) is **not** discarded. Import-commit is **promoted to a required OPEN OD** under B1 rather than left as a flag.

---

## Build disposition

**RETURNED** (implementation readiness only — not product deletion)

Echo + Tango + Hotel may still read the draft; Juliet must land B1–B3 (write-path table + import-commit OD; Privacy parent for OD-22; exhaustive PPL-2 consumers + slot-as-qty-SoR) before this file is build-ready. Coach content, both phrases, matcher freeze, PPL-12, isolation, parent-amend honesty, and “ODs transcribed not answered” stand.

**Pass (no block):**

- PPL-1 matcher FIFO / quantity freeze; test named; rewrite PARKED
- PPL-12 no stored position/status; coverage window and declarations are inputs to derivation
- Family B isolation stated; no MSC; no OPF import; Practice-only boundary
- DL-539 freeze list (LIM / QFRIC / XS / AnalyzerPositionsList / Market Bus / OPF / IKI / MiniTwo)
- Parent amends named, not silently edited
- SQL sketches not applied and not locked as law
- B0 ODs 19, 21, 9, 22, 23, 24 transcribed verbatim, not answered
- Both Coach phrases kept; OD-21 left to Hotel
- Highest-leverage spine (read models consume `closes[]` / `slot_remaining`; do not touch the matcher) is the correct architecture vs v1.0

---

*India · Phase 2 · 2026-09-14 · spec not edited · parents not edited*
