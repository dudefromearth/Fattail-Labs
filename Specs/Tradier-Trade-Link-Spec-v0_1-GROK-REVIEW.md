# Review request: Tradier Trade Link Adapter — Spec v0.1 (DRAFT)

**Machine:** StudioTwo (dev). Read-only; this packet authorizes no edits and no file placement.
**To:** Grok Advisor (adversarial review seat)
**From:** Coach
**Document under review:** reproduced in full below this request. It is the only artifact; nothing is attached separately.

## What to do

Review the spec below against repo doctrine, the as-built architecture, and the standing rules. Two passes:

1. **Doctrine and architecture.** Does anything in the spec break an invariant, a law, or the as-built system? Pay particular attention to G-0 / §2.1 (the canonical-model verification): if you already know from the repo whether a single canonical trade representation exists and whether every TOS-emitting surface renders through one adapter, say so with file paths. Do not run W0 — report what you know and what would have to be checked.
2. **Spec integrity.** Scope statement honest; no defaults masquerading as decisions (every undirected dimension is in §8, not silently settled elsewhere); no acceptance test or law that votes on an open question; version/header/filename consistent; the Tradier wire format in TL-L4 and TL-L7 matches Tradier's published Trade Link and OCC conventions.

## Report format

- Verdict line: GO / NO-GO for intake, with one sentence why.
- Numbered findings, prose, ordered by severity. Each marked **BLOCKING** (breaks a law, invariant, or system — state which) or **ADVISORY** (reviewer judgment Coach is free to discard). Never conflate the two.
- "Notes without findings."
- "Summary for Coach" — plain language, no agent labels.

## Stop conditions

- You find a prior Tradier or Trade Link spec in `~/FatTail-Labs/Specs/` — report it and stop; do not review against it.
- Any doubt about which outcome of §2.1 holds — state the doubt as a finding; do not resolve it by assumption.

---
---

