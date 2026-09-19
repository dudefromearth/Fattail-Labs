# Symbology & Registry Service — Spec v0.2.1 (DRAFT)

**Version:** v0.2.1 (DRAFT)
**Supersedes:** `Symbology-Registry-Service-Spec-v0_2.md` (review-object sha1 `0d22bf42…`). v0.2 and v0.1 stay on disk as baseline. Change table §14.
**Date:** 2026-09-19
**Authoring machine:** StudioTwo (dev) — specification only; files/trees touched: NONE
**Service machines:** StudioOne (both planes; CP-1 binds all work there)
**Status:** DRAFT. **BUILD AUTHORITY: none.** No Juliet intake; REQ-003 must not ship on the fixture.
**Related:** Advisor reviews 2026-09-19 of v0.1 and v0.2; roll-catalog / caption / ghost / no-B-ADJ seats recorded the same day.
**Does not answer:** VPS Q1 (per-contract prints), overlay Q1 (RAW participation set), "what is a listed contract for RAW ingest." Stated here so no reader mines this file for those answers.

**§0 seats in this file are Advisor-seated pending a Coach word.** Coach overrides any with a word. They are not a DL stamp.

---

## §0-A Abstract (canonical — carried from v0.2, one sentence added)

The Symbology & Registry Service exists so symbol search in Labs uses the notation and type-ahead traders already know, while selection and readiness follow house rules that keep the chart from quietly changing instruments. It is the membership voice for which symbols Labs surfaces may offer, in what role, and in what state. Apps do not keep their own lists — when two lists exist they disagree, and a chart renders the wrong instrument. Search follows the TradingView pattern: type-ahead, not pulldowns. Futures identity is the dated contract (ESZ2026). Familiar tokens resolve as follows: ES1! and /ES resolve to this session's frozen front as a dated contract — they are viewing aliases, not instruments ingest or charts mount; ES lists that root's dated contracts and aliases and does not pick one; ambiguous tokens such as ESZ6 return their matches and bind nothing. The front pointer does not change during the session; it advances after the close on the house roll rule. Front-pointer presets are a named catalog; house default is TradeStation's ES calendar (six trading days before expiration). A member may select another catalog row on the chart; ES1! still resolves to a dated contract. Roll seams are captioned; the outgoing dated contract may be shown as a ghost until expiration. Prices are never back-adjusted on structure or volume-profile panes. A symbol is offered as ready only when a dated, re-runnable path-verification artifact is current. Symbols that are waiting on a path, out of this app, or below the options coverage gate are shown with a reason — never as a silent miss.

## §0 Seated decisions — Advisor-seated pending Coach word

