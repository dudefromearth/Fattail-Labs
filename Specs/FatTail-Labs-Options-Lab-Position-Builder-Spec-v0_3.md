# FatTail Labs — Options Lab Position Builder & Position Book Spec v0.3

**Status:** **DRAFT · residual fold (Analyzer advisor)** (2026-08-11)  
**Type:** Product Spec — structure construction, position book, card↔viewport law, package lock, **use-case coherence**  
**Short name:** **Position Builder / Book** · **PB**  
**Filename:** `FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md`  
**Supersedes:** [`FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md`](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md) (v0.2 retained historical; implement against **v0.3**)
**Parents still:** v0.1 historical only  
**Surface:** Options Lab **Analyzer** (`/app/options-lab/analyzer`)  

**Process:** Spec accepted (Coach) → OD Accept/Override at W0 → **implementation plan** (bench) → code/ATs.  
**Bench plan:** [`docs/Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-options-lab-position-builder/` · **DL-297**.  
**No implementation seed fire** until Coach **W0-0 GO**.

**Content integrity:** Landing content hash (sha1 of body excluding this line): `88e96ed8d2ecae3de64abe32d58fb320bdd70c20`.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Options Pricing Foundation Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Package marks · natural debit · lock · freeze · resolve · packs · epoch skew · interest budget · RECON · archive stale |
| [Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (content **v1.0.1**) | Dual-side ladder · interest · stream posture |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC5a · OC6a · **OC13** |
| [Heatmap Templates Spec v0_2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | Dual-side · Live/Held/Closed posture heritage · ToS path |
| [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dialog · cards · fail-loud |
| Claude.md / FatTail ethos | No profit claims · fail loud · no MSC |
| [**OPF Truth & Elegant Failure Doctrine v1.0**](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) | **Capital-risk:** OPF-held chain sole instrument truth · representable or named state · atomic resolve · **DL-309** |

**DL:** DL-294 (partial as-built) · DL-295 (v0.1 filed) · **DL-296** (this v0.2 fold) · **DL-309** (OPF truth · elegant failure).  
**Review folded:** External advisor Claude 2026-08-11 (B1–B6, A1–A9) + Coach Addendum 1 (use-case-scoped coherence).

**Reference UX (non-authority):** MSC Risk Graph — workflow only. **MSC is not the standard.**

### 0.0 Capital-risk laws (summary — full text in OT-EF doctrine)

1. **OPF is the only truth** for create/edit/prefill: listed dual-side chain OPF holds. No invented strike book. Open vs closed = live vs held marks, not a second universe.  
2. **Representable or not:** every leg on that plane, or the structure is not package-priceable.  
3. **Elegant failure:** package field shows a **named truthful state** (EXPIRED · NOT TRADED · …) rather than blank, stale, or synthetic debit/credit.  
4. **Atomic resolve** on pointer change — settle once; no flash loops.  

Severity **high** if we invent instruments or silent false package prices.

---

## 0. Mission

On Options Lab Analyzer, members must be able to:

1. **Build** multi-leg structures with **live** market-linked package pricing (Position Builder).  
2. **Hold** structures as **position cards** in a **Position list** (book).  
3. Treat each **card as the definition** of the structure (legs, basis mode, lock state).  
4. Treat the Analyzer **viewport** as the **visualization** of the **focused** definition via **OPF only** — never a second private pricing path.  
5. **Lock / unlock** package cost basis (and optional freeze flags) per OPF §5.7.  
6. Operate the **same surface** in three modes: **day_trade** (default, real-time), **outlook**, **backtest/forward-walk** — each with its own coherence guarantee.  
7. Optionally set **threshold price alerts**.

**Coach litmus (normative intent):**  
*When looking at a position in the builder or the position card, if it is unlocked, the correct pricing is being displayed and the rendered position in the viewport is correct — **as guaranteed for the active use case and session state** (§6.5).*

**What this is not:** brokerage OMS; multi-account blotter; MSC pipeline; client Heston/MC as SoR; false RECON after the close.

---

## 0.1 Cardinal relationship (non-negotiable)

```text
┌─────────────────────────────────────────────────────────────────┐
│  POSITION CARD  =  DEFINITION (SoR for structure + lock)          │
└────────────────────────────┬────────────────────────────────────┘
                             │ focus + visible
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  VIEWPORT SESSION MODE  =  day_trade | outlook | backtest        │
│  (mode is session property — not duplicated per card)            │
└────────────────────────────┬────────────────────────────────────┘
                             │ OPF resolve(definition, market/archive, pack)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  VIEWPORT  =  VISUALIZATION only (curves + marks + labels)       │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ dual-side generations / archive / static facts
┌────────────────────────────┴────────────────────────────────────┐
│  MARKET / ARCHIVE PLANE  (OPF L0–L1 + cold archive)              │
└─────────────────────────────────────────────────────────────────┘
```

| Role | Object | Law |
|------|--------|-----|
| **Definition** | Position card | Structure + basis/lock; not rewritten by what-if or mode switch (PB-MODE-2) |
| **Visualization** | Risk graph viewport | OPF output for the **shown book** (additive) under active mode |
| **Market / archive** | Generations or cold shards | Live, held, or replay — labeled |

**PB-VIEW-1:** Structure edits only via Builder or card controls — not by drawing on the viewport.  
**PB-VIEW-2:** Changing OPF pack / mode re-visualizes the **same** definition; does not create a new card.  
**PB-VIEW-3:** What-if does not rewrite the card unless member explicitly saves an edit.  
**PB-VIEW-4 (SUPERSEDED 2026-08-16 · DL-394):** v0.1/v0.2 said exactly one focused definition (no multi-card aggregate).  
**PB-VIEW-4a (Coach 2026-08-16):** Viewport visualizes **every shown card** as **one additive continuous** OPF book curve. Show/Hide is a **checkbox**, independent per card. Highlight (focus) does not un-show siblings.
**PB-VIEW-5 (B2):** While Analyzer is open and stream is healthy (**day_trade live**), the focused definition **re-resolves on each applied generation update** for any of its legs’ keys (throttled to generation cadence; **client-triggered on diff apply — never an independent `setInterval` HTTP poll loop**). Viewport renders the resolve’s `as_of`; a curve older than the newest applied generation for its keys is **labeled stale**.

**PB-VIEW-7 (outlook epoch re-anchor — OD-PB16 **Accepted** · Analyzer as-built ratifies):** PB-VIEW-5 applies to **day_trade live** only. In **outlook** mode, scenario curves **do not** auto-re-anchor on every generation by default. **Law (normative):** (1) selecting outlook **pins** the scenario epoch; (2) member must **explicitly re-anchor** (button) to pick up newer generations; (3) when generations advance while pinned, show **epoch stale**; (4) scenario curves keep their epoch label. Silent auto-re-anchor is forbidden.

---

## 0.2 One surface, three modes (Coach ruling — Addendum 1)

| ID | Law |
|----|-----|
| **PB-MODE-0** | Analyzer is **one surface**. Primary identity: **day-trader tool, real-time open market** (`day_trade` default on entry). Outlook and backtest/forward-walk are **modes of the same surface**, not sibling apps. Same cards, same definitions, same chrome. Mode selects pack family (`day_trade` · `outlook` · `backtest`) and the **coherence column** in §6.5. No mode may silently borrow another mode’s model or guarantee. New mode ⇒ pack-registry entry + matrix row. |
| **PB-MODE-1** | Viewport always displays **active use case** and its authoritative time reference (live `as_of` · Held · scenario base epoch · replay `as_of`). |
| **PB-MODE-2** | Switching mode does **not** silently re-bind the card package display; card remains market-plane live/held per §1.3 unless mode **visibly** re-binds (e.g. labeled replay step — OD-PB15). |
| **PB-MODE-3** | Any surface (card, tooltip, curve, alert) that renders a price while the session is **closed/held** carries the **Held** label. No “live” claim off-session. |

**One-line law:**  
**live = correct; held = coherent and labeled; scenario = labeled model; replay = reproducible and gap-honest.**  
Anything displayed outside its column is a violation.

---

## 0.3 Scope honesty

| In scope | Out of scope (v0.2 product law) |
|----------|----------------------------------|
| Builder + list + cards + lock/unlock | Broker OMS |
| Single package-pricing SoR (OD-PB12) | Multi-card stacked curves |
| Live re-resolve (PB-VIEW-5) | Independent poll spam |
| Epoch skew display (PB18a) | Full Alert Center SSE |
| Use-case coherence matrix §6.5 | Server multi-device book (unless OD-PB1 Override) |
| Interest ownership (PB17b) | Projected non-archive “forward” without pack registry |

**As-built gap:** Partial land (DL-294). v0.2 laws may exceed code — §11 gap map. Implementation plan **after** OD Accept/Override.

---

## 0.4 Design invariant (pricing SoR)

```text
Dual-side generation(s)  ──►  OPF PackageQuote / resolve
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            Card package display          Viewport marks/curves
            (same D_nat / D_basis          (same resolve payload
             same content_hash)             same content_hash)
```

**No second client-side package math as SoR** (B1). See **PB17** / **OD-PB12**.

---

## 1. Global laws

### 1.1 Builder & market (PB1–PB8)

| ID | Law |
|----|-----|
| **PB1** | No Massive from client. Generations only or fail loud. |
| **PB2** | Dual-side books for front (and back) expiration. |
| **PB3** | \(D_{\mathrm{nat}} = \sum_i q_i m_i\) per share; \(q>0\) long. DEBIT if \(D_{\mathrm{nat}}\ge 0\), CREDIT if \(D_{\mathrm{nat}}<0\); UI shows magnitude. |
| **PB4** | Incomplete mids → package unavailable (“—”); never invent mid labeled live. |
| **PB5** | Limit magnitude → locked basis via OPF when locked. |
| **PB6** | Listed strikes when chain present (OC6a). |
| **PB7** | Labs-owned templates — no MSC imports. |
| **PB8** | MSC is not the standard. |

### 1.2 Book, cards, viewport (PB9–PB16)

| ID | Law |
|----|-----|
| **PB9** | **Card = definition.** Legs, packages, direction, lock state. |
| **PB10** | **Viewport = visualization** of the **shown book** via OPF only (DL-394). *(Was: focused definition only.)* |
| **PB11** | Analyze/Update: upsert card, highlight, close Builder, resolve. New card defaults **shown**. |
| **PB12** | Visualization priority: (1) all **shown** drawable cards as one additive book; (2) empty CTA. |
| **PB13** | Hide: remains in list; that card must not drive viewport. Siblings stay. |
| **PB14** | Highlight (focus) card does **not** rebind the viewport away from other shown cards. |
| **PB15** | Remove a card → drop it from the book; highlight fallback independent. |
| **PB16** | Book scope v0.2 default: session (OD-PB1). Lock evaporation risk noted OD-PB1 / A4. |

### 1.3 Live package on cards — **single pricing SoR** (B1, B3, B6)

| ID | Law |
|----|-----|
| **PB17** | Card-displayed **live** package (**unlocked**, complete, day_trade live session) is **OPF-served**: it consumes `PackageQuote` / resolve fields for that definition’s generation keys — **not** an independent client \(\sum q_i m_i\) as SoR (**OD-PB12 option a**, recommended default). |
| **PB17a** | If implementation retains a client sum for non-focused cards only, **parity is mandatory:** card-displayed live package **must equal** OPF `PackageQuote` natural debit for the same generation `content_hash`(es), exactly. Any OPF exclusion/gating (skew, adjusted contracts, completeness) applies **identically** to card display. Violating parity is a **blocking defect**. |
| **PB17b** | **Interest:** Analyzer holds generation interest for (1) **focused** definition keys and (2) every **visible** card’s keys. **Hidden** cards drop interest — package shows last value with **“not live”** label (or “—”), never a stale number styled as live. At OPF interest cap: priority **focused first**, then visible by **recency**; refused keys → loud **“not live (budget)”**, never silent stale-as-live. |
| **PB18** | Incomplete legs → “—” / incomplete loud (not silent zero live). |
| **PB18a** | **Multi-exp:** card and Builder package carry OPF epoch semantics. When `max_skew_ms > LABS_OPF_MAX_SKEW_MS`, display per `LABS_OPF_SKEW_MODE` (fail loud “—” or degrade with **labeled skew badge**). **Never** an unlabeled combined number across skewed generations. |
| **PB19** | Spot/IV for OPF from Labs market plane only. |
| **PB20** | Live refresh **must not** change locked basis \(D^*\). Optional secondary **mkt** mid when locked (OD-PB10), labeled. |
| **PB20a** | Live package UI surfaces generation **`as_of`** (tooltip or meta) when available (A3). |

### 1.4 Lock / unlock (PB-LOCK · OPF §5.7)

| ID | Law |
|----|-----|
| **PB-LOCK-1** | Modes: `unlocked` \| `locked`. Default create: **unlocked**. |
| **PB-LOCK-2** | Unlock: \(D_{\mathrm{basis}}=D_{\mathrm{nat}}\) when complete; else basis undefined / incomplete loud. |
| **PB-LOCK-3** | Lock natural: complete only; \(D^*=D_{\mathrm{nat}}\); `lock_source=natural_mid`. Default `freeze_iv=false`, `freeze_marks=false` (OD-PB9). |
| **PB-LOCK-4** | Lock limit: always; \(D^*=\) limit; `user_limit` \| `tos_limit`. |
| **PB-LOCK-5** | Edit limit while locked: updates \(D^*\) only. |
| **PB-LOCK-6** | Unlock: clears \(D^*\) and freeze snapshots. **Audit retain of snapshots after unlock: no for v0.1/v0.2 session book (OD-PB11).** |
| **PB-LOCK-7** | Card UI distinct LOCKED state; basis vs optional mkt. |
| **PB-LOCK-8** | Focused locked definition → OPF resolve **must** receive lock state. |
| **PB-LOCK-9** | Lock ≠ broker order. |
| **PB-LOCK-10** | Lock natural incomplete → refuse loud. |

### 1.5 Builder mechanics

| ID | Law |
|----|-----|
| **PB21** | Builder reprice on chain refresh while open (display from OPF package path or parity-bound sum — same SoR as PB17). |
| **PB22** | Time spreads: short = front, long = back. Back default = **next listed** expiration after front only. If none listed → loud **“no back expiration listed”**; member picks manually. **No synthetic +1 calendar day** that can invent unlisted holidays (A5). |
| **PB23** | Buy/Sell flips sides. |
| **PB24** | Packages \(N\ge 1\). |
| **PB25** | ToS script convenience only. |
| **PB26** | Handoff → OPF StrategyIntent without MSC types. |

### 1.6 Stream posture & incomplete viewport

| ID | Law |
|----|-----|
| **PB-STREAM-1** | Analyzer chrome shows session posture: **Live · Held · Closed · Error** (Heatmap heritage). |
| **PB-STREAM-2** | Per-card: when not receiving applied generations for its keys, show **not live** / **Held** as appropriate — never bare number as live. |
| **PB-VIEW-6** | Focused **incomplete** / non-representable definition: viewport keeps **scales + grid**, draws **no fabricated live package curve**, and may center a **Law B named notice** (EXPIRED · UPDATING · NOT TRADED · …) with calm detail — **never** internal codes or engineer jargon (OT-EF). |

### 1.7 Alerts

| ID | Law |
|----|-----|
| **PB-AL-1** | Types: price above / below / touch. |
| **PB-AL-2** | Chart create + list cards + lines. |
| **PB-AL-3** | Evaluate underlier spot. |
| **PB-AL-4** | Optional `positionId` scope only — not definition. |
| **PB-AL-5** | Alert price readouts while closed carry **Held** (PB-MODE-3). |

### 1.8 Ethos

| ID | Law |
|----|-----|
| **PB27** | No profit-claim chrome. |
| **PB28** | Fail loud: missing symbol, chain error, empty legs. |

---

## 2. Surface map

| Element | Role |
|---------|------|
| Position Builder | Mutates definition (draft until Analyze/Update) |
| Position list | Container of definition cards |
| Position card | **Definition SoR** |
| Focus / Hide / Lock | Definition selection & basis |
| Mode banner | Active use case + time reference (PB-MODE-1) |
| Stream posture | Live / Held / Closed / Error |
| OPF pack control | Visualization pack within mode family |
| Risk graph viewport | **Visualization** |
| What-if | Scenario inputs (do not rewrite card) |
| Alerts | Threshold rules |
| ToS paste | Alternate unlocked-live entry when no focus |

---

## 3. Domain model

### 3.1 Leg fields

| Field | Notes |
|-------|--------|
| strike, type, qty, side, expiration? | Structure |
| `live_mid` (or equivalent) | Hydration hint from chain — **never** render labeled “entry fill.” Prefer not naming live mid `entry_price` (A6). If legacy name remains, law: never display as live package without OPF/parity path. |
| `volatility?` | Chain IV when present |

### 3.2 PositionInput

underlying, expiration (front), contracts, legs, direction, optional limit magnitude for lock-limit.

### 3.3 AnalyzerPosition (card)

| Field | Notes |
|-------|--------|
| id, label, notation, position | Definition |
| status | ANALYSIS default |
| visible | Hide from viewport drive |
| livePackagePerShare | **Magnitude** for display; **invariant:** when `lastNatSigned` set, `livePackagePerShare ≡ |lastNatSigned|` (B5 fold) |
| lastNatSigned | Signed OPF natural D_nat (or locked basis source for compare) |
| priceSide | debit \| credit \| **null** when incomplete (A9) |
| lock | LockState |
| displayAsOf? | Generation as_of for live package (A3) |
| liveState | **live \| held \| not_live \| budget_refused \| incomplete \| skewed** (six-state; Analyzer/PB fold) |
| status | **ANALYSIS** for v0.2 book (OD-PB6); full OMS enum reserved until OD opens lifecycle |
| createdAt / updatedAt | |

### 3.4 LockState — **D\* signed (B4)**

```text
{ "mode": "unlocked" }

{
  "mode": "locked",
  "locked_at": ISO-8601,
  "package_debit_per_share": number,  // SIGNED per-share, identical convention to PB3 D_nat
  "lock_source": "natural_mid" | "user_limit" | "tos_limit",
  "generation_hashes_at_lock"?: { "YYYY-MM-DD": "hash" },
  "freeze_iv": boolean,               // default false
  "leg_iv_snapshot"?: { [leg_id]: number },
  "freeze_marks": boolean,            // default false
  "leg_mark_snapshot"?: LegMark[]
}
```

**Law:** `package_debit_per_share` is **signed per-share** (PB3). UI derives DEBIT|CREDIT and magnitude. Limit entry is magnitude+side in UI → **stored signed**.

### 3.5 Threshold alert

As v0.1; Held labeling when closed.

---

## 4. Position list & cards

### 4.1 List

Create (+), empty CTA, order (newest-first recommended). No OPF math in the list component itself — selection, visibility, lock, edit/remove only.

### 4.2 Card layout

| Band | Content |
|------|---------|
| Header | Label, DTE, status, **LOCKED**, stream chip (live/held/not live) |
| Body | Legs; package (basis vs mkt); DEBIT\|CREDIT or —; optional as_of |
| Actions | Show/Hide · Edit · Lock/Unlock · Remove |

### 4.3 Actions → viewport

| Action | Definition | Viewport |
|--------|------------|----------|
| Focus | focused id | Re-resolve that definition |
| Hide | visible=false; drop interest (PB17b) | Stop drive if was focused driver |
| Show | visible=true; re-interest | Eligible; if focused, drive |
| Edit / Update | structure change | Re-resolve |
| Remove | delete | Focus clear if needed |
| Lock / Unlock | LockState | Re-resolve with/without lock |
| Edit limit locked | \(D^*\) only | Re-resolve |

### 4.4 Package display algorithm (normative)

Evaluate **top to bottom**. “Session closed/held” means stream posture is not Live (PB-STREAM-1).

```text
if lock.mode == locked:
  display basis = D* (signed → UI magnitude + side)
  optional secondary mkt = PackageQuote.D_nat when available
  label secondary "mkt"
  if session closed/held:
    secondary also carries Held  # PB-MODE-3; never bare "mkt" as live after close
elif not visible:  # interest dropped (PB17b) — N1
  display last PackageQuote (or last known) with label "not live"
  # never style as live; priceSide from last known or null
elif incomplete:
  display "—"; priceSide = null
elif interest refused (budget):  # PB17b cap
  display loud "not live (budget)"
elif session closed/held:
  display last PackageQuote for keys, label Held
  if focused: same content_hash as viewport (R1b provenance)
elif multi-exp skew beyond threshold:
  per LABS_OPF_SKEW_MODE (PB18a)
else:  # unlocked, visible, live, complete, interest held
  display PackageQuote.D_nat (OPF-served / PB17); show as_of when available
```

---

## 5. Lock / unlock (member-facing)

Unchanged intent from v0.1 with B4 signed \(D^*\) and OD-PB11 clear:

- Lock natural / lock limit / unlock / edit limit while locked.  
- OPF binding via resolve.  
- Live mkt context optional when locked.  
- Not a broker order.

---

## 6. Viewport visualization

### 6.1 Inputs

Focused definition (or alternate §8) · market/archive · pack · lock · what-if · **mode**.

### 6.2 Outputs

Curves, marks, RECON only when matrix allows, engine/pack/mode labels, alert lines.

### 6.3 Forbidden

Viewport-only structure without card write · MSC SoR · curves for hidden card · unlabeled scenario · live claim when Held · silent dual pricing.

### 6.4 Feedback loop

Card definition → OPF resolve → viewport; member writes definition via card/Builder only.

### 6.5 Coherence Guarantee Matrix (Coach Addendum 1 — **normative**)

| Use case | Session state | Guarantee | Explicitly NOT claimed |
|----------|---------------|-----------|-------------------------|
| **day_trade** | **Live** (RTH, stream healthy) | **HARD:** card live package == resolve `PackageQuote` natural debit (same `content_hash`(es)) == T+0 at spot within AT-L3-RECON (OD-PF11); refresh per generation (PB-VIEW-5) | — |
| **day_trade** | **Closed / held** | **Provenance coherence:** card, resolve, curve cite **same last** `content_hash`; **Held** on card and viewport | **No RECON claim.** τ may move while marks held; divergence is lawful; not an error |
| **outlook** | Any | Epoch-anchored model honesty; `as_of` labeled; butterfly **and** calendar arb or fail-loud no surface; SABR behind RMSE gate; scenarios labeled **scenario** | Scenario ≠ mark. T+0 anchor reconciles per day_trade only while live; closed → held anchor |
| **backtest / forward-walk** | N/A (archive) | Determinism: same definition + shards + `pack_id@semver` ⇒ identical hashable output; steps within max-stale or **labeled gap** (OPF33); costs in meta | No live claim; display replay `as_of` only |

**Forward-walk (OD-PB14 recommendation):** workflow name for **`backtest.chain_replay`** stepped over archived generations on a member card — **not** a fourth pack. Projected non-archive futures require an OPF pack registry entry before PB references them.

---

## 7. Position Builder

### 7.1 Templates

Basic: single, vertical · Spreads: butterfly, bwb, condor · Volatility: straddle, strangle, iron_fly, iron_condor · Time: calendar, diagonal.

### 7.2 Live pricing

Display package from **same SoR as cards (PB17)** — OPF PackageQuote or parity-bound path. Chain hydrate for strikes/IV; not a second SoR.

### 7.3 Analyze / Update

Validate → write card → focus → close → resolve under active mode.

---

## 8. Alternate definition entry

| Source | Lock | Drives viewport when |
|--------|------|----------------------|
| Heatmap ToS / paste | Always **unlocked-live** (no card LockState) | No focused visible card (PB12) |
| Builder Analyze | Card with lock state | Focused after Analyze |

Paste does not auto-create a card (OD-PB8 default No).

---

## 9. Threshold alerts

Create from viewport; list; chart lines; spot evaluation; Held when closed.

---

## 10. Acceptance tests

### 10.1 Builder

| AT | Criterion |
|----|-----------|
| **AT-PB-1** | Live butterfly mids / package via SoR or loud empty |
| **AT-PB-2** | Geometry change recalculates package via SoR |
| **AT-PB-3** | Sell flips sides |
| **AT-PB-4** | Analyze → card + focus + OPF curves |
| **AT-PB-5** | Incomplete mid → no silent zero live on builder **or** viewport (no fabricated curve) |

### 10.2 Cards / viewport structure

| AT | Criterion |
|----|-----------|
| **AT-PB-C1** | Focused OPF legs match card definition only |
| **AT-PB-C2** | Focus A then B → payload is B only |
| **AT-PB-C3** | Hide focused → not driving viewport |
| **AT-PB-C4** | Unlocked live card package moves when PackageQuote / generation moves |
| **AT-PB-C5** | Only focused definition in resolve structure |
| **AT-PB-C6** | Edit/Update re-resolves |
| **AT-PB-C7** | Remove focused → fallback PB12 |
| **AT-PB-C8** | Live: mid/generation move → **card package and viewport curve** update within one generation cycle; both on new `content_hash` |

### 10.3 Coherence litmus (use-case scoped)

| AT | Gate | Criterion |
|----|------|-----------|
| **AT-PB-R1a** | day_trade live, stream healthy, focused unlocked, complete | Card package == resolve \(D_{\mathrm{nat}}\) (same content_hash) == T+0 at spot within RECON tol. Evidence: card, resolve payload, curve sample, one transcript. |
| **AT-PB-R1b** | day_trade closed/held | Same last content_hash on card, resolve meta, curve; **Held** labels; **no RECON assertion**; held mark vs model divergence not flagged as error. |
| **AT-PB-R1c** | outlook pack | Epoch as_of in meta; scenario curves labeled; butterfly **or** calendar arb fail ⇒ loud no-surface; SABR gate fail ⇒ labeled fallback to scenario_surface. |
| **AT-PB-R1d** | backtest.chain_replay | Same card + archive range + pack_id@semver twice ⇒ identical output hash; induced max-stale gap ⇒ labeled gap; no live affordance. |

### 10.4 Lock / skew / interest

| AT | Criterion |
|----|-----------|
| **AT-PB-L1** | Lock natural freezes \(D^*\); live mkt may move without changing \(D^*\) |
| **AT-PB-L2** | Unlock restores live natural basis |
| **AT-PB-L3** | Lock limit → OPF basis = signed limit; curves basis-referenced |
| **AT-PB-L4** | Lock natural incomplete → refuse |
| **AT-PB-L5** | freeze_iv true → iv_source locked |
| **AT-PB-L6** | Edit limit locked updates \(D^*\) only |
| **AT-PB-S1** | Multi-exp skew beyond threshold → loud/labeled package (PB18a) |
| **AT-PB-I1** | Hide card → interest dropped; not-live or — styling |
| **AT-PB-I2** | Cap refuse → “not live (budget)” loud |

### 10.5 Alerts / provenance

| AT | Criterion |
|----|-----------|
| **AT-PB-A1** | Price alert card + line + trigger (live) |
| **AT-PB-P1** | No MSC imports in Builder/Book path |
| **AT-PB-M1** | Mode banner always visible with time reference |

---

## 11. As-built vs Spec (gap map)

| Area | v0.2 law | As-built | Gap |
|------|----------|----------|-----|
| Builder + cards + alerts | §4–9 | Partial DL-294 | Polish |
| Card = def / viewport = viz | §0.1 | Focus → OPF | OK concept |
| OPF-served card package (B1) | PB17 | Client sum likely | **Plan** |
| Live re-resolve (B2) | PB-VIEW-5 | May be poll-only | **Plan** |
| Skew display (B3) | PB18a | Missing | **Plan** |
| Signed D\* (B4) | §3.4 | Verify | **Plan** |
| Litmus ATs R1a–d | §10.3 | Not gated | **Plan** |
| Interest PB17b | §1.3 | Implicit | **Plan** |
| Lock card → OPF | §5 | Incomplete | **Plan** |
| Mode banner / Held | PB-MODE / STREAM | Partial | **Plan** |
| Replay UX (date range, step/play) | OD-PB17 | Unspecified | **Defer** — not a side-door surface |
| Outlook epoch re-anchor | PB-VIEW-7 / OD-PB16 | Unspecified | **OD** |

---

## 12. Open decisions (Accept/Override)

**Gate:** OD Accept/Override on this table is required **before** any implementation plan (Spec §15 · DL-296 sequence).

| ID | Question | Recommendation |
|----|----------|----------------|
| **OD-PB1** | Session book vs server | Session v0.2; warn or localStorage for lock if tab-close matters (A4) |
| **OD-PB2** | Default widths SPX/NDX | 20 / 50 |
| **OD-PB3** | Regenerate clears limit override | Yes |
| **OD-PB4** | Multi-card aggregate viewport | **Accepted 2026-08-16 (Coach / DL-394):** additive continuous book of all **shown** cards. Prior “No” superseded. |
| **OD-PB5** | Alerts session vs Center | Session |
| **OD-PB6** | OMS statuses | ANALYSIS only |
| **OD-PB7** | Diagonal 2 strikes between | Yes when ladder |
| **OD-PB8** | Paste auto-creates card | No |
| **OD-PB9** | Default freeze_iv/marks | Both false |
| **OD-PB10** | mkt mid when locked | Yes, labeled |
| **OD-PB11** | Retain freeze snapshots after unlock | **No** session book |
| **OD-PB12** | Card live package source | **OPF-served PackageQuote** (B1a). If client-sum retained for non-focus: PB17a + R1a mandatory |
| **OD-PB13** | Focused re-resolve cadence (day_trade live) | On applied generation update (~stream interval); no independent poll loop |
| **OD-PB14** | Forward-walk naming | Workflow over `backtest.chain_replay`; not a fourth pack |
| **OD-PB15** | Replay-mode card package field | **(a)** stay live/held market (PB-MODE-2) for v0.2 |
| **OD-PB16** | Outlook epoch re-anchor when generations land | **Member-controlled re-anchor** + “epoch stale” indicator; no silent auto-shift of scenario curves mid-analysis (N3) |
| **OD-PB17** | Replay-mode member UX (date range, step/play, cadence) | **Defer** to implementation plan / v0.3 surface design — must not arrive as a side-door chrome; named here so gap is explicit (N4) |

---

## 13. Non-goals

Broker place/close · multi-tab authoritative sync · MSC alert SSE/AI · client Heston/MC SoR · profit theater · radio-style exclusive viewport · silent dual package math · RECON-as-live after close · **ad-hoc replay controls without OD-PB17 plan**.

---

## 14. Success criterion (review)

1. Card = definition; viewport = OPF visualization; chain/archive = market.  
2. Coherence matrix §6.5 understood; litmus is **R1a** (live), not false precision after close.  
3. B1–B6 laws present (PB17, VIEW-5, PB18a, signed D\*, ATs, PB17b).  
4. **OD-PB1–17** ready for Accept/Override.  
5. §11 gaps → implementation plan **only after** OD table.

---

## 15. Versioning & process

- **v0.2** supersedes v0.1 for implementation planning.  
- Next: OD Accept/Override → **implementation plan** → code → AT evidence.  
- Material law changes → v0.3+.

---

## 16. Review fold log

| ID | Source | Disposition |
|----|--------|-------------|
| R0 | DL-294 as-built | §11 |
| R1 | Coach card↔viewport | §0.1 |
| **B1** | Second pricing path | PB17 / PB17a / OD-PB12 · §0.4 · §4.4 |
| **B2** | Viewport not live | PB-VIEW-5 · OD-PB13 |
| **B3** | Multi-exp skew | PB18a |
| **B4** | D\* unfrozen | §3.4 signed |
| **B5** | Litmus AT | §6.5 · AT-PB-R1a–d · C8 · S1 (+ Coach matrix) |
| **B6** | Interest ownership | PB17b |
| **A1→blocking** | Held labels | PB-MODE-3 · PB-STREAM-1/2 |
| A2 | Incomplete viewport | PB-VIEW-6 |
| A3 | as_of on package | PB20a |
| A4 | Lock vs session | OD-PB1 note |
| A5 | Back-exp listed only | PB22 |
| A6 | entry_price naming | §3.1 |
| A7 | Dangling OD | OD-PB11 |
| A8 | Alternate unlocked | §8 |
| A9 | priceSide incomplete | §3.3 null |
| **Ad1** | Use-case guarantees | §0.2 · §6.5 · PB-MODE-0..3 · OD-PB14/15 |
| **N1** | §4.4 missing hidden/not-live branch | §4.4 `not visible` branch |
| **N2** | Locked mkt secondary after close | §4.4 locked + Held on secondary |
| **N3** | Outlook epoch re-anchor | PB-VIEW-7 · OD-PB16 |
| **N4** | Replay UX unspecified | OD-PB17 · §11 · non-goals |
| **N5** | Process: DL same day + OD before plan | DL-296 present; §12 gate sentence · §15 |

---

## 17. Document map

| Doc | Role |
|-----|------|
| **This Spec v0.2** | Product law after review fold |
| v0.1 | Historical |
| OPF Spec v0_2 | PackageQuote, lock, RECON, skew, interest, archive |
| Implementation plan | *After OD table — not this file* |

---

**End of Spec v0.2.**  
**Litmus status as product law:** defined and AT-gated (R1a live; R1b held; R1c outlook; R1d backtest).  
**Litmus status as code:** not claimed green until implementation plan lands ATs.


---

## 16. v0.3 residual fold (Analyzer advisor P-B2 · 2026-08-11)

Material law changes from Analyzer residual-bench review. **Implement against this file.**

### 16.1 PB-VIEW-7 — ratified (OD-PB16 Accept)

Already stated in §0.1 as normative (pin · re-anchor · stale). v0.3 **closes** the “recommendation until OD” wording: **OD-PB16 Accept**. Silent auto-re-anchor forbidden.

### 16.2 Six-state `liveState` (B5)

Normative enum:

`live | held | not_live | budget_refused | incomplete | skewed`

### 16.3 Package field invariant (B5)

When `lastNatSigned` is set: **`livePackagePerShare ≡ |lastNatSigned|`** at all times. Prefer signed storage; derive magnitude at render.

### 16.4 Status enum (OD-PB6)

v0.3 book product status: **ANALYSIS only**. Full OMS enum reserved until a future OD opens lifecycle tracking — not silent dual scope.

### 16.5 Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.3** | 2026-08-11 | PB-VIEW-7 + B5 triple · Analyzer residual bench P-B2 |