# Tradier Trade Link Adapter — Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT — first version; supersedes nothing)
**Date:** 2026-10-03
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven — the dev-first-then-promote pattern. Specification only; files/trees touched by this document: NONE
**Scope:** The canonical-trade → broker-ticket adapter layer in FatTail Labs, and every member surface that renders a ThinkOrSwim (TOS) order script. Adds one adapter and one surface control. No data-plane, brokerage-sync, order-submission, or canonical-model law lives here.
**Touches outside program:** NONE. Identity/auth, payments, the Strategy Lab brokerage adapter (Conor's Tradier account-sync work), and the canonical trade object itself are not touched.
**Status:** DRAFT. **BUILD AUTHORITY: none.** No adapter or surface work proceeds from this file.
**Canonical filename:** provisional — assigned the next free `Specs/` series ID at Juliet intake. Header, filename, and footer change together when it lands.

**Parents (cited, not amended):**
- Canonical trade model and the existing TOS adapter (as-built; Juliet to cite the owning architecture doc and the adapter's file path at intake).
- Options Lab Runner heatmap ToS order block (as-built: "Copy again" / "Open in Analyzer"). This spec adds a sibling control; it does not amend the block.
- Tradier Trade Link documentation (`docs.tradier.com/docs/trade-link`, read 2026-10-03). External; cited as the wire format, not law.

**Context:** Tradier partnership (Brian Vogelman, VP Business Development, meeting 2026-10-02). Trade Link is the piece Coach asked for first; the subsidy, pricing page, and simulcast are separate programs and are not in this file.

---

## §1 Purpose

Wherever a member can copy a TOS script, they can also open the same trade as a pre-populated, editable, **unsubmitted** ticket on Tradier. The member always reviews and sends the order. This is a prefill, not an execution path: it removes the fat-finger risk of hand-typing legs and changes nothing about who places the trade or where the decision is made.

---

## §2 Dependency gates

| Gate | What it is | Scope | State at writing |
|---|---|---|---|
| G-0 | **Canonical-model verification.** Confirm from code that one canonical trade representation exists and that the TOS script is rendered from it by an adapter. See §2.1 for the two outcomes. | Everything below | Unverified — Coach's recollection, not yet checked against the repo |
| G-A | Coach Phase-5 stamp on this spec (BUILD AUTHORITY) | All packets | Pending |
| G-B | Q1 resolved — leg-count behavior for structures over four legs | W1 binding of TL-L6 | Open (§8) |
| G-C | Q2 resolved — control visibility (all members vs. Tradier-opted) | W2 | Open (§8) |
| G-D | UX mockup of the sibling control approved by Coach (bench UX seat, per the Sep 28 2026 standing rule) | W2 | Not started |
| G-E | Coach's own Tradier account available for AT-1 (dev) and AT-7 (production) | W3, W4 | Available (Coach holds a Tradier license) |
| G-F | W3-G GO on StudioTwo with evidence; rollback path named | W4 promotion | Pending |

No packet dispatches until G-0 and G-A are GO. W1 may proceed on G-A alone with TL-L6 shielded (§7); W2 requires G-C and G-D.

### §2.1 G-0 outcomes

**Outcome 1 — model exists, TOS adapter consumes it.** G-0 GO. This spec stands as written; Juliet records the model's and adapter's file paths as parents.

**Outcome 2 — no single canonical model, or the TOS script is built inline per surface.** G-0 NO-GO. This spec's scope is wrong and it does not proceed as written. The corrected program is larger: (a) define the canonical trade model; (b) refactor every TOS-emitting surface to build the canonical object and render TOS through one adapter; (c) add the Trade Link adapter beside it; (d) amend the owning architecture doc, which may require a decision-log entry of its own. That is a refactor touching every TOS site and the as-built architecture, so it is raised to Coach as a question before anything is written — not folded into this spec. Juliet's G-0 report must state which outcome holds, with the evidence (file paths, or the list of inline TOS builders found), and in Outcome 2 propose only the scope of the corrected spec, not its content.

Partial findings (a model exists but one or two surfaces bypass it) are Outcome 2: the bypasses are the architecture defect this check exists to find.

---

## §3 Law catalogue

**TL-L1 — One source, two renderers.** The Trade Link adapter consumes the same canonical trade object the TOS adapter consumes. No string-to-string translation from TOS output; no second trade representation; no change to the canonical object.

**TL-L2 — Output is a URL or an honest refusal.** The adapter returns either one absolute, fully URL-encoded Trade Link URL, or a `not_renderable` result carrying a reason. It never returns a partial, guessed, or silently malformed URL.

**TL-L3 — Prefill, never submit.** The URL targets Tradier's staged ticket. The adapter and surface make no Tradier API call, carry no token, account ID, or credential, and submit nothing. (Verified by AT-1 as a property of Tradier's ticket, not assumed.)

**TL-L4 — Wire format.** Base `https://dash.tradier.com/tradelink`. One leg → `class=option`, `symbol`, `option_symbol`, `side`, `quantity`, `type`, `duration`, `price`. Two or more legs → `class=multileg`, `symbol`, then zero-based `option_symbol[i]`, `side[i]`, `quantity[i]` in canonical leg order, plus `type`, `duration`, `price`. Sides: `buy_to_open`, `sell_to_open`, `buy_to_close`, `sell_to_close`, mapped from the canonical leg's long/short + open/close. Type: `debit` or `credit` by the net of the structure. Per-leg quantities are exactly the counts the TOS adapter emits (1-2-1 fly, etc.).

**TL-L5 — Price carried.** The canonical limit price is written to `price`. (Coach's direction 2026-10-02, conditional on AT-1 proving the ticket stays editable.)

**TL-L6 — Leg cap.** Tradier documents multileg orders at up to four legs. Behavior for structures exceeding the cap is governed by Q1 (§8); until Q1 is resolved the adapter returns `not_renderable: leg_cap` for them and the surface shows the honest label (TL-L9). Nothing in this file presumes Q1's answer.

**TL-L7 — OCC symbol construction.** `<root padded with spaces to 6><YY><MM><DD><C|P><strike × 1000, zero-padded to 8>`, spaces URL-encoded. Example: SPXW 2025-10-17 5800 call → `SPXW%20%20251017C05800000`.

**TL-L8 — Root table.** Option roots come from a single lookup table keyed by underlying and expiration class — not inline logic. Initial table: SPX PM-settled weeklies/dailies → `SPXW`; SPX AM-settled monthly → `SPX`; XSP → `XSP`; equities/ETFs → ticker. An expiration the table cannot classify yields `not_renderable: unknown_root`; the adapter never guesses a root. Adding an underlying is a table edit.

**TL-L9 — Surface parity and honesty.** The Tradier control appears exactly where a TOS script block appears and nowhere else, in the same minimal/compact grammar as the existing block (open in new tab; URL copyable like the script). A `not_renderable` result renders as a visible reason label ("Tradier: 6 legs exceeds ticket limit"), never a hidden control, never a dead link. Surfaces never lie (spec honesty law, cited).

**TL-L10 — No instruction, no persuasion.** The control carries no copy promoting Tradier beyond its name. It is a handoff, not a pitch; the partnership's member-facing offer lives on the Tradier breakout page, not in Labs surfaces.

---

## §4 Component inventory

| Component | Kind | Owner seat | Notes |
|---|---|---|---|
| C1 `tradeLinkAdapter` | Pure function, canonical trade → URL \| not_renderable | Alpha | Sits beside the TOS adapter; same input type |
| C2 `occSymbol` + root table | Pure function + data table | Alpha | Reusable by the brokerage adapter later; this spec does not wire that |
| C3 Tradier sibling control | UI control | Charlie | One component, mounted at every TOS-block site |
| C4 Fixture set | Test data | Kilo | Known fly (SPXW), known credit structure, known XSP, known over-cap structure, known unclassifiable expiration |

Site inventory for C3 is a W2 deliverable (Juliet enumerates every TOS-emitting surface from code, not memory): expected at minimum Options Lab Runner click, Analyzer, Strategy Lab Curate export.

---

## §5 Work packets

**W0 — Canonical-model verification (G-0).** Read-only. India (canonical truth) with Juliet: locate the canonical trade type, the TOS adapter, and every call site that produces a TOS string; confirm each call site goes through the adapter. No edits.
**Gate W0-G:** Outcome 1 or Outcome 2 stated with evidence. Outcome 1 → GO, proceed to G-A. Outcome 2 → NO-GO, stop, report to Coach; nothing further dispatches from this file.

**W1 — Adapter + root table + fixtures** (C1, C2, C4). Unit tests bind to the fixtures; the over-cap and unclassifiable fixtures assert the `not_renderable` reasons. TL-L6's post-Q1 behavior is shielded: the test asserts `leg_cap` is returned, not what the surface does with it.
**Gate W1-G:** tests green; AT-2 byte-compare passed on the fly fixture; `git diff --stat` allowlist matches declared files line by line. Explicit GO / NO-GO.

**W2 — Surface control at every TOS site** (C3). Requires G-C and G-D. Site inventory listed in the gate report with a screenshot per site.
**Gate W2-G:** AT-6 parity evidence for every inventoried site on StudioTwo; honest-label path shown for the over-cap fixture. Explicit GO / NO-GO.

**W3 — Live acceptance on Coach's account.** Requires G-E. Coach (or Coach with the bench observing) opens the fly fixture's URL on his own Tradier account.
**Gate W3-G:** AT-1 through AT-5 evidence pinned to machine + origin + time. Explicit GO / NO-GO.

**W4 — Promotion to production (MiniTwo).** Requires G-F. Deploy the proven build to MiniTwo in a market-closed window; rollback ready before the deploy; no change to Labs control surfaces or the data plane (TOPO-1 untouched — this feature makes no market-data call). Coach re-runs the fly fixture on his own account against production.
**Gate W4-G:** AT-7 evidence from the production surface Coach actually uses, pinned to machine + origin + time; rollback path recorded. Explicit GO / NO-GO.

**W5 — Close-out.** Same-day decision-log entry (DL-###), owning architecture doc updated, India drift check against the as-built adapter, Help-doc check for the Help Watch agent.
**Gate W5-G (final):** Full report to Coach, files changed, any deviation from this spec. Explicit GO / NO-GO.

Promotion to MiniTwo is a packet in this spec, not a later idea: the feature is done when it is live for members, not when it passes on dev. Orchestration runs the gate sequence and auto-GOes through clean gates; it stops and reports only on a problem. W0-G Outcome 2 is a problem. Grok Build dispatches and does not implement.

---

## §6 Acceptance tests

**AT-1 Editability.** The fly fixture URL opens on Coach's Tradier account as a staged ticket with every leg, side, quantity, and the limit price present and editable; nothing is submitted.
**AT-2 Encoding.** The fly fixture URL byte-matches a hand-built URL from the Tradier docs pattern, including encoded root spaces.
**AT-3 Root table.** The same strikes on an SPX AM-settled monthly render root `SPX`; on XSP render `XSP`.
**AT-4 Credit.** The credit fixture renders `type=credit` with the canonical price.
**AT-5 Refusal paths.** The over-cap fixture and the unclassifiable fixture each yield their `not_renderable` reason and the honest label; no link is rendered.
**AT-6 Parity.** For every site in the W2 inventory, the control is present where the TOS block is and absent everywhere else.
**AT-7 Production.** AT-1 repeated on labs.fattail.ai (MiniTwo) after promotion, from a member-role login as well as Coach's admin login.

Evidence standard: screenshots and logs pinned to machine + origin + time. Gate greens are proxies; nothing is done until seen on the surface Coach uses.

---

## §7 Recorded decisions (rationale given; Coach may override at approval)

**D1 — Refusal over guess.** An unclassifiable expiration or an over-cap structure returns `not_renderable` with a reason rather than a best-effort URL. Rationale: a wrong root or a truncated leg list produces a plausible-looking ticket for the wrong trade, which is the one failure the feature exists to prevent.

**D2 — Honest label over hidden control.** When the adapter refuses, the surface shows why instead of hiding the control. Rationale: a control that appears and disappears by trade reads as broken; a labeled refusal reads as a limit.

**D3 — Root table as data.** Rationale: the SPX/SPXW split is the only real logic in the feature, and it will grow (XSP, stocks with fractional strikes); a table is auditable, inline branches are not.

---

## §8 Open decisions requiring Coach (no defaults applied; silence does not decide)

**Q1 — Structures over four legs (Batman = 6).** Tradier documents multileg at up to four legs; Trade Link is not separately documented. Options: (a) test Trade Link with six legs on Coach's account before deciding; (b) render a Batman as two 3-leg tickets with two controls; (c) ship v1 with the honest refusal for over-cap structures and revisit. Consequences: (a) costs one test and may make the question moot; (b) adds a second-ticket law and a leg-splitting rule to TL-L4; (c) means the Batman — a house strategy — has no Tradier handoff at launch.

**Q2 — Visibility.** Show the control to every member, or only to members who have opted into the Tradier offer? Consequence: "everyone" needs no entitlement wiring; "opted-in" touches entitlement derivation, which would widen scope and require its own three-OK.

**Q3 — Duration.** `day` or `gtc` on the prefilled ticket.

**Q4 — Instrumentation.** Log Tradier-control clicks? Labs already instruments member actions; if yes, the click event feeds the Tradier breakout-page analytics; if no, nothing is recorded.

---

## §9 Explicitly out of scope

Order submission; account sync or position read-back; any Tradier API call; any change to the TOS adapter's output; any change to the canonical trade object; the Tradier subsidy, pricing cards, breakout page, and simulcast programs; partner demo accounts (Brian Vogelman, Kevin — separate admin task).

---

*Content hash: computed from disk at DL seating; not carried in this draft.*
