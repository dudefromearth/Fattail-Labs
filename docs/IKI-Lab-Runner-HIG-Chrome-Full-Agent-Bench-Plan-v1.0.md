# IKI Lab — Runner HIG chrome · Full Agent Bench Plan v1.0.1

**Program:** IKI Lab (DL-539)  
**Packet:** IKI-P3  
**Token:** [`agents/go/IKI-P3.md`](../agents/go/IKI-P3.md)  
**Board:** [`agents/p-iki-lab/`](../agents/p-iki-lab/)  
**W0:** [`agents/p-iki-lab/W0-inventory.md`](../agents/p-iki-lab/W0-inventory.md) · evidence copy [`agents/p-iki-lab/evidence/iki-p3/W0-inventory.md`](../agents/p-iki-lab/evidence/iki-p3/W0-inventory.md)  
**Gate:** **IKI-P3-G** — Echo **and** Tango **mandatory** · Delta ternary  

**Amendment:** v1.0.1 — Coach review 2026-08-22. Nothing of Coach’s is removed. Juliet does not dispose B1–B3 or C1.

**Authority (already stamped, not a new spec):**

| Doc | Use |
|-----|-----|
| Heatmap Templates Spec v0.2 **§6.1** | Top compact suite nav · left ~1/5 rail · right ~4/5 view · control set |
| **§6.2** | Stream status copy (four named states — see **C1**) |
| **HM14** | Tokens · ≥44pt · focus · reduced-motion |
| Human Interface Spec v1.0 | Control grammar, `--hit-min`, focus rings |
| INSTRUCTIONS §5 step 3 | **Echo + Tango** on the review chain |
| Runner Spec **TR13** | As-built for the **IKI host** after Lima (not before) |

Coach: *“exactly like Heatmap in Options Lab … it follows Apple HIGs which the current implementation on Runner does not.”*

This document is the **Juliet execution plan**. No W1 code until Coach stamps **GO W1** **and** disposes **B1 · B2 · B3 · C1** below.

**DL-539 (2026-08-22):** Coach granted **three successive OKs** to **open out-of-scope files read-only**. Recorded on [`agents/go/IKI-P3.md`](../agents/go/IKI-P3.md). **Writes** to those files are not granted.

---

## Coach dispositions (blocking) — Juliet does not pick

Tick **one** on each. These are not plan law until ticked.

### B1 — Review chain (INSTRUCTIONS §5 step 3)

Tonight’s ruling: implementation goes through the bench **including UX, UI, and interaction design agents**. §5 step 3 names **Echo + Tango**. v1.0 had Echo only.

- [x] **Echo + Tango.** Echo: HIG, tokens, interaction, visual parity. Tango: capacity, honesty, cognitive load of the rail and status copy. Tango seed is in the pack.  
- [ ] **Hold** — roster incomplete; do not GO W1.

Coach **GO W1** 2026-08-22: not Hold → Echo + Tango.

Juliet cannot treat Echo as covering Tango’s seat without this tick.

### B2 — Stable rail (disable, don’t hide) — **Coach’s fingerprint**

**Stated prominently: Coach put this in the IKI-P3 brief. It is not Juliet’s.**

The IKI-P3 brief said inapplicable controls are **disabled, not hidden**. Heatmap **hides**. Coach also said *exactly like Heatmap*. The brief’s disable rule was withdrawn when work moved onto the bench. It has no spec line and no design review. It contradicts the named reference until Coach ratifies it as an amendment.

- [ ] **Ratify** disable-don’t-hide as a Coach amendment for the IKI rail (Heatmap may keep hiding).  
- [x] **Hide like Heatmap** — inapplicable controls are omitted, same as `HeatmapControlsColumn`.

Coach **GO W1** 2026-08-22: plan default (unticked Ratify) → hide like Heatmap.

Until one is ticked, Charlie’s seed follows **Hide like Heatmap** (the named reference). The disable sentence is **not deleted**; it sits here as Coach’s, for Coach to keep or drop.

### B3 — `web/lib/runner/sinks/` and `__tests__/` (DL-539)

