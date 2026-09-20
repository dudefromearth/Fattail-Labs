# Symbology & Registry Service — Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT — first version; supersedes nothing)
**Date:** 2026-09-19
**Authoring machine:** StudioTwo (dev) — specification only; files/trees touched: NONE
**Service machines:** StudioOne (both data planes; Chain Primacy CP-1 binds all work there)
**Status:** DRAFT. **BUILD AUTHORITY: none.**
**Related:** REQ-003 FINAL (the surface half — tile + TV-model dialog); REQ-001/REQ-002 unaffected.
**Coach rulings recorded (2026-09-19, RL-1):** symbol handling is tile → dialog, TV model, no pulldowns; a symbology/registry layer "requires a spec and coordination between the server and the app surfaces"; OPF is the existing options server; the new StudioOne server handles stocks, indexes, futures.

---

## §1 Purpose and shape

One source of truth for the supported symbol universe, consumed by every Labs app surface. Two data planes already exist on StudioOne:

| Plane | Server | Speaks | Evidence it owns |
|---|---|---|---|
| Options | OPF (existing) | Chains, expirations, OPF API | Options-role eligibility: >= 3 distinct expirations/week, measured from its own chain data |
| Price | New StudioOne server | Stocks, indexes, futures — prints/aggs, the quarterly strip, VP delivery | Price-path verification per symbol/class; contract strip contents |

The registry is the **symbology voice** of this pair: it does not duplicate either plane's data; it asserts membership, role, and state, each assertion backed by evidence from the plane that owns it (PP-1 per row). App surfaces render what the API says and assert nothing locally — no hardcoded symbols anywhere (retires the ESZ6 class of bug permanently).

## §2 Registry model

Row: symbol, class (future-root | stock | index), role (options | price-structure), pair (e.g. ES→SPX) or class metadata, state, evidence refs, dialect aliases.

- **options role:** membership by the expiration law (>= 3/week, 1–5 DTE doctrine text attached); evidence = OPF measurement artifact, dated, re-runnable. Initial: SPX, XSP.
- **price-structure role:** ES, MES; exempt from the expiration law (provider carries no options on futures — provider fact, not doctrine); serves VP/chart/structure now, futures-trading features (pairs, calendars, combos) later. Never rendered as having chains.
- **States:** ACTIVE (path verified on the serving machine) | COMING (row exists, path unverified) | INELIGIBLE (fails expiration law) | UNSUPPORTED (recognized, no row). Fail-loud: no row is ACTIVE without its verification artifact.

## §3 API contract (sketch — names settle at implementation spec)

- `GET /symbology/v1/universe?roles=` — full supported universe for the calling app's declared roles: rows with role, state, metadata, pair badge, futures family structure (1!/2! continuity entries + strip contracts in long form, self-advancing).
- `GET /symbology/v1/resolve?q=&roles=` — dialect resolution (ES1!, /ES, @ES, ESZ6/ESZ26/ESZ2026, "dec"...) AND recognition of real-but-unsupported symbols (Massive reference lookup), returning the gray reason: not-supported-yet | below-expiration-criterion | not-available-in-this-app | no-options-on-futures.
- `POST /symbology/v1/telemetry` — grayed-search events (symbol, count, eligibility annotation): roadmap demand data into existing instrumentation.
- `GET /symbology/v1/eligibility-report` — the measured qualifying list across the reference universe, for Coach's expansion selection toward ~20.

## §4 Coordination law

1. **Surfaces render, never decide.** Tile and dialog display API output verbatim, including gray reasons. An app declares its roles once; scoping happens server-side.
2. **Evidence lives with its plane.** OPF signs eligibility; the price server signs path verification and the strip. The registry stores references, not copies.
3. **CP-1 binds.** All registry/eligibility work on StudioOne is read-only against capture; anything that could disturb chain collection waits for after the RTH close.
4. **Sequencing:** REQ-003's surface build may proceed against a fixture registry file matching this contract, swapped to the live API when the service lands — surface and server halves develop in parallel, contract-first. The fixture is deleted at swap; it never ships as the source of truth.

## §5 Open decisions

**D1 — Registry home** (seated lean, Coach overwrites): the new price server hosts the symbology API, since it spans all classes and already exists to serve any endpoint; OPF remains an evidence feeder. Alternative: a third micro-facade — rejected as an extra moving part unless the price server's owner objects.
**D2 — Recognition source:** Massive reference/symbology (lean — cheapest true source); implementer flags if impractical.
**D3 — Service and API naming** — at implementation spec, house pattern.

## §6 Intake path

Iterate as DRAFT. When Coach directs: Juliet intake, implementation spec for the server half (Machine: StudioOne, CP-1 clauses mandatory), REQ-003 FINAL amended to consume this contract. AP-1/PP-1 govern both halves; the joint closure is the tile → dialog → selection loop working against the live API in Coach's own browser.

---
Version: v0.1 (DRAFT) — header, filename, and this line must agree.
