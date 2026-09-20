# India checklist — Options Lab Heatmap LIM (LIM0-1)

**Agent:** India  
**Date:** 2026-09-02  
**Seed:** [`seeds/LIM0-1-india-spec-law.md`](./seeds/LIM0-1-india-spec-law.md)  
**Status:** CHECKLIST · LIM0-1 complete. **Not GO. Not BUILD AUTHORITY.** No product code.  
**Token:** [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md) **unstamped** — India does not stamp it.

India blocks **invariant / law / system breakage** only. Opinions labeled **Opinion**.  
**L1–L17 are PROVISIONAL.** Labeling them as Coach rulings is a **FAIL** of this checklist.

---

## 0. Spec v0.4.2 exists

| Check | Result |
|-------|--------|
| File on disk | [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md`](../../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.2.md) |
| Status | **DRAFT for build planning.** Geometry unchanged from v0.4. |
| Header date | 2026-09-02 |
| Errata | **E1–E14** present (header bullets E8–E14; full index **Appendix C**) |
| LIM laws | LIM1–LIM39 present in body |
| Acceptance | **AT-LIM1…28** in Spec §10 (incl. AT-LIM17b, 24–28) |
| Body edit this packet | **None.** sha1 must stay `41dad04f06f7f2a43b80af4becb9153bf6f4f88a`. |

**C1 — LIM Spec §14 “v0.2.1”:** that sentence is a **changelog line at LIM6**, not a body edit now. India does not touch the Spec. See §4 notes.

**Prior version kept:** `…Specification v0.4.1.md` SUPERSEDED as working law (plan: sha1 `e5aa6fdc7305add72e02dc57b62f87665d348820`).

---

## 1. E1–E14 (index — Spec Appendix C)

| # | Introduced | Change (Spec words, condensed) |
|---|------------|--------------------------------|
| **E1** | v0.4.1 | `leanRaw` before clamp; `xUnclamped = leanRaw` (LIM7). |
| **E2** | v0.4.1 | `confidence` → `crossingProximity`. Config keys `LABS_LIM_XPROX_*`. |
| **E3** | v0.4.1 | Opacity is not the shelf-life channel. Full-opacity dot; ring + chip (LIM24). |
| **E4** | v0.4.1 | Y field `friction` → `nearSpotMix`. *Friction / muddy / slippery* off axis until §15.3. |
| **E5** | v0.4.1 | §1 restated in the book’s terms; publish factors, not a second metaphor. |
| **E6** | v0.4.1 | OI as-of + same-day-expiry sentence on chrome (Appendix B). |
| **E7** | v0.4.1 | Picker label carries neither *intent* nor *friction* (LIM35). |
| **E8** | v0.4.2 | `yUnclamped` **removed**; Y clamp removed. Bound is AT-LIM26; weights sum AT-LIM17b (LIM38). |
| **E9** | v0.4.2 | Y floors ship **0 / 100** so labelled axis = achievable axis (LIM39, D17, OD-LIM8). |
| **E10** | v0.4.2 | Canonical keys = Appendix A only. `LIM_CONF_*` retired (AT-LIM28). |
| **E11** | v0.4.2 | Compact **keeps the proximity ring**; drops the chip, not the channel (LIM31). |
| **E12** | v0.4.2 | `AGENTS.md:26` IKI-only gate applies. Three successive OKs on the GO token before first heatmap edit. |
| **E13** | v0.4.2 | Trail buffer clears on session open, expiration change, **and** symbol change (LIM21, AT-LIM25). |
| **E14** | v0.4.2 | Registry ships **`lim` only**; no reserved switcher / `session-volume` enum (LIM37, AT-LIM27). |

Geometry unchanged across E1–E14.

---

## 2. Sha1 procedure (LIM0-0 · hash **not** in the Spec)

**Do not write the digest into the LIM Spec.** JR7 / seed: hash lives in the **DL** (and on the GO token), not in the Spec body.

At **LIM0-0** (Lima records; Delta verifies):

```bash
shasum -a 1 "Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md"
```

| | |
|--|--|
| **Expected** (plan v1.1, whole-file at plan land) | `41dad04f06f7f2a43b80af4becb9153bf6f4f88a` |
| **Record** | `Architecture/00-decision-log.md` same-day DL · `agents/go/OLLIM-W0.md` “Spec sha1 (whole file, at stamp)” |
| **If mismatch** | **Do not** edit the Spec to match. Stop. Coach: either the file drifted (restore) or the plan hash was wrong (new DL). |

India LIM0-1 names the procedure. Recompute is **LIM0-0 / LIM0-G**, not this packet.

---

## 3. Plan DAG vs Spec §10 (AT-LIM1…28)

Plan **v1.1** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md) §9 and board [`characterization-list.md`](./characterization-list.md) cover **AT-LIM1…28** including **AT-LIM17b**.

| Band | Plan owner phase |
|------|------------------|
| AT-LIM1–13, 16, 17, 17b, 19, 20, 26, 28 | LIM1 |
| AT-LIM13 (trail past edge), 14, 15, 25 | LIM2 |
| AT-LIM10, 18, 21–24, 27 | LIM3 |
| AT-LIM1…28 pack | LIM5-G |

No AT from Spec §10 is missing from the DAG. **L1–L17 still PROVISIONAL** (plan §0.1).

---

## 4. India notes beside Coach text (LIM Spec **not** edited)

| Location | Coach text | India note |
|----------|------------|------------|
| Header “Labs law” | cites `Options-Lab-Heatmap-Templates-Spec-v0_3` | **OD-LIM9 settled below:** live parent is **v0_2.md**, not v0.3. Header citation is unsettled law; do not treat v0.3 as BUILD parent. |
| §14 | “`Options-Lab-Heatmap-Templates-Spec-v0_2_1` also exists in `Specs/`” | **False on disk.** There is **no** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2_1.md`. **C1:** changelog at LIM6; **no body edit now** (sha1). |
| §15.6 / OD-LIM9 | “v0.2.1 or v0.3” | Named by **canonical filename** in §5. Content rev of the live file is **v0.2.3**, not a separate v0.2.1 file. |
| §3 `ValueModeId` | “gains exactly one string” (`lim`) | In force for this program (E14). As-built `types.ts` has no `session-volume` today; this packet must not add one. |

These notes sit **beside** Coach text. They do not rewrite the Spec.

---

## 5. OD-LIM9 — live parent (canonical filename)

**Live parent:**

`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`

**Why (one paragraph).** There is no file `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2_1.md`. LIM Spec §14’s claim that a v0.2.1 path exists in `Specs/` is a document-control error (C1: leave the body; LIM6 changelog). The live Heatmap Templates product law is the **v0.2 filename** whose header **Current revision is v0.2.3** (HM1–HM20 · **HM21 inspector tab-session** · Verticals two-tier **DL-579** · Instant Replay pointer **DL-594**). Architecture 29 names that same path as product law. `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md` is a **DRAFT amendment, not build authority**; it supersedes v0.2 **only** in the clauses named in its §2 (SVP auxiliary read plane) and it **catalogues `session-volume`**. LIM is a **client-only** template over the dual-side chain (gamma, open interest, spot; **no fetch, no volume, no auxiliary plane**). `TemplateLayout` and the catalog therefore amend **v0_2.md**. Treating v0.3 as the live parent would silently fork the registry onto an unstamped SVP amendment and would pull `session-volume` into the catalog — forbidden by **E14 / LIM37** for this packet.

| Candidate | Canonical filename | Role |
|-----------|--------------------|------|
| **Live parent** | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` | Header: current rev **v0.2.3**. Product law. |
| Amendment (not live) | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_3.md` | DRAFT. Not BUILD AUTHORITY. SVP seam only. |
| **Does not exist** | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2_1.md` | No file. v0.2.1 is a **content** row inside v0_2.md’s §14 (HM21 inspector, 2026-08-24). |

Merged amendment DRAFT (OD-LIM6) is opened **against this parent:**  
[`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md)

