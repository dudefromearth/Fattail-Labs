# FatTail Labs — Campaign Phase and Charter Tiering Spec v1.0

**Status:** **RATIFIED** — Coach GO 2026-08-09 (DL-276); BUILD AUTHORITY after W0-G  
**Date:** 2026-08-09  
**Current revision:** **v1.0.1** (advisor review findings 1–4 folded; Finding five blessed at ratify)  
**Type:** Product / UX / architecture authority — **campaign as phase**, charter form tiers, adoption law, phase reports  
**Bench:** `docs/Campaign-Phase-Charter-Tiering-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-campaign-phase/`  

**Sources (folded):**

| Source | Role |
|--------|------|
| [Campaign Phase Model v0.2.3](../docs/Campaign-Phase-Model-v0_2.md) | Seven spokes · layout · version |
| [Resolution — Charter Tiering](../docs/Resolution-Campaign-Charter-Tiering.md) · [_2 adopted bind](../docs/Resolution-Campaign-Charter-Tiering_2.md) | Big Three · tiers · dormant-until-adopted |
| Coach locks 2026-08-09 | L-End · L-T2 · L-DD · L-Adopt |
| Advisor reviews 2026-08-09 | CR-3/CR-4 scope; free margin; prune; CR-12 wording; DD denominator; post-sign adopt; rename |
| Correlation Doctrine v0.2 (companion — full text when landed) | Same-bet CR-10 · CR-3 account witness · CR-4 no coefficients · CR-7 not-answered · CR-11/12 prompts |
| Capital v0.3 · Funding v0.2 · Campaign Spec v1.3 · Positions View · Trade Log v1.1 | Money, windows, stamps, undirected |

**Ratification note (Finding five):** Striking the per-campaign correlation strip and forbidding P&L-ranked prune candidates originated as **advisor leans**, then folded honestly. Coach ratification of this Spec **blesses both** as product law for v1 (tests enforce absence). Override before ratify if a quiet campaign correlation echo or P&L-informed prune surface is wanted.

**Doctrine:** Account top level · funding ≠ direction · no second store · umpire (log path) · Family B · Sacred #8 · size inform only · display never demand · config-driven no ghost defaults.

---

## 0. Mission

A **campaign is a deliberate practice phase** — optional. It does not replace the account, the Trade Log, Strategy Lab Deploy, or undirected trading.

| Kind | Role |
|------|------|
| **Definition** | Member declares the phase (tiered form — §2) |
| **Report** | Aggregates at read time (no second equity SoR) |
| **Act** | Lifecycle: sign/activate, pause, prune, conclude, attach retro, renew |
| **Shape** | Six controls + radar = process discipline for the phase |

**Sizing coherence:** The Big Three are exactly the inputs needed so every signed campaign can answer **how big should this trade be?** (allocation × max DD% → solved size). That is protective, not theater.

---

## 1. Laws

| ID | Law |
|----|-----|
| **P1 — Phase not bank** | Campaign is optional season structure. Account is top level. Undirected trades lawful. |
| **P2 — Big Three to sign** | Capital allocation (mode + amount) · max DD **% of allocation** · start date are required to **sign / first-activate** a charter. |
| **P3 — Umpire preserved** | Missing Big Three → **422 on charter** (activate/sign path). **Never** 4xx on Trade Log create for missing campaign fields. Undirected needs no campaign. |
| **P4 — Max DD is percent** | Campaign max DD is always **percent of that campaign’s allocation** (L-DD). No dollar form on the charter field. |
| **P5 — End date optional to start** | End date not required to sign. Field remains. **Required to complete and archive** (L-End). |
| **P6 — Adoption law** | Optional attributes are **dormant until adopted**; adoption makes them charter law. **After the charter is signed, both adopt and un-adopt are amendments** (change-log entry + version bump per P11). Pre-sign adoption is just setting a draft term (no amendment row until first sign captures terms). No ghost defaults (L-Adopt). Big Three are **not** optional attributes. |
| **P7 — Same-bet Tier 2** | Same-bet answers sit **visible, skippable**, never behind “More options.” Optional; actionable **when adopted** (L-T2). |
| **P8 — Reports are derived** | Free cash, free margin, realized DD, strategy mix = read-time aggregates. No second store. |
| **P9 — Correlation placement** | Same-bet lives on the **charter form** (Tier 2). Account-level correlation witness is Correlation Doctrine CR-3. **CR-12 prompt fires once at campaign creation / before signing** — **not per trade**, not on the trade-log path, not a campaign report card. **No per-campaign correlation widget** on the phase report strip in v1 (§5). |
| **P10 — No performance grades as prune law** | v1 prune is lifecycle + member judgment. Report strip does **not** rank “prune candidates” by P&L (§6.5). |
| **P11 — Version** | Every campaign has integer `charter_version` ≥ 1. Bumps when **signed** charter terms change (including post-sign adopt/un-adopt). Renew → new campaign, default v1 on successor. |
| **P12 — Funding ≠ direction** | Capital allocation mode is funding/sourcing. Stamps are direction. |
| **P13 — Campaign realized DD% denominator** | On the **campaign phase report strip**, realized max DD **percent** uses the **same denominator as the declared target: this campaign’s allocation**. Master campaign-blind DD stays on Accounts & Capital / Funding surfaces. |