1. **Registry is a SIBLING of VPS symbol-metadata, with the join named** (Advisor Q1). This service speaks membership, role, and state only. Symbol *behavior* — `vp_row`, tick, multiplier, session calendar — stays in VPS symbol-metadata under VP-L3, which this spec cites and does not amend. Every registry row carries a `metadata_ref` to its symbol-metadata entry; a symbol with no metadata entry cannot go ACTIVE for price kinds. Named replaced consumers: the Analyzer's `market_symbol_universe` / OptionsLabProvider list migrates to this API at implementation; no other symbol list survives. Rationale: absorbing metadata would amend VPS law from outside its own spec — wrong door.
2. **`1!` / `2!` are view aliases, never instruments** (Q2). Law SYM-3. Follows VP-OVL-1/-8.
3. **The strip does not answer overlay Q1** (Q3). Law SYM-5. Participation remains the construction spec's open parameter.
4. **SPY enters with role `volume-source` only, member-invisible** (Q4). Roles become a set (SYM-2). Rationale: VPS Stage A is SPY prints → XSP; the SoT cannot omit its own volume source. Member-tradable SPY is a separate Coach decision, not taken here.
5. **The eligibility gate is ≥3 expirations/week; DTE text is Help copy, never a predicate** (Q5). Copy reads "short-dated including 0DTE (0–5 DTE)." Rationale: 0DTE is the house product; a "1–5" filter would exclude the flagship. Coach's "1–5" wording preserved in the RL-1 record with this reading noted.
6. **Pair ACTIVE is joint** (Q6). Law SYM-8; VPS S3 proxy-honesty inherited. Pair *ends* are the deliverable instruments — frozen-front contract as-of generation + cash/options — not the root.
7. **ACTIVE requires per-contract native evidence for the kinds the row serves; a vendor continuous series never grants ACTIVE** (Q7). Law SYM-9/SYM-10. Chart-grade aggs (native, per-contract, e.g. ESZ2026 5-min) and model-grade prints are distinct verified kinds; model-grade remains gated on VPS Q1.
8. **REQ packets get a hashable surface** (Q8). REQ-001/002/003 texts (final versions) are to be filed under `artifacts/reqs/` on main; RL-1 extends: a REQ row includes its filed path. Until filed, the Advisor's "cannot hash REQ-003" stands as a defect. That directory is not on the 2026-09-19 review seat.
9. **Roll catalog, 2026-09-19** (new). House default = `ts-es-106X` (TradeStation S&P typical-day rule: 1st nearest, 6 trading days before expiration). Member may select another live catalog row as a C4 resolve overlay. Overlay remaps that pane's `ES1!` / `/ES` bind only; it does not write `strip_generation_id`, does not fork RAW / C1 / VP, does not rewrite prices. Adjustment on structure and volume-profile panes is locked to `none`. Roll caption is required. Ghost of the outgoing dated contract is a surface option (default off); visibility chrome lives on the structural surface spec, not here.
10. **v0.2 "CME volume-based ~8 sessions" withdrawn** as the unnamed default. Live volume / OI detectors are named-not-built activity presets until per-contract daily volume/OI is a SYM-9 kind.

---

## §1 Purpose and shape (carried)

Two data planes on StudioOne; the registry is their symbology voice — membership, role, state — with evidence held by the plane that owns it. OPF signs options eligibility; the price server signs price paths and the strip. Surfaces render API output verbatim and decide nothing (AZ-VP-3 / VP-L3 applied suite-wide). The registry stores references, never copies. Fail-loud throughout.

**Three axes (named so they stay distinct):**

| Axis | Answers | Example |
|---|---|---|
| Type | What kind of identity is this row? | `root` / `contract` / `continuity-alias` / `cash` / `stock` / `index` |
| Role | Which planes may consume it? | `{options, price-structure, volume-source}` |
| Kind | Which evidence exists? | `aggs` / `prints` / `chains` / `quotes` |

Readiness is intended per `(row × kind)`. The state vector that holds two kinds at once (chart-ACTIVE, model-COMING) is **not written in this file** — see D6.

## §2 Row model — typed (SYM-1)

Rows and resolve results carry a **type**:

| Type | Example | May be an ingest / C1 key? | May be ACTIVE? |
|---|---|---|---|
| `root` | ES | No | No — container only |
| `contract` | ESZ2026 | Yes (RAW native identity) | Yes, per kind |
| `continuity-alias` | ES1!, ES2! | **Never** | **Never** |
| `cash` / `stock` / `index` | SPX, SPY | Per kind | Yes, per kind |

Resolve additionally returns `ambiguous` for tokens that do not uniquely bind: `"dec"` without a year, decade-digit forms (`ESZ6` is not unique across 2026/2036). Ambiguous → show matches, never bind, fail-loud. Members commit to long form; the dialog makes long form one click.

`ES` (root) lists that root's dated contracts and aliases and does not pick one.

## §3 Registry laws (SYM series)

**SYM-1 — Typed identity.** As §2. No untyped symbol object exists anywhere in the API.

**SYM-2 — Roles are a set.** `{options, price-structure, volume-source}` per row. options: eligibility-gated (SYM-6), chains via OPF. price-structure: ES/MES roots and their contracts; exempt from the eligibility gate because this stack carries no futures options (stack fact, SYM-12); serves VP/chart/structure now and future futures-trading features later; never rendered as having chains. volume-source: feeds a pair's data plane (SPY→XSP); member-invisible unless separately granted a member-facing role.