DL-539 freezes **Template Runner internals** by name. v1.0 carved `sinks/render.ts` as chrome vs `subscribe/run/registry/host/templates` as compute — Juliet’s line, not Coach’s. Coach: *“Runner as mounted at `/app/iki/runner` is IKI Lab work.”* Whether that reaches `sinks/` is this tick (also on the GO token).

- [x] **Yes** — `sinks/render.ts` chrome (strip selector; keep `TileGrid` / session) and `web/lib/runner/__tests__/iki-p3-chrome.test.ts` are in scope. Compute files stay frozen.  
- [ ] **No** — `render.ts` and `web/lib/runner/__tests__/` untouched. Selector-bar removal lives on the IKI page/rail only. Kilo tests live under `web/app/app/iki/` (or evidence-only Playwright).

Coach **GO W1** 2026-08-22: IKI-P3 GO named `web/lib/runner/` host; W1 cannot drive the rail without chrome in `render.ts`. Compute files stay frozen. Read-only three-OK does not cover this write — GO W1 + original host allowlist does.

### C1 — §6.2 “Market closed”

§6.2 names four states: Live stream · Held · market closed · Error / connecting. The chain document has `stale` and `epoch_quality` (`ok` / `incomplete` / `skewed`). **Market closed is not on that document.** Reading `mb:session:market_status` would touch `subscribe.ts` (frozen).

This is **open**. Not plan law. Read-only of `subscribe.ts` is already granted (three-OK above). **Writing** it is not.

- [x] **Ship three states now.** Record **OD-IKI-P3-1**: Market closed deferred.  
- [ ] **Write `subscribe.ts`** — needs a **separate write** three-OK (the read-only grant does not cover this). **Do not start W1** on that path until those OKs exist.

Coach **GO W1** 2026-08-22: write-`subscribe.ts` would block W1; three states + OD.

---

## Doctrine and first principles (this packet)

| Law | Application |
|-----|-------------|
| **DL-539** | IKI Lab is the active program. Out-of-scope trees: **read-only OK** (three OKs 2026-08-22). **Write** still frozen until B3 / a write three-OK. |
| **Change control** | Exact files in the allowlist **after** B3. Nothing else. |
| **Juliet invariant 3** | One domain per seed. Charlie implements; Echo and Tango review; Kilo characterizes; Lima papers; Delta gates. |
| **Build on what exists** | Import `inspectorChrome` as-is. Do **not** copy `HeatmapControlsColumn`. Do **not** parallel a second token set. |
| **Spec is the contract** | Layout and control *set* from HM §6.1. Hide/disable is **B2**, not Juliet. |
| **Evidence** | Suites, hashes, socket=1, side-by-side captures, focus/reduced-motion, `git diff --stat` allowlist. W0 inventory in the evidence pack (A3). |
| **Echo + Tango** | Charlie does not invent chrome or copy. If a control is not in §6.1 or a Coach tick, stop and ask. |

---

## What ships

`/app/iki/runner` looks and behaves like the Options Lab Heatmap **workspace**:

1. Compact **IKI** suite nav on top (Wiki · IKI Factory · Runner) — already `IkiSuiteNav`.
2. Left ~1/5 **inspector rail** (same tokens, 22.5rem, 44pt rows).
3. Right ~4/5 **view pane** (panel header + existing tile sink).
4. Stream status from the **chain document**, not from `useOptionChainBus` (taxonomy is a **proposal** for Echo + Tango — **A2**).

The **data path does not change**: `subscribe() → run() → TileGrid`. Templates `sym-fly@0.2` and `spread-tax@0.1` stay registered as they are.

---

## What does not ship

- Any edit under `web/components/options-lab/`
- `web/lib/market/**`, `server/**`
- `web/lib/runner/subscribe.ts`, `run.ts`, `registry.ts`, `host.ts`, `templates/**`
- `sinks/render.ts` and `web/lib/runner/__tests__/**` **unless B3 = Yes**
- New templates · ToS · Analyzer · Width Fit sliders · catalog / nav naming
- Inventing **Market closed** from an RTH clock

---

## W0 findings (not plan law where Coach must dispose)

