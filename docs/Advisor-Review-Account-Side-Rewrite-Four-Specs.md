# Advisor Review — Account-Side Rewrite (Four Specs)

**Reviewer:** Advisor layer (Claude)
**Date:** 2026-08-09
**Scope:** Formal review of Grok's spec set against the source proposals, session doctrine, and landed law:

| # | Spec under review | Verdict |
|---|---|---|
| 1 | Capital and Position Sizing Spec v0.2 | **FAITHFUL — 2 major findings, 4 minor, 2 notes** |
| 2 | Funding and Defunding Spec v0.1 | **FAITHFUL — 2 major (shared with Capital), 4 minor/notes** |
| 3 | Staleness Awareness Spec v0.1 | **FAITHFUL — 2 minor, 1 note** |
| 4 | Campaign Amendment v1.0 (Top Level Is the Account) | **FAITHFUL — 1 GOVERNANCE FLAG, 2 minor, 2 notes** |

No Sacred-invariant violations found in any document. The set is coherent, the cross-references are correct in direction, and the doctrine transmission (umpire, no-second-store, fungibility, funding≠direction, quiet register) is accurate throughout. The findings below are the gaps. The two that matter most: the **master-drawdown arithmetic cluster** (C-1/C-2/F-1/F-2) and the **radar disposition drift** (A-1), which needs Coach's explicit word before anything lands.

---

## 1. Capital and Position Sizing Spec v0.2

### C-1 — MAJOR: Master-DD comparison basis is undefined (mismatched denominators)

§4.1 computes realized drawdown **peak-relative on the trading curve**: `dd = (running − peak) / peak`. But §3.3 of the Funding Spec (normative here) declares the tolerance **as a percentage of total net capital** — the *balance* curve, which breathes with movements. As written, the witness compares a percentage-of-trading-peak against a percentage-of-balance-total. Those are different denominators and will disagree exactly when it matters (after any large deposit or withdrawal).

**Recommendation:** define the comparison in dollars at the meeting point — realized DD in dollars (trading curve, peak-to-trough) vs. tolerance% × current total net capital (balance curve, as-of) — or move both to one curve and say which. Hotel must sign the chosen definition; Kilo needs it before characterization. Coordinate the fix across Capital §4.1 and Funding §3.3 in the same edit.

### C-2 — MAJOR: Account-onboarding step distortion on the trading curve

Trading curve = starting balances + fills. A member who **adds an account mid-history** injects that account's starting balance as an upward step in the trading curve — which reads as *recovery that never happened*, the exact mirror of the deposit≠recovery defect this spec set exists to kill. Backdated starting-balance corrections create the same artifact.

**Recommendation:** compute the master DD on **cumulative fill P&L only** (curve starts at zero; starting balances live exclusively on the balance curve, where they behave like the cash they are). This removes the distortion mechanically and simplifies §4.1. Shared finding with Funding (F-2); fix once, in the Funding Spec, which owns the curve split.

### C-3 — MINOR: Version confusion

Header says v0.2; document-history's top row is **v0.2.1**. Pick one and make the filename agree.

### C-4 — MINOR: Law C4 omits cash movements

C4 says derived "from starting balances + trade history," but the balance curve requires **movements** (F2/F9). Align C4's wording so the law doesn't under-describe its own arithmetic.

### C-5 — MINOR: Schema prejudges an open disposition

§7 names the field `tolerated_master_drawdown_pct` while OD-1 (% vs $ vs member choice) is still open. Name it neutrally (`tolerated_master_drawdown` + form flag) or annotate that the schema follows the disposition.

### C-6 — MINOR: Wrap-one definition collapses into proportion

§3.2 defines wrap-one as "that account's balance **(or stated share of it)**." A stated share *is* the proportion mode. Keep wrap = whole-balance semantics and let shares belong to proportion — or define a wrap-share hybrid explicitly. As written, the two modes blur at exactly the boundary the UI will need crisp.

### C-7 — NOTE: OD-5 (live-tracking vs snapshot wrap) propagates further than listed

If a wrap **tracks live balance**, the per-source overcommit can never fire for it (claim ≡ balance by construction) and the claim has no staleness. If it's a **snapshot**, both apply. The decision therefore reshapes W-Overcommit-source *and* Staleness §4.2. Add the cross-reference so the disposition is decided with its full blast radius visible.

### C-8 — NOTE: Source-link lineage

Links cite a model "v0.1.2" in `../docs/` that the advisor layer never produced (advisor output was v0.1). Presumably Grok-side interim revisions — fine, but this is the recurring lineage-drift pattern; the standing content-hash-footer recommendation applies to this whole set.

---

## 2. Funding and Defunding Spec v0.1

### F-1 — MAJOR (shared): Tolerance basis vs. realized-DD basis

Same as C-1; this spec owns §3.3 and should carry the resolved definition.

### F-2 — MAJOR (shared): New-account starting balance is a cash-like step

Same as C-2. Cleanest fix lives here: trading curve = **Σ fill P&L only**; starting balances are balance-curve facts. Optionally see F-5, which makes this fall out for free.

### F-3 — MINOR: Retired accounts must stay in the master curve — say it

Implied but never stated: a retired account's **fills remain in the trading curve forever**. Without the explicit line, "retire the account" becomes a drawdown-erasure hole. One sentence in §4.1 closes it; one Kilo case pins it.

