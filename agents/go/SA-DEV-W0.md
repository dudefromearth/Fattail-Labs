# SA-DEV-W0 — SA prototype on StudioTwo · GO token

**MACHINE:** StudioTwo. Collector store **READ-ONLY**. Never write
`{LABS_MARKET_DATA_ROOT}/vp/ingest/`. Never `git add -A`. Do not stop
`:3000` / `:4000`. StudioOne: **not this token**.

**Namespace:** **`SADEV*` = APPS-owned** (**DL-720**). INFRA does **not**
execute or modify this work. Cross-instance conflict → STOP, report to Coach.

**Status:** **STAMPED GO** — 2026-09-17. Chat is not a stamp (**DL-328**). **DL-723.**

**Law:** VP Service **v0.6.1** sha1 `7e3bbedc58e1cbadc2ce96bb820bf93059f8806d` · **DL-730**. SA Service **v0.4 authored** sha1 `d68060cc5221b83170d39aeace5e8fb8b7470c51` · **DL-731** (supersedes v0.3.1; **DL-728 pointer CLOSED**). Spec remains **NOT BUILD**. Frozen API: Contract v1.0 (**DL-726**). Coach Decision 1 verbatim: "Raw bins stay on StudioOne the collector, bins are available through an API"

**Resource rule:** on StudioTwo contention, the **COLLECTOR wins**; this track **throttles**.

## Coach ticks

- [x] Specs v0.6 / v0.3 are the seated pair (**DL-721**)
- [x] DEV-ONLY — no production Options Lab surface, no StudioOne jobs
- [x] Collector store READ-ONLY (APPS never writes ingest)
- [x] Collector wins on disk/CPU/ports
- [x] Acts 1–3 below authorized for **GROK BUILD — APPS**
- [x] **Member deny even in dev** — Act 3 canvas is DEV-ONLY **and** still SA objects only (Q10=(b) / VP-L18); members do not see raw bins even on the dev canvas

## Acts (APPS executes after stamp — own pre-flight)

1. **Dev API / mock-first (amended 2026-09-17).** VP Profile API **Contract v1.0** (`Specs/VP-API-Contract-v1_0.md`, sha1 `b403937af18140eb7900ccfa72437e7f3e9bc5aa`) is frozen. Act 1 builds a **fixture-faithful mock** of that contract (F1, F2, F5, F8; GAPPED; mapping-STALE; member **403** `{"error":"computing_consumers_only"}`). SA prototype and canvas develop against the mock via `LABS_SA_DEV_VP_API_BASE` (default `mock://`). Flip the base URL to the live dev API when real bins serve — **zero rework**. Client never works around the contract; mismatch is a report to Coach, not a shim. Local collector store remains **READ-ONLY** and is not the mock's SoR.
2. **SA detection prototype** per SA v0.3 detection procedure (DRAFT) — computing consumer of contract histograms, never raw-print SoR.
3. **Dev canvas** — DEV-ONLY member-surface prototype: SA objects only (Q10=(b) / VP-L18). No raw bins as the member rendering. **Member deny even in dev.** **SA-L11 (DL-725):** first-class nav for Replay, Footprint / Market Delta, GEX Overlay, Characterization, Exploration in honest **IN-DEVELOPMENT** with doctrine text; no fake data, no empty widgets, no hiding.

## Does not

`VPS*` / `VPSB*` tokens · StudioOne · write ingest · tonight’s INFRA chain (VPS2 ACT 3 → futures migration) · spec self-review (ADVISOR)

## Stamp

**STAMPED 2026-09-17** by Coach (exact ticks below). APPS executes Acts 1–3 on its own pre-flight. INFRA does not execute `SADEV*`.

| Tick | Coach |
|------|-------|
| v0.6 / v0.3 seated | ☑ |
| DEV-ONLY | ☑ |
| ingest READ-ONLY | ☑ |
| collector wins | ☑ |
| Acts 1–3 for APPS | ☑ |
| Member deny even in dev | ☑ |
