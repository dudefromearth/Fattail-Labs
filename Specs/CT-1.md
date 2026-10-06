# Canonical Trade Model and Broker Adapters (TOS, Tradier Trade Link) — Spec v0.7 (DRAFT — four trees; awaiting stamp)

**Version:** v0.7 (DRAFT — v0.6 plus Juliet's G-S ruling (DL-810: the admin click view is a fourth tree), Coach's ruling 2026-10-04 that the admin view is in this program, and two laws corrected to say exactly what Coach ruled: TL-L6, SF-L8)
**Supersedes:** `Canonical-Trade-Broker-Adapters-Spec-v0_6.md` (not seated), `…-v0_5.md` (intake), `…-v0_4.md` (GO), `…-v0_3.md`, `…-v0_2.md` (DRAFTs, NO-GO at Grok Advisor review 2026-10-03) and `Tradier-Trade-Link-Spec-v0_1.md` (DRAFT, NO-GO 2026-10-03); all left on disk as baselines. Also supersedes `Specs/FatTail-Labs-Tradier-Integration-Spec-v0.1.md` (Proposed 2026-08-13) and `Specs/FatTail-Labs-Tradier-Integration-STATUS.md` (paused 2026-08-16) per Coach's ruling 2026-10-03: that program is dead; this initiative replaces it. Its paused tree (`server/integrations/tradier`, migration 124) is **frozen — not extended, not deleted by this spec**. Its disposal is a separate decision-log entry.
**Date:** 2026-10-04
**Machine:** Build and prove on StudioTwo (dev); promote to MiniTwo (production, labs.fattail.ai) once proven. Specification only; files/trees touched by this document: NONE.
**Scope:** (1) A broker-neutral canonical trade model in FatTail Labs; (2) refactor of the as-built TOS script path so every TOS-emitting surface renders through one adapter from that model; (3) a Tradier Trade Link adapter beside it; (4) the sibling surface control; (5) architecture-doc amendment.
**Touches outside the adapter layer (W0 census DL-809 / REQ-025; G-S ruling DL-810):** Options Lab heatmap order block, Analyzer (`positionToTrade.ts` path), Practice trade log, **and the admin area (Tradier click view — in this program by Coach's ruling 2026-10-04)**. Strategy Lab Curate is **off**; the old prototype generator is **off**. **Four trees. DL-539 three-OK count: 0 of 3** (reset at DL-810). Three OKs on the GO token before the first edit. The first edit of any kind (W1) requires 3 of 3 on the GO token.
**Status:** DRAFT. **BUILD AUTHORITY: none.** Awaiting Coach stamp on this version and 3 of 3.
**Series ID:** CT-1 — assigned 2026-10-04 on intake (first ID of series CT). Source file `Specs/Canonical-Trade-Broker-Adapters-Spec-v0_7.md` unchanged.
**Canonical filename:** `Specs/CT-1.md`

**Parents (cited, not amended):**
- `web/lib/options-lab/tosGenerator.ts` (`generateTosScript`, `TosLeg`, `tosScriptPrice`) — as-built TOS path, to be refactored, not re-specified here.
- `web/lib/options-lab/positionTypes.ts` (`PositionInput`, `LegInput`), `web/lib/options-lab/positionToTrade.ts`, `web/lib/options-lab/tosParser.ts` (`ParsedTosTrade`) — as-built Analyzer book and script round-trip.
- PC-TOS-2 — script tracks current price (live mid when unlocked or CHECK PRICE-pending; member number when locked). Inherited as price law for every adapter.
- Options Lab Runner ToS order block ("Copy again" / "Open in Analyzer") — the control grammar the sibling inherits.
- Tradier Trade Link page, `docs.tradier.com/docs/trade-link` (read 2026-10-03). External wire format; cited, not law.

**What changed v0.6 → v0.7**

| Area | v0.6 | v0.7 |
|---|---|---|
| Admin click view | possible fourth tree (G-S open) | fourth tree (DL-810), in program by Coach's ruling; owner seat Conor; count 0 of 3 |
| TL-L6 | "one ticket per butterfly, however many; refuse non-butterflies" — wider than the ruling | exactly the ruling: a six-leg structure splits into two butterfly orders; anything else over four legs is Q9, open |
| SF-L8 | added per-member persistence on a named settings path — not ruled | exactly the ruling: member chooses day or GTC on the control, if G-T shows duration honored; persistence is Q10, open |

**What changed v0.5 → v0.6**

| Area | v0.5 | v0.6 |
|---|---|---|
| Site list | hypothesis | W0 result: heatmap order block, Analyzer, Practice trade log; Curate and prototype generator off |
| Q1 over four legs | open | **Ruled: split into component butterfly tickets** (TL-L6) |
| Q2 visibility / Q4 logging | open | **Ruled: every member; clicks instrumented and shown in admin** (SF-L7); admin surface raised as a possible fourth tree |
| Q5 open/close | open | **Ruled: v1 carries both** (CT-L2 binds; trade-log close drafts render in both adapters; TOS-L1 lists closes as an admitted change) |
| Q6 / Q7 AM-settled SPX | open | **Ruled: AM expirations are avoided.** Both adapters emit the caution instead of an order (CT-L4, TOS-L2, TL-L8) |
| Q3 duration | open | **Ruled: member chooses day or GTC** on the control (SF-L8), offered only if G-T shows `duration` is honored |
| Gates | G-B, G-C, G-E, G-F, G-Q7 open | closed by ruling; G-T and G-D remain |

**What changed v0.4 → v0.5** (advisories only; no law changed meaning)

| Area | v0.4 | v0.5 |
|---|---|---|
| §9.1 R2 row | pointed at the rejected `−abs` table | points at S1 |
| AT-7 / SF-L1 | no branch for a negative G-T | negative-G-T clause: script shows limit, ticket none, SF-L6 is the pass |
| C5 | listed SF-L1…L5 | lists SF-L6 |
| W0 | hypothesis | unchanged — still not the list |

**What changed v0.3 → v0.4**

| Area | v0.3 | v0.4 |
|---|---|---|
| Price normalization | locked feeders mapped `−abs(x)` — a locked credit became a debit | CT-L3: every feeder's sign is confirmed from code in W1 before it is law; locked credit stays a credit; AT-10 covers a credit package |
| Builder inputs | C1 allowed a stored script as a builder input, contradicting CT-L1 | CT-L6: script-only sites are refactored onto the book first; the parser never feeds the ticket; W0 classifies each site book-backed vs. script-only |
| Settlement class off SPX | required on every leg, defined for SPX only | CT-L4: SPX per Q6; XSP and equities carry PM (their only listed class), recorded as such; v1 root table unchanged |
| Leg order | CT-L5 said adapters never reorder; as-built sort lives in `generateTosScript` | CT-L5: the sort moves into the builder; W0 records where each site's order is set |
| §9 | F1 row pointed at the rejected v0.2 shape | F1 row points at R1 |

(Earlier change tables retained in v0.2 and v0.3 on disk.)


---

## §1 Purpose

Every surface that today emits a ThinkOrSwim order script renders it from one broker-neutral canonical trade through one TOS adapter, and renders a Tradier Trade Link beside it from the same object. The Trade Link opens a pre-populated, editable, **unsubmitted** ticket; the member reviews and sends. Prefill, not execution: it removes hand-typing risk and changes nothing about who places the trade.

---

## §2 Dependency gates

| Gate | What it is | Scope | State at writing |
|---|---|---|---|
| G-0 | **W0 census complete**: every `generateTosScript` caller and every inline `BUY`/`SELL … (Weeklys)` builder listed from code, with file paths | All packets | Outcome 2 established at review (no canonical model exists); census itself not yet run |
| G-A | Coach Phase-5 stamp (BUILD AUTHORITY). **Coach gate; never auto-GO** | All packets | Pending |
| G-T | **Trade Link parameter probe on Coach's Tradier account** (§6.1): does the ticket honor `price`, `type`, `duration`; is it editable; does a six-leg URL load all legs | TL-L5, TL-L6, TL-L7 binding; AT-3; informs Q1, Q3 | Pending — Coach can test Monday 2026-10-05 |
| G-B | Q1 resolved (over-four-leg behavior) | W3 binding of TL-L6 | **Closed 2026-10-04: split into butterfly tickets** |
| G-C | Q2 resolved (control visibility) | W4 | **Closed 2026-10-04: every member** |
| G-D | UX mockup of the sibling control approved by Coach (bench UX seat) | W4 | Not started |
| G-E | Q5 resolved (open/close in the model) | W1 model definition | **Closed 2026-10-04: both** |
| G-F | Q6 resolved (AM-settled SPX) | W1 builder (CT-L4), W2, W3 | **Closed 2026-10-04: AM avoided; caution emitted** — predicate below |
| G-Q7 | Q7 resolved (TOS AM-monthly output) | W2 AM-monthly fixture | **Closed 2026-10-04: caution text** |
| G-S | Admin click view: fourth tree? in program? | DL-539 count | **Closed: fourth tree (DL-810); in program (Coach 2026-10-04)** |
| G-P | W5-G GO on StudioTwo with evidence; rollback path named. **Coach gate; never auto-GO** | W6 promotion | Pending |

Nothing dispatches until G-A is GO (G-0 closed by DL-809). W1 additionally requires DL-539 3 of 3. W3's price/type/duration/leg-cap laws are shielded until G-T. Coach gates: **G-A, G-P, W6-G** — no others are Coach gates, and these are never auto-GOed.

---

## §3 Law catalogue

### Canonical model (CT)

**CT-L1 — One trade, one truth.** A single canonical trade type is the only representation any adapter reads. No adapter reads another adapter's output; `tosParser.ts` is not an upstream for anything after W2 (see CT-L6).

**CT-L2 — Leg fields (broker-neutral).** Each leg carries: underlying symbol; expiration date; settlement class (AM/PM); right (C/P); strike; signed quantity (long positive, short negative); open/close (**ruled: both carried in v1**; the trade log's close drafts — reversed sides, legs marked to close — build as closing trades). **No broker symbol, root, or product token is stored on the leg.** The trade carries: net price (`number | null`, signed per CT-L3); price source (locked member number vs. live mid, per PC-TOS-2); order type derived from a present price (debit if net < 0, credit if net > 0, even if net = 0; undefined if null).

**CT-L3 — Price is one field, one sign.** Canonical net price is signed: **credit positive, debit negative** (the `positionNetPremium` convention). Every feeder passes through one normalizer before the trade is built; no adapter reads a feeder directly. Reference convention on disk: `packageEconomics.ts` `signedMid` (credit > 0, debit < 0). **No feeder's mapping is law until W1 confirms its as-built shape from code**; this table records what is known and what must be confirmed, and W1-G replaces every "confirm" cell with the code-backed rule:

| Feeder | As-built shape | Sign carried by | Rule |
|---|---|---|---|
| `signedMid` (`packageEconomics.ts`) | signed, credit+/debit− | the value | identity |
| `packageDebitPerShare` (locked) | magnitude | **confirm in W1** — the package's `direction` / net sign, not the field | magnitude × confirmed sign; **a locked credit stays positive** |
| `net_debit_override` | magnitude | `direction === "sell"` or the net, per `positionToTrade.ts` — **confirm in W1** | magnitude × confirmed sign |
| `lastNatSigned` (live) | signed — **confirm in W1** | the value | mapped to credit+/debit− per the confirmed convention |
| `livePackagePerShare` (live) | **confirm in W1** | **confirm in W1** | mapped per the confirmed convention |

`−abs(x)` is not a legal rule for any feeder.

Missing price is `null` and refuses in every adapter (`not_renderable: no_price`); a present `0` is a legal even trade. Neither adapter ever emits `0.00` for a missing price. AT-10 proves the locked and live paths yield the same canonical number for the same package, for a debit package **and** a credit package.

**CT-L4 — Settlement class is data, not a root.** `settlementClass` (AM/PM) is set by the builder from the expiration. SPX: AM = the third-Friday monthly, PM = every other SPX expiration (the proposal, under Coach's ruling that AM expirations are avoided; Juliet lists any exception found in the chain data at W1-G). **House rule: an AM-settled trade is not an order.** Both adapters emit the caution text in place of a ticket (TOS-L2, TL-L8). XSP and equities/ETFs: PM, their only listed class, recorded as such (no predicate needed in v1; a future AM-settled product adds a predicate row, not a special case). It is the only thing a broker adapter needs to pick its own symbol; the pick happens inside that adapter.

**CT-L5 — Leg order.** Leg order is set once, in the builder, and adapters never reorder. The as-built strike sort inside `generateTosScript` moves into the builder for the sites that use it; W0 records, per site, where order is set today (the fly path sorts by strike; a Batman does not) so W1 reproduces it in the builder. TOS-L1 byte parity is the proof that order survived.

**CT-L6 — The parser never feeds the ticket.** A stored or copied script is not a builder input. W0 classifies every site as **book-backed** (holds a `PositionInput`-class object or a selection object) or **script-only** (holds only the script). A script-only site is refactored onto the book in W2 before it gets a Trade Link control; `tosParser.ts` is retired as an upstream, not promoted to one. If the census finds a script-only site, that is reported at W0-G as a scope line, and the DL-539 count is re-raised if it is a new tree.

### TOS adapter (TOS)

**TOS-L1 — Output unchanged.** For every trade in the fixture set, the refactored adapter's script is byte-identical to the as-built script, except for exceptions listed in W2's gate report. The only exceptions this spec admits: `@0.00 LMT` for a missing price becomes a refusal (CT-L3); an AM-settled trade emits the caution (TOS-L2); and **closing trades now emit closing semantics** (today's script writes a close as if it were an open — ruled Q5). Each listed in W2's gate report with before/after. No other difference is an allowed exception.

**TOS-L2 — Thinkorswim tokens stay Thinkorswim's.** The TOS adapter emits `(Weeklys)` for PM-settled expirations exactly as the as-built does. It never emits an OCC root. For an AM-settled expiration it emits no order; the script block shows exactly: **"Caution, morning expiration. Recommend selecting PM expiration."** (Coach, 2026-10-04.)

### Trade Link adapter (TL)

**TL-L1 — Output is a URL or an honest refusal.** One absolute URL, or `not_renderable` with a reason (`no_price`, `unknown_root`, `leg_cap`, …). Never partial, guessed, or silently malformed.

**TL-L2 — Prefill, never submit.** No Tradier API call, token, account ID, or credential. The frozen `server/integrations/tradier` tree is not imported.

**TL-L3 — Documented wire format (law).** Base `https://web.tradier.com/tradelink`. `symbol` is the **underlying** (SPX, XSP, ticker), never the option root. One leg → `class=option`, `option_symbol`, `side`, `quantity`. Two or more legs → `class=multileg`, zero-based `option_symbol[i]`, `side[i]`, `quantity[i]` in canonical leg order (CT-L5), brackets percent-encoded (`%5B`, `%5D`). **`quantity[i]` is the absolute value of the canonical signed quantity; direction is carried only by `side[i]`** (`buy_*` for positive, `sell_*` for negative; `_to_open`/`_to_close` per the leg's open/close). A negative quantity on the wire is a defect.

**TL-L4 — OCC symbol.** `<root><YY><MM><DD><C|P><strike × 1000, 8 digits>`, **unpadded** root, per Tradier's examples: `SPXW261009C06500000`.

**TL-L8 — Root table (Trade Link only).** The OCC root is looked up inside the Trade Link adapter from (underlying, settlementClass): SPX+PM → `SPXW`; XSP → `XSP`; equities/ETFs → ticker. **SPX+AM → `not_renderable: am_expiration`** with the TOS-L2 caution as the label (house rule; the `SPX` root is not emitted in v1). Unclassifiable → `unknown_root`; never guessed. No other adapter reads this table.

**TL-L5 — Price (gated on G-T).** If G-T shows the ticket honors `price`, the adapter writes the canonical net price (absolute value) and the derived `type` (`debit`/`credit`/`even`). If G-T shows it does not, the URL carries neither, and the control label says the ticket opens without a price. Either way the law binds only after G-T.

**TL-L6 — Six legs: split into two butterfly orders (ruled Q1, verbatim).** A six-leg structure composed of two butterflies is rendered as two tickets, one per butterfly, in canonical leg order; the control shows one link per ticket ("Tradier 1 of 2", "2 of 2"). How the canonical net price divides between the two is Q8 (open). Any other structure over four legs is Q9 (open); until ruled, the adapter emits nothing for it and the surface shows the honest label. G-T item 3 is informational only.

**TL-L7 — Duration (ruled Q3, gated on G-T).** The member chooses `day` or `gtc` on the control (SF-L8), and the chosen value is emitted. If G-T shows `duration` is not honored, no choice is offered, no `duration` is emitted, and SF-L6-style label says the ticket opens with Tradier's default.

### Surface (SF)

**SF-L1 — Same trade.** Where a TOS block renders, the Tradier control renders the **same** legs, sides, quantities, and price the script shows at that moment, from the same canonical object. If G-T is negative (the ticket ignores `price`), the script still shows its limit, the URL carries none, and SF-L6's label is the required behavior — not a parity failure. (Review F6, T2.)

**SF-L2 — Parity of placement.** The control appears exactly where a TOS block appears, nowhere else, in the block's existing minimal/compact grammar; opens a new tab; URL copyable like the script.

**SF-L3 — Honest refusal.** A `not_renderable` result renders a visible reason label, never a hidden control or dead link.

**SF-L4 — Login wall.** The control label or hover states that the ticket requires a Tradier login. (Review F9.)

**SF-L6 — No-price label.** When the trade's price is `null`, or when G-T has shown the ticket does not honor `price`, the control states that the ticket opens without a limit price. Distinct from SF-L4.

**SF-L5 — No pitch.** The control carries Tradier's name and nothing promotional. The member-facing offer lives on the Tradier breakout page.

**SF-L7 — Visibility and instrumentation (ruled Q2, Q4).** The control is shown to every member. Each click is recorded as its own event (Labs' existing recorder holds `page_views`; a Tradier click is not a page view, so this is a new event type on the existing instrumentation path, not a new store) and shown in the admin area (C8).

**SF-L8 — Duration choice (ruled Q3, verbatim).** The member chooses day or GTC on the control; the chosen value is emitted (TL-L7). Offered only if G-T shows the ticket honors `duration`. Whether the choice is remembered between uses is Q10 (open). Mockup through G-D.

---

## §4 Component inventory

| Component | Kind | Owner seat | Notes |
|---|---|---|---|
| C0 W0 census report | Document | India + Juliet | Every TOS call site and inline builder, with paths |
| C1 `CanonicalTrade` type + three builders: heatmap selection, Analyzer `PositionInput`, Practice trade log (open and close drafts) | Type + pure functions | Alpha | The single truth (CT-L1). Book objects only; never a script (CT-L6) |
| C2 Settlement predicate (Q6) + price normalizer (CT-L3) | Pure functions | Alpha | Broker-neutral; no root here |
| C3 TOS adapter (refactored `generateTosScript`) | Pure function | Alpha | TOS-L1 byte parity |
| C4 Trade Link adapter, incl. root table (TL-L8) | Pure function | Alpha | TL-L1…L8 |
| C5 Sibling control | UI | Charlie | SF-L1…L8; one link per ticket when TL-L6 splits |
| C8 Admin Tradier-click view | UI (admin) — fourth tree | Conor (admin area is his) | SF-L7; which admin page it lives on is a W4 mockup question through G-D |
| C6 Fixture set | Test data | Kilo | SPXW 1-2-1 fly; SPX AM-monthly fly; XSP fly; credit structure; six-leg structure (two flies; TL-L6 split fixture); trade-log close draft (both adapters); unclassifiable expiration; missing-price (`null`) trade; even (`0`) trade; same package locked and live, one debit and one credit (AT-10) |
| C7 Architecture-doc amendment | Doc | Lima | Canonical trade + adapter layer added to the owning architecture doc |

---

## §5 Work packets

**W0 — Census (G-0). DONE 2026-10-04 (DL-809 / REQ-025).** Read-only. Every `generateTosScript` caller and inline TOS builder listed with paths; every site that will carry the sibling control enumerated; each site classified book-backed or script-only (CT-L6); each site's as-built leg-order point recorded (CT-L5); each price feeder's sign convention located in code (CT-L3).
**Gate W0-G:** list attached, no edits; any script-only site or new tree raised to Coach as a scope line. GO / NO-GO.

**W1 — Canonical model + predicate + normalizer + fixtures** (C1, C2, C6). Requires G-E, G-F, and DL-539 3 of 3 (first edit).
**Gate W1-G:** type compiles; every book-backed W0 builder produces its fixtures with the surface's order (CT-L5); every CT-L3 "confirm" cell replaced with a code-backed rule; AT-10 passes for debit and credit; `git diff --stat` allowlist matches declared files. GO / NO-GO.

**W2 — TOS refactor** (C3) across every W0 site, including moving any script-only site onto the book (CT-L6). Requires G-Q7 for the AM-monthly fixture; other fixtures proceed.
**Gate W2-G:** TOS-L1 byte parity on the fixture set with only the admitted exceptions listed; TOS-L2 holds (no OCC root in any script); every W0 site renders through C3; `tosParser.ts` no longer upstream of any adapter. GO / NO-GO.

**W3 — Trade Link adapter** (C4). Documented parameters only until G-T; price/type/duration/leg-cap laws added after G-T and G-B.
**Gate W3-G:** AT-2 byte-compare on the fly fixture against a hand-built URL from Tradier's page; all quantities positive on the wire; refusal fixtures return their reasons. GO / NO-GO.

**W4 — Sibling control** (C5) at every W0 site, and the admin click view (C8). Requires G-D (mockups for both).
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
**AT-3 Price (post G-T).** If G-T is positive: the ticket shows the canonical price (absolute) and derived type. If negative: the URL carries none and SF-L6's label says so.
**AT-4 Root table (Trade Link).** SPX AM-monthly fixture renders root `SPX`; SPXW fixture renders `SPXW`; XSP renders `XSP`. The TOS script for the same fixtures contains no root (TOS-L2).
**AT-5 Refusals and splits.** Unclassifiable, AM-settled, non-decomposable over-cap, and missing-price (`null`) fixtures each refuse with their reason and label (the AM label is the TOS-L2 text verbatim); the even (`0`) fixture renders; the six-leg two-fly fixture renders two tickets. No link on a refusal.
**AT-11 Close.** A trade-log close draft renders a closing script (sides reversed, to-close) and a Trade Link with `*_to_close` sides; the as-built open-shaped close is listed as the before.
**AT-6 TOS parity.** TOS-L1 byte parity on the fixture set, listed exceptions only.
**AT-7 Same trade.** On each W0 site, the Trade Link's legs, sides, quantities, and price equal the script's at the same instant, including the locked and live-mid cases of PC-TOS-2. Negative-G-T branch: legs, sides, and quantities equal; the URL carries no price; SF-L6's label is present. That is the pass.
**AT-8 Placement parity.** Control present where the TOS block is, absent elsewhere, on every W0 site.
**AT-9 Production.** AT-1 and AT-7 repeated on labs.fattail.ai after promotion, member login and admin login.
**AT-10 One price.** The same package, locked and then unlocked at the same mid, yields the same canonical net price and the same script/URL price — run for a debit package and for a credit package; the credit stays positive on the canonical trade.

### §6.1 G-T probes (Coach, Monday 2026-10-05, own Tradier login)

These are **probes**, not the published pattern: `type`, `price`, and `duration` are orders-API parameters that the Trade Link page does not document. Expiration is **Friday 2026-10-09**, a live SPXW weekly (PM-settled, root `SPXW` under the proposed Q6). Strikes 6475/6500/6525 are placeholders in 25-point increments; before clicking, replace them with strikes near Monday's spot that exist in the chain, keeping the 1-2-1 spacing. Record: does the ticket show price/type/duration; are the fields editable; how many legs loaded; was anything submitted (it must not be).

1. Single leg, limit probe:
   `https://web.tradier.com/tradelink?class=option&symbol=SPX&option_symbol=SPXW261009C06500000&quantity=1&side=buy_to_open&type=limit&price=1.25&duration=day`
2. Three-leg fly, debit probe:
   `https://web.tradier.com/tradelink?class=multileg&symbol=SPX&type=debit&price=1.25&duration=day&option_symbol%5B0%5D=SPXW261009C06475000&side%5B0%5D=buy_to_open&quantity%5B0%5D=1&option_symbol%5B1%5D=SPXW261009C06500000&side%5B1%5D=sell_to_open&quantity%5B1%5D=2&option_symbol%5B2%5D=SPXW261009C06525000&side%5B2%5D=buy_to_open&quantity%5B2%5D=1`
3. Six-leg probe (a call fly plus a put fly; leg-count test only — not asserted to be the house Batman):
   `https://web.tradier.com/tradelink?class=multileg&symbol=SPX&type=debit&price=2.50&duration=day&option_symbol%5B0%5D=SPXW261009C06475000&side%5B0%5D=buy_to_open&quantity%5B0%5D=1&option_symbol%5B1%5D=SPXW261009C06500000&side%5B1%5D=sell_to_open&quantity%5B1%5D=2&option_symbol%5B2%5D=SPXW261009C06525000&side%5B2%5D=buy_to_open&quantity%5B2%5D=1&option_symbol%5B3%5D=SPXW261009P06500000&side%5B3%5D=buy_to_open&quantity%5B3%5D=1&option_symbol%5B4%5D=SPXW261009P06475000&side%5B4%5D=sell_to_open&quantity%5B4%5D=2&option_symbol%5B5%5D=SPXW261009P06450000&side%5B5%5D=buy_to_open&quantity%5B5%5D=1`
4. Control (documented parameters only), to separate "probe rejected" from "ticket broken": item 2 with `type`, `price`, and `duration` removed.

Evidence standard throughout: screenshots pinned to machine + origin + time; gate greens are proxies.

---

## §7 Recorded decisions (rationale given; Coach may override at approval)

**D1 — Refusal over guess** (unchanged). A wrong root, truncated leg list, or `0.00` price is a plausible ticket for the wrong trade — the one failure this program exists to prevent.
**D2 — Honest label over hidden control** (unchanged).
**D3 — Root table as data** (unchanged); the predicate itself is Q6, not a default.
**D4 — Signed price convention follows `positionNetPremium`** (credit positive, debit negative), with CT-L3's per-feeder normalization. Rationale: it is the convention already on disk; adapters take the absolute value where a broker wants it unsigned.
**D6 — Broker symbols live in broker adapters.** The canonical leg carries no root or product token. Rationale: a Tradier root in a Thinkorswim script is a wrong order; the ticket must be readable by any future adapter without knowing either broker's naming.
**D5 — The frozen August tree is frozen, not deleted, by this spec.** Rationale: deletion is a separate DL decision with its own blast radius (migration 124).

---

## §8 Decisions — Coach's rulings 2026-10-04 (verbatim intent; law references)

**Q1 — Over four legs:** "split into two butterfly orders" → TL-L6, verbatim.
**Q2 — Visibility:** everyone → SF-L7.
**Q3 — Duration:** "member should have choice of day or GTC" → TL-L7, SF-L8, verbatim (subject to G-T).
**Q4 — Instrumentation:** "instrumented in the admin" → SF-L7, C8. Fourth tree (DL-810); in program (Coach 2026-10-04: "this type of instrumentation is worthwhile"; Conor typically develops the admin view).
**Q5 — Open/close:** both opening and closing orders → CT-L2, TOS-L1 exception, AT-11.
**Q6 — AM-settled SPX:** "We avoid AM expirations" → CT-L4 house rule; third-Friday-monthly predicate stands as the detector.
**Q7 — TOS on an AM monthly:** "Caution, morning expiration. Recommend selecting PM expiration." → TOS-L2 verbatim; TL-L8 uses the same text as its refusal label.

### §8.1 Still open

**Q8 — Price split across the two butterfly tickets (TL-L6).** W3 proposes; Coach approves at W3-G. No default.
**Q9 — Structures over four legs that are not two butterflies.** Refuse with a label, or something else. No default; the adapter emits nothing for them until ruled.
**Q10 — Is the day/GTC choice remembered between uses?** No default; v1 offers the choice each time until ruled.
**G-T (Monday):** whether Tradier's ticket honors `price`, `type`, `duration`; whether it is editable. Determines TL-L5 and whether SF-L8 is offered.

---

## §9 Finding traceability (Grok Advisor review of v0.1, 2026-10-03)

| # | Severity | Finding | Disposition in v0.2 |
|---|---|---|---|
| F1 | BLOCKING | No canonical model; TOS built from a leg bag | Program widened; the v0.2 shape was rejected (R1). Closed by §9.1 R1: CT-L1, CT-L2, CT-L4, TOS-L2, TL-L8 |
| F2 | BLOCKING | Wire format contradicts Tradier's page | TL-L3, TL-L4 rewritten from the page; undocumented params gated on G-T |
| F3 | BLOCKING | Laws/ATs vote on Q3, price, type, open/close, root predicate | TL-L5/L6/L7 gated; Q5, Q6 added; AT-2 no longer includes duration or price |
| F4 | BLOCKING | Gate text contradicts itself; production auto-GO | W1-before-G-0 struck; G-A, G-P, W6-G Coach-only; "no change to Labs control surfaces" removed |
| F5 | BLOCKING | August Tradier program not superseded; OAuth tree could be wired in | Header supersession; tree frozen (D5); TL-L2 forbids import |
| F6 | BLOCKING | "Same trade" not tested; price fields can diverge | SF-L1; AT-7; PC-TOS-2 parent; price closed by §9.2 S1 |
| F7 | ADVISORY | AT-3 fixture missing | SPX AM-monthly fixture added to C6 |
| F8 | ADVISORY | Bracket encoding, zero limit | TL-L3 encodes brackets; CT-L3 refuses missing price |
| F9 | ADVISORY | Login wall, copy | SF-L4 added; SF-L5 kept |

Nothing dropped.

### §9.1 Grok Advisor review of v0.2 (2026-10-03)

| # | Severity | Finding | Disposition in v0.3 |
|---|---|---|---|
| R1 | BLOCKING | Canonical leg carried the root; CT-L4 pushed it into the TOS script (F1 reopened) | Root removed from the leg (CT-L2); settlement class only (CT-L4); root table moved into the Trade Link adapter (TL-L8); TOS keeps `(Weeklys)` (TOS-L2); AM-monthly token is Q7; D6 |
| R2 | BLOCKING | Two price feeders, no sign law; even vs missing conflated (F6 reopened) | v0.3's table was rejected (S1). Closed by §9.2 S1: no feeder rule is law until W1 reads the code, `−abs` illegal, AT-10 runs a credit package; `null` refuses, `0` is even |
| R3 | BLOCKING | §6.1 used an expired, AM-root contract; probe types unlabeled; item 3 not a URL; signed quantity could hit the wire | §6.1 rewritten: live 261009 SPXW, labeled probes, four full URLs incl. a control; TL-L3 absolute quantity |
| R4 | BLOCKING | G-T bound the wrong ATs; change table named G-F/W4 as Coach gates; two DL-539 counts (F3/F4 reopened) | G-T binds AT-3/Q1/Q3; Coach gates stated once as G-A, G-P, W6-G; AT-3 → SF-L6; single DL-539 statement in header, W1 is the first edit |
| R5 | ADVISORY | Census open; C1 named a builder with no known input; leg order unwritten | Header and C1 mark the three trees as hypothesis pending W0; builders are one-per-W0-site with inputs from the census; CT-L5 leg order |

Nothing dropped.

### §9.2 Grok Advisor review of v0.3 (2026-10-03)

| # | Severity | Finding | Disposition in v0.4 |
|---|---|---|---|
| S1 | BLOCKING | Locked rows of CT-L3 forced `−abs(x)`; a locked credit became a debit (R2/F6 not closed) | CT-L3 rewritten: `signedMid` is the reference; no feeder rule is law until W1 confirms its sign from code; `−abs(x)` declared illegal; AT-10 runs a credit package |
| S2 | BLOCKING | C1 allowed a stored script as builder input; contradicts CT-L1 | CT-L6; C1 restricted to book objects; W0 classifies sites; script-only sites refactored onto the book in W2 |
| S3 | ADVISORY | §9 F1 row pointed at the rejected shape | F1 row now points at R1 |
| S4 | ADVISORY | Settlement class undefined off SPX | CT-L4: XSP and equities carry PM as their only listed class |
| S5 | ADVISORY | W0 open; DL-539 count pinned to a hypothesis; strike sort location | Header: count resets if W0 adds a tree; CT-L5: sort moves into the builder; W0 records order points |

Nothing dropped.

### §9.3 Grok Advisor review of v0.4 (2026-10-03) — GO for intake

| # | Severity | Finding | Disposition in v0.5 |
|---|---|---|---|
| T1 | ADVISORY | §9.1 R2 row pointed at the rejected table | R2 row points at S1 |
| T2 | ADVISORY | AT-7 had no branch for a negative G-T | SF-L1 and AT-7 carry the negative-G-T clause |
| T3 | ADVISORY | C5 did not list SF-L6 | C5 lists SF-L1…L6 |
| T4 | ADVISORY | W0 still open | Unchanged by design: the three surfaces remain a hypothesis until the census |

Nothing dropped.

---

## §10 Explicitly out of scope

Order submission; account sync or position read-back; any Tradier API call; disposal of the frozen August tree; the Tradier subsidy, pricing cards, breakout page, and simulcast; partner demo accounts.

---

*Series ID CT-1. Seated 2026-10-04. Source draft `Specs/Canonical-Trade-Broker-Adapters-Spec-v0_7.md` unchanged. BUILD AUTHORITY: none. Content hash is not carried until the stamp.*
