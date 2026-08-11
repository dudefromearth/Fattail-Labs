# FatTail Labs — Options Lab Position Builder & Position Book Spec v0.1

**Status:** **SUPERSEDED** by v0.2 (2026-08-11) — historical only; do not implement against v0.1
**Successor:** [`FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md`](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md)  
**Type:** Product Spec — structure construction, position book, card↔viewport law, package lock  
**Short name:** **Position Builder / Book** · **PB**  
**Filename:** `FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_1.md`  
**Surface:** Options Lab **Analyzer** (`/app/options-lab/analyzer`)  

**Process:** This document is for **review first**. Implementation that diverges from as-built code is **normative intent**, not a claim that every law is already green in the repo. After Accept/Override on ODs, a separate **implementation plan** updates code.

**Content integrity:** Landing content hash (sha1 of body excluding this line): `fff6e84800ca5d0c8cc3896e22039943e0bbccf6`.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Options Pricing Foundation Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Package marks · natural debit · **lock/unlock · freeze_iv/freeze_marks** · resolve · model packs |
| [Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (content **v1.0.1**) | Dual-side ladder · interest · no browser→Massive |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC5a · OC6a · **OC13** no MSC |
| [Heatmap Templates Spec v0_2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | Dual-side · ToS Option-click path |
| [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dialog · rail cards · fail-loud |
| Claude.md / FatTail ethos | No profit claims · fail loud · no MSC runtime |

**DL:** DL-294 (partial as-built) · DL for this Spec TBD at fold.  
**Reference UX (non-authority):** MSC Risk Graph Position Builder + Positions list + lock/unlock cost basis — **workflow inspiration only**. MSC is **not** product law.

---

## 0. Mission

On Options Lab Analyzer, members must be able to:

1. **Build** multi-leg structures with **live** chain mids (Position Builder).  
2. **Hold** structures as **position cards** in a **Position list** (book).  
3. Treat each **card as the definition** of the structure (legs, basis mode, lock state).  
4. Treat the Analyzer **viewport (risk graph)** as the **visualization** of the **focused** definition via **OPF** (never a second private pricing path).  
5. **Lock / unlock** package cost basis (and optional freeze flags) so debit/credit can freeze against a limit or natural mid while live mids continue for market context.  
6. Optionally set **threshold price alerts** on the same surface.

**North star:** definition (card) + live market facts + OPF visualization — professional honesty, not MSC parity.

**What this is not:** brokerage OMS; multi-account blotter; MSC order pipeline; client Heston/MC as SoR.

---

## 0.1 Cardinal relationship (non-negotiable)

```text
┌─────────────────────────────────────────────────────────────────┐
│  POSITION CARD  =  DEFINITION (source of truth for structure)     │
│  · legs, side, expirations, packages                             │
│  · basis mode: live natural | locked (limit or natural snapshot) │
│  · visibility, focus eligibility                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ focus + visible
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ANALYZER VIEWPORT  =  VISUALIZATION only                         │
│  · OPF resolve(definition → marks + curves)                      │
│  · PnLChart render (expiration + T+0/scenario)                   │
│  · does NOT redefine legs; does NOT invent a second structure     │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ dual-side generations (live mids/IV)
┌────────────────────────────┴────────────────────────────────────┐
│  MARKET FACTS  =  dual-side chain (Market Bus / ladder)          │
│  · feeds Builder, card live package, OPF marks/IV                │
└─────────────────────────────────────────────────────────────────┘
```

| Role | Object | Law |
|------|--------|-----|
| **Definition** | Position card (book entry) | Authoritative structure + basis/lock state |
| **Visualization** | Risk graph viewport | OPF output for the focused definition |
| **Market** | Dual-side generations | Live mids/IV/spot; never Massive from browser |

**PB-VIEW-1:** Editing the structure is done via **Builder (edit card)** or card controls — not by drawing on the viewport.  
**PB-VIEW-2:** Changing OPF **model pack** re-visualizes the **same** definition; it does not create a new card.  
**PB-VIEW-3:** What-if (time / vol pts / spot %) is visualization/scenario input to OPF; it does not rewrite the card definition unless the member explicitly saves an edit.  
**PB-VIEW-4:** Multiple cards may exist; **exactly one focused** definition is visualized (v0.1). Aggregate multi-card curves are out of v0.1 (OD-PB4).

---

## 0.2 Scope honesty

| In scope (this Spec) | Out of scope (v0.1) |
|----------------------|---------------------|
| Position Builder dialog (create / edit) | Broker submit / fill |
| Position **list** + **cards** as definition SoR | Server multi-device book |
| Live data for builder **and** cards | Full OPRA ticks |
| **Lock / unlock** package basis (+ optional freeze_iv / freeze_marks per OPF) | Fake OMS fill statuses |
| Card focus → viewport OPF visualization | Multi-position stacked curves |
| Threshold price alerts | Full Alert Center SSE |
| ToS generate/copy convenience | Legal order routing |

**As-built gap note (honest for reviewers):**  
Partial code landed under DL-294 (builder, cards, alerts, OPF graph). **Package lock/unlock on cards**, full OPF LockController wiring from the card, and some card live/lock UX detail may **not** yet match this Spec. Treat Spec as **target law**; green ATs require a later implementation plan after review.

---

## 0.3 Design invariant (data flow)

```text
Dual-side chain generation
  ├─► Builder (while open): live leg mids / package D_nat
  ├─► Position cards: live package display when UNLOCKED; frozen basis when LOCKED
  └─► OPF L4 resolve(focused definition + market + pack)
          └─► Viewport curves + marks (visualization)
```

- Builder **never** invents mids (fail loud / “awaiting”).  
- Viewport **never** invents a structure independent of the focused card (or alternate entry when no focus).  
- **MSC is not the standard** for pricing or structure.

---

## 1. Global laws

### 1.1 Builder & market (PB1–PB8)

| ID | Law |
|----|-----|
| **PB1** | No Massive from client. Quotes only from Labs generations (ladder/bus) or fail loud. |
| **PB2** | Dual-side books (call + put) for front (and back) expiration. |
| **PB3** | \(D_{\mathrm{nat}} = \sum_i q_i m_i\) per share; \(q>0\) long. DEBIT if \(D_{\mathrm{nat}}\ge 0\), CREDIT if \(D_{\mathrm{nat}}<0\); UI shows magnitude. |
| **PB4** | Incomplete mids → live package unavailable (“—”); do not invent mid labeled live. |
| **PB5** | User may set **limit magnitude** (ToS LMT). When locked to limit, that is basis (OPF). |
| **PB6** | Listed strikes when chain present; snap nearest (OC6a). Freeform only if chain unavailable (labeled). |
| **PB7** | Templates are Labs-owned pure functions — no MSC template imports. |
| **PB8** | MSC is not the standard. |

### 1.2 Book, cards, viewport (PB9–PB16)

| ID | Law |
|----|-----|
| **PB9** | **Card = definition.** Legs, packages, direction, basis/lock state live on the card (and its `PositionInput`). |
| **PB10** | **Viewport = visualization** of the focused definition via OPF only. |
| **PB11** | On Analyze/Update: upsert card, set **focused**, close Builder, run OPF resolve for that definition. |
| **PB12** | Focus priority for visualization: (1) focused + **visible** card; (2) else ToS paste / Heatmap session trade; (3) else empty CTA. |
| **PB13** | **Hide** (not visible): card remains in list but **must not** drive the viewport even if still “selected.” Show restores eligibility. |
| **PB14** | Clicking a card focuses it and **must** rebind the viewport to that definition (OPF re-resolve). |
| **PB15** | Removing a focused card clears focus; viewport falls back per PB12. |
| **PB16** | Session-scoped book v0.1 (e.g. sessionStorage); no cross-device claim. |

### 1.3 Live data on cards (PB17–PB20)

| ID | Law |
|----|-----|
| **PB17** | While Analyzer is open, every **unlocked** card refreshes **live package** \(D_{\mathrm{nat}}\) from dual-side mids for its legs (same generation plane as Builder). |
| **PB18** | Card live package uses PB3–PB4. Per-leg mid gaps → package “—” / incomplete, not silent zero labeled live. |
| **PB19** | Spot / IV used by OPF for the focused card come from the same market plane (chain + MarketStaticFacts / OPF config) — no private IV path on the card. |
| **PB20** | Live refresh **must not** change locked basis (PB-LOCK). Live mid may still be shown as secondary **market** context when locked (labeled “mkt” vs “basis”). |

### 1.4 Lock / unlock (PB-LOCK — maps OPF9–10 · OPF §5.7)

Package **basis** is what debit/credit P&amp;L and OPF curves are referenced to. Cards own lock state; OPF LockController (or equivalent API) executes it for the focused definition.

| ID | Law |
|----|-----|
| **PB-LOCK-1** | Modes: **`unlocked`** \| **`locked`**. Default on create: **unlocked** (basis tracks live \(D_{\mathrm{nat}}\)). |
| **PB-LOCK-2** | **Unlock:** \(D_{\mathrm{basis}} = D_{\mathrm{nat}}\) when package complete; else basis undefined / incomplete loud. Live package display follows market. |
| **PB-LOCK-3** | **Lock natural:** only if package complete; \(D^* = D_{\mathrm{nat}}\) at lock time; `lock_source = natural_mid`. Optional `freeze_iv` / `freeze_marks` per OPF §5.7 (default both **false** = basis-only lock). |
| **PB-LOCK-4** | **Lock limit:** always allowed; \(D^* =\) member limit magnitude with correct debit/credit sign; `lock_source = user_limit` \| `tos_limit`. |
| **PB-LOCK-5** | **Edit limit while locked:** updates \(D^*\) only; does not unlock. |
| **PB-LOCK-6** | **Unlock:** clears \(D^*\) and freeze snapshots (unless audit retain — OD); basis returns to live natural. |
| **PB-LOCK-7** | Card UI must show lock state distinctly (e.g. LOCKED badge, lock icon). Locked package field is basis; unlocked field tracks live mid. |
| **PB-LOCK-8** | Focused locked definition → OPF resolve **must** pass lock state so curves/marks use \(D^*\) and freeze rules (OPF8 `iv_source=locked` when freeze_iv). |
| **PB-LOCK-9** | Lock is **not** a broker order. Status remains ANALYSIS (or future OMS) independent of lock. |
| **PB-LOCK-10** | Fail loud if lock natural requested while incomplete. |

### 1.5 Builder mechanics (PB21–PB26)

| ID | Law |
|----|-----|
| **PB21** | Builder reprice on chain refresh while open. |
| **PB22** | Time spreads: short = front exp, long = back exp; default back = next listed after front else +1 cal day (Sat→Mon). |
| **PB23** | Buy/Sell flips all leg sides. |
| **PB24** | Packages \(N\ge 1\) scale OPF packages / quantities. |
| **PB25** | ToS script is export convenience — not sole SoR. |
| **PB26** | Handoff → OPF `StrategyIntent` without MSC types. |

### 1.6 Alerts (PB-AL)

| ID | Law |
|----|-----|
| **PB-AL-1** | Threshold types: price above / below / touch (underlier). |
| **PB-AL-2** | Create from viewport context menu; list as cards; chart lines when enabled. |
| **PB-AL-3** | Evaluation uses underlier spot, not package mark. |
| **PB-AL-4** | Alerts do not redefine the position; optional `positionId` is scope only. |

### 1.7 Ethos / fail loud (PB27–PB28)

| ID | Law |
|----|-----|
| **PB27** | No profit-claim chrome. |
| **PB28** | Missing symbol, chain error, empty legs → fail loud; no silent empty Analyze. |

---

## 2. Surface map

| Element | Location | Role in definition / visualization |
|---------|----------|-------------------------------------|
| **Position Builder** | Modal | Mutates / creates **definition** (draft until Analyze/Update) |
| **Position list** | Left rail | Container of definition cards |
| **Position card** | In list | **Definition SoR** for one structure |
| **Focus** | Card selection | Selects which definition the viewport visualizes |
| **Hide/Show** | Card action | Visibility for visualization eligibility |
| **Lock/Unlock** | Card action | Basis freeze on definition (OPF lock) |
| **OPF model pack** | Rail | Visualization model only (same definition) |
| **Risk graph viewport** | Main pane | **Visualization** of focused definition |
| **What-if** | Rail | Visualization scenario inputs (OPF what_if) |
| **Alerts list** | Rail | Threshold rules; not definitions |
| **ToS paste** | Rail | Alternate definition entry when no focused card |

Route: `/app/options-lab/analyzer`.

---

## 3. Domain model

### 3.1 LegInput / PositionInput

As structure builders: strike, type, qty, side, live mid (`entry_price` while hydrating), optional per-leg expiration, optional IV, packages, direction, optional limit magnitude.

### 3.2 AnalyzerPosition (card = definition)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable client id |
| `label` / `notation` | string | Display |
| `position` | PositionInput | **Structure definition** |
| `status` | ANALYSIS \| … | Lifecycle; v0.1 default ANALYSIS |
| `visible` | boolean | Hide from viewport drive |
| `livePackagePerShare` | number \| null | Live \(D_{\mathrm{nat}}\) magnitude when unlocked / market context |
| `priceSide` | debit \| credit | From live or locked basis |
| **`lock`** | LockState | **Normative** — see §5 |
| `createdAt` / `updatedAt` | number | |

### 3.3 LockState (card-level; aligns OPF)

```text
{ "mode": "unlocked" }

{
  "mode": "locked",
  "locked_at": ISO-8601,
  "package_debit_per_share": number,   // D* signed or magnitude+side — implement consistently with OPF
  "lock_source": "natural_mid" | "user_limit" | "tos_limit",
  "generation_hashes_at_lock"?: { "YYYY-MM-DD": "hash" },
  "freeze_iv": boolean,                 // default false
  "leg_iv_snapshot"?: { [leg_id]: number },
  "freeze_marks": boolean,              // default false
  "leg_mark_snapshot"?: LegMark[]
}
```

### 3.4 Threshold alert

price_above | price_below | price_touch; symbol; targetPrice; optional positionId; status; severity; color.

---

## 4. Position list & cards (detailed)

### 4.1 List responsibilities

1. Render all book definitions as cards (session order: newest first recommended).  
2. Provide **Create (+)** → open Builder.  
3. Surface empty state CTA when no cards.  
4. Do not own OPF math — only selection, visibility, lock actions, edit/remove.

### 4.2 Card layout (MSC-inspired, Labs chrome)

| Band | Content |
|------|---------|
| **Header** | Label, DTE, status badge, **LOCKED** badge if locked |
| **Body** | Leg lines / notation; package field; DEBIT\|CREDIT; optional secondary “mkt” when locked |
| **Actions** | Show/Hide · Edit · **Lock/Unlock** · Remove |

Visual: focused tint border; debit/credit left accent; hidden dimmed; locked package field style distinct from live.

### 4.3 Card actions

| Action | Effect on definition | Effect on viewport |
|--------|----------------------|--------------------|
| **Click / Focus** | Sets focused id | Rebind OPF visualization to this definition |
| **Hide** | `visible=false` | If was driving viewport, stop; fall back PB12 |
| **Show** | `visible=true` | Eligible again; if focused, drive viewport |
| **Edit** | Opens Builder with this definition | Viewport may keep showing old until Update |
| **Update (Builder)** | Overwrites definition fields | Must re-resolve OPF for this id |
| **Remove** | Delete from book | Clear focus if needed; viewport fallback |
| **Lock** | See §5 | Re-resolve with locked basis |
| **Unlock** | See §5 | Re-resolve with live natural basis |
| **Edit package while unlocked** | Sets limit candidate / override | Optional; or only apply on lock-limit |
| **Edit package while locked** | Edit limit → \(D^*\) only (PB-LOCK-5) | Re-resolve |

### 4.4 Live data on cards (unlocked)

```text
each refresh cycle:
  for card in book:
    mids = lookup dual-side generation for each leg
    if complete: livePackage = D_nat; priceSide = sign(D_nat)
    else: livePackage = null (loud incomplete)
    if card.lock.mode == unlocked:
      display package = livePackage
    else:
      display basis = D*; optional mkt = livePackage
```

Cards share the same chain warm set as Builder/OPF (all expirations referenced by any card leg).

---

## 5. Lock / unlock (member-facing law)

### 5.1 Why lock exists

Members compare structures to **ToS Risk Analyzer** and settle limit intent. Live mids move; without lock, basis-referenced P&amp;L at T+0 drifts. Lock freezes **cost basis** \(D^*\) (and optionally IV/marks) per OPF.

### 5.2 Member flows

| Flow | Steps |
|------|-------|
| **Lock to market** | Unlocked complete package → Lock natural → card LOCKED; \(D^*=D_{\mathrm{nat}}\); viewport uses locked basis |
| **Lock to limit** | Enter limit (Builder or card) → Lock limit → \(D^*=\) limit; viewport basis-referenced to limit |
| **Unlock** | Clear lock → basis tracks live again; freeze snapshots cleared |
| **Edit limit locked** | Change number → \(D^*\) updates; remains locked |

### 5.3 OPF binding

| Card state | OPF |
|------------|-----|
| unlocked | No lock / unlocked LockState; basis = natural when complete |
| locked natural | `lock_natural` with optional freeze flags |
| locked limit | `lock_limit` with limit_per_share |

Generation hashes at lock recorded when available (OPF).

### 5.4 What stays live when locked

| Always live (market context) | Frozen when locked |
|------------------------------|--------------------|
| Underlier spot (unless what-if) | Package **basis** \(D^*\) |
| Optional secondary mkt package mid | freeze_iv → leg IVs |
| OPF model_t0 shape vs spot (uses basis) | freeze_marks → mark snapshot path |

Viewport curves remain **basis-referenced** (OPF30): \(y = (V - D_{\mathrm{basis}}) \times 100 \times N\).

---

## 6. Viewport visualization law

### 6.1 Inputs (only)

1. **Focused definition** (card) — or alternate entry if no focus (PB12).  
2. **Market facts** — dual-side generations + static facts.  
3. **OPF pack** + what-if.  
4. **Lock state** from the definition.

### 6.2 Outputs

- Expiration curve + T+0 / scenario curve (pack-dependent).  
- Marks, RECON (day_trade), engine/pack labels.  
- Alert lines (not part of definition).

### 6.3 Forbidden

- Viewport-only leg edits that do not update the card.  
- MSC / client BS-as-SoR for package curves when OPF is available.  
- Showing curves for a hidden card as if focused.

### 6.4 Feedback loop

```text
Card (definition) ──focus──► OPF resolve ──► Viewport
     ▲                                            │
     │              lock / edit / reprice           │
     └──────────── member actions on card ◄─────────┘
                   (viewport does not write legs)
```

---

## 7. Position Builder (dialog)

### 7.1 Templates

| Group | Templates |
|-------|-----------|
| Basic | single, vertical |
| Spreads | butterfly, bwb, condor |
| Volatility | straddle, strangle, iron_fly, iron_condor |
| Time | calendar, diagonal |

Geometry summary: butterfly body±width; BWB upper 2×; vertical center..center+width; iron/condor standard; calendar same strike two exps; diagonal short front / long back with width (prefer 2 listed strikes between).

### 7.2 Live pricing in Builder

ChainAccessors: expirations, strikes, getContract mid/iv, nearestStrike, spot, loading/error.  
Reprice on edit and on chain refresh. Package display PB3–PB5.  
v0.1 recommendation: template regenerate clears limit override (OD-PB3).

### 7.3 Analyze / Update

Validate legs → write definition to card → focus → close → OPF visualize.  
Optional ToS copy buffer for transparency.

---

## 8. Alternate definition entry

| Source | Becomes |
|--------|---------|
| Heatmap Option-click ToS | Session trade; drives viewport if no focused card |
| Paste ToS | Same |
| Builder Analyze | Card definition (preferred book path) |

Paste does not auto-create a card unless product chooses OD (recommend: optional “Add to book” — OD-PB8).

---

## 9. Threshold alerts (companion)

Create from viewport context menu; list cards Ack/Dismiss; chart lines; evaluate on spot. Session store v0.1. Not definition SoR.

---

## 10. Acceptance tests (review + later implementation)

### 10.1 Builder

| AT | Criterion |
|----|-----------|
| **AT-PB-1** | Live butterfly mids non-null or loud empty |
| **AT-PB-2** | Width change recalculates \(D_{\mathrm{nat}}\) |
| **AT-PB-3** | Sell flips sides |
| **AT-PB-4** | Analyze → card + focus + OPF curves |
| **AT-PB-5** | Incomplete mid not silent zero live |

### 10.2 Cards, list, viewport

| AT | Criterion |
|----|-----------|
| **AT-PB-C1** | Card is sole structure definition for focused OPF legs |
| **AT-PB-C2** | Focus card A then B → viewport legs match B only |
| **AT-PB-C3** | Hide focused card → viewport not driven by it |
| **AT-PB-C4** | Unlocked card live package moves when chain mids move |
| **AT-PB-C5** | Two cards: only focused definition in resolve payload |
| **AT-PB-C6** | Edit/Update changes definition → viewport updates |
| **AT-PB-C7** | Remove focused → focus cleared → fallback PB12 |

### 10.3 Lock / unlock

| AT | Criterion |
|----|-----------|
| **AT-PB-L1** | Lock natural freezes \(D^*\); unlocked live mid may change without changing \(D^*\) |
| **AT-PB-L2** | Unlock restores basis to live natural |
| **AT-PB-L3** | Lock limit → OPF basis = limit; curves basis-referenced |
| **AT-PB-L4** | Lock natural incomplete → refuse loud |
| **AT-PB-L5** | freeze_iv at lock → OPF iv_source locked (when flag true) |
| **AT-PB-L6** | Edit limit while locked updates \(D^*\) only |

### 10.4 Alerts / provenance

| AT | Criterion |
|----|-----------|
| **AT-PB-A1** | Price alert card + chart line + trigger on spot |
| **AT-PB-P1** | No MSC imports in Builder/Book path |

---

## 11. As-built vs Spec (gap map for reviewers)

| Area | Spec law | As-built (DL-294 era) | Gap |
|------|----------|----------------------|-----|
| Builder live mids | §7 | PositionBuilder + useBuilderChain | Minor polish |
| Cards list | §4 | AnalyzerPositionsList | Lock UI missing |
| Card = definition / viewport = viz | §0.1 | Focus drives OPF | OK conceptually |
| Live package on cards | PB17 | Partial reprice | Verify complete/incomplete |
| **Lock/unlock** | §5 | **Not fully card-wired to OPF LockController** | **Implementation plan after review** |
| freeze_iv/marks | OPF §5.7 | Server supports; card UI TBD | Plan |
| Alerts | §9 | AnalyzerAlertsSection + chart | OK baseline |
| Multi-card aggregate | Out | N/A | Out |

---

## 12. Open decisions (Accept/Override)

| ID | Question | Recommendation |
|----|----------|----------------|
| **OD-PB1** | Session book vs server | Session v0.1 |
| **OD-PB2** | Default widths SPX/NDX | 20 / 50 |
| **OD-PB3** | Regenerate clears limit override | Yes |
| **OD-PB4** | Multi-card aggregate viewport | No v0.1 |
| **OD-PB5** | Alerts session vs Alert Center | Session v0.1 |
| **OD-PB6** | OMS statuses | ANALYSIS only |
| **OD-PB7** | Diagonal 2 strikes between | Yes when ladder |
| **OD-PB8** | Paste auto-creates card | No — optional Add to book |
| **OD-PB9** | Default freeze_iv/marks on lock | Both false (basis-only) |
| **OD-PB10** | Show mkt mid when locked | Yes, labeled secondary |

---

## 13. Non-goals (v0.1)

Broker place/close · multi-tab authoritative sync · MSC alert SSE/AI types · client Heston/MC SoR · profit theater · multi-definition stacked P&amp;L in one viewport.

---

## 14. Success criterion (review)

A reviewer can:

1. Explain **card = definition**, **viewport = visualization**, **chain = market**.  
2. State lock/unlock and what freezes vs stays live.  
3. Trace focus/hide/edit to OPF resolve.  
4. Mark **OD-PB1–10** Accept/Override.  
5. Separate **as-built gaps** (§11) from **product law** — and require an **implementation plan** before code changes for lock/card completeness.

---

## 15. Versioning & process

- **v0.1 DRAFT** — review baseline.  
- **No Coach BUILD GO implied** for gap fill until ODs accepted.  
- Next: review comments → OD table → **implementation plan** → code → AT evidence.  
- Material law changes → v0.2+.

---

## 16. Review fold log

| ID | Source | Disposition |
|----|--------|-------------|
| R0 | DL-294 as-built | Partial land noted in §11 |
| R1 | Review request: list/cards, live, lock/unlock, card↔viewport | This document §0.1 · §4 · §5 · §6 |
| — | Pending Coach / specialist review | TBD |

---

## 17. Document map

| Doc | Role |
|-----|------|
| **This Spec** | Product law for Builder + Book + card/viewport + lock |
| OPF Spec v0_2 | Normative lock/basis/resolve math |
| Arch 30 | Foundation topology |
| Implementation plan | *To be written after review — not this file* |

---

**End of Spec v0.1 (review baseline).**  
**Do not treat as fully implemented until §11 gaps are closed under a post-review plan.**