| Topic | Status |
|-------|--------|
| Rail | **Re-implement** `IkiRunnerRail`. Import `inspectorChrome` only. |
| `HeatmapControlsColumn` | Do not import (OL catalog, ToS, Analyzer). Hide vs disable → **B2**. |
| Stream chip | **Proposal (A2)** for Echo + Tango: Connecting… / Stream error / Held / Live from no-meta / `onError` / `stale`. `epoch_quality` in readout. Market closed → **C1**. |
| Width Fit / ToS / Analyzer | Not on IKI. |
| `IkiSuiteChrome` | Add `workspace` fill (Heatmap `OptionsLabChrome workspace`). Allowlist includes `web/components/iki/IkiSuiteChrome.tsx`. Factory stays default (not workspace). |
| `useOptionsLab` | **Stand-in (A1).** Runtime import of Options Lab symbol state. Identity is the shared `/app/*` guard (DL-540). |

---

## Critical path

```text
W0 inventory (DONE, in evidence)
    → Coach stamps THIS plan (B1·B2·B3·C1 + GO W1)
        → W1 Charlie (workspace + rail [+ host selector iff B3=Yes])
            → W1b Kilo
                → W1c Echo ∥ W1d Tango
                    → W0s Lima spec-file resolve (before W2; may run earlier)
                        → W2 Lima (TR13 as-built + DL)
                            → IKI-P3-G Delta
```

Echo **or** Tango FAIL ⇒ Delta **FAIL**. Delta does not waive either.

---

## File allowlist (W1–W2)

**Always (IKI Lab):**

| File | Agent | Touch |
|------|--------|--------|
| `web/components/iki/IkiSuiteChrome.tsx` | Charlie | `workspace` prop. Default off. |
| `web/app/app/iki/runner/page.tsx` | Charlie | `workspace`; 1/5+4/5; rail + view |
| `web/app/app/iki/runner/IkiRunnerRail.tsx` | Charlie | **Create.** §6.1 rail |
| Runner Spec **live file** (Lima names it in W0s) | Lima | **TR13** as-built for IKI host chrome only |
| `Architecture/00-decision-log.md` | Lima | DL: IKI Runner chrome = HM §6.1/§6.2/HM14 by study; Echo + Tango standing |

**If B3 = Yes:**

| File | Agent | Touch |
|------|--------|--------|
| `web/lib/runner/sinks/render.ts` | Charlie | Strip ad-hoc selector. Keep session + `TileGrid`. Lift controls. View-panel frame. |
| `web/lib/runner/__tests__/iki-p3-chrome.test.ts` | Kilo / Charlie | Rail testids; selector bar gone; `run()` hashes unchanged |

**If B3 = No:**

| File | Agent | Touch |
|------|--------|--------|
| `web/app/app/iki/runner/page.tsx` (additional) | Charlie | Hide/cover host selector from the page/rail. **Do not edit** `render.ts`. |
| `web/app/app/iki/runner/iki-p3-chrome.test.ts` (or Playwright under evidence) | Kilo | Same criteria without touching `web/lib/runner/__tests__/` |

`git diff --stat` vs parent of the W1 commit **must** be only the allowlist that B3 selected (plus this board’s seeds/plan/evidence). **Nothing else.**

Import **without edit:** `web/components/options-lab/inspectorChrome.tsx`, `chainLadderApi` expiry/wings constants, `getMarketSocket`. `useOptionsLab` is a **member-session stand-in** (A1) — import, do not edit.

---

## Rail specification (Charlie — do not invent)

Sticky title **Runner** + stream chip. Chip **visual** grammar matches Heatmap (token fill, 6px dot, caption). **Which labels and when** is Echo + Tango after **C1** — not frozen in this table.

Sections, same order as Heatmap: Instrument · Template · Chain · Readout.

**Hide vs disable:** follow **B2**. Until ticked, **hide like Heatmap**.