**SYM-3 — Alias fence.** `ES1!`/`ES2!`/`/ES` resolve to the current long-form contract **as-of a `strip_generation_id`** (house default) or, on a pane that has a member preset, as-of that preset applied to the same strip (SYM-4.1). Aliases are never ACTIVE, never ingest keys, never C1 keys, never appear in RAW/EVENT, and any plane request keyed by an alias is refused fail-loud. The registry must never become the continuous contract. Binding field name: `bound_symbol` = the dated long form (e.g. `ESZ2026`), never the alias.

**SYM-4 — Roll law.** The strip is written only outside RTH. Front-pointer advance freezes during the session and applies after the close. Every universe/resolve payload carries `strip_generation_id`. Consumers render "front" only as-of a generation. "Self-advancing" remains retired. CP-1 covers registry writes.

The house detector, per root, is a versioned preset from the catalog in SYM-4.0. **ES/MES default: `ts-es-106X`** — 1st nearest, 6 trading days before expiration (TradeStation S&P typical-day rule). The v0.2 sentence "CME's ES roll is volume-based (~8 sessions pre-expiry)" is withdrawn as the unnamed default.

Trigger may fire on session N. The pointer writes after that session's close. Session N still shows the old front. Next session opens on the new dated front.

**SYM-4.0 — Preset catalog.**

| Id | Rule | Kind | Status |
|---|---|---|---|
| `ts-es-106X` | 1st nearest; 6 trading days before expiration | Calendar | **Live. House default.** |
| `cme-customary` | Monday of expiration week (CME customary lead-month date) | Calendar | Live |
| `ib-3X` | 3 trading days before expiration | Calendar | Live — captioned "IB quote-line," not "IB CONTFUT" |
| `conv-8X` | 8 trading days before expiration | Calendar | Live — captioned industry convention (includes tastytrade-style "week before expiration"), not "tastytrade official algorithm" |
| `tv-1VO` | First session next-month daily volume exceeds front | Activity | Named-not-built |
| `ts-1IN` | First session next-month OI exceeds front | Activity | Named-not-built |
| `ts-2VO` | Two consecutive sessions next volume > front | Activity | Named-not-built |

Thinkorswim `/ES` is a search dialect (SYM-3), not a roll row, until ToS publishes a hashable rule. Activity rows stay dark until per-contract daily volume/OI is a SYM-9 kind. The picker shows them with reason: "needs the daily volume path."

TradeStation-type controls on the chart shell expose: nearest-contract (locked to 1st for ES/MES house use) + time trigger (`NN` + `X`) for live calendar rows; activity controls remain disabled until those rows leave named-not-built.

**SYM-4.1 — Member favorite is a resolve overlay.** A member may select a live catalog row on the chart shell (C4). That choice remaps **that pane's** `ES1!` / `/ES` bind only. It does not write `strip_generation_id`. Universe / resolve without a member context returns the house default. Dated tokens (`ESZ2026`) never follow the favorite. RAW, C1, VP ingest, and the pair badge stay on the house default clock + dated contracts.

**SYM-4.2 — Adjustment is not a strip field.** Structure, volume-profile, C1, and model paths lock adjustment to `none`. Constant difference, ratio, TradingView `B_ADJ`, TradeStation `C`/`R`, and Thinkorswim "Adjust for contract changes" are refused as anything those surfaces can mount. The roll gap is the calendar spread between two dated contracts; Labs leaves it. A research-only adjusted continuous, if it ever exists, is a later separate surface that cannot mount C1, VP, GEX, options overlay, or the pair badge — out of this spec.

**SYM-4.3 — Roll caption (consumer obligation).** On the seam — the trigger session and the sessions through that contract's expiration — a price pane that just moved front shows:

> Front is now {incoming} ({preset}). {outgoing} still trades until Friday settlement. The jump is the spread between those contracts, not missing data.

Caption is required. Ghost is not. Caption names both dated contracts, the preset that moved the pointer, and what the gap is. Persistent through expiration week, not a one-bar toast.

