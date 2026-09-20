# Symbology & Registry Service — Spec v0.2 (DRAFT)

**Version:** v0.2 (DRAFT)
**Supersedes:** `Symbology-Registry-Service-Spec-v0_1.md` (review-object sha1 `b07455cb…`). v0.1 stays on disk as baseline. Change table §14.
**Date:** 2026-09-19
**Authoring machine:** StudioTwo (dev) — specification only; files/trees touched: NONE
**Service machines:** StudioOne (both planes; CP-1 binds all work there)
**Status:** DRAFT. **BUILD AUTHORITY: none.** No Juliet intake; REQ-003 must not ship on the fixture.
**Related:** Advisor review 2026-09-19, filed `artifacts/agents/reviews/2026-09-19-Advisor-Symbology-Registry-Service-Spec-v0_1.md` — §13 disposes every finding; none dropped.
**Does not answer:** VPS Q1 (per-contract prints), overlay Q1 (RAW participation set), "what is a listed contract for RAW ingest." Stated here so no reader mines this file for those answers.

---

## §0-A Abstract (canonical — converged Coach/Grok/Claude text, 2026-09-19)

The Symbology & Registry Service exists so symbol search in Labs uses the notation and type-ahead traders already know, while selection and readiness follow house rules that keep the chart from quietly changing instruments. It is the membership voice for which symbols Labs surfaces may offer, in what role, and in what state. Apps do not keep their own lists — when two lists exist they disagree, and a chart renders the wrong instrument. Search follows the TradingView pattern: type-ahead, not pulldowns. Futures identity is the dated contract (ESZ2026). Familiar tokens resolve as follows: ES1! and /ES resolve to this session's frozen front as a dated contract — they are viewing aliases, not instruments ingest or charts mount; ES lists that root's dated contracts and aliases and does not pick one; ambiguous tokens such as ESZ6 return their matches and bind nothing. The front pointer does not change during the session; it advances after the close on the house roll rule. A symbol is offered as ready only when a dated, re-runnable path-verification artifact is current. Symbols that are waiting on a path, out of this app, or below the options coverage gate are shown with a reason — never as a silent miss.

## §0 Seated decisions — recorded with rationale; Coach overrides any with a word

1. **Registry is a SIBLING of VPS symbol-metadata, with the join named** (Advisor Q1). This service speaks membership, role, and state only. Symbol *behavior* — `vp_row`, tick, multiplier, session calendar — stays in VPS symbol-metadata under VP-L3, which this spec cites and does not amend. Every registry row carries a `metadata_ref` to its symbol-metadata entry; a symbol with no metadata entry cannot go ACTIVE for price kinds. Named replaced consumers: the Analyzer's `market_symbol_universe` / OptionsLabProvider list migrates to this API at implementation; no other symbol list survives. Rationale: absorbing metadata would amend VPS law from outside its own spec — wrong door.
2. **`1!` / `2!` are view aliases, never instruments** (Q2). Law SYM-3 below. Follows VP-OVL-1/-8.
3. **The strip does not answer overlay Q1** (Q3). Law SYM-5. Participation remains the construction spec's open parameter.
4. **SPY enters with role `volume-source` only, member-invisible** (Q4). Roles become a set (SYM-2). Rationale: VPS Stage A is SPY prints → XSP; the SoT cannot omit its own volume source. Member-tradable SPY is a separate Coach decision, not taken here.
5. **The eligibility gate is ≥3 expirations/week; DTE text is Help copy, never a predicate** (Q5). Copy reads "short-dated including 0DTE (0–5 DTE)." Rationale: 0DTE is the house product; a "1–5" filter would exclude the flagship. Coach's "1–5" wording preserved in the RL-1 record with this reading noted.
6. **Pair ACTIVE is joint** (Q6). Law SYM-8; VPS S3 proxy-honesty inherited.
7. **ACTIVE requires per-contract native evidence for the kinds the row serves; a vendor continuous series never grants ACTIVE** (Q7). Law SYM-9/SYM-10. Chart-grade aggs (native, per-contract, e.g. ESZ2026 5-min) and model-grade prints are distinct verified kinds; model-grade remains gated on VPS Q1.
8. **REQ packets get a hashable surface** (Q8). REQ-001/002/003 texts (final versions) are filed under `artifacts/reqs/` on main; RL-1 extends: a REQ row includes its filed path. Until filed, the Advisor's "cannot hash REQ-003" stands as a defect.

---

## §1 Purpose and shape (carried from v0.1, corrected)

Two data planes on StudioOne; the registry is their symbology voice — membership, role, state — with evidence held by the plane that owns it. OPF signs options eligibility; the price server signs price paths and the strip. Surfaces render API output verbatim and decide nothing (AZ-VP-3 / VP-L3 applied suite-wide). The registry stores references, never copies. Fail-loud throughout.

## §2 Row model — typed (SYM-1)

Rows and resolve results carry a **type**:

| Type | Example | May be an ingest / C1 key? | May be ACTIVE? |
|---|---|---|---|
| `root` | ES | No | No — container only |
| `contract` | ESZ2026 | Yes (RAW native identity) | Yes, per kind |
| `continuity-alias` | ES1!, ES2! | **Never** | **Never** |
| `cash` / `stock` / `index` | SPX, SPY | Per kind | Yes, per kind |

Resolve additionally returns `ambiguous` for tokens that do not uniquely bind: `"dec"` without a year, decade-digit forms (`ESZ6` is not unique across 2026/2036). Ambiguous → show matches, never bind, fail-loud. Members commit to long form; the dialog makes long form one click.

## §3 Registry laws (SYM series)

**SYM-1 — Typed identity.** As §2. No untyped symbol object exists anywhere in the API.
**SYM-2 — Roles are a set.** `{options, price-structure, volume-source}` per row. options: eligibility-gated (SYM-6), chains via OPF, serves options apps and price apps. price-structure: ES/MES roots and their contracts; exempt from the eligibility gate because this stack carries no futures options (stack fact, see SYM-12 copy law); serves VP/chart/structure now and future futures-trading features later; never rendered as having chains. volume-source: feeds a pair's data plane (SPY→XSP); member-invisible unless separately granted a member-facing role.
**SYM-3 — Alias fence.** `ES1!`/`ES2!` resolve to the current long-form contract **as-of a `strip_generation_id`**, returned with the resolution. Aliases are never ACTIVE, never ingest keys, never C1 keys, never appear in RAW/EVENT, and any plane request keyed by an alias is refused fail-loud. The registry must never become the continuous contract.
**SYM-4 — Roll law.** The strip is written only outside RTH: front-pointer advance and strip changes freeze during the session and apply after the close. CME's ES roll is volume-based (~8 sessions pre-expiry), not expiry-day — the advance follows the measured roll, applied at the next post-close write. Every universe/resolve payload carries `strip_generation_id`; consumers render "front" only as-of a generation. "Self-advancing" is retired as a verb: advancing is a clocked, logged write. CP-1 explicitly covers registry writes on StudioOne.
**SYM-5 — Strip ≠ participation.** The strip is the tradable/view family for charts and pickers. RAW ingest participation (every listed expiration vs a liquidity floor) is overlay Q1, still open, answered only by the construction spec's own process.
**SYM-6 — Eligibility gate.** options role requires ≥3 distinct option expirations per calendar week, measured from our own chain capture / OPF, evidence filed per PP-1 per row. **Measurement window and hysteresis:** rolling 4-week window, median expirations/week; a symbol flips to INELIGIBLE only on a sustained miss (median below gate) AND Coach confirmation — a holiday week never flips SPX mid-teaching-week. Help copy per §0.5.
**SYM-7 — States.** Row states: `ACTIVE | COMING | INELIGIBLE | STALE`. `UNSUPPORTED` is deleted as a state — a recognized-but-absent symbol is a **resolve miss**: a non-row payload carrying the gray reason. COMING carries its own member copy ("path not yet verified"), distinct from not-supported — a member asking about a symbol we're bringing up must not be taught to stop asking.
**SYM-8 — Pair activation is joint.** A pair badge shows ACTIVE only when every end the calling app declared is ACTIVE; otherwise the badge carries the worst end's state and names it. No badge lights on a COMING end.
**SYM-9 — ACTIVE means artifact.** COMING→ACTIVE requires a verification artifact per kind served: `{symbol, type, kind (aggs | prints | chains | quotes), source, as-of, tests run, results, max-age}` — dated, re-runnable, filed per PP-1, referenced by the row. Artifacts expire: past max-age without re-verification, the row shows STALE. ACTIVE is never a vibe.
**SYM-10 — Native evidence only.** No price-structure ACTIVE is grantable from a vendor *continuous* series — that would launder `1!` into the model. Per-contract native series (contract-keyed aggs or prints) are the only admissible evidence. Model-grade (prints) verification remains blocked on VPS Q1; ES/MES rows therefore start COMING for model kinds and may be ACTIVE for chart kinds only where a per-contract native artifact exists.
**SYM-11 — Availability decoupling.** options-role universe/resolve remains servable from an OPF-signed snapshot when the price-server host is down; D1 (price server hosts the API) stands with this failure mode written.
**SYM-12 — Member copy law.** Gray reasons ship in member-facing wording, not engineer tokens. The futures-options reason reads: "This stack does not carry futures options" — CME lists options on ES; our provider does not carry them, and the copy must not teach otherwise. Reasons: not-supported-yet / below-expiration-criterion / not-available-in-this-app / path-not-yet-verified / stack-carries-no-futures-options.
**SYM-13 — Resolve isolation.** Member-dialog resolve never scrapes Massive live on the capture box's hot path: recognition is served from a cached/loaded reference set, refreshed outside RTH, isolated from capture (CP-1). Telemetry is aggregate-only; the eligibility report renders on the admin surface.

## §4 API contract (v0.1 sketch, amended)

