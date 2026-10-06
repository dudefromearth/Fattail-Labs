# Review request: Canonical Trade Model and Broker Adapters — Spec v0.2 (DRAFT)

**Machine:** StudioTwo (dev). Read-only; this packet authorizes no edits and no file placement.
**To:** Grok Advisor (adversarial review seat)
**From:** Coach
**Document under review:** reproduced in full below. Supersedes v0.1, which you reviewed NO-GO on 2026-10-03.

## What to do

1. **Finding traceability.** §9 dispositions each of your nine v0.1 findings. Confirm each is actually closed by the cited law, gate, or test — or reopen it with the reason. A disposition that names a section which does not do the job is a finding.
2. **Doctrine and architecture.** Same pass as before, now against the widened program: CT-L1…L4 versus the as-built `tosGenerator.ts` / `positionToTrade.ts` / `tosParser.ts` path; the three-tree touch and its DL-539 count in the header; the frozen-tree ruling (D5, TL-L2).
3. **Spec integrity.** No defaults masquerading as decisions (Q1–Q6 are the open set; nothing elsewhere answers them); G-T gating holds for every undocumented Trade Link parameter; header/filename/version consistent; §6.1 URLs are well-formed against Tradier's published page.

## Report format

Verdict line (GO / NO-GO for intake, one sentence why); numbered prose findings by severity, each **BLOCKING** or **ADVISORY**, never conflated; "Notes without findings"; "Summary for Coach" in plain language, no agent labels.

## Stop conditions

- A prior spec in `~/FatTail-Labs/Specs/` other than the two named in the header's supersession line — report and stop.
- Any doubt about the W0 census result — state it as a finding; do not resolve by assumption.

---
---

# Canonical Trade Model and Broker Adapters (TOS, Tradier Trade Link) — Spec v0.2 (DRAFT)