| Section | Controls | Heatmap-like presence (if B2 = hide) |
|---------|----------|--------------------------------------|
| Instrument | Symbol | always |
| Template | Template: `sym-fly@0.2`, `spread-tax@0.1` | always |
| Template | Value mode | only if the active template declares modes (today: omit) |
| Template | Width | omit (no Runner width control today) |
| Template | Spread map side · min OI | only when `spread-tax@0.1` (Heatmap hides BW/Width Fit when not those templates) |
| Chain | Expiry | always |
| Chain | Side Calls / Puts | always |
| Chain | Wings | Heatmap does **not** put wings on the rail; include only if B2 = ratify-disable (then present, disabled) **or** Coach adds it as Heatmap-parity later. Default **omit** under hide-like-Heatmap. Host keeps `DEFAULT_STRIKE_WINGS` = 25. |
| Chain | Center spot | as Heatmap |
| Readout | Spot · DTE · gen · `epoch_quality` | display |

Right pane: Heatmap view-panel frame. **Body = existing `TileGrid`.** Do not restyle tile cells.

---

## Seeds

| Seed | Agent | Depends | Feeds |
|------|--------|---------|--------|
| [`seeds/IKI-P3-W1-charlie-workspace.md`](../agents/p-iki-lab/seeds/IKI-P3-W1-charlie-workspace.md) | Charlie | Coach stamp (B1–B3, C1, GO W1) | W1b |
| [`seeds/IKI-P3-W1-kilo-chrome-at.md`](../agents/p-iki-lab/seeds/IKI-P3-W1-kilo-chrome-at.md) | Kilo | W1 Charlie | Echo / Tango / Delta |
| [`seeds/IKI-P3-W1-echo-parity.md`](../agents/p-iki-lab/seeds/IKI-P3-W1-echo-parity.md) | Echo | W1 + captures | IKI-P3-G |
| [`seeds/IKI-P3-W1-tango-rail.md`](../agents/p-iki-lab/seeds/IKI-P3-W1-tango-rail.md) | Tango | W1 + copy/states | IKI-P3-G |
| [`seeds/IKI-P3-W0-lima-spec-file.md`](../agents/p-iki-lab/seeds/IKI-P3-W0-lima-spec-file.md) | Lima | Plan stamp | W2 (must complete **before** W2) |
| [`seeds/IKI-P3-W2-lima-tr13.md`](../agents/p-iki-lab/seeds/IKI-P3-W2-lima-tr13.md) | Lima | Echo + Tango not FAIL · W0s | IKI-P3-G |

---

## IKI-P3-G criteria (Delta)

1. `git diff --stat` only the allowlist selected by **B3**.  
2. W0 inventory **in evidence** matches what shipped (import vs re-implement).  
3. Side-by-side: Options Lab heatmap vs `/app/iki/runner`, same symbol, same fly template — Echo **PASS** on chrome parity (not tile math).  
4. Tango **PASS** on rail copy / status honesty / cognitive load.  
5. Reduced-motion + focus captures.  
6. Existing Runner suites green; through-`run()` hashes unchanged at default wings.  
7. Market WS count **1** on `/app/iki/runner`.  
8. Keyboard traversal of the rail; focus visible; hit targets ≥44pt measured.  
9. `npm run build` clean.  
10. Frozen trees unchanged (`web/components/options-lab/`, `web/lib/market/`, `server/`, Runner compute; `sinks/` if B3 = No).  
11. Lima: live Runner spec file named · TR13 + DL landed.  
12. C1 recorded (OD or three-OK), not silently dropped.

Verdict: PASS / FAIL / BLOCKED. Echo FAIL **or** Tango FAIL ⇒ Delta FAIL. No waive.

---

## Advisory (Coach may discard)

**A1** `useOptionsLab` is a member-session stand-in; IKI has no identity of its own (DL-540).  
**A2** Stream-chip label set is interaction design — Echo + Tango own it after C1.  
**A3** W0 inventory copied into `evidence/iki-p3/`.  
**A4** Stamp block retained.

---

## Coach stamp on this plan

Dispose **B1 · B2 · B3 · C1** first.

- [x] **GO W1** — this amended plan is the stamp  
- [ ] **Amend** (write the amendment; do not silent-edit)  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-08-22

Dispositions applied with GO W1: **B1** Echo+Tango · **B2** hide like Heatmap · **B3** Yes (host chrome) · **C1** three states + OD-IKI-P3-1.