---

## 2. Charter tiers

### 2.1 Tier 1 — Required core (Big Three)

Rendered **large, always visible**. Cannot sign / first-activate without:

| Field | Storage (indicative) | Notes |
|-------|----------------------|--------|
| **Capital allocation** | Mode + amount (or wrap/proportion per Capital Spec) | Ring 2 claim from the pool |
| **Max drawdown %** | `max_drawdown_pct` | % of **this campaign’s allocation** only |
| **Start date** | `starts_at` | Window open; L4 eligibility begins |

### 2.2 Tier 2 — Visible optional (Same-bet)

On the form, **not** behind disclosure, **skippable** (~30s). Exact prompts from Correlation Doctrine CR-10 when that Spec is in-repo. Unadopted = “not answered” (CR-7). Adopted = participates in rollup / stamping prompts per CR-11/12.

### 2.3 Tier 3 — Advanced (More options)

Dormant until adopted:

| Attribute | Unadopted | Adopted |
|-----------|-----------|---------|
| End date | Window open until conclusion act | Binds window close; **must be set to complete/archive** |
| Goals | No goal chrome | On page; retro may reference |
| Strategy allow-list | No list rule exists (stamping not “default all”) | Outside-list witness may activate |
| Retro link | None | Attached retrospective |
| Dynamic allocation nuance | Simple mode only | Extra note / behavior binds |
| Custom title | Default title OK | Title is charter term |

### 2.4 Wireframe (start / edit definition)

```
START A CAMPAIGN
  ██ Capital allocation   ██ Max drawdown %   ██ Starts
     (big — required)

  Same-bet answers (optional, actionable if used)
    What are you trading? · Leaning? · Calm or wild? · What kills it?

  ▸ More options
    end date · goals · strategies · retro · allocation nuance
```

---

## 3. Seven phase spokes

| # | Phase | Intent | Product home |
|---|--------|--------|--------------|
| **1** | Strategy execution | Deploy curation-passed strategies; discipline under load | Lab handoff · stamps · Journal/process · radar |
| **2** | Capital allocation | Fund strategies; dynamic reallocation under watch | Definition (mode+amount) · report free cash/margin · movements on Accounts & Capital |
| **3** | Execution timeline | Start / end of season | Start required; end optional until close |
| **4** | Logging & documentation | Trades, adjustments, outcomes; automate honestly | Trade Log · change log (amendments) · Reports |
| **5** | Pruning & refinement | Cut underperformers; refine/scale winners | Lifecycle acts · member judgment · **no P&L prune-rank in v1** |
| **6** | Retrospective analysis | Post-phase lessons → next cycle | Attach Retrospective |
| **7** | Campaign conclusion | Decisive end | End date on complete/archive · terminal status · renew |

---

## 4. Page layout law

```
Header: title · version · status · signature

Definition (tiered — §2)
Phase report strip (aggregates — §6)
Six attributes + radar
Log: change log + Trade Log deep link (campaign filter)
Prune / lifecycle actions
Retrospective attach
Conclusion / renew
```

Definition sits **above** the attributes radar (prior layout lock).

---

## 5. Correlation join (scoped — advisor fold)