**Version:** v0.2 (DRAFT)
**Supersedes:** `Tradier-Trade-Link-Spec-v0_1.md` (DRAFT, NO-GO at Grok Advisor review 2026-10-03; left on disk as baseline). Also supersedes `Specs/FatTail-Labs-Tradier-Integration-Spec-v0.1.md` (Proposed 2026-08-13) and `Specs/FatTail-Labs-Tradier-Integration-STATUS.md` (paused 2026-08-16) per Coach's ruling 2026-10-03: that program is dead; this initiative replaces it. Its paused tree (`server/integrations/tradier`, migration 124) is **frozen — not extended, not deleted by this spec**. Its disposal is a separate decision-log entry.
**Date:** 2026-10-03
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven. Specification only; files/trees touched by this document: NONE.
**Scope:** (1) A broker-neutral canonical trade model in FatTail Labs; (2) refactor of the as-built TOS script path so every TOS-emitting surface renders through one adapter from that model; (3) a Tradier Trade Link adapter beside it; (4) the sibling surface control; (5) architecture-doc amendment.
**Touches outside the adapter layer:** Options Lab heatmap order block, Analyzer (`positionToTrade.ts` path), Strategy Lab Curate export, and any other TOS-emitting surface the W0 census finds. Three trees. **DL-539 three-OK count: 1 of 3** (Coach's instruction 2026-10-03 to write this program). Two further OKs on the GO token before the first edit.
**Status:** DRAFT. **BUILD AUTHORITY: none.**
**Canonical filename:** provisional — assigned the next free `Specs/` series ID at Juliet intake. Header, filename, and footer change together when it lands.

**Parents (cited, not amended):**
- `web/lib/options-lab/tosGenerator.ts` (`generateTosScript`, `TosLeg`, `tosScriptPrice`) — as-built TOS path, to be refactored, not re-specified here.
- `web/lib/options-lab/positionTypes.ts` (`PositionInput`, `LegInput`), `web/lib/options-lab/positionToTrade.ts`, `web/lib/options-lab/tosParser.ts` (`ParsedTosTrade`) — as-built Analyzer book and script round-trip.
- PC-TOS-2 — script tracks current price (live mid when unlocked or CHECK PRICE-pending; member number when locked). Inherited as price law for every adapter.
- Options Lab Runner ToS order block ("Copy again" / "Open in Analyzer") — the control grammar the sibling inherits.
- Tradier Trade Link page, `docs.tradier.com/docs/trade-link` (read 2026-10-03). External wire format; cited, not law.

**What changed v0.1 → v0.2**

| Area | v0.1 | v0.2 |
|---|---|---|
| Program | Trade Link adapter beside an assumed canonical model | Canonical model + TOS refactor + Trade Link adapter (G-0 Outcome 2 confirmed by review) |
| Wire format | `dash.tradier.com`, padded OCC roots, `type=debit|credit`, `price`, `duration` as law | `web.tradier.com`, unpadded symbols, only documented parameters as law; the rest gated on G-T |
| Open questions | Q1–Q4 | Q1–Q4 kept; Q5 open/close, Q6 SPX root predicate added; `duration`/`price`/`type` no longer voted by law or AT |
| Gates | W1 could start on G-A alone; W4 auto-GO | Nothing before G-0 + G-A; G-A, G-F, W4 are Coach gates, never auto-GO |
| Supersession | none | August Tradier sync program superseded; its tree frozen |
| Parity AT | control presence | same legs, sides, quantities, price as the script on that surface |

---

## §1 Purpose

Every surface that today emits a ThinkOrSwim order script renders it from one broker-neutral canonical trade through one TOS adapter, and renders a Tradier Trade Link beside it from the same object. The Trade Link opens a pre-populated, editable, **unsubmitted** ticket; the member reviews and sends. Prefill, not execution: it removes hand-typing risk and changes nothing about who places the trade.

---

## §2 Dependency gates

| Gate | What it is | Scope | State at writing |
|---|---|---|---|
| G-0 | **W0 census complete**: every `generateTosScript` caller and every inline `BUY`/`SELL … (Weeklys)` builder listed from code, with file paths | All packets | Outcome 2 established at review (no canonical model exists); census itself not yet run |
| G-A | Coach Phase-5 stamp (BUILD AUTHORITY). **Coach gate; never auto-GO** | All packets | Pending |
| G-T | **Trade Link parameter test on Coach's Tradier account** (§6.1): does the ticket honor `price`, `type`, `duration`; is it editable; does a six-leg URL load all legs | TL-L5, TL-L6, TL-L7 binding; AT-5, AT-6 | Pending — Coach can test Monday 2026-10-05 |
| G-B | Q1 resolved (over-four-leg behavior), informed by G-T | W3 binding of TL-L6 | Open |
| G-C | Q2 resolved (control visibility) | W4 | Open |
| G-D | UX mockup of the sibling control approved by Coach (bench UX seat) | W4 | Not started |
| G-E | Q5 resolved (open/close in the model) | W1 model definition | Open |
| G-F | Q6 resolved (SPX root predicate) | W1 root table | Open |
| G-P | W5-G GO on StudioTwo with evidence; rollback path named. **Coach gate; never auto-GO** | W6 promotion | Pending |

Nothing dispatches until G-0 and G-A are GO. W1 additionally requires G-E and G-F. W3's price/type/duration/leg-cap laws are shielded until G-T.

---

## §3 Law catalogue

### Canonical model (CT)

**CT-L1 — One trade, one truth.** A single canonical trade type is the only representation any adapter reads. No adapter reads another adapter's output; `tosParser.ts` is not an upstream for anything after W2.

**CT-L2 — Leg fields.** Each leg carries: underlying symbol; option root (from the root table, CT-L4); expiration date; settlement class (AM/PM); right (C/P); strike; signed quantity (long positive, short negative); open/close (per Q5). The trade carries: net price (signed: debit negative, credit positive, matching `positionNetPremium`); price source (locked member number vs. live mid, per PC-TOS-2); order type derived (debit if net < 0, credit if net > 0, even if 0).

**CT-L3 — Price is one field.** Every adapter writes the trade's net price. `tosScriptPrice` and `net_debit_override` both feed the canonical price before any adapter runs; no adapter computes its own. A missing price is a refusal in every adapter (`not_renderable: no_price`), never `0.00`.

**CT-L4 — Root table.** Option roots come from a lookup table keyed by underlying and the Q6 predicate. Initial rows: SPX → `SPX` or `SPXW` per Q6; XSP → `XSP`; equities/ETFs → ticker. An unclassifiable expiration refuses (`unknown_root`); no adapter guesses. The TOS adapter's hardcoded `(Weeklys)` is replaced by the table's output.

### TOS adapter (TOS)

**TOS-L1 — Output unchanged.** For every trade in the fixture set, the refactored adapter's script is byte-identical to the as-built adapter's script, except where the as-built was wrong (AM-monthly `(Weeklys)` label, `@0.00 LMT`). Those exceptions are listed in W2's gate report, not discovered in production.

### Trade Link adapter (TL)

**TL-L1 — Output is a URL or an honest refusal.** One absolute URL, or `not_renderable` with a reason (`no_price`, `unknown_root`, `leg_cap`, …). Never partial, guessed, or silently malformed.

**TL-L2 — Prefill, never submit.** No Tradier API call, token, account ID, or credential. The frozen `server/integrations/tradier` tree is not imported.

**TL-L3 — Documented wire format (law).** Base `https://web.tradier.com/tradelink`. `symbol` is the **underlying** (SPX, XSP, ticker), never the option root. One leg → `class=option`, `option_symbol`, `side`, `quantity`. Two or more legs → `class=multileg`, zero-based `option_symbol[i]`, `side[i]`, `quantity[i]` in canonical leg order, brackets percent-encoded (`%5B`, `%5D`). Sides: `buy_to_open`, `sell_to_open`, `buy_to_close`, `sell_to_close`.

**TL-L4 — OCC symbol.** `<root><YY><MM><DD><C|P><strike × 1000, 8 digits>`, **unpadded** root, per Tradier's examples: `SPXW251017C05800000`.

**TL-L5 — Price (gated on G-T).** If G-T shows the ticket honors `price`, the adapter writes the canonical net price (absolute value) and the derived `type` (`debit`/`credit`/`even`). If G-T shows it does not, the URL carries neither, and the control label says the ticket opens without a price. Either way the law binds only after G-T.

**TL-L6 — Leg cap (gated on G-T, G-B).** Behavior for structures over four legs is Q1. Until G-B, the adapter refuses them (`leg_cap`) and the surface shows the honest label.

**TL-L7 — Duration (gated on G-T, Q3).** No `duration` parameter is emitted until G-T shows it is honored and Q3 picks a value.

### Surface (SF)

**SF-L1 — Same trade.** Where a TOS block renders, the Tradier control renders the **same** legs, sides, quantities, and price the script shows at that moment, from the same canonical object. (Review F6.)

**SF-L2 — Parity of placement.** The control appears exactly where a TOS block appears, nowhere else, in the block's existing minimal/compact grammar; opens a new tab; URL copyable like the script.

**SF-L3 — Honest refusal.** A `not_renderable` result renders a visible reason label, never a hidden control or dead link.

**SF-L4 — Login wall.** The control label or hover states that the ticket requires a Tradier login. (Review F9.)

**SF-L5 — No pitch.** The control carries Tradier's name and nothing promotional. The member-facing offer lives on the Tradier breakout page.

---

## §4 Component inventory

| Component | Kind | Owner seat | Notes |
|---|---|---|---|
| C0 W0 census report | Document | India + Juliet | Every TOS call site and inline builder, with paths |
| C1 `CanonicalTrade` type + builders from `PositionInput` and from heatmap tile selection | Type + pure functions | Alpha | The single truth (CT-L1) |
| C2 Root table + Q6 predicate | Data + pure function | Alpha | Reusable later by any brokerage adapter |
| C3 TOS adapter (refactored `generateTosScript`) | Pure function | Alpha | TOS-L1 byte parity |
| C4 Trade Link adapter | Pure function | Alpha | TL-L1…L7 |
| C5 Sibling control | UI | Charlie | SF-L1…L5 |
| C6 Fixture set | Test data | Kilo | SPXW 1-2-1 fly; **SPX AM-monthly fly** (review F7); XSP fly; credit structure; six-leg Batman; unclassifiable expiration; missing-price trade |
| C7 Architecture-doc amendment | Doc | Lima | Canonical trade + adapter layer added to the owning architecture doc |

---

## §5 Work packets

**W0 — Census (G-0).** Read-only. Every `generateTosScript` caller and inline TOS builder listed with paths; every site that will carry the sibling control enumerated.
**Gate W0-G:** list attached, no edits. GO / NO-GO.

**W1 — Canonical model + root table + fixtures** (C1, C2, C6). Requires G-E, G-F.
**Gate W1-G:** type compiles; builders from both as-built inputs produce the fixtures; root table returns the Q6 answer for every fixture; `git diff --stat` allowlist matches declared files. GO / NO-GO.

**W2 — TOS refactor** (C3) across every W0 site. Three trees — **first edit requires three-OK count 3 of 3.**
**Gate W2-G:** TOS-L1 byte parity on the fixture set, exceptions listed; every W0 site now renders through C3; `tosParser.ts` no longer upstream of any adapter. GO / NO-GO.

**W3 — Trade Link adapter** (C4). Documented parameters only until G-T; price/type/duration/leg-cap laws added after G-T and G-B.
**Gate W3-G:** AT-2 byte-compare on the fly fixture against a hand-built URL from Tradier's page; refusal fixtures return their reasons. GO / NO-GO.

**W4 — Sibling control** (C5) at every W0 site. Requires G-C, G-D.
**Gate W4-G:** AT-7 same-trade and AT-8 parity evidence, one screenshot per site, on StudioTwo. GO / NO-GO.

**W5 — Live acceptance on Coach's account.** AT-1, AT-3, AT-4 on StudioTwo.
**Gate W5-G:** evidence pinned to machine + origin + time. GO / NO-GO.

**W6 — Promotion to MiniTwo.** Requires G-P (**Coach GO**). Market-closed window; rollback ready before deploy.
**Gate W6-G:** AT-9 on production from a member-role login and Coach's admin login. **Coach GO**, never auto-GO.

**W7 — Close-out** (C7). Same-day DL-### entry (this program; a second entry recording the August Tradier program as superseded), architecture doc amended, India drift check, Help-doc check.
**Gate W7-G (final):** full report to Coach, files changed, deviations. GO / NO-GO.

Orchestration auto-GOes through clean implementer gates (W0-G, W1-G, W2-G, W3-G, W4-G, W5-G, W7-G) and stops on any problem. G-A, G-P, and W6-G are Coach's and are never auto-GOed. Grok Build dispatches and does not implement.

---

## §6 Acceptance tests

**AT-1 Editability.** The fly fixture URL opens on Coach's Tradier account as a staged ticket with every leg, side, and quantity present and editable; nothing submitted.
**AT-2 Encoding.** Fly fixture URL byte-matches a hand-built URL from Tradier's published pattern (unpadded symbols, encoded brackets, underlying in `symbol`).
**AT-3 Price (post G-T).** If G-T is positive: the ticket shows the canonical price and derived type. If negative: the URL carries none and SF-L4's label says so.
**AT-4 Root table.** SPX AM-monthly fixture renders root `SPX` per Q6; SPXW fixture renders `SPXW`; XSP renders `XSP`.
**AT-5 Refusals.** Over-cap (until G-B), unclassifiable, and missing-price fixtures each refuse with their reason and the honest label; no link rendered.
**AT-6 TOS parity.** TOS-L1 byte parity on the fixture set, listed exceptions only.
**AT-7 Same trade.** On each W0 site, the Trade Link's legs, sides, quantities, and price equal the script's at the same instant, including the locked and live-mid cases of PC-TOS-2.
**AT-8 Placement parity.** Control present where the TOS block is, absent elsewhere, on every W0 site.
**AT-9 Production.** AT-1 and AT-7 repeated on labs.fattail.ai after promotion, member login and admin login.

### §6.1 G-T test script (Coach, Monday, own Tradier login)

Open each; record whether price/type/duration appear, whether fields are editable, and how many legs load.

1. `https://web.tradier.com/tradelink?class=option&symbol=SPX&option_symbol=SPXW251017C05800000&quantity=1&side=buy_to_open&type=limit&price=1.25&duration=day`
2. `https://web.tradier.com/tradelink?class=multileg&symbol=SPX&type=debit&price=1.25&duration=day&option_symbol%5B0%5D=SPXW251017C05775000&side%5B0%5D=buy_to_open&quantity%5B0%5D=1&option_symbol%5B1%5D=SPXW251017C05800000&side%5B1%5D=sell_to_open&quantity%5B1%5D=2&option_symbol%5B2%5D=SPXW251017C05825000&side%5B2%5D=buy_to_open&quantity%5B2%5D=1`
3. Six-leg Batman: the URL in (2) extended with legs 3–5 (`SPXW251017P05800000` buy 1, `SPXW251017P05775000` sell 2, `SPXW251017P05750000` buy 1).

Evidence standard throughout: screenshots pinned to machine + origin + time; gate greens are proxies.

---

## §7 Recorded decisions (rationale given; Coach may override at approval)

**D1 — Refusal over guess** (unchanged). A wrong root, truncated leg list, or `0.00` price is a plausible ticket for the wrong trade — the one failure this program exists to prevent.
**D2 — Honest label over hidden control** (unchanged).
**D3 — Root table as data** (unchanged); the predicate itself is Q6, not a default.
**D4 — Signed price convention follows `positionNetPremium`** (credit positive, debit negative). Rationale: it is the convention already on disk; adapters take the absolute value where a broker wants it unsigned.
**D5 — The frozen August tree is frozen, not deleted, by this spec.** Rationale: deletion is a separate DL decision with its own blast radius (migration 124).

---

## §8 Open decisions requiring Coach (no defaults applied; silence does not decide)

**Q1 — Structures over four legs.** Informed by G-T item 3. (a) Trade Link accepts six → no cap law; (b) render as two tickets; (c) honest refusal at launch.
**Q2 — Visibility.** All members, or Tradier-opted only (touches entitlement; would need its own three-OK).
**Q3 — Duration.** `day` or `gtc`, after G-T shows it is honored.
**Q4 — Instrumentation.** Log Tradier-control clicks?
**Q5 — Open/close.** Does the canonical model carry closing legs in v1 (for exit scripts), or is v1 open-only with the field reserved? The as-built TOS path is open-only.
**Q6 — SPX root predicate.** Proposed: `SPX` only for the AM-settled third-Friday monthly; every other SPX expiration is `SPXW`. Confirm, or state the cases this misses.

---

## §9 Finding traceability (Grok Advisor review of v0.1, 2026-10-03)

| # | Severity | Finding | Disposition in v0.2 |
|---|---|---|---|
| F1 | BLOCKING | No canonical model; TOS built from a leg bag | Program widened: CT-L1…L4, W0, W1, W2 |
| F2 | BLOCKING | Wire format contradicts Tradier's page | TL-L3, TL-L4 rewritten from the page; undocumented params gated on G-T |
| F3 | BLOCKING | Laws/ATs vote on Q3, price, type, open/close, root predicate | TL-L5/L6/L7 gated; Q5, Q6 added; AT-2 no longer includes duration or price |
| F4 | BLOCKING | Gate text contradicts itself; production auto-GO | W1-before-G-0 struck; G-A, G-P, W6-G Coach-only; "no change to Labs control surfaces" removed |
| F5 | BLOCKING | August Tradier program not superseded; OAuth tree could be wired in | Header supersession; tree frozen (D5); TL-L2 forbids import |
| F6 | BLOCKING | "Same trade" not tested; price fields can diverge | CT-L3 single price field; SF-L1; AT-7; PC-TOS-2 cited as parent |
| F7 | ADVISORY | AT-3 fixture missing | SPX AM-monthly fixture added to C6 |
| F8 | ADVISORY | Bracket encoding, zero limit | TL-L3 encodes brackets; CT-L3 refuses missing price |
| F9 | ADVISORY | Login wall, copy | SF-L4 added; SF-L5 kept |

Nothing dropped.

---

## §10 Explicitly out of scope

Order submission; account sync or position read-back; any Tradier API call; disposal of the frozen August tree; the Tradier subsidy, pricing cards, breakout page, and simulcast; partner demo accounts.

---

*Content hash: computed from disk at DL seating; not carried in this draft.*