That DRAFT is **not** a second live parent and is **not** BUILD AUTHORITY.

---

## 6. OD-LIM1…9 — ready for Coach stamp (not filled as Accept)

Coach disposes on [`OLLIM-W0.md`](../go/OLLIM-W0.md) at **LIM0-0**. This table is the stamp surface. **Empty Coach column.**

| # | Question | Spec / Juliet rec (India restates; not a ruling) | Coach |
|---|---------|--------------------------------------------------|-------|
| **OD-LIM1** | Approve v0.4.2 into BUILD AUTHORITY | Approve. File already under `Specs/`. Stamp on W0. Conditional on this OD-LIM6 DRAFT existing **and** OD-LIM9 named (both now true). | _pending_ |
| **OD-LIM2** | Display name | Placeholder **`GEX lean (window)`**. Echo owns the member label. *Liquidity-Intent* does not survive. Neither *intent* nor *friction* in the picker (LIM35). | _pending_ |
| **OD-LIM3** | Axis vocabulary | **Hold** *friction / muddy / slippery* off the axis. Payload field stays `nearSpotMix`. Tape sitting is a later program. | _pending_ |
| **OD-LIM4** | `LIM_CENTRE_SCALE_PTS` per symbol | Hotel proposes at LIM0-2. Juliet silent default: `{"I:SPX": 50}` only; every other symbol `valid: false`. No silent 50. | _pending_ |
| **OD-LIM5** | LIM vs IKI GEX toolset | **Run beside.** Heatmap LIM is an Options Lab template. IKI GEX is a different door. Same `Γ·OI·S²`. LIM does not supersede IKI. | _pending_ |
| **OD-LIM6** | Merged Heatmap Templates amendment | One DRAFT, one later parent bump (LIM6): keep SVP **prose**; add `TemplateLayout: "quadrant"`; catalog **`lim` only**. **No** `session-volume` `ValueModeId` (E14). Path named in §5. | _pending_ |
| **OD-LIM7** | Quadrant cell names | **Not in v1** (LIM36). Echo · Hotel after §15.3, or never. | _pending_ |
| **OD-LIM8** | Y floors | **v1 ships 0/100 (E9).** Later tape sitting may reinstate a floor **as config**, versioned per Spec §16 — never a new compute packet. | _pending_ |
| **OD-LIM9** | Live Heatmap Templates parent | **India names:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` (current rev **v0.2.3**). There is no v0.2.1 file. v0_3.md is an unstamped SVP amendment, not the live parent. | _pending_ |

JR1–8 remain on the token. India does not dispose them.

---

## 7. L1–L17 — PROVISIONAL (not Coach rulings)

**FAIL this checklist if any row below is labeled Accept / stamped / Coach law.** Lock is **LIM0-0**.

| ID | Decision | Source | State |
|----|----------|--------|--------|
| **L1** | New Heatmap template `id: "lim"`, `layout: "quadrant"`. **Not** a value mode on `gex`. Frozen `gex` stays. | Spec §3 · §13 | **PROVISIONAL** |
| **L2** | X = lean only (`leanRaw` then clamp). Y = `nearSpotMix` blend. Publish `netRatio`, `concF`, `magF` first-class (LIM10). | LIM7–11 · E1 · E4 | **PROVISIONAL** |
| **L3** | Crossings are **intervals** `{lo, hi, …}`. No `(lo+hi)/2` in any field or chrome (D16 · AT-LIM20). | LIM12–15 | **PROVISIONAL** |
| **L4** | `crossingProximity` is a **distance channel**. It never moves the dot. Ring + chip, **never opacity** (E2 · E3). Compact **keeps the ring** (E11). | LIM16–18 · LIM24 · LIM31 | **PROVISIONAL** |
| **L5** | Colour is identity: one blue + edge glow. Not valence. Not red/green. | LIM25 · D13 | **PROVISIONAL** |
| **L6** | Empty / never-hydrated / `Σ\|net\|==0` → **centre** `x=0, y=50`, full opacity. | LIM7–8 · LIM26 | **PROVISIONAL** |
| **L7** | Config fail-loud. Missing key aborts. Symbol absent from `LIM_CENTRE_SCALE_PTS` → `valid: false`. **No fallback scale.** Keys = Appendix A only. | LIM34 · §9 · AT-LIM17/19/28 | **PROVISIONAL** |
| **L8** | LIM reads **no volume**. Inputs are `gamma`, `open_interest`, `spot` via existing `gex_v1`. No MSC import. No server module. | LIM6 · §2 · §13 | **PROVISIONAL** |
| **L9** | Window read. Chrome says so. Never labelled chain GEX (GP7 · LIM5 · LIM27). | LIM5 · LIM27 | **PROVISIONAL** |
| **L10** | Forbidden member-facing strings (AT-LIM23). Picker label carries neither *intent* nor *friction* (LIM35). Quadrant ships **no cell names** (LIM36). | E4 · E7 · LIM35–36 | **PROVISIONAL** |
| **L11** | Parent amendment is **one merged draft** (SVP auxiliary-plane **prose** + `quadrant` + `lim`). One PR. **No** `session-volume` enum (E14). | Spec §14 · §15.6 · LIM37 | **PROVISIONAL** |
| **L12** | Strike Turnover is a sibling. Never fused, never blended, never a composite score. | Spec §0 · TN15 | **PROVISIONAL** |
| **L13** | **No `yUnclamped`.** Trail and transition use `xUnclamped` for X and **`y`** for Y (LIM33 · LIM38 · E8). | E8 · AT-LIM26 | **PROVISIONAL** |
| **L14** | Y floors ship **0 / 100** (LIM39 · D17). **OD-LIM8** is whether a later tape sitting reinstates a floor **as config**. | E9 | **PROVISIONAL** |
| **L15** | Trail buffer clears on session open **and** expiration change **and** symbol change (LIM21 · E13). | E13 · AT-LIM25 | **PROVISIONAL** |
| **L16** | Compact: dot + **proximity ring** + expiration + wing count + chrome lines 1 and 3. No chip, no trail, no annotations. | E11 · LIM31 · AT-LIM24 | **PROVISIONAL** |
| **L17** | `ValueModeId` gains **exactly one** string: `"lim"`. | LIM37 · E14 · AT-LIM27 | **PROVISIONAL** |

---

## 8. HM1–HM20 apply to LIM (client template; no fetch)

Parent: live file in §5. LIM is a **pure client template** (HM6). It does not fetch, poll, or open a second Massive path. Dual-side **HM15–HM20** stay in force.

| ID | Parent law | LIM |
|----|------------|-----|
| **HM1** | One dual-side chain model for `(symbol, expiration, wings)` | LIM reads that model via `buildGexProfile(ctx, "gex_net")`. No per-template Massive. LIM **does not** declare an auxiliary plane. |
| **HM2** | Diff once, paint many | Template / side / value-mode switch = **zero** extra snapshot traffic (AT-LIM smoke 10). |
| **HM3** | Push, not UI poll | Host law. LIM compute is not a poller. |
| **HM4** | Hydrate-if-empty | Host. LIM empty-map is **centre** (LIM26), not a second hydrate. |
| **HM5** | Session hold | Host. Trail **clears** on session open (E13) — that is LIM buffer law, not a second chain SoR. |
| **HM6** | Pure template compute | `computeLim(ctx) → LimResult`. Inputs = context + Appendix A config. **No fetch in LIM.** |
| **HM7** | Fail loud cells | Missing scale → `valid: false` (LIM34). Null γ/OI → existing GEX invalid path, never silent zero. Empty book is **named centre**, not a fake pole. |
| **HM8** | Exact listed strikes; no snap | LIM walks listed nets; crossings are **intervals**, never `(lo+hi)/2` (D16). |
| **HM9** | Universe SoR | Host. Symbol off `LIM_CENTRE_SCALE_PTS` → invalid LIM, not a proxy scale. |
| **HM10** | No MSC code | NX1. Look may match Coach reference; code provenance is Labs. |
| **HM11** | Near real time | Recompute on each applied generation while live. |
| **HM12** | GEX honesty | Chrome line 1 **verbatim** Appendix B: `Chain GEX (estimate). …` Frozen `gex` template stays. |
| **HM13** | Access | Session + tool-member read. No new endpoint. |
| **HM14** | HIG chrome | Echo. ≥44 pt; identity colour not valence; reduced-motion for trail. |
| **HM15** | Always both sides | `gex_net` requires both books (AT-HM13). LIM does not pull `contract_type`. |
| **HM16** | Side is view filter only | LIM uses **net** of both books. Calls/Puts switcher must not re-fetch. |
| **HM17** | Strike window ≤ 250 on **live** path | Host. LIM is a **window** read of that band (LIM5). Does not relax the clamp. |
| **HM18** | `next_url` hard error on live path | Host. LIM never paginates. |
| **HM19** | Standard contracts only | Consume `ctx`; do not invent adjusted rows. |
| **HM20** | Modal strike step | Crossing `steepness` uses `strikeStep` from context. |

**HM21 (inspector tab-session)** is **parent workspace law** (v0.2.3 · DL-575 / DL-594): `sessionStorage` `ft_labs_heatmap_session`. LIM does not invent a second session SoR. `templateId` / `valueMode` persist like any other template.

**Not live parent law:** v0.3’s reuse of the id **HM21** for an auxiliary read plane. See §9 and the merge DRAFT.

---

## 9. Law-ID collision (flag · not a silent re-number)

v0.2.3 **HM21** = inspector tab-session.  
v0.3 §2.4 **HM21** = server-owned auxiliary read plane (SVP).

That is an ID collision. **This packet does not create a new HM number** (doctrine §14: transcribe, do not invent). The merge DRAFT keeps inspector as **HM21** and carries v0.3 §2.4 clauses **a–g as unnumbered text law**, not as a switcher entry, not as `ValueModeId: "session-volume"`.

**Opinion:** at LIM6 land, Juliet/Coach assign a **free** id to the auxiliary-plane clauses if SVP is still in the merged parent. India will not mint HM24 here.

---

## 10. Opinion (labeled)

1. Land the parent bump at LIM6 as a **content revision on `…-v0_2.md`** (e.g. v0.2.4) rather than promoting unstamped v0.3. v0.3’s job was SVP; LIM is a client layout + one catalog id. Alternative is a new v0.4 that merges both — Coach disposes with OD-LIM6; India does not pick.
2. Do not make `profile` **required** in this LIM packet (v0.3 §2.7). That clause exists because `session-volume` uses `profile`. LIM uses `quadrant`. Leave v0.2 “profile optional” until SVP ships.
3. Do not carry v0.3 §2.5 (`day_volume`) or §2.9 (`session-volume` catalog row) into LIM’s registry. Coverage (v0.3 HM23) binds auxiliary-plane templates; LIM has no plane.

---

## 11. Block if (later packets · invariant / law / system)

India **does not block LIM0-1**. Would block subsequent work if:

- LIM Spec **body** is edited (sha1 leaves `41dad04f06f7f2a43b80af4becb9153bf6f4f88a`) except a LIM6 changelog Coach ordered.
- This merge **DRAFT** is treated as the live parent or as BUILD AUTHORITY.
- `ValueModeId` or the switcher gains `session-volume` (or any unbuilt mode) — **E14**.
- v0.3 is used as the live parent (registry fork + SVP catalog).
- Auxiliary-plane law is filed **as HM21** (overwrites inspector).
- L1–L17 are labeled Coach rulings before LIM0-0.
- Product code under `web/` or `server/` is touched before `OLLIM-W0.md` is GO **and** E12 / JR8 (three successive OKs or active-program reassignment).
- LIM compute fetches, reads volume, ports `gamma × OI × 100`, or invents a crossing midpoint.
- Frozen `gex` / Advanced Fly / Width Fit are reopened or mutated for LIM.

**E12** is Spec law, not optional: IKI-only / three OKs on the token. India does not waive it.

---

## 12. LIM0-1 done

| Deliverable | Path |
|-------------|------|
| This checklist | `agents/p-options-lab-heatmap-lim/india-checklist.md` |
| Merged Templates DRAFT (OD-LIM6) | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-LIM-merge-DRAFT.md` |
| Live parent (OD-LIM9) | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` |

OD table complete. Hash procedure named. L\* not labeled as stamped. LIM Spec body untouched. `OLLIM-W0.md` not stamped. `web/` and `server/` not touched.

**Verdict:** CHECKLIST ready for **LIM0-G**. Architecture may proceed to Coach LIM0-0. **Not GO.**