- `GET /symbology/v1/universe?roles=` — typed rows for the calling app's roles, futures families as root + alias entries + strip contracts (long form), every payload carrying `strip_generation_id`.
- `GET /symbology/v1/resolve?q=&roles=` — returns `{type, binding | matches | miss}`: unique bind for long forms and aliases (alias → contract as-of generation), match-list for ambiguous tokens, miss + gray reason for recognized-unsupported.
- `POST /symbology/v1/telemetry` — aggregate gray-search events.
- `GET /symbology/v1/eligibility-report` — admin surface; Coach selects expansion rows toward ~20 from measured results only.

## §5 Fixture hygiene (SYM-SWAP gate)

The REQ-003 surface builds against a fixture ONLY under: (a) the fixture file carries a `FIXTURE` tag and the hashed initial four (SPX, XSP as options; ES, MES as price-structure COMING); (b) CI fails any production bundle containing the tag; (c) a named swap gate — SYM-SWAP — where the fixture is deleted and the live API takes over; (d) **REQ-003 cannot close on the fixture** — its AP-1 closure (Coach's browser, his clicks) is attested only after SYM-SWAP. ES/MES in the fixture are COMING; nothing in the fixture is ACTIVE without a real artifact behind it.

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
| SYM-AT-8 | Alias resolution payload carries `strip_generation_id` |

## §7 Coordination law (carried, amended)

Surfaces render, never decide. Evidence lives with its plane. CP-1 binds all StudioOne work — registry writes included (SYM-4). Sequencing: REQ-003 surface proceeds contract-first against the §5 fixture; joint closure only after SYM-SWAP, in Coach's browser.

## §8 Open decisions

**D1 — Registry home:** price server hosts, WITH SYM-11's snapshot failure mode — stands. **D2 — Recognition source:** Massive reference, cached per SYM-13 — stands. **D3 — Naming:** implementation spec. **D4 (new) — Member-tradable SPY:** not taken; SPY is volume-source only until Coach says otherwise.

## §9–12 Reserved

Implementation spec (Machine: StudioOne, CP-1 clauses mandatory), REQ-003 consumption amendment, ES/MES ACTIVE (blocked on VPS Q1 for model kinds), and Juliet intake — all explicitly NOT next steps until v0.2 passes review and Coach directs.

## §13 Advisor finding disposition — every finding, carried or reasoned

| Finding | Disposition |
|---|---|
| P0-1 row identity untyped | §2 + SYM-1; ambiguous fail-loud; long-form commitment |
| P0-2 `1!` mountable | SYM-3 fence; SYM-AT-2; §0.2 |
| P0-3 self-advancing is a write | SYM-4 roll law; generation ids; CP-1 covers writes; verb retired |
| P0-4 strip ≠ overlay Q1 | SYM-5; header "Does not answer" |
| P0-5 third SoT / SPY / role singular | §0.1 sibling + named join + replaced consumers; SYM-2 role set + volume-source; SPY seated (§0.4, D4) |
| P0-6 states collapse | SYM-7: UNSUPPORTED deleted as state → resolve miss; COMING copy distinct |
| P0-7 0DTE filter risk / window | §0.5 gate-vs-copy split; SYM-6 window + hysteresis + Coach-confirm flip |
| P0-8 pair activation | SYM-8 joint; worst-end badge |
| P0-9 fixture ships the bug | §5 SYM-SWAP hygiene; SYM-AT-3; REQ-003 cannot close on fixture; ES/MES COMING; my v0.1 "retires permanently" claim withdrawn as unproven |
| P0-10 path-verified undefined | SYM-9 artifact schema + STALE; SYM-11 snapshot decoupling; SYM-13 resolve isolation |
| P0-11 gray copy | SYM-12 member copy; futures-options copy corrected to a stack fact |
| Recs 1–14 | Adopted as written; rec 12's SYM numbering and ATs are §3/§6; rec 13 in SYM-13/§4; rec 14 held (no Juliet, no fixture ship) |
| Coach questions 1–8 | Seated §0 with rationale; all overridable |

Dropped findings: none.

## §14 Change table v0.1 → v0.2

| Area | v0.1 | v0.2 |
|---|---|---|
| Row identity | Untyped, class only | Typed (SYM-1); ambiguous fail-loud |
| Aliases | 1!/2! listed as entries | SYM-3 fence: view-only, as-of generation, never keys |
| Strip | "Self-advancing" | SYM-4 roll law: post-close writes, generation ids, CP-1 |
| Roles | Singular | Set (SYM-2); volume-source added; SPY seated |
| Metadata SoT | Silent | Sibling + named join + replaced consumers (§0.1) |
| States | ACTIVE/COMING/INELIGIBLE/UNSUPPORTED | UNSUPPORTED → resolve miss; STALE added |
| Eligibility | 1–5 text attached | Gate-only law; 0–5 incl 0DTE copy; window + hysteresis |
| Pair badge | Unspecified | Joint activation (SYM-8) |
| Fixture | "Fixture then swap" | SYM-SWAP hygiene; CI gate; cannot-close-on-fixture |
| ACTIVE | Sentence | Artifact schema + STALE + native-only evidence (SYM-9/10) |
| Laws/ATs | None numbered | SYM-1…13; SYM-AT-1…8 |

---
Version: v0.2 (DRAFT) — header, filename, and this line must agree.