### F-4 — MINOR: Witness events vs. display, under backdating

F5 makes backdating lawful, and acceptance #4 requires as-of recompute. If capital-layer witnesses (overcommit lines) are ever **logged as events**, a backdated movement retroactively contradicts logged history. Recommend stating that capital-layer witnesses are **derived-at-read display only** — no stored witness events — which is also the cheaper build. India keep/kill.

### F-5 — NOTE: Unification option — starting balance as the first movement

Starting balance could be modeled as an account's **first funding movement**. One declared concept instead of two, and F-2/C-2 vanish mechanically (the trading curve naturally excludes it). Costs a small migration of existing starting-balance fields. Keep/kill for India; flagged because it simplifies rather than adds.

### F-6 — NOTE: The 422 on zero-amount is fine — label it

Rejecting a zero movement is input validation, not enforcement, so it doesn't collide with the no-4xx umpire register. One clarifying clause ("validation, not variance enforcement") prevents a future reviewer from reading it as a doctrine breach.

---

## 3. Staleness Awareness Spec v0.1

### S-1 — MINOR: Overcommit ratios misclassified as derived-never-stale

§2 lists "overcommit ratios" under derived/never-stale. The **denominator** (balances) is derived; the **numerator** (claims) is declared. Under S4 the ratio is *composed* and inherits the oldest claim's as-of. Reclassify — otherwise §2 contradicts the spec's own Law S4.

### S-2 — MINOR: §4.2 depends on Capital OD-5

Claim-age ("declared 60d ago; source since −$8k") only exists for **snapshot** wraps; live-tracking wraps have no claim staleness. Add the dependency note so this section is read as conditional on that disposition.

### S-3 — NOTE: "Last synced" on failure only

Failure-only display is defensible, but when the live path ships, a low-prominence success timestamp may serve trust better than silence. Echo's call at that time; non-blocking now.

---

## 4. Campaign Amendment v1.0 — Top Level Is the Account

### A-1 — ⚠️ GOVERNANCE FLAG (prominent, blocking until Coach speaks): Radar disposition drift

§2 states the Campaign Journey radar is **"present-only shape for charters; time scrub out of ship."** Coach's session direction was different: the radar **with** the lifetime slider was deferred *entirely* — parked, not deleted, pending value re-evaluation. "Present-only radar ships, slider cut" is a **third disposition** that appeared between the advisor layer and this spec. If Coach separately ratified present-only-shape with Grok, fine — it needs its own decision-log entry saying so. If not, the line must revert to full deferral. Either way, **this cannot land on Grok's or the advisor's authority; it is Coach's disposition to state explicitly.** Flagged per the no-silent-alteration rule — this is exactly the class of drift that rule exists for.

### A-2 — MINOR: Option A hard-delete vs. export lineage

Disposition Option A permits hard-delete of furniture rows "if no remaining stamps." If any `export_key` or pack ever referenced a ledger row, hard delete breaks Family B export lineage. Prefer soft-delete/tombstone as the default unless India *proves* zero references; make Option A's hard-delete conditional on that proof.

### A-3 — MINOR: `stamped_by=migration` on a null stamp

Setting `stamped_by` on rows whose stamp is being **cleared** is odd semantics — attribution of a non-stamp. Prefer `stamped_by` null, with the migration attribution living in the reversal seed's log/decision entry, keeping row semantics clean: no stamp, no stamper.

### A-4 — NOTE: Name law after furniture deletion

Furniture titles ("Primary book", "Default — …") were never member-chosen. Confirm the forever-reservation applies to **member-named** campaigns only, so deleted furniture names are freed — or state the reservation covers them too. One line in L7.

### A-5 — NOTE: Post-migration memory edge

Acceptance #3 covers expired-campaign memory. Add the sibling: remembered campaign was a **deleted furniture ledger** (post-Option-A) → next trade undirected, no error. Cheap Kilo case, real path.

---

## 5. Cross-cutting

**X-1 — Ratification order.** Funding is normative for Ring 1, so it ratifies **with or before** Capital v0.2. The Amendment and Capital P0 co-ratify (Capital already assumes no-ledger). Staleness can trail, but must ratify before P5 (self-report buying power) ships, since that posture's honesty depends on it.

**X-2 — The C-1/C-2/F-1/F-2 cluster is one edit.** Resolve the DD comparison basis and the trading-curve definition together, in the Funding Spec, with Capital §4.1 pointing at it. Two specs disagreeing on the master number would be the worst version of the second-store disease — two truths without even two stores.

**X-3 — Hash footers.** The set has enough cross-links and interim versions (v0.1.2 lineage, v0.2 vs v0.2.1) that the standing recommendation lands here with force: content-hash footer on each spec at ratification.

---

## 6. Summary for Coach

The rewrite is sound and the specs are faithful. Before ratification: (1) decide the master-DD arithmetic — dollar comparison at the meeting point, and fill-P&L-only trading curve, is my recommendation; (2) state the radar disposition in your own words — deferred-entirely or present-only-shape — so A-1 resolves on your authority and Lima logs it; (3) pick the OD-5 wrap semantics with its full blast radius (C-7/S-2) in view. Everything else is minor and can land as edits during bench review.
