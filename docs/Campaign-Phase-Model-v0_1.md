# Campaign Phase Model v0.1

**Status:** SUPERSEDED by [Campaign Phase Model v0.2](./Campaign-Phase-Model-v0_2.md)  
**Surface:** Practice · Campaigns  
**Companions:** Campaign Spec v1.3 · Capital v0.3 · Funding v0.2 · Positions View · Strategy Lab life cycle · Retrospective Spec  

**Note:** v0.2 folds Charter Tiering Resolution + correlation Same-bet placement + seven-phase prose.

**Principle:** A **campaign is a phase** — optional deliberate season of practice. It does **not** replace the account, the Trade Log, or Strategy Lab. Most phase outcomes are **reports aggregated at read time** (no second store). Definition declares the phase; radar shows process shape; log records change; retro closes the loop.

---

## 0. The seven spokes (Campaign Phase)

| # | Phase | Intent (Coach prose) | FatTail home |
|---|--------|----------------------|--------------|
| **1** | **Strategy execution** | Deploy strategies that passed curation; ongoing psychological evaluation for discipline | Lab: Curate → Deploy handoff. Practice: campaign stamps + process fields / Journal. Radar / six controls = discipline shape. |
| **2** | **Capital allocation** | Allocate across strategies by performance & risk; **dynamic reallocation** as monitoring continues | Capital Spec (wrap / proportion / dynamic mode). Free cash / free margin / assigned = **report aggregates**. Starting capital / mode = **definition**. |
| **3** | **Execution timeline** | Start and end dates for the trading campaign | Charter `starts_at` / `ends_at` (window law L4). |
| **4** | **Logging & documentation** | Record trades, strategy adjustments, performance; automate where possible | Trade Log (fills, stamps). Campaign **change log** (amendments). Import / automated `entry_source`. Reports for outcomes. |
| **5** | **Pruning & refinement** | Remove underperformers; refine and scale winners | Lifecycle + report: pause/complete/end; strategy mix report; later prune allow-list. Scaling = allocation report + capital mode — not auto-fill size (Capital C8). |
| **6** | **Retrospective analysis** | Post-campaign lessons; feed future strategy cycles | Retrospective workspace **attached** to campaign; not embedded as a second SoR. |
| **7** | **Campaign conclusion** | Decisive end based on performance and market conditions | Terminal status (`completed` / `abandoned`); end date hard or soft with honest labels. |

---

## 1. Definition vs report vs act

| Kind | What | Examples |
|------|------|----------|
| **Definition** (member declares) | Phase identity | Title, goals, window, version, allocation **mode**, optional max DD **target**, optional strategy allow-list, retro link |
| **Report** (derived, aggregated) | Phase truth at read | Free cash, free margin, realized DD, strategy mix from stamps, performance cards, prune candidates |
| **Act** (lifecycle / suite) | Change the phase | Activate, pause, complete, end early, renew cycle, attach retro, restamp / redirect |

**Doctrine anchors**

- Account remains top level (no ledger furniture).  
- Funding ≠ direction.  
- No second store of equity or witness events.  
- Umpire on log path; capital witnesses display-only.  
- Size is solved / inform — never auto-fills qty alone.  
- Process first on blotter; profit not primary chrome.

---

## 2. Layout law (campaign detail page)

Suggested vertical order (builds on “definition above radar”):

```
Campaign phase header
  title · version · status · signature

1–3  Definition strip
  Strategies (allow-list / “all stamped”) 
  Capital allocation mode (+ note for dynamic)
  Start · End · Goals · optional Max DD % target

2+4  Phase report strip (aggregates)
  Free cash · Free margin · Realized max DD · Strategy mix · sample n

     Six attributes + radar (process shape at present)

4    Change log (amendments + status timeline)
     Link: Trade Log filtered to this campaign

5    Prune / refine actions
     Pause · Complete · End early · (later) drop strategy from season

6    Retrospective
     Attach existing retro · open retro workspace · empty honest state

7    Conclusion
     End date + terminal honesty · Renew for next cycle
```

---

## 3. Phase detail (as product law)

### 1. Strategy execution

- **Input from Lab:** strategies that **passed curation** may be listed or linked (Deploy / house designs) — handoff is product UI, not shared code.  
- **In Practice:** execution is Trade Log fills stamped to this campaign (or undirected outside it).  
- **Psychological evaluation:** Journal + process fields + panel/radar (discipline shape), **not** PnL-as-worth.  
- **Report:** adherence / variance aggregates for stamps in window (existing process pack / panel).

### 2. Capital allocation

- **Definition:** how the phase claims capital (`fixed` starting capital · `wrap_account` · `proportion` · `dynamic`).  
- **Dynamic reallocation:** member-driven or report-suggested; platform does **not** invent bank moves. Movements stay on Accounts & Capital.  
- **Report:** free cash (cash not in open positions), free margin (BP − margin at risk when BP declared), allocation vs start.

### 3. Execution timeline

- Start / end dates = membership window for stamps (L4).  
- Open-ended end remains lawful until conclusion act.

### 4. Logging and documentation

- **Trades:** Trade Log only SoR.  
- **Adjustments:** campaign amendments (change log) + optional goals/strategy list edits.  
- **Outcomes:** Reports (account- or campaign-scoped).  
- **Automate:** import / automated entry_source; never fabricate marks or P&L.

### 5. Pruning and refinement

- **Prune:** stop stamping a strategy, complete/end campaign, or later remove from allow-list.  
- **Refine / scale:** allocation report + solved size (Capital Ring 3) — inform only.  
- No silent auto-kill of strategies mid-trade.

### 6. Retrospective analysis

- Post-phase: attach or open Retrospective.  
- Lessons feed **next** campaign / Lab design cycle — not rewrite of signed terms without amendment.

### 7. Campaign conclusion

- Decisive end date and/or terminal status.  
- History retained (Family B); renew for next cycle with new version lineage.

---

## 4. Version

Every campaign has a **charter version** (integer). Bumps when signed charter terms change (amendments). Display: `v{n}`. Lineage (renew) starts a new campaign object with predecessor link; version may reset to 1 on the successor or continue house rule — default: **new campaign, version 1**, predecessor carries history.

---

## 5. Non-goals (this model)

- Platform as broker margin engine  
- Auto-rebalance without member-recorded movements  
- Dual equity SoR on the campaign  
- Forcing every trade into a campaign (undirected remains lawful)  
- Replacing Strategy Lab Curate/Deploy with Practice chrome  

---

## 6. Implementation order (when GO)

1. Page zones match §2 (definition → report strip → radar → log → prune → retro → conclusion).  
2. Report strip: free cash / free margin / realized DD / strategy mix (read APIs only).  
3. Definition: allocation mode, max DD target, version display, strategy allow-list optional.  
4. Retro attach field + deep link.  
5. Change log chrome (rename/present amendments).  
6. Lab “passed curation” handoff list — later if Deploy report is ready.

---

## 7. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.1** | 2026-08-09 | Mindmap + seven-phase prose locked to FatTail homes; report vs definition split. |

---

*A campaign is a season of deliberate execution — strategies, capital story, window, log, prune, retro, end. The account is the bank. The Trade Log is the experiment record. The radar is the discipline mirror.*