| Layer | v1 law |
|-------|--------|
| **Same-bet on charter (Tier 2)** | **In** — optional/adopted per P6–P7 |
| **Account-level correlation witness** | **In** — Correlation Doctrine CR-3; **not** a per-campaign widget |
| **CR-12 charter prompt** | **In** — fires **once at campaign creation, before signing** (charter moment). **Not per trade**, not on Trade Log path, not a report-strip card. Wording “at stamp” is **forbidden** in product copy for this prompt — it seeds trade-path ambush. |
| **Per-campaign “quiet correlation context” on report strip** | **Out of v1** (Coach ratification blesses this advisor lean — Finding five) |
| **Symbol–symbol Pearson Lab calculator** | **Out of this Spec** — not charter law. Correlation Doctrine CR-4 governs any Lab surface coefficients. This Spec does **not** authorize campaign-page coefficients. |

When Correlation Doctrine is filed in Specs/, formulas and CR-* IDs are authoritative; this Spec only **places** Same-bet and **forbids** campaign-strip correlation chrome and per-trade correlation nags in v1.

---

## 6. Phase report strip (aggregates)

All **derived at read**. No second store.

### 6.1 Free cash

**Definition:** Account (or scoped books) **current balance** (Funding: start + fill P&L + cash movements) **minus** open-position **cost basis** (sum of remaining open structures on that scope).

Cash not “assigned” to open positions at cost. Negative free cash is lawful (debit is life) — plain text, no valence.

If no account bound and campaign is account-free: report scope = **all active books** or honest “bind an account for cash report” — product default: **identity total free cash** across modeled accounts when `account_id` null.

### 6.2 Free margin (CP-3 settled)

**Definition (lawful):**  
`free_margin = declared_buying_power − structure_risk_open`  
when buying power is self-reported (or live later); else free margin is **null** (not shown as 0).

**`structure_risk_open`** (India may alias `committed_risk` in schema — **do not** name this `margin_at_risk`) = sum of **defined max loss** of open structures on scope (structure risk at open / remaining — same family as Trade Log structural risk), **not** broker maintenance margin, **not** a platform margin engine.

If BP posture is arbitrary / unset → omit free margin (honest gap).

### 6.3 Realized max DD (P13 — denominator pinned)

On the **campaign phase report strip**:

| Quantity | Law |
|----------|-----|
| **Declared max DD %** | Charter field — % of **this campaign’s allocation** (P4) |
| **Realized max DD %** (campaign strip) | Peak-to-trough on the **campaign trading curve** (fill P&L stamped to this campaign in window), expressed as **percent of the same base: this campaign’s allocation** — so target 15% and realized 12% speak the same language |
| **Master / campaign-blind DD** | **Not** on the campaign strip — lives on Accounts & Capital / Funding (campaign-blind book law) |

Do **not** show campaign-strip realized DD% against trading-curve peak or account equity as if it compared to the charter target. Optional secondary line in dollars (realized $ vs allocation × target %) is allowed if labeled; the **percent comparison line must share the allocation denominator**.

### 6.4 Strategy mix

Count / share of closed (or open) structures by `strategy` code among stamps on this campaign in window. **Informational mix** — not a rank list titled “prune candidates.”

### 6.5 Prune (v1)

**Acts only:** pause, complete, end early, amend strategy allow-list (if adopted), redirect stamps.  
**No** automated “prune candidates” ordered by P&L in v1 (avoids platform performance grading). Future criteria require Hotel/Coach sign-off.

### 6.6 Free cash / margin — sample n

Report may show open structure count and “as of” marks age per Positions View weekend rule.

---

## 7. Enforcement grammar

| Event | Rule |
|-------|------|
| First activate / sign | Big Three present → else **422** on campaign API |
| Trade create | Never requires campaign or Big Three; **no** CR-12 or correlation nag on this path |
| Complete / archive | End date set (adopt or set in act) → else **422** on that act |
| **Adopt optional field — pre-sign** | Value present → draft charter term (included in signature snapshot at first sign) |
| **Adopt optional field — post-sign** | **Amendment** + **version bump** (P6 · P11) — same seriousness as any charter edit |
| **Un-adopt / clear optional field after adopt** | **Amendment** + **version bump** — never quiet clear |
| Max DD storage | Percent only |
| Campaign report realized DD% | Denominator = **campaign allocation** (P13) |

