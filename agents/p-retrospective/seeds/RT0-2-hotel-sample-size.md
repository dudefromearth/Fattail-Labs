# Seed RT0-2 — Hotel: MIN_INFERENCE_N + sample honesty

**Project:** p-retrospective  
**Primary:** Hotel  
**Reviewers:** India  
**Phase:** W0  
**Prerequisite:** RT0-1 draft available  

## Goal

Sign off **`MIN_INFERENCE_N = 20`** (or set alternate with rationale). Validate sample-banner
copy is trading-accurate: describes what happened; does not claim process “works.”

## Files in scope

- Spec text only (v0.5 draft): §6.6 sample gate, §8.2 sample gate, constants naming  

## Out of scope

- Cost-of-deviation counterfactual (remains deferred)  
- Implementation  

## Invariants

1. No profit claims.  
2. P&amp;L is neutral sample.  
3. Fail loud constants — no magic numbers only in UI.  

## Completion criteria

- [x] Written APPROVED with final N (or conditional APPROVED)  
- [x] Banner wording accepted or revised  
- [x] India review APPROVED  

## Feeds

→ RT0-G  

---

## Evidence (2026-07-29 — Hotel RT0-2)

### Verdict: **APPROVED** — `MIN_INFERENCE_N = 20` locked

| Claim checked | Finding |
|---------------|---------|
| N=20 as floor for **outcome inference** | Accept. Below ~20 closed trades, book aggregates (net, path language, “trend”) are noise for retail series review — not statistical “edge proof,” which the product correctly never claims. |
| N too high (e.g. 50)? | Reject for this product. Monthly / trial windows often sit 15–40 trades; 50 would leave most members permanently bannered without improving honesty once process-vs-outcome split is enforced. |
| N too low (e.g. 10)? | Reject. Ten-trade P&amp;L invites resulting (win streak = “process works”). 20 is the minimum pedagogical “series, not trade” line for this Spec. |
| Deviations at n=1 | Correct and **not** gated by `MIN_INFERENCE_N` (§6.3). Rule breaks are observations, not sample inference. |
| Adherence comparable flag uses same N | Correct. % followed needs enough tagged trades; reusing the constant is honest. |
| Constant naming | Spec must name `MIN_INFERENCE_N` in domain/API; no bare `20` only in UI (§8.2 updated to constant). |

### Banner — **ACCEPTED with precision revision**

| Version | Text |
|---------|------|
| Prior (v0.4/v0.5 draft) | *"This is a small sample. It describes what happened; it does not tell you whether your process is working."* |
| **Hotel locked** | *"This is a small sample. It describes what happened; it does not measure process quality."* |

**Why revise:** “Whether your process is working” can be misread as “use the book later to validate process.” The gate’s job is the opposite: the book **never** measures process. Revised wording is trading-accurate and still profit-claim free. Always show **n** alongside the banner (already Spec-required).

**Tango RT0-3** may further soften tone (shame/cadence); must **not** reintroduce outcome-as-verdict or profit language.

### Spec patches applied

- `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`: lock N=20; banner text; §8.2 constant ref; §21 closed item; header status.

### India review (required): **APPROVED**

| Check | Result |
|-------|--------|
| Single SoR for N | Yes — definitions + §6.6 + §8.2 + closed advisors table agree on **20** |
| Fail-loud constant (no UI-only magic) | Yes — constant name required; §8.2 no longer hardcodes bare 20 alone |
| Product boundary | No MSC / no implementation scope creep |
| Does not reopen Coach-closed items | Correct — only Hotel-owned sample gate |

### Residual (not blocking)

- Cost-of-deviation counterfactual remains deferred (§21).  
- Tango still owns shame framing on banner + cadence copy (RT0-3).  