**SYM-4.4 — Ghost (pointer permission only).** After the post-close write, surfaces **may** mount the outgoing dated contract as a second native series until that contract expires. Ghost key is the long form (`ESZ2026`). Ghost is not an alias, not ingest, not C1 front, not a pair end, not a strip write, not a fade of `ES1!`. Default off. Normative visibility and chrome — including identity, appear/die window, shared-axis ban on independent autoscale, and G6 grayscale + opacity 0.35–0.45 — live on the **structural surface spec**. This file does not restate that table.

**SYM-5 — Strip ≠ participation.** The strip is the tradable/view list for charts and pickers (root + continuity-alias rows + dated contracts, grouped by root). RAW ingest participation (every listed expiration vs a liquidity floor) is overlay Q1, still open, answered only by the construction spec's own process.

**SYM-6 — Eligibility gate.** options role requires ≥3 distinct option expirations per calendar week, measured from our own chain capture / OPF, evidence filed per PP-1 per row. **Measurement window and hysteresis:** rolling 4-week window, median expirations/week; a symbol flips to INELIGIBLE only on a sustained miss (median below gate) AND Coach confirmation — a holiday week never flips SPX mid-teaching-week. Help copy per §0.5.

**SYM-7 — States.** Row states: `ACTIVE | COMING | INELIGIBLE | STALE`. `UNSUPPORTED` is deleted as a state — a recognized-but-absent symbol is a **resolve miss**: a non-row payload carrying the gray reason. COMING carries its own member copy ("path not yet verified"), distinct from not-supported.

**SYM-8 — Pair activation is joint.** A pair badge shows ACTIVE only when every end the calling app declared is ACTIVE; otherwise the badge carries the worst end's state and names it. No badge lights on a COMING end. **Pair ends are the deliverable instruments: the frozen-front *contract* as-of `strip_generation_id` + cash/options — not the root.** Root remains a typeahead container (SYM-1). A declaration of `ES` + `SPX` is interpreted as front-contract + SPX.

**SYM-9 — ACTIVE means artifact.** COMING→ACTIVE requires a verification artifact per kind served: `{symbol, type, kind (aggs | prints | chains | quotes), source, as-of, tests run, results, max-age}` — dated, re-runnable, filed per PP-1, referenced by the row. Artifacts expire: past max-age without re-verification, the row shows STALE. ACTIVE is never a vibe.

**SYM-10 — Native evidence only.** No price-structure ACTIVE is grantable from a vendor *continuous* series — that would launder `1!` into the model. Per-contract native series (contract-keyed aggs or prints) are the only admissible evidence. Model-grade (prints) verification remains blocked on VPS Q1; ES/MES rows therefore start COMING for model kinds and may be ACTIVE for chart kinds only where a per-contract native artifact exists.

**SYM-11 — Availability decoupling.** options-role universe/resolve remains servable from an OPF-signed snapshot when the price-server host is down; D1 (price server hosts the API) stands with this failure mode written.

**SYM-12 — Member copy law.** Gray reasons ship in member-facing wording, not engineer tokens. The futures-options reason reads: "This stack does not carry futures options" — CME lists options on ES; our provider does not carry them, and the copy must not teach otherwise. Reasons: not-supported-yet / below-expiration-criterion / not-available-in-this-app / path-not-yet-verified / stack-carries-no-futures-options / needs-the-daily-volume-path.

Roll Help (may ship on the caption and in Help):

> The front month follows TradeStation's ES calendar — six trading days before expiration — and changes after the close. You can switch to another platform's rule. ES1! is that dated contract, not a back-adjusted continuous. At roll the chart names both contracts and leaves the gap. You can keep the outgoing contract visible as a ghost until it expires. It is that contract, not a shadow of the continuous.

**SYM-13 — Resolve isolation.** Member-dialog resolve never scrapes Massive live on the capture box's hot path: recognition is served from a cached/loaded reference set, refreshed outside RTH, isolated from capture (CP-1). Telemetry is aggregate-only; the eligibility report renders on the admin surface.