---

## 8. Version and change log

- `charter_version` starts at 1; increments when signed charter terms change.  
- Change log = amendments + status timeline (existing table). Field labels include new charter keys.  
- Display `v{n}` in header.

---

## 9. Non-goals (v1)

- Broker margin engine or maintenance-margin simulation  
- Per-campaign correlation coefficient chrome  
- Authorizing Pearson UI on campaign or other surfaces without Correlation Doctrine CR-4 amendment  
- P&L-ranked prune candidates  
- Auto-rebalance without member cash movements  
- Gating undirected trading on campaign existence  

---

## 10. Acceptance (Kilo)

1. Sign without allocation, max DD%, or start → 422 on campaign; trade create still 200 undirected.  
2. Max DD accepts percent only.  
3. Complete/archive without end date → 422; with end date → terminal OK.  
4. Unadopted strategy list does not emit “outside list” witnesses.  
5. Adopted strategy list + outside stamp → witness path (when implemented), not trade block.  
6. Same-bet skip leaves “not answered”; **post-sign** adopt → amendment + version bump; pre-sign adopt → no amendment until sign.  
7. Un-adopt goals after adopt → amendment entry + version bump if signed.  
8. Report free cash = balance − open cost basis (scoped).  
9. Free margin uses **`structure_risk_open`** (defined max loss) + BP; never fabricates broker margin; null if no BP; API must not expose a field named `margin_at_risk`.  
10. No campaign report strip correlation block in v1.  
11. No prune-candidate P&L ranking in v1.  
12. Definition above radar.  
13. Campaign-strip realized DD% uses **allocation** as denominator (same as declared max DD%).  
14. Trade create never shows CR-12 / correlation charter prompt.  
15. CR-12 (when implemented) fires at campaign create/pre-sign only — once per charter, not per fill.

---

## 11. Review gates

| Holder | Focus |
|--------|--------|
| **Coach** | Ratify Spec; L-locks already spoken |
| **Tango** | Same-bet copy; More options; no shame on skip |
| **Hotel** | Solved size from Big Three; free margin = defined max loss; no P&L prune rank |
| **India** | Schema: version, max_drawdown_pct, allocation mode, optional JSON Same-bet, strategy list, retro id; amendments for adopt/unadopt |
| **Echo** | Big Three typography; Tier 2 inline; Tier 3 disclosure |
| **Alpha** | Sign gate 422; complete/archive end date; report endpoints |
| **Charlie** | Campaign page zones; Trade Log deep link |
| **Kilo** | §10 |
| **Lima** | DL: L-End, L-T2, L-DD, L-Adopt, CR-3 strip strike, P10 prune-rank forbid, free margin / structure_risk_open, P13 DD denominator, CR-12 charter-not-trade |
| **Delta** | Ternary after implementation |

---

## 12. Implementation order

1. Tiered definition UI + Big Three sign gate.  
2. End date on complete/archive.  
3. Adoption/un-adoption → amendments for Tier 2/3 fields.  
4. Report strip: free cash, free margin (defined max loss), realized DD, strategy mix.  
5. Change log chrome + Trade Log filter link.  
6. Retro attach.  
7. Same-bet storage when Correlation Spec lands (placement already law).  
8. Lab curation handoff list — later.

---

## 13. Document history

| Version | Date | Change |
|---------|------|--------|
| **v1.0.1** | 2026-08-09 | Advisor Spec review: CR-12 = charter create/pre-sign **not** per trade; P13 realized DD% denominator = campaign allocation; post-sign adopt/un-adopt both amendments + version bump; rename margin_at_risk → **structure_risk_open**; Finding five ratification note. |
| **v1.0** | 2026-08-09 | Formal Spec from Phase Model + Tiering + Coach locks + advisor fold: CR-3 campaign echo **out**; Lab Pearson **out of this Spec**; free margin = defined max loss; prune candidates **out** of v1 rank report. |

---

*Three fields make a charter that can size. Optional terms sleep until adopted; after sign, adopt and un-adopt both write the log. End closes the season. CR-12 is a charter moment, never a trade ambush. Realized and target DD% share the allocation denominator. Free margin is structure risk, not a broker engine. Prune is judgment, not a leaderboard.*
