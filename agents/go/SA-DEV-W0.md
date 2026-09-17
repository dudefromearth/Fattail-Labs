# SA-DEV-W0 — SA prototype on StudioTwo · GO token

**MACHINE:** StudioTwo. Collector store **READ-ONLY**. Never write
`{LABS_MARKET_DATA_ROOT}/vp/ingest/`. Never `git add -A`. Do not stop
`:3000` / `:4000`. StudioOne: **not this token**.

**Namespace:** **`SADEV*` = APPS-owned** (**DL-720**). INFRA does **not**
execute or modify this work. Cross-instance conflict → STOP, report to Coach.

**Status:** **STAMPED GO** — 2026-09-17. Chat is not a stamp (**DL-328**). **DL-723.**

**Law:** VP Service **v0.6** sha1 `a438f9d636e40d4c95feb87874daf8c603344aac` · SA Service **v0.3** sha1 `4638ce958a81e24980ed6fd2e7618aaec51f4cfd` · **DL-721**. Coach Decision 1 verbatim: "Raw bins stay on StudioOne the collector, bins are available through an API"

**Resource rule:** on StudioTwo contention, the **COLLECTOR wins**; this track **throttles**.

## Coach ticks

- [x] Specs v0.6 / v0.3 are the seated pair (**DL-721**)
- [x] DEV-ONLY — no production Options Lab surface, no StudioOne jobs
- [x] Collector store READ-ONLY (APPS never writes ingest)
- [x] Collector wins on disk/CPU/ports
- [x] Acts 1–3 below authorized for **GROK BUILD — APPS**
- [x] **Member deny even in dev** — Act 3 canvas is DEV-ONLY **and** still SA objects only (Q10=(b) / VP-L18); members do not see raw bins even on the dev canvas

## Acts (APPS executes after stamp — own pre-flight)

1. **Dev API** over the **local** store (`/Users/ernie/fattail-market-data` on StudioTwo — INFRA collector path). Read histograms / prints as the VP data end exposes them locally; do not invent a second ingest. **READ-ONLY.**
2. **SA detection prototype** per SA v0.3 detection procedure (DRAFT) — computing consumer of histograms, never raw-print SoR.
3. **Dev canvas** — DEV-ONLY member-surface prototype: SA objects only (Q10=(b) / VP-L18). No raw bins as the member rendering. **Member deny even in dev.**

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