## §4 API contract (amended)

- `GET /symbology/v1/universe?roles=` — typed rows for the calling app's roles: root + continuity-alias rows + strip contracts (long form), grouped by root; every payload carrying `strip_generation_id` and the house default preset id. No family type.
- `GET /symbology/v1/resolve?q=&roles=&preset=` — returns `{type, binding | matches | miss}`: unique bind for long forms and aliases (`bound_symbol` = dated contract as-of generation, or as-of `preset` when that query param is a live catalog row), match-list for ambiguous tokens and for root queries (`ES` lists, does not bind), miss + gray reason for recognized-unsupported. `preset` is ignored on dated tokens.
- `POST /symbology/v1/telemetry` — aggregate gray-search events.
- `GET /symbology/v1/eligibility-report` — admin surface; Coach selects expansion rows toward ~20 from measured results only.
- `GET /symbology/v1/roll-catalog` — the SYM-4.0 table: id, rule, kind, status (live | named-not-built), default flag. Surfaces render this; they do not invent rows.

## §5 Fixture hygiene (SYM-SWAP gate)

The REQ-003 surface builds against a fixture ONLY under: (a) the fixture file carries a `FIXTURE` tag and the hashed picker four (SPX, XSP as options COMING unless a real chains artifact is attached; ES, MES as price-structure COMING); (b) CI fails any production bundle containing the tag; (c) a named swap gate — SYM-SWAP — where the fixture is deleted and the live API takes over; (d) **REQ-003 cannot close on the fixture** — its AP-1 closure (Coach's browser, his clicks) is attested only after SYM-SWAP.

SPY is **not** in the REQ-003 picker fixture. Volume-source rows are server-only. VPS Stage A does not consume the REQ-003 fixture. (Still a named join, not a closed bootstrap — D7.)

ES/MES in the fixture are COMING. Nothing in the fixture is ACTIVE without a real artifact behind it.

## §6 Acceptance tests (minimum)

| AT | Assertion |
|---|---|
| SYM-AT-1 | `ESZ6` typed → match list shown, nothing binds |
| SYM-AT-2 | `ES1!` presented as ingest/C1 key to either plane → refused fail-loud |
| SYM-AT-3 | Production bundle greps clean of `FIXTURE` and of client-side contract-month literals |
| SYM-AT-4 | Pair badge dark (worst-end labeled) while one declared end is COMING |
| SYM-AT-5 | Strip generation unchanged across an RTH-hours fixture; advance appears only post-close with new generation id |
| SYM-AT-6 | Resolve of a real unsupported symbol → miss payload + member-copy reason, never empty |
| SYM-AT-7 | Row past artifact max-age renders STALE, not ACTIVE |
| SYM-AT-8 | Alias resolution payload carries `strip_generation_id` and `bound_symbol` as a dated contract |
| SYM-AT-9 | `ts-es-106X` trigger day, RTH fixture: generation unchanged; post-close write increments id; at next session open `ES1!` binds the new dated contract |
| SYM-AT-10 | Request for constant / ratio / B-ADJ history as RAW, C1, or VP series → refused |
| SYM-AT-11 | Member preset ≠ house default → that pane's `ES1!` bind follows the preset; house `strip_generation_id` unchanged |
| SYM-AT-12 | Pair declared as ES (root) + SPX → badge uses front *contract* + SPX, never the root |
| SYM-AT-13 | `GET /roll-catalog` lists `tv-1VO` as named-not-built; picker cannot apply it |
| SYM-AT-14 | Dated token `ESZ2026` + `preset=cme-customary` → bind is still `ESZ2026` |

Surface ATs for caption presence and ghost chrome (grayscale + opacity 0.35–0.45, default off, die at expiration) live on the structural surface spec, not here.

## §7 Coordination law (carried, amended)

Surfaces render, never decide. Evidence lives with its plane. CP-1 binds all StudioOne work — registry writes included (SYM-4). Sequencing: REQ-003 surface proceeds contract-first against the §5 fixture; joint closure only after SYM-SWAP, in Coach's browser. Roll-catalog chrome and ghost chrome may proceed against this contract on the structural surface; they are not Juliet of the registry server.

## §8 Open decisions

**D1 — Registry home:** price server hosts, WITH SYM-11's snapshot failure mode — stands.
**D2 — Recognition source:** Massive reference, cached per SYM-13 — stands.
**D3 — Naming:** implementation spec.
**D4 — Member-tradable SPY:** not taken; SPY is volume-source only until Coach says otherwise.
**D5 — Ghost default:** off. Surface law. Coach overwrites.
**D6 — Readiness per `(row × kind)`:** intended; state vector unwritten. Chart-grade ACTIVE vs model-COMING caption is a structural-surface problem until this file grows the vector.
**D7 — metadata_ref bootstrap / SPY fixture:** metadata row may exist while the registry row is COMING; ACTIVE requires the ref to resolve. Who authors the first `vp_row` / calendar row is unwritten. Stage A stays off the REQ-003 fixture until that join is a ticket.
**D8 — Activity-preset feed:** `tv-1VO` / `ts-1IN` / `ts-2VO` stay dark until daily volume/OI is a SYM-9 kind.

## §9–12 Reserved

Implementation spec (Machine: StudioOne, CP-1 clauses mandatory), REQ-003 consumption amendment, ES/MES ACTIVE for model kinds (blocked on VPS Q1), structural-surface ghost/caption ATs, and Juliet intake — all explicitly NOT next steps until v0.2.1 passes review and Coach directs.

Ghost G1–G21 (identity, appear/die, grayscale + opacity 0.35–0.45, no vote, no B-ADJ, chart pane only) are recorded in the structural surface spec. Do not implement them from this file.

## §13 Advisor finding disposition

v0.1 findings remain as disposed in v0.2 §13, with these amendments from the v0.2 review and the 2026-09-19 roll seats:

| Finding | Disposition in v0.2.1 |
|---|---|
| P0-8 pair unsatisfiable (root never ACTIVE) | SYM-8 ends = frozen-front contract + cash/options |
| §4 "futures families" | Struck; grouped root + alias + dated contracts |
| SYM-4 unnamed ~8-session default | Withdrawn; catalog + `ts-es-106X` |
| Member favorite / vendor catalog | SYM-4.0 / 4.1 |
| B-ADJ as trader option on structure/VP | Refused (SYM-4.2) |
| Caption at roll | Required (SYM-4.3) |
| Ghost of outgoing contract | Permitted as surface option (SYM-4.4); chrome not owned here |
| P0-5 metadata bootstrap / SPY in fixture | Still PARTIAL — D7 |
| P0-10 / per-kind state | Still PARTIAL — D6 |
| Q8 REQ path | Still OPEN — §0.8 |
| Rec 14 no Juliet / no fixture ship | Held |

Dropped findings: none.

## §14 Change table

### v0.1 → v0.2

As in v0.2 §14.

### v0.2 → v0.2.1

| Area | v0.2 | v0.2.1 |
|---|---|---|
| §0 label | "Seated decisions" | Advisor-seated pending Coach word |
| SYM-4 default | "CME volume-based ~8 sessions," measured | Named catalog; default `ts-es-106X` |
| Member favorite | Absent | SYM-4.1 overlay; house strip unforked |
| Adjustment | Absent | SYM-4.2 locked `none` on structure/VP |
| Roll caption | Absent | SYM-4.3 required |
| Ghost | Absent | SYM-4.4 permission; chrome on structural surface |
| SYM-8 ends | Joint, unsatisfiable on a root | Frozen-front contract + cash/options |
| §4 universe | "futures families" | Root + alias rows + dated contracts |
| Fixture | Hashed four; SPY unmentioned | Picker four COMING; SPY server-only; Stage A off this fixture |
| ATs | SYM-AT-1…8 | + SYM-AT-9…14 |
| Open | D1–D4 | + D5–D8 |

---
Version: v0.2.1 (DRAFT) — header, filename, and this line must agree.
