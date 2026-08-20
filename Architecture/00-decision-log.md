# FatTail Labs — Architecture Decision Log

Append-only. Each entry: date, decision, rationale. Reversals get a new entry, never an edit.

---

## 2026-08-20 — DL-467 Canvas Position alerts hit per-card at-expiration (MSC grammar, no picker)

**Decision:** Coach: Position alerts are **active on the canvas**, as an
extension of canvas apply. **Refer to MSC** for the grammar: 8px vertical
hit, hover thickens the curve, right-click opens a position-only menu,
left-click still pans. Labs does **not** copy MSC’s multi-position
**picker**. Hit-test each Shown card’s **at-expiration** P&L at the cursor
price; closest ≤ 8px wins; menu binds that `position_id` only.

**Does not:** MiniTwo; Packet C2 GO / viewport W-G; T+0 as a second hit
target; Manager HTTP swap.

---

## 2026-08-20 — DL-466 Analyzer canvas-apply prototype reachable (accept as-built)

**Decision:** W0-G named the Analyzer right-click alert menu **reachable**
in the local working tree (`HostPnLChart` `contextmenu` + Builder
callbacks; no off-switch). Coach at W0-BA: **accept as-built** for that
prototype. Not Packet C2 GO. AT-ALB-2/3/4/8/15 still required at C2-G
after both viewport W-G + India C2-0 + C2-BA. MiniTwo not implied.

**Does not:** keep-dark (D0-1 not fired); ship canvas apply as gated
product; MiniTwo.

---

## 2026-08-20 — DL-465 Labs Alerts bench plan (board `p-alerts`)

**Decision:** Coach stamped
`docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md` **v1.0.3**. Board
`agents/p-alerts/`. W0-BA names Packet **M** and Packet **C1**. Packet
**C2** blocked until `p-az-viewport-2d` W-G **and**
`p-az-viewport-return` W-G. HIG conversion is packet work (FP14 · §8.5).

**Does not:** MiniTwo; C2 fire; SMS/email live; delete chrome.

---

## 2026-08-20 — DL-464 Labs-wide Alerts Manager (suite hooks)

**Decision:** Coach: **Alerts Manager + API** is Labs-wide. Alert **instances
are authored and held in the app they belong to**. **Settings, configuration,
and stats** live in the Manager — user menu **Alerts** (`/app/alerts`) and/or
**Settings → Alerts**. **Every App Suite** registers a hook and **its own
alert types**. Analyzer (canvas / position / Builder) is the first client.
Spec: `Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md` (canonical draft
§3.2). First-client spec:
`Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`
(cites §3.2; does not fork a second wire).

**Does not:** implement the HTTP manager in this decision; MiniTwo until asked.

**Same-day clarifications (India review ALB-B1 / B2 · A1–A4 — not a
reversal):**

1. **One draft table.** ALM §3.2 is canonical. Every draft **always**
   includes `suite` and `severity`. Analyzer stamps `suite: options_lab`
   (adapter constant) and named default **`severity: medium`**. Builder v1
   has no severity field (deferred). `POST` without either is 4xx.
2. **Delete is deliberately unshipped in v1.** Holder has no delete
   chrome; Manager index has no delete control. `DELETE` may exist later
   if Coach adds it. Missing delete is **not** a spec gap.
3. **Canvas-apply sequencing (ALB-B1).** Analyzer canvas apply lives on
   `HostPnLChart` (same files as Packet A). BUILD of canvas-apply is
   **downstream of** `p-az-viewport-2d` W-G **and** `p-az-viewport-return`
   W-G; **India names the lock handoff**. Builder dialog + adapter are
   new files and **may BUILD earlier**. Manager app shell / settings /
   API are **independent** of the viewport tangle.
4. **Unbound `local_ref` (ALB-A1).** Card gone → alert stays listed,
   marked Unbound, never Active; member edits or it expires. Hidden is
   still bound. Write before the adapter swap.
5. **Arch 28 (ALB-A2).** One-socket law is **market data**.
   `/api/me/alerts/stream` is a member-identity WS/SSE — lawful, not a
   second market socket, not precedent for one. India W0 restates.
6. **Tango (ALB-A3).** “P&L above 200 is a number, not a promise.”
   Member-authored thresholds are process telemetry; Labs copy
   invariants govern what Labs says, not what members set.
7. **Adapter-swap AT (ALB-A4).** AT-ALB-1…4 must still PASS when the
   adapter points at the manager instead of the session stub.

---

## 2026-08-20 — DL-463 Analyzer Alert Builder hooks Labs-wide Alerts Manager

**Decision:** Coach: Analyzer canvas + Alert Builder follow MSC apply
(Canvas vs Position). Holder is the left inspector (info + Active/Idle).
Labs will have a separate **Alerts Manager + API**. Analyzer **hooks** that
manager (`source_system: analyzer_risk_graph`) and must not become a second
closed alert center. Spec:
`Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`.

**Does not:** ship the Manager/API in this spec; MiniTwo until asked.
Canvas-apply BUILD waits on viewport W-G (DL-464 sequencing). Delete
unshipped v1.

---

## 2026-08-20 — DL-462 Autofit when a book appears on an empty canvas

**Decision:** Coach: if the Analyzer canvas has **no positions** and then
positions **appear** — Show, Create, paste, or any other path — **Autofit
must run**. A pan/zoom of the empty GEX/grid view does not keep the lock
across that transition (`book-appear` / `empty-to-book`). VP-A1 still
holds when a shown book already exists: Show/Hide of a sibling does not
steal the window.

**Does not:** Autofit on hide; Autofit on live ticks; MiniTwo until asked.

---

## 2026-08-20 — DL-461 Analyzer GEX without a shown position

**Decision:** Coach: GEX on the Analyzer host **displays even when no
positions are showing** (empty book or every card hidden). GEX is
chain-attached (AZ-VP-2), not a second position book. Horizon is the
shown card’s expiration when one exists, else the Range listed date,
else the first listed expiration. Hide/empty book still paints bars,
scales, and grid. Curves/tents still follow AZ-FOCUS-3 (no fabricated
package P&L).

**Does not:** Autofit the full chain; change GEX formula; MiniTwo until
asked.

---

## 2026-08-20 — DL-460 Analyzer dollar-axis grid (ToS-style 1–2–5)

**Decision:** Coach adopted a Thinkorswim-style **nice-interval** grid on the
Analyzer host canvas. P&L **Y** and underlier **X** each pick a
**1–2–5 × 10ⁿ** step with a **$10 floor**, aiming for **≥10** grid lines
when the visible span allows and **capping ~20** so labels stay readable.
If even $10 cannot produce 10 lines, stay at $10 — do not invent $1/$2/$5.
The two axes choose independently (they zoom separately). GEX right-hand
scales are **not** dollars and keep their own ticks.

**Does not:** lock to only $10/$100/$1000; change Autofit; change GEX
density; MiniTwo until asked.

---

## 2026-08-19 — DL-459 Analyzer GEX backdrop on host viewport

**Decision:** Risk graph GEX is a **viewport layer** on `HostPnLChart`, not a
second chart. Formula and value modes are the heatmap GEX template
(`gex_v1` Γ·OI·S² · Call/Put · Net · Abs) on the **same dual-side ladder**
(`chainContextFromLadder` / `useBuilderChain` OPF-held generation). Bars
use the chart’s **strike X** (`toX`); GEX axis is **plot mid-height**.
Pan/zoom the tent and GEX move together. Controls sit in the inspector
**below Marks, above What-if**. Default on.

**Does not:** restyle bars; probability overlay; extra Massive.

---

## 2026-08-19 — DL-458 Analyzer 2D host-contract viewport (legacy PnLChart removed)

**Decision:** Coach confirmed the host-contract 2D pane works after leave/return
without a hard refresh. **`HostPnLChart` is the live Analyzer Risk graph.**
Legacy `web/components/options-lab/risk-graph/PnLChart.tsx` is **deleted**.
Bind pan/wheel to the host node's life (`chartHostBind.ts`). Same OPF curves.
Alerts / GEX / probability overlays are **not** this DL — next program.

**Does not:** Packet B strike handles; MiniTwo is a separate deploy of this
commit.

---

## 2026-08-19 — DL-457 Analyzer 2D sticky view (Packet A)

**Decision:** Coach **GO Packet A** on
[`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md`](../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md).
Left-drag pans (including the tent). Alerts stay **right-click** (Analyzer
§1.14.3 conformance). After the member moves the view, live BE jitter,
smoothed spot, series-length ticks, and What-if sheet rebuilds **must
not Autofit**. Same law as Surface **AT-AF-7** — one law, two surfaces.
Native `{ passive: false }` wheel on the chart host. View survives
Risk ↔ Surface remount via an in-module sticky cache.

**W0 packets bypassed** (PL-B2 / same shape as DL-451 What-If impl GO):
W0-2 India · W0-3 Echo · W0-4 Tango · W0-5 Hotel · W0-G Delta ·
W0-BA BUILD AUTHORITY.

W0-0 STAMP and W0-1 Lima hash already **PASS**. Echo **VP-A1** silent
default: Show/Hide = redraw only; lock clears on Auto-fit and structure.
**VP-A2:** 3% wheel step unchanged. **VP-B1:** `PnLChart.tsx` only.
Packet B needs its **own** Coach BA.

**Does not:** wire strike-handle drag; reopen What-If W2 /
`OpfRiskAnalyzer.tsx`; `/resolve`; invent strikes.

---

## 2026-08-19 — DL-456 /apply Review edits in place

**Decision:** Ernie correction 2026-08-19. Review still lists every asked
question with its answer. Click / tap a line and **edit in place on that
line**. The answer becomes a field on the same line. Enter, Tab, or the
OK control beside that field accept the edit and collapse the line back
to Q+A. Same accept affordance as the live form (button beside the field).
Do **not** send them back to the one-question slot to edit.

This supersedes the DL-455 “open that question again in the eye-lock
slot” edit path. Review itself stays one screen, same slot.

Path-changing edits (6 / 7 / 9) still recompute. Drop answers that no
longer apply. If new questions appear, ask those one at a time in the
live-form slot, then return to Review. Review **Accept** is still the
only `POST /api/apply`. Review is required.

**Does not:** reopen the question screen to edit; auto-submit; merge;
MiniTwo; fattail.ai.

---

## 2026-08-19 — DL-455 /apply Review before AC submit

**Decision:** Ernie lock 2026-08-19. After the last **live** question on
that path — not after email, not auto-submit — the invite animates into
a **Review** screen in the same eye-lock slot (same two-beat motion).
Review lists every question they were asked, in order, with the answer
under it. Intro is omitted. Dead-branch questions they never saw are
omitted.

Each line is tappable. Tapping opens that question again in the same
slot. They change the answer, accept it the same way (click / tap /
Enter / Tab), then land back on Review with the new answer shown.

Changing a path key (**6 / 7 / 9**: `COACHING_SKU`, `ELEVEN_AM_ET`,
`PARTNER_SUPPORT`) recomputes the remaining path. Answers that no
longer apply are dropped. New questions that appear are asked one at a
time in the same slot, then Review.

Current skip: **ELEVEN_AM_ET = No** makes `PARTNER_SUPPORT` a dead
branch. 6 is free text (no invented membership menu). 9 is last.
`POST /api/apply` runs only from Review **Accept**. Partner is required
on the write only when 7 is Yes.

**Does not:** auto-submit on the last question; leave Review; add a
second route; invent dropdowns for 6/7/9; merge; MiniTwo; fattail.ai.

---

## 2026-08-19 — DL-454 /apply accept sits next to the field

**Decision:** Ernie lock on the accept control. Continue / OK / Submit
sits **next to the field**, not in a distant footer. Click, touch/tap,
Enter, or Tab accept the current answer **when valid** and present the
next question/field. Invalid or empty does not advance. Last step still
`POST /api/apply`. Same two-beat motion. Eyes stay put. On mobile the
button stays beside the field and thumb-reachable — not a far bottom bar.

---

## 2026-08-19 — DL-453 /apply invite copy and order (Ernie)

**Decision:** Ernie lock on invite wording and order. Desk titles
(Email, Hell Island, Coaching SKU) are not the invite. Path is a
conversation:

1. Intro — FatTail application; a few questions, one at a time, so we
   know if this is a fit. Not a dump of fields.
2. Email — “Enter your email (we will never share it).”
3. **HEAVEN before HELL** — “What do you consider your heaven island?”
   plus 2–3 example answers (defined-risk book, calm in the chair, not
   hunting win rate).
4. Hell — what their hell island is, plus examples (violent equity,
   blow-ups, solving for win rate).
5. Same shape for the rest of Cole’s seven: spoken question + hint of
   what an answer sounds like + big field.

AC keys and live ids **3–9** stay. Invite order is email → HEAVEN →
HELL → MONEY_TIMING → COACHING_SKU → ELEVEN_AM_ET → TRIED →
PARTNER_SUPPORT. All seven still write. COACHING_SKU stays free text
(Observer / Activator / Navigator as examples only). Echo owns official
labels later; Ernie owns this invite wording now.

**Does not:** change the `POST /api/apply` write; invent dropdowns;
embed Typeform.

---

## 2026-08-19 — DL-452 /apply is one question at a time; two motion beats; eyes stay put

**Decision:** Ernie walked the all-fields `/apply` on StudioTwo and rejected
it. Native FatTail invite (not a Typeform embed, not a Typeform vendor):

- One question and its field/control at a time. Big type. Big fields.
- **Two animations, not one fade at the end.** (1) When a question and
  field are presented, they animate in. (2) When that answer is accepted,
  that step animates out and the next question/field animate in.
- **Focal point stays put** on desktop and phone. Same slot. No
  horizontal shift. No jump to a new scroll position. Do not make the
  next question appear somewhere else so they have to hunt.
- Mobile: one column, 44pt targets, thumb-reachable next/accept.
- Path may depend on the accepted answer. Do not skip Cole keys.
- Hue `#00B478` only for next action / live / accepted.
- Write contract unchanged: final submit `POST /api/apply` writes ids
  **3–9** + tag **18**, fail loud. No fake thank-you.

**Does not:** embed Typeform; invent dropdowns for empty option lists on
fields 6/7/9; ticket Ernie or Conor; lock host.

---

## 2026-08-19 — DL-451 Native /apply submit writes Cole's seven fields + tag 18

**Decision:** Chair GO 2026-08-19. Ship a native FatTail `/apply` submit
surface in this repo. A submit writes Cole’s seven ActiveCampaign
`fieldValues` (live ids **3–9**: `HELL`, `HEAVEN`, `MONEY_TIMING`,
`COACHING_SKU`, `ELEVEN_AM_ET`, `TRIED`, `PARTNER_SUPPORT`) and tag
**18 Application Filled**. Fail loud if the seven write or the tag miss.
Do **not** inherit waitlist `sync_lead()`. Do **not** invent dropdown
options for fields 6/7/9 (empty option lists → free text). Echo owns
labels (Coach titles used until Echo replaces them). One brand hue
`#00B478` for next action / live state only. Host stays open (OQ-1).
No Juliet seeds. Spec PR 3 remains spec-only.

**Does not:** lock fattail.ai vs Labs vs proxy; rewrite `/signup`; touch
Strategy Lab / Tradier; add sales fields; ticket Ernie, Conor, CEO, or CTO.

**Ship path:** `docs/Native-Apply-Ship-Path.md`. After deploy,
`labs.fattail.ai/apply` exists. `https://fattail.ai/apply` stays 404
until Foxtrot routes it.

---

## 2026-08-19 — DL-450 Native Apply Form Spec v0.1 filed

**Decision:** File Coach / chair Phase 0 as the apply law:

- Path: `Specs/FatTail-Native-Apply-Form-Spec-v0.1.md`
- Public URL intent: `https://fattail.ai/apply`
- Job: write Cole’s seven AC handoff fields so Shaw can book and Cole can close
- Writes: AC `fieldValues` on the contact + tag **18 Application Filled**
- Fail loud; zero silent success; Typeform replaced as the write source
- lock.md look in-spec (`#00B478`, tokens.css, one column / labels above / 44pt)

**Does not:** treat spec PR 3 as the implementation PR.

---

## 2026-08-19 — DL-452 Analyzer What-if remaining T + measured IV (as-built)

**Decision:** Analyzer and Surface **What-if** Time is remaining to
**last trade** (index 16:15 ET / equity 16:00 ET). Implied vol is
absolute % detent at listed ATM IV. Engine wire stays OPF31
`vol_offset_pts = σ_s − σ_m`. τ stays OPF29 **16:00** with the
**1-minute** floor (not `fractionalT`'s 1-hour min). Session share:
`ft_options_lab_whatif_v1`.

**Coach ODs (silent, stamped with DL-451 GO):** **OD-1 B** additive ·
**OD-2 A** Surface HUD same scalar · **OD-3 B** two clocks (slider
last-trade ≠ settlement τ).

**Does not:** move OPF settlement to 16:15; smile-sticky ratio;
`/resolve` schema; VIX→IV.

**Parents:** Analyzer §1.11 (this body) · What-if T/σ spec v0.1 (stays
**DRAFT** — W0-BA was bypassed, DL-451) · impl plan v1.0.

---

## 2026-08-19 — DL-451 Analyzer What-if T/σ impl GO (W0 review bypassed)

**Decision:** Coach **GO** on
[`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md`](../docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md).
Juliet may fire **W1**.

**W0 packets bypassed** (PL-B2 — overrule on the record, not a waived gate):
W0-0 plan stamp · W0-1 Lima hash · W0-2 India confirm · W0-3 Echo ·
W0-4 Tango · W0-5 Hotel · W0-G Delta · W0-BA BUILD AUTHORITY.

**Why:** India fold already landed TM-B1/B2 on the DRAFT. Coach asked for
the impl plan, then **GO with the plan, continue unless blocked**. Silent
ODs: **OD-1 B** (additive OPF31) · **OD-2 A** (Surface HUD same scalar) ·
**OD-3 B** (slider last-trade / τ OPF 16:00).

Spec remains **DRAFT** until Lima W5 / a later BUILD AUTHORITY stamp.
Surface first-ship W3-1…W3-4 stays closed; this W3 is HUD follow-on only
(PL-B1).

---

## 2026-08-18 — DL-450 Surface What-if keeps the value window

**Decision:** Vol / spot What-if rebuilds the sheet but **does not
refit P&L height**. The box Y scale is held (same law as strike
Autofit: book change + Autofit button only). Otherwise the tent is
renormalized into the box and the dials look dead.

---

## 2026-08-18 — DL-449 Surface HUD left rail, collapsed except detents

**Decision:** All Surface inspect chrome sits in a **left rail** with a
slight light glow. **Named-view detents** stay expanded. Planes, Time,
Camera, and Saved views start **collapsed**.

---

## 2026-08-18 — DL-448 Surface curvature shade + slider

**Decision:** The solid tent darkens **non-flat** regions so curvature
reads: slope (first difference of box Y) plus crease (discrete
Laplacian). Flat faces stay bright. A **Curvature** slider (0–100%,
default 40%) scales that darkening. The **dark end** (100%) takes
folds near-black; the **light end** stays the original gentle shade.
Does not reprice. Ghost wireframe is unchanged.

---

## 2026-08-18 — DL-447 Surface box time axis: hours + Midnight / Noon / Open

**Decision:** The viewport box time edge (Now → Expiry) carries:

- **Expiry** corner: the word Expiry, with the face clock
  (`Mon D · h:mm ET`) under it.
- **Hourly ticks** on that edge, same weight as the box wire.
  Major ticks (slightly longer) at **Midnight**, **Noon**, and
  **Open** (Mon–Fri 9:30 America/New_York). Those three are labeled.
- Ticks live inside the sheet window only. Now and Expiry stay the
  corner words.

**Does not:** invent hours past the expiry face, label weekend Open,
or change τ / settlement law.

---

## 2026-08-18 — DL-446 Surface expired ghost is wireframe, no fill

**Decision:** After the EXPIRED clock (next midnight ET), shown cards stay
on Surface as Analyzer ghosts do. The 3D equivalent is the **wireframe
tent with no filled mesh** — grey wires, at-expiry residual from defined
debit + intrinsic. No live IV required.

- Live / residual cards keep the solid tent.
- Mixed book: solid live tent + wireframe ghost of expired cards.
- Expired-only book: wireframe only. HUD `as_of expired` · `ivSource ghost`.

**Does not:** invent IV, claim the ghost is live, or remove Analyzer’s
2D dashed-grey ghost.

---

## 2026-08-18 — DL-445 Surface is never clock-blocked

**Decision:** Coach: the member must be able to analyze a shown
position **any time they choose**. Surface clocks name the **claim**
(live / residual / expired). They do **not** unmount the tent or
replace it with a blocking **HELD / RESIDUAL** or **EXPIRED** card.

- Book clock = remaining listed life (every shown leg), not the
  package front pointer alone. A weekly or calendar back-month stays
  **live** after today’s 0DTE settlement.
- After settlement / EXPIRED: still-drawn residual or ghost sheet;
  HUD `as_of residual` / `as_of expired`. Never a live claim.
- Overlay Law B remains only for holes that prevent a sheet
  (empty book WAITING · UPDATING · IV NO · CHECK LEGS).

**Does not:** invent IV, claim a settled contract is live, or change
Analyzer card package-cell law.

---

## 2026-08-18 — DL-444 Condors stay in Position Builder, not Heatmap

**Decision:** Condors and iron condors are **Builder** structures only.
The Heatmap is a fly / vertical / GEX surface — not a condor scanner.
ATM short iron condors are antithetical to FatTail methods; do not add
a Condors heatmap template.

---

## 2026-08-18 — DL-443 Heatmap Verticals template

**Decision:** Heatmap template **Verticals** sits under Broken-wing
flies. Value modes **Long/Debit** and **Short/Credit** only.

- Calls: long \(K\), short \(K+w\). Puts: long \(K\), short \(K-w\).
- Short/Credit flips both legs. Exact listed strikes; no snap.
- Same 10…50 width columns. Color is \|package\| neighbor RoC.

---

## 2026-08-18 — DL-442 Heatmap Value Metrics Proposal filed as source

**Decision:** Coach’s *Expanding the Heatmap Value Metrics for
Market-Regime Research* is the **research source** for the Value menu.
PDF + map:
`docs/Heatmap-Value-Metrics-Proposal.pdf` ·
`docs/Options-Lab-Heatmap-Value-Metrics-Proposal.md`.

Product amendments (Long/Short, spatial % change, package Δ/Γ/θ) sit
**beside** the proposal — they do not erase it. Width Efficiency, Time
Decay, Spot Sensitivity, Surface Stability, and SRS remain **flagged**,
not shipped.

---

## 2026-08-18 — DL-441 Heatmap Value modes in help reference

**Decision:** Member explainer for Advanced Fly Value modes lives in
`server/help_reference/options-lab-heatmap.md` (help concierge search)
and `docs/Options-Lab-Heatmap-Value-Modes.md` (pointer). App-areas
gains Options Lab / Heatmap sections.

---

## 2026-08-18 — DL-440 Hide Advanced Fly Velocity / Acceleration

**Decision:** Velocity and Acceleration stay out of the Heatmap Value
menu until a real debit time series exists. They are generation-tick
math and go blank without history. Slope, Curvature, and Call/Put
asym remain (current snapshot).

---

## 2026-08-18 — DL-439 Advanced Fly Theta is package chain θ

**Decision:** Value mode **Theta** is the long-fly sum of listed chain
thetas on the three strikes (\(+1/−2/+1\)). Same law as Delta / Gamma
(DL-438). Missing θ on a leg → invalid.

---

## 2026-08-18 — DL-438 Advanced Fly Delta / Gamma are package chain greeks

**Decision:** Value modes **Delta** and **Gamma** are the long-fly
sums of listed chain greeks on the three strikes
(\(+1/−2/+1\)). Not debit-to-debit slopes and not generation ticks.
Missing greek on a leg → invalid cell.

---

## 2026-08-18 — DL-437 Advanced Fly % change is debit vs neighbor toward spot

**Decision:** Value mode `% change` is the **percent change in fly
debit** from the next strike toward spot, same width, walking out both
ways. Spot row is 0. It is **not** a generation-to-generation tick.

---

## 2026-08-18 — DL-436 Heatmap Wings control removed

**Decision:** Heatmap no longer exposes a Wings (± strikes) picker.
The OPF-held generation owns the strike window. Fetch still uses the
profile/default band internally (not a member knob).

---

## 2026-08-18 — DL-435 Advanced Fly widths 10–50 and RoC slider

**Decision:** Heatmap Advanced Fly columns are **10, 15, …, 50**
(center-to-wing) for every value mode. Do not use profile
step-multiples that started at 5.

Color is tile-to-tile RoC of the **displayed** value. A **− / +**
slider sits under the Side toggle and sets MSC Gradient threshold
(− = 150 calm, center = 50, + = 5 hot). No percent chrome.

Spec AF **v0.2.3** §3.2 / §4.1. `HEATMAP_FLY_WIDTHS` ·
`rocSensitivityToThreshold`.

---

## 2026-08-18 — DL-434 Advanced Fly Long/Debit and Short/Credit

**Decision:** Heatmap Advanced Fly first two Value modes are the two
fly directions, not “one formula + a CR chip.”

- **Long/Debit** = +1 / −2 / +1. Unchanged debit math.
- **Short/Credit** = −1 / +2 / −1, priced from those quantities.
  Cell shows the signed short-fly package (OPF +pay / −receive).
  Do not stamp “CR” on a short fly that pays.

Amends Spec AF **v0.2.2** §3.1 / §3.4 (supersedes N2 abs+CR).
`symFlyPackage` / `symFlyCredit` in `templates/pricing.ts`.

---

## 2026-08-18 — DL-433 SSR Collector Hardening Spec v1.0 BUILD AUTHORITY

**Decision (Coach auto-GO):** Spec
`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md` **v1.0** is
**BUILD AUTHORITY**. W0-G **PASS** + **GO**
(`agents/p-ssr-collector-hardening/gate-reports/W0-G.md`). This run:
auto-GO clean gates.

`LABS_SSR_HARDENING` default **0** (off = today’s poll-all). Land P1
code behind the flag. Cut over **between phases only** — no mid-`gth`
kickstart of `ai.fattail.labs.ssr-live-capture`.

Alert channel (**OD-SSR-H-1**) remains **OPEN**. Do not invent
Slack / email / Discord / PagerDuty. Watchdog **remote** notify stays
blocked until Coach names the channel.

Friday **2026-08-14** gold stays labeled 5-min and is **not rewritten**.

**Does not** change cadence (see **DL-432**). **Does not** supersede
DL-428 (band + default), DL-429 (localhost dash), or DL-431 (max
published window).

**Board:** `agents/p-ssr-collector-hardening/`.

---

## 2026-08-18 — DL-432 Gold tap cadence remains 2s pending Coach pick

**Decision:** After the W0-6 cadence / storage / quota report
(`agents/p-ssr-collector-hardening/gate-reports/W0-6-lima-cadence-math.md`),
StudioOne stays at **2s** inside the DL-428 band **[2, 5]**. Coach may
still pick 3s / 4s / 5s later; that pick is a new DL and a
between-phase env cutover. **Env not changed.**
`LABS_SSR_CHAIN_EVERY_S` remains **2**. 5-min remains forbidden.

**W0-6 math (uncompressed JSON, wings=15, ~19.3 KB full snap):** RTH
**18 names at 2s ≈ 4.06 GB/day** (11,700 cycles × 18 = 210,600 snaps).
A full published weekday is ~11 GB. Disk is not the reason to move the
number before open.

**Tap cadence ≠ Massive.** The tap is a Redis **reader**
(`store.get_json` on `mb:ladder:…`). The quota lever is
`chain_feed --interval` × live interest topics (20 keys measured
2026-08-18). Changing `LABS_SSR_CHAIN_EVERY_S` does not change Massive
calls. Overnight quota drops only if out-of-session interest is
released (session map, P1).

**Does not supersede** DL-428 (band + default) or DL-431 (max
published window). Records that the math was done and the live number
was left at 2s.

---

## 2026-08-17 — DL-431 Gold tap collects the maximum published window

**Decision:** Do not shrink the clock to a guessed 8:00 AM. Collect
everything Massive / Cboe actually publish.

Evidence:
- Massive: pre **4:00 AM–9:30 AM ET**, RTH **9:30 AM–4:00 PM**, after
  **4:00–8:00 PM**. Every trade, including extended. Options snapshot is
  whatever the exchange prints.
- Cboe overnight GTH (SPX / XSP / VIX / RUT): **8:15 PM–9:25 AM ET**
  Sunday–Thursday.
- Cboe equity GTH for select names (from **2026-08-17**): **7:30–9:25 AM**
  and Curb **4:00–4:15 PM**.

**As-built:** sleep **only** Friday **8:00 PM → Sunday 8:15 PM**.
Weeknights stay up (`phase=gth`). Persist what the plane has. Named hole
if a name has no chain (typical for most equities overnight). Never invent.

**Supersedes the 8:00 AM wake in DL-430.**

---

## 2026-08-17 — DL-430 Gold tap weekday clock is 8:00 AM–8:00 PM ET

**Decision (Coach):** Premarket for some names is **around 8:00 AM ET**.
RTH is **9:30 AM–4:00 PM ET**. Collect pre and post if the plane publishes.

| Phase | Clock (America/New_York) |
|---|---|
| Closed | midnight → **8:00 AM** |
| Pre | **8:00 AM–9:30 AM** |
| RTH | **9:30 AM–4:00 PM** |
| Post / extended | **4:00 PM–8:00 PM** |
| Closed | **8:00 PM** → next weekday **8:00 AM** |

Equity/ETF chains often have a pre/post snapshot (frequently held last /
zero NBBO — labeled, not invented). Index chains (SPX) are often thin or
**NO CHAIN** outside RTH.

**Supersedes the 4:00 AM wake in DL-428.** Same 2–5s cadence.

---

## 2026-08-17 — DL-429 Chain Snapshot dashboard is StudioOne localhost

**Decision (Coach):** After the gold tap is standing, StudioOne hosts a
**Chain Snapshot** dashboard on **localhost only** (`127.0.0.1:5055`).
Read-only view of `live_capture` on disk. Does not call Massive. Not a
member product surface. Not on MiniTwo.

**As-built:** `python -m market_data.ssr_snapshot_dash` · launchd
`ai.fattail.labs.ssr-snapshot-dash`. Bind fails loud if host is not
localhost. From StudioTwo: `ssh -L 5055:127.0.0.1:5055 studioone`.

---

## 2026-08-17 — DL-428 Gold tap is 2–5s, all universe symbols, pre + extended

**Decision (Coach):** StudioOne gold archive writes OPF chain snaps at
**2–5s** (default **2s**). **5-min is forbidden.** Friday **2026-08-14**
stays labeled 5-min and is not rewritten.

Collect **every enabled Admin universe symbol** (`market_symbol_universe`).
Reference-role marks (VIX / VIX1D) stay on the mark tape; they do not get
a fake options chain.

**Pre- and post-market are in:** weekday phases while the plane publishes:

| Phase | Clock (America/New_York) |
|---|---|
| Pre | 04:00–09:30 |
| RTH | 09:30–16:00 |
| Extended / post | 16:00–20:00 |
| Closed | 20:00 → next weekday 04:00 |

Massive often returns a zero NBBO in pre/extended and a held last/close.
We persist what the plane has, labeled `phase`, and do not invent a live
quote. Index chains (SPX) may be thinner or **NO CHAIN** outside RTH.

**As-built:** `ssr_live_capture` fail-loud outside [2, 5].
`LABS_SSR_CHAIN_EVERY_S` default 2. Host StudioOne, one writer.
Monday **2026-08-17** is a hole (tap never started). Next session is
Tuesday **2026-08-18** 04:00 ET pre-market.

**Supersedes cadence band in DL-400** (3–5s / default 4). Same gold-plane
intent; tighter disk cadence.

---

## 2026-08-17 — DL-427 Multi-DTE expiration face is front-exp residual

**Decision:** Surface sheet + Analyzer 2D expiration curve use
**OD-PF2**: cyan / “at expiry” is the **first listed settlement**, not
both-dead.

- Single-DTE: last slice \(\tau = 0\) (every leg intrinsic). Unchanged.
- Multi-DTE (calendar / diagonal / mixed): default `timeAxis` ends at
  `expiryFaceTau = max(τ0) − min(τ0)`. Front legs intrinsic; later legs
  keep residual \(\tau\). Same-strike calendars stay a hump.
- \(\tau = 0\) on every leg is both-dead ≈ −debit (flat). That is **not**
  the product expiration curve. T+0 / magenta is unchanged
  (`evaluatePnlAtSpot` at max \(\tau_0\)).

**Why:** Aug 18 / Aug 19 same-strike calendar showed a correct magenta
T+0 and a flat cyan line. The elapsed-τ pricer was already right; the
horizon walked to last expiry.

**Code:** `expiryFaceTau` / `evaluateExpiryPnlAtSpot` in
`surfaceModel.ts`. `computeSurfaceSheet` default last row. Analyzer
`localBookCurves` expiration. Autofit expiry BEs. Autofit Spec **v0.1.6**.

**Not:** MSC import. No synthetic residual when dates collapse.

---

## 2026-08-17 — DL-426 Surface Autofit width pad max 85%

**Decision:** Autofit Spec **v0.1.5**. Width pad slider `0`…`85%`
(was `65%`, +30%). Height pad stays `0`…`65%`. Default remains 15%.

---

## 2026-08-17 — DL-425 Surface Autofit pad slider max 65%

**Decision:** Autofit Spec **v0.1.4**. Width and Height pad sliders
run `0`…`65%` (was `50%`, +30%). Default remains 15%.

---

## 2026-08-17 — DL-424 Surface Autofit pad slider max 50%

**Decision:** Autofit Spec **v0.1.3**. Width and Height pad sliders
run `0`…`50%` (was `40%`, +25%). Default remains 15%.

---

## 2026-08-17 — DL-423 Surface Autofit is pad-then-fill (width + height)

**Decision:** Autofit Spec **v0.1.2**. One algorithm, two axes.

The member sets **pad**. Autofit measures content and **fills the
remaining box**. Width: listed Ks + T+0/expiry BEs + spot, equal
left/right pad, stretch S into the leftover width. Height: sheet
min/max P&L including $0, equal top/bottom pad, stretch P&L into
the leftover height. Default pad **15%** of content span each side
(Analyzer-like). Sliders `0`…`40%`. Autofit button / book-change
rescan width content, then apply current pads.

Not ATM-centered Analyzer `autofitView.ts` (far BEs still set the
window). Not a 1–10× height gain around $0.

**Code:** `surfaceAutofit.ts` · `timeCut.ts` · `PlanesHud` · `SurfaceApp`.

---

## 2026-08-17 — DL-422 Surface Autofit full-agent bench plan v1.0

**Decision:** File
`docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md` and
board `agents/p-options-lab-surface-autofit/`.

**W0 token:** `agents/go/OLSAF-W0.md` (unsigned). Does **not** reopen
Surface first-ship. AF-n not seeded until Coach amends Autofit Spec §5.
**DL-421** remains the spec stamp.

---

## 2026-08-17 — DL-421 Surface Autofit spec v0.1 (default + amendments)

**Decision:** File
`Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`.

**Default (as-built):** the Surface box shows the shown book from the
**furthest-out** of T+0 breakevens, expiry breakevens, and listed
strikes, plus **spot inside**, with **equal pad**. Stretch/compress
the strike axis to that window. Run when a position is **added /
shown** and when the member clicks **Autofit**. Not Analyzer 2D
`autofitView.ts`. Not camera **Fit**.

**Special cases:** later families amend **this spec** (`AF-n` +
profile). One Autofit. No second fitter.

**Code:** `web/lib/risk-graph/surfaceAutofit.ts`.

**v0.1.1 (same DL — Coach stamp):** What-if (App Spec §4.6), not
Time-machine, on the vol/spot dials. **Drop** Autofit rerun on What-if.
No auto-refit on live spot drift — button covers it. Content listed Ks
= union of shown structures. AT-AF-6 / AT-AF-7. App Spec §5.3 pointer.
Pad-in-points stays until index screenshots.

---

## 2026-08-17 — DL-420 Subscribe-then-price audit (Options Lab)

**Decision:** File the audit of Coach’s rule — subscribe for the
generation, price in the browser — at
`docs/Options-Lab-Subscribe-Then-Price-Audit-v1.0.md`.

**Verdict:** Live Analyzer **sheet** follows (DL-419). **Subscribe** does
not yet: Analyzer keep-warm, Builder, and package hydrate still
HTTP-poll `chain-ladder` while Heatmap already uses Market Bus
WebSocket. Remediation is one in-tab generation store (Phase B). Do
**not** add a second SSE (Arch 28 / 30).

**Flags:** BR-1…5 in that doc · FI-028.

---

## 2026-08-17 — DL-419 Live Analyzer sheet is local (subscribe, then price)

**Decision (Coach):** The live Analyzer book curve is computed **in the
browser** from the OPF-held generation the client already has. This is
**general practice**, not a keep-warm special case. Working 2.5s and
Away 5s share one path (`resolveLocalBookCurves`). Keep-warm is only
the **rate**.

**Coach (verbatim):** calculate locally so it scales and relieves the
server; do not go to the server for what the browser can do; the
subscribe/gateway exists so the client gets the generation and does
the rest locally.

**Law:** Keep-Warm **AZ-KW-6** · **AZ-KW-10**. Finite listed IV on the
held row, or a named hole. Never invent IVs. Engine id
`local.bsm_european`. SPY American CRR on the live sheet is **labeled
deferred**.

**`/api/me/pricing/resolve`** stays for lock / pack / RECON when those
packets run. It is **not** on the live Working/Away clock.

**OD-PF6 (DL-290) scoped:** server remains SoR for lock/pack/RECON and
named server packs. The **live Analyzer 2D/3D picture** is the client
sheet on held IVs. Not a second CRR engine.

**As-built transport:** Market Bus one WebSocket
(`/api/me/market/stream`) + ladder HTTP for the held generation. Coach
said “SSE gateway”; as-built is that subscribe plane, not a second SSE.

**Spec:** Keep-Warm content **v0.1.2**.

---

## 2026-08-17 — DL-418 Keep-Warm v0.1.1 BUILD AUTHORITY (promotes DL-417)

**Decision (Coach):** Analyzer Viewport Keep-Warm Spec **v0.1.1** is
**BUILD AUTHORITY**. This entry **records the promotion of DL-417**.

**OD Accept:**

| ID | Accept |
|----|--------|
| **OD-KW-1** | Away **5s**. Revisit only after the §4 aggregate row. Never 1s. |
| **OD-KW-2** | As-built **no-resolve** is law. `OPF_IDLE_POLL_MS` 30s = **posture only**. |
| **OD-KW-3** | Keep-warm TTL **30 min**. |

**v0.1.1 fold:** AZ-KW-5 last paint carries `generation_as_of` age / stale
until the first Working tick (restates **AZ-DATA-5a**). Stale marker is
**honesty, not chrome** — quiet as_of or hairline dim; Echo gates.
Page Visibility API named: Away 5s is the **target**; hidden-tab
throttling may lengthen it; canvas never blanks. §4 aggregate at 100 and
500 members seated vs away per shown structure. Risk ↔ Surface
(**AZ-VP-S2**) inherits last-paint and rate-change; **AT-KW-9**. Surface
3D reuses `opfPollIntervalMs` — no fourth rate. Layout residual
(vertical stack) stays its own packet at the **top of the Analyzer
residual board**.

**Spec:** `Specs/FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md`
(content **v0.1.1**).

---

## 2026-08-17 — DL-417 Analyzer viewport keep-warm strategy spec

**Decision:** Capture Coach’s working-page poll law as
`Specs/FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md`
(**AZ-KW**). Status **DRAFT** until Coach stamps BUILD AUTHORITY.

Analyzer is the main working page. Last paint survives leave/return.
Polling stays on while the plane is printing. Three rates: **Working 2.5s**
(in seat, ≥1 shown) · **Away 5s** (hidden or unmounted, still shown) ·
**Idle** (nothing shown — no heavy resolve). **1s away is illegal** (faster
than Working). Soft fail does not blank curves.

**As-built:** `useOpfRiskGraph` `opfPollIntervalMs` · module cache ·
`loadPositions()` on first paint.

**OD-KW-1…3** (5s vs 3s away · idle ladder ping · 30 min TTL) wait Coach
Accept.

---

## 2026-08-16 — DL-416 Surface first-ship W3–W5 landed

**Decision:** Options Lab Surface first-ship is **as-built**. W3-1…W3-4,
W4, W5 **PASS**. Route `/app/options-lab/surface`. Exact/locked or IV NO.
Camera Slow/ISO/Fit. Playhead sample + Value $0. Planes + 12 views.
`surface_inspect_json` (migration 130). Time-machine **feed** and mini
graphic remain later. Arch 33 updated.

---

## 2026-08-16 — DL-415 Surface W0 GO (OLS-W0)

**Decision (Coach):** W0 is **GO** on Surface plan **v1.0.1**. Token
[`agents/go/OLS-W0.md`](../agents/go/OLS-W0.md) signed Coach 2026-08-16.
Delta W0-G reads that file (DL-328).

W1 + W2 fire in parallel. W3-1 only after W1-G and W2-G.

---

## 2026-08-16 — DL-414 Surface bench plan v1.0.1 (W0 token minted)

**Decision:** Surface Full Agent Bench Plan is **v1.0.1**. Board stays
**DRAFT until W0-G**. Coach stamps [`agents/go/OLS-W0.md`](../agents/go/OLS-W0.md)
(DL-328 — Delta reads the file, not chat).

Amendments vs v1.0: W2 split (first-ship blocks W3; later tests do not);
T-BOOK-1 named in §6; last-minute LAW now / FEED later; W3-1…4 seeded in
order; T-GRID-1 (nx=80 · nt=48 · DPR cap 2) because Hotel pin has no
grid numbers; later proofs SPXW 0DTE fly + SPY Batman Aug 14 5-min.
No migration before GO. Do not reopen S1–S8. Do not seed Backtest here.

**Does not** GO until OLS-W0 is signed.

---

## 2026-08-16 — DL-413 Surface v0.1.8 accepted; S2–S8 chrome closed

**Decision (Coach):** App Spec **v0.1.8** is accepted. **S2–S8 accepted as
recommended.** All Surface chrome decisions are **closed**.

| # | Accept |
|---|--------|
| S2 | Keep Analyzer in-viewport Surface preview + “Open Surface” |
| S3 | Camera-complete, structure-static |
| S4 | Flat σ after Hotel + first gold-minute replay. **Not v0.1** |
| S5 | Time-range + walk in v0.1 |
| S6 | Plane HUD in v0.1 |
| S7 | Configurable views, cap 12, profile persist (after Accept) |
| S8 | Zoom default Slow |

S1 already closed (DL-411). v0.1.8 file is frozen (no bump).

Method §5.1 item 2 (“reprices from the surface”) is **not** amended in
the Method spec. One-clause fix lands in the **Backtest bench plan when
it seeds:** reprice the attempt from the snap’s package NBBO/mark; the
sheet is not the fill factory.

**Not GO.** Coach reads the Surface bench plan first.

---

## 2026-08-16 — DL-412 Surface App Spec v0.1.8 (review accept)

**Decision:** Accept the Surface / Method review in full. Docs only. **Not GO.**

- App Spec §1 / §4.1 / §5.2: tent is the **shown listed book** (§4.7 /
  DL-394), not a focused-structure radio. v0.1 may draw one structure as
  a **named slice**, not as product law.
- Method v0.2.2 §1: Friday **2026-08-14** is first tape / harness day at
  **5-min chain**, labeled. Never “gold day” or last-minute gold. Gold
  minute = Mon **2026-08-17+** at 3–5s (DL-400).
- Method §2 lead: one sheet; bind exact/locked from the snap;
  `computeSurfaceSheet`; ticks never paint a refused smile; silver is a
  later labeled adapter.
- Method §5.1 restore: fill = atomic package mark/NBBO; hold/fold + P&L
  path = this sheet. Expiration-day cites App Spec §4.6a (3 DTE Batman
  walk too). Mini graphic label **day walking · n of N**; no P&L hero.
- Tech spec: persist comment = Options Lab; Accept gate = **S2–S8**.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`
(v0.1.7 path is SUPERSEDED stub). Hash on the spec.

Does **not** edit DL-409…411. Does not GO build.

---

## 2026-08-16 — DL-411 Surface first home is Options Lab (amends DL-401)

**Decision (Coach):** The 3D Surface **ships in Options Lab first** — home
beside Analyzer, where the structure is built. Same object, same
`surfaceModel` sheet, same Labs renderer.

This **supersedes the S1 recommendation** (fifth Strategy Lab pill first).
**DL-401 is amended by this entry, not edited.**

Strategy Lab is the **second consumer** (DL-410): Method v0.2 backtest
surface + mini tape-walk graphic. Not a life-cycle phase.

**Route:** `/app/options-lab/surface`. Suite pill sibling of Volume Profile ·
Heatmap · Analyzer. Analyzer preview tab stays (S2).

**Spec:** App Spec **v0.1.7** §5.1 · §4.8 · S1 CLOSED.

**Does not** GO build.

---

## 2026-08-16 — DL-410 Surface named consumers: backtest + mini tape-walk

**Decision (Coach):** Once shipped, the 3D Surface is the basis for two
more consumers. PB-MODE-0 is **explicit**.

1. **Backtest surface** — Method v0.2 replay / time machine runs on the
   **same sheet**. No side-door engine.
2. **Mini animated graphic** while a backtest runs — tent walks the tape
   snap by snap. Same `surfaceModel` sheet, same Labs renderer, **reduced
   grid/DPR**. Run counter **n of N** beside it. Animation is the tape
   walk (**one real day**, same across MC runs). It is **never the
   result**. The result is the **distribution** and lands after. Label
   accordingly.

**Juliet:** fold into the Backtest bench plan **when it seeds**.

**Specs:** App Spec v0.1.7 §4.8 · Method v0.2.2 §2 · Arch 31 · Arch 33.

**Does not** GO build.

---

## 2026-08-16 — DL-409 Surface is mark-honest; time machine is snap rebind

**Decision (Coach):** Strategy Lab 3D Surface uses **per-leg mark IV only**.
No fallbacks. Fail loud.

- Bind: `iv_source ∈ {exact, locked}` on every listed leg, or named hole.
  OPF §5.6 steps 2–6 do **not** run on Surface. `sticky_cli` remains forbidden
  (DL-402). Keep vendor near-zero ITM IV when exact/locked.
- **IV NO** is a Law B state (listed, no exact/locked IV). Distinct from
  NOT TRADED. Folded into OT-EF v1.1.
- **Time machine** = real P&L at \(t\): rebind \(S(t),\tau(t),\sigma_i(t)\)
  from the snap at \(t\). Last-minute 0DTE is first-class.
  A frozen-smile τ walk is **What-if**, never labeled Time Machine.
  Interpolation through a missing last-hour print is forbidden.
- **τ authority:** OPF Spec v0.2.1 **§3.7 / OPF29** already is the
  **1-minute** floor (AT-L0-τ1 / AT-L0-τ4). This packet does **not**
  amend OPF. Surface cites OPF; it does not restate τ math.
- **Last-minute truth:** final-hour 0DTE P&L is mark-path only.
  Cite OPF29 / §3.7. Hole → IV NO, no fill. After settlement → residual,
  never live. Friday 5-min archive cannot claim last-minute gold.
  Frozen-smile walk is What-if, not last-minute truth.
- Spot cell = PackagePricer. No unmarked Δσ\*. Model/silver/Flat σ later,
  labeled, cannot write the debit.
- Additive book (DL-394) is the tent law. v0.1 may implement one structure
  as a named slice only.
- Friday 2026-08-14 stays 5-min provenance. Gold minute = Mon 2026-08-17+
  3–5s chain (DL-400).

**Specs:** App Spec **v0.1.6** at
`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.6.md`
(v0.1 path is SUPERSEDED stub) · §1 north star · §4.3, §4.4a, §4.6,
**§4.6a**, §4.7, §5.3c · Tech Spec bind + T-IV-3/T-TM-*/T-LM-* ·
Arch 33 modes · OT-EF v1.1 IV NO · OPF Spec v0.2.1 §3.7 (cited, not
amended).

**Does not** GO build. Does not apply `surface_inspect_json` until Accept.

---

## 2026-08-16 — DL-408 Surface architecture + technical spec landed

**Decision:** Design foundation for Strategy Lab 3D Surface is now three
docs, still **not BUILD**:

- App / interaction: Spec v0.1 (`…-3D-Surface-App-Spec-v0.1.md`)
- Architecture: `Architecture/33-strategy-lab-3d-surface.md`
- Technical contract: `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md`

Next: Coach + Hotel/India/Echo **deliberate**. Then a full bench plan.
No implementation from these files until GO.

---

## 2026-08-16 — DL-407 Surface zoom speed is member-controlled (default Slow)

**Decision (Coach):** Prior Work Pane zoom was too fast. Surface zoom
in/out speed is a **member control**. Ship default **Slow** (~½ that
gain). Slider + Shift fine-zoom. Wheel and pinch share the same gain.
Persist with Surface defaults. Does not reprice.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md` §5.3b.

---

## 2026-08-16 — DL-406 Surface configurable views (member-saved)

**Decision (Coach):** Factory named views (ISO, Now, Expiry, Spot, Time,
Top) stay. Members also **save configurable views**: camera + projection
+ pivot + time window/playhead + strike playhead + plane hide/opacity/
position. Persist on the **member profile**. Cap 12. Recalling a view
does not reprice. Not market SoR.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md` §5.3b.

---

## 2026-08-16 — DL-405 Surface planes: walk strike & time; opacity all three

**Decision (Coach):** Strike and time are **walk planes** (transparent
playheads, same grammar). Both can be **hidden**. **Value** plane defaults
to **$0**; member sets its position. **Opacity is independent on all three.**
Defaults are settable. Walking a plane does not rebind legs or invent
strikes. Distinct from camera named views.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md` §5.3d.

---

## 2026-08-16 — DL-404 Surface time axis: range fills timeline; walk playhead

**Decision (Coach):** On the 3D Surface the member **selects a τ range**;
that range **stretches to fill the entire visible timeline** (sheet
re-sample, not a camera crop). They can **walk** the window with a
playhead. IVs stay exact/locked truth (DL-402). Distinct from named view
**Time** (camera) and from later tape replay (same HUD, different mode).

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md` §5.3c.

---

## 2026-08-16 — DL-403 Surface app is fully responsive + free camera

**Decision (Coach):** Strategy Lab 3D Surface must be **fully responsive**
(host ResizeObserver, desktop + phone, HUD must not steal the tent) and
offer **maximum camera/viewport flexibility**: perspective + ortho, orbit,
pan, zoom, Fit, named views, pivot choice. Camera moves do not reprice.
No strike invent.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md` §5.3a–b.

---

## 2026-08-16 — DL-402 No sticky IV — listed truth only

**Decision (Coach):** No sticky IV. The P&L sheet uses **exact or locked**
OPF-held per-leg IV only. Missing / inferred (nearest, ATM, VIX, 0.20,
`sticky_cli`) → named hole **IV NO** or **CHECK LEGS**. Never a silent smile.

**As-built:** `bindListedSurfaceLegs` · Analyzer `SurfaceViewport` · Design
preview no longer draws a 0.20 tent.

---

## 2026-08-16 — DL-401 Strategy Lab 3D Surface app (design only)

**Decision:** The dedicated **3D P&L Surface** is a **Strategy Lab app**
(`/app/strategy-lab/surface`) that **complements** Options Lab Analyzer.
Same per-leg vol engine: `web/lib/risk-graph/surfaceModel.ts` (DL-391).
**Design port from MSC, not code** (DL-399).

Analyzer builds/inspects (2D risk, builder). Surface is the primary tent
(DL-381) of the same listed pointer. Not a life-cycle phase.

**Spec:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.md`
(**DRAFT** — not BUILD until Coach GO). Open: S1–S4.

---

## 2026-08-16 — DL-400 OD-6 gold chain cadence is 3–5s from 2026-08-17 open

**Decision (Coach):** OD-6 from the MSC 3D surface design-port assessment is
**Accept — tighten now.** Whatever StudioOne’s chain-snapshot interval was
before is immaterial. Starting Monday **2026-08-17 at open**, StudioOne
**must** capture OPF chain snapshots with **full greeks** at **3–5s**.
Not negotiable. Not deferred.

Friday **2026-08-14** stays as captured, **labeled 5-min**. Do not rewrite
those files.

From Monday forward this is the **gold data plane** Strategy Lab bots are
tested against. Confirm on StudioOne (snapshot count in the first RTH hour
Monday: 720–1200 at 3–5s; 5-min would be ~12).

**As-built:** `ssr_live_capture` `CHAIN_EVERY_S` default **4s**;
`LABS_SSR_CHAIN_EVERY_S` fail-loud outside [3, 5]. Host StudioOne.
`chain_feed` stays ~2s (plane). Disk cadence is the gold snap.

**Assessment row:**
[`docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md`](../docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md)
§6 OD-6.

---

## 2026-08-16 — DL-399 MSC 3D surface design port (assessment)

**Decision:** Port MSC’s **surface-authority design** into Options Lab — not MSC
code. Same pattern as the 2026-08-06 broker-adapter assessment.

**Keep:** one compute path (2D = 3D); per-leg IV as shape; Mkt vs Theo as
labeled disagreement; cost basis ≠ model; marks pin the spot cell; VP/GEX
beside pricing.

**Drop / redesign:** silent 0.20 IV; mid-implied IV on a hole; unmarked
parallel Δσ\*; hardcoded \(r,q\); single τ clock; proto Heston/regime
transplant as authority.

**Labs object:** extend `web/lib/risk-graph/surfaceModel.ts` (DL-391) + OPF
IV/τ. Method v0.2 replay is a **mode** of that object (PB-MODE-0).

**Assessment:**
[`docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md`](../docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md)
(OD-1…6 for Coach). **Not BUILD** until Surface Spec v1.0.

MSC is named only here and in that assessment.

---

## 2026-08-16 — DL-398 OD-SESS-1…4 Accept as India shaped them

**Decision (Coach):** Accept **OD-SESS-1…4** as India shaped them in
`gate-reports/W3-1-india.md` (H1–H4). Fire W1-2, W1-3, W2-G, W3-2, W3-3,
then W1-G / W2-G / W3-G. **W4 fires on the third of those gates passing.**

| ID | Accept |
|----|--------|
| **OD-SESS-1** | Both, split by fact class (**H2**): `print_quality` + `generation_as_of` on every mark-bearing payload. Cite-by-hash only for `market` / `printing` after snapshot. No second WS. Keep `mark_mode`. |
| **OD-SESS-2** | **H1:** `mb:session:market_status` stays the Massive L0 doc (`sym_feed`). OPF computes `opf_session`. Do not overwrite that key. OPF does not call Massive for session. |
| **OD-SESS-3** | Product table / profile. Index 16:15 vs equity 16:00 is session class, not τ. OPF states it. |
| **OD-SESS-4** | Keep `/session-status` as labeled shim through W4; drop as member SoR in W5 when the envelope is present. Do not delete the route in W3/W4. |

Also locked for W4: **H3** (no `print_quality=live` after that contract’s OPF29 expiry instant) and **H4** (session last-print ≠ Law C Held/residual).

---

## 2026-08-16 — DL-397 W0 GO · W3-0 WHETHER is BUILD the market-state feed

**Decision (Coach):** W0 is **GO**. Fire W1-1, W2-1, and W3-1 in parallel.

**W3-0 is pre-answered: BUILD** the market-state feed — that is why this
program exists. India’s review still lands and may shape **HOW** (envelope
shape, writer, OD-SESS). It does **not** gate **WHETHER**.

W4 proceeds the moment **W1-G, W2-G, and W3-G** pass. Do not wait for a
second W3-0 stamp.

W7 seed must cite Method **v0.2**
(`Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md`)
and the Config Resolution Standard
(`docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md`).

**Plan:** `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`
(content **v1.0.1**). Board: `agents/p-ot-ef-session-print/`.

**Rationale:** The feed-authority program is the work. Review improves the
envelope; it does not reopen whether OPF owns session and print quality.

---

## 2026-08-16 — DL-396 OT-EF v1.1 · two clocks · additive book fold · Session/Print bench plan

**Decision (Coach):** Fold the 2026-08-16 rulings into **OT-EF v1.1** and execute them
through a Juliet multi-agent plan. Doctrine only in this body of work.

1. **Two clocks** (Law C). **τ / settlement** = OPF expiry instant (OPF29).
   **EXPIRED** = next midnight Eastern Time after the expiration calendar date
   (DL-393). The window between them is **Held / residual, never live**.
2. **DL-394 stands.** Additive book supersedes **PB-VIEW-4** now. One-line
   retirement in PB Spec v0.3; viewport = every shown card, independent
   checkbox, one additive continuous book.
3. **Three Strategy Lab amendments** (SL-GD39–41): backtest/forward-walk is a
   **Law A consumer**; a trade is one **atomic position** (SL-GD22 restated as
   SL-GD40); **tier is a state** (never draw silver as gold).
4. **Six next-steps** from the Session/Print review packet stay the gate order:
   two clocks in OT-EF → PB-VIEW-4 retirement → **Echo seeds labels (no chrome)**
   → **Delta characterization list (no code)** → Session/Print sequential review
   still DRAFT → Juliet executes BUILD only after those three.

**Spec / plan:**
- `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`
  (v1.0 SUPERSEDED)
- `Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md` §18
- `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md` remains **DRAFT**
- Plan: `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`
- Board: `agents/p-ot-ef-session-print/`

**Rationale:** Feed-authority and two-clock honesty are capital-adjacent. Coach
forbade jumping to infra without a multi-agent plan. Echo labels and Delta’s
characterization list are hard gates before chrome and code.

---

## 2026-08-16 — DL-395 OPF owns session and last-print to the client

**Decision (Coach):** The open/closed/pre-post problem and the live-vs-last-print
problem live **in OPF**, not in the Analyzer client. OPF **manages the feed**.
OPF **tells the client** when the market is open, extended (Massive still
printing pre or post), or closed. OPF **tells the client** whether the mark is
**live** or the **last known print**. Last print is held truth, not an outage.

The client must not invent this from a cash-bell clock or a second Massive
session poll as SoR. Analyzer `session-status` + clock fallback remains
as-built until a Coach-GO spec and Juliet plan ship the envelope.

**Spec (DRAFT, review next):**
`Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md`.
Proposed parent laws OPF34–36. **Not BUILD AUTHORITY.**

**Rationale:** Flashing “OPF unavailable” and retry loops when RTH is closed
are a **feed-authority** failure. Massive still prints pre/post; OPF already
forms held mids (`last_trade` / `day_close`). The missing piece is OPF
**stating** session + print quality on every envelope the UI consumes.

---

## 2026-08-16 — DL-394 Show/Hide is a checkbox; viewport is the additive book

**Decision (Coach):** Analyzer Show/Hide is a **checkbox**, not a radio.
Checking Show on card B **must not** un-show card A. The control is
independent per card. Clicking a card may highlight it (edit / alerts)
but **must not** deselect another card from the viewport.

When **two or more** positions are in Show, the Risk graph and Surface
curves are the **additive, continuous** book: one OPF resolve of the
merged shown legs (same contract sums quantity). Hidden cards do not
contribute. Non-representable shown cards do not blank a drawable
sibling.

**Was (superseded):** AZ-VP-1 / AZ-X-1 / AZ-FOCUS-2 / PB-VIEW-4 /
OD-PB4 = one focused definition; no multi-card aggregate. Focus selected
which single card the viewport drew, so selecting a card for display
deselected the previous one.

**As-built:** `visible` toggle is independent; `visibleBookTrade` +
`combineParsedTrades` + `resolveViewportBookPolicy`. Focus remains a
highlight only.

---

## 2026-08-16 — DL-393 Analyzer EXPIRED is after midnight ET

**Decision (Coach):** A position whose expiration date is **today** is
**not** expired. The card stays current through the cash close and
**until midnight Eastern Time** (`00:00:00` America/New_York — EST or
EDT) of that day. Not UTC midnight. Not the member’s local midnight.
Not cash close / 16:00Z. After that Eastern midnight, if the card is
still shown, the viewport uses **ghost** residual (EXPIRED).

**Was:** `T16:00:00Z` cutoff, which treated same-calendar-day cards as
expired from noon ET onward.

**As-built:** `isOptionPointerExpired` / `calendarDteOf` compare NY
calendar dates. Same-day DTE = 0 and still in play. UTC 00:00 on the
next civil date is still live while Eastern is still the exp day.

---

## 2026-08-16 — DL-392 Analyzer Surface viewport from MSC scene

**Decision (Coach):** Options Lab Analyzer **Surface** viewport uses the
**MSC 3D scene** (alpha / charlie coords / echo frame + RiskGraph3DView
mesh/shader), vendored from
`strategy-lab-proto/msc-risk-graph-ui` into `web/lib/risk-graph/3d/`.
Presentation only (AZ-VP-S4 / DL-302). **Pricing stays the shared
Strategy Lab `surfaceModel.ts`** (DL-391). No MSC theo, no MSC Redis,
no live MSC import.

**As-built:** `SurfaceScene3D` + `SurfaceViewport` in Analyzer mode
`surface`. Drag to orbit, wheel to zoom. Same session as Risk graph.

---

## 2026-08-16 — DL-391 One P&L surface model across apps

**Decision (Coach):** The 3D P&L surface **calculator lives in
Strategy Lab** (`web/lib/risk-graph/surfaceModel.ts`, from the
transplanted `useRiskGraphCalculations` / proto `computeSurface`).
**The same model is used across apps** — Design Convexity, Options Lab
Analyzer Surface viewport, and (next) the day-replay harness.
Do not fork a second grid or a second pricer.

**Locks:** Per-leg IV (DL-380). A single-IV sheet is allowed only when
labeled `sticky_cli` (Design without a live chain). Analyzer Surface
is presentation of that sheet (AZ-VP-S3), not a new engine. Harness
walks `evaluatePnlAtSpot` / `sampleSheet` on the same functions.

**As-built:** `computeSurfaceSheet` + `evaluatePnlAtSpot` +
`SharedSurfaceView`. Design Convexity hosts the sheet. Analyzer
`SurfaceViewport` renders the same view. Three.js mesh port remains
presentation-only later.

**Does not** implement the day-replay runner in this entry — that
adopts this model next.

---

## 2026-08-16 — DL-389 Entry warrant + dynamic trailing exit

**Decision (Coach):** Timing & Entry is a **wide-range warrant** —
hence a **pseudo-code** field — not a morning/before_close pulldown.
**OTM butterflies** use **VP structural levels and price action**.
**GEX, order flow, etc.** might also be criteria that an entry is
warranted. Exit rules are **similar** (wide range, pseudo-code) but
**generally a dynamic trailing stop**, with **time**, **premium decay**,
and the rest as the dynamic part.

**Locks:** SL-GD37 / SL-GD38. Acceptance #16–17. GEX as an optional
*entry* warrant does **not** retire GEX as **management** once on
(SL-GD12). VP trigger grammar (SL-GD29) still applies when VP is a
criterion. Trail remains required.

**As-built:** `entry_conditions.criteria` ⊂ {`vp_structure`,
`price_action`, `gex`, `order_flow`} + `pseudocode`. `entry_trigger`
JSON for the VP row. `exit_rules.drivers` ⊂ {`premium_decay`, `time`}
+ `pseudocode`. Designer: warrant chips + VP selects + pseudo-code;
exits: trail label + driver chips + pseudo-code. House designs default
OTM-style criteria to VP + price action; exit drivers to decay + time.

**Does not** implement live order-flow or GEX-as-trigger fire. Encode
with the classifier / GEX manage-time wave.

---

## 2026-08-16 — DL-388 Convexity RoC change band

**Decision (Coach):** Convexity & Debit already names the **find**
range (debit-to-width / debit-to-payoff). It now also names the
**magnitude of convex change**: an optional RoC band on Advanced Flies
**tick-%** (`pct_change`), expressed as min and/or max percent —
e.g. >20%, >30%, <40%, 20–40%.

**Locks:** Find band ≠ change band. RoC is **absolute tick-%
magnitude**, not a dollar debit and not `min_convexity_quality`.
Omit a side for open-ended. Values ≥ 0; min ≤ max when both set.
**SL-GD36.** Pack fields `convexity_roc_min_pct` /
`convexity_roc_max_pct`. Acceptance #15.

**As-built:** Designer one-row RoC control + Choices chip. Rank records
the band. Phase 1 has no live tick % → `convexityRocPct` is null and
`convexity_roc_uncomputable` is honest; candidates are **not** silently
dropped. Live filter when Convexity hosts Advanced Flies.

**Does not** invent a stub RoC from expiry payoff samples.

---

## 2026-08-16 — DL-387 Return distribution shape as primary metric

**Decision (Coach):** Risk & Capital **Primary Optimization Metric**
gains **return distribution shape** (`distribution_shape`) alongside
Sharpe / Sortino / Calmar / return÷avg DD.

**Locks:** The Monte Carlo **shape** of returns (right-skewed, long right
tail, short left tail) is a first-class Design primary — the same law as
SL-GD17 (MC shape, not one-path winner). Ratios remain allowed. **Win
rate** and **raw return** stay forbidden (HC-2 / HC-3).

**New law:** SL-GD35. Pack Architecture **HC-2** amended. Acceptance #14.

**As-built:** schema option first in the list; Designer label “Return
distribution shape”; ranking reads `expectedDistributionShape`. Phase 1
has no MC distribution — the metric is **uncomputable** and ranks via
the honest convexity-ratio proxy (`primary_metric_substituted`), same as
the ratios today. Do not invent a fake shape score from a single path.

**Does not** change house-design defaults (still sortino / calmar) or
compute a live shape score. Encode the score when Review / SSR MC lands.

---

## 2026-08-16 — DL-386 VP market memory (Yankee lane)

**Decision (Coach):** Fold *VP Structural Analysis* **§7 Market memory**
(PDF updated 2026-08-16 13:39 with verified peer-reviewed long-memory
grounding) into Guiding Doctrine Spec v1.0 **§17.7** and Arch **32** §6c.
Searchable extract and full Coach text updated in
[`docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md`](../docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md)
and
[`docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md`](../docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md).
Position paper §3 carries the operational claim without the academic
roster.

**Locks (Coach text kept):** structural analysis does **not** require
daily updating; nodes remember weeks–decades; mature region refresh as
little as every **3–4 weeks** (minor edge / shelf / LVN); frequent
updates only where history is thin (ATH / untraded — **forming**). Long
memory is the operational face of a **documented statistical property**
(Mandelbrot lineage + peer-reviewed long-range dependence, especially in
magnitudes and volatility) — **not one man's claim**. Reception history
illustrates the thesis: the crowd ignored it because it was inconvenient;
documented practitioners used it; "we sit there *because* they will not"
has a forty-year Street precedent.

**New laws:** SL-GD30–34. SL-GD28 amended (`profile_version`,
`structure_maturity`). Acceptance #12–13. Member-facing one-liner #5:
*The arrows are the strategy. The structure they point at remembers.*

**Platform laws:** profile = **cumulative composite over the full tape**
(not a 30-day window); 2004–2026 SPY tape is the foundation; recency is
one weight among volume mass, confirmation count, and age; VP is a
**slow layer** (`profile_version` on every trade; never 3–5s beside
greeks); cadence is a function of memory (`structure_maturity` mature /
forming); node **age + confirmation count** are trigger filters; VP-AI
learns **change-detection**, not daily generation.

**Lineage seat:** Yankee (Mandelbrot channel) — first packet. Yankee
gates framing: fat tails and long memory as documented properties, never
as a slogan.

**Cite-gate (Coach):** academic names (Lo, Ding–Granger–Engle, ARFIMA /
FIGARCH, Peters, econophysics) and practitioner names (Taleb, Spitznagel,
Thorp, Simons, Mandelbrot–Fisher–Calvet) stay **bench-only** until a real
reference pass. Source list named in Spec §17.7. **Never** as platform
performance claims.

**Does not implement** the cumulative-composite SoR, `profile_version`
runtime, maturity flags, or VP-AI. Encode next with Timing & Entry +
classifier.

---

## 2026-08-16 — DL-385 VP trigger grammar for Timing & Entry

**Decision (Coach):** Fold *VP Structural Analysis — Reference for the Timing
& Entry Trigger Grammar* (PDF, 2026-08-16) into Guiding Doctrine Spec v1.0
**§17** and Arch **32** §6c. Searchable extract:
[`docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md`](../docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md).
Pack field `entry_trigger` documented on butterfly schema.

**Locks:** The cyan arrows **are** the strategy. Trigger =
`level_class × interaction × session_window → travel_target`. Level classes
are HVN top / HVN bottom / LVN / intranode / retracement — topology, never a
stored price. Interactions: test, hold, break, retest, reject. Session
windows include overnight through T−N to close. **VP levels are 0DTE entry
events**, not only a 3–5 DTE lens. Classifier is versioned provenance; Coach
morning ES chart (Aug 12–14 2026) is the reference implementation. SPY tape
now; **ES when wired**. Resolve: classified VP on surface read; selector
only after trigger fires.

**New law:** SL-GD29. SL-GD11/12 amended (windows; 0DTE VP entries).
Acceptance #11.

**Does not implement** the Timing tab UI or the classifier. Encode next with
Timing & Entry.

---

## 2026-08-16 — DL-384 Config resolution standard folded into SL-GD

**Decision (Coach):** Fold
[`docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md`](../docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md)
into Guiding Doctrine Spec v1.0 **§16** and Arch **32** §6b as **normative**.
Advisor draft said Coach rules; Coach asked the fold.

**Locks (Coach text kept):** a strategy is not a trade — it is a rule that
resolves against the surface it meets; no absolute in the config that the
surface will move; surface is a moving 3D per-leg-vol object; fields are
surface-relative; placement is a selector not a strike; **one selector, two
callers** (heatmap preview + bot); resolve order regime → window → surface →
selector → scope → attempt (retry 3–5, abandon out-of-scope) → hold → record;
same config, different day, different fly, same seat; MC varies fills/retry/
operator friction, not tape or config; two-curve law inside resolve; two-truth
(human preview + machine resolve) — designer done when every tab is
machine-grade; provenance on every resolved trade.

**New laws:** SL-GD23–28. Acceptance #9–10 (no hard strike / dollar-only debit
as the strategy; no second picker).

**Does not implement** the shared selector module or provenance blob — encode
next with Convexity host.

---

## 2026-08-16 — DL-383 Strategy Lab engine: potential R2R · atomic position

**Decision (Coach):** Two engine rulings, now **SL-GD21/22** in
[`FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md)
**§15**. Process Runtime v1.1 ExitPolicy + **O-6** amended. Arch **32** §6a.

1. **R2R** is **trade POTENTIAL at design/entry** — max potential payoff vs
   defined risk of the structure **as placed** — **never** on result.
   **ExitPolicy** fields are **potential-denominated** (fraction of max
   profit, fraction of debit, tent-relative) and **structure-agnostic**.

2. A **trade is one atomic position** regardless of leg count. Trade log,
   backtest events, orders, exits, and outcome buckets address the
   **position**, never a leg. Order dedup **keys the position**: one
   idempotency key per attempted **position** fill or exit; the retry
   loop resubmits the **position** under that key. **Log both.**

**Does not reverse:** O-1…O-5 (tightens them to position tags); Trade Log
`entry_r2r` (already potential); ExitPolicy structure-agnostic lock
(v1.1.1). **Does not** implement tent-relative UI or live O-6 in this
entry — those are encode-next.

---

## 2026-08-16 — DL-382 Strategy Lab guiding doctrine (position, don’t predict)

**Decision (Coach):** The 2026-08-16 process lock is **normative guiding light** for
every Strategy Lab phase, Design tab, Curate cluster, Deploy book, backtest,
and forward walk.

**Law:**
[`Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md)
(SL-GD1–20).

**Architecture map:**
[`Architecture/32-strategy-lab-guiding-doctrine.md`](./32-strategy-lab-guiding-doctrine.md).

**Position paper:**
[`docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md`](../docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md).

**Locks (Coach text kept in full in the Spec):** we position, we don’t predict;
skin in the game to harvest the fruit; enter and embrace the roundabout
(Mises · Spitznagel · Austrian); curate okay strategies into non-correlated
clusters then deploy and keep curating; market landing 50 / 37.5 / 10 / 2.5
(12.5% = analyst EM average; beyond-EM touched more, in clusters; pins more
in high VIX); 37.5% funds the 50%; frosting = convexity just beyond EM;
premarket plan (not night-before default; EU-open special); session morning /
afternoon / close; 1DTE Batman = close at T−N; VP HVN/LVN = structure;
GEX = management; 0–1 vol-led, 3–5+ structure-led; opportunistic vs last-day
curves; designed max DD **2–6%**; MC shape not one-path winner; R2R from
Advanced Flies tile; widths in strikes.

**Does not replace:** life-cycle kernel, pack architecture, Curate/Deploy
surface, Arch 16/17/26, OPF/DL-309, Advanced Fly spec. **Wins** where those
are silent on this doctrine. Coach Content Law: later reviews sit beside;
they do not delete Coach sentences.

**Honesty:** Spec §13 lists as-built vs not-yet (heatmap-in-Convexity, 2–6%
lock, named exits, cluster correlation).

---

## 2026-08-15 — DL-362 Campaign spec includes Find and Badge

**Decision (Coach):** Update the campaign spec to include the search and
manage feature (Find and Badge).

**As-built:** Member Campaign Spec v1.3 **§9a**. Surfaces table + allocate
dispense #4 + acceptance #26. Amendment v1.0 points at §9a. Coach allocate
quote in the Amendment is unchanged.

---

## 2026-08-15 — DL-381 Primary surface picture is the ISO/RISK 3D P&L sheet

**Decision (Coach):** The primary surface is the **3D real-time P&L**
sheet in `3d1.png` (filed
`Specs/references/3d-pnl-surface-primary.png`). Green/cyan mesh = T+0;
pink = expiration tent; yellow dots = strikes; BE labeled on the sheet.
Shape from **per-leg vol**. Hold/fold reads this.

---

## 2026-08-15 — DL-380 P&L surface shape is from per-leg volatility

**Decision (Coach):** The 3D real-time P&L surface’s **shape** is created
**through per-leg volatility**. That is how skew is in the tent.

**As-built:** Method Spec §1a.2 · §2 · DL-364. Not flat vol. Not
`backtest.surface_reconstruct`.

---

## 2026-08-15 — DL-379 Hold/fold uses the 3D real-time P&L surface + position

**Decision (Coach):** We have the **primary surface** and **our position
on it** to assess the **risk of losing more than we want**. The surface
is a **3D model of the real-time P&L surface**.

**As-built:** Method Spec §1a.2 · same Options Lab per-leg sheet (§2 ·
DL-364). Replay places the attached fly on that sheet at each instance.
% trail is still a thumb-rule (DL-375).

---

## 2026-08-15 — DL-378 Replay: config hold-or-fold at each instance

**Decision (Coach):** We **replay the day**. The **configuration** makes
the decision to **hold or fold at each instance** of the day.

**As-built:** Method Spec §1a.2 · config interface Band 4. Instance = gold
snapshot. Policy is per attached side. First replay computable from clock +
debit + mark + peak + listed wings. %’s remain a thumb-rule; Trade Feed
is not required to take the first hold/fold.

---

## 2026-08-15 — DL-377 PM subject is the fly price attached to

**Decision (Coach):** Profit management depends on **which side price
decides to attach** — the **call fly** or the **put fly** is the
**subject**. Not the Batman as one blob. The other side may stay dead.

**As-built:** Method Spec v0.2.2 §1a.1. Trade Feed example is the call
attach. Same grammar if price attaches to the put.

---

## 2026-08-15 — DL-376 Trade Feed paper is the PM nuance proposal

**Decision (Coach):** The Trade Feed paper
(`/Users/ernie/Documents/TradeFeed.pdf`, filed
`Specs/references/TradeFeed.pdf`) is the proposal for **nuanced
management** of the trade, with a worked scenario. Arranged note:
`docs/Trade-Feed-Nuanced-Management-Proposal.md`.

**As-built:** Method Spec §1a.1 points at it. Does not tell the trader to
exit. Does not replace 75/60/50 as the mechanical thumb-rule. Example
trade in the paper is SPX 0DTE 7750/7770/7790 call fly @ $4.85 — not the
Batman $2 next-expiration lock.

---

## 2026-08-15 — DL-375 Batman PM: % trail is a rule of thumb; curve shape is the risk

**Decision (Coach):** You hope price continues higher and give it room to
surge and pull back. As the day wears on, premium decay **changes the
profit-curve shape**: real-time breakevens **converge**, the curve
**steepens**, a **healthy pullback** can **jump you out**. There is
**nuance other than the %’s**. The percentages are a **rule of thumb**.

**As-built:** Method Spec v0.2.2 §1a.1. Do not implement 75/60/50 as if
they were the whole profit-management law.

---

## 2026-08-15 — DL-374 $199 meant $100

**Decision (Coach):** If he said **$199** he meant **$100**. The PM
set-window remains **> $75 but < $100**.

**As-built:** Spec v0.2.2 §1a.1 — $199 is not a second number.

---

## 2026-08-15 — DL-373 Batman PM: on over $75; 75% trail = 25% of $75–$100

**Decision (Coach):** PM is **turned on** and the trail is set when price
goes **over $75**. By the time the trail can be set, price will probably
have run — that is why the window is **> $75 but < $100**. **75% trail**
= **25% of $75 = $19**, **25% of $100 = $25**. That $19–$25 is the
minimum profit you should generate if PM was triggered in that band.

**As-built:** Method Spec v0.2.2 §1a.1 restated. Numbers: $75 / $100 /
$19 / $25. ($199 meant $100 — DL-374.)

---

## 2026-08-15 — DL-372 $19–$25 is minimum profit generated after PM trigger

**Decision (Coach):** If the high never exceeded $100, **$19–$25** is the
**minimal amount of profit you should generate** if profit management was
triggered. It is a **floor outcome**, not the running stop mark.

**As-built:** Method Spec v0.2.2 §1a.1 restated. Prior India gloss that
treated $19–$25 as “where the stop sits” is corrected.

---

## 2026-08-15 — DL-371 Batman profit management (per side, expiration day)

**Decision (Coach):** PM is per side. Trigger at **75% of risk taken**
(example $1 debit → unrealized **> $75 and < $100**). Trail at **75% of
top gain** ($19–$25 if the high never exceeded $100) through **9:30–11:00**
ET. At **11:00** trail drops to **60%** of top gain; at **12:30** to
**50%**. If price enters the **profit tent**, trail = **tent walls**. Both
sides may actively close on expiration day; usually none or one side has a
profit opportunity.

**As-built:** Method Spec v0.2.2 §1a.1. India reading of “75% of top gain”
= give back 75% / keep 25% (matches Coach’s $19–$25) sits **beside** the
lock.

---

## 2026-08-15 — DL-370 Batman expiration is the next expiration (Fri = 3 DTE)

**Decision (Coach):** Friday Batman entry is **Monday expiration**, or
**3 DTE**. The real requirement is the **next expiration**, not a 1-DTE
label.

**As-built:** Method Spec v0.2.2 §1a restated. Gold tap must hold **next
expiration** at ~15:45 ET, not only 0DTE.

---

## 2026-08-15 — DL-369 First test strategy is Batman (1 DTE, 3:45 ET)

**Decision (Coach):** Start with the **Batman**, not the single OTM butterfly.
Entry is time-only (~**3:45 PM Eastern**, Mon–Fri). Expiration is the
**next session** (Friday → Monday). Find a **20-wide put fly** and a
**20-wide call fly**. Each fly debit **≤ $1**. Package debit **≤ $2**, with
slippage fudge to **$210**. Target **$2**.

**As-built:** Method Spec v0.2.2 §1a. 0DTE OTM Butterfly is **parked**
(teardown doc remains). Aug 14 gold is **0DTE** — this Batman needs
**1 DTE** on the coming-week tap.

**India reading (not Coach):** $2 = option-dollar package debit; $210 =
cash with 100-multiplier + $10 slip. Coach may correct.

---

## 2026-08-15 — DL-368 First test strategy is 0DTE OTM Butterfly

**Decision (Coach):** Establish a **single** strategy to test. It is called
the **0DTE OTM Butterfly**.

**As-built bind:** house design `0dte_otm_classic_butterfly` v1.0.0
(**0DTE OTM Classic Butterfly**, DL-235). Method Spec §1a. First gold day
2026-08-14. Not Batman. Not a catalog bake-off until Coach names another.

---

## 2026-08-15 — DL-367 Gold volume renamed sabrant2tb → FatTail2TB

**Decision (Coach):** The data disk that holds `fattail-market-data` is
named **FatTail2TB**. Path: `/Volumes/FatTail2TB`.

**As-built:** `diskutil rename` on StudioOne (`disk43s1`). Friday
`live_capture/day=2026-08-14` is intact. `/Volumes/Sabrant 2TB` is the
other APFS slice on the same enclosure — **do not write gold there**.

Env / defaults: `LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data`.

---

## 2026-08-15 — DL-366 Gold tap host is StudioOne

**Decision (Coach):** Push the live-capture operation onto a dedicated
machine **StudioOne**. Not StudioTwo (laptop). Not MiniTwo (production web).

**As-built (pending SSH):** `studioone.local` / `192.168.1.111` is on the
LAN. Agent SSH is not authorized yet. Runbook:
`docs/ops/StudioOne-SSR-Live-Capture.md`. One writer. Same
`LABS_MARKET_DATA_ROOT` tree as Friday (Sabrant) unless Coach names a new
root. Unload StudioTwo `ai.fattail.labs.ssr-live-capture` after StudioOne
writes the first snap.

---

## 2026-08-15 — DL-365 Gold archive: a week, then continuous, then the lab

**Decision (Coach):** Collect an **entire week** of live chain / marks this
coming week, **then continue that way continuously**, **then** turn it into
a proper lab for testing.

**As-built:** Friday 2026-08-14 is day one at
`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-08-14/`
(renamed from `sabrant2tb`, DL-367).
Standing tap: `ssr_live_capture` + launchd
`ai.fattail.labs.ssr-live-capture` (Mon–Fri 04:00 ET, this laptop, not
MiniTwo). Method Spec §1 sequence. Capture plan updated.

**Does not:** start the backtester this weekend. Does not rewrite Friday’s
5-minute chain cadence. GOLD 3–5s chain remains the target as the archive
tightens.

---

## 2026-08-15 — DL-364 Backtest fill surface is the Options Lab per-leg-vol sheet

**Decision (Coach):** The surface used for **determining fills** in the
Strategy Lab Backtest & Forward-Walk Method is the surface already in
**Options Lab**. It is **per-leg volatility** driven, so it **correctly
builds skew**.

**As-built:** Method Spec v0.2 §2 + §5.1. Options Lab OPF
`day_trade.mark_hybrid` (OPF14). Not a second engine. Not flat-vol
`backtest.surface_reconstruct`.

---

## 2026-08-15 — DL-363 Find and Badge chrome is title + tooltip; help owns the copy

**Decision (Coach):** Body copy under the **Find and Badge** title and above
AutoFilter is unnecessary. Tooltip at most. File the explanation in the
help system.

**As-built:** Campaigns page has the heading and HIG capsules only; native
`title` on the heading and AutoFilter. Member copy is in
`server/help_reference/app-areas.md` (**Campaigns**, **Find and Badge**) and
the User's Guide Campaigns section. Campaign Spec §9a Home + Help Concierge
Spec v1.2 section list match.

---

## 2026-08-15 — DL-361 Browser Paste chip on ToS clipboard read is accepted

**Decision (Coach):** Safari and Firefox may still show their Paste chip
when New Trade reads a thinkorswim ticket, **and** they still open the
drawer with the script. Chrome may ask once (Allow) then stay quiet.
This is acceptable. Minimal chance it will confuse the member.

**As-built:** Unchanged from DL-360. No extra Labs button. Chip is the
browser’s grant for `readText`.

---

## 2026-08-15 — DL-360 New Trade chooser: close, ToS script, then open

**Decision (Coach):** New Trade presents ways to log the next opportunity.
Close unmatched opens first. If more than three opens, the close list
scrolls. Next: the standard ToS script window **only** when the clipboard
holds a valid ToS script — no link, no empty window. Tap the script to
open the trade entry form. Then a HIG **button** (not a link): Create a
new opening trade.

**As-built:** New Trade reads the OS clipboard on that click
(`readText`) so a ticket copied in thinkorswim can appear. Cheap look
then parse. Chrome/Safari may show their Paste chip — that *is* the
read. Labs copy and ⌘V still fill memory without a second read.

---

## 2026-08-15 — DL-359 Campaign badge color is unique and high-contrast

**Decision (Coach):** Campaign buttons/badges have a unique background
color selected from a color picker. If the fill is dark the ink is
bright/white; if the fill is light the ink is dark. Contrast between
badge background and text must be near maximum.

**As-built:** `member_practice_campaigns.badge_color` (#RRGGBB), unique
per identity. Not a charter field and not variance/conduct coloring.
Picker on create + editor. Blotter, Positions, Find and Badge, library,
and context chrome host the same token.

---

## 2026-08-15 — DL-358 Import chip under Exec time; manager stays off the header

**Decision (Coach):** The blotter Import badge sits under Exec time, dark
gray on light gray text, tooltip = import ID. Click opens the existing
Manage imports dialog (trashcan). Import Manager is a coming feature
(Conor) and is **not** on the main header.

**As-built:** `?import=<id>` / `?import=open` is the seam. Trade DTO
includes `import_id`. Automated chip stays next to strategy.

---

## 2026-08-15 — DL-357 Campaign names that say “book” confuse

**Decision (Coach):** Naming a campaign “Primary book” was a member naming
error from not yet knowing that book = account. The product must keep the
words apart so that error is obvious.

**As-built:** Campaign pickers prefix **Campaign ·**. Title fields witness
when the name contains “book”. Wiki: [[account]] [[book]] [[campaign]].

---

## 2026-08-15 — DL-356 Book = account (one-for-one) everywhere

**Decision (Coach):** A book is one-for-one the contents of an account. If a
member becomes confused by this distinction, that is a product failure. UI,
Guide, and Wiki must say it the same way. A campaign is a badge, not a book.

**As-built:** Practice chrome, Find and Badge, Trade Log scope, Reports
capital line, Accounts settings, `/guide`, wiki glossary [[account]] [[book]]
[[campaign]].

---

## 2026-08-15 — DL-355 Campaign filter is the whole book

**Decision (Coach):** A campaign badge is on the **total** trade log. Filtering
Trade Log or Reports to a campaign shows every position that wears that badge,
across accounts. Find and Badge and the blotter must agree.

**As-built:** Named campaign selected → list/reports omit `account_id` and
match the stamp only. Account switcher applies when the scope is **All
positions**.

---

## 2026-08-15 — DL-354 Records shows campaign or all-positions performance

**Decision (Coach):** In the Records (Reports) view you can easily see the
performance of a campaign, or the performance of all positions regardless of
campaign.

**As-built:** Practice chrome scope is **All positions** (default) or a named
campaign. Reports names that scope and, for a campaign, uses **allocated
capital**. The book is the same Reports path, filtered by badge.

---

## 2026-08-15 — DL-353 Find and Badge — any set, one badge or none

**Decision (Coach):** Find and Badge is how positions join a campaign or stay
unassociated. Every instance can be found by any chosen criteria, or by
campaign. A set of traded positions can take a campaign badge, or wear none.

**As-built:** Campaigns main page · AutoFilter (dates, strategy type, side,
effect, symbol, campaign) · found set is positions · clear then assign ·
window-ineligible rows are rejected · one badge or none.

---

## 2026-08-15 — DL-352 Find and Badge (campaign badge, not tag)

**Decision (Coach):** The search title is **Find and Badge**. A position
**wears a campaign badge**. That is the terminology.

**As-built:** Campaigns main page heading and links say Find and Badge
(`/app/practice/campaign#find-badge`).

---

## 2026-08-15 — DL-351 Find and tag lives on Campaigns; window rejects stamp

**Decision (Coach):** Search and replace of campaign badges is **exclusive to
campaigns** and belongs on the **Campaigns main page** — not the Trade Log,
not inside every campaign. A position that does not fit the campaign
(fill outside the window) is **rejected**; the badge is not applied. Turning
on that campaign filter will not show it.

**As-built:** `TradeFindTag` on `/app/practice/campaign#find-badge`.
`/app/trade-log/find` redirects there. Assign checks the campaign dates
before PATCH; out-of-window rows stay untagged.

---

## 2026-08-15 — DL-350 Clear/assign refreshes the found set

**Decision (Coach):** After clear or assign on selected found-set rows, the
found set **reloads under the current filter** and shows the new stamps. A
March-2023 filter still shows March; the campaign column updates. A campaign
filter drops rows that no longer wear that badge.

**As-built:** Explicit `PATCH practice_campaign_id: null` is **undirected**
(does not re-stamp from memory). Find and tag then refetches `/found` + the
paged list. PATCH no longer 500s on option-right infer.

---

## 2026-08-15 — DL-349 When AutoFilter is a calendar hierarchy

**Decision (Coach):** The date filter is staged on a calendar. Years, then
months, then days. Days stay collapsed until the month is expanded. If the
book is one year, open that year and show months. If there are multiple years,
first open shows collapsed years only.

**As-built:** Find and tag When menu is `DateWhenFilter` (`year → month → day`).
`GET /distincts` returns unique `days`. Filters compact to `years` / `months` /
`days` on `/found` and the paged list.

---

## 2026-08-15 — DL-348 Find and tag found set is range + position count

**Decision (Coach):** The found set must be **clear**. Show the **date range**
and the **number of positions**. Listing the whole book as an endless page is
unmanageable — thousands of trades would overload the page. The table scrolls
or pages. Load-range is gone.

**As-built:** `/app/trade-log/find` banners the found set (`GET /found`:
`first_day` → `last_day` · `position_count`). Rows page at **50**. AutoFilter
searches the book via server filters + `GET /distincts`, not the visible page.

---

## 2026-08-15 — DL-347 Trade Log display window 20–50 contract rows

**Decision (Coach):** The blotter is a **window** into a lazy-loaded list. The
trader may lengthen that window from **20** to **50** contract rows in steps of
**10**. The control does **not** decide how many trades are loaded — the system
keeps lazy-load page size for memory and performance.

**As-built:** `TradeLogTable` Window select · `ft.tradeLog.blotterWindow.v1`.
Server `limit` remains 80.

---

## 2026-08-15 — DL-346 Campaign = window on the book; allocate stamps

**Decision (Coach):** A campaign is a **time-based window** on the **total
trade log**. Only trades tagged with that campaign show; the rest are filtered.
A trade has **one campaign or none**. Terms (what you can trade, size, max DD)
are **witnessed** — report and warn, never gate. The member **searches, selects,
and manages** which campaign a trade is allocated to.

**As-built:** Find and Badge is **one** surface — Campaigns
`/app/practice/campaign#find-badge`. Campaign pages show **only badge-tagged
trades**. AutoFilter hidden until toggled. Clear-before-assign. Five undos.
Window-ineligible assigns are rejected.

---

## 2026-08-15 — DL-345 Retro heading drawdown = current period % of capital

**Decision (Coach):** The heading-card drawdown is the **current drawdown in the
period under the retrospective**. The denominator base is the trader's **total
trading capital**. If a **campaign is in place**, use that campaign's
**allocated capital** and the campaign's stamps. Never a silent $50k or a
Reports what-if override on this compass. Unset capital is named.

**As-built:** `resolveHeadingCapital` reads **Accounts & Capital**
(`/api/me/capital/overview` entered starting balances) as total trading
capital — not the Practice-context book and not a $50k placeholder. Campaign
in place → allocated capital. Drawdown headline is current period % on that
base. Shape = full distribution with period trades in contrast. Practice =
Journey radar with this period overlaid. Spec still **DRAFT**.

---

## 2026-08-15 — DL-344 Retro page headers with Reporting Standards Heading Card

**Decision (Coach):** The retrospective page opens with the **Heading Card** from
Reporting Standards Spec v0.1 §7a — verdict + Journey score + trajectory chips,
then shape vs true north, drawdown ribbon, practice balance. That is the header
idea. Not the old dual-report / maiden-journey explainer.

**As-built:** `RetroHeadingCard` on `/app/retrospective` and
`/app/retrospective/{id}`. Honest empties: win-band RoD and drawdown conduct
are not scored; trajectory is process-comparison until evaluation cards exist.
Period brief stays as evidence under the heading. Nine-step ceremony remains
as-built below (Reimagined Phase 0 — not replaced here). Spec still **DRAFT**.

**Spec:** [`Specs/FatTail-Labs-Retro-Reporting-Standards-Spec-v0_1.md`](../Specs/FatTail-Labs-Retro-Reporting-Standards-Spec-v0_1.md) §7a as-built preview.

---

## 2026-08-14 — DL-343 Retrospective reimagined — Phase 0

**Decision:** Open Phase 0. Nine-step ceremony is **dead** as chrome **and** as Coach
conduct. Reimagine from first principles. Data law and the four questions **survive**.
Experience is otherwise **open**. Coach will state the vision; capture verbatim.

**Spec:** [`Specs/FatTail-Labs-Retrospective-Reimagined-Spec-v0.1.md`](../Specs/FatTail-Labs-Retrospective-Reimagined-Spec-v0.1.md) — THESIS.

**Not yet:** Juliet design, implementation, or a replacement walk.

---

## 2026-08-14 — DL-342 Member AI Memory & Period Brief Spec v1.0 (IN REVIEW)

**Decision:** Land
[`Specs/FatTail-Labs-Member-AI-Memory-and-Period-Brief-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-AI-Memory-and-Period-Brief-Spec-v1.0.md).
Captures Coach discovery: personalized assistant (Journey, Trade Log, past
Journal, retros); compile not a second soul; speed; retro-start standard
infographic; admin instructions as system-wide law.

**Status:** IN REVIEW. Shipped slices are as-built in the spec. Remaining
slices (hot brief, visible brief, stream, retrieve) wait GO.

---

## 2026-08-14 — DL-341 Retro start — standard period brief infographic

**Decision (Coach):** When a member starts a retrospective, gather compiles the
window since the last review into a **standard report + infographic**
(`period_brief`). Same layout for every member. Process counts and journal
clips — not a P&L scoreboard. Ceremony map remains below.

**As-built:** `build_period_brief` on gather · `RetroPeriodBrief` on the
workspace.

---

## 2026-08-14 — DL-340 Journal admin Edit — AI Instructions + reasoning

**Decision (Coach):** Journal follows the Labs lower-left black **Edit** button.
It opens an **AI Instructions** overlay on the message box: markdown editor,
**Close** to dismiss, bottom **Reasoning** dropdown (low / medium / high) +
**Save**. Markdown window matches Playbook / Toughness (`MarkdownEditor`).
Site-wide app-framework Edit is deferred.

**As-built:** `GET/PATCH /api/admin/journal-prompts` · `reasoning_level` on
`journal_session_prompt_versions` (mig **128**) · agent passes `reasoning_effort`
to Grok.

---

## 2026-08-14 — DL-339 Journal day card — no tags, campaign, playbooks, interview

**Decision (Coach, j.png):** On the Journal day view, remove **Tags**, **Campaign**,
**Playbooks**, and **structured interview** (and interview soft-beats). Image drop
**full width**. Message thread **taller** into the saved space. Suite nav Playbook /
Campaigns stay.

**Data model:** session is a conversation (date + messages + attachments + prompt
version). Create does not write tags, structured_json, or practice_campaign_id.
Compile reads member messages. Leftover columns may be NULL.

**Spec note:** Journal Session v0.6 header (2026-08-14 Coach day-view ruling).

---

## 2026-08-14 — DL-338 Member Settings page (User menu)

**Decision:** Add **Settings** to the account menu, next to Profile. Route `/settings`.
Catch-all for application and site-wide prefs on this device.

**v1.0 panes:** **Appearance** (`system` \| `light` \| `dark`) · **Font size**
(`small` \| `medium` \| `large` \| `larger`) · **Alerts** UI (supported, delivery
not live; SMS/Email digest Coming soon). Member color scheme overrides published
site appearance when set.

**Spec:** [`Specs/FatTail-Labs-Member-Settings-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Settings-Spec-v1.0.md)

**Not in v1.0:** server-synced prefs; live alert delivery; extra sidebar items from
the Coach Alerts reference (Symbols / Tags / Brokerage / Streaming).

---

## 2026-08-14 — DL-337 Doctrine §14 — Transcribe rulings; do not create them

**Decision:** Add foundational principle **14**. When Coach states a ruling, principle, or
law in conversation, filing it the same day (spec / doctrine / DL), **verbatim**, and
showing it after, is **documentation parity — not initiative**. Inventing product, scope,
or design Coach did not state remains forbidden.

**Also:** a hardening/round after implementation is **expected process**. Audit &
Hardening Round Spec **v1.1** is the one lineage (four phases; Simplify is the named
phase). v1.0 §3 (“other phases may be added”) is **withdrawn** — it invented scope.

**Coach text** is in doctrine §14 verbatim.

---

## 2026-08-14 — DL-336 Doctrine §13 — Rounds are where we simplify

**Decision:** Add foundational principle **13** to `agents/bench/doctrine.md`. Land
[`Specs/FatTail-Labs-Audit-and-Hardening-Round-Spec-v1.1.md`](../Specs/FatTail-Labs-Audit-and-Hardening-Round-Spec-v1.1.md)
**§2 Simplify** as the sanctioned home of optimization. Builds deliver the vision
exactly (doctrine §12). Rounds may simplify only if the accepted **interface** still
passes side-by-side and **performance** is equal or better, **measured**. Echo re-gates
touched surfaces; characterization proves equivalence; suite stays green and
warning-free.

**Coach text** is verbatim in doctrine §13 and Spec §2.

---

## 2026-08-14 — DL-335 Journal + Retro interface-floor program GO

**Decision:** Accept Retrospective Spec **v0.7.1 §6.3** (both Coach paragraphs) as law.
Accept [`docs/Journal-Retro-Interface-Floor-Full-Agent-Bench-Plan-v1.0.md`](../docs/Journal-Retro-Interface-Floor-Full-Agent-Bench-Plan-v1.0.md)
as the only execution sequence. Board `agents/p-journal-retro-floor/`.

**Locks:** Echo visual-law packet before Charlie. Coach is side-by-side and in-use judge
(IF6). `journalBeats.ts` never returns as the conversation. Conversation Lab STOPPED.
StudioTwo only unless a later GO names MiniTwo. Doctrine §12 applies.

---

## 2026-08-14 — DL-334 Doctrine §12 — The Vision Is Coach's — The Craft Is Ours

**Decision:** Add foundational principle **12** to `agents/bench/doctrine.md`. The bench
realizes Coach’s vision; it does not substitute its own. Contribution is **craft and
efficiency** (Apple HIG sophistication, Claude-grade interface intelligence, fastest path
that does not compromise the result). When vision and effort collide: say “this is hard,
here is the cost” — never quietly build less. Initiative is HOW, never WHAT or WHETHER.
An easier ship that works is still a failure.

**Coach text** is in doctrine §12 verbatim.

**Related:** Journal Retrospective v0.7.1 §6.3 interface floor (IN REVIEW).

---

## 2026-08-14 — DL-333 Retrospective compiles Journal; does not re-ask the week

**Decision:** The four questions live in **Journal**. Retrospective **compiles** structured
journal answers (`journal_compile`: said / in the way / worked / next) and asks only for
**the fix** (`one_thing_md`) plus an optional missed-note. Map tiles are look-up, not a form.

**As-built:** gather emits `journal_compile`; workspace “From your journal”; migration **126**
`one_thing_md`. Pile filed this as DL-324; that number is the VP Spec v0.3.1 fold on `main`.

**Spec:** Journal Retrospective **v0.7.1 §5.3**.

---

## 2026-08-14 — DL-332 Characterization suite uses own probe courses

**Decision:** Characterization tests that need a published/draft course **create and
delete their own probe rows** (`zztest-*` / helpers in `server/tests/conftest.py`).
They do **not** depend on the live flagship slug `fattail-foundations` (or any other
seeded catalog course) having specific lesson flags, duration, or free_preview.

**Why:** On 2026-08-14 the suite went red against production `main` because live
content no longer matched fixtures the tests assumed. That is characterization
against the wrong SoR. Probe courses keep the suite honest when Coach edits the
flagship.

**As-built:** `89f2216` (`test: green characterization suite on production SHA`).
Number is **DL-332** so it does not collide with pile DL-325–331 (journal/lab/GO).

---

## 2026-08-13 — DL-323 Retrospective historical cadence (avg days / trades)

**Decision:** Preview and start chrome show the trader’s **own** completed-review averages:
mean calendar days and mean trade count. Derived on read from completed
`member_retrospectives` (scope span + stamped report trade count). **Maiden excluded** from
the average (baseline, not a cadence cycle). Fact copy only — never a gate, never “behind
your usual.”

**As-built:** `build_cadence_history` on `GET /api/me/retrospectives/preview-scope` as
`history`. Library banner + start confirms.

**Spec:** Journal Retrospective **v0.7.1 §5.2**.

## 2026-08-13 — DL-322 Retrospective start readiness (7 days or 5 trades)

**Decision:** Starting a retrospective is **recommended** when the next window has at least
**7 calendar days** since `scope_start` **or** **5 trades** in that window. Below both floors,
show a **gentle, overridable** notice. Create/gather stay allowed.

**Not changed:** Option C (activity between last `scope_end` and `completed_at` stays unowned).
Cadence (`retro_cadence_days`) still owns “how often,” not this material floor. Trader-selected
floors may replace the 7 / 5 constants later.

**As-built:** `build_start_readiness` on `GET /api/me/retrospectives/preview-scope` as
`readiness`. Library banner + start confirm (“Start anyway”). Journal create path uses the
same guard.

**Spec:** Journal Retrospective **v0.7.1 §5.1**.

## 2026-08-13 — DL-321 Apps hub card highlight toggle

**Decision:** Each `/app` card has an **admin-only** iOS switch. On → persist
`apps.highlighted` (migration **125**) and paint the card: very light powder
blue fill (`#EEF4FB`) and a **thick** darker-blue outline (`3px` `#1B4F8B`).
Members see the highlight, not the control. Write path is the existing
`PUT /api/admin/apps/{id}` (`highlighted` added to allowed fields).

**Spec:** Catalog-Order v1.1.2.

## 2026-08-13 — DL-320 Apps hub order walks 2-col reading order

**Decision:** `/app` admin steppers are **← →**, not ↑↓. A card walks the
2-column **reading order**: top-left → right → first cell of the next row →
… → bottom-right. The last cell wraps to top-left; the first cell wraps to
last. Implementation: `walkCatalogOrder` (extract + insert at wrapped dest).
Still admin-only; write path unchanged (`POST /api/admin/apps/reorder`).

**Why:** ↑↓ on a 2-col grid looked like column-only motion and disabled at
the ends. Coach: cards must change columns; last goes back to top-left.

**Spec:** Catalog-Order v1.1.1.

## 2026-08-13 — DL-319 Apps hub catalog order (admin-only)

**Decision:** `/app` card order is editorial, same contract as `/course`
(Catalog-Order Spec **v1.1**). Source of truth is `apps.sort_order`. Admin
reorders with B4 ↑↓ steppers on the hub cards; write path is
`POST /api/admin/apps/reorder` `{app_ids}` (×10 rewrite, `require_admin`).
Members never see steppers and cannot write order.

Migration **124** inserts missing catalog rows (`practice-log`, `options-lab`)
so every visible card has a real id, and seeds today's hardcoded
`TOP_LEVEL_ORDER` as 10…70 so first deploy does not reshuffle. Nested Practice
suite apps stay off the grid. Hub compose still overrides Practice / Options
Lab title and href.

**Spec:** `Specs/FatTail-Labs-Catalog-Order-Spec-v1.0.md` v1.1.

## 2026-08-13 — DL-313 Reports starting capital is read-only from the account

**Number lock:** DL-313 is this money decision only. The 2026-08-12 VP Spec v0.3.1 fold was filed under the same number by collision; that entry is now **DL-324**.

**Bug (member ticket, ricaraus@gmail.com):** Reports showed a $50,000 balance vs the
member's real ~$40,806 starting capital. **Root cause:** Reports had an *editable*
"Starting capital" field that wrote a **browser-only localStorage override** — a shadow
value that disagreed with the account's real `starting_balance` (which was unset → the
$50k placeholder). That violated **Accounts & Capital Spec V16** (starting balance edited
**only** on Accounts & Capital — sole write path, Capital C9) and **V2** ("nothing typed
into the view"). The correct fix is the *opposite* of making Reports write the account
(that would be the forbidden "parallel write chrome"): make Reports **read-only**.

**Decision:** Reports "Starting capital" is now read-only, sourced from the account's
`starting_balance` (`resolveReportsStartingCapital`); the localStorage override is removed
from Reports. When unset, it shows the $50k **placeholder** (unchanged intent) plus a "set
in Accounts & Capital" link. `StatsTable.onCapital` is now **optional**, so Retrospective +
Strategy Lab keep their intentional editable what-if unchanged (the override helpers remain
for them). Frontend-only, no migration/API; full typecheck clean; both states verified
in-browser. Members set their real starting balance on Accounts & Capital and Reports
reflects it — one source of truth. *(Retrospective shares the same rogue-override pattern;
left for a follow-up. Strategy Lab's editable capital is a legitimate simulation.)*

## 2026-08-12 — DL-312 Consolidate to one Observer tier (fix Observer tool access)

**Bug (member ticket, radams@pme360.com):** Observer members couldn't add Journal / Trade
Log entries — "requires an active Observer trial or Navigator". **Root cause:** prod had
drifted from `seed_dev`. The intended state is a single Observer tier `observer-trial`
(`grants_role=navigator` → full tools), with every observer entitlement key mapping to it.
But prod also had a stale `observer` plan (`grants_role=observer` → no tools) and two stale
`provider_plan_map` rows `'Observer Access' -> observer`. The SSO sends the WooCommerce
plan **name** `"Observer Access"`, and `plan_id_for_provider_key` tries candidates in order
with exact-match first — so `'Observer Access' -> observer` shadowed the correct
`'observer-access' -> observer-trial`. Result: **37 active Observers all on the no-tools
plan, 0 on observer-trial**, so the `feature_role` elevation (which only fires for
observer-trial, DL-126/128) never ran. Confirmed radams was on `observer` (grants observer)
→ `can_create_or_gather` False.

**Decision (owner-authorised):** consolidate to the single intended Observer tier.
Migration `123` (data-only, env-safe by slug, idempotent): (1) repoint every
`provider_plan_map` row off the stale `observer` plan → `observer-trial`; (2) move all 38
`observer` memberships → `observer-trial` (full access; no member held observer-trial, so
no collision); (3) delete the now-unreferenced stale `observer` plan. Only `memberships`
and `provider_plan_map` FK-reference `plans`, and no code assigns the `observer` plan
(self-serve accounts are plan-less; role derived), so the delete is safe. Takes effect live
(the tool gate reads memberships live) — no restart. Observers now correctly show as
"Paid · Observer" in admin while getting navigator-tier tool access, matching the product.

---

## 2026-08-13 — DL-318 Structure Surface Replay thesis land (not GO)

**Decision:** Land Coach’s locked **Structure Surface Replay (SSR)** method as **DRAFT / THESIS** (not BUILD AUTHORITY).

| Artifact | Path |
|----------|------|
| Spec v0.1 | `Specs/FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md` |
| Architecture | `Architecture/31-structure-surface-replay.md` |

**Method (Coach lock):** freeze listed legs; precompute \(V(S,\tau;\sigma_i)\) (ISO/RISK sheet); walk the tape on that sheet; touch ≠ fill; seeded Monte Carlo; **distribution + shape** is SoR. Vol rebuild is milliseconds (per-leg). Adaptive refresh near exit contours.

**Sequence (binding):** **one RTH day first** → examine the MC distribution → **several different days** → learn/refine **dial ranges**. Forward walk = **same engine**, holdout days, **after** that sequence. Not a year job first. Not stub metrics as measurement.

**Does not:** authorize `server/ssr/` code, pack registry mutation, stub deletion, or production VP bins (P2-3 still OPEN).

**Rationale:** Coach asked for the method written as Spec + Arch so the bench can execute Slice 0 without another chat reconstruction.

---

## 2026-08-13 — DL-317 VP campaign host + plane APIs (no production bins)

**Decision:** RAW campaign target is **`/Volumes/sabrant2tb/fattail-market-data`** while `/Volumes/Pod 1` remains unwritable from the agent shell (TCC execute-only). Local staging `/Users/ernie/data/fattail-market-data` is **kept** as backup.

**Plane code landed (not a bin GO):**

- `LABS_MARKET_DATA_MOUNTS` fail-loud per mount (VP17) + `LABS_VP_MAX_N_BINS`
- Parquet kind schemas; Strategy Lab raw-day read contract
- Member `GET /api/me/market/volume-profile` returns named **WAITING** (not measured)
- Admin mounts / raw status; HTTP **must not** start a pull (409)
- VIX/VIX1D quarantine (422); SPX/XSP → SPY labels (`price_space=series`)
- Interim chart labeled **not measured tick VP**; no POC/VA chrome (VP3 / E-1)

**P2-3 still OPEN:** SPY 2024-06-03 all-prints vs Massive daily **+9.30%**. No `vp_bins_v3` production write.

**Rationale:** Continue estate collection and honesty surfaces without implying measurement SoR.

---

## 2026-08-12 — DL-312 Volume Profile Histogram Spec v0.3 + dual-store plan (process restore)

**Decision:** Restore formal Spec + implementation plan for the multi-year **Volume Profile / market data dual store** before any production-scale download. Prior chart + Spec v0.1/v0.2 work did **not** complete review → plan → Coach GO for the data plane.

| Item | Path |
|------|------|
| Spec (authority) | `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_3.md` (**v0.3.1 DRAFT** until Coach GO) |
| Plan | `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md` (v1.0.1) |
| Board | `agents/p-volume-profile-histogram/` |
| Supersedes | Spec v0.2 (trades-first laws retained; dual store + consumers added) |

**Laws locked in Spec (pending GO):** dual SoR (raw on Pod 1 + measured bins); trades-first measurement; 5y window; Strategy Lab reads raw; `LABS_MARKET_DATA_ROOT` fail-loud; ≤50 GB/symbol **trades** budget headroom; **no MSC code**; **TV microbin research-only**.

**Storage intent (Coach):** Blackmagic Pod share **Pod 1** → `/Volumes/Pod 1` when mounted.

**Not decided:** Coach W0-0 GO; OD-VP1…9.

**Rationale:** Coach needs a clear dual path (raw + bins) and capacity/entitlement reality before re-running acquisition; process gap left measurement plane unbuilt while interim OHLC chart existed.

---

## 2026-08-12 — DL-324 VP Spec v0.3.1 — external review fold

**Renumbered:** filed as DL-313; collision with Reports starting capital (DL-313, 2026-08-13). This VP fold is **DL-324**. Citations of “DL-313” for volume-profile mean this entry.

**Decision:** Fold 2026-08-12 Spec review into **v0.3.1** (same file). Strengths retained; gaps closed as law or OD.

**Superseded for authority by DL-314 / Spec v0.4** where conflict (collection posture, mounts, budget, pilot ladder). VIX quarantine and proxy-mapping *need* retained in spirit under v0.4 §5.5 / §7.2.

---

## 2026-08-12 — DL-314 VP Spec v0.4 — THE BIG KAHUNA (trumps prior review)

**Decision:** Adopt **Spec v0.4** as data-plane authority. Prior v0.3 pilot-first ladder and 50 GB/symbol budget are **retired**.

| Item | Path |
|------|------|
| Spec | `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md` (**DRAFT** until Coach GO) |
| Plan | `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md` (**v1.1**) |
| Board | `agents/p-volume-profile-histogram/` |

**Collection posture (VP21):** trades + quotes + 1s · all eligible symbols · full entitled depth. OD-VP1/2 **closed YES**.

**As-built (Coach):** SPY full-history **trades** already collected — acquisition no longer the risk surface. File path/GB/print-count evidence at GO (P2-1/2/5 retired-by-as-built).

**Gate for production bins:** §5 geometry freeze — especially **P2-3** condition filter + recorded AT-R2 tolerance — not collection.

**Storage:** multi-mount map `LABS_MARKET_DATA_MOUNTS` (Pod 1 + 4 TB staged + 8 TB network); VP18 = telemetry not rationing.

**Retained from reviews:** VIX/VIX1D quarantine (no VIXY VP); proxy price_space law (§5.5, default series + labels); ES honesty note; TV research-only.

**Rationale:** Massive is paid for the full book; take delivery. Measurement correctness is the remaining product risk.

**Note (Labs host check 2026-08-12):** `/Volumes/Pod 1` appeared empty from this workstation listing — Coach as-built SPY location must be recorded in evidence (path may be other mount or different machine).

---

## 2026-08-12 — DL-315 VP Plan v1.1.1 bookkeeping (GO polish)

**Decision:** Plan revision **v1.1.1** (filename remains `…-Plan-v1.0.md`; revision field is authority). Fire diagram includes **A**; M2/M3 residual language tied to **VP21** (403 or Coach DL only); C-2 names §5.5 fields; Spec §16 + plan state in-flight campaign is not halted for W0 paperwork alone.

**Rationale:** Reviewer GO-ready checklist; no architecture change.

---

## 2026-08-12 — DL-316 VP Histogram W0-0 Coach GO (Spec v0.4 · Plan v1.1.1)

**Decision:** **GO** for board `agents/p-volume-profile-histogram/`.

| Artifact | sha1 |
|----------|------|
| Spec v0.4 | `6ec8bb866d19ce084f090f7fd3ccd0de90e6e397` |
| Plan (rev v1.1.1) | `3245284aa56b0a456b04f96f64001337b7601b22` |

**OD-VP6:** keep raw forever until purge policy DL.  
**OD-VP7:** default `price_space=series` + proxy labels; product-space map needs future DL.

**Tracks:** RAW campaign authorized (Spec §16; do not halt for paperwork alone). **Production bin writes** remain gated on P2-3 condition freeze + C-0.

**Gates:** `agents/p-volume-profile-histogram/gate-reports/W0-0-coach-go.md` · W0-1 · W0-2 · **W0-G PASS**.

---

## 2026-08-12 — DL-311 Advanced Fly heatmap — Spec GO + Wave‑1 ship (AF0…AF-Z)

**Coach AF0-0 GO** (after plan v1.1.1 / Spec v0.2.1 fold): implement **Advanced Fly** on board
`agents/p-options-lab-heatmap/` — **replaces** Symmetric Fly as the member fly surface.
(Renumbered from local draft DL-310: remote already used **DL-310** for lesson-slug uniqueness.)

| Item | Path / value |
|------|----------------|
| Spec | `Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md` (content **v0.2.1**) |
| Spec sha1 | `1975b96ce9cc6a99d801e380207408937de8bf74` |
| Plan | `docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md` (content **v1.1.1**) |
| Plan sha1 | `85cf168bb5ad38dcf82c3cd92d7bfeef5447e1b1` |

**OD-AF1…11 Accept (Spec recommendations):**

| OD | Accept |
|----|--------|
| OD-AF1 | Keep registry id `sym-fly`; label **Advanced flies** |
| OD-AF2 | History depth **32** |
| OD-AF3 | Velocity min Δt **0.5 s** |
| OD-AF4 | Raw second derivatives (no EWMA) |
| OD-AF5 | \(D_c - D_p\) |
| OD-AF6 | Wave‑2 \(D/w\) (deferred) |
| OD-AF7 | SRS **descope** |
| OD-AF8 | Signed color sticky **25%** |
| OD-AF9 | Label **Advanced flies** |
| OD-AF10 | Tick max gap **15 s** |
| OD-AF11 | \(\lvert D_{t-1}\rvert\) floor **0.05** (or quote tick when known) |

**Already frozen (not OD):** Credit \(C=-D\) mag+CR display · slope FD descending \(K\) · curvature uniform triple · AF17 time honesty · edge never zero.

**As-built (Wave‑1):**

- `web/lib/options-lab/templates/flySurfaceHistory.ts` — ring buffer · AF17 · tick vs velocity pair helpers  
- `web/lib/options-lab/templates/symFly.ts` — Advanced Fly modes · keep id `sym-fly`  
- `HeatmapChainPanel.tsx` — history push per generation · seam on symbol/exp/wings + Held→Live  
- Tests: `flySurfaceHistory.test.ts` · `advancedFly.structure.test.ts`

**Parent S/V redirect:** further Symmetric-only value-mode work on parent heatmap plan is
**closed/redirected** to Advanced Fly (this DL). GEX / ladder / bw-fly unchanged.

**Rationale:** One OPF-held dual-side chain; pure template; research Value modes with honest
history; no second Massive path; no profit theater.

## 2026-08-12 — DL-310 Lesson slugs unique per course (campaign completion bug)

**Bug (member ticket):** the "Completed" toggle on
`/course/campaigns/sigma-drift-5-10-dte/campaign-overview` did nothing — it 422'd and
snapped back. **Root cause:** an architectural inconsistency. The course editor + routing
treat a lesson as `(course, module, lesson)` and `_claim_lesson_slug` enforced slug
uniqueness **per module** — but the **Progress-Tracking Spec v1.0** identifies a lesson by
`(course_slug, lesson_slug)` and keys `GET /api/me/progress` by `lesson_slug`, i.e. it
assumes lesson slugs are unique **per course**. The `campaigns` course had 4 lessons
slugged `campaign-overview` (one per campaign module) + 2 `1-000-run-monte-carlo-report`,
so `POST /api/progress/complete` matched multiple rows → 422 "module_slug required", and
the ✓ ticks would collide too.

**Decision:** resolve toward the Progress-spec invariant (lesson slug unique **per
course**) rather than reworking the platform-wide progress APIs (lower regression risk on
a live product; matches the course's own authoring convention — it already uses
`gamma-door-overview`, `0dte-tactical-overview`). (1) Migration `122` renames the 6
duplicate lessons to unique module-themed slugs (idempotent; `lesson_progress` is keyed by
`lesson_id`, so member completion is preserved). (2) Tighten uniqueness to course-scoped in
**both** creation paths so it can't recur: canonical validator `course_model.py`
(`LESSON_SLUG_DUP` now course-scoped, was per-module) and admin editor
`_claim_lesson_slug` / `_unique_lesson_slug`. Tests: validator rejects a lesson slug reused
across modules. The course page is `force-static`, so a web rebuild after the migration
regenerates its lesson links with the new slugs (lesson pages are `force-dynamic`). Trade-
off accepted: those 6 lesson URLs change (they were broken for completion anyway).

## 2026-08-12 — DL-309 OPF Truth & Elegant Failure doctrine (Options Lab positions)

**Decision:** Adopt **OPF Truth + Elegant Failure** as capital-risk doctrine for Options Lab
**create / edit / position cards / package marks**.

1. **OPF is the only truth** for whether a structure is real: dual-side chain generations the
   OPF holds (listed exp + listed strikes + contract marks). No invented strike book. RTH vs
   closed changes live/held freshness, not the instrument universe.
2. **Representable or not:** every leg must sit on that plane or the structure is not
   priceable as a package.
3. **Elegant failure:** never leave the member believing the app is broken; replace package
   numeric with named states (EXPIRED · NOT TRADED · CHECK LEGS · UPDATING · BUDGET LIMIT ·
   WAITING · HIDDEN) and calm truthful detail.
4. **Atomic resolve:** pointer change settles once (hydrate → bind → quote); no flash loops.
5. **Severity:** inventing non-OPF strikes or silent false debit/credit is **high**.

**Normative Spec:**  
`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md`  
**Agent entry:** `AGENTS.md` · `CLAUDE.md` doctrine bullets.  
**As-built anchors:** `listedStructure.ts` · `optionBind.ts` · `cardDisplayState.ts` ·
`usePackageQuotes.ts` (atomic) · `analyzerBook` pointer rebind.

**Rationale:** Analyzer/Builder sit next to capital-adjacent judgment. Instrument honesty and
named failure outrank “always show a number.”

## 2026-08-11 — DL-308 Recoverable import deletes; drop full-wipe button

**Decision (amends DL-307):** (1) Remove the Import Manager's "Delete all transactions"
full-wipe button — that capability is gone from the UI (the `delete-all` endpoint remains
but is no longer reachable from the app). (2) Deleting an import is now **recoverable for
30 days** instead of a hard cascade delete.

**Mechanism — recycle bin, not a `deleted_at` flag on trades:** member trades are read in
~20 places (blotter, reports, journey scores, capital, campaigns, export…); a soft-delete
flag would need a filter in every one and would leak on the one you miss. Instead, deleting
an import **moves its trades+legs into trash tables** (`member_trade_log_{trades,legs}_trash`,
created `LIKE` the live tables so the move is `INSERT … SELECT *` with ids preserved for
lossless restore) and stamps `member_trade_log_imports.deleted_at`. The rows leave the live
tables, so every existing read excludes them for free — correct by construction.
`POST …/imports/{id}/restore` moves them back; `GET …/imports` returns `{imports, deleted,
recoverable_days}` and lazily purges anything past 30 days (the recovery clock is the
import's `deleted_at`). Migration `121_trade_log_import_recycle.sql` (additive: `deleted_at`
+ trash tables; drops the ext-order unique key on trash so a trashed trade and a later
re-import can coexist). Import Manager gains a "Recently deleted · restorable for 30 days"
section (Restore + days-left). Single-trade delete stays hard (unchanged). Tests: soft-delete
→ trades leave blotter → preview from trash → restore → return; restore-404 (10 pass).

## 2026-08-11 — DL-307 Trade Log import batches + Import Manager

**Decision:** Make every import an identifiable, previewable, individually-deletable unit,
so a member can undo *one* import instead of only wiping the whole log. New table
`member_trade_log_imports` (its `id` = the unique import ID; stores date/time, adapter,
account, filename, campaign, counts). `member_trade_log_trades.import_id` FK → imports
`ON DELETE CASCADE` (legs already cascade from trades, 040) — one delete removes exactly a
batch's trades + legs. Commit now opens an import row, stamps each created trade, and drops
the row if the file was all duplicates. Endpoints: `GET /api/me/trade-log/imports`,
`GET …/imports/{id}` (preview), `DELETE …/imports/{id}`; the typed-confirm
`POST …/delete-all` (full start-over) stays. The toolbar red trashcan opens the **Import
Manager** (HIG: design tokens + `Button` + `useConfirm`/`AlertDialog`) — list, preview,
per-import delete, footer full-wipe.

**Backfill (default-ON, in migration 119):** existing import trades were never batched, so
migration reconstructs historical imports by **gap-clustering** their `created_at` within
(identity, account, adapter), GAP=300s — verified against prod (a 444-trade ToS import
straddled a second boundary; exact-second grouping would fragment it, gap-clustering keeps
it whole). So older imports are deletable too, not just new ones. Manual/automated trades
keep `import_id NULL`.

Migration file is `119_trade_log_import_batches.sql` — coexists with origin's
`119_symbol_app_profile.sql` (repo already runs double-numbered migrations; runner keys by
filename). Tests: batch create/list/preview/delete + identity scoping + no-empty-batch on
re-import (9 pass); backfill verified on seeded data + browser-verified end to end. Spec
`FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0`.

## 2026-08-11 — DL-301 Options Lab Analyzer Spec v0.1 filed

**Decision:** File product Spec for Options Lab **Analyzer** surface as **DRAFT**:

`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_1.md`

**Contents:**
- Exhaustive **as-built inventory** (route, chrome, posture, OPF packs, book/cards/lock, package quotes, viewport/resolve, PnLChart, what-if, ToS/Heatmap handoff, **threshold alerts**, Builder shell, module map)
- **TARGET** layout law: position list **under** viewport with divider (not MSC left rail)
- **TARGET** Builder defaults: every template standard geometry from market (Held/Closed → last/close mark); butterfly min width = heatmap/profile minimum; handoff fields win when supplied
- Card = read-only limited Builder view; Edit opens full Builder
- Parents: PB Spec v0.2 · OPF v0.2.1 · Market Bus · Chain Picker · Heatmap Templates
- Gap map + OD-AZ1–4 · ATs AT-AZ-1…12 + residual L1–L6

**v0.1.1 (same DL day):** Coach reminder — **alerts are first-class Analyzer**. Spec folded: mission item 6, cardinal objects, full §1.14 model (create/list/evaluate/draw), AZ-AL-0…11, layout AZ-LAYOUT-5/6, ATs AT-AZ-8b–d.

**v0.1.2 (same DL day):** Coach framing — Analyzer product = six major buckets: **Alerts · Positions · Viewport · Time machine · Models · Controls**. Spec §0.2 architecture + inventory map.

**v0.1.3 (same DL day):** Coach framing — **attached viewports**: **Analyzer** (OPF risk graph) · **Volume Profile** · **GEX**. Spec §0.3 AZ-VP-1…7; as-built: VP suite app, GEX Heatmap template; shared suite symbol; OD-AZ5–7.

**v0.1.4 (same DL day):** Fourth attached viewport — **Probability** (1σ / distribution framing). Spec AZ-VP-8 (no profit theater); partial as-built (`oneSigmaBandWidth` on PnLChart); OD-AZ8 for route vs sub-panel.

**v0.1.5 (same DL day):** **Volume Profile viewport = bins only** — no candlesticks on the VP surface (AZ-VP-9). As-built candle+profile chart is residual drift.

**v0.1.6 (same DL day):** **Surface is an Analyzer viewport mode** (Risk graph 2D | Surface 3D), **not** a suite app. Same Positions, Alerts, Models, Time machine, OPF data plane; 3D presentation only (MSC scene port, no MSC theo SoR). Laws AZ-VP-S1…S6.

## 2026-08-11 — DL-302 MSC presentation port boundary (Analyzer B1)

**Decision (Coach-facing / advisor fold):**

- **May port:** MSC **presentation / scene / interaction** code (2D chart UX, 3D scene, gestures) when **re-typed** into Labs domain types under Labs namespaces (`web/components/options-lab/risk-graph/`, `web/lib/risk-graph/`).
- **Must not:** MSC pricing/theo engines, MSC schemas, MSC Redis keys, MSC runtime imports, or dual pricing SoR.
- **Naming:** directory **`risk-graph`** (not `msc-risk/`). Heritage belongs in comments + this DL — not the import path.
- **Pricing SoR** remains OPF (DL-293). AZ-VP-S4 restates the same boundary.

**Does not** authorize wholesale MSC vendoring without re-type.

## 2026-08-11 — DL-303 Analyzer Spec v0.2 — advisor Claude review fold

**Decision:** Fold external advisor review (2026-08-11) into Analyzer Spec content **v0.2** (DRAFT · review-folded).

| Class | Disposition |
|-------|-------------|
| B1 | Accept → DL-302 + `risk-graph/` rename |
| B2 | Accept → posture from market session-status; clock fallback |
| B3 | Accept → PB-VIEW-7 ratified (OD-PB16 Accept) |
| B4 | Accept → override/what-if RECON=`override` |
| B5 | Accept → six-state liveState · package magnitude invariant · status ANALYSIS-only |
| A1–A8 | Adopt as law (A8 intent with OD-AZ8) |
| P1–P2 | Hash recompute + this DL |

## 2026-08-11 — DL-307 Analyzer residual BUILD GO + first residual ship

**Decision:** Coach **W0-0 GO** on Analyzer residual board; residual implementation started and first matrix landed:

| Phase | Ship |
|-------|------|
| L | Layout: top controls · viewport · divider · positions · alerts |
| B | Butterfly ATM + profile min wing |
| T | What-if Enable gates all knobs · override banner |
| A | Alerts 20 of N · multi-symbol badge |
| D | ANALYSIS-only · package magnitude invariant |
| S | Cache stale label · posture fixtures + server open-map tests |
| V | VP bins-only (no candles) |

**Still residual:** U (Surface 3D OPF mesh) · R (Probability suite panel + Spec section) · K full AT pack · Z close.

**Authority:** W0-0 GO · plan v1.0.1 · Specs Analyzer v0_2 / PB v0_3.

## 2026-08-11 — DL-306 Analyzer residual plan advisor fold + path/hash reconcile

**Decision:** Fold external advisor **plan review** (Claude 2026-08-11 · P-B1…P-B4 · P-A1…P-A5) into residual program law and primary Spec paths.

| ID | Disposition |
|----|-------------|
| **P-B1** | Analyzer Spec content v0.2.1 lives at `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`. Path `...Analyzer-Spec-v0_1.md` is **SUPERSEDED** stub only. |
| **P-B2** | Land **PB Spec v0.3** at `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md` carrying PB-VIEW-7 + B5 triple (six-state `liveState` · package magnitude invariant · ANALYSIS-only). PB v0.2 **SUPERSEDED**. D-phase cites v0.3. |
| **P-B3** | U-phase exit: any new OPF surface-sample API requires **OPF Spec delta** + DL; U-G includes load posture (samples/render, requests/mesh, budget). |
| **P-B4** | Posture fixture ATs (holiday · half-day · 16:00–16:15 index window) in S/K — not unevidenced “Landed”. |
| **P-A1** | T depends on **W0 only** (not L). |
| **P-A2** | Probability surface law promoted before R-G; Mike auth in R-G evidence. |
| **P-A3** | Tango T-2 seed; Kilo owns characterization (A-2, S-2). |
| **P-A4** | U hard-depends **S + L**. |
| **P-A5** | W0-1 hash-verifies **Analyzer + PB + OPF** in one pass. |

**Plan revision:** `docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md` → **v1.0.1**.  
**Does not:** authorize residual BUILD — still Coach **W0-0 GO**.

## 2026-08-11 — DL-305 Analyzer residual full-agent bench plan v1.0

**Decision:** File residual implementation program for Analyzer Spec v0.2.1:

- Plan: `docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md`  
- Board: `agents/p-options-lab-analyzer/`  

**Phases:** W0 → L (layout) → B (defaults) → T (what-if) → A (alerts) → D (domain) → S (stream/stale) → V (VP bins) → U (Surface 3D OPF) → R (Probability) → K → Z.

**Authority:** OD-AZ1–8 already Accept (DL-304). Residual **BUILD GO** = Coach W0-0 on this board (not implied by this DL alone).  
**Superseding hygiene:** path/hash + PB v0.3 + plan advisor fold → **DL-306**.

## 2026-08-11 — DL-304 Coach Accept OD-AZ1–8 (Analyzer)

**Coach Accept** of open decisions on Analyzer Spec content v0.2.1:

| OD | Accept (normative) |
|----|---------------------|
| **OD-AZ1** | Top compact control strip · position list **under** viewport · divider |
| **OD-AZ2** | Alerts **under** position list |
| **OD-AZ3** | Empty Builder default template = **butterfly** |
| **OD-AZ4** | Multi-tab book sync **out of v0.2** (sessionStorage only) |
| **OD-AZ5** | Alerts on VP/GEX optional later; **Analyzer Risk graph first** |
| **OD-AZ6** | Volume Profile remains **suite tab** for v0.2 (embed later optional) |
| **OD-AZ7** | GEX remains **Heatmap template**; suite promotion deferred |
| **OD-AZ8** | Probability = **suite-attached panel**; IV/VIX basis with own as_of/session; structure-relative band when card focused |

**Next:** residual implementation plan (layout, bins-only VP, Surface 3D OPF mesh, default geometry matrix, A6 Enable gates all knobs) → explicit **BUILD GO**.

**Does not:** implement residual matrix in this DL alone.

## 2026-08-11 — DL-300 Live underlier mids — site-wide UI standard

**Decision:** Every product surface that shows underlier mid / last / live price for
`market_symbol_universe` symbols **must** use the live underlier pattern:

- `useLiveUnderlierMarks` + `bindUnderlierMark` + `<LiveMid />` / `LiveUnderliersTable`
- HTTP `ensure_fresh` primary; Market Bus WS overlay non-proxy only
- Never cross-fill another product's mid (e.g. SPY → SPX)

**Converted consumers:** Practice Marked underliers · Admin Market universe · Strategy Lab
Symbols table · Curate live marks strip · Curate symbol picker · Symbol detail · Positions
equity Last · Volume Profile live tip.

**Not this path:** options chain (`useOptionChainBus`) · OPF package-quote · one-shot
Admin Massive validate buttons.

**Docs:** Arch **28** §4.4 · `AGENTS.md` market invariant 9 · `CLAUDE.md` · Charlie
charter · Arch **18** companion note.

**Rationale:** Ad-hoc polls (`/curate/live-marks` chips, WS-only mid tables) caused stale
UI, wrong product binding, and proxy-as-native confusion. One pattern.

## 2026-08-11 — DL-299 Position Builder program close (litmus path landed)

**Decision:** Position Builder bench **phases D…Z** landed against Spec v0.2 / plan v1.0.

**Landed:**
- `POST /api/me/pricing/package-quote` (PB17 card SoR)
- Book domain signed D\* · lock/unlock · liveState · §4.4 apply
- `usePackageQuotes` + generation-epoch re-resolve (VIEW-5)
- Card lock UI · stream posture · mode banner · outlook re-anchor
- Builder listed-only back exp (PB22)
- Tests: 22 OPF suite green

**Explicit residual:** full live R1a multi-panel transcript on RTH host is ops smoke (same PackagePricer path proven in unit tests). Replay chrome deferred (OD-PB17).

**Board:** `agents/p-options-lab-position-builder/gate-reports/` K-G · Z-G PASS.

## 2026-08-11 — DL-298 Position Builder W0 GO + OD-PB1–17 Accept

**Coach GO:** Position Builder Spec **v0.2** + bench plan **v1.0** are **BUILD AUTHORITY**.

**Content hash (sha1 body excl. integrity line):** recompute at W0 from Spec file; program locks OD Accept below.

**OD-PB1–17 Accept (Spec recommendations as law):**

| OD | Accept |
|----|--------|
| OD-PB1 | Session book |
| OD-PB2 | Widths 20/50 |
| OD-PB3 | Regenerate clears limit override |
| OD-PB4 | No multi-card aggregate |
| OD-PB5 | Alerts session |
| OD-PB6 | ANALYSIS only |
| OD-PB7 | Diagonal 2 strikes between when ladder |
| OD-PB8 | Paste does not auto-create card |
| OD-PB9 | freeze_iv/marks default false |
| OD-PB10 | mkt when locked, labeled |
| OD-PB11 | No freeze snapshot retain on unlock |
| OD-PB12 | OPF-served PackageQuote for card package |
| OD-PB13 | Generation-driven re-resolve; no poll-as-SoR |
| OD-PB14 | Forward-walk = chain_replay workflow |
| OD-PB15 | Replay card package stays market-plane |
| OD-PB16 | Outlook member re-anchor + epoch stale |
| OD-PB17 | Replay UX deferred |

**Gate:** `agents/p-options-lab-position-builder/gate-reports/W0-0-coach-go.md`  
**Next:** D → P → I → L → S → C → U → M → A → K → Z

## 2026-08-11 — DL-297 Position Builder full-agent bench plan v1.0 (BUILD plan filed)

**Decision:** File full agent bench implementation plan for Position Builder Spec **v0.2** (Coach accepted).

| Artifact | Path |
|----------|------|
| Plan v1.0 | `docs/Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md` |
| Board | `agents/p-options-lab-position-builder/` |
| Law | Spec v0.2 · OPF v0.2.1 |

**DAG:** W0 → D → P → I → L → S → C → U → M → A → K → Z  
**Critical path:** Package SoR (P) → live re-resolve (S) → cards algorithm (C) → litmus **AT-PB-R1a** (K).  
**OD-PB1–17:** locked to Spec recommendations as program Accept at W0 unless Override on DL.  
**Coach W0-0 GO** still required before implementation seeds fire. No OMS / multi-aggregate / full replay UX (NX).

## 2026-08-11 — DL-296 Position Builder Spec v0.2 — advisor + Coach coherence fold

**Decision:** Fold external advisor review (B1–B6, A1–A9) and Coach Addendum 1 (use-case-scoped litmus) into **Position Builder & Book Spec v0.2**.

| Artifact | Path |
|----------|------|
| Spec **v0.3** (current) | `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md` |
| Spec **v0.2** (SUPERSEDED) | `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md` |
| Spec v0.1 | SUPERSEDED historical |

**Blocking folds:** OPF-served card package (OD-PB12) · PB-VIEW-5 live re-resolve · PB18a skew · signed D\* · AT-PB-R1a–d litmus · PB17b interest · Held labels (PB-MODE-3).  
**Coherence matrix:** day_trade live HARD / closed provenance-only / outlook scenario honesty / backtest determinism+gaps.

**Residual fold (same-day hygiene, advisor verify N1–N5):** §4.4 algorithm gains hidden/not-live and locked-mkt-Held branches; **OD-PB16** outlook epoch re-anchor; **OD-PB17** replay UX deferral; content hash recomputed. Process gate unchanged: **OD-PB1–17 Accept/Override → implementation plan → code**. **No BUILD GO** from fold alone.

## 2026-08-11 — DL-295 Position Builder & Book Spec v0.1 (review baseline)

**Decision:** File product Spec for Options Lab **Position Builder + Position list/cards + lock/unlock + card↔viewport law** as **DRAFT review baseline** — review before implementation plan.

- Path: `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_1.md`
- **Card = definition**; **viewport = OPF visualization**; **chain = live market**
- Lock/unlock maps OPF §5.7; §11 gap map admits as-built incompleteness (DL-294 partial land)
- Process: Accept/Override OD-PB1–10 → implementation plan → code/ATs — **not** silent code-first

## 2026-08-11 — DL-294 Analyzer Position Builder + cards + threshold alerts

**Decision:** Options Lab Analyzer gains MSC-style **Position Builder** (live dual-side mids for accurate debit/credit), **position cards** (list after Analyze), and **threshold alert cards** (price above/below/touch from PnLChart context menu). All pricing remains **OPF**; builder only hydrates leg mids/IV from chain generations.

| Piece | Path |
|-------|------|
| Builder | `PositionBuilder.tsx` + `useBuilderChain` |
| Book | `analyzerBook.ts` session store |
| Cards | `AnalyzerPositionsList.tsx` |
| Alerts | `AnalyzerAlertsSection.tsx` + chart `onOpenAlertDialog` |

Focused visible card drives OPF resolve; paste/Heatmap still works when no focus.

## 2026-08-11 — DL-293 Analyzer is OPF-only (MSC pricing substituted out)

**Decision:** Options Lab **Analyzer** exists to **fully exercise OPF** — dual-side chain generations as data plane, L4 `resolve` + model packs as the **only** pricing path. MSC regimes / Heston / Monte Carlo / client `riskGraphEngine` are **not** Analyzer pricing models.

| Layer | Law |
|-------|-----|
| Data | Market Bus dual ladder → OPF generations (no private Massive) |
| Pricing | OPF packs: day_trade mark_hybrid/surface · outlook scenario/dynamics · backtest replay/reconstruct |
| Render | PnLChart presentation only |
| UI control | `OPF model pack` select (`opfModels.ts`) — not MSC model dropdown |

**Artifacts:** `OpfRiskAnalyzer.tsx` · `MscRiskAnalyzer` / `RiskAnalyzerPanel` re-export OPF · dense dual curves on surface + outlook packs.

## 2026-08-11 — DL-292 Options Lab Analyzer L5 wires OPF dual-curve risk graph

**Decision:** Options Lab **Analyzer** consumes OPF L4 `day_trade` resolve for real-time dual curves (expiration + model_t0), ToS-comparable presentation on PnLChart. Not MSC authority.

**Client:** `useOpfRiskGraph` hydrates dual-side chain-ladder generations per leg expiration → `POST /api/me/pricing/resolve`. Limit price (when present) becomes cost basis shift for ToS-like P&L. Poll ~2.5s.

**Server:** Dense curves via `what_if.curve_steps` / `curve_range_pct` on `day_trade.mark_hybrid` (161 pts default).

**Compare workflow:** Load same ToS line in Labs Analyzer and thinkorswim Analyze → Risk Profile; overlay shape / breakevens / T+0 vs expiration.

## 2026-08-11 — DL-291 OPF foundation L0–L4 AS-BUILT (program close)

**Decision:** Options Pricing Foundation **foundation exit** — L0–L4 landed; **no L5 app wiring**.

**Evidence:** `pytest tests/test_opf_foundation.py` → **19 passed**. Gates T…Z PASS under `agents/p-options-pricing-foundation/gate-reports/`. Arch 30 status → **AS-BUILT (foundation)**.

**Ship surface:** `server/opf/*` + `routes/pricing.py` (resolve / interest / lock / packs). Dual-key `chain_feed` parse via `opf.keys`. Cold archive under `LABS_OPF_ARCHIVE_ROOT` (default `server/data/opf_archive`).

**Explicit non-claim:** Heatmap, Analyzer, GEX, and bots still use pre-OPF paths until a separate L5 program. MSC remains non-authority.

## 2026-08-11 — DL-290 OPF Coach W0-0 GO + OD-PF1–11 Accept

**Decision:** Options Pricing Foundation Spec **v0.2.1** is **BUILD AUTHORITY**. Execute full agent bench plan v1.0: L0–L4 foundation only (no L5 app wiring).

**Content hash (sha1 body excl. integrity line):** `cb5f3cc201d1c4fb257a37dd67ade35fecaa108d`

**OD-PF Accept (Coach — plan recommendations as law):**

| OD | Accept |
|----|--------|
| OD-PF1 Primary exp | Earliest leg expiration |
| OD-PF2 Default expiration curve | Front-exp residual |
| OD-PF3 Sticky day-trade | Sticky delta index 0–2 DTE |
| OD-PF4 Package bid/ask | After mid natural (v1 mid-only marks) |
| OD-PF5 Archive retention + max-stale | Config days; default max-stale **15 min** intraday (`LABS_OPF_ARCHIVE_MAX_STALE_MS=900000`) |
| OD-PF6 Client engine mirror | **Server-only v1** (no dual-language engines) |
| OD-PF7 American engine | **CRR** |
| OD-PF8 Day-trade on skew | **Fail loud** @ `LABS_OPF_MAX_SKEW_MS=3000` |
| OD-PF9 Rates bootstrap | Config SOFR continuous (`LABS_OPF_RISK_FREE_RATE`) |
| OD-PF10 Interest cap | **32** concurrent (`LABS_OPF_MAX_GENERATION_INTERESTS`) |
| OD-PF11 RECON tol | **$1** abs or **1%** \|mark\| |

**Scope:** Phases W0→T→G→R→P→D→O→B→A→K→Z. NX1–5 (Heatmap/Analyzer/GEX/bots UI, full OPRA ticks, 3D risk) **out**.

**Board:** `agents/p-options-pricing-foundation/`  
**Gate:** `agents/p-options-pricing-foundation/gate-reports/W0-0-coach-go.md`

## 2026-08-11 — DL-289 Options Pricing Foundation Spec v0.2.1 (ratification-ready DRAFT)

**Decision:** File and fold **Options Pricing Foundation (OPF)** as Labs pricing north star — foundation **before** app wiring.

| Artifact | Path |
|----------|------|
| Architecture | `Architecture/30-options-pricing-foundation.md` |
| Spec **v0.2.1** | `Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` |
| Superseded | `…-Spec-v0_1.md` (historical only) |

**Law summary:** L0–L4 data plane + model packs; use cases `day_trade` / `outlook` / `backtest` each with default + alternate pack; dual-side multi-exp generations on Market Bus; package natural + lock; continuous \(r\); τ law (Actual/365.25, 0DTE intraday, **AM/PM settlement**, **1-minute τ floor**); surface total-variance geometry + butterfly/calendar arb; cold day-shard archive; OC5a on VIX tier; interest budget; AT-L3-RECON.

**MSC is not the standard.** Parent citations: Market Bus Spec (content v1.0.1), Chain Picker Spec v1.0.2 (**OC6a verified**), Heatmap Spec v0_2 (**HM18/HM19 verified**).

**Coach GO:** issued **DL-290**. Foundation as-built: **DL-291**. App wiring (Heatmap/Analyzer/GEX) remains a **separate** L5 program.

## 2026-08-10 — DL-288 Admin help thread — sender is visually unambiguous

**Decision:** In the admin help ticket view, messages were only split into "admin →
Team" vs everything-else → "Member", so the **AI concierge's `assistant` messages were
mislabeled "Member"** and styled identically to the real member — an operator couldn't
tell who said what. Fixed `web/app/admin/help/page.tsx`: a `roleStyle()` helper gives each
sender a distinct labelled badge + coloured left border — **Member** (blue, incl. the
original question), **AI assistant** (violet), **Team** (green), **Team · internal note**
(amber). Frontend-only, no migration. Verified in-browser on real threads (member question
vs bot reply now clearly separated). Deployed LIVE to MiniTwo.

## 2026-08-10 — DL-287 Market Bus architecture map for agents (Arch 28)

**Decision:** Agents navigate market data via as-built **Architecture/28-massive-market-bus.md**
plus AGENTS.md / Claude.md / agents/README pointers. Arch/18 remains MySQL marks (Curate);
Arch/28 is Redis bus + WS + Options Lab. Spec + bench + board already law; this is
documentation parity so future agents do not invent parallel Massive clients or sockets.

## 2026-08-10 — DL-286 Market Bus W0 GO + MB-P1…P5 land (Redis posture)

**Coach GO (program execution):** Market Bus Spec v1.0.1 + bench plan v1.0.1 **BUILD**.

**Posture reversal (named):** Live multi-worker market data uses **Redis** (`mb:*` keys + pub/sub) as shared generation store — reversing the Chain Picker mission line against an always-on multi-worker Redis pipeline and Arch/18 MySQL-only live marks shape for *this* plane. Reasoning: concurrent chain readers must not multiply Massive. Arch/18 `live_stream` → MySQL marks remains lawful for Curate until O2 exit. MB11: no MSC Redis schemas. Foxtrot: Redis localhost; `LABS_MARKET_BUS=1` + `REDIS_URL`.

**Landed:**
- `server/market_data/market_bus/` (store, singleflight, metrics)
- Ladder shared generation via Redis when enabled
- `python -m market_data.chain_feed`
- `WS /api/me/market/stream` + `web/lib/market/*`
- Scale smoke: 10 concurrent fills → 2 Massive calls
- Gate reports W0…Z under `agents/p-market-bus/gate-reports/`


## 2026-08-10 — DL-285 Market Bus bench plan v1.0.1 + Picker Spec v1.0.2 filename

**Decision:** Heal plan governance per architecture review of the bench plan:

1. **Overrule ≠ waive** — removed “Coach-documented waive / Coach-waived” from plan DoD, W0-G, and Spec Coach gate. Delta remains ternary **PASS/FAIL/BLOCKED** never waived. Coach may **overrule a specialist finding** only via **DL entry with reasoning**.
2. **No SKIP verdict** — Phase X optionality is **scope** (descope → gate never convenes); if X runs, ternary only.
3. **Picker Spec v1.0.2** canonical file: `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` (OC6a, routes `/app/options-lab` + legacy redirect, Market Bus parent). Stub at old `…-v1.0.md` path. Seed **W0-12** owns link sweep completion.
4. Bench plan revision **v1.0.1**; ready to run W0 after this fold.

## 2026-08-10 — DL-284 Market Bus Full Agent Bench Plan v1.0 filed

**Decision:** Implementation program for Market Bus Spec v1.0.1:

- Plan: `docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`
- Board: `agents/p-market-bus/` (CHARTER · ORCHESTRATOR · seeds · gate-reports)
- Phases: **W0** (Spec §18 gates + Coach GO) → **R** Redis/MB-P1 → **F** chain feed → **S** sym/session → **T** WS+client → **C** ladder consumer + **1→N smoke** → **K** AT pack → **X** optional → **Z** deploy
- Seating: Coach · Juliet · India · Mike · Foxtrot · Alpha · Echo · Tango · Hotel · Delta · Lima · Charlie · Kilo
- H1-2 / MB-P1 single OC15 evidence trail locked in plan + W0-9 seed
- First smoke after build: single client chain, then N clients same topic (Massive O(gen) not O(N))
- Coach GO still blocked on Spec §18 specialist PASS (plan W0)

## 2026-08-10 — DL-283 Market Bus Spec v1.0.1 — architecture review fold (pre-GO)

**Decision:** Fold peer architecture review into Market Bus Spec **v1.0.1** and companions. **Coach GO remains blocked** until §18 specialist gates PASS and O1–O6 are explicitly accepted/overridden (no silent defaults).

| Finding | Spec response |
|---------|----------------|
| No bench gates | §18 gate table: India · Mike · Foxtrot · Alpha · Echo · Tango · Hotel · Delta · Juliet · Lima · Coach |
| Header as side-door product | §0.1 — header is **possible consumer only**; live header needs its own surface Spec (Tango/Echo) |
| “Options Lab” naming drift | §0.2 — chain ladder surface; OD-nav unsettled; as-built route string only |
| H1-2 vs MB-P1 double OC15 | §1.2 — H1-2 = in-process **minimal**; MB-P1 = Redis **successor**; one evidence trail |
| Redis posture | §1.1 — named **reversal** of Picker “no Redis pipeline” + Arch/18 MySQL-only live path; full DL text at **GO** |
| O2 dual-write | Named **exit**: N=20 green sessions or 14d + dedicated DL to remove dual-write |
| Missing ATs | AT-MB8 MB7 reconnect snapshot; AT-MB9 MB8 proxy e2e; AT-MB10 MB6 universe reject |
| OC6a strikes | Law mirrored on Picker Spec **v1.0.2** OC6a; bus keeps AT-MB5 only |
| Silent GO defaults | §15 — Accept/Override per row required |
| Massive WS assumption | MB-P3 requires entitlement probe transcript |
| Version / hash | Spec scheme **v1.0.1**; sha1 at landing commit |

Companions: Picker Spec **v1.0.2** (OC6a, OC15 stages, Market Bus parent); bench plan H1-2 text.

## 2026-08-10 — DL-282 Massive Market Bus & Shared Client Spec v1.0 DRAFT filed

**Decision:** File architecture Spec for the shared market data plane:

- Path: `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` (**DRAFT** → revised **v1.0.1** in DL-283)
- Stack law: **Massive → feed process(es) → Redis (store + pub/sub) → labs-api → one WebSocket per tab → shared web MarketClient → Labs apps**
- Chain ladder surface is a **consumer**, not transport owner; OC15 generalized beyond ladder-only
- Browsers never talk to Redis or Massive; multi-worker requires Redis (not process-local-only cache)
- **Coach GO blocked** on specialist gates (DL-283) before MB-P1+ build authority

Rationale: scale chain ladder and multi-chart boards to many concurrent members without N× Massive; one WS for aged-browser socket limits; independent app pages add/remove interest on the shared client.

**Note (posture):** Introducing Redis for live multi-worker market data is a **deliberate reversal** of the Chain Picker mission line against an “always-on multi-worker Redis pipeline” and of Arch/18’s MySQL+poller-only shape — full named reversal text at Coach GO (Spec §1.1).

## 2026-08-10 — DL-281 Admin Flow readability — hover-trace, dwell time, summary, click-to-lock

**Decision:** Make the DL-272 Flow Sankey actually legible (Coach feedback: "cool but
hard to see the journey; and it can't tell dwell from drop-off"). Four additions, all on
the existing `page_views` data — **no migration**. (1) **Hover-to-trace** — replace the
native SVG `<title>` tooltips with a custom popup; hovering a box/ribbon dims everything
else and shows a clean summary. (2) **Click-to-lock** — clicking a box freezes the
selection and lights the **full downstream path** (forward reachability, several steps
deep), with a pinned popup + "Clear lock" affordance; click empty space to clear. (3)
**Average time per area** — `flow.py` sums the gap from each page view to the next within a
session (terminal views are unknowable → `avg_seconds=null`, shown as "—", never a fake 0);
surfaced in the box popup, a new drop-off "Avg time" column, and the summary. This
disambiguates a high exit as an *engaged exit* vs a *quick bounce*. (4) **Plain-English
summary line** — most-common path · where members spend the most time · biggest exit point
(with dwell). Frontend `web/app/admin/flow/page.tsx` (needs web build); backend adds dwell
to `flow.py` + `test_flow.py` (21 flow/help tests pass). **Verified on real prod data**
(522 sessions/72 members): e.g. Courses reached by 421 but 82% exit at avg ~1m29s (a real
drop-off), vs Trade Log 26% exit at avg ~2m51s (engaged). Deployed LIVE (origin `a3ccd44`).

## 2026-08-10 — DL-280 Options Chain Picker locks — OC2/OC5a/OC15 · HIG · Market parent · OC11

**Coach (W0):**

| Lock | Law |
|------|-----|
| **OC2** | Spot for strike math: chain `underlying_asset.value` first; non-proxy marks only; never SPY proxy scale; 503 if unusable |
| **OC5a** | Proxy vol never σ input; VIX1D for 0–1 DTE when native; √T uses max(1,dte) |
| **OC15** | Shared Massive generation per (feed_symbol, expiration) per TTL — not per-member upstream |
| **HIG** | Human Interface Spec v1.0 binds prelim design and production UI |
| **Nav** | Parent area **Market** `/app/market/*` — not Practice suite pill (DL-232 lesson) |
| **OC11** | Preformed expiry calendar **required** for v1.1 acceptance — Delta must not hedge |

Residual ODs: OD-nav Market · OD-poll 2s · OD-ttl 1.5–2s · OD-preform-ttl 1 session day · OD-strike-step by kind.

## 2026-08-10 — DL-279 Options Chain Picker Spec v1.0.1 BUILD AUTHORITY

**Coach:** Spec `FatTail-Labs-Options-Chain-Picker-Spec-v1.0.md` **v1.0.1** is product law. Execution: `docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-chain-picker/`. Critical path W0→H→E→U→K→P→Z. Companion: Human Interface Spec v1.0 (Apple HIG for Labs web). Gate: `agents/p-options-chain-picker/gate-reports/W0-0-coach-go.md`.

## 2026-08-09 — DL-278 Campaign phase reports — free cash, structure_risk_open, P13

**Hotel / Coach (W0-1):** Phase report strip is **read-time only** (no second equity store).

| Metric | Law |
|--------|-----|
| **Free cash** | Balance − open cost basis; negative lawful; account-free campaign → identity total free cash (OD-free-cash-scope) |
| **Free margin** | `declared_buying_power − structure_risk_open` when BP set; else null. `structure_risk_open` = sum defined max loss of open structures — **not** broker MM. Public API **forbids** field name `margin_at_risk`. |
| **Realized DD% (campaign strip)** | Peak-to-trough of campaign trading curve as **% of campaign allocation** (P13) — same denominator as declared max DD%. Master campaign-blind DD stays on Accounts & Capital. |
| **Strategy mix** | Informational counts — not prune rank |
| **Prune** | Lifecycle + judgment only; **no** P&L-ranked prune candidates (P10) |

Board: `agents/p-campaign-phase/` · Spec §6 · plan R*.

## 2026-08-09 — DL-277 Campaign charter locks — L-End, L-T2, L-DD, L-Adopt + Finding five

**Coach (W0-0):**

| Lock | Law |
|------|-----|
| **L-End** | End date optional to start; **required** to complete/archive |
| **L-T2** | Same-bet Tier 2 visible/skippable; actionable when adopted |
| **L-DD** | Max DD always **percent of this campaign’s allocation** |
| **L-Adopt** | Optional attributes dormant until adopted; **post-sign** adopt and un-adopt are amendments + `charter_version` bump |
| **P9** | No per-campaign correlation strip on phase report (Finding five blessed) |
| **P10** | No P&L prune-candidate ranking in v1 (Finding five blessed) |
| **CR-12** | Once at campaign create / pre-sign only — never Trade Log / trade create; ban product copy “at stamp” for this prompt |

Residual ODs for ship (defaults): OD-SB indicative Same-bet copy · OD-alloc-modes fixed+dynamic note UI · OD-free-cash-scope identity total · OD-CR12-copy inline quiet banner · OD-title “Campaign”+date.

## 2026-08-09 — DL-276 Campaign Phase & Charter Tiering Spec v1.0.1 RATIFIED + BUILD AUTHORITY

**Coach:** Spec `FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md` **v1.0.1** is **product law**. Execution: `docs/Campaign-Phase-Charter-Tiering-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-campaign-phase/`. **BUILD AUTHORITY** after W0-G for S→G→U∥R→C→L→Z. Critical path: `W0-G → S1-G → G1-G → U1-G ∥ R1-G → C1-G → L1-G → Z-G`. Umpire (P3) and P13/`structure_risk_open` gates never waived. Queued out: Lab Pearson CR-4, per-campaign correlation strip, P&L prune rank, Lab curation handoff list, live broker margin engine. Companion consume: Capital v0.3 · Funding v0.2 · Campaign v1.3 · Positions · Trade Log · Top-Level Account Amendment. Gate: `agents/p-campaign-phase/gate-reports/W0-0-coach-go.md` · W0-G.

## 2026-08-09 — DL-273 Help concierge v1.2 — lean prompt + searchable reference library

**Decision:** Change how the concierge gets its knowledge. Was: one static
`help_concierge_kb.md` embedded whole in every Grok call (general-only → detailed course /
area questions escalated, e.g. a real member asking "where are resources / what do I learn
from each course / what do you recommend"). Now: a **lean system prompt** (identity + HARD
guardrails + a compact `doc: section` **index**) plus a **reference library** the model
searches on demand. Library = `server/help_reference/*.md` (`overview.md`; `app-areas.md` —
one section per app area; `courses.md` — the 5 published courses distilled from their real
descriptions + a recommended order), split on `## ` headings. Flow (`server/help_ai.py`):
round 1 the model returns `{"action":"search","queries":[…]}` or `{"action":"answer",…}`; a
search runs `_search()` (keyword scoring over the reference sections, heading-weighted,
capped) and round 2 answers from the returned sections. **Max one search round** (cost).

**Why it's still safe:** `_search` is **code-scoped to the reference folder** — the model
can only ever read whitelisted member-facing content, never repo/db/infra/secrets, so the
v1.0 whitelist invariant holds by construction ("search the database" can only hit the
docs). Read-only + fail-open unchanged; **non-JSON model output now escalates** instead of
being shown raw (safer). Answer contract `{reply,resolved,topic}` unchanged. May recommend a
learning path; never personalised financial advice.

**Verified:** `test_help_ai.py` rewritten (reference loads + searchable, index, guardrails,
the search→answer loop, all failure paths escalate); 17/17 help tests pass. Live against
Grok: the exact member question that escalated before now answers well (Resources location +
course pointers + recommended order); course-detail, infra-probe, and prompt-injection cases
all correct. **Server-only deploy: no migration, no web build** (ships `help_ai.py` +
`help_reference/`, removes `help_concierge_kb.md`). Spec v1.2.

## 2026-08-09 — DL-272 Admin "Flow" — aggregate member journey (Sankey + drop-off)

**Decision:** New admin view (`/admin/flow`, nav after Users) answering "where do
members naturally flow, and where do they drop off." Read-only, admin-only. Data =
existing `page_views` (no migration): sessionised per member on the same 30-min gap as
the Users view (`activity.SESSION_GAP_SECONDS`), granular paths mapped to ~15 readable
**areas** (`flow.area_for`, longest-prefix; unknown paths fall back to a titleised
segment so new routes surface instead of being dropped). All aggregation is pure in
`server/flow.py`; `routes/flow_admin.py` only fetches rows + applies the date-window
(7/30/90/all) and tier (all/paid/free, paid via the same active-membership rule as the
billing view) filters. Endpoint: `GET /api/admin/flow`.

**The visual (hero = Sankey):** a **step-based** behavior-flow — column N = the Nth page
of a session. Sessions that end are carried into a growing grey **"Left"** lane along the
bottom, so every column is the same height (all sessions) and drop-off reads as the
widening grey band. Balance invariant the frontend depends on and a test locks: for every
step with a next column, `node[i][A] == Σ_B link[i][A→B] + exit[i][A]`. Below the Sankey:
a **drop-off table** (per area: reached / left-here / exit-rate, sorted by exits) and the
**top journeys** (ordered area paths). Hand-rolled SVG Sankey — no chart lib.

**Verified locally** on seeded synthetic journeys (7/7 `test_flow.py` incl. the balance
invariant; visual confirmed in-browser — funnel narrows 79→66→41→14→10, grey "Left" lane
grows, panels populate). Meaningful only on **production** traffic; local `page_views` is
otherwise empty. Spec: `FatTail-Labs-User-Flow-Spec-v1.0`. Status: implemented + locally
verified; pending live deploy to MiniTwo.

## 2026-08-09 — DL-271 Help concierge — optional topic (AI auto-classifies)

**Decision:** The help topic dropdown is now **optional**. If a member submits without
picking one, the concierge classifies the message into `bug` | `struggling` | `general`
itself (new `"topic"` field in the JSON answer contract; `help_ai.answer` always returns
it, defaulting to `general`). `routes/help.py` writes the AI's topic back onto the
question row when none was chosen, so admin filtering/counts stay accurate. Removes a
point of friction (members shouldn't have to categorise their own problem) without losing
the categorisation the admin side needs. No migration. Verified locally (submit with no
topic → 200, auto-tagged `bug`; 14/14 help tests pass). Folded into the help concierge
work; pending the same MiniTwo deploy as DL-270.

## 2026-08-09 — DL-270 Help concierge v1.1 — inactivity close, proactive human, feedback

*(Renumbered from DL-254 on rebase — origin concurrently took DL-254 for the Trader
Development program. This is the member help concierge v1.1.)*

**Decision:** Member chat improvements on top of the concierge (DL-253); core
answer/guardrail/escalation unchanged. (1) **Inactivity auto-close** — bot-handled
chats warn at 4 min idle and close at 5 min via `POST /api/help/questions/{id}/close`
(`closed_reason='inactivity'`); **never** closes a thread the team is on (returns
`skipped`). (2) **Proactive human hand-off** — prompt now makes the bot *offer* a human
when it isn't resolving it or the member says it didn't help; accepting escalates
(existing ticket + notify). (3) **Answer feedback** — 👍/👎 per assistant answer via
`POST /api/help/messages/{message_id}/rating` → `help_messages.rating`. Migration `093`
(`093_help_concierge_v2.sql`; coexists with origin's `093_practice_playbook_campaign.sql`)
adds `help_messages.rating` + `help_questions.closed_reason` (additive, no enum change).
Spec: `FatTail-Labs-Help-Concierge-Spec-v1.1`. Tests: `test_help_v2.py`. **14/14 help
tests pass locally.**

**Deferred to v1.2 (next):** self-improving engine (admin Questions dashboard —
most-asked/unanswered/escalation-rate/👎'd — + curated FAQ fed back into the KB, optional
Help-wiki publish), streaming replies, image-aware bug reports. Status: implemented +
locally verified; pending live deploy to MiniTwo.

## 2026-08-09 — DL-269 Accounts & Capital program BUILD AUTHORITY

**Coach:** Full Spec set **APPROVED**. Execution law:
[`docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md`](../docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-accounts-capital/`.

| Spec | Version |
|------|---------|
| Capital & Position Sizing | v0.3 |
| Funding & Defunding | v0.2 |
| Staleness Awareness | v0.1 |
| Campaign Amendment — Top Level Is the Account | v1.0.2 |

Ship ODs (defaults): tolerance **percent**; wrap **snapshot**; keep `starting_balance` separate; free-form latitude v1; live BP sync **out**.

## 2026-08-09 — DL-268 Ledger furniture abolished (supersession)

**Coach / Amendment:** The **account is the top level**. No genesis ledger campaign. Undirected trades (`practice_campaign_id` NULL) are lawful. Memory does not fall back to a furniture object. Registry = deliberate campaigns only.

**Reverses** ledger-as-furniture doctrine from structured-practice L1 genesis (migrations 102–104 ledger portion). Furniture disposition: Option A soft-delete; unstamp clears stamp **and** `stamped_by`. Hard-delete only if zero export refs.

Implements via program phases L\*. Spec: `Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md`.

## 2026-08-09 — DL-267 Campaign Journey radar present-only; scrub cut

**Coach:** Radar ships **present-state only** on deliberate charters. Lifetime time slider and as-of-T historical rendering are **cut (not deferred)**. Band-alignment and n-floor unchanged. Supersedes interim full-deferral posture. Resolves Advisor A-1.

Spec: Campaign Spec v1.3 §6 · Amendment §2.1.

## 2026-08-09 — DL-266 Funding curves + master drawdown dollars

**Coach / Hotel (W0-1):** Balance curve = start + fills + cash movements. Trading curve = **Σ fill P&L only** (starts at 0). Master DD witness compares **realized drawdown dollars** (trading) vs **tolerance budget dollars** (from total net capital / form). Withdrawal ≠ drawdown; deposit ≠ recovery; new-account start ≠ recovery.

Spec: Funding v0.2 §3 · Capital v0.3 §4.1.

## 2026-08-09 — DL-265 Accounts & Capital surface (identity)

**Coach:** Single identity-level **Accounts & Capital** under users menu. Sole account write path. Practice and Strategy Lab **consume** only. Product independence (DL-248–250). Parallel Practice “add account” after land is a **blocking** defect.

Spec: Capital v0.3 §6.

## 2026-08-08 — DL-264 Campaign upgrade must not break existing books

**Coach:** Enacting campaign structure (096/097, pack 1.1, multi-active) is **additive**.

- Do not auto-create campaigns or rewrite trades/accounts.  
- New columns nullable; existing stamps and unstamped trades remain valid.  
- Import accepts model 1.0; export 1.1 is backward-compatible for readers that ignore unknown fields.  
- Migrate before deploy on each host. Spec: Member Campaign Concept §8a · Export Spec v1.4 §4.

## 2026-08-08 — DL-263 Campaign permanence + active prefill (Spec B1/B2)

**Permanence (OD-PB-7 platform-wide):** Practice campaign hard-delete only when
zero stamps (no trade / journal `practice_campaign_id`, no playbook M2M). Else
only `completed` / `abandoned`. Same doctrine as Playbook scrapbook permanence.

**Prefill:** `GET …/campaigns/active` and stamp default = most recently
**activated** (`activated_at`), prefer account-bound over unbound when
`account_id` filter set. Migration **097**. Spec: Member Campaign Concept v1.0 §4.5–4.7.

## 2026-08-08 — DL-262 Campaign: professional concept, retail-simple surface

**Coach positioning:** Campaign is how **professionals** structure live work
(capital context, goals, group of strategies or fills, start/end, log, prune,
retro — LifeCycle Campaign Phase). FatTail brings that idea to **retail** without
the institutional ceremony.

| Professional core (kept) | Retail simple (how we ship) |
|--------------------------|-----------------------------|
| Work happens *in a campaign* | One default-style campaign if they want — or none |
| Capital / goals / multi-book | Optional fields; hide complexity until used |
| Deploy strategies *into* campaigns (Lab) | Suite step stays **Deploy** (verb); campaigns are the container |
| Multi-campaign per account | Available, not required |
| Import into a campaign | Available when chosen; broker files need no campaign column |

**UX rule:** Never look like a wiki or a prop-firm ops console. Defaults are quiet;
power is there when the member grows into it. Optional structure, not enforcement
(DL-261). Practice and Strategy Lab each own the concept in their mode (DL-258/260).

## 2026-08-08 — DL-261 Campaigns are structural & optional — never enforced

**Coach:** FatTail **offers** campaigns as structure (capital context, multi-campaign
per account, stamp on trades/journal, import *into* a campaign when the member
chooses). We **do not enforce** them.

| Do | Don't |
|----|--------|
| Make campaign create/list/stamp available | Require a campaign to open an account |
| Allow one default-style campaign if the member wants it | Auto-create a campaign on every account |
| Import into a chosen campaign when the UI/API says so | Force every ToS/CSV import onto a campaign |
| Multiple campaigns per account (optional) | Block trading without an active campaign |

Broker exports usually have no campaign notion — FatTail owns the concept, but
**absence of campaign is valid**. Trades with `practice_campaign_id` NULL remain
first-class. Strategy Lab Deploy → campaigns same spirit: available structure,
not a gate.

## 2026-08-08 — DL-260 Strategy Lab: Deploy step vs Campaign container (LifeCycle.pdf)

**Source:** `/Users/ernie/LifeCycle.pdf` — Strategy Life Cycle.

**Big picture:** Development → Curation → **Live Campaign**.

**Campaign Phase** (PDF): strategies · capital allocation · start date · log · prune ·
retrospective · end date. That is the *container* / live context of work.

**Strategy Lab naming:**
| Term | Meaning |
|------|---------|
| **Deploy** (suite process step) | Board phase UI label for the PDF Campaign/live stage — a **verb** most people understand. API key may stay `deployment`. |
| **Campaign** (entity) | Capital context strategies are **deployed into** (one or many campaigns; capital, goals, dates, log, prune, retro). |
| **Deploy to Sim** (Dev) | Inside Development only — not the Live Campaign board. |
| **Deploy** (Curate step 5) | Final review before live — not the same as multi-campaign container mgmt. |

**Rule:** You **deploy into** campaigns. You do not rename the process step to “Campaign”
in the suite nav (that confuses step with container). Practice has the same *concept*
of campaign as work context under `/app/practice/campaign` (human mode).

## 2026-08-08 — DL-259 Practice Campaign = work context (multi per account)

**Coach product model:** When you trade (Practice) or **deploy into a campaign**
(Strategy Lab), work happens **in the context of a campaign** — capital focus, goals,
a group of strategies or fills.

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Campaign path | `/app/practice/campaign` | Campaign entities under Lab (Deploy board deploys *into* them) |
| Mode | Manual fills / process suite | Bots deploy into campaigns |
| Share tables? | **No** | **No** |

**Practice flexibility:**

- One person may run **everything** in a **single** campaign.  
- Another may run **several distinct campaigns on one Trade Log account**.  
- Another may run **different campaigns on different accounts**.  

**As-built:** Multiple `active` campaigns allowed. Optional `account_id`,
`starting_capital`, `goals_md`. Migration `096_practice_campaign_account_scope.sql`.

## 2026-08-08 — DL-258 Practice ≠ Strategy Lab; Campaign at the right level

**Coach correction:** Practice and Strategy Lab are **separate products** (human vs
automated). They share **no** tables or chrome. The **concept of Campaign** exists
in **both** — same idea (capital focus, goals, group of work), different mode.

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Product | Manual Trade Log / process suite | Bots · Design → Curate → **Deploy** (into campaigns) |
| Campaign home | **`/app/practice/campaign`** | Campaign containers + Deploy process step |
| Wrong | `/app/campaigns` (top-level cross-product app) | Suite label “Campaign” for the process step (use **Deploy**) |
| Data | Practice campaign domain only | Lab campaign / deployment domain only |

**Do not** merge them. **Do not** put Campaign at `/app/campaigns`.

## 2026-08-08 — DL-257 Reports = objective trade aggregate only (process off Reports)

**Coach correction:** A **process scorecard** (adherence mix, process/behavior tag
frequency, campaign-season process rates) does **not** belong on **Reports**.

| Surface | Owns |
|---------|------|
| **Reports** (`/app/reports`) | Aggregate of **trades** — objective collected book: equity path, drawdown, strategy/outcome distributions, multi-account totals. Not character/process grading. |
| **Trade Log** | Capture fills + optional process fields on the fill (source of truth for *data*). |
| **Retrospective** | Derived process ceremony over a window (adherence, integrity, habits) — preferred home for adherence mix / process look-back. |
| **Journey** | Optional **aggregate** process pulse for the path (later), not a second Reports. |

**Rationale:** Reports answers “what happened in the book.” Process answers “was I true to the covenant.” Mixing them turns Records into coaching theater and was not an intentional Coach lock.

**Disposition of TD2-7 process pack UI:** removed from `ReportsDashboard`. Domain/API
(`process-pack`, `records/summary` by_adherence, tag usage) may remain as **derivation
backends** for Retro/Journey — not as Reports widgets. Phase 2 Spec §3.4 process pack
placement amended by this DL (Reports no longer the default host).

**Also out of Reports:** Process labels (`ProcessTagUsage`) — same rule as adherence
mix. Components live under `web/components/practice/` (not `reports/`) so they are not
re-mounted on Records by accident. Featured card copy on Reports must not say “process.”

## 2026-08-08 — DL-256 Phase 2 charts track (Match Hygiene) — Massive underlier review

**Decision:** Start TD2 **charts** workstream without waiting on TD2-0 broker vendor.
Sync remains blocked on Coach vendor GO. Process reports may follow in parallel.

**Contract:**

| Surface | Detail |
|---------|--------|
| API | `GET /api/me/trade-log/trades/{id}/chart?tf=5m\|15m\|1d` |
| Data | Massive stock/index aggs via existing `MassiveClient` (`fetch_aggs`); short-TTL in-process cache |
| Proxy | SPX/XSP/VIX → labeled proxy (universe `proxy_symbol` or default SPY/VIXY); never silent |
| Fail loud | Missing/stale/incomplete bars → `ok: false`, **empty bars** — never a partial path as complete |
| UI | Trade sheet Chart section; entry/exit markers from fill `exec_at`; structure band when axis matches |
| Out of scope | Tick replay, L2, broker sync, `entry_source=sync`, Journal day embed (OD-2.3 defer) |

**Config:** `MASSIVE_API_KEY` (existing); optional `LABS_TRADE_CHART_CACHE_TTL_S` (default 120).

**Spec:** Phase 2 Match Hygiene v1.1 · gate `TD2-PROGRESS.md`.

## 2026-08-07 — DL-255 Playbook Scrapbook Presentation (v1.1a) BUILD AUTHORITY

**Coach GO:** implement Spec
`Specs/FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md`.

**Locks:**

| ID | Decision |
|----|----------|
| OD-PB-1 | One book per strategy; chapters/pages |
| OD-PB-2 | Export-only share v1 (no public URL) |
| OD-PB-3 | Explicit journal evidence + optional tags (tags alone ≠ evidence) |
| OD-PB-4 | Scrapbook metaphor × 16:9 present |
| OD-PB-5 | Family B on book/pages/archive/evidence/versions |
| OD-PB-6 | Character under risk — no P&L theater |
| OD-PB-7 | Permanence: draft discardable until first version; then archive-only. Book-level snapshots on explicit Save; autosave = working copy. **Migration seeds version 1** for contentful books. Retention purge may drop oldest history only with **≥1 version floor** (never latest alone). |
| OD-PB-8 | Playbook pack 2.0 is PB3; does not silently move OD-1.5 TD2 gate |

**Schema:** evolve `member_playbook_entries` as Book root; chapters/pages/stickies/attachments/evidence/versions. Cover = book-level properties. `status` sole archived-ness. `body_md` derived snippet only after pages land.

**Phasing:** PB1 canvas+versions → PB2 archive+evidence → PB3 export 2.0.

## 2026-08-07 — DL-253 AI help concierge (Phase 1)

*(Numbered DL-253 to avoid collision — DL-213 was concurrently taken by the Strategy
Lab Process Runtime work. This is the member help concierge.)*

**Decision:** The member help desk becomes AI-first. A member picks a topic
(bug | struggling | general) and writes one message; the **concierge** (`server/help_ai.py`)
answers instantly via a cheap Grok model, from a whitelisted member-facing
knowledge base (`server/help_concierge_kb.md`). If it can't answer — or the member
asks — the thread **escalates to the existing human help desk** (admins notified).
Bot-resolved threads do NOT notify admins, so the human queue holds only what the
bot couldn't handle. UI (`web/components/HelpLauncher.tsx`) is now a topic picker +
single box that grows into a chat view. Routes extended in `server/routes/help.py`
(AI answer on create + follow-up, new `POST …/{id}/escalate`). **No migration** —
`status`/`author_role` are VARCHAR, so new values `assistant` / `ai_pending` /
`ai_resolved` need no schema change.

**Security (guardrails are architectural, not just prompt):** the model is fed
ONLY the member-facing KB — never `server/`, `Architecture/`, `Specs/`, `infra/`,
`.env`, IPs, or secrets — so it cannot leak what it was never given. On top: a hard
system prompt (never discuss backend/hosting/infra/keys/security; read-only, no
account actions; no financial/profit advice; ignore prompt-injection). **Fail-open
to humans:** if Grok is unconfigured, errors, or returns unparseable output, the
question escalates — a broken AI never blocks a member from help.

**Model:** `LABS_HELP_AI_MODEL` (default `grok-4-fast`) called via the xAI provider
directly (registry whitelists only the configured primary/secondary, so a direct
provider call keeps the P2 studio agents on grok-4.5 untouched). `XAI_API_KEY` added
to the API launchd plist (was absent — AI was unconfigured platform-wide before this).
Gotcha logged: the key must be the full ~84-char `xai-…` value; a truncated 46-char
extraction is silently rejected by xAI as "Incorrect API key".

**Phase 2 (deferred, per Coach):** self-improving FAQ + publishing common answers to
a Wiki Help page. Wiki is an external git repo with no write API + human-gated 5-min
sync, so that's a separate build. Spec: `FatTail-Labs-Help-Concierge-Spec-v1.0`.
Tests: `test_help_ai.py`. Status: implemented + live on MiniTwo (Grok answering verified).

---


## 2026-08-07 — DL-254 Trader Development program BUILD AUTHORITY (OD locks)

**Coach GO** (direction: implement Decision Addendum; stop only for new decisions):

| Artifact | Status |
|----------|--------|
| Roadmap v1.1 + Decision Addendum v1.1 | **BUILD AUTHORITY** for implementation planning + TD0 |
| Phase 0 Foundation Glue v1.1b | **BUILD AUTHORITY** — implement now |
| Phase 1 Own Spine v1.1a | **BUILD AUTHORITY** — after TD0-G |
| Phases 2–3 | **BUILD AUTHORITY for design/seeds**; implement per Agent Bench gates |
| Phase 4 | Trigger-gated catalog only |

**OD locks (Addendum):** Practice owns “Campaign”; single active campaign; `entry_source=sync` (+ Trade Log Spec catalog amend in same body of work as sync migration); progressive story copy; server tag filter; journal campaign stamp in Phase 1; export green before Phase 2 exit; Schwab/ToS-class first venue; error grace ≤7d; cadence retro + campaign context; two process nudges; no co-occurrence v1.

**Board:** `agents/p-trader-development/` · Full plan: `Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`

**Sequencing:** TD0 implement → TD0-G → TD1 → …

## 2026-08-07 — DL-252 Deploy: members get full Deploy UX; gate only real-broker (Tradier) real-money

**Coach refine on DL-251:**
- Members may use **all of Deploy** except **connectivity to real brokers** (**Tradier**).
- The gated piece is what Deploy is **ultimately** for: trading the bot in a **real-money** environment.
- Admin continues to prove Tradier (paper → live); then **provision** real-broker / real-money to designated members.

**Member messaging:** Deploy is available for process/promote/monitor (non–real-money); live Tradier is next when the rail is ready — not “everyone live on capital today.”

**Arch:** `Architecture/26-strategy-lab-member-timeline.md` §4 · Arch 17 · `docs/Strategy-Lab-Member-Timeline.md`

## 2026-08-07 — DL-251 Strategy Lab timeline: Design+Curate for members; Deploy path

**Coach product focus (current system — not dual-host cutover):**

| Track | Scope |
|-------|--------|
| **Member (now)** | Continue **Design + Curate**, **lock** them, give **current membership complete access** |
| **Deploy UX** | Members use Deploy **except real-broker real-money** (see **DL-252**) |
| **Parallel** | Admin develops/proves **Tradier** connectivity |
| **Later** | **Provision real-broker Deploy** for designated members on the same rails |

**Aligns with** Arch 17 (Design+Curate multi-tenant first; real-broker admin validate; then provision).  
**Does not** open multi-member **live Tradier** early.  
**Does not** wait on dual-subdomain split (DL-248–250) to ship Design+Curate.

**Arch:** `Architecture/26-strategy-lab-member-timeline.md` · Arch 17 header reaffirm  
**Docs:** `docs/Strategy-Lab-Member-Timeline.md`

## 2026-08-07 — DL-250 FatTail Labs = separate product membership + Navigator grandfather

**Scope:** **Future product direction** — not a present-day cutover or mandatory near-term
build. Intent is locked so features can be **architected in anticipation**.

**Coach:**
1. **FatTail Labs** becomes a **separate product** with its **own membership type**
   (not an automatic side-effect of Navigator).
2. **Current Navigators** are **grandfathered** into Labs by **granting a new
   membership** (Labs entitlement) — they keep bot/Labs access without a new purchase.
3. **Future Navigators** receive **Practice only** (coaching + trader education suite).
   They get **Labs only if they purchase** the Labs membership.
4. Aligns with dual subdomain (DL-248/249): Practice home for Navigators; Labs product
   at `labs.fattail.ai` for bot build/deploy / marketplace.

**Until Coach opens a cutover program:** production stays single-host unified suite;
Navigators retain as-built access including Strategy Lab.

**Later Spec / ops (when scheduled):**
- New plan key e.g. `labs` / `labs-annual` (Membership Spec amend).
- Grandfather batch: active Navigator as-of cutover → add Labs membership.
- Product entitlement matrix: Practice vs Labs independently combinable.
- WooCommerce Labs SKU; Navigator product no longer implies Labs.

**Open (for that future program):** Activator; Observer + Labs add-on; grandfather
term policy; cutover date/runbook.

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md`

## 2026-08-07 — DL-249 Dual subdomain access: Navigator→Practice, Community segments, Visualize

**Scope:** Future direction (with DL-248/250) — design constraints for later; not present cutover.

**Coach refinements on DL-248:**

1. **Community** — Both Practice and Labs use Community, but with **segmented
   channel access** (`practice` | `labs` | `shared`). Members only see/post
   channels allowed for their product entitlement(s).
2. **Visualize AI** — **Exclusive to `practice.fattail.ai`** (trader structure
   literacy), not the Labs bot product.
3. **Navigators** — Default home is **Practice** (full coaching/education suite).
   Labs access is **not** automatic for future Navigators (see **DL-250**).
4. **Labs** — Separate product for bot build/deploy / FatTail Lab Bots monetization
   (DL-247).

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md` · Community + Visualize how-it-works notes

**Superseded in part by DL-250** on how Navigators obtain Labs (grandfather vs purchase).

## 2026-08-07 — DL-248 Dual subdomain future: practice.fattail.ai vs labs.fattail.ai

**Scope:** **Future direction** for architecture foresight — **not** as-built and
**not** a scheduled split. Current system remains one host until a later program.

**Coach:** Forward-looking product structure. Today is a **single** host
(`labs.fattail.ai`) mixing education/practice and bot automation. The **target**
is a **split into two subdomains**:

| Host | Audience | Job |
|------|----------|-----|
| **`practice.fattail.ai`** | Traders (**Navigators’ home**) | Become **better traders** (practice, courses, process stack) |
| **`labs.fattail.ai`** | Bot builders / operators | **Build and deploy bots** — compete with **Option Alpha–class** products (Arch 16 doctrine: same service type, opposite soul) |

**Implications:**
- Marketplace monetization of FatTail Lab Bots (DL-247) is **Labs-subdomain–primary**.  
- Practice stack / education remain **Practice-subdomain–primary**; Navigators live here (DL-249).  
- Shared: brand ethos, identity/membership commerce (WooCommerce), Community with **segmented channels** (DL-249).  
- **Not as-built** — no DNS/app split yet; ship on current monolith until cutover Spec + Foxtrot edge plan.

**Arch:** `Architecture/25-dual-subdomain-practice-labs.md`  
**Docs:** `docs/Dual-Subdomain-Practice-vs-Labs.md`

## 2026-08-07 — DL-247 Bot Marketplace purpose: monetize FatTail Lab Bots

**Coach:** The purpose of the Marketplace is to **monetize FatTail Lab Bots**.

| Priority | Meaning |
|----------|---------|
| **Primary** | **Admins** offer **FatTail Lab Bots** to customers who **purchase FatTail Labs subscriptions** (WooCommerce sells; Labs entitles + provisions into Strategy Lab Curate). |
| **Secondary** | **Navigator** members may have **limited sharing** with other **Navigators** (peer process packages — not the commercial center). |

**Not primary:** free peer-publish marketplace as the product spine.  
**Not:** in-app payments; P&L leaderboards; one-click live Deploy.

**Spec:** Bot Marketplace Framework **v0.1.2** · Arch 23/24 updated.  
**Builds on:** DL-235 house catalog · DL-243/244 package substrate/trust · DL-128 Observer≡Navigator for who may receive subscription bots.

## 2026-08-07 — DL-246 Visualize AI: vertical layout + Observer access

**Coach:**
1. **Layout** — conversation and chart canvas are **vertical** (stacked), not
   side-by-side as the primary orientation. Default: **canvas above**, conversation
   below (chart is the live preview). Conversation above canvas allowed as alternate.
2. **Access** — Visualize AI is available to **Observer** as a **paid trial** with
   **exactly the same privileges as Navigator**. Sole product difference for Observer:
   **weekly** subscription that **terminates after 6 weeks** (DL-128 / DL-194
   `feature_role`). **There is no free Observer plan.** Free no-plan accounts remain
   denied. Also open to Activator / Navigator / admin via normal entitlement.

**Correction:** Earlier draft language that treated “free Observer” / role=observer
cookie as full access was **wrong** and is superseded here.

**Spec:** R6 (Observer ≡ Navigator parity), R10 (vertical); §3.2 · §10.1 · acceptance #7/#10.  
**Docs:** Spec · Arch 21/22 · `docs/Visualize-AI-How-It-Works.md`

## 2026-08-07 — DL-245 Visualize AI: local Save + Copy chart (v1.0)

**Coach:** Member must be able to (1) **save the chart** to an OS directory of
choice (browser download / save-as PNG) and/or (2) **copy the chart image** to
the system clipboard for paste elsewhere.

**Spec:** Visualize AI Spec v0.1 — requirements **R8/R9**, canvas actions, acceptance
#8–9; client-side only (no server round-trip). Server chart **library** remains v1.1.

**Docs:** Spec · Arch 22 · `docs/Visualize-AI-How-It-Works.md`

## 2026-08-06 — DL-244 Bot Marketplace gate close (B1–B2, R1–R4)

**Source:** Architecture evaluation of Spec v0.1 (CONDITIONAL GO).  
**Spec:** v0.1.1 folds findings.

| ID | Binding decision |
|----|------------------|
| **B1** | **`fattail.bot_package` is the sole portable substrate** for member→member bot transfer. Single-bot share = `bot_count=1`. One verb: **Import**. `community_bot_shares` may only thin-index packages (`bot_package_id`); no parallel snapshot payload. House shelf stays code-catalog Apply/Copy. |
| **B2** | House-derived redistribution **allowed** with **mandatory provenance** on card/manifest; import **re-derives/verifies** house binding against house catalog (no free-form self-claim trust). Official house listing remains admin catalog. |
| **R1** | Packages are untrusted: every pack config validated against pack schema/bounds on import; imported bots inherit Curate performance guards. |
| **R2** | All package free-text sanitized/output-encoded on Labs card, import preview, Discord text. |
| **R3** | Discord representation = link-back + Labs import deep-link; **minimum parity ships in F3** with Labs share. |
| **R4** | Downloads only via authenticated endpoint or short-lived signed URL scoped to share; **never** bare public blob URL. |

**Advisory tracked:** A1 Hotel on correlation notes · A2 version informational + re-import notice · A3 adversarial tests T10–T12 · D1 migration number at build.

**Coach residual:** may override M-HOUSE-1 to forbid house redistribute entirely.

## 2026-08-06 — DL-243 Bot Marketplace Framework (package · chat · import)

**Coach outline:** Minimal viable **Bot Marketplace Framework** — not a public
storefront. Strategy Lab users **package** bots (or multi-bot packages), **share**
via **Community chat** attachment, peers **import** into their own **Curate**.

**Locked principles:**
- Stay in Design → Curate → Deploy; import never arms live Deploy  
- No rankings, leaderboards, public scores, or performance theater  
- Reuse Strategy Lab portable export (`fattail.labs.strategy_lab`) inside
  wrapper format `fattail.bot_package`  
- Monetization hooks (`is_premium`, `price_cents`, `license_type`, purchases
  table) **schema only** — unused in MVF  
- Commerce later = WooCommerce only if activated  

**Docs landed (F0, pre-implementation):**
- Spec v0.1 → **v0.1.1** — `Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md`  
- Arch — `Architecture/23-bots-marketplace.md`  
- Design — `Architecture/24-bots-marketplace-design.md`  

**Gate:** DL-244 closes architecture CONDITIONAL GO items.

**Not shipped:** migrations/APIs/UI (F1+ after Coach Spec → **v1.0**).

## 2026-08-07 — DL-242 Community second-window message bridge (C1c path)

**Coach north star:** FatTail members already connected to Discord at enrollment;
Labs Community is an extension of that server; messages sync both ways.

**Shipped path:**
- `community_messages` mirror table · REST backfill on channel open · Labs send via
  bot with honest “Name (via Labs)” attribution.
- Entitled roles (observer/activator/navigator/admin) read/post when channel mapped
  and `LABS_DISCORD_BRIDGE=1` + bot token.
- Identity: Discord name from SSO claims when present (DL-241); else Labs display name.
- Admin map: `/admin/community` (channel snowflakes).

**Not yet:** Gateway long-poll worker (Foxtrot launchd); fotw-sso claim patch on WP
(still required for automatic Discord name); dedicated FatTail AI bot token separate
from 0-DTE (dev may fall back to `LABS_DISCORD_0DTE_BOT_TOKEN`).

**Related:** DL-238–241 · Spec §6.

## 2026-08-06 — DL-241 Discord identity to Labs via SSO claims (not OAuth tokens)

**Coach intent:** Seamless recognition on labs.fattail.ai when the member already
connected Discord on fattail.ai; two-way Community chat.

**Locked design (Mike + plugin inventory):**
1. **Do not** pass Discord OAuth access/refresh tokens to Labs or the browser.  
2. **Do** extend **fotw-sso** JWT with `discord_user_id` + `discord_username` (+ optional
   avatar) from Woo Subscription Discord user meta.  
3. Labs SSO callback upserts `identity_links` provider `discord` +
   `identity_discord_profiles`.  
4. **Two-way chat** remains Labs **bridge bot** + channel map (C1c) — not member
   Discord tokens speaking as the user from Labs.  
5. Primary connect UI stays **fattail.ai** My Account (DL-240).

**Ops:** `docs/ops/WP-Discord-SSO-Claims-for-Labs.md`  
**Related:** DL-238 · DL-239 · DL-240 · Community Spec §8.

## 2026-08-06 — DL-240 Community Discord connect = fattail.ai WP plugin (binding)

**Coach:** The connector to the Discord server is a **WordPress plugin on fattail.ai**.
It connects the member to guild **FatTail AI**. The member’s **Discord name is
maintained on fattail.ai**.

**Locks:**
1. **Primary connect path** = existing WP Discord connector on fattail.ai — **not** a
   Labs-first Discord OAuth product that competes with it.  
2. **Display name in Labs Community** for linked members = Discord name as stored on
   fattail.ai (ingested via SSO claims and/or WP→Labs sync).  
3. Labs still stores Discord snowflake on the identity for post gate + message
   attribution (`identity_links` or equivalent sourced from WP).  
4. Labs **bridge bot** (Message Content Intent, channel webhooks, mirror/send) remains
   Labs-owned for the second window — distinct from member-connect plugin.  
5. **DL-238** date-aware role reconcile remains binding; Mike designs executor so WP
   plugin and Labs bot do not fight (single coherent grant/revoke story).

**Spec:** Community App Spec **v1.0.2** §8.0–8.6.  
**Related:** DL-237 · DL-238 · DL-239 · Identity Access (wordpress:fattail SSO).

## 2026-08-06 — DL-239 Community App Spec v1.0.1 — Coach Phase 5 APPROVED (BUILD AUTHORITY)

**Coach:** Approves Community App Spec **v1.0.1** as **build authority**.

**Locks (from Spec + DL-237/238):**
- Surface: Apps hub card → `/app/community`
- Chat = **Discord second window** (Discord SoR for guild chat; Labs SoR for bots/shares/map)
- Seed channels: General, Practice, Strategy Lab, Toughness; admin may create more; no Journey/Wiki channels
- **Date-aware Discord role reconciliation** mandatory (DL-238) — not webhooks alone
- Message mirror: idempotent upsert + **gap-heal backfill**; event matrix §6.7
- Platform: Message Content Intent + GUILD_MEMBERS; per-channel webhook id+token
- House bots default shared; member publish/apply; hold ≠ Discord delete

**Execution:** `agents/p-community/` (Juliet plan + seeds). India CONDITIONAL GO closed.
Specialist C0 reviews (Tango/Mike/Echo/Foxtrot) before Discord-heavy P1b/c; P1a shell after C0-G.

**Spec:** `Specs/FatTail-Labs-Community-App-Spec-v1.0.md` (v1.0.1 approval; **v1.0.2** adds DL-240 WP connector).  
**Related:** DL-237 · DL-238 · **DL-240** · Membership Tiers Discord annotation

## 2026-08-06 — DL-236 Visualize AI member app (spec + arch + design)

**Coach:** New top-level Apps product **Visualize AI** (`/app/visualize-ai`): text
(voice later) interface with the resident AI to create **custom visualizations**
and **correlations** from **options-related Massive data**.

**Locked product choices (amended DL-245/246):**
- Hub: top-level Apps card (sibling of Strategy Lab, not nested)
- V1: text → structured chart plan → **deterministic tools** → render
- Access: **Observer trial ≡ Navigator features** (6-week paid weekly); free no-plan denied (DL-246 / DL-128)
- Layout: **vertical** canvas + conversation (DL-246); Save/Copy PNG (DL-245)
- Data plane: **options Greeks**, **VIX ~1–30 day** (VIX1D + VIX; VIX9D if entitled),
  **SPX**, and **any entitled Massive** surface via a **closed tool catalog**
  (never raw browser passthrough; never model-invented numbers)

**Docs landed (pre-implementation):**
- Spec **v0.1** — `Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md` (Coach intent;
  India/Echo/Tango/Mike/Hotel → Coach v1.0 before code)
- Arch — `Architecture/21-visualize-ai.md`
- Design — `Architecture/22-visualize-ai-design.md`

**Invariants:** proxy honesty (DL-223/224); correlation/on-demand isolation from
Curate comparison (DL-231); member ethos + distress (DL-209–211); ChainStore
prefer for chain/Greeks cost control (DL-186).

**Not shipped:** routes, migration, UI — Spec review gates first.

## 2026-08-06 — DL-238 Discord role sync: date-aware reconciliation (binding)

**Coach / India gate (Community Spec review):** Discord paid roles must not outlive
Labs entitlement. Webhooks alone miss **date-based** expiry:

- Observer trial term end (`current_period_end`)
- Alumni-year end (`courses-alumni` period end)

**Invariant:** Discord guild roles for Discord-included tiers are derived from the
**same date-aware membership derivation** Labs uses for roles (memberships with
`current_period_end` in the past are not entitled — Identity/Tiers Spec §3).

**Required worker:** scheduled **reconciliation sweep** that:

1. For each Discord-linked Labs identity, compute Labs Discord-entitlement (date-aware).  
2. Diff vs actual guild roles.  
3. Corrective grant/revoke.  
4. **Fail-loud** alert on persistent divergence.

Webhook-driven sync is complementary (faster path), not sufficient alone.

**Spec:** Community App Spec §8.5 · §6.6.  
**Related:** DL-128 Observer = 6-week term · Membership Tiers date-expiry · DL-237.

## 2026-08-06 — DL-237 Community App Spec v1.0 (product intent) — was misnumbered DL-236

**Coach:** New Community app at `/app/community` (Apps hub card). Chat is a
**second window on FatTail Discord** (sync users + messages; Discord display names).
Seed channels: **General**, **Practice**, **Strategy Lab**, **Toughness**. Admin may
create more. Journey/Wiki: no channels. FatTail bots shared by default; member bot
shares opt-in. Labs SoR for bots; Discord SoR for guild chat. Discord-included
subscribers connect Discord identity + roles.

**Spec:** `Specs/FatTail-Labs-Community-App-Spec-v1.0.md`  
**Status:** Superseded for *build* status by **DL-239** (Coach Phase 5 APPROVED / v1.0.1).

**Note:** Earlier log line that reused **DL-236** for Community was a numbering
collision with Visualize AI (DL-236). Community is **DL-237**. India review D2 closed.

**India architecture gate (2026-08-06):** CONDITIONAL GO → B1 closed as DL-238;
R1–R4 folded into Spec v1.0.1.

## 2026-08-06 — DL-235 FatTail house strategies + mint provision

**Coach:** House strategies are FatTail-designed, taught in courses, **versioned**,
and **admin-only** to modify/version. Members apply, configure bots, or
copy-and-rebuild — cannot remove house entries from the managed list.

**Catalog (v1.0.0 each):** 0DTE OTM Classic Butterfly · 1–2 DTE Timewarp Batman ·
1–2 DTE Timewarp Trend Single · 0DTE High Vol Batman · Convex Stack (2–4 DTE) ·
Sigma Drift (5–10 DTE). Each includes **entry + management** process and
**course_refs** to Labs curriculum.

**Mint:** On first identity create (SSO join / register), provision **3 starter
bots** in **Curate** (`monitored`), house-bound, **armed** sim instances ready
to tick and later promote to Deploy:
`0dte_otm_classic_butterfly`, `0dte_high_vol_batman`, `1_2dte_timewarp_batman`.

**Tracking:** `attributes.house_design@1` `{key, version, name, …}` on the bot;
comparison rows expose `house_design_key` / `house_design_version` for Curate/Deploy.

**Code:** `house_designs.py` · `strategy_lab_designs.py` · mint hook in
`identity.get_or_create_identity` · `GET /api/me/strategy-lab/designs` ·
`POST .../designs/house/apply` · migration **089** member copies · UI
`DesignHouseLibrary`.

## 2026-08-06 — DL-234 Curate comparison performance guard tests

**Coach:** Automated tests must fail early if the multi-bot comparison hot path
regresses (live Massive corr, 3N SQL, dual payload, fat series, multi-second wall).

**Landed:** `server/tests/test_strategy_lab_curate_perf_guards.py`  
**Budgets:** ≤12 SQL executes · ≤2s wall @ N=8 · `correlation.deferred` · bots-only  
**Arch:** `Architecture/20` §4 · Spec Surface acceptance #12

## 2026-08-06 — DL-233 Documentation parity: Curate board performance + suite nav

**Coach:** Update specs, architecture, and user guide for (1) multi-bot board
performance/stability contract and (2) suite nav restoration (Design · Curate ·
Deploy · Archive; Symbols under Design).

**Landed:**
- Spec Surface **v1.0.2** (§1.5 comparison hot path, §3 symbols under Design, §5 board stability)
- `Architecture/20-strategy-lab-curate-board-performance.md` (audit conclusions + as-built)
- Updates: Arch **19**, **18**, **README**; Curate user guide; Navigation Continuity note
- Decision log **DL-230–DL-232**

## 2026-08-06 — DL-232 Suite nav: Design · Curate · Deploy · Archive; Symbols under Design

**Coach:** Top suite must remain **Design · Curate · Deploy · Archive**. Do **not**
rename to Sim market / Live market. **Symbols is not a top-level suite tab.**

**As-built:**
- `web/lib/strategyLabSuite.ts` — suite = four items only
- Design **sub-nav**: Board | Symbols (`StrategyLabDesignSubNav`)
- Symbols pages chrome with `active=development`, `designSub=symbols`
- **Design:** assign symbol (underlying) via designer `CurateSymbolPicker` for BT/FW
- **Curate:** re-select scan symbol when creating a sim run
- **Deploy:** no symbol step — only curated bots

**Rationale:** Symbol is an attribute of the bot’s design and Curate run, not a
life-cycle phase. Deploy consumes already-curated bots.

## 2026-08-06 — DL-231 Curate multi-bot board: performance & browser stability

**Coach:** Browser must stay stable with many Curate instances (customer confidence).
Performance/architecture audit → redesign of comparison + PhaseRunDashboard.

**Root causes found:**
1. Live **Massive correlation** inside `GET .../comparison` (~20–22s @ 17 bots)
2. **1 Hz** parent `nowMs` re-rendering all cards + SVG charts
3. Unbounded mount of N mini equity charts
4. O(N) SQL + dual `bots`+`strategies` full payload

**As-built contract:**
- Comparison = **book metrics only**; corr **deferred** (calculator / `/correlation*`)
- Batched SQL (position aggs + last-N equity series window); compact `{equity}` points
- Primary array: **`bots`**; `strategies` empty (no dual full list)
- UI: **page size 12**; memo cards/charts; runtime clock **per-cell** only; tab-hidden pause
- Silent poll **30s**, no stacked fetches, loading only on initial/manual refresh
- Measured @ 17 bots: comparison **~6 ms**, payload **~19 KB** (was ~20s / ~60 KB)

**Code:** `curate_domain.comparison_report` · `PhaseRunDashboard` · `MiniEquityChart` ·
`CuratePhaseDashboard` · migration **088** `run_started_at` (runtime stat)

**Arch:** `Architecture/20-strategy-lab-curate-board-performance.md`

## 2026-08-06 — DL-230 Runtime since last start/restart

**Coach:** Dashboard must show **current runtime since last start/restart**, adaptive:
seconds → min:sec → hours/min → days/hours.

**As-built:** Column `run_started_at` on `strategy_lab_curate_instances` (migration
**088**). Set/reset on **Arm**. API: `run_started_at`, `runtime_seconds`,
`runtime_label`. UI: live Runtime on grid/table (per-cell timer after DL-231).

## 2026-08-05 — DL-212 Users admin free/paid visibility

**Decision:** The admin Users section now classifies every identity into a
**billing status** — `paid` / `free` / `alumni` / `staff` — surfaced as a badge
column, header counts, and filter buttons, so operators can see who is a paying
member at a glance. Read-side only: `server/routes/users_admin.py` +
`web/app/admin/users/page.tsx`. No migration (data already exists).

**Definitions (Coach-locked):**
- **paid** = an active/grace membership on a paid plan. Paid plans =
  `{observer, observer-trial, activator, navigator}`. **Observer and Observer
  Trial are the SAME $17/wk tier — no split**; both display as "Observer".
- **free** = an account with no active paid membership (self-serve `/register`
  observer-tier account, or a provisioned identity that never purchased). Free is
  the *absence* of a paid membership, not a tag. Waitlist leads
  (`feature_gate_emails` / AC "Labs Lead") are not identities and never appear here.
- **alumni** = active `alumni`-plan membership (churned-but-retained free grant);
  ranks below paid, shown as its own class.
- **staff** = `role_override = administrator`; excluded from member counts.
- Precedence when several apply: **staff > paid > alumni > free**.

**Also fixed in the same change (were making the data "look wrong"):**
1. Roster now **sorts by last-active** (max of login/pageview/lesson), matching
   the "Last active" column — previously it sorted by `last_login`, so order
   disagreed with the displayed times.
2. Login **method is relabeled** in the UI (`native`→"Password",
   `wordpress:fattail`→"FatTail SSO", `wordpress:0-dte`→"0-DTE SSO",
   `stripe`→"Stripe") and the column renamed "Signed in via", with a note that
   login method ≠ membership. This resolves the "native but Observer" confusion:
   "native" was a password login, never a plan.

**Implementation notes:** classify/sort/among-class-filter happen in Python over
the matched set (capped `ROSTER_CAP=5000`) so the filter and last-active sort stay
consistent with the table; header `counts` are always the full unfiltered picture.
`list_users`/`export.csv` accept `?billing=`; `user_detail` also returns
`billing_status`/`plan_tier`. Spec: `FatTail-Labs-User-Billing-Visibility-Spec-v1.0`.
Tests: `test_user_activity.py` (classifier truth table + counts sum + free-filter).
Status: implemented; pending live verification on MiniTwo.

*(Note: production MySQL session tz is America/New_York, so `_iso()`'s "Z" suffix
is nominal — Ernie's server and ops are ET, accepted as-is, not changed here.)*

---

## 2026-08-05 — DL-216b Trade Log `entry_source`: manual · import · automated

**Decision:** Three **distinct** provenance values on `member_trade_log_trades.entry_source`:

| Value | Meaning |
|-------|---------|
| **`manual`** | Member typed (structure form / legs) |
| **`import`** | File or paste adapters (ToS, CSV, canonical) |
| **`automated`** | Strategy Lab process runtime or other Labs automations |

**Never** stamp Strategy Lab fills as `import`, or file imports as `automated`. Legacy
`machine` → `automated` (migration **082**, normalizer synonym).

**Rationale:** Coach: import and automation are different audit/policy channels.
Automated fills will come from Strategy Lab (and future bots), not from ToS paste.

## 2026-08-05 — DL-216 Trade Log manual management (structure entry · close · trash)

**Decision:** Manual trade entry/close/trash is a first-class Practice surface. Spec
**§16** of Trade Log v1.1 and design architecture **`Architecture/15-trade-log-manual-management.md`**
are as-built authority. Structure-first create; open strip + row Close/Trash; close
pairing gates (orphan, account, units, drift); universal trash for now; `entry_source`
via migration **081** (refined in **DL-216b**). Client match helpers mirror
`trade_log_domain` and must not fork structure-key rules.

**Rationale:** Members re-enter multi-leg books by hand; leg-by-leg default was too
heavy. Honest open→close pairing and trash prevent silent book corruption without
profit theater. Provenance column enables later “manual-only trash” without guesswork.

**Code:** `web/lib/tradeLog.ts` · `TradeSheet` · `TradeLogTable` · `tradeLogPrefs.ts` ·
`migrations/081_trade_log_entry_source.sql` · create/import stamp `entry_source`.

## 2026-08-04 — DL-211 Member Help System (DB-backed help desk)

**Decision:** New in-app help desk. Members ask questions (optional image upload),
admins answer in a thread, all stored in the Labs DB. Migration `058`
(`help_questions`, `help_messages`); `server/help.py` + `routes/help.py`
(member) + `routes/help_admin.py` (admin); `web/components/HelpLauncher.tsx`
(mounted in AppChrome, members only) + `web/app/admin/help/`. Optional attachment
is a plain **image upload** (native file picker) — no auto-capture, no new
frontend dependency.

**Rationale:** Inspired by MarketSwarm-Canonical's in-app bug reporter (capture →
submit → admin triage → reply) but **stored in MySQL, not GitHub Issues** — the
requirement was DB-backed. Reuses notification infra: new question →
`notify.notify_admins` (admin in-app + email); public admin answer →
`member_notify.create_in_app` + SMTP email (sent after commit). All notifications
best-effort, never block the write. Members see only their own questions and only
public messages (internal notes are admin-only). Uploads validated by magic bytes,
capped at 5 MB, stored under `uploads/help/`; 10 questions/hour/member rate limit.

**Isolation (purely additive bolt-on, cannot block Labs):** help routers register
in a guarded `try/except` in `main.py` (import/registration failure is logged and
skipped — the app still boots); the member widget is wrapped in an `ErrorBoundary`;
`package.json`/build graph untouched; migration 058 is additive-only. Worst case =
"the Help button doesn't work," never a blocked login/page/API. Spec:
`FatTail-Labs-Help-System-Spec-v1.0`. Tests: `test_help.py`. Status: draft,
pending live verification on MiniTwo.

## 2026-08-06 — DL-229 Terminology: Bot · Strategy attribute · Position

**Coach:** Correct terminology for Curate/Deploy units:

| Term | Meaning |
|------|---------|
| **Bot** | Primary unit (what we wrongly called “strategy” on the grid) |
| **Strategy** | **Attribute of the bot** (pack / methodology) |
| **Position** | **Instance of the bot** (open/closed package) |

**Spec:** Curate-and-Deploy-Surface-Spec v1.0 §0 terminology; Process Runtime v1.2 glossary.  
**API:** emit `bot_id` / `bot_name` (+ legacy `strategy_*` aliases).  
**UI:** dashboards/reports use Bot / Position language.

## 2026-08-06 — DL-228 Spec & architecture documentation parity

**Coach:** Update specs and architecture docs for as-built Strategy Lab
Curate/Deploy surfaces.

**Landed:**
- `Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` (authority for Curate/Deploy UI, marks, symbols, correlation, reports)
- `Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md` (amends multi-member Curate / host priority)
- `Architecture/19-strategy-lab-as-built-map.md`
- Updates: Arch README, 09, 17, 18; Implementation Scope overlay; Curate user guide cross-links

## 2026-08-06 — DL-227 Relative correlation on grid + calculator

**Coach:** Grid view shows **relative correlation**; calculator for **any two
symbols** → Pearson coefficient.

**Shipped:** `market_data.correlation` (daily simple returns, Massive aggs);
indexes use proxy series when needed; `GET .../correlation?a=&b=&days=`;
`GET .../correlation/relative`; comparison attaches `corr_vs_spy` per run;
grid/table show **ρ vs SPY**; `CorrelationCalculator` on Symbols + Curate footer.

## 2026-08-06 — DL-226 Deploy equity & stats like Practice Reports

**Coach:** Deploy phase needs **detailed equity and stats reporting** similar to
Practice **Reports** (equity curve, drawdown, stats table, featured cards,
outcome distribution).

**Shipped:** `build_run_reports_book` (same DTO as trade-log reports-book);
`GET .../deploy/reports-book` + `.../curate/reports-book`; `DeployReportsPanel`
reuses Practice `EquityChart`, `DrawdownChart`, `StatsTable`, featured cards,
`BarDist`. Until Tradier Deploy outcomes exist, book is built from closed
**Curate sim** packages with honest source_note.

## 2026-08-06 — DL-225 Curate/Deploy high-visibility phase dashboards

**Coach:** Curate and Deploy must be highly visible with **similar interfaces**:
grid or table reporting plus **mini equity charts**. Shared `PhaseRunDashboard`
primitive; Curate live with sim equity series; Deploy shell mirrors layout until
Tradier provisioned.

## 2026-08-06 — DL-224 VIX + Daily VIX (VIX1D) for strategy decisions

**Coach:** VIX and **Daily VIX** for reference and strategy decisions.

| Symbol | Meaning |
|--------|---------|
| **VIX** | 30-day IV regime |
| **VIX1D** | Cboe Daily / 1-day VIX — 0DTE and daily decision context |

Both are **shared reference** marks (role=reference), not default scan underliers.
Each poll stores **mid + prev_close + day_change_pct** for daily reference.
API: `GET /api/me/strategy-lab/curate/vol-reference`. UI vol cards on Curate stream strip.
Until Massive index entitlement: proxies labeled (VIX/VIX1D → VIXY).

## 2026-08-06 — DL-223 Curate symbol universe (indexes + ETFs + stocks)

**Coach universe (enabled shared stream):**

| Kind | Symbols |
|------|---------|
| Indexes | **SPX, XSP, VIX** |
| ETFs | **SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG** |
| Stocks | **AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT** |

Options cadence: 3–5 expirations/week class. Migration `085` + `086` (VIX→VIXY proxy).
Index feeds `I:*` may 403; SPX/XSP proxy **SPY**, VIX proxy **VIXY**, always labeled.

## 2026-08-06 — DL-222 Shared live marks stream for all members

**Coach:** Support a **set of symbols** and a **live stream** that **every member's
collection** uses — one shared stream, not per-member sockets.

**Design:** `market_symbol_universe` + `market_live_marks` + heartbeat;
`python -m market_data.live_stream` polls Massive into DB; Curate
`get_mark(cur=…)` reads shared table first. Default universe: SPY, QQQ, IWM + Mag7.
Stale policy `LABS_MARK_STALE_SECONDS` (default 60); optional
`LABS_LIVE_MARKS_REQUIRED=1` fail-loud (no stub).

**API:** `GET /api/me/strategy-lab/curate/live-marks`. UI strip on Curate phase.
**Not Tradier streaming** (Arch/09).

## 2026-08-06 — DL-221 Multi-member Curate comparison is core

**Coach:** Multi-member is an **absolute** requirement. Curate exists so **many
strategies run** and can be **compared** for promote / portfolio inclusion — not
single-strategy hobby mode.

**Shipped:** `GET .../curate/comparison` (per-member multi-strategy metrics);
`POST .../curate/tick-all` (tick all armed/running for member);
`POST .../curate/platform-tick` (admin multi-member worker tick);
UI **Strategy comparison** + tick-all on Curate phase. Family B identity isolation.

**Still true:** Deploy Tradier multi-member after Coach validate; Curate sim is
the multi-strategy comparison plane first.

## 2026-08-06 — DL-220 Curate runtime user guide

**Coach:** User guide for Curate run environment: UI path, under-the-covers
position/cash/mark/envelope, decision log, chart feasibility (data-ready; UI charts
not shipped in v1).

**Doc:** `docs/Strategy-Lab-Curate-Runtime-User-Guide.md`

## 2026-08-06 — DL-219 Curate run environment v1 (sim)

**Coach:** Start Curate run environment for everyone (Stage A). Real-market marks
(stub v1) + simulated broker + fake money; never Tradier. Member-triggered tick
(manage-before-scan); cloud scheduled workers later.

**Shipped:** migration `083_strategy_lab_curate_runtime.sql`; package
`server/strategy_runtime/`; routes `/api/me/strategy-lab/curate/*`; UI
`CurateRuntimePanel`; tests `test_strategy_lab_curate.py`. Fill model
`mark_mid_v1` labeled. Deploy still Coach-only / not in this slice.

## 2026-08-06 — DL-218 Strategy Lab growth playbook (dogfood → platform)

**Coach:** Fund Tradier, hook API, scale through FatTail Labs so others can create
and deploy **FatTail-style** process-bots. Best path is **vertical slice first**,
growth stages with hard exit criteria—not multi-tenant or multi-pack before dogfood.

**Stages (v1.1 refine):**  
- **A — Design + Curate for everyone** (shared studio; sim only; no member Deploy)  
- **B — Deploy for Coach only** (validate Tradier paper/live + runtime)  
- **C — Provision members** for Deploy (their Tradier; paper then gated live)  
- **D — Solid platform** (hundreds, caps, HA, doctrine)

**Build order:** Design/Curate multi-tenant + Coach Tradier spike in parallel →
Coach-only Deploy gate → member OAuth + `strategy_lab_deploy` provision.

**Architecture:** `Architecture/17-strategy-lab-growth-playbook.md` **v1.1**

## 2026-08-06 — DL-217 Same service type as OA, opposite strategic direction

**Coach:** Offer the **same type of service** as Option Alpha (no-code process
automation, cloud continuous run, paper engine, broker-connected live) with a
**completely opposite strategic direction for traders**.

| Same | Opposite |
|------|----------|
| Hosted bots / process runtime, paper, Tradier | Capacity over dependency (not set-and-forget) |
| OA-class reliability & performance (DL-216) | Stop the bleeding; process outcomes never profit claims |
| Encode → prove → run → inspect | Proof gates, version pin, arming; Habit Catalog + retro |
| Member broker custody | Defined-risk pathway; creator owns plan; no profit theater |

**Architecture:** `Architecture/16-strategy-lab-vs-option-alpha-positioning.md`  
**Bar:** OA-class **service**; FatTail **doctrine**. Features that increase dependency
or profit theater without increasing capacity or proof do not ship.

## 2026-08-06 — DL-216 Competitive bar: Option Alpha–class host reliability

**Coach:** Strategy Lab will **compete with Option Alpha**. Therefore the service must
be **at least equal in reliability and performance** for continuous automations
(paper/Curate and live).

**Implication:** Cloud-hosted Process Runtime (**M3-class workers**) is **competitive
primary**, not an optional residual. MiniTwo-only multi-tenant bot hosting is
insufficient. OA-class means: always-on cloud host, auto-restart, queue/workers,
monitoring/kill switches, in-house paper (Curate: real market + sim broker + fake
money), live via member broker API (Tradier first).

**Still locked from DL-214:** User owns strategy + arming; broker owns custody and
fills; prefer **broker-held exits**; no P&L or perfect-exit guarantees; M0 export and
M2 user-local remain **secondary** (capacity/portability).

**Architecture:** `Architecture/14-strategy-lab-execution-responsibility.md` **v1.1**  
**Follow-on:** Process Runtime Spec amend to **v1.2** (M3 primary for continuous
paths; §17 normative). Broker stack: two-layer adapter + ExecutionService
(`docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md`).

## 2026-08-05 — DL-215 Process Runtime Spec v1.1

**Coach:** Runtime Spec amended for execution offload. **v1.1** is SPEC AUTHORITY;
v1.0 superseded for responsibility/priority. M0–M2 primary; M3 optional; Tradier-first;
arming ceremony; Deployment Pack export; broker-held exits; admin console for residual
fleet; §17 workers only for M3/assist.

**Note (2026-08-06):** Competitive mandate **DL-216** elevates M3-class cloud hosting
to primary for continuous bots; v1.2 Spec amend required. v1.1 remains authority until
v1.2 lands.

**Spec:** `Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md`

## 2026-08-05 — DL-214 Execution responsibility: user + broker first

**Coach direction:** Primary goal is to **offload running automations** to the
**user (creator)** and the **broker**, not to make Labs the always-on multi-tenant
bot host. Labs = design, validate, version, document, export/handoff, optional
assisted connectivity. Broker = account, orders, custody, broker-held exits when
possible. User = strategy ownership, arming, monitoring, contingency.

**First broker target: Tradier** (paper → live). Market data remains Massive /
Coach chain pipe — do not buy Tradier streaming. Maximize multi-leg open +
OCO/OTO/OTOCO **broker-held** exits; scan graphs stay user-local or manual.

**Architecture:** `Architecture/14-strategy-lab-execution-responsibility.md` §13  
**Implication:** Process Runtime Spec §17 (Labs workers at scale) becomes
**optional M3**, not the product north star. Prefer M0 export/manual, M1
broker-native exits, M2 user-local runtime.

## 2026-08-05 — DL-213b Process Runtime multi-tenant scale (§17)

**Coach:** Plan for **dozens → hundreds** of members with armed automations.
Normative: **control plane (API) ≠ data plane (workers)**; **job queue + leased
workers**; fair multi-tenant claim; manage-before-scan under load; shared market
data fan-out (not per-user sockets); broker throttle gateway; per-identity caps;
decision_log volume/retention. Separate **worker role** required for scheduled/live;
separate microservice repo **not** required. Defaults: soft 5 / hard 10 armed
instances; min scan 60s; MySQL jobs table v1.

**Spec:** `Strategy-Lab-Process-Runtime-Spec-v1.0.md` §17.

## 2026-08-05 — DL-213 Strategy Lab Process Runtime Spec v1.0

**Coach:** Spec for deployment process runtime (FatTail shape of “bots as
processes”): **deployment instance** + **risk envelope** + **scan/manage runners**
+ **typed decisions** + **decision log** + **dry/paper/live ladder**. Explicitly
inherits Continuity (place ≠ SoR; empty-on-unknown), Versioning P1–P8 (explore ≠
rebind; restore does not silent-mutate runners; freeze on live; drift fail loud),
Development Phase gates (no live without BT/FW path), Massive/Tradier split.

**Spec:** `Specs/Strategy-Lab-Process-Runtime-Spec-v1.0.md` (SPEC AUTHORITY).  
**Not:** OptionAlpha clone; free-floating bots before life cycle.

## 2026-08-03 — DL-212 Habit Catalog Spec v0.1 + multi-agent plan

**Coach:** Design architecture locked (`Architecture/13-habit-catalog-design.md`).
**Spec** `FatTail-Labs-Habit-Catalog-Spec-v0.1.md` opened for W0 review (not BUILD
until HC0-G). **Plan:** `docs/Habit-Catalog-Full-Agent-Bench-Plan.md` · board
`agents/p-habit-catalog/`. Sequence HC0→HC6; vertical slice `size-reason`.
Coverage law + Family B floor normative. Implementation blocked on Coach GO.

## 2026-08-03 — DL-211 North star ethos v1.2 (distress vernacular + register)

**Coach / review:** Address false positives on trading death/violence vernacular;
language register on **agent output only**; distress gate independent of ethos MODE;
named support paths; Family B LLM **opt-in** default; priors held until Hotel.

| Topic | Decision |
|-------|----------|
| Distress classifier | **Target = self** (self-harm/suicide), not intensity; exclude suicide spread / trade killed me / blew up / etc. |
| After stop | Session stays open; re-eval each turn; no day lockout |
| Support paths | Free write; US 988; IASP local resources; not founder crisis routing |
| Register | `plain` (default) \| `vernacular` \| `mirror`; mirror off under distress; never on member input |
| ETHOS_MODE=off | Drops ethos preamble only; **distress code gate remains** |
| WORLD_MODEL_PRIORS | Hotel hold; not product-exported until ratified |
| Model-in-loop | Scheduled eval later; CI keeps unit/vernacular corpora |

**Spec:** v1.2. **Code:** `labs_member_ai_ethos.py` V1_2 + tests.

## 2026-08-03 — DL-210 North star ethos v1.1 (completeness)

**Coach + review holds addressed:** Spec **v1.1** supersedes v1.0.

| Hold | Resolution |
|------|------------|
| Distress case | §5.2 #9 + code gate stop-interview (`distress_hold`) |
| Unsourced % in AI world model | Qualitative ethos body; `WORLD_MODEL_PRIORS` sourced/dated §7 |
| Behavioral ban eval | Tests: composed bans present; validator rejects advice/motive; distress no probe |
| Family B → LLM | Spec §5.6 privacy terms |
| Version any wording edit | `LABS_MEMBER_AI_ETHOS_V1_1`; MODE=off fallback |
| Truth 1 quiet week | Explicit nothing-hard branch |

**Alpha:** `labs_member_ai_ethos.py` V1_1; journal distress path; tests extended.

## 2026-08-03 — DL-209 North star & member AI ethos (V1)

**Coach:** True north star — **help traders become enlightened** (secular: present,
aware, integrated; habit-engineered cessation; toughness as enabler). Brand roots:
0DTE ensō + FatTail swoosh (right-skew / fat tails / Zen ink). Retrospective maps to
Four Noble Truths shape; Truth 3 = habit-building machine.

**Spec:** v1.0 GO → **superseded by v1.1** (DL-210).

**Alpha:** `server/labs_member_ai_ethos.py` + Journal/Retro compose/stamp (amended DL-210).

**Lima:** Guide “Why we practice”; CLAUDE.md pointer.

**Follow-on:** Habit Catalog; insight plane; Hotel §7 series; Tango distress copy;
Mike/counsel journal-agent privacy notice.

## 2026-08-03 — DL-208 CSRF Origin/Referer guard (M6)

**Alpha:** Middleware `CsrfOriginMiddleware` rejects POST/PUT/PATCH/DELETE that carry
`ft_session` unless Origin or Referer matches allowlist (`LABS_WEB_ORIGIN`,
`LABS_CSRF_ORIGINS`, same request host, plus localhost/testserver in dev).
Skips safe methods, cookieless requests (login/webhooks), and Bearer agent auth.
Tests: `test_csrf_m6.py`. conftest sets Origin: http://testserver.

## 2026-08-03 — DL-207 SSO email/link reconciliation (M2)

**Alpha:** `identity.resolve_sso_identity` is the single SSO/webhook identity
resolver. Prefer `(provider, external_id)` link; if JWT/webhook email changes and
the new email is free, update Labs email; if email belongs to another identity or
the same email is already linked to a different WP user id → **409**. Used by
SSO callback and membership webhooks. Tests: `test_sso_m2_email_link.py`.

## 2026-08-03 — DL-206 Membership webhook anti-replay (M7)

**Alpha:** `POST /api/integrations/{provider}/membership` requires `timestamp`
(or `sent_at`) inside the HMAC-signed JSON body. Reject if age >
`LABS_WEBHOOK_MAX_AGE_SECONDS` (default 300) or too far future. Exact raw-body
replay within the window → 409. Module: `server/webhook_security.py`.
Tests: `tests/test_webhook_m7.py`. Docs: WooCommerce SSO guide §6 updated.

## 2026-08-03 — DL-205 Auth rate limits (M1)

**Alpha:** In-process sliding-window rate limits on auth routes (`server/rate_limit.py`):

| Endpoint | Default |
|----------|---------|
| POST /login | 10/min per IP + per email |
| POST /forgot-password | 5/hour per IP + per email |
| POST /register | 5/min per IP |
| POST /reset-password | 10/min per IP |
| GET /auth/sso/* | 30/min per IP |

429 + Retry-After. Env overrides: `LABS_RL_*`. Single-worker launchd assumed.
Tests: `tests/test_rate_limit_m1.py`.

## 2026-08-02 — DL-204 Auth hardening H3 allowlist + H1 live role

**Alpha · Mike posture:** High-impact auth fixes implemented in-repo.

**H3:** `LABS_ADMIN_EMAILS` (required outside dev). SSO sets `role_override=administrator`
only if WP is_admin **and** email allowlisted (`admin_allowlist.py`). Seed:
ernie@dudefromearth.com, coach@fattail.ai, conor@fattail.ai.

**H1:** `guards.require_admin` / `require_role(administrator)` use live
`identity.derive_role` — demoted admin JWT → 403. `identity_id=0` forbidden outside dev.
Member `require_role` still uses `feature_role` for Observer elevation.

**H2/H4:** SSO log email domain only; deploy.md nginx/TTL notes; `docs/Auth-Account-Switch-Runbook.md`.

**H5 residual:** agent could not SSH MiniTwo — human deploy still required.

Tests: `test_admin_allowlist_h3.py`, `test_live_role_h1.py`. Board: `p-auth-hardening` CLOSE.

## 2026-08-02 — DL-203 Auth hardening program GO (p-auth-hardening)

**Coach W0 GO:** Multi-agent program to close high-impact auth findings.

- Order: **H5 deploy → H3 admin allowlist → H1 live role → H2 SSO JWT hygiene → H4 account-switch ops**
- Board: `agents/p-auth-hardening/ORCHESTRATOR.md`
- Plan: `docs/Auth-Hardening-Full-Agent-Bench-Plan.md`
- Audit: `docs/Auth-Hardening-Audit-2026-08-02.md`
- H3 allowlist seed emails: ernie@dudefromearth.com, coach@fattail.ai, conor@fattail.ai
- Assessment + reevaluation after each H*-G; M-backlog parked until promoted

**Next:** H5-1 Foxtrot deploy (not localhost-only).

## 2026-08-02 — DL-202 Access Control AC1–AC8 implementation (MVP)

**Alpha · Charlie · Kilo · Delta · Lima:** Access Policy Engine shipped through MVP.

| Phase | Delivered |
|-------|-----------|
| AC1 | constants, keys, DDL 075, evaluate, unit tests |
| AC2 | admin CRUD/bulk/decision/audit, write validation 422 |
| AC3 | lesson evaluate + dual-write free_preview + access JSON |
| AC4 | trade-log read/export/write capabilities + floor |
| AC5 | `/admin/access` cockpit |
| AC6 | sitemap §6.2 notes + anonymous_http_status helper |
| AC7 | bulk API; feature_gates merge deferred |
| AC8 | program PASS with residuals |

**Spec:** v0.4 BUILD AUTHORITY. **Board:** `agents/p-access-control/`.  
**Tests:** `test_access_control_*.py` (41 passed).

## 2026-08-02 — DL-201 Access Control AC1-3 evaluate engine

**Alpha · India · Mike:** `server/access_control/` evaluate path:

- `evaluate` / `evaluate_many` / `effective_plans` / `expand_plans` (eval-time only)
- `require_access` resource hook — **no** public decision route
- Viewer from claims + live plan slugs; PreviewAs empty enrollments
- Data-bearing `read_only_floor`; grandfather course family; campaign fail-closed defaults

**Next:** AC1-4 characterization unit suite → AC1-G.

## 2026-08-02 — DL-200 Access Control AC1-2 schema (075)

**Alpha · India:** Migration `075_access_policies.sql` applied.

- Tables: `access_policies` (PK target_key), `access_policy_audit`
- Intent columns: `selected_plans_json`, `exact_plans_only` — **no** expanded-plan cache
- Spec: Access Control v0.4 §9 exact SoR
- Evidence: migrate dry-run / apply / empty pending; SHOW CREATE verified

**Next:** AC1-3 evaluate engine.

## 2026-08-02 — DL-199 Access Control BUILD AUTHORITY + AC1-1 constants

**Coach:** Spec v0.4 **BUILD AUTHORITY** (W0-G PASS). AC1-1 lands pure package:

- `server/access_control/` — `constants.py`, `keys.py`, `defaults.py`
- Target grammar: `surface:{name}`, `app:{slug}`, `course|module|lesson|resource:{id}`,
  `campaign:{slug}:{part}`
- Plan buckets commercial expand-at-eval; **alumni never auto-added**
- `DATA_BEARING_APPS` = trade-log, journal, playbook
- `ACCESS_UNGATEABLE_TARGETS` login/signup/membership/recovery/`me`
- Type defaults table mirrors Spec §6.3 / as-built (lesson free_preview + membership, campaign fail-closed)
- Tests: `server/tests/test_access_control_keys.py` (13 pure unit tests)

**Board:** `agents/p-access-control/` · next AC1-2 DDL.

## 2026-08-02 — DL-198 Access Control Spec v0.4 (third review)

**Coach:** Third external review of Access Control v0.3 → **v0.4 DRAFT**.

**Blocking fixes:**
1. **Store plan intent; expand at evaluate** (not write-time freeze of slug vocabulary).
2. **Alumni** outside commercial expansion; admitted via min_role ladder; UI copy.
3. (Carried) data-bearing floor; sitemap = anonymous 200.

**Should-fix:** 422-only on illegal app locks (no silent coerce); deny_plans does **not**
strip data-bearing read/export; SSG skeleton (no lock→open flash); complete self-contained DDL;
dead branches removed from algorithm.

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` (supersedes v0.3).  
**Superseded status note:** BUILD AUTHORITY stamped same day — see **DL-199**.

## 2026-08-02 — DL-197 Access Control Spec v0.3 (second review)

**Superseded by DL-198 / v0.4.**  
**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.3.md` — SUPERSEDED.

## 2026-08-02 — DL-196 Access Control Spec v0.2 (review fixes)

**Coach:** External evaluation of Access Control v0.1 incorporated into **v0.2 DRAFT**.
**Superseded by DL-197 / v0.3.**

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.2.md` — SUPERSEDED.

## 2026-08-02 — DL-195 Access Control Spec v0.1 (DRAFT)

**Coach intent:** Admin-controlled gating by role/plan for **pages (surfaces), apps,
and course elements**, with campaign design control (time, CTAs, soft/hard lock)
without deploys.

**Artifact:** `Specs/FatTail-Labs-Access-Control-Spec-v0.1.md` — **superseded by v0.2**.

**Direction:** Unified Access Policy Engine + `/admin/access` cockpit; consumes
Identity Access memberships; absorbs feature_gates and free_preview over phases P0–P2.

**Does not reverse:** Woo commerce; provider_plan_map; server-side auth only.

---

## 2026-08-02 — DL-194 Observer ≡ Navigator via `feature_role` (all gates)

**Decision (Coach):** Paid **Observer** membership (`observer-trial`) has the **same
feature access as Navigator** for the term (DL-126/128). Implement centrally:

- `identity.feature_role(cur, identity_id, session_role)` elevates active Observer
  membership to **navigator** for gates (live coaching, courses, resources, Practice).
- `identity.role_meets(...)` is the single comparison helper.
- `GET /api/auth/me` returns `access_role` for UI chrome (hide free-only CTAs).

**Wired:** live join gates · lessons · progress · resources · Practice
(`can_create_or_gather` / Trade Log) · Journey retro eligibility.

**Free no-plan** stays true `observer` (previews only). Sole product difference remains
**6-week term**, not feature cuts.

## 2026-08-02 — DL-193 Trade Log / Reports: Observer = Navigator Practice gate

**Decision (Coach):** Trade Log and Reports use the **same Practice entitlement** as
Journal / Retrospective (`can_create_or_gather`): administrator, role activator+, or
active **observer-trial** membership — even when the session role cookie is still
`observer`. Free no-plan remains denied.

**Why:** Trade Log wrongly required Activator+ only, blocking paid Observers who should
have full Navigator Practice access for the 6-week term (DL-126 / DL-128).

**Code:** `server/routes/trade_log/common.py` `_require_tool_member` · UI copy on Trade Log
and Reports forbidden states. Superseded in part by **DL-194** central elevation.

**Does not reverse:** free observer = previews only; alumni course library only.

---

## 2026-08-02 — DL-192 SSO post-login deep links (`next`)

**Decision (Coach):** WordPress My Account (and any member CTA) may deep-link into any
Labs path after SSO. Labs callback accepts optional site-relative query `next`
(e.g. `?next=/course`). Default remains `/home`. Unsafe values (absolute URL,
`//…`, etc.) fall back to `/home` — open-redirect safe.

**Why:** Bare `labs.fattail.ai/…` never mints `ft_session`; members hit free-account
CTAs. fotw-sso must always be the entry. `next` lets one SSO hop land on catalog,
Journey, Journal, etc. without hardcoding a single post-login page.

**Ops paste sheet:** `docs/WP-My-Account-Courses-SSO-Link.md`  
**Code:** `server/routes/auth_routes.py` (`safe_next_path`, SSO `next` param)

**Does not reverse:** dual-issuer SSO, `ft_session`, Woo as commerce only.

---

## 2026-08-02 — DL-191 Continuous journaling + day-start routine

**Decision (Coach):** Journaling is **not** an end-of-day task. It is capture **with every
experience throughout the day** — including **pre-market analysis** and **post-market
exhale**. Trade Log holds structure as the experience happens; Journal holds mind. The
day is one conversation (Journal Session v0.6); timestamps and market phase already make
continuous capture load-bearing.

**Day-start routine:** A notification system should **invite the routine when the trader
starts their day** (prep Journal / Practice Context) — gentle, process-only, idempotent,
no shame language, no P&L. Recommended design: member prep time + first Labs open of day
if pre-market note missing. P0 = in-app; browser/email later. Full build follows thin
spec + `member_notify` kind — not a second journal product.

**Education:** Labs OS course Practice module + Guide teach continuous journaling.

**Artifact:** `Specs/FatTail-Labs-Continuous-Journaling-Direction-2026-08-02.md`

**Does not reverse:** Journal Session v0.6 one-session-per-date model; Family B; empty≠zero.

---

## 2026-08-02 — DL-190 Process Flow: state of being + recent-weighted scoring

**Decision (Coach):** Reposition what was branded **Process Integrity (score)** as
**Process Flow** — a **state of being**, the **flow state of your trading process**,
not a test result you “got after the exam.”

**Scoring intent (same decision):**
- Keep **dimension weights** on key parts (quality: adherence, retrospective, etc.).
- Apply **exponential average / decay (EWMA)** so **more recent behavior weighs more**
  than older history — extend the live-presence EWMA pattern to the other time-series
  meters and the overall state, not only Live.
- Language: weight recent more heavily; never “punish.”

**Does not reverse:** DL-171 Option 1 **rebalance** (adherence + retro real weight;
not engagement-majority). This is **not** the rejected rename of trial overall to
“Practice engagement.”

**Working member name:** **Process Flow** (Coach may refine).  
**API key `process`:** keep during migration; framing/UI first.  
**Privacy / no P&L:** unchanged.

**Artifacts:**
- `Specs/FatTail-Labs-Process-Flow-Repositioning-Note-2026-08-02.md`
- Course spine Journey lesson (Process Flow framing)
- Guide copy aligned to Process Flow language
- PI Spec v0.4 header pointer → this decision (full formula EOL in next Journey/PI amend)

**Next build:** India formulas + Alpha `scoring_model_version` bump + shadow; Charlie
UI strings; characterization tests for EWMA half-lives.

---

## 2026-08-01 — DL-189 Navigator pricing $267/mo · $2,997/yr

**Decision (Coach):** Navigator list prices are **$267/month** and **$2,997/year**
(was $250 / $2,500). Annual badge **Save $207/year** vs 12× monthly.

**Updated:** `plans.display_json` (mig 066), seed_dev, Guide, Membership Tiers Spec,
Course Hosting Spec, SEO offers note.

---

## 2026-08-01 — DL-188 Observer membership 6 weeks (habit formation)

**Decision (Coach):** Observer membership duration is **6 weeks** (not 4).

**Rationale:** Give process habits time to form. Habit research commonly cites
on the order of **~33–66 days** for a habit to hold; six weeks sits in that band.
Product/billing: **$17/wk or $102** for the six-week term. Full Navigator
access during the term; complete the six weeks → alumni course year rule unchanged.

**Materials updated:** `plans.display_json` (mig 064), `seed_dev.py`, membership
FAQ + Guide, Start Here course copy (description + roadmap lessons), hub-intro
script, Membership Tiers Spec already stated 6 weeks / $102.

**Not changed:** Live Presence EWMA half-life (4 weeks) — different concept.
`free_observer` tenure ramp (4 weeks) — not the paid Observer membership.

---

## 2026-08-01 — DL-187 Chain archive: collect local, not on-demand history

**Decision (Coach):** Option chain **history for Test is local**. Collect forward
into `data/market/chains/`. **Do not** rely on on-demand re-fetch for historical
windows. On-demand is only optional “latest” live fill-in.

**Coach feed reality (2026-08-01):** Full SPX chain already arrives as fast as the
vendor delivers (**~5–10 s**) with Greeks; **SPX underlier differential pricing
~4 Hz**. Labs should **ingest those feeds** as primary — not re-poll Massive for
the same SPX surface. Massive poller remains a fallback / other-underlier tool.

**Ingest design (Coach):** **Tee/pipe a copy** of whatever is already delivered to
the FatTail app each trading day into a local archive. That archive is the
historical backtest corpus. Production consumers stay unchanged.

**Other symbols:** For the supported non-SPX-chain universe (Mag 7, ETFs, few
futures underliers), **download ~1 year of history** (Massive bars/trades) for
historical Test. Refresh incrementally. Still **no** multi-year Mag 7 option-chain
warehouse.

**Landed:** `server/market_data/` (`MassiveClient`, `ChainStore`, `chain_collector`
CLI), unit tests for store, gitignore `data/market/`. Next: pipe from FatTail app
feed → archive; underlier history bulk load.

---

## 2026-08-01 — DL-186 Strategy Lab: Massive data, dual Test, chain collect-forward

**Decision (Coach):**

1. **Market data = Massive** (already paid). **Do not** buy Tradier ~$400/mo streaming.  
2. **Execution / deploy = Tradier** only (paper → live orders and fills).  
3. **Test has two modes — both required:**  
   - **Historical** — replay frozen underlier history + stored option chain snaps  
   - **Live** — Massive WebSocket (signal-only or Tradier paper)  
4. **SPX chains:** no deep historical archive assumed. **Collect forward** (e.g. few weeks
   of periodic snapshots), then run historical structure tests on that recent window.
   Until enough history exists: underlier historical tests + live tests still ship.

**Doc:** `Architecture/09-strategy-lab-tradier.md` (expanded).

---

## 2026-08-01 — DL-185 Strategy Lab execution target: Tradier

**Decision (Coach):** **Tradier is the target broker platform** for Strategy Lab
bots and live/paper execution rails.

| Item | Lock |
|------|------|
| **Primary broker** | **Tradier** (Coach relationship + business hub page) |
| **Scope stages** | Build · Test · Run bots · live and paper |
| **Dogfood** | Coach has Tradier; IB / TradeStation **not** v1 targets |
| **TradingView** | **Reach + funnel** (alerts / ideas / optional webhooks) — not source of truth for risk or fills |
| **tastytrade / ToS** | Optional later adapters or human desk; not v1 bot host of record |
| **Robinhood** | Out of product scope for bots |
| **Architecture** | Broker-agnostic adapter interface; **Tradier first implementation only** |

**Rationale:** Relationship + hub page enable distribution and integration
partnership; REST API fits Labs FastAPI; options multi-leg automation is dogfoodable
without Gateway. Futures remain phase-2 after equity-options path works.

**Product promise:** Process brakes, kill switch, logs — never “set and forget”
profit claims. Paper/virtual before live.

**Landing:** Strategy Lab member copy names Tradier as intended execution partner
when workspace ships. Spec / adapter implementation is a later build packet.

---

## 2026-07-31 — DL-180 FatTail Hard H3 — MT on Journey composite

**Decision:** Mental Toughness meter wired into Process Integrity overall when
member has **active** Hard enrollment (Hard Spec v1.0 §8 · H3).

| Item | As-built |
|------|----------|
| Model version | `pi-weights-v1-option1+mt` |
| Meter | `mental_toughness` empty if not enrolled/paused/exited |
| Raw | 50% streak vs sprint cap + 50% completion rate (window) |
| Weights | `PROCESS_METER_WEIGHTS_WITH_MT` seven-maps (Spec §8.3 integers) |
| Journey Spec | §4.1 amended — seventh meter |
| Tests | `test_hard.py::test_process_meters_mt_empty_then_enrolled` |

**Not in H3:** photos (H4), agent (H5). Coach may retune MT weight integers later.

---

## 2026-07-31 — DL-179 FatTail Hard H2 — Toughness UI shipped

**Decision:** H2 member surfaces for Hard Spec v1.0.

| Route | Content |
|-------|---------|
| `/app/toughness` | Hub: physiology cite, status, True 75 + FatTail Hard cards |
| `/app/toughness/true-75` | Frisella credit + honor-system enroll |
| `/app/toughness/fattail-hard` | Progressive program enroll (20/40/75) |
| `/app/toughness/today` | Daily task log + progress record |

**UI:** `web/components/hard/*` · `web/lib/hardApi.ts` · Apps grid card **Toughness**.  
**Cite block:** mandatory Touroutoglou et al. 2020 on hub and program pages.  
**Not in H2:** photos (H4), MT in Journey composite (H3), agent (H5).

---

## 2026-07-31 — DL-178 FatTail Hard H1 — domain + API shipped

**Decision:** H1 domain spine for Hard Spec v1.0 implemented.

| Item | As-built |
|------|----------|
| Migration | `059_hard_mental_toughness.sql` — `member_hard_enrollments`, `member_hard_daily_logs` |
| Domain | `server/hard_domain.py` — variants (True 75 honor + FatTail 20/40/75), how_it_works, miss→restart day one, enroll, daily, pause/exit/resume, compliance, MT raw empty-until-active |
| API | `GET /api/me/hard`, `/variants`, `POST enroll|daily|pause|exit|resume` |
| Privacy | Identity-scoped FKs; private by default; no board routes; physiology cite on snapshot |
| Photos | Column `photo_resource_id` nullable (H4); H1 progress_note for record |
| Tests | `server/tests/test_hard.py` — 4 passed |

**Not in H1:** UI, PI composite MT weight, photo upload, agent.  
**Next:** H2 `/toughness` UI.

---

## 2026-07-31 — DL-184 Life events & priority shift (Hard copy)

**Decision (Coach):** Member copy must warn that people often are **not prepared**
for how the program changes **lives and priorities** — especially **no drinking**
and **no diet cheating**. Vacations, weddings, and other life events will challenge
resolve; rules do not pause.

**Landed:** `HOW_IT_WORKS.life_and_priorities` + body/rules; HowItWorks + FatTail/
Today copy; Hard Spec §6.

---

## 2026-07-31 — DL-183 Ladder psychology 20→40→75

**Decision (Coach):** Member copy must name the lived path:

- After **20**, people may give up or choose **40**; some need **20 twice** before
  40 feels possible (capacity, not failure).
- At **40**, most hit a **major period of despair**; through that → end is reachable.
- **75** by stacking rungs, not skipping the middle.

**Landed:** `HOW_IT_WORKS.ladder` + per-variant `ladder_blurb`; HowItWorks + FatTail
enroll UI; Hard Spec §6.

---

## 2026-07-31 — DL-182 Toughness How-it-works + 20/40/75 ladder

**Decision (Coach):**

1. **How it works** must be explicit on `/app/toughness`: these programs develop
   **Mental Toughness**; complete all required activities every day for the full
   length; fail any activity → **restart day one**; hard but most effective for
   real physiology/mindset change; become mentally tough by progressing the set.
2. **Intro video** slot on hub (YouTube via `HARD_INTRO_VIDEO_ID` when published);
   written rules are the contract until the video ships.
3. **FatTail Hard lengths:** **20 / 40 / 75 days** (breakthrough periods), not
   7/14/30. Variants: `fattail_sprint_20|40|75`. `miss_policy: restart`.

**Landed:** `hard_domain.HOW_IT_WORKS` + restart engine; `HowItWorks` UI; Hard Spec
§6–7; tests for 20/40/75.

---

## 2026-07-31 — DL-181 Product term: mental toughness (not tenacity)

**Decision (Coach):** Member-facing Hard / physiology copy uses **mental toughness**,
not “tenacity.” Academic sources may retain “tenacity” in titles/quotes only;
product never surfaces that synonym in UI — maps the capacity to mental toughness.

**Updated:** PhysiologyCite (no member-facing “tenacity”), hard API note, journey MT
hint, Apps blurb, Hard Spec §4, PI Spec §5.1b, aMCC source pack product claim lines.

---

## 2026-07-31 — DL-177 FatTail Hard H0 GO — Spec v1.0 build authority

**Decision (Coach):** **GO on H0** for FatTail Hard / Mental Toughness program.

**Landed:**

| Artifact | Path |
|----------|------|
| Implementation plan | `agents/p-fattail-hard/IMPLEMENTATION-PLAN.md` |
| Orchestrator | `agents/p-fattail-hard/ORCHESTRATOR.md` |
| **Hard Spec v1.0** | `Specs/FatTail-Labs-Hard-Mental-Toughness-Spec-v1.0.md` (**BUILD AUTHORITY**) |
| Science pack | `agents/p-fattail-hard/science/aMCC-source-pack-v1.md` |

**Coach inventory C1–C10** retained in Spec (True 75 + FatTail Hard + MT composite when
enrolled + mandatory aMCC cites). Photos: requirement **kept**; H2 ships progress
**record**, photo upload **H4** (stated up front — not silent drop).

**Primary science:** Touroutoglou et al. (2020) *Cortex* “The tenacious brain” (PMID
31733343). Hotel formal secondary verify before H2 copy.

**Next:** H1 domain + privacy + API. No Track C product deletion without Coach.

---

## 2026-07-31 — DL-176 Coach Content Law (hard rules for all agents)

**Decision (Coach):** Non-negotiable operating law for every agent and every review
folded into the repo. Doctrine **§11**.

1. **Nothing of Coach’s is removed** — not from a spec, draft, or summary. If something
   “doesn’t belong,” it **stays** and the objection goes **next to it**, marked as the
   objector’s, for Coach to accept or throw out.  
2. If an agent **changed or dropped** Coach content, say so **up front** — not buried in
   a changelog where a downstream agent turns it into a fait accompli.  
3. **Research before questioning** — search, read actual sources, check evidence; not
   priors dressed up as conclusions.  
4. **Blocking** only when something breaks an **invariant**, breaks the **law**, or breaks
   the **system**. Everything else is an **opinion**, free to discard, and **labeled**
   that way. Disagreement may **not** be promoted into a constraint by reaching for risk
   language.

**Why:** DL-173 (FatTail Hard silent de-scope) is the failure mode this law prevents.
External reviews remain valuable **input**; they never become silent product law.

**As-built:** `agents/bench/doctrine.md` §11 · `spec-create-review-workflow.md` · India/Tango
charters · `AGENTS.md` · agent-template completion checklist.

---

## 2026-07-31 — DL-175 Hard must cite physiological underpinnings (Coach)

**Decision (Coach):** FatTail Hard / Mental Toughness **shall cite the physiological
underpinnings** of the program — not slogan-only discipline marketing.

**Required on member-facing Hard surfaces:** what is trained (mental
toughness/persistence under effort cost), **aMCC** as the literature locus, why
repeated voluntary challenge is the intervention, and **named sources**
(paraphrase-and-attribute). Product term: mental toughness (DL-181).

**Canonical anchor paper (minimum pack):**

- Touroutoglou, A., Andreano, J., Dickerson, B. C., & Barrett, L. F. (2020). The tenacious
  brain: How the anterior mid-cingulate contributes to achieving goals. *Cortex, 123*,
  12–29. https://doi.org/10.1016/j.cortex.2019.09.011

**Forbidden:** guaranteed brain growth, medical diagnosis/treatment claims, uncited
“science says,” profit claims from willpower.

**Gates:** Hotel (+ Bravo) on sources · Tango on capacity/shame · Sierra/Charlie on cite
blocks in UI · agent source IDs when explaining MT/Hard.

**Spec:** PI Scoring Guidance v0.4 **§5.1b**. Supersedes soft language in DL-174 on
“may use” — citation is **mandatory**, not optional flavor.

---

## 2026-07-31 — DL-174 FatTail Hard thesis: aMCC / willpower (Coach)

**Decision (Coach):** FatTail Hard / Mental Toughness product framing is **capacity
training for persistence and willpower**, associated with the **anterior mid-cingulate
cortex (aMCC)** — sometimes called the “willpower muscle” — described as a brain region
linked to persistence that can strengthen with repeated challenging use (75 Hard–class
protocols, deliberate hardship training as analogy).

**Product consequences:**

- Hard remains **Coach product scope** (DL-173); not a side gimmick.  
- MT meter (when enrolled) scores **behavioral compliance**, not medical imaging.  
- Education copy uses aMCC framing with paraphrase-and-attribute + no guaranteed
  clinical outcomes / no profit claims.  
- Spec: PI Scoring Guidance v0.4 **§5.1a**.  
- Build still needs Privacy/safety/counsel work for photos/health-adjacent data — constraints
  on *how*, not *whether*.

**Amended by:** DL-175 — citing physiology is **required**, not optional.

**Not decided here:** exact MT weight table when enrolled; Track C ship date.

---

## 2026-07-31 — DL-173 FatTail Hard restored — unauthorized de-scope failure

**Failure (owned):** Coach **explicitly included** FatTail Hard / True 75 / Mental
Toughness in Process Integrity Scoring v0.1 and **never removed it**. An external
review (Claude) recommended parking Hard and never feeding the composite. The agent
folding that review into Spec v0.3 / DL-169 **treated that as product law without
Coach disposition and without telling Coach** the feature was being removed from
scope. That is a **colossal process failure**: reverse of doctrine principle 10
(ideas flagged, not discarded) and of Coach final authority.

**Correction (Coach 2026-07-31, this entry):**

| Item | Status |
|------|--------|
| FatTail Hard / True 75 / MT | **Coach product scope — restored** |
| “PARKED / never feeds composite” as *product* decision | **Void** |
| Privacy, consent, counsel, safety reviews | Remain **implementation constraints** — do not authorize deletion |
| MT scoring design | Empty until enrolled; **may enter composite when enrolled**; never zero non-enrollees; never membership gate; never inject MT because PI is weak |
| Spec | v0.4 §1, §5 rewritten · FI-002 `ADOPTED` · FI-010 `RESHAPED` |

**Rule going forward:** No agent or external review may drop or “park forever” a
feature Coach put in a thesis/spec **unless Coach explicitly disposes it and is
notified the same day**. Reviews may **flag risks**; only Coach **removes scope**.

**Apology:** Coach was right to call this. Silence + de-scope is worse than a hard
conversation about constraints.

---

## 2026-07-31 — DL-172 Process Integrity Track A P0 shipped (Option 1 weights)

**Decision:** Implement PI Scoring Spec v0.4 Track A P0 in as-built Journey meters.

| Item | As-built |
|------|----------|
| Model version | `scoring_model_version` = `pi-weights-v1-option1` on `process` |
| Overall | Weighted mean `round(Σ w·raw / Σ w)` — raw already 0–100 |
| Weights | `PROCESS_METER_WEIGHTS` all seven `meter_profile` ids (Option 1) |
| Adherence dual-empty | no trades → empty; trades untagged → raw 0 included |
| Shadow | `overall_raw_equal_mean` during migration |
| Meter field | `weight` per meter; `weights` + `weights_applied` on process |
| Specs | Journey Experience §4.1 amended; PI Spec v0.4 points to code/Journey SOT |
| Tests | `test_journey_scores.py` — weights, arithmetic, dual-empty, API version |

**Code:** `server/journey_scores.py`. **Not in this ship:** Track B/C, self-assessment, journal scanning.

**Cross-ref:** DL-171 Option 1 · Spec v0.4 · FI-001/017/018/019/020.

---

## 2026-07-31 — DL-171 Process Integrity weights: Option 1 rebalance (Coach)

**Decision (Coach):** Process Integrity scoring uses **Option 1 — rebalance**, not
Option 2 rename.

- Keep the name **Process Integrity** for all stages (including Observer trial).  
- **Adherence + retrospective** carry real weight from day one.  
- Establishing/tenure absorb early noise — do not use engagement-majority weights to
  “protect” new members.  
- Canonical tables: Spec **v0.4 §3.6** (trial quality share **45%**).  
- Dual-empty adherence (v0.4 §3.5) remains mandatory so quality weight cannot be
  renormed away by never tagging.

**Rejected:** Renaming observer overall to “Practice engagement” / Labs loop.

**Flags:** FI-017 → `ADOPTED`. FI-001 → `ADOPTED` (weighted overall under Option 1).

**Next for build:** India/Tango on v0.4 Track A P0 → Alpha implement weighted overall +
dual-empty + `scoring_model_version` + Journey Experience Spec amend in same body of
work. Integer tweaks to §3.6 still allowed before Alpha if Coach edits; default **as-is**.

---

## 2026-07-31 — DL-170 PI Scoring Spec v0.4 (design review folded)

**Decision:** Design review of Spec **v0.3** (Claude) accepted as high-quality input
(not a standing gate). Landed in:

- `agents/bench/reviews/2026-07-31-pi-scoring-v03-design-review.md`
- `Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.4.md`
- Flags FI-017…FI-022

**Correctness fixed in v0.4:**

1. Weighted overall formula — drop erroneous `100 ·` when raw is already 0–100  
2. Weight tables for all seven `meter_profile` ids  
3. Dual empty for adherence (untagged trades → raw 0, not renorm-away)

**Coach decision blocking P0 weight GO:** engagement-majority trial score vs true
Process Integrity — **Option 1 rebalance (recommended)** or **Option 2 rename** (§3.0 / Q6).

**Also:** doc EOL into Journey on P0; no waiver language; no self-assessment collect
until Track B; no journal-body distress scan; checkable floor-support/graduation
proposals; mandatory model version + shadow migration.

**India/Tango:** still own formal gates independently when Coach requests them.

---

## 2026-07-31 — DL-169 PI Scoring Spec v0.3 (Claude review folded)

**Decision:** External review of Process Integrity Scoring **v0.1** (Claude) is accepted
as high-quality. Folded into:

- Review artifact: `agents/bench/reviews/2026-07-31-pi-scoring-v01-external-review.md`
- Spec: `Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.3.md` (supersedes v0.2)
- Flags FI-008…FI-016

**Build disposition:**

| Track | GO |
|-------|-----|
| **A Scoring** (deterministic meters/weights) | Eligible after Coach GO + Journey amend + tests |
| **B Analyst + chat** | BLOCKED — phase route + scoped agent credentials |
| **C FatTail Hard / True 75** | PARKED — counsel + DPIA; **default never feeds PI composite** |

**Accepted blocks from external review:** no self-SSOT; agent must not mutate profiles;
Hard health/photo/trademark out of scoring doc; floor-support not hardship-on-fragility;
conversion firewall on weights; `meter_profile` derived only; paraphrase-only excerpts;
no Monday multi-track launch; gradeable math + characterization tests.

**Already fixed before Claude (kept):** MT inverted gate rejected; equal-mean honesty;
Live EWMA; private PI vs contribution board.

**Not build GO yet:** v0.3 remains DRAFT until Coach Phase-5 per track.

---

## 2026-07-31 — DL-168 The bench strengthens with every invocation

**Decision (Coach intent):** The Agent Bench’s primary process law is **compounding
strength**, not merely “don’t discard ideas.”

**Doctrine principle 10 (restated):** Every substantive invocation must leave the
ensemble stronger — at least one durable delta (truth, memory, skill, doctrine, or
capacity learning). Conversation-only residue is incomplete work.

**Supporting mechanics (not the goal):**

- Ideas that cannot ship as written → **flag + discuss** (ADOPTED / DEFERRED / PARKED /
  RESHAPED) via `Architecture/flagged-ideas.md`
- Review verdicts require **§ Bench delta** (+ flags when relevant)
- First-principles law 8: Leave the Bench Stronger
- India / Tango / templates: completion includes bench delta

**Unchanged:** Guardians still block unsafe **build**. Strengthening does not mean
shipping unsafe design; it means the *next* invocation is smarter for having run this one.

**Rationale:** The bench exists to compound mastery. Renting intelligence for one
session and forgetting is failure — even when the immediate packet “passes.”

---

## 2026-07-31 — DL-167 Process Integrity Scoring & Guidance Spec v0.2 (draft)

**Decision:** Coach draft “Trader Process Integrity Scoring & Guidance System v0.1”
is **reviewed and superseded** by design-authority draft:

`Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.2.md`

**Review outcomes folded into v0.2:**

| Keep | Change / reject |
|------|-----------------|
| Process-only; no P&L | Drop “v1.0 / Monday full system” build claim |
| Six Journey dimensions + Live EWMA | Anchor to **as-built** meters/tenure/empty |
| Profile-shaped weights (target) | Equal mean remains interim until P0 weights ship |
| Analyst + self-assessment + Hard (phased) | MT **empty until enrolled** — reject v0.1 “inject MT when PI weak” |
| Research grounding | Soft self-assessment (skip OK); Hard never membership gate |
| | Profiles = as-built set (monthly/annual nav, alumni, free) |
| | P0–P3 delivery; Monday = P0 weights only if anything |

**Not build GO:** v0.2 is DRAFT design authority. P0 (weighted overall + transparency)
needs explicit Coach GO + Journey Spec bump in same work. Hard / agent = P2.

**Cross-ref:** DL-165/166 (Live), Journey Experience §4, Gamification §3.3, Privacy v0.1.

---

## 2026-07-31 — DL-166 Live presence meter: weekly EWMA (near-term heavier)

**Decision:** Process Integrity **Live presence** is an **EWMA of weekly check-in
presence** (binary 1/0 per Eastern ISO week), not streak-only and not a flat
streak/coverage blend.

```
α = 1 − 0.5^(1/half_life)   # half_life = 4 weeks
s_t = α · x_t + (1−α) · s_{t−1}   # oldest → newest over live_horizon_weeks
raw% = round(100 · s_final)
```

Grace: incomplete current week with no check-in is omitted (same spirit as streak).

**Rationale (Coach):** Reward consistency; punish lack of consistency; weight
**near-term** consistency heavier than long-term — exponential decay of older
weeks. Recent slack dings harder than an equal-length drought further back;
comeback streaks recover faster than a flat multi-month average but still sit
below continuous presence. Leaderboard / contribution remains streak-only (§3.4).

**Supersedes:** DL-165 blend formula (same day). Horizons unchanged (trial 6 /
monthly 16 / annual 20 / …).

**As-built:** `live_presence_ewma` · `live_week_presence_series` ·
`LIVE_HALF_LIFE_WEEKS=4`. Detail: `{pct}% EWMA · {streak}w streak ·
{active}/{horizon} weeks present`. Specs + `test_journey_scores` (near-term vs
faded drought, alternating vs consecutive).

---

## 2026-07-31 — DL-165 Live presence meter: streak + coverage blend

**Decision:** Process Integrity **Live presence** is no longer streak-only.
Formula (personal process meter only):

```
streak_pct   = min(streak, live_streak_cap) / live_streak_cap
coverage_pct = active_weeks / live_horizon_weeks   # empty weeks ding
raw          = 0.5 * streak_pct + 0.5 * coverage_pct
```

**Rationale:** A 10-week check-in streak after slacking the prior couple of months
must not read as full Live integrity — coverage over a multi-month horizon pulls
the score down. Leaderboard / contribution still uses attendance streak alone
(Journey Gamification Spec §3.3–3.4).

**Profile horizons:** Observer trial 6w · Navigator monthly 16w · annual 20w ·
Activator 16w · Alumni 12w · Free 8w. Caps unchanged.

**As-built:** `journey_scores.live_presence_percent` · meter detail
`{streak}w streak · {active}/{horizon} weeks present`. Specs: Journey Experience
§4.1 live · Gamification §3.3. Tests: drought vs pure-streak cases in
`test_journey_scores.py`.

**Superseded by:** DL-166 (EWMA; same day).

---

## 2026-07-30 — DL-164 Journal Retrospective v0.7.1 PROGRAM COMPLETE

**Decision:** Agent-bench program `agents/p-retrospective-v07/` is **COMPLETE** (RT07-9-G
**PASS**). Ceremony frame as-built through R1–R9:

| Phase | As-built |
|-------|----------|
| R1 | mig **055** cadence + columns; routine day = member message NY |
| R2 | Nine fixed-order ceremony steps (anti-wizard) |
| R3 | `period_indicator` (period only; rolling not co-framed) |
| R4 | `emotion_mirror` + lexicon→step map |
| R5 | clustering · trends (floor 4) · process correlation (no P&L) |
| R6 | interruption notice + forward-only cadence stamp/history |
| R7 | mig **056** in-app material notifications (once/period; RTH suppress) |
| R8 | mig **057** sequence agent + prompt stamp; code guardrails |
| R9 | Practice Export Spec **v1.3**; export/purge for new Family B surfaces |

**Export:** `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.3.md` — retrospective
model_version **1.1**, notifications + cadence_history; purge keeps
`identities.retro_cadence_days` setting.

**Evidence:** pytest suite (retrospectives · habits · agent sequence · notify · export ·
journey · journal sessions) **165 passed** (2026-07-30).

**Board:** `agents/p-retrospective-v07/` — **PROGRAM COMPLETE**.

**Deferred (unchanged §20):** optimal-window mechanism; email Family B payload until Mike
approves; external LLM for sequence agent; first-class open-position model.

---

## 2026-07-30 — DL-163 Journal Retrospective Spec v0.7.1 BUILD AUTHORITY (Coach GO)

**Decision:** Journal Retrospective **v0.7.1** is BUILD AUTHORITY. Product frame: ceremony
that is walked (anti-wizard fixed-order sections), not a scrollable report. Cadence is a
trader setting (forward-only history). Indicator uses Journey meters only — period-scoped
in ceremony, rolling in Journey, never one frame. Routine day = member message local day
(amends Journal Session / Journey dual-read). Keep rate member-facing fact only, paired
with specificity for product eval. Notification in-app first. Board
`agents/p-retrospective-v07/`. v0.6 remains as-built for shipped APIs until R-phases land.

**Locks (§20):** 1 interim rules SoR · 2 two contexts · 3 one retro · 5 period adherence ·
9 routine day · 10 keep-rate fact · 11 in-app notify first.

**R1 landed same day:** mig **055** (`retro_cadence_days`, cadence history, retro columns);
`list_member_message_ny_dates` / routine dual-read; create stamps period_index /
cadence_days_at_period / interrupted.

**Plan:** `docs/Journal-Retrospective-v0.7.1-Full-Agent-Bench-Plan.md`

---

## 2026-07-30 — DL-162 Journal Session v0.6 residual program close

**Decision:** Residual agent-bench program for Journal Session **v0.6** is **COMPLETE**
(JS6-9-G PASS). Closed: agent guardrail corpus + RTH member-first tests (J2); admin
prompt version API + `/admin/journal-prompts` UI with session stamp (J3); formal surface
gate bundle; retro closure-preview warning evidence (J7); scope-true closure suite (J8);
Practice Export Spec **v1.2** for one-session/date · tags · attachments (J9).

**Plan:** `docs/Journal-Session-v0.6-Residual-Agent-Bench-Plan.md`  
**Board:** `agents/p-journal-session-v06/` — PROGRAM COMPLETE.

**Non-blocking residuals:** live LLM CI optional; Trade Log SoR R2R field later.

---

## 2026-07-30 — DL-161 Journal Session Spec v0.6 BUILD AUTHORITY (implement GO)

**Decision:** Journal Session **v0.6** is BUILD AUTHORITY. One conversation per
`(identity_id, journal_date)` (mig **054** merge + UNIQUE); get-or-create API; chatbot
surface with fixed-height thread, visible timestamps, header media (drop/click/lightbox
caption), Week member-message band dots with deep-link scroll, calendar cell navigation
(no Open panel), trades strip width/R:R/entry-exit (process framing), Tag Manager
assign-only. Board `agents/p-journal-session-v06/`. Supersedes v0.5 multi-entry product
frame. Tag Manager prerequisite remains COMPLETE (DL-159).

**Evidence / as-built:** domain get-or-create; `SessionMediaHeader`; `week-activity` API;
`JournalCalendar` nav; export model_version 1.1 attachments; prompt_version_id stamp;
collision table for dual structured merges.

**Locks (interim):** agent display name "Journal"; client structural R:R until Trade Log
SoR; band midpoint AM/PM + later_day→CL.

**Program remaining:** formal Delta gates JS6-2-G…JS6-9-G; admin prompt edit UI; full
guardrail corpus; retro warning polish; export Spec bump formal.

---

## 2026-07-29 — Catalog manual order + sections (Catalog-Order v1.0)

**Decision:** Course catalog order is editorial, not computed: `courses.sort_order`
(migration 038, default sort) + `courses.catalog_section` display grouping (section
order derived from lowest member sort_order — no second table). Reorder via
`POST /api/admin/courses/reorder` (full id list, x10 rewrite) with B4 stepper UX on
the catalog cards; section assigned in the card editor. Filters/explicit sorts render
flat (headings would mislead). Fix landed same-day: admin course list now returns
`id`/`sort_order`/`catalog_section` and follows manual order (the missing `id` made
the steppers silently no-op for admins).

**Spec:** `Specs/FatTail-Labs-Catalog-Order-Spec-v1.0.md` (DRAFT — Coach approval pending).

## 2026-07-28 — DL-065 Admin Users section + activity analytics

**Decision:** New `/admin/users` section shows every identity (keyed by email)
with login history, membership, and engagement. Adds migration `039`
(`login_events`, `page_views`), `server/activity.py` (best-effort write helpers +
gap-based `estimate_sessions`), `routes/pageview.py` (member page-view ingest),
`routes/users_admin.py` (roster list/detail/CSV, admin-only), a login hook in
`_session_response`, and a client `PageViewTracker` mounted in `AppChrome`.

**Rationale / scope:** Auth was stateless with no login record and no telemetry.
Login logging is captured at the single session choke-point; page views only for
authenticated members on non-`/admin` routes (anonymous + admin navigation are
never recorded). Analytics writes are best-effort and **never** block login or
navigation. Membership/"how they logged in" reuse existing `memberships` /
`identity_links` (SSO already syncs fattail.ai / 0-dte). "Time on platform" is an
**estimate** from page-view sessionisation (30-min gap), single-view sessions = 0
(no heartbeats, no guessing). Engagement metadata only — member private content
stays under the Member-Data-Privacy spec. Spec:
`FatTail-Labs-User-Activity-Analytics-Spec-v1.0`. Tests: `test_user_activity.py`.
Open: consent/disclosure line + `page_views` retention (flagged to Coach).

---

## 2026-07-29 — Practice harden H0–H3 institutional close

**Decision:** p-practice-harden phases **H0–H2 PASS**; **H3** documents as-built truth.

| Topic | Record |
|-------|--------|
| Identity | `_storage_identity_id` fallback for session id `0` only when `LABS_ENV=dev`; else 401 |
| List legs | Batch load; not N+1 |
| Domain | `server/trade_log_domain/` single source for match / open-on-day / estimated PnL / series |
| API | `analytics/day-book`, `analytics/days-interest`, `analytics/reports-book` |
| Client | No dual TS domain; `web/lib/tradeLogApi.ts` shared client |
| Routes package | `server/routes/trade_log/{common,accounts,trades,analytics,io}.py` |
| Spec honesty | Trade Log Spec §15 as-built; Journal-Retrospective P0 shell honesty |
| Ops vs product | `agents/p-practice-harden/OPS-VS-PRODUCT.md` |
| Migrations | Practice suite / trade log already on `040`/`041` era; no new H0–H2 migrations |

**Non-goals locked:** live brokers; Retrospective content; productizing ops xlsx/seeds;
H4 virtualization only after Coach GO.

**Evidence:** `agents/p-practice-harden/gate-reports/H{0,1,2}-delta-gate.md` · H3 Spec/docs.

## 2026-07-29 — Practice domain single-source shipped (H1 PASS)

**Decision:** H1 of p-practice-harden **PASS**. Authoritative domain is
`server/trade_log_domain/`. Read models:

- `GET /api/me/trade-log/analytics/day-book`
- `GET /api/me/trade-log/analytics/days-interest`
- `GET /api/me/trade-log/analytics/reports-book`

Reports and Journal consume these APIs; client dual match/PnL algorithms removed.
`seed_reports_demo_pnl` uses the same domain. Behavior freeze: ported client formulas.

**Evidence:** `agents/p-practice-harden/gate-reports/H1-delta-gate.md` · pytest 20 passed
(domain + analytics + trade_log).

## 2026-07-29 — Practice domain single-source design (PH1-0)

**Decision:** Position matching, open-on-day, synthetic realized PnL, and Reports
equity/DD series move to server package `server/trade_log_domain/` with pure
functions. Clients consume read models:

- `GET /api/me/trade-log/analytics/day-book`
- `GET /api/me/trade-log/analytics/reports-book`

**Behavior freeze:** port current `journalDayBook` / `reportsBook` formulas 1:1 —
no intentional metric change. Starting capital stays client preference (query
param). Spec `records/*` may alias later; as-built analytics paths are primary
until Spec honesty (H3). Design: `Architecture/11-practice-domain-single-source.md`.

## 2026-07-29 — Practice stack hardening board (p-practice-harden)

**Decision:** Architectural hardening of the Practice suite is run as Agent Bench
project `agents/p-practice-harden/`: phased H0–H4, **mandatory multi-agent
collaboration** (Primary + required Reviewers + Delta gate per phase). Goals:
isolation fail-loud, kill N+1 list, single-source position/PnL, module splits,
Spec/as-built truth — without behavior change unless Coach-labeled usability wins.
H0 **PASS** (identity gate + batch legs + useful-only tests).

**Board:** `ORCHESTRATOR.md` · **Charter:** `CHARTER.md` · Seeds start at PH0-*.

## 2026-07-29 — Retrospective first-class Practice nav + shell

**Decision:** **Retrospective** is a first-class Practice suite player between
**Journal** and **Playbook** (`/app/retrospective`). Spec updated:
`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.1.md` (§3.1–3.3). Retrospectives
**filter up into Journey** as process milestones (read model; later slices).
Slice **P0** ships nav + page shell only — no week roll-up/agent yet.

**Nav order:** Trade Log · Reports · Journal · **Retrospective** · Playbook.

## 2026-07-28 — Practice home = Reports (equity + drawdown)

**Decision:** Navigating to **Practice** opens **Reports** (`/app/practice` →
`/app/reports`). Layout: suite nav (Trade Log · Reports · Journal · Playbook);
**equity curve** primary; **drawdown** directly under; **stat blocks**; then
**outcome + strategy distribution** charts. Multi-account via pager (All + each
active account). Curves computed client-side from Trade Log fills until
`records/summary|series` API lands. Framing remains process-first (path health,
not profit theater).

## 2026-07-28 — Practice suite: Reports + shared nav + Journal calendar

**Decision:** Product name for process totals/charts is **Reports** (not
Statistics, not Records). Shared Practice suite chrome:
**Trade Log · Reports · Journal · Playbook** (`PracticeSuiteNav` on every suite
route). Top-level Apps grid nests all four under **Practice** (`/app/practice`).
Legacy `/app/statistics` and `/app/records` redirect to `/app/reports`.

**Journal:** calendar-first shell (month tiles, view segment, day panel) —
kinship with Live calendar; entry CRUD awaits Journal Spec. Journal app status
`live` for the shell. Migration `041_practice_suite_reports.sql` renames
`statistics` → `reports` in `apps`.

**Rationale:** Coach mockup + coupling of the four tools; FatTail App process
sidebar already says Reports. API path `records/summary|series` may stay until
Reports build renames endpoints.

## 2026-07-28 — Echo agency upgrade: HIG + interactive design authority

**Decision:** Expand **Echo** from thin “look & feel / polish” owner to full
**Human Interface & Interaction Designer**: Apple HIG for Labs web, design tokens,
control grammar, toolbar/header recipes, and blocking review on visual +
interactive changes. Charter: `agents/bench/echo.md`. Constitution remains
`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`.

**Locked split:** Echo designs/reviews; Charlie implements. Domain work surfaces
may keep domain skins (e.g. ToS blotter **table body** only); Labs **shell,
headers, buttons, sheets, dialogs** stay HIG — never broker-skinned chrome.
Default tool-header recipe: ≤1 primary CTA per region; secondary/plain; overflow
Menu when crowded; no equal-weight pill farms.

**Rationale:** Trade Log header shipped as ad-hoc outline pills without Echo
depth — symptom of under-specified agency, not missing product taste. Coach
directed HIG mastery + strong interactive principles into Echo so design work
routes through the bench correctly.

## 2026-07-28 — Trade Log v1.1 Spec + Agent Bench (p-trade-log)

**Decision:** Land `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` (DRAFT) defining the
options-first ToS-style Trade Log: table-never-leave shell, right slide-out,
multi-leg strategies, accounts with required **broker or sim** (≤10 active),
canonical `fattail.labs.trade_log` + adapters, and integration contracts for
**Journal** (link field + shared process vocabulary) and **Records**
(formerly “Statistics”: multi-account **totals and charts** via
`records/summary` + `records/series` read models). Implementation is **Agent
Bench only** via `agents/p-trade-log/` (seeds TL0–TL6). Supersedes MVP form-first
shape for product direction; production may keep MVP until build approval and ship.

**Rationale:** Coach design direction (2026-07-28); doctrine T-D5 process-first;
Family B isolation; Practice stack compatibility without merging stores in v1.1.
**Records** is the aggregation surface across broker/sim accounts; Trade Log
remains the blotter.

## 2026-07-28 — DL-064 ActiveCampaign lead sync (free waitlist leads only)

**Decision:** Free waitlist signups (`feature_gate_emails`) are pushed to the
shared FatTail/0-DTE ActiveCampaign account as contacts tagged **`Labs Lead`**.
New optional module `server/activecampaign.py` (`sync_lead()`), called from
`join_waitlist` **after** the email is committed; migration `038` adds
`ac_status`/`ac_error`/`ac_synced_at` for observability.

**Rationale / scope:** Marketing needs a live, taggable pre-launch lead audience
without manual CSV export. Modelled on `notify.py` SMTP: env-driven
(`LABS_AC_*`), disabled when unconfigured (`skipped`), fail-loud when
half-configured or `LABS_AC_REQUIRED=1`, and **never** allowed to fail the
waitlist write (best-effort, post-commit, wrapped). **Customers are out of
scope** — buyers enter via WooCommerce and are already tagged by the WordPress
`membership-auto-upgrade` plugin in the same AC account; Labs does not
double-plumb them. Stripe not integrated with AC. Spec:
`FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0`. Tests:
`test_activecampaign.py`. Status: draft pending live staging smoke.

---

## 2026-07-28 — Feature gates (countdown / waitlist) admin-only

**Decision:** Feature gates hide public surfaces until ready and create anticipation
via countdown + optional email waitlist. **Admin UI only** at `/admin/gates` (card
on operator cockpit). Data: `feature_gates` + `feature_gate_emails` (migration 037).
Public: `GET /api/feature-gates/{surface}`, `POST …/waitlist`. Email CSV export for
mail management. Surfaces seeded: home (enabled for Labs launch), hub, app,
resource, live, wiki (disabled until adopted). Env launch vars are superseded for
home by DB when gate is active.

## 2026-07-28 — Member Wiki W1: two-store split + spine shipped (p-wiki)

**Decision (WIK-D1):** Wiki content system-of-record is the `dudefromearth/lab-wiki`
git checkout (`LABS_WIKI_ROOT`, boot fail-loud); MySQL holds a rebuildable derived
index only (migration 035: `wiki_pages_idx` FULLTEXT + `wiki_links_idx`).
**Decision (WIK-D2):** member visibility = `status: published` frontmatter; drafts
404 for members, render for admins. **WIK-D3:** search v1 = FULLTEXT over pages;
transcripts join in parent-spec W2. **WIK-D5:** card slug `wiki` replaced Vexy
(034). **WIK-D6:** `[[wikilinks]]`; unresolved render muted, never 500. **WIK-D7:**
reindex = idempotent full rebuild (`POST /api/admin/wiki/reindex`, human admin or
agent key w/ `wiki:reindex`).
**Shipped:** `server/wiki_store.py` + `routes/wiki.py` + tests; frontend surfaces
wired (`/app/wiki`, `[slug]`, `search`, `graph`, ⌘K); sync tick documented
(`infra/deploy.md`, `infra/labwiki-sync.plist`). Evidence:
`agents/p-wiki/gate-reports/W1-delta-gate.md`. As-built:
`Architecture/11-wiki-design.md`. Specs: Member-Wiki v0.1 + Wiki-Interface v0.1
(DRAFT — Coach approval pending; W0 gate).

**Related:** deferred to parent phases: corpus/transcripts (W2), compiler+board
(W3), practice rail (W4, Mike gate).

## 2026-07-28 — Apps hub: Practice Log section + Strategy Life Cycle

**Decision:** `/app` organizes tools into sections, not a flat grid: **Journey** ·
**Practice Log** (Trade Log + Journal cards) · **Strategy Life Cycle** (Strategy
Lab, `slug=strategy-lab`, soon) · **Playbook** · **Insights** (Statistics + Wiki).
Section map is UI IA in `web/app/app/page.tsx`; migration `036` seeds Strategy Lab
and refreshes Practice Log blurbs. Full Practice Log merge (`/app/practice` modes)
and Strategy Lab product ship in later waves — hub presents the organization now.

**Related:** `docs/Apps-Practice-Stack-and-Strategy-Life-Cycle-Proposal.md`.

## 2026-07-28 — Apps hub: flat 2-col + Practice Log parent card

**Decision:** Revert disheveled multi-section layout. `/app` is again a **flat
two-column card grid**. **Practice Log** is a **single card** → `/app/practice`
hub, which shows **Trade Log** and **Journal** as child cards (2-col). Strategy
Life Cycle remains its own top-level card (`strategy-lab`, soon). Nested
`trade-log` / `journal` are omitted from the top-level grid.

## 2026-07-28 — Strategy Life Cycle landing organization

**Decision:** `/app/strategy-lab` is an **orientation landing** (open while tool
is soon), organized as: (1) hero + kill rule, (2) **The path** — Build / Prove /
Paper / Run as primary IA (2×2 stage cards + under-the-covers line each),
(3) **two entry paths** (validate existing vs develop new), (4) connected tools
(Practice Log, Playbook, Journey), (5) courseware promise (process assessment
only). Workspace/kanban ships later; landing is the map for members and
courseware deep-links.

## 2026-07-28 — Strategy Life Cycle hub: 2-col cards + courseware backlog

**Decision:** Strategy Lab page uses **section headers + two-column card grids**
throughout (The path, How you enter, The one rule, Connected tools, Courseware).
**Courseware** is a **hub of backlog course cards** (code, overview, “students
will learn”) — not published catalog links yet; titles feed course development
backlog. Process-only assessment language retained.

## 2026-07-28 — Wiki card replaces Vexy on Apps grid

**Decision:** The sixth `/app` card is **Wiki** (`slug=wiki`), not Vexy. Open →
`/app/wiki`. Badge remains `soon` until Member Wiki W1; entry/search/graph routes
are scaffolded per Wiki Interface Spec v0.1 §1–2, §4–5.

**Rationale:** Specs `FatTail-Labs-Member-Wiki-Spec-v0.1` + `Wiki-Interface-Spec-v0.1`
(D-i4: retire Vexy row; Ask-mode absorbs the cognitive-partner role in v2). Migration
`034_wiki_replaces_vexy_app.sql`.

**Not yet:** corpus registrar, transcripts, lab-wiki checkout, FULLTEXT search, graph
data — those track the parent wiki phasing.

## 2026-07-26 — Every named entity: stable id + name-derived slug (for versioning)

Each **course**, **module**, **lesson**, **resource**, and **app** always has:
- **`id`** — permanent unique primary key (bigint). Never changes on rename.
- **`title`** — display name.
- **`slug`** — URL segment derived from title (unique in its scope). Changes with rename.

**Rationale: versioning.** Version rows, pins, and history hang on the stable **id**,
not the slug. Renaming must not orphan prior versions or break references. Public URLs
stay human-readable names; identity and version lineage stay on id. Resources already
version via `resource_versions` → `resource_id`. Course/module/lesson/app content
versions attach the same way when introduced.

Public and admin APIs return `id` + `slug` + `title` together. Mutations that need a
stable target use `id` (e.g. `PUT /api/admin/lessons/{id}`); public routes use the
name path `/course/{course}/{module}/{lesson}` and `/app/{app}` resolved to the
underlying ids. Apps live in table `apps` (migration 033); catalog is
`GET /api/apps`.

## 2026-07-26 — Title and public slug stay in lockstep

Whenever an admin renames a **course**, **lesson**, or **resource**, the server
rewrites the public slug from the new title. Responses return the new `slug`; the
web editor navigates when a course slug changes so the address bar matches the name.
**All public URLs must be unique as full paths.** Lesson path is
`/course/{course}/{module}/{lesson}` — uniqueness is the **combination**. Lesson slugs
need only be unique **within a module** (same lesson name OK in two modules of one course).
Module slugs unique within a course; course slugs site-wide under `/course/…`; resources
under `/resource/…`. Rename collisions return **409 NAME_CONFLICT** (no silent `-2`);
the editor keeps the field open with a red halo. Create defaults may still allocate
`-2`/`-3` for default titles.

## 2026-07-26 — Public SEO namespaces: singular content roots

Public URLs use singular category roots for clean SEO hierarchy:

| Namespace | Shape | Notes |
|-----------|--------|--------|
| Courses | `/course`, `/course/{course}`, `/course/{course}/{lesson}` | Lesson path drops the old `/lessons/` segment |
| Campaigns | `/campaign`, `/campaign/{name}` | Catalog + reserved detail (content TBD) |
| Resources | `/resource`, `/resource/{name}` | Library + first-class resource pages |
| Apps (Labs tab) | `/app`, `/app/{name}` | Journey, Trade Log, future Journal/Playbook |

Rationale: two primary content families (courses, campaigns) plus resources and member apps
need distinct, short, crawlable namespaces. No legacy redirects — public URLs were not
established yet; these are the first canonical shapes. Backend API paths stay plural under
`/api/courses`, `/api/resources` (API contract, not SEO).

Helpers: `web/lib/paths.ts`.

## 2026-07-20 — Product model benchmarked on AI Labs by First Movers

Live teardown of labs.firstmovers.ai (custom Next.js + Stripe, no LMS platform). Adopted:
public `/courses` catalog as entry point, public course detail pages with gated lessons,
explicit per-course enrollment inside all-access membership, module/lesson accordion,
reviews, per-course discussion, live sessions folded back into the library as replays.
Full teardown in `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` §2.

## 2026-07-20 — Positioning: "stop the bleeding"

Capital preservation is the first step to trading success and for many the only one.
Funnel strategy: sell the dream, sequence the discipline — pathway routes everyone through
the stop-the-bleeding flagship first. Marketing uses process outcomes, never profit claims.

## 2026-07-21 — Standalone repo; no shared code with MarketSwarm-Canonical

Only reason to share the repo would be reusing MSC code, which is not a requirement.
Anything needed from MarketSwarm is consumed via API (Vexy gateway :3003; MSC App API
later). Kills drift risk, frees the stack choice.

## 2026-07-21 — Stack: FastAPI + MySQL + Next.js

FastAPI backend (`server/`), own MySQL `labs` database, own filename-ordered migration
runner. Next.js frontend (`web/`): public pages statically generated at publish time
(Course JSON-LD, unique titles — spec §5.6); member routes client-rendered behind auth.
No dev servers outside dev.

## 2026-07-21 — Hosting: MiniTwo is the sole Labs production host

labs.fattail.ai → MiniTwo (M2 Mac Mini), supervised by launchd (not MSC Node Admin).
Staging labs-stage.fattail.ai → DudeTwo. MiniThree nginx routes both; Cloudflare proxied
A records → shared public IP. Rationale: blast-radius separation from the trading app
(DudeOne), whose peak-reliability hours coincide with Labs traffic peaks. Build proceeds
fully on the internal network; DNS/cert/vhost is a launch-day step.

## 2026-07-21 — Labs is the first native fattail.ai property

flyonthewall.ai was retired (trademark); the FatTail App remains on flyonthewall.io until
its own migration. Labs establishes the fattail.ai zone (origin cert, Cloudflare config,
vhost pattern) that the app migration will inherit. Session cookie domain `.fattail.ai`
from day one so future app migration shares SSO sessions.

## 2026-07-21 — Auth: dual WordPress SSO; WooCommerce is the access-control entry point

Issuers `fattail` (fattail.ai WP) + `0-dte` (0-dte.com WP), same architecture as the
FatTail App's SSO. `(issuer, wp_user_id)` compound identity, universal identity_id,
cumulative roles observer < activator < navigator < administrator. Entitlement mapping
(WooCommerce plan slug → role, per issuer) is config — MSC's blanket 0-dte coaching bypass
does NOT auto-apply. Selling/cancelling/refunds happen only in WordPress; webhooks sync.

## 2026-07-21 — Admin is custom and in-app

`/admin` (role: administrator) owns all course authoring. WordPress has no role in course
content. LearnDash is fully replaced: WP keeps commerce + identity only.

## 2026-07-21 — Repo layout mirrors MarketSwarm-Canonical

`Specs/` (versioned, immutable once approved), `Architecture/` (durable docs + this log),
`infra/` (deploy playbooks). Same muscle memory across both repos.

## 2026-07-21 — Lesson video: YouTube embeds with per-lesson player parameters

Lessons carry `video_provider` + `video_id` + `video_params` (JSON). The API validates
params against an allowlist (autoplay, controls, start, end, mute, loop, rel,
cc_load_policy, fs, hl, playsinline) and builds the embed URL server-side
(youtube-nocookie.com, rel=0 + playsinline baseline); the client never assembles player
URLs. Free-preview lessons are publicly playable; gated lessons 401 until the member
path. **Accepted tradeoff:** spec §7.4 rejected YouTube for gated content (unlisted links
are leakable); Coach chose YouTube for launch speed — signed-CDN migration (Bunny/Mux)
remains the recorded path if/when leakage matters. Placeholder video: Big Buck Bunny
(Blender Foundation official upload).

## 2026-07-21 — Admin is edit-in-place on the production interface

No separate admin panel: administrators see a floating ✎ Edit button on the production
course page; activating it opens the editor over the same page (course fields + per-lesson
title/YouTube video/start/end/free-preview). Saves hit `/api/admin/*` (role-gated
server-side), then `/api/revalidate` regenerates the static page in place — publish IS
the prerender. Course pages use `dynamicParams=true` so revalidation can regenerate
(dynamicParams=false 404s after cache purge — NoFallbackError). Browser API calls ride a
same-origin Next rewrite proxy (`/api/*` → Labs API) so the session cookie flows without
CORS. Dev-only `/api/auth/dev-login` (404 outside LABS_ENV=dev) issues an administrator
session until WordPress SSO lands; staging/production sessions come only from SSO.

## 2026-07-21 — Catalog covers every category; real channel videos as examples

One published course per category (9 categories: 0-DTE, Butterflies, Convexity, Fat-Tail
Doctrine, Risk & Sizing, Journaling & Routine, MarketSwarm Platform, Options Foundations,
Psychology) + the flagship + the draft-invisibility fixture. All video lessons use real
uploads from youtube.com/@0DTE with accurate durations; first lesson of every course is
a free preview. Live Replays category deferred until the replay pipeline exists.

## 2026-07-21 — Builds always clear the Next fetch cache (stale-prerender defect)

Defect: Next.js persists fetch responses across builds (`.next/cache/fetch-cache`); a
rebuild after reseeding baked the OLD catalog (2 courses instead of 10) into the static
pages. Fix: `prebuild` script removes `fetch-cache` before every `next build`, so
prerender always reflects current database state. Runtime admin edits are unaffected
(revalidatePath purges correctly); this only bit build-time data freshness.

## 2026-07-21 — Identity & access: Labs-native model, providers pluggable

Coach directive: Labs owns its own identity/roles/subscriptions/memberships model and
must work standalone; WordPress + WooCommerce demoted from foundation to pluggable
provider. Spec: FatTail-Labs-Identity-Access-Spec-v1.0 (supersedes parent §7.2–7.3's
WP-first model; the dual-issuer JWT mechanics survive inside the WordPress provider).
Core: Identity (email = universal key) / IdentityLink / Credential (stdlib scrypt) /
Plan / Membership / ProviderPlanMap (migration 003). One role algorithm for all paths:
role_override else best active-membership plan else observer. Native login + operator
CLI; SSO callback + HMAC membership webhooks per provider; login page renders SSO
buttons only for configured providers. LABS_ENTITLEMENTS env removed — entitlement
mapping is now data. Verified: native admin/member/observer logins, wrong-password 401,
simulated WP SSO grant → activator, forged-webhook 401, signed cancellation → observer
on next login, same identity across provider logins.

## 2026-07-21 — Global site header: Join CTA / membership avatar on every page

Sticky header mounted in the root layout (all pages): brand → /courses, Courses nav.
Right side is auth-state-driven via /api/auth/me after hydration (static pages ship the
neutral shell): logged out → "Sign In" + "Join FatTail Labs" CTA; logged in → initials
avatar (emerald = activator+, gray = observer) opening a menu with name, role label
(Free account / Member / Coaching member / Admin), Dashboard, Become-a-member upsell
for observers, Sign out. Belongs in parent spec v1.1's shell section when that version
is cut.

## 2026-07-21 — Header amendment: logged-out avatar slot IS the sign-in button

Refines the header entry above: no "Sign In" text link — the avatar position renders a
gray person-silhouette circle linking to /login when logged out, keeping the avatar slot
constant across auth states (silhouette → your initials on sign-in).

## 2026-07-21 — Header final form: Log In + Sign Up buttons ⇄ avatar

Supersedes the two header entries above. Logged out: "Log In" (outline) + "Sign Up"
(emerald) buttons. Logged in: both replaced by the initials avatar (emerald activator+,
gray observer) whose dropdown holds user info (name, role label) and actions (Dashboard,
Become-a-member for observers, Sign out).

## 2026-07-21 — Signup is live; previews require an account; members get playback

Spec: FatTail-Labs-Enrollment-Access-Spec-v1.0 (supersedes YouTube spec §5 public
previews). Self-serve registration (POST /api/auth/register: free observer account,
session issued, 409 on existing email — no password attach to SSO identities). Lesson
access matrix: anonymous → 401 everywhere (the preview is the reward for signing up);
observer → previews 200, gated 403; activator+ → member playback of gated lessons
(activated now that roles are real). Player renders distinct prompts: 401 → "Create a
free account to watch"; 403 → "Become a Member". All lesson rows link to the player —
the lesson endpoint is the sole access authority. Accepted debt: no email verification
yet (must land before production launch).

## 2026-07-21 — Catalog cards adopt the Udemy model (banner card + hover info panel)

Coach directive with Udemy reference. Compact card: banner (hero image when set;
otherwise deterministic per-category gradient art with category label + title), title,
instructor, rating stars + review count (or NEW / "Not yet rated"), meta line
(total duration · level · lesson count). Hover (desktop only, lg+) raises an expansive
panel beside the card — title, NEW/Certification badges, "Updated <Month Year>", meta,
subtitle, up to 3 ✓ outcome bullets parsed from the description's outcome list, View
Course CTA; panel flips to the left for last-column cards. API list payload gained
total_duration_seconds + review_count. Touch devices tap straight through to the course
page. Belongs in parent spec v1.1 §5.1 when cut.

## 2026-07-21 — Progress tracking shipped (watch position, auto-complete, dashboard)

Spec: FatTail-Labs-Progress-Tracking-Spec-v1.0 (implements parent §9's progress half;
certificates deferred to their own spec). Endpoints: POST /api/progress (delta clamped
≤60s, auto-complete at ≥90% cumulative watch for videos), POST /api/progress/complete
(manual/non-video), GET /api/me/progress?course=, GET /api/me/continue (percent over
standard-module lessons only; resume = latest-touched incomplete). Player wraps the
served iframe with the YouTube IFrame API (enablejsapi now in base embed params):
resume-seek >10s, 5s sampling, 15s reporting + pause/end/leave flushes; Mark-complete
button; prev/next lesson nav. Course Modules tab shows ✓ ticks; dashboard Continue
Learning renders progress bars + resume deep links. Verified live end-to-end incl. real
playback auto-reporting (28s position captured with no manual action), access matrix on
progress writes (anon 401, observer-on-gated 403), clamping, and worksheets excluded
from completion denominators.

## 2026-07-21 — Enrollment records + student page + dropdown consolidation

Spec: FatTail-Labs-Enrollment-Records-Student-Page-Spec-v1.0. Enrollment = explicit
(course-page Enroll card) or automatic on first progress event (no orphan progress);
never an access gate. Course completion stamped on the enrollment when all
standard-module lessons complete. Enrolled counts on cards/pages are now real. New
APIs: POST /courses/{slug}/enroll, GET /api/me/enrollments, GET /api/me/activity
(merged enrolled/watched/completed feed + stats). Avatar dropdown gains a lazy-loaded
CONTINUE LEARNING section (top 3 in-progress, mini bars, resume deep links) and a My
Learning link to /me — the student page: stats row (enrolled/completed/lessons/watch
time), full enrollment list with Continue/Review actions, Quiz Results placeholder
(future quiz spec's home), and the activity feed. Course-page right rail replaced by
the session-aware EnrollCard (anon → Join, signed-in → Enroll, enrolled → progress +
Continue, completed → ✓). Verified live: explicit + auto enroll, idempotency,
completion stamping, dropdown, /me rendering all sections.

## 2026-07-21 — In-place editing v1.1: direct manipulation replaces the modal

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.1 (supersedes v1.0's modal form; server
contract unchanged). Coach: the element IS the editor — click a block of text and it
becomes its editor, in its own place. Implemented: edit-mode toggle + floating edit bar
(status select, pending count, Discard/Exit/Save & Publish, dirty-navigation warning);
EditableText/EditableMarkdown/EditableSelect client components rendering display markup
identical to static output (SEO unaffected — zero edit artifacts in prerendered HTML);
lesson rows edit inline (title, video URL/ID, start/end, preview); markdown block editor
with Preview using the same renderer as the public page. Site-wide markdown decision
folded in: react-markdown + rehype-sanitize replaces the minimal renderer (md.tsx
deleted); lesson body_md renders as markdown and is click-to-edit on the lesson page
(body_md added to the admin field allowlist). v1.0 modal (AdminBar.tsx) deleted — no
parallel implementations. Verified live: edit mode affordances, in-place title edit →
Save & Publish → regenerated page, static HTML clean of affordances.

## 2026-07-21 — Ratings & Reviews + Course Discussion (benchmark parity)

Coach reaffirmed: Labs operates with or without WordPress — both features build purely
on the native model. Specs: FatTail-Labs-Reviews-Spec-v1.0 +
FatTail-Labs-Course-Discussion-Spec-v1.0.

Reviews: eligibility = enrolled + ≥1 completed lesson (server-enforced); rating 1–5,
one per identity per course, writing again upserts; aggregate public at ≥3 visible;
admin moderate visible/held (held never renders publicly nor counts). Course Review
block in the About tab: aggregate + stars, list w/ Show more, star-picker write form,
per-review admin Hide/Show. After a write the client revalidates the course page —
/api/revalidate loosened to any authenticated session for /courses/* (idempotent),
keeping the baked hero rating + JSON-LD aggregateRating fresh.

Discussion: course-scoped threads + comments (migration-001 tables). Reading public
(community as sales surface); posting requires any authenticated account (observer+);
bodies render through the sanitizing markdown renderer; Admin badge on staff posts;
admin moderate on threads/comments; Discussion tab now enabled, client-fetched.

Verified live: full reviews matrix (eligible post, ineligible reason, anon 401, bad
rating 422, upsert), full discussion matrix (thread/replies incl. admin badge, anon
401, hide → public count drops, non-admin moderate 403), UI rendering of both blocks.
(Browser-pane screenshots hit a stale-compositor glitch; content verified via DOM.)

## 2026-07-21 — Students tab + course trailers (benchmark parity complete)

Specs: FatTail-Labs-Students-Tab-Spec-v1.0 + FatTail-Labs-Course-Trailer-Spec-v1.0.
Students: roster from enrollments — signed-in accounts see the grid (initials avatar,
name — never email — joined date, Completed ✓, Admin badge); logged-out sees count +
sign-in prompt. Trailers: hero ▶ button when trailer_video_id set; click swaps the hero
for the player in place (no modal), ✕ restores; embed built server-side (public payload
carries embed config, never the raw ID); trailer_video_id joined the admin course
allowlist with URL→ID normalization; edit-mode Trailer chip in the hero for authoring;
seed sets trailers on flagship + butterfly. Verified: anon count-only vs member roster,
no raw-ID leak, admin set-by-URL, play button baked into regenerated static HTML.
With these, all five AI Labs course-page tabs are functional — benchmark course-page
parity is complete.

## 2026-07-21 — Editor complete (v1.3): reorder, media, assignment, course creation

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.3. No authoring task requires SQL anymore.
Reorder: HTML5 drag on module cards + lesson rows (⠿ handles); exact-set validation
server-side (422 on mismatched ids); immediate structure-write semantics. **Media
storage decision: local disk** (server/uploads, git-ignored, content-hash filenames,
served at /api/media; S3-compatible is a future backend swap) — POST /api/admin/media
validates png/jpeg/webp ≤5MB; hero_image_url allowlisted with an edit-mode Hero chip;
hero doubles as the catalog card banner, replacing the gradient placeholder when set.
Assignment in place: Categories checklist in the hero strip (replace-set PUT),
Instructors checklist in the About tab, Attachments manager in the Resources tab
(add/edit/delete; file kind uploads through media). New-course creation: admin-only
"+ New Course" card on the catalog → POST creates a draft (unique slug) → dedicated
draft editing route /admin/courses/{slug} (dynamic, admin-only, robots noindex)
rendering the course-page components from the admin payload with edit mode auto-active;
drafts remain 404 on all public surfaces until published from the edit bar. Verified:
media pipeline (upload/serve/bad-type 422/unauthed 401), module reorder + exact-set
rejection, category/instructor replace-sets, attachment CRUD, course creation with
draft invisibility, draft route rendering with all editors live. Draft "Tail Hedging
Workshop" left in dev DB as a playground.

## 2026-07-21 — Quizzes + Resource Library

Specs: FatTail-Labs-Quizzes-Spec-v1.0 + FatTail-Labs-Resource-Library-Spec-v1.0.

Quizzes: a quiz is a LESSON KIND (no parallel container) — ordered, access-gated,
completion-counted like any lesson (migration 004: quiz_questions, quiz_attempts).
Three question kinds: multiple_choice (options + correct index), binary (True/False),
short_answer (server-graded, trimmed case-insensitive acceptable-answers list).
Grading is server-side only; public payloads never carry correct answers; every
submission is an immutable attempt; first submission completes the lesson (pass
thresholds future). QuizPlayer (forms → score + per-question ✓/✗ + correct answer +
explanation + retake); admin QuizBuilder in place on the quiz lesson page; lesson rows
gained a kind select; /me Quiz Results placeholder now real (attempt history).

Resource Library: /resources aggregates course attachments (no orphan store) with
category/kind filters; header nav gained Resources. Storage tiers: public media
(images) vs NEW private tier (POST /api/admin/media?private=true — pdf/zip/office/
text/images ≤25MB, server/uploads/private, NOT statically mounted, url stored as
private:{name}). Downloads gated at GET /api/attachments/{id}/download: activator+
(member benefit), streams with human filename; observers get the upsell. Course
Resources tab rows now functional; attachments editor uploads target the private tier.

Verified: all three question kinds graded (incl. short-answer normalization), no
correct-answer leak, bad-question 422s, attempt in /me results, quiz completes lesson;
private file 404 at public path, anon 401 / observer 403 / member 200 with
Content-Disposition, library listing + anon 401. Demo quiz "Knowledge Check: The
Anatomy of the Bleed" (free preview) lives on the flagship.

## 2026-07-21 — Live sessions + pathway assessment

Specs: FatTail-Labs-Live-Sessions-Spec-v1.0 + FatTail-Labs-Pathway-Spec-v1.0. The
migration-001 live_sessions and pathways tables are now in service.

Live: /live (header nav gains Live) — public schedule (marketing surface), join URLs
double-gated server-side (role ≥ min_role AND T−15min→+4h window) with machine-readable
lock reasons (sign_in/role/too_early) driving the right prompt; public ICS export
(never carries the join URL); replays link past sessions to their replay course
(recording→lesson pipeline stays manual, honestly specced); in-page admin scheduler
(create/delete). Dashboard gains a Next Live Session card.

Pathway: 4-question intake (experience/account/struggle/time) → deterministic
server-side sequence. **Step 1 is first-stop-the-bleeding for every possible answer
set — proven by exhaustive test over all 108 combinations.** Struggle answer routes
psychology/routine/sizing early; platform primer always last (tool after doctrine).
Progress overlay derived at read time from lesson_progress. /pathway renders the
assessment or the numbered step list ("Start here" on first incomplete, Retake).
**Signup now lands on /pathway** — the benchmark's post-signup assessment pattern
carrying the sell-the-dream/sequence-the-discipline strategy. Dashboard gains a Your
Pathway card.

Verified: join gating matrix (entitled+in-window URL, role lock, sign_in lock, no URL
leak to anonymous), ICS output, session CRUD; pathway routing per struggle answer,
progress overlay against real member data, invalid answers 422, flagship-first
invariant exhaustively. Demo sessions seeded (workshop + trading room).

## 2026-07-21 — Trailer hero sizes to the full video

Refines the Course Trailer spec's playback: the hero is wrapped in TrailerShell — at
rest, normal hero content + centered play button; playing, the entire hero block swaps
to a true 16:9 (aspect-video) player sized by the column, so the video is never cropped
to the text-content height. ✕ restores the hero. Verified visually (full-width playback
with captions).

## 2026-07-21 — Native Stripe billing (third provider; live wiring awaits MiniTwo)

Spec: FatTail-Labs-Native-Billing-Stripe-Spec-v1.0. Stripe rides the existing
provider seams — Prices→plans via provider_plan_map (link_stripe_price.py CLI),
customers via identity_links, lifecycle via upsert_membership. Stripe hosts all
payment surfaces (Checkout + Customer Portal); the server never touches card data.
Endpoints: GET /api/billing/plans (amounts cached from Stripe), POST checkout (hosted
session, identity metadata, customer reuse), POST portal, POST webhook. Webhook
verified with the SDK's signature check but processed as plain JSON (StripeObject
accessor quirks bypassed — SDK is verify-only) and deliberately needs NO Stripe API
calls: payloads carry customer/price/status. Status map: active|trialing→active,
past_due→grace, canceled|unpaid|incomplete*→expired. Config-gated (no key → provider
absent, 503s + graceful UI fallback). /membership pricing page (success/cancel
banners; anonymous → signup first); all upgrade CTAs (gated lesson, resources denial,
dropdown upsell, live role locks) now point to /membership; /me gains Manage billing
(portal). Verified offline with the real signature scheme: disabled mode, customer
linking, active→grace→expired lifecycle, bad-signature 400, unmapped-price graceful
ignore, and role round-trip (observer → activator while Stripe-active → observer
after cancel). PENDING on MiniTwo (Coach): live keys, two Prices, price↔plan mapping
via CLI, webhook endpoint registration, one test-mode checkout.

## 2026-07-21 — Membership tiers, alumni grandfather, 2-step enrollment funnel

Spec: FatTail-Labs-Membership-Tiers-Enrollment-Spec-v1.0 (Coach directive with AI Labs
funnel screens; supersedes parent §3.2 placeholder pricing).

Tiers: Navigator $250/mo·$2,500/yr (featured — the AI Labs price structure);
Activator $100/mo PROMO-ONLY (renders only with ?promo, verified absent without);
Observer Trial $20/wk × 4 weeks with FULL Navigator access. Courses included with
every tier. Discord/app delivered outside Labs.

Role ladder gains **alumni** (observer < alumni < activator < navigator < admin);
lesson content + resource downloads dropped to alumni threshold; livestreams stay
activator+/navigator. **Alumni rule:** churn after ≥28 days tenure (any paid tier, or
the completed 4-week trial) auto-grants courses-alumni for 1 year
(current_period_end); role derivation is now date-expiry aware (expired-by-date
memberships confer nothing — also ends the alumni year). Tenure check wired into
BOTH churn paths (Stripe webhook + WP sync).

Funnel: signup = "Step 1 of 2" (what-happens-next list) → lands on
/membership?welcome=1 = "Step 2 of 2 — Welcome, {name}" with tier cards (display_json
on plans, migration 005 — cards render before billing wiring; checkout buttons attach
when Stripe is live). Exit-intent modal (once/page) pitches the trial + alumni promise
instead of a discount. "Continue with your free account" always visible → /pathway.

Verified: full alumni matrix (courses 200, resources 200, workshop role-locked,
year-expiry → observer), navigator subscribe → role navigator, cancel@5d → observer
(no alumni), cancel@35d → "expired + alumni granted" → role alumni with courses
playing and alumni year ending exactly +1yr, promo gating, step-2 page rendering.

## 2026-07-21 — Course lifecycle: unpublish + title-confirmed delete (admin v1.4)

Spec: FatTail-Labs-InPlace-Admin-Spec-v1.4. Danger zone at the bottom of the course
page (and draft route) in edit mode: Unpublish (published only — status→draft,
republish, redirect to /admin/courses/{slug}; published_at retained so republish keeps
the original date) and Delete course (confirmation requires TYPING the exact title —
stronger than modules/lessons confirm). DELETE /api/admin/courses/{slug} cleans the
non-FK relations explicitly: course attachments incl. their private files on disk, and
course-scoped threads (comments cascade); FKs handle modules/lessons/progress/
questions/attempts/enrollments/reviews/certificates; replay links null. Both actions
refused while the dirty set is non-empty. Verified: full-cascade delete on a
disposable course (zero orphans, private file removed from disk, unauthed 401),
danger-zone rendering with both controls in edit mode.

## 2026-07-21 — Draft visibility: admins auto-route from public URL to the editor

Extends spec v1.4 (§3, same working session): a draft's /courses/{slug} URL keeps its
genuine 404 for everyone (HTTP status + SEO unchanged), but the 404 page carries an
admin-only client check — administrators whose slug resolves in the admin API are
routed straight to /admin/courses/{slug}. Verified: anonymous draft URL stays 404;
admin visiting the same URL lands in the draft editor (DRAFT badge confirmed).

## 2026-07-21 — Resource visibility (free vs members) + library admin controls

Spec: FatTail-Labs-Resource-Library-Spec-v1.1 (extends v1.0; migration 006:
attachments.free_preview). Every resource is free (any signed-in account — mirrors
lesson previews; nothing is anonymous) or members-only (alumni+, the default).
Free/Members badges on the library and course Resources tab. Admin controls: course
attachments editor gains a Free checkbox on create + per-row toggle; the /resources
page itself gains admin create (course selector — resources always belong to a
course, no orphan store — title, URL or private upload, Free checkbox) plus per-row
make-free/members toggle and confirmed delete. Verified: observer free-download 302,
members-only 403, anon 401, live toggle flip, flags in listings.

## 2026-07-21 — Live Sessions v1.1: recurring standing schedule

**Decision:** The real schedule is recurring, not one-off. Added `live_recurrences`
(migration 007) storing America/New_York wall-clock schedules; occurrences
materialize at read time over a 14-day horizon (no cron, no generated rows).
Seeded the standing three: Live Trading Room Mon–Fri 11:00–12:15 ET (navigator+ —
all members except Activators), Friday Pre-Market Briefing Fri 9:30–10:00 ET
(activator+ — the one session Activators get), Sunday Retrospective Sun 21:00 ET
(navigator+). `min_role` widened to public|observer|activator|navigator so a
public YouTube show (e.g. Mon/Wed/Fri 15:00) can be listed; kind gains `show`.
Recurrence ICS is a true repeating VEVENT (RRULE WEEKLY, TZID) — add once, holds
forever. Admin recurrence manager on /live; occurrences are managed through the
recurrence, not individually. Deleted the demo one-off "Live Trading Room" (now
covered by the recurrence).

**Verification:** ET→UTC conversion exact under EDT (11:00→15:00, 9:30→13:30,
Sun 21:00→Mon 01:00). Today's already-ended occurrence correctly absent.
Activator session: trading room + Sunday locked `role`, Friday briefing passes to
`too_early`; navigator passes all role gates. ICS shows
`DTSTART;TZID=America/New_York` + `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`.
Live DOM: 14 Weekly-badged occurrences, recurrence manager lists all three
standing sessions, delete absent on occurrence cards.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.1.md.

## 2026-07-21 — Live Sessions v1.2: month calendar replaces the upcoming list

**Decision:** With a standing recurring schedule, a flat list grows linearly with
occurrences and buries the rhythm — replaced /live's Upcoming list with a
Monday-first month calendar, opening on the current month, with ‹/Today/›
navigation. Chips colored by kind; click → detail card (countdown, ICS, gated
Join, admin delete for one-offs). API gains `?month=YYYY-MM` returning the full
ET month including past occurrences (locked `ended`); the no-param dashboard
shape is unchanged. Past sessions always render "Session ended" client-side —
never a sign-in prompt for something that's over.

**Verification:** July 2026 returns 33 sessions (23 weekday rooms + 5 Friday
briefings + 4 Sunday retros + 1 one-off), 23 distinct days; August returns 30,
first = Sun Aug 2 21:00 ET (2026-08-03T01:00Z); bad month → 422. Browser: grid
renders with today (21st) highlighted, past days dimmed, one-off auto-selected;
past-chip click shows "ended"; › navigation loads August with 30 chips matching
the API. Spec: FatTail-Labs-Live-Sessions-Spec-v1.2.md.

## 2026-07-21 — Live Sessions v1.3: membership-based content categories

**Decision:** Live content is categorized by membership audience, not role
plumbing — `category` (public | members | coaching) replaces `min_role` on both
tables (migration 008 backfills then drops the column; no dual schemas).
public = no gate; members = every membership (Observer, Activator, Navigator);
coaching = Observer & Navigator only. The ladder derivation (members→activator+,
coaching→navigator+) lives in one mapping and works because Observer trials
grant the navigator role; alumni fall below activator so they lose all live
content automatically. Standing schedule revised: 0DTE Live Show (public,
Mon/Wed/Fri 15:00 ET, youtube.com/@0dte/live), Daily Livestream (coaching,
Mon–Fri 11:00–12:30), Friday Morning Coach Call (members, Fri 9:30–10:00),
Sunday Evening Retrospective (coaching, Sun 21:00–22:00). Forward note: agents
producing live content will author the schedule through the same admin API —
category is the agent-facing contract (audience, never internal roles).

**Verification:** Full matrix — anonymous: coaching/members locked sign_in,
public show passes to too_early; activator: coaching locked role, Coach Call
passes; navigator: all pass. Public one-off in-window exposes join_url to
anonymous callers; invalid category → 422. Calendar renders the four-show week
(rose 0DTE chips Mon/Wed/Fri); recurrence manager shows category labels.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.3.md.

## 2026-07-21 — Live Sessions v1.4: Recurring Event Viewer (scope-aware editing)

**Decision:** Two event types made explicit — single (`live_sessions`) and
recurring (`live_recurrences` + new `live_recurrence_overrides`, migration 009).
Editing a recurring occurrence requires a scope choice, iCalendar-style:
(1) this event only → override row (NULL = inherit, cancelled = removed);
(2) this and all future → series split (old bounded by `until_date`, clone with
edits from `start_date`, overrides ≥ split date move to the clone);
(3) all events → series update. Delete honors the same scopes. Occurrence
payloads gain `occurrence_date` + `modified`; the UI shows an amber "edited"
badge and an inline editor on the detail card (scope radio for recurring,
plain edit for single events). Known limits logged in spec §6 (series ICS shows
the base pattern; join_url override can't clear a series URL; no one-click
"restore occurrence to series" yet — re-edit or scope=all covers it).

**Verification:** Disposable series exercised end to end — scope=one changed
exactly one date (title + 13:00 ET → 17:00Z, modified=true); scope=future split
at Aug 10 left Aug 3–7 on the old series (30m) and moved Aug 10+ to the clone
(45m) including a pre-existing Aug 12 override; scope=one delete removed only
Aug 11; Saturday prefill 404; bad scope 422; scope=all cleanup left zero probe
sessions and zero orphan overrides. Browser: viewer opens from the calendar with
the three choices as specified, prefilled 11:00 ET/90m; a scope=one retitle
round-tripped to the chip + "edited" badge with the rest of the week untouched.
Spec: FatTail-Labs-Live-Sessions-Spec-v1.4.md.

## 2026-07-21 — Live Sessions v1.5: recurring series end limit

**Decision:** A recurring series can be bounded at creation — `until_date`
(YYYY-MM-DD, ET) or `until_days` (1–730, converted to a concrete date at save;
a fixed limit, never a rolling window). Both → 422; past date → 422; neither →
unbounded as before. No schema change (until_date existed since 009; the
materializer already honors it). Admin create form gains an Ends selector
(Never / On date / After N days); manager rows show "until {date}". Ending an
existing series = v1.4 scope-future delete.

**Verification:** until_days=7 on Jul 21 → until_date Jul 28; July listing ends
Jul 28, August has zero occurrences; explicit until_date Aug 6 on a Thursday
series kept only Aug 6; both-fields and past-date both 422. UI: Ends selector
renders with the three modes; N-days input appears on switch (default 30).
Probes deleted. Spec: FatTail-Labs-Live-Sessions-Spec-v1.5.md.

## 2026-07-21 — Course Card Editor v1.0: banner color/image + quick-info blurb

**Decision:** Catalog cards become authorable per course (migration 010:
`card_color`, `card_image_url`, `card_blurb_md`). Banner precedence:
card image (object-cover, scales to fill the 16:9 banner) → chosen color
(rendered as the same gradient art style: shade(color,0.3)→color, category
label + title kept) → hero image → category gradient; all-NULL = previous
behavior exactly. The hover panel's blurb (Markdown, sanitized pipeline)
replaces the default subtitle + ✓-outcomes block when set; derived meta
(duration, level, lesson count, badges) stays computed — not editable, so the
card can't lie. Editing happens ON the catalog: admin-only "✎ Card" chip flips
the card face into an inline editor (live preview, palette swatches + custom
picker, upload via existing public media tier or URL, blurb textarea);
save → PUT (allowlist +3 fields) → revalidate /courses + course page → reload.

**Verification:** Browser round trip — purple swatch picked, live preview
showed computed gradient, saved; regenerated catalog renders
linear-gradient(135deg, rgb(50,26,74), rgb(168,85,247)) and the Markdown blurb
appears in the hover panel; API returns the stored fields. Image path: PUT an
uploaded media URL → banner renders the image in prerendered HTML; full revert
confirmed (banner back to category art, blurb gone). Draft editor adapt()
extended for the new CourseDetail fields (build was failing until then).
Spec: FatTail-Labs-Course-Card-Editor-Spec-v1.0.md.

## 2026-07-21 — Card Editor v1.1 + Media Library v1.0: unified banner, popup removed

**Decision:** Same-day revision of Card Editor v1.0 on review. (1) The hover
quick-view popup is removed — cards click straight through; card_blurb_md dies
with it. (2) One banner per course: hero_image_url is shared — sharp
(object-cover) on the catalog card, expanded + Gaussian-blurred (blur-2xl,
scale-110) + shaded (bg-zinc-950/60) behind the course page header (public page
and draft editor both). card_image_url superseded; migration 011 drops both
columns (no dual schema). Precedence: banner image → card_color → category art.
(3) Banner uploads from two places, one store: the course page hero chip
(existing) and the new /admin/media Media Library — grid of public-tier uploads
with copy-URL and delete; delete is referentially safe (409 + who uses it,
checked against courses.hero_image_url and attachments.url). Card editor keeps
color + image (now writing hero_image_url) and links to the library.

**Verification:** Catalog HTML contains no group-hover popup; PUT banner →
card renders the sharp image and the course header renders blur-2xl +
scale-110 + bg-zinc-950/60 in prerendered HTML; screenshot confirms legible
title over the blurred, shaded image. Media API lists the store's 1 file;
deleting the referenced banner → 409 "In use — banner for
['butterfly-foundations']". Probe banner reverted cleanly. /admin/media 200,
admin-gated. Specs: Course-Card-Editor v1.1, Media-Library v1.0.

## 2026-07-21 — In-Place Admin v1.5: image embedding in the lesson markdown editor

**Decision:** The lesson-notes editor embeds images by upload, three ways
(toolbar Insert image…, clipboard paste, drag-drop), GitHub-style: instant
![Uploading…]() placeholder at the cursor → public-tier media upload (same
store as banners; visible in /admin/media) → swapped for ![alt](url) with
alt = filename sans extension; removed + error shown on failure; Save disabled
mid-upload. Site renderer (already img-safe via sanitize schema) gains image
styling (max-w-full, rounded). Logged limits: lesson images are public URLs
(member-only material belongs in private resources); Media Library delete does
not reference-check body_md (banners/attachments only) — accepted debt.

**Verification:** Browser flow on a real lesson — file fed through the Insert
input produced ![embed-test](/api/media/6b7fa434….png) at the cursor; Save
persisted and the page rendered the <img>; original notes restored; the
dereferenced upload then deleted with 200 (guard releases once unused).
Spec: FatTail-Labs-InPlace-Admin-Spec-v1.5.md.

## 2026-07-21 — Resource Library v1.2: in-place editing, descriptions, emoji

**Decision:** Library items become editable on the page (migration 012:
attachments.description_md + emoji ≤16 chars). Each row renders its emoji
(fallback by kind: file 📄, link 🔗), title, visibility badge, 2-line
description, course link; admin Edit swaps the row into an inline editor with
an emoji quick-pick strip + custom field, title input, and description
textarea. Create form gains the same fields. Course-tab surfacing of
emoji/description logged as future scope (payload + draft-adapter ripple).

**Verification:** Browser round trip on "Butterfly Construction Checklist" —
default 📄 shown, picked 📊 + description, saved; list re-rendered with the
new emoji and clamped description; reverted to NULL/NULL cleanly (fallback
returned). Create form shows picker + description field. API payload carries
both fields. Spec: FatTail-Labs-Resource-Library-Spec-v1.2.md.

## 2026-07-21 — Test Suite v1.0: characterization coverage (refactor step 1/4)

**Decision:** Before any structural refactor, the hand-verified behavior from
16 feature commits is codified as 44 pytest characterization tests
(server/tests/, FastAPI TestClient in-process, dev DB; probe rows zztest-*
created and cleaned by fixtures; seeded standing content read-only). Coverage:
auth/role ladder, catalog + draft visibility, lesson gating matrix, the full
live-sessions surface (materialization vs an independent calendar oracle,
category gating matrix, scope edits, bounds, ICS), resource visibility +
metadata, media upload/reference-guard, enrollment/progress clamps +
auto-complete, the alumni tenure rule, and quiz answer-leak prevention.
New rule in CLAUDE.md: server-touching commits must pass the suite; features
ship with their tests.

**Verification:** 44/44 passing in ~2s. One first-run fix: quiz questions live
at the lesson payload's top-level `questions` key, not under `quiz` — the test
was corrected to match reality (characterization, not aspiration).
Spec: FatTail-Labs-Test-Suite-Spec-v1.0.md.

## 2026-07-21 — Refactor step 2/4: shared guards + course lookup

**Decision:** server/guards.py (claims_or_none, require_session, require_role,
require_admin) replaces seven per-module reimplementations of the cookie →
verify → role-gate dance across admin, live, community, member, and quizzes;
resources/pathway/billing now import from guards instead of routes.member.
server/repo.py:course_id_by_slug (published_only flag) replaces eight
slug → id → 404 lookups (six in admin.py, plus community and member enroll).
Semantics preserved: 401 "Sign in required" / verifier reason, 403 "<Role>
role required". Unused imports pruned (quizzes auth/get_config).

**Verification:** Test suite 44/44 before commit (caught a missed quizzes
import mid-refactor — exactly the net it was built to be). Dev API restarted
clean; health + live month smoke pass.

## 2026-07-21 — Refactor step 3/4: web client helpers + useIsAdmin

**Decision:** web/lib/client.ts (getJSON/postJSON/putJSON/del, uploadMedia,
revalidate) and web/lib/useIsAdmin.ts (module-cached /api/auth/me promise +
hook) replace the pasted fetch dances: six components converted from their own
admin-check effect to useIsAdmin (one /me request per page load instead of
3–4); five upload sites and five revalidate sites now use the helpers;
ResourceLibrary's JSON verbs converted; lib/ui.ts FIELD replaces the pasted
form-field class. Deliberately NOT converted: SiteHeader and MembershipPlans
/me fetches (they consume richer identity data), EditContext's save()
revalidate (it checks the response and throws) and uploadHero (structureOp
needs the raw Response), MediaLibrary's list fetch (drives a denied state).
Failure alerts on uploads lost the HTTP status detail (helper returns
url-or-null) — accepted.

**Verification:** Build clean; all routes 200. Browser: catalog shows 10
✎ Card chips + New Course card, /me fired exactly 2× (SiteHeader + shared
cache); /resources shows 4 Edit buttons + admin form. Server suite still 44/44.

## 2026-07-21 — Refactor step 4/4: LiveSessions.tsx split

**Decision:** The 979-line LiveSessions.tsx was five components in a trench
coat — split into components/live/ (types.ts with the shared Session/
Recurrence types + constants, MonthCalendar, SessionDetail incl. Countdown +
JoinControl, EventEditor, RecurrenceManager, AdminManager); LiveSessions.tsx
becomes a 153-line orchestrator (cursor + fetch + selection + replays + admin
mounting). The moved files adopted the step-3 client helpers and FIELD while
relocating. No behavior change intended or observed.

**Verification:** Build clean; browser on /live — July renders 46 chips,
detail card present, Event editor opens with the 3 scope radios, both admin
managers mounted. Server suite 44/44 (unchanged surface). Refactor sequence
complete: tests → server guards → web client helpers → component split.

## 2026-07-21 — SEO v1.0: technical foundation (Layer 1)

**Decision:** Crawl plumbing before the strategy layers. app/sitemap.ts (API-
driven: 3 static URLs + every published course with lastmod, hourly revalidate),
app/robots.ts (allow public, disallow /me /dashboard /admin/ /api/ /login,
sitemap pointer; AI crawlers deliberately welcome), noindex metadata on
/me + /dashboard, metadataBase + og siteName/type on the root layout so
relative banner URLs resolve absolute. Canonical-host decision recorded:
https://labs.fattail.ai only, 301 from every variant at the MiniThree vhost —
added to infra/deploy.md as a wire-BEFORE-announcing launch step. Roadmap
(free-lesson landing pages → category hubs → structured-data expansion → AEO)
and anti-goals (no blog bolt-on, no keyword stuffing, no funnel bypass) live
in the spec.

**Verification:** robots.txt and sitemap.xml serve correctly; sitemap has 13
URLs (3 static + 10 published, draft absent); /me carries noindex,nofollow;
catalog page carries no robots meta; course canonical absolute; og:image
verified absolute with a probe banner (then reverted). Server suite 44/44.
Spec: FatTail-Labs-SEO-Spec-v1.0.md.

## 2026-07-21 — SEO v1.1: free-lesson landing pages (Layer 2)

**Decision:** The anonymous lesson page becomes a real landing page instead of
a contentless sign-in wall. New public endpoint (…/lessons/{slug}/public)
returns safe metadata + notes for free previews only — no video fields by
construction, gated notes never public, drafts 404. Anonymous render: breadcrumb,
title/module/duration, locked player panel with signup/membership CTA, notes
(free only), prev/next links, LearningResource + BreadcrumbList JSON-LD
(isAccessibleForFree: false — watching always requires an account, per the
founding funnel rule). Index policy: free previews indexable with derived
descriptions; gated shells noindex,follow. Sitemap gains all free-preview
lessons (11 today). Authoring consequence recorded: notes on free previews are
now public ranking copy. Signed-in behavior unchanged.

**Verification:** Suite 46/46 (2 new endpoint tests: payload safety + draft
404s). Anon HTML: full title/h1/JSON-LD/lock CTA, zero "youtube" occurrences;
gated page noindex,follow + members shell; probe notes rendered in anon HTML
and drove the meta description, fallback description verified with notes
absent (probe reverted to NULL). Sitemap 11 lesson URLs.
Spec: FatTail-Labs-SEO-Spec-v1.1.md.

## 2026-07-21 — SEO v1.2: category hub pages (Layer 2b)

**Decision:** Nine prerendered keyword hubs at /courses/category/{slug}.
Migration 013 adds categories.description_md, seeded with doctrine-voice intro
copy for every category; public GET /api/categories (separate router — the
courses router prefix would have swallowed the path, caught by the endpoint's
own test failing first) returns slug/name/copy/published-count. Hubs render
copy + the category's courses (CatalogGrid, prerendered) + cross-links to all
other non-empty hubs; empty categories 404 rather than exist as thin pages.
Catalog gains a server-rendered "Browse by category" footer (the client-side
filter chips are invisible to non-JS crawlers). ItemList + BreadcrumbList
JSON-LD; sitemap gains the 9 hub URLs. Category copy editing is seed/DB-only
for now — logged future scope.

**Verification:** Suite 47/47 (new categories-endpoint test). Build prerenders
9 hub routes; risk-sizing hub HTML carries title/h1/copy/canonical/ItemList
and its 2 courses; unknown category 404s; catalog links all 9 hubs; hubs
cross-link; sitemap +9 category URLs. Spec: FatTail-Labs-SEO-Spec-v1.2.md.

## 2026-07-21 — SEO v1.3: structured data + AEO (Layers 3+4)

**Decision:** Course JSON-LD gains offers (Subscription $250 → /membership)
and the trailer as VideoObject (YouTube thumbnail, embed, uploadDate) —
lessons deliberately stay VideoObject-free since watching is gated. /live
emits Event JSON-LD for upcoming PUBLIC sessions only (0DTE Live Show;
member sessions never in schema), hourly window. New /about entity page:
Person (Ernie Varitimos) + Organization with sameAs to youtube.com/@0dte,
0-dte.com, fattail.ai; bio limited to in-repo facts (founder review invited);
sitewide Organization JSON-LD in the layout; About in nav + sitemap.
Membership page: six-question FAQ rendered visibly AND as FAQPage JSON-LD
from one array (no drift possible), grounded in the tier/trial/alumni specs.
/llms.txt site card for AI crawlers. SEO design v1.0–v1.3 complete; remaining
work is content-side and post-launch ops.

**Verification:** Course HTML carries VideoObject + i.ytimg thumbnail +
Subscription offer; /live has 5 Event entries (remaining July MWF shows);
/about serves Person + Organization + copy; /membership serves FAQPage +
visible FAQ; /llms.txt 200; catalog carries the sitewide Organization; nav
links /about; sitemap +1. Suite 47/47. Spec: FatTail-Labs-SEO-Spec-v1.3.md.

## 2026-07-21 — User's Guide (/guide) + Admin Guide (docs/)

**Decision:** Two guides, two audiences. (1) Member-facing User's Guide at
/guide — static, indexable (help content doubles as answer-engine content),
linked in the nav and sitemap; nine sections with anchor chips covering
accounts/previews, finding courses, taking a course (position resume, 90%
auto-complete), quizzes, progress surfaces, the live schedule with the
standing session times and access tiers, resources, membership + the alumni
year, and Stripe billing. Every claim mirrors shipped behavior — no promised
features. (2) docs/ADMIN-GUIDE.md — the operator's manual consolidating the
admin workflows spread across 30 specs: in-place editing model, course
lifecycle, lessons/video/notes (with the free-preview-notes-are-public
warning), card/banner/media, quizzes, resources, live schedule management
(scopes, categories, bounds), category copy, membership ops, and the
test/build rhythm. Specs remain authoritative; the guide cites them.

**Verification:** /guide 200 with title, section content (alumni year, 0DTE
show, Manage billing) in prerendered HTML; nav links it; sitemap +1;
screenshot confirms layout. Build clean, 38 static pages.

## 2026-07-22 — Bootstrap administrators

**Decision:** Three platform administrators, granted via
`identities.role_override = administrator` (not plan memberships):
`ernie@fattail.ai`, `conor@fattail.ai`, `coach@fattail.ai`. Seeded
idempotently by migration `014_bootstrap_admins.sql` so every environment
has the same operator set. Passwords and WordPress identity links remain
operator-managed (`create_user.py` / SSO).

## 2026-07-22 — Labs landing page is the front door

**Decision:** `/` is a real public landing page (stop-the-bleeding thesis,
pillars, flagship callout, featured courses, CTAs) — no longer a redirect
to `/courses`. Brand link in `SiteHeader` points to `/`. Catalog stays at
`/courses` as the library storefront. Amends parent Course-Hosting spec
§4.1 ("`/courses` is the entry point" / "`/` redirects to `/courses`"):
Labs now owns its own front page; fattail.ai marketing can still deep-link
to courses. Sitemap priority 1 moves to `/`.

## 2026-07-22 — Front page is the course hub

**Decision:** `/` is the **course hub**, not a marketing funnel. Layout:
compact hub header → flagship "Start here" strip → category chips → full
`CatalogGrid` (flagship sorted first) → light membership/guide footer.
Pillars / sales CTAs removed. `/courses` remains the dedicated library
route (nav "Courses"); brand still lands on the hub.

## 2026-07-22 — Course hub optimized for SEO / AEO / agents

**Decision:** `/` is the canonical **machine-readable course index**, not a
card grid. Server-rendered: 40–60-word lead answer, flagship section with
description lead, every category hub (copy + course title links), complete
ordered catalog (title, subtitle, description lead, meta, absolute-style
URL path), visible FAQ matching schema. JSON-LD: `WebSite`,
`CollectionPage`+`ItemList`, standalone `ItemList` of `Course` items, and
`FAQPage` (same Q&As as the visible block). Flagship sorted first.
`/courses` stays the interactive filtered catalog; `/llms.txt` points
agents at `/` as the hub start. No profit claims — process/doctrine only.

## 2026-07-22 — Course hub layout: categories + 2-col + intro video

**Decision:** Hub courses are grouped by category section with a two-column
card grid (title, subtitle, description lead). Jump chips to each category.
Intro video at the top: click-to-play YouTube poster (`HubIntroVideo`),
resolved from `NEXT_PUBLIC_LABS_INTRO_VIDEO_ID` → flagship trailer →
fallback id. `VideoObject` JSON-LD + YouTube link for agents/crawlers.

## 2026-07-22 — Hub CMS: editable page + accordion FAQ

**Decision:** Course hub content is CMS-backed like other in-place admin
pages. Migration `015_hub_content.sql`: `site_pages` (title, description_md,
intro video, faq_title, faq_description_md) + `site_faq_items` (sort_order,
question text, answer_md markdown). Public `GET /api/hub`; admin
`PUT /api/admin/hub` replaces fields + full FAQ list. UI: `HubEditProvider`
+ Edit FAB/bar; title/lead/video editable; FAQ is an accordion (collapsed by
default, single open panel) with add/reorder/delete in edit mode; answer
editor is markdown with image upload (media library). FAQPage JSON-LD from
DB. Catalog/category blocks remain server-rendered.

## 2026-07-22 — Lesson course navigation rail

**Decision:** Lesson pages use a **9/12 main + 3/12 right rail** layout. The
rail is course navigation (modules → lessons with links), sticky on desktop,
with per-lesson completion indicators from `GET /api/me/progress` and live
updates via `labs:progress` when the player/quiz completes a lesson. Shown for
authenticated, 403, and anonymous lesson views when course detail loads; the
lesson API remains access authority. Spec:
`FatTail-Labs-Lesson-Course-Nav-Spec-v1.0.md` (extends parent §5.3).

## 2026-07-23 — Agent model interface: Grok primary, Claude secondary

Spec: FatTail-Labs-Agent-Model-Interface-Spec-v1.0. P2 agents and workflows call
foundation models through `server/ai/` only — no vendor SDKs scattered in seeds.
**Primary:** xAI Grok (`XAI_API_KEY`, default model `grok-4.5`). **Secondary:**
Anthropic Claude (`ANTHROPIC_API_KEY`, default `claude-sonnet-4-5`). Prefer modes:
`primary` (default), `secondary`, `auto` (fallback on provider failure only).
AI keys are optional at platform boot (same pattern as Stripe); completions fail
loud if the selected provider key is missing. No member-facing chat route in v1.
Agent callsign may set prefer via `LABS_AI_AGENT_<CALLSIGN>_PREFER`.

## 2026-07-23 — Agent task runtime tests for studio bench

`server/ai/agents.py` loads `agents/bench/<callsign>.md` charters and runs
catalogued tasks via the model interface. Characterization in
`server/tests/test_agent_tasks.py`: every studio agent × task end-to-end with
fake Grok; pipeline order smoke; optional live Bravo smoke when `XAI_API_KEY`
is set. Required section markers fail loud if missing.

## 2026-07-23 — Browser agent workbench + live API key validation

Admin gateway `/api/admin/ai/*` and UI `/admin/ai` let administrators run catalogued
agent tasks through the browser. Live runs require `XAI_API_KEY` on the API (Grok
primary). Playwright e2e (`web/e2e/agent-workbench.spec.ts`) validates the workbench
UI and, when the key is present, live Bravo/November task output section markers.
Dev login: `/api/auth/dev-login`.

## 2026-07-23 — Retroactive as-built architecture documentation pack

Code audit of `server/` + `web/` produced Architecture docs 01–07 (system overview,
backend design, frontend design, domain data model, security/access, operations/
verification, audit snapshot). Decision log remains append-only authority for
*why*; Architecture describes *shape*. Specs remain feature contracts. Index:
`Architecture/README.md`.

## 2026-07-23 — Phase A: agent identity + dual admin surface

Specs: FatTail-Labs-Agent-Identity-Spec-v1.0, FatTail-Labs-Admin-Dual-Surface-Spec-v1.0.
Migration 016: agent_principals, agent_api_keys, actor_events; studio principals seeded.
Agents authenticate via `Authorization: Bearer ftl_ag_<prefix>_<secret>` with scopes
(`ai:run`, `ai:status`, …). Human admins mint/revoke keys. AI workbench accepts human
session or agent bearer; successful runs write actor_events. Admin app shell at `/admin/*`
suppresses member SiteHeader (AppChrome); in-place editing remains on production URLs.

## 2026-07-23 — Phase B: content backlog & Kanban production board

Spec: FatTail-Labs-Content-Board-Spec-v1.0. Migration 017: content_vision,
content_items (work-product cards), transitions, artifacts, guardian flags.
Kanban UI at `/admin/board` — cards drag across process columns (draft → queued →
scheduled → in_production → awaiting_approval → published / rejected / revision).
Human admins create cards and own publish/reject; agents with `board:operate` may
move pipeline columns (Quebec). Open flags block awaiting_approval.

## 2026-07-23 — Admin notifications (email + in-app + browser)

Spec: FatTail-Labs-Admin-Notifications-Spec-v1.0. Migration 018: admin_notifications.
When a board card moves to awaiting_approval or revision_requested, or a block flag
opens, all role_override administrators get an in-app inbox row and optional SMTP
email (LABS_SMTP_*). Admin shell polls unread count, supports browser Notification
API, deep-links /admin/board?item=N. Dev identity_id=0 has no inbox (use real admin).

## 2026-07-23 — FatTail outbound SMTP is Hostinger

Admin notification email uses **smtp.hostinger.com** (port **465** SSL preferred;
587 STARTTLS alternate). Env: LABS_SMTP_HOST/PORT/MODE/FROM/USER/PASSWORD.
Documented in `.env.example`, notifications spec, and `infra/deploy.md`.
`notify.py` supports SMTP_SSL (465) and STARTTLS (587).

## 2026-07-23 — Phase C production packages + Phase D placement start

Spec: FatTail-Labs-Production-Package-Spec-v1.0. Migration 019: ai_invocations,
content_approval_packages, artifact hash/invocation FKs, placed_course_slug.
Awaiting_approval requires complete stage checklist per product_line; freezes a
pending package snapshot. AI runs with content_item_id attach artifacts. Publish
approves package and applies Phase D draft course placement (module+lesson) when
placement_proposal present. Board drawer shows package checklist.

## 2026-07-23 — Phase D complete: multi-module placement

Placement apply parses placement_proposal / lesson_plan / video_package JSON:
modules, lessons (video_id, free_preview, body_md), trailer, course resource
links. Re-place rebuilds draft courses only (refuses published). Board Approve
uses replace=True; drawer Re-apply placement; Admin Guide updated.

## 2026-07-23 — Architecture docs parity for Phases A–D

Brought Architecture README + 01–07 in line with shipped agent identity, Kanban board,
packages, multi-module placement, and admin notifications. Admin Guide already covered
operators; design docs had lagged Phase D completion.

## 2026-07-23 — Phase E hardening: pool, SSO contracts, smoke tests

DB connection pool in `server/db.py` (LABS_DB_POOL_SIZE default 10). Characterization:
test_db_pool, test_sso_providers (stub WP JWTs + native fallback), test_smoke_member_path.
Browser smoke: web/e2e/smoke.spec.ts (npm run test:e2e:smoke). Spec:
FatTail-Labs-Phase-E-Hardening-Spec-v1.0. P1 ORCHESTRATOR marked historical.

## 2026-07-23 — Phase F: Bunny Stream signed embeds for gated video

Spec: FatTail-Labs-Lesson-Video-Signed-CDN-Spec-v1.0. Provider `bunny` builds
time-limited Stream embed URLs (sha256 token + expires). YouTube remains for free
preview/trailers. Env: LABS_BUNNY_LIBRARY_ID, LABS_BUNNY_TOKEN_KEY, optional TTL.
LessonPlayer supports bunny iframe + visibility heartbeat progress.

## 2026-07-23 — Phase G1 cast registry + G2a HeyGen board kick

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0. Migration 020: `content_items.cast_id`.
Cast source of truth remains `docs/studio/cast/AVATAR-*.md` (DUDE-PRIMARY,
DUDE-ALT registered from existing HeyGen groups). Admin `/admin/cast` lists
members; board create/patch assigns cast; drawer Produce HeyGen writes
`video_package` (dry-run or live video-agent submit via CLI). Live requires
HEYGEN_API_KEY + wallet credits; LABS_HEYGEN_DRY_RUN forces dry path. YouTube
upload and multi-scene batch remain later G slices.

## 2026-07-23 — Phase G complete (G2b–G5)

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.1. Migration 021: `heygen_job_ledger`.
**G2b** multi-lesson batch from lesson_plan/placement/script beats (default batch
LABS_HEYGEN_MAX_BATCH=3). **G3** daily/monthly live job budgets
(LABS_HEYGEN_DAILY_JOB_LIMIT / MONTHLY). **G4** Quebec tick advances
queued→scheduled→in_production→awaiting_approval from artifacts; agents need
LABS_QUEBEC_AUTO=1; humans force. **G5** refresh-heygen poll + youtube-map on
package for Phase D. Board UI: budget chip, Quebec tick, render list, YT map.
No auto YouTube upload; publish remains human.

## 2026-07-23 — Docs parity for Phase G (A–G complete)

Brought operator and architecture docs in line with shipped cast/HeyGen factory:
Admin Guide (§2.5–2.7, cast map, env table, spec index), root README, Architecture
01–04/06/README, ops verification tests, deploy.md HeyGen env, P2 capabilities +
charter, cast registry README, Cast-HeyGen v1.0 cross-link to v1.1.

## 2026-07-23 — Native forgot-password / password reset

Spec: FatTail-Labs-Password-Reset-Spec-v1.0. Migration 022: `password_reset_tokens`
(SHA-256 of raw token only). `POST /api/auth/forgot-password` (enumeration-safe;
requires SMTP + LABS_WEB_ORIGIN) emails a one-time link; `POST /api/auth/reset-password`
sets a new scrypt password. UI: `/forgot-password`, `/reset-password?token=`, link on
login. Shell `create_user.py` remains operator fallback. TTL default 1h
(`LABS_PASSWORD_RESET_TTL_SECONDS`).

## 2026-07-23 — WooCommerce + WordPress SSO integration guide

Operator runbook `docs/WooCommerce-SSO-Integration-Guide.md` documents dual-issuer
SSO JWT claims, Labs callback URLs, HMAC membership webhooks, `provider_plan_map`,
env secrets, verification curls, and WP plugin checklist. Linked from README,
Admin Guide, deploy.md, and Architecture security.

## 2026-07-23 — Labs SSO aligned with MarketSwarm-Canonical / fotw-sso

SSO mint remains WP **fotw-sso** (documented in MSC
`org/reference/softwares/flyonthewall_wordpress.md` and verified like
`src/auth/sso.py`). Labs `providers.py` now accepts MSC claim shapes: `iss` fotw|fattail
for `wordpress:fattail`, user id `sub|id|wp_id|wp_user_id`, entitlements
`membership_plans|plans|subscription_tier`, name `name|display_name`, and query
param `sso` as well as `token`. Login URLs use `/fotw-sso?redirect=` (MSC LoginPage
pattern). Still no MSC code import — contract only.

## 2026-07-23 — Marketing platform architecture (design draft)

`docs/Marketing-Platform-Architecture.md`: lightest high-power acquisition system
built on Labs public SEO/AEO, factory (board/cast/HeyGen/YT), thin attribution
spine — not a second CMS or heavy Martech. Good/Better/Best; Sierra/Tango gates;
flagship-first funnel.

## 2026-07-23 — Marketing architecture rev 2: backend-agnostic + ActiveCampaign

Coach: WooCommerce not required. Marketing rides Labs identity/memberships and
**pluggable commerce** (Stripe native, optional Woo external_url, free signup,
manual grants). **ActiveCampaign** first-class growth adapter (contacts/tags/events),
independent of WP; Labs SMTP stays transactional. CTA resolver abstracts convert
modes. Metrics keyed on membership activations by `source`, not shop vendor.

## 2026-07-23 — Campaigns as first-class factory workflow

Coach: campaigns are peers to courses. Spec:
`Specs/FatTail-Labs-Campaign-Workflow-Spec-v1.0.md` — board `product_line=campaign`,
required package stages (brief, lander, script, video, distribution, vision, growth
hooks), human approve → place lander + `marketing_campaigns` row. Channels YouTube /
X / Instagram in distribution_plan. Marketing architecture rev 3. Implementation
not started; Good MVP = full board workflow + manual social publish.

## 2026-07-23 — Quebec automatic poller + forward progress

Coach: automatic poller ensuring board cards move forward. Spec:
`FatTail-Labs-Quebec-Poller-Spec-v1.0`. Process `server/quebec_poller.py` when
`LABS_QUEBEC_POLLER=1`; each cycle advances queued→scheduled→in_production and
optionally produces next missing package stage (`LABS_QUEBEC_AUTO_PRODUCE`, mode
fixtures|live|auto). Never publishes. Status in `quebec_poller_status` (migration
023); board UI chip + Tick + produce. Manual tick still available.

## 2026-07-23 — Workflow manager design (course submit must start run)

Design draft `docs/Workflow-Manager-Architecture.md`: generic WFM (definitions,
runs, steps, worker) with board as control surface. **draft→queued** for a course
**must** start `course_create` run; worker executes research→plan→script→video→
placement→vision→awaiting_approval. Human still Approve + member publish. Quebec
poller becomes step executor. Campaigns reuse same manager later. Awaiting Coach
decisions before build.

## 2026-07-23 — Content types frozen (four) + Course skills first

Coach ratified `docs/Content-Types-Taxonomy.md`:

| product_line | Shape |
|---|---|
| `course` | Header + ≥1 modules + lessons |
| `tutorial` | Header + exactly one lesson (own type) |
| `youtube_long` | Header + primary video |
| `campaign` | Funnel + landing page + mail list |

Shorts/`other` not first-class factory types for v1. Skills are required for type
components; **Course first** as the most complex pattern. Skill pack:
`skills/course/` — research, lesson-plan, header, resources, lesson-script,
lesson-video, placement, vision, package, and orchestrator `course-create`.
Tutorial / YT Long / Campaign skill packs derive from Course later.

## 2026-07-23 — Course shape refined: Header · Outline · KC · Resources

Coach: a Course has **Header**, **outline with Modules**, **Lessons**, **Knowledge
Check**, and **Resources**. Modules require **description**. Lessons require
**video + markdown**. Skill pack v0.2: `course-knowledge-check` added; plan,
placement, package, and `course-create` enforce the contract.

## 2026-07-23 — Course Blueprint is first validated product (AI chat)

Coach: Header + Outline is the **first product** the system creates that requires
validation. Minimum bar: **descriptions** (course + each module). Primary UX:
**AI chat** (not form-first). Human **Approve Blueprint** before scripts/video/KC
detail. Skill: `skills/course/course-blueprint/`. Second gate remains full package
approval. Two-gate `course-create` pipeline.

## 2026-07-23 — Course Blueprint Chat API shipped

Migration `024_course_blueprint`: `content_blueprints` + item `blueprint_status` /
`blueprint_id`. Module `server/blueprint.py`. Board routes:

- `GET/PUT /api/admin/board/items/{id}/blueprint`
- `POST …/blueprint/chat` (November/Grok live or `use_fixtures`)
- `POST …/blueprint/validate` (min bar: descriptions)
- `POST …/blueprint/approve` (human; writes `lesson_plan` artifact)

Tests: `server/tests/test_course_blueprint.py` (7).

## 2026-07-23 — Course Blueprint board UI (drawer panel)

`web/components/admin/CourseBlueprintPanel.tsx` on course cards in board drawer:
Chat / Preview tabs, fixture toggle, Validate, Approve Blueprint. Card face shows
`bp:` status chip. Drawer widens to `max-w-lg` for courses.

## 2026-07-23 — Blueprint co-pilot doctrine (chat ≠ project input)

Coach: long-running chat must not be the primary project input. **Approved
structured Course Blueprint** is system of record for gate 1; chat is **co-pilot
+ provenance** only. Factory advances by skills/stages after Approve, not by
continuing chat into video. Skills pack v0.4 + UI copy: Preview = product,
Chat = co-pilot; default tab Preview.

## 2026-07-23 — Blueprint streaming chat + full workspace

Coach: streaming + live-default (Grok-like); drawer felt too small.
- `POST …/blueprint/chat/stream` SSE (delta/done/error); xAI `stream=true`
- UI live default (fixtures opt-in); stream bubbles
- Full workspace `/admin/board/blueprint/{id}` — side-by-side chat + preview
- Drawer keeps compact panel + **Open full workspace** link

## 2026-07-23 — Outline workspace is chat-first (primary surface)

Coach: chat should be the full-sized workspace for developing course outline,
modules, and lessons. Board drawer is **launch pad only** (no embedded chat).
Workspace layout: ~60% streaming chat, ~40% live outline product; near-viewport
height; wider admin max width.

## 2026-07-23 — HeyGen batch experiment protocol (3 → 4 → 2)

Coach: discover practical concurrent limit and optimal use empirically — not
assume whole-course dump. Protocol `docs/studio/HeyGen-Batch-Experiment.md`:
Wave A batch 3, B batch 4, C batch 2; fixed prompt template + lesson briefs;
JSONL log + results sheet. Default product remains max_batch=3 until data.

## 2026-07-23 — HeyGen delivery-format experiment (outline / scripts / inline)

Coach: try three payloads for the same Foundation module — (α) module outline
only, (β) outline then separate video scripts, (γ) outline with inline scripts
(slice per lesson). Protocol
`docs/studio/HeyGen-Delivery-Format-Experiment.md` + fixtures under
`docs/studio/experiments/fixtures/`. Concurrent batch held at 2 while comparing
formats; log `delivery_format` on each job.

## 2026-07-23 — HeyGen live Wave A results (batch 3, format β)

Coach: three Foundation lessons via CLI (Dude Primary, separate script prompts).
**Quality very good (5/5).** Cost **~$5.50/video**, duration **~2:55 avg**. Batch of
3 concurrent completed cleanly. Provisional: keep max_batch=3; β (script packets)
credible default; course cost scale ~$55/10 lessons video-only at this density.
Logged in `docs/studio/experiments/`.

## 2026-07-23 — Manual vs System two-course experiment started

Coach: full course manually, then next course via system — learn cost/quality.
Protocol `docs/studio/experiments/manual-vs-system-courses.md`.
**Course A (manual):** Stop the Bleeding Foundations — 2 modules / 6 lessons;
L1–3 done; L4 submitted; L5–6 scripts ready; Labs draft
`/admin/courses/stop-the-bleeding-foundations` with dense video + rich notes.
**Course B (system):** board item 291 + blueprint workspace
`/admin/board/blueprint/291` — Capital Preservation Operators — Daily Discipline.

## 2026-07-24 — Hub intro clips submitted to HeyGen (13 jobs)

Coach plan course-hub-intro-v0.5: role-variant opens/closes + shared body.
Submitted **13/13** Video Agent jobs (body 6–8 separate for Lab re-record), Dude
Primary, landscape. Manifest:
`docs/studio/experiments/hub-intro/MANIFEST.md`. Assemble into 5 hub videos
(Anonymous/Campaign/Observer/Activator/Navigator) in editor with screen-capture
B-roll; gates Hotel/Tango/Coach before publish.

## 2026-07-24 — Human Interface Spec v1.0 (Apple HIG for Labs web)

Coach approved `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` as the GUI
constitution for member site, in-place admin, and `/admin/*`.

**Decisions locked:**
- Apple HIG principles adapted to web (clarity, deference, depth, 44pt targets,
  AA a11y); one component kit, member vs operator density dialects.
- Tokens-only styling; no emoji as chrome; AlertDialog replaces `confirm`/`alert`.
- **Appearance & Chrome Control Plane:** administrators control brand (swatch
  tint enum), chrome nav (allowlisted routes), hub region composition, course
  tabs, announcements, operator shell prefs — typed JSON, draft/publish, no
  freeform CSS/JS.
- Tint: closed swatches only (v1). Font: system/SF stack only (v1). Density:
  admin-published only. Draft preview: admin session + `?appearance=draft`.
  Hub FAQ body stays in-place CMS; appearance toggles region only.

**Delivery:** phases H0–H7 under `agents/p-hig/`. Foundation (H1) and appearance
schema/API (H5 scaffold) ship with first implementation wave.


## 2026-07-24 — Primary nav: Labs hub; Pathway not a top tab

Coach: Pathway remains a product surface (assessment funnel / future role-based
sequencing) but is **not** primary chrome. Primary tabs:
**Courses · Labs · Resources · Live · About · Guide**.

**Labs** (`/labs`) sits between Courses and Resources as the home of member
practice tools: Trade Log, Journal, Playbook, Statistics, Vexy. Tools ship
incrementally; no survey-driven customization UI yet — path personalization will
be seamless by role later.


## 2026-07-25 — Application Framework + Member Data & Privacy (W0 lock)

**Specs approved for build:**
- `Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md` — L1 Display–Edit, L2
  Component Contract, L4 Templates; supersedes In-Place Editing System v1.x.
- `Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md` — Family B isolation,
  dual admin access modes (aggregates vs consented examination), member rights.

**Reviews (gate-reports under `agents/p-app-framework/`):** India, Mike, Echo+Tango,
Hotel+Sierra — all PASS. India amendments applied (L0 privacy co-authority; slot
policy documentation-enforced v1; AF-B1 no admin back door; Journey delete vs
derived progress; isolation key `identity_id`).

**Decisions locked:**
- **F-D1** Application Framework is L1+L2+L4 of record.
- **F-D2** Lesson URLs are regions of Course Presentation (not a separate template).
- **T-D1** Family B private tools in scope; privacy model = Member-Data-Privacy;
  no member-public sharing in v1.
- **T-D2 Cut A** ship now: W0 + **W1 Family A formalize/stay-put**. Cut B (W2+
  privacy spine → Journey → Trade Log → …) after Gate 1; production Family B
  after counsel/DPIA status recorded.
- **T-D3** Journal is a finite Calendar variant (structure only; own data store).
- **T-D4** Calendar/Schedule extends `live_sessions` — no parallel event store.
- **T-D5** Trade Log/Journal process-first; P&L neutral never headline (Hotel).
- **Privacy D-2** default k=5 cohort floor (Mike).
- **Privacy D-3** analytics opt-in default false; separate from examination consent.
- **Privacy D-5** v1 = platform/disk encryption posture; app-level field encryption deferred.
- **Privacy D-1** starter allowlist: completion/progress distributions, tool usage
  counts, streak histograms — no free text, no raw P&L series (Mike).
- **Privacy D-4** sketch: purge authored tools ≤30d after account delete; audit 2y.
- **Privacy D-6** no competitive/public gamified streaks (Tango default).

**Orchestration:** `agents/p-app-framework/` (CHARTER + ORCHESTRATOR + seeds W0–W8).

**Related:** 2026-07-24 primary nav Labs hub hosts future Trade Log/Journal/Playbook.

## 2026-07-26 — DL-061 Canonical Course Model v1.0

**Decision:** Accept Canonical Course Model as the portable, inspectable, validatable
definition of a Course (Coach draft v0.1 evolved to Spec v1.0).

**Locked:**
- Format `fattail.labs.canonical_course`, `model_version` `1.0`.
- **References over duplication** for Resources, Categories, Media, Cast, Live series;
  full copies only in export `bundle`.
- Hierarchy: Course → Module → Lesson → **content_blocks** (discriminated union).
- Runtime MySQL remains SoR for members; document projects to/from lesson columns +
  `extra_blocks_json` for multi-block fidelity.
- Import default `create_draft`; never silent overwrite of **published**.
- ProductionState travels with the document as enrichment; board transitions stay on
  board APIs.
- Legacy Course Package / placement plans adapt **into** this model.
- JSON Schema: `Specs/schemas/canonical-course-v1.json`.

**Shipped with decision (C0–C3 partial + C4 validate hook):**
- Spec + Architecture/08 + Design/09 + `agents/p-canonical-course/`
- Migration `028_canonical_course_model.sql`
- `server/course_model.py` + admin APIs under `/api/admin/canonical-courses/*`
- Characterization: `server/tests/test_canonical_course_model.py`
- Admin: Export package (edit bar) + Import package (catalog)

**Specs:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Orchestration:** `agents/p-canonical-course/ORCHESTRATOR.md`

## 2026-07-26 — DL-061a Canonical Course Model media & free-preview rules

Coach resolved open gap questions on Canonical Course Model v1.0:

| ID | Decision |
|----|----------|
| **CCM-D10** | YouTube is the default and current-only video provider (trailers + lessons). Other providers (e.g. local) deferred. |
| **CCM-D11** | Preserve lesson `kind` exactly: video \| text \| download \| external \| replay \| quiz. |
| **CCM-D12** | Course- and lesson-level resources are **pointers** to the generic Resource type. |
| **CCM-D13** | All media except emoji is a **reference** (Resource pointer or YouTube id). No media ZIP in v1.0; no binary embed. |
| **CCM-D14** | Instructors export **full profiles** (name, bio_md, avatar_url reference, links) in `bundle.instructors[]`; import may create. |
| **CCM-D15** | SEO JSON-LD: platform regenerates for now; package `seo` stays thin/optional. |
| **CCM-D16** | `free_preview` is an **authorization flag only** — free-preview lessons have the same content shape as any lesson. |

**Code:** `server/course_model.py` + Spec Canonical Course Model v1.0 coach-decisions block.

## 2026-07-26 — DL-062 Resource entity (versioned, first-class) Spec v1.0 draft

**Decision:** Resources are first-class versioned materials (logs, worksheets, process
infographics), not solely course-owned attachments.

**Model locked in** `Specs/FatTail-Labs-Resource-Spec-v1.0.md` **(DRAFT pending Coach
formal approval of implementation):**

| ID | Decision |
|----|----------|
| **RES-D1** | First-class Resource; courses **link** (many courses possible) |
| **RES-D2** | Immutable integer versions; edit = new version |
| **RES-D3** | At most one **published** version; **slug → published only** |
| **RES-D4** | Course **pins** a version; course always shows linked resources at pin |
| **RES-D5** | Library visibility = publish flag (`published_version_id`) |
| **RES-D6** | New resources default **unpublished** to hub until explicit publish |
| **RES-D7** | free_preview = access, separate from publish |
| **RES-D8** | Canonical packages use slug + optional pin; no binary embed |
| **RES-D9** | Types include spreadsheet, document, image, link (frequent-update assets) |

**Migration path:** backfill from `attachments` (Resource Library v1.x) → Resource +
Version 1 + CourseResourceLink.

**Status:** Spec drafted 2026-07-26; implementation phases R0–R7 in the spec. Not yet
built as runtime SoR (library still attachment-based until R* ships).

## 2026-07-26 — DL-062a Resource Spec build approved; R1 domain shipped

Coach approved build and started R1. Schema + pure domain ops for first-class
versioned Resources:

- Migration `029_resources.sql`: `resources`, `resource_versions`,
  `course_resource_links`, `resource_migration_map`
- Module `server/resources_domain.py`: create, add_version, publish/unpublish,
  attach/set_pin/unlink, slug resolve
- Tests: `server/tests/test_resources_domain.py` (6) — unpublished default,
  single publish, pin ≠ published, unpublish keeps pin

**Next:** R2 APIs (`agents/p-resources/seeds/R2-alpha-api.md`).

## 2026-07-26 — DL-062b Resources R2 APIs shipped

Member + admin HTTP for first-class Resources (p-resources R2):

- `GET /api/resources` dual-read (published resources + legacy attachments)
- `GET /api/resources/{slug}` published only
- `GET /api/resource-versions/{id}/download` (published or course-pinned; free/alumni gate)
- Admin: `/api/admin/resources`, versions, publish, course attach/pin/unlink/list
- Course detail payload: `resources[]` alongside legacy `attachments`

Tests: `test_resources_api.py` + domain suite (10). Next: R3a hub UI / R3b course UI.

## 2026-07-26 — DL-062c Resources R3a+R3b UI shipped

Member + admin Resources hub (`ResourceLibrary.tsx`): first-class create, version,
publish/unpublish; dual-read legacy attachments. Course builder
(`CourseResourcesEditor`): attach existing, create+link, pin picker, free, unlink.
Course Resources tab lists pins + legacy attachments.

## 2026-07-26 — DL-062d Resources R4 attachment backfill

Idempotent migrator `server/migrate_attachments_to_resources.py`:
- Course attachments → Resource + v1 + course link; publish v1 if course published
- Lesson attachments → link with lesson_id; not auto-published to hub
- Map table `resource_migration_map` for re-runs
- Type inferred from kind/url/title (spreadsheet/image/document/link)

Tests: `test_resources_migration.py`. Next: R5 Canonical Course package pins.

## 2026-07-26 — DL-062e Resources R5 Canonical Course package pins

Canonical export includes `resource_ids` (slugs) and `resource_links`
[{slug, pinned_version, free_preview}]. Bundle carries metadata URL refs only.
Import resolves slug (or creates from bundle), attaches with pin via
resources_domain. Wipe path clears course_resource_links. Test:
test_export_import_resource_slug_pin (U9).

## 2026-07-26 — DL-062f Resources R6 cutover (single SoR)

Library and course member surfaces use first-class Resources only:

- `GET /api/resources` drops attachment dual-read
- Course public payload `resources[]` only (attachments empty)
- `POST /api/admin/courses/{slug}/attachments` creates Resource + link (compat)
- Legacy `GET /api/attachments/{id}/download` retained for old URLs only

Next: R7 project close.

## 2026-07-26 — DL-062g Resources R7 project close PASS

p-resources v1.0 closed. Evidence: 34 pytest (resources + canonical + production
packages); R7_SMOKE U1–U10; no outbound fetch on resource paths. Spec status
approved as built. Residuals: lesson attach UI, attachment row cleanup, bulk repin.

## 2026-07-26 — DL-063 Section hubs (Labs, Resources, Live) CMS + SEO

Labs, Resources, and Live are first-class **section hubs** using `site_pages`
(same pattern as course hub `slug=hub`):

- Fields: `title`, **`description_md`** (markdown for members + crawlers)
- Public: `GET /api/site-pages/{slug}` for `labs` | `resources` | `live` | `hub`
- Admin: `PUT /api/admin/site-pages/{slug}` (in-place **Edit hub** on each page)
- SEO: generateMetadata from CMS + CollectionPage JSON-LD; Live keeps Event JSON-LD
- Sitemap includes `/labs` and `/resources`
- Migration `030_section_hub_pages.sql` seeds default doctrine-safe copy

## 2026-07-29 — DL-064 Member Profile + Journey visibility (presence roster)

**Coach intent:** Refashion header account menu; consolidate My Learning + Dashboard
into **Profile** preferences and **Journey** as the single progress surface.

**Product decisions:**
- Menu: Continue Learning strip + **Profile** + **Journey** (+ member/admin/sign out)
- `/me` = Profile (display name, avatar upload, Journey visibility)
- `/app/journey` owns enrollments, quizzes, activity, pathway, next live
- `/dashboard` redirects to Journey
- Journey **presence roster** (opt-in): display name + avatar only — not a P&L or
  progress ranking; private-by-default (`journey_visible=0`)

**Privacy amendment:** Member-Data-Privacy MR-1 “no sharing v1” amended for this
surface only (opt-in name/photo). Family B content remains private.

**Implementation:** migration `042_member_profile.sql`; APIs `GET/PATCH /api/me/profile`,
avatar POST/DELETE, `GET /api/journey/presence`; `/api/auth/me` returns `avatar_url`.
Spec: `Specs/FatTail-Labs-Member-Profile-Journey-Visibility-Spec-v1.0.md`.
Tests: `tests/test_member_profile.py` (5 passed).

## 2026-07-29 — DL-065 Journey gamification (self presence + community board)

**Coach intent:** Gamify Labs as presence for self and community so members are
seen as people who **contribute**, and can gauge **personal growth** vs process peers.

**Locked:**
- Opt-in via existing `journey_visible` (default off)
- Pillars: Reputation, Personal Growth, Attendance streak, Contribution (rank axis)
- v1 events: course completion, threads/comments/reviews, lessons/quizzes, live check-in
- **Strategy Life Cycle / Strategy Lab sharing reserved** for a later Spec addendum
  (never auto-publish private strategy content)
- Framing: process peers, not P&L competition (amends Privacy D-6 for opt-in only)
- Derive-on-read in `server/journey_scores.py`; migration `043_journey_gamification.sql`
- Spec: `Specs/FatTail-Labs-Journey-Gamification-Spec-v1.0.md`

**APIs:** `GET /api/me/journey/scores`, `GET /api/journey/leaderboard`,
`POST|GET /api/live/check-in`.

## 2026-07-29 — DL-066 Granular Journey share (community vs personal growth)

**Coach:** Community presence can be tailored. Members may keep personal growth
as a trader completely private while increasing community presence.

**Ship:** `share_reputation` (default on), `share_personal_growth` (default **off**),
`share_attendance` (default on). Board ranks by **public contribution** (shared pillars
only). Unshared pillars return null on leaderboard. Migration `044_journey_share_pillars.sql`.

## 2026-07-29 — DL-067 Member login-landing at /home

**Coach mock:** `landing.png` (First Movers–style member home).
**Ship:** `/home` MemberHome — welcome + streak, continue hero, process CTA,
my learning progress tabs, recommended courses, right rail (activity, achievements,
community board compact, get started). Login/SSO/dev-login redirect → `/home`.
Journey remains deep scores surface; Profile visibility unchanged.

## 2026-07-29 — DL-068 Personal standing = process meter (not achievements)

**Coach:** Personal progress is not about winning achievements — it is a **meter**
for how well you do the work that improves long-term success (daily routine,
retrospectives, growth, live presence, plan adherence).

**Ship:** `process_meters()` on `/api/me/journey/scores` → `process` payload;
`ProcessMeter` UI on `/home` Personal standing and Journey. Community presence
stays separate (reputation / board). No P&L in meters.

## 2026-07-29 — DL-069 Process meter includes practice persistence

**Coach:** Meter also measures **persistence** with the things that advance practice
(Trade Log, Journal, lessons, live) — not only short-window routine.

**Ship:** `practice_persistence` / `persistence` meter (12-week window, target 8 weeks);
included in overall process health. Spec §3.2b updated.

## 2026-07-29 — DL-070 Process meter profiles by membership

**Coach:** Meter profiles — Observer ~6-week focus; Navigator monthly vs yearly
adjusts persistence horizon.

**Ship:** `resolve_meter_profile` + profiles in `journey_scores.py`;
`process.profile` on `/api/me/journey/scores`; UI chip for profile/horizon.

## 2026-07-29 — DL-070 Process meter profiles by membership

**Coach:** Meter profiles — Observer ~6-week focus; Navigator monthly vs yearly
adjusts persistence horizon.

**Ship:** `resolve_meter_profile` + profiles in `journey_scores.py`;
`process.profile` on `/api/me/journey/scores`; UI chip for profile/horizon.

## 2026-07-29 — DL-071 G1 north star: Observer → Navigator + continued practice

**Coach:** Goal for Observers is to **maximize chance they upgrade to Navigator
and continue their practice** (process-first; not “leave happy” as co-equal target).

**Docs:** `docs/Dual-Goal-Product-Strategy-2026-07-29.md` G1 success + metrics updated.
**Product:** Observer trial process-meter copy; `/home` G1 framing + honest
“Continue as Navigator” CTA (membership). Alumni fairness remains doctrine.

## 2026-07-29 — DL-072 Journey Experience Spec v1.0

**Decision:** Land umbrella Spec for Journey as-built experience + implementation:
`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`.

Covers: dual standing (process meter vs community board), G1/G2, meter profiles,
share pillars, APIs, routes (/app/journey, /home, /me), live check-in, DS-2 no second
store, frontend/backend file maps, verification, DL index. Gamification Spec remains
formula detail; Profile Visibility remains opt-in fields.

## 2026-07-29 — DL-073 Process integrity grade scale (Poor→Excellent)

**Coach:** Process health 
## 2026-07-29 — DL-073 Process integrity grade scale (Poor to Excellent)

**Coach:** Process health percent also presented as color grades aligned with trading-psych norms (journal process scores).

**Scale:** Poor (0-24) · Fair (25-49) · Good (50-69) · Great (70-84) · Excellent (85-100).
Colors and blurbs are process-focused (not P&L / identity shame). API `process.grade` +
`grade_scale`; UI badge + segmented scale on ProcessMeter. Spec Journey Experience §4.0b.

## 2026-07-29 — DL-074 Tenure-weighted process grades (earn extremes)

**Coach:** Fresh members cannot start at Poor; time in the game weights grades.
Extremes (Poor / Excellent) are earned — square ease-in toward center until
profile grade_ramp_days. Establishing grade for early zero-signal period.


## 2026-07-29 — DL-075 Journey Experience Spec updated (grades + tenure)

**Decision:** Refresh `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` as-built for:
process integrity grade scale (Poor-Excellent + Establishing), tenure-weighted grades,
needle UI, G1 success criteria, scores API shape, verification 8-11, DL index through
DL-074. Journey Gamification Spec 3.2b/c points at Experience Spec as canonical meter detail.


## 2026-07-29 — DL-076 Session idle timeout (15–60 min, default 30)

**Coach:** Timeout after no activity for every role except admin. Default 30 minutes;
member may set 15–60. On timeout: logout and return to login page.

**Ship:** migration `045_session_idle_timeout.sql`; Profile + auth/me fields;
`IdleSessionGuard` client; login `?idle=1` notice. Journey Experience Spec §2.3b.


## 2026-07-29 — DL-077 Retrospective Spec v0.2 (Coach model)

**Coach intent:** A Retrospective is started in the **trading journal** by selecting
journal type Retrospective. That tells the system to **gather all work since the last
retrospective** (or **maiden journey** if none). Gather produces a dual report:
**actual P&L performance** + **process performance**, plus **Process Integrity** review.
If prior retros exist, **compare for progress**. Agent analysis flags **concerns**,
helps uncover **root cause(s)**, and drafts **habit-altering plan(s)** (member owns plans).

**Spec:** `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.2.md` (direction approved;
implementation slices R1–R5 not yet built). v0.1 remains historical + P0 shell honesty.


## 2026-07-29 — DL-078 Retrospective R1–R3 build

**Ship:** Journal-Retrospective Spec v0.2 slices R1–R3.
- Migration `046_retrospectives.sql` (`member_retrospectives`)
- Domain `server/retrospective_domain.py` + routes `server/routes/retrospectives.py`
- Create from Journal type **Retrospective** or `/app/retrospective` Start
- Gather: dual P&L + process report, Process Integrity, prior comparison / maiden
- Complete sets next scope boundary; one open retro at a time
- UI: library, workspace `/app/retrospective/[id]`; agent R4 deferred
- Tests: `tests/test_retrospectives.py`


## 2026-07-29 — DL-079 Retrospective Spec v0.4 (advisor draft)

**Action:** Landed `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.4.md` for India /
Hotel / Tango / Mike / Sierra / Delta review, then Coach GO and implementation plan.

Unifies v0.2 gather model + v0.3 process-first quality fixes; reconciles as-built R1–R3;
MIN_INFERENCE_N default 20; process-first workspace; collapsed book performance;
normalized comparison; agent anchoring; habit plan cap 2. Not yet Coach-approved for
build of R1b–R7 deltas.


## 2026-07-29 — DL-080 Observer trial on retros; Activator is legacy

**Coach:** Only **Observer trial** (among free/trial populations) gets retrospective
create + G1 cadence story. **Activator is legacy** — self-directed traders, not
advertised, few signups; keep technical Practice/retro access. Marketed path is
**Observer trial → Navigator**. Free observer with no trial plan: no retro create.

Landed in: Retrospective cadence delta §E.2 (closed); Journal-Retrospective Spec v0.4
entitlement + dual-goal map; Dual-Goal Product Strategy tier note.


## 2026-07-29 — DL-081 RT0-1 Spec fold (Retrospective v0.5 + Journey §4.1a)

**India (p-retrospective RT0-1):** Landed build-authority draft Specs:
- `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` (v0.4 + cadence delta fold)
- Journey Experience Spec §4.1a retrospective cadence meter + `retro_horizon_days` on §4.4
Coach structural ack / full GO remains after W0 reviews (RT0-2…G).

## 2026-07-29 — DL-082 RT0-2 Hotel sample gate (`MIN_INFERENCE_N=20`)

**Hotel (p-retrospective RT0-2), India APPROVED:**
- Locked **`MIN_INFERENCE_N = 20`** trades for outcome sample banner, no outcome-trend language, and suppression of outcome-corroborated agent hypotheses. Change only via Spec bump.
- Banner locked: *"This is a small sample. It describes what happened; it does not measure process quality."* (precision fix vs “whether process is working.”)
- Deviations remain legitimate at n=1; P&amp;L stays neutral sample. Domain constant required (no UI-only magic number).
- Tango RT0-3 still owns shame/cadence tone; must not reintroduce resulting.

## 2026-07-29 — DL-083 RT0-3 Tango member-facing copy

**Tango (p-retrospective RT0-3), Hotel APPROVED on sample-banner interaction:**
- Locked carry-forward evidence language; collapsed book chrome; nudge strings N1–N3; meter labels/tooltip; dismiss = **Not now**.
- Accepted Hotel RT0-2 sample banner without diluting process/outcome split.
- Added Retrospective Spec **§19** banned-phrase glossary (resulting, cadence shame, carry-forward moralizing, book bait, person grading).
- Invariant: nudge and meter never cross-link in copy (“start or lose points” banned).

## 2026-07-29 — DL-084 RT0-4 Mike isolation + plan entitlement

**Mike (p-retrospective RT0-4), India APPROVED:**
- Create/gather: **admin OR role activator+ OR active membership plan slug `observer-trial`** (live `memberships`+`plans.slug`). Free no-plan **403**. Not role-only for trial (as-built role gate admits trial only because grants_role=navigator).
- Isolation: `identity_id` only; cross-member GET → **404**; body identity ignored; PD-8 no admin raw Family B.
- Family B forever: pre_market quotes, report/agent JSON, book sample; Option C no coverage indicator.
- Attack notes A1–A8 for RT1-2 characterization. R1b implements plan-aware gate.

## 2026-07-29 — DL-085 RT0-5 Sierra marketing boundary

**Sierra (p-retrospective RT0-5), Tango APPROVED:**
- Retrospective book performance / dual-report P&amp;L is **never** a public acquisition source.
- Spec **§20**: ban public member-results pages, SEO/AEO derived from retros, testimonials/ads quoting retro book, public board leakage, average-P&amp;L marketing stats.
- Explicit non-goal: no SSR/index of member results from `member_retrospectives`; no marketing export pipeline in v0.5.
- Catalog may describe the *feature* (practice loop) without sample numbers. Process-outcomes doctrine unchanged.

## 2026-07-29 — DL-086 RT0-G Spec lock PASS (p-retrospective W0)

**Delta:** Gate **PASS** — all eight checklist items evidenced.
Report: `agents/p-retrospective/gate-reports/RT0-G-spec-lock.md`.
Build authority: Retrospective Spec v0.5 + Journey §4.1a (after **Coach GO**).
Residuals: Coach GO; then Juliet RT0-0 freeze; do not start R1b without GO.

## 2026-07-29 — DL-087 Coach GO + RT0-0 board freeze (p-retrospective)

**Coach GO** on Journal Retrospective Spec v0.5 + Journey Experience §4.1a.
**Juliet RT0-0:** Program status **BUILDING**; seed list frozen (no silent adds); non-goals reaffirmed; parallelism rules active; R5 left open for RT5-0 GO/DEFER.
Freeze note: `agents/p-retrospective/gate-reports/RT0-0-board-freeze.md`.
Next: **RT1-1** (Alpha — schema + plan-aware entitlement).

## 2026-07-29 — DL-088 RT1-1 plan-aware entitlement + R1b schema

**Alpha (p-retrospective RT1-1), Mike · India APPROVED:**
- Migration `047_retrospective_r1b.sql`: `member_habit_plans`; `identities.retrospective_pnl_expanded` default 0.
- Create/gather/preview: `can_create_or_gather` = admin OR role activator+ OR active plan slug `observer-trial` (live memberships). Free no-plan **403**.
- List/get/patch/complete/abandon: session + `identity_id` isolation (downgrade preserves own rows); draft→complete gather still gated.
- Characterization: trial create OK (observer cookie + plan), free 403, activator OK, cross-member 404, concurrent 409.

## 2026-07-29 — DL-089 RT1-2 entitlement/isolation characterization

**Kilo (p-retrospective RT1-2), Alpha · Mike APPROVED:**
- Extended `tests/test_retrospectives.py` — 11 tests, run twice green (flake check).
- Covers seed matrix + A1 body identity spoof ignored, A5 expired trial → 403 (live membership), A6 concurrent 409, unit matrix for `can_create_or_gather`.
- Residual: stale JWT navigator after trial expiry still passes role path until session re-issue (Mike session lifecycle).

## 2026-07-29 — DL-090 RT1-G R1b phase gate PASS

**Delta:** Gate **PASS** — migration 047 live; entitlement matrix + isolation proven (11 pytest); no UI scope this phase.
Report: `agents/p-retrospective/gate-reports/RT1-G-r1b.md`.
Next: RT2-1 process-first gather DTO.

## 2026-07-29 — DL-091 RT2-1 retrospective report DTO contract

**India · Alpha (p-retrospective RT2-1), Charlie APPROVED:**
- Locked workspace/`report_json` contract: `Architecture/12-retrospective-report-dto.md` (version 0.5 target + v0.2 fallback map for Charlie).
- Domain stubs: `MIN_INFERENCE_N`, `SAMPLE_BANNER`, `ReportV05` TypedDict in `retrospective_domain.py`.
- Gather fill remains RT2-2; UI may start RT2-3 on contract + fallbacks.

## 2026-07-29 — DL-092 RT2-2 process-first gather (report v0.5)

**Alpha (p-retrospective RT2-2), India · Hotel APPROVED:**
- `gather_report` emits Spec §6 process rates, integrity_review, deviations (broke + journal gap N=3, max 5), what_worked (process-only), book_performance with sample gate (`MIN_INFERENCE_N=20`, Hotel banner).
- Option C scope boundaries unchanged. `pnl` alias retained for compat. carry_forward / expected_vs_actual null until R4/R6.
- Characterization: 13 tests green including sample-gate assertions.

## 2026-07-29 — DL-093 RT2-3 process-first workspace UI

**Charlie (p-retrospective RT2-3), Echo · Tango APPROVED:**
- `RetrospectiveWorkspace` render order matches Spec §6; book last and **collapsed by default**.
- Expand preference: `identities.retrospective_pnl_expanded` via `GET/PATCH /api/me/profile`.
- Toggle copy: Show/Hide book sample; collapsed summary + sample banner when expanded.

## 2026-07-29 — DL-094 RT2-4 report/UI characterization

**Kilo (p-retrospective RT2-4), Alpha · Charlie APPROVED:**
- Extended `tests/test_retrospectives.py` to 18 cases; run twice green.
- Proved sample_below_min true at n=7 and false at n=22; DTO required keys; profile expand pref; workspace §6 source order.

## 2026-07-29 — DL-095 RT2-G R2b phase gate PASS

**Delta:** Gate **PASS** — process-first UI order; book collapsed + sample gate; deviations bounded; 18 pytest green.
Report: `agents/p-retrospective/gate-reports/RT2-G-r2b.md`.
Next: RT3-1 normalized comparison.

## 2026-07-29 — DL-096 RT3-1 normalized comparison (§7)

**Alpha (p-retrospective RT3-1), India · Hotel APPROVED:**
- Comparison emits `metrics[]` with rates, `window_days`, `n`, `comparable` / `comparable_reason`.
- Floors: activity `window_days < 14`; adherence/book `n < 20`; window length ratio **≥ 3** not comparable (21d vs 63d).
- Heading: “This window (Nw) vs previous (Mw)”. Integrity delta only when comparable.

## 2026-07-29 — DL-097 RT3-2 comparison UI

**Charlie (p-retrospective RT3-2), Tango APPROVED:**
- Workspace renders §7 heading + side-by-side metric values; “Not comparable” when `comparable=false` (no arrows/delta pts).
- Maiden: baseline copy only. Integrity grades as labels, not trend theater.

## 2026-07-29 — DL-098 RT3-3 comparison characterization

**Kilo (p-retrospective RT3-3), Alpha APPROVED:**
- 30 tests (×2 green): 21d vs 63d all metrics not comparable; book per-trade math; adherence n-floor; UI Not comparable markers.

## 2026-07-29 — DL-099 RT3-G R3b phase gate PASS

**Delta:** Gate **PASS** — normalized comparison payload; UI suppresses non-comparable deltas; 21d vs 63d tests green (30 pytest).
Report: `agents/p-retrospective/gate-reports/RT3-G-r3b.md`.
Next: RT4-1 habit plans.

## 2026-07-29 — DL-100 RT4-1 habit plans API + cap

**Alpha (p-retrospective RT4-1), Mike · India APPROVED:**
- CRUD `/api/me/habit-plans`; `observable_signal` required enum; states proposed→active→kept|partial|lapsed|retired.
- Max **2** active per identity → **409** (row lock + count). Isolation by `identity_id`.
- Gather `carry_forward` populated for non-maiden when plans exist.

## 2026-07-29 — DL-101 RT4-2 carry-forward UI

**Charlie (p-retrospective RT4-2), Tango · Echo APPROVED:**
- Workspace opens with carry-forward first (maiden: absent); empty Tango copy when no plans.
- Member sets Kept / Partial / Lapsed via habit-plans PATCH; no success/fail moralizing.

## 2026-07-29 — DL-102 RT4-3 habit plan characterization

**Kilo (p-retrospective RT4-3), Alpha APPROVED:**
- 12 tests ×2 green: third active 409, maiden carry_forward null, empty non-maiden message, isolation 404, invalid transition 409, UI maiden gate.

## 2026-07-29 — DL-103 RT4-G R4 phase gate PASS

**Delta:** Gate **PASS** — max 2 active 409; carry-forward first in UI; isolation OK; 42 pytest (habit + retro).
Report: `agents/p-retrospective/gate-reports/RT4-G-r4.md`.
Next: **RT5-0** Coach GO/DEFER agent analyze.

## 2026-07-29 — DL-104 RT5-0 Coach GO agent analyze

**Coach:** **GO** on retrospective agent path (p-retrospective R5).
- Ship `POST …/analyze` with Spec §8 constraints (anchoring, sample gate, symmetry).
- Observer trial: agent **off by default** (config to open later).
- Missing agent config → fail loud (no silent empty analysis).
- Local deterministic analyzer allowed when `LABS_RETRO_AGENT_MODE=local`.
Report: `agents/p-retrospective/gate-reports/RT5-0-agent-go.md`.
Next: RT5-1.

## 2026-07-29 — DL-105 RT5-1 agent analyze endpoint

**Alpha · Mike (p-retrospective RT5-1), India · Hotel · Tango APPROVED:**
- `POST /api/me/retrospectives/{id}/analyze`; `LABS_RETRO_AGENT_MODE=local` or **503**.
- Validation: anchors required; no P&amp;L-origin hypotheses; symmetry what_worked; sample gate.
- Trial agent off unless `LABS_RETRO_AGENT_TRIAL=1`. Local analyzer from staged report.

## 2026-07-29 — DL-106 RT5-2 agent panel UI

**Charlie (p-retrospective RT5-2), Tango APPROVED:**
- Workspace agent panel: Run analysis; show what_worked / concerns / hypotheses / proposed plans.
- Human gate: edit title → Accept (creates proposed habit plan) or Reject. No profit copy.

## 2026-07-29 — DL-107 RT5-3 agent validation characterization

**Kilo (p-retrospective RT5-3), Alpha · Mike APPROVED:**
- 14 tests ×2 green: empty anchors rejected; symmetry what_worked; isolation 404; sample-gate drops P&L-supported hyps; 503 unconfigured; trial 403.

## 2026-07-29 — DL-108 RT5-G R5 phase gate PASS

**Delta:** Gate **PASS** (Coach GO path) — analyze endpoint; fail-loud config; validation; trial off; UI accept/reject; 56 pytest.
Report: `agents/p-retrospective/gate-reports/RT5-G-r5.md`.
Next: RT6-1 (what worked / expected vs actual).

## 2026-07-29 — DL-109 RT6-1 what worked + expected vs actual gather

**Alpha (p-retrospective RT6-1), Hotel · Tango APPROVED:**
- `what_worked`: adherence runs, journal stretch, adverse “followed on negative book day” without printing P&amp;L figures.
- `expected_vs_actual`: from `pre_market` notes (surface or journal markers); **null** if none; intent verbatim after marker strip.

## 2026-07-29 — DL-110 RT6-2 what worked + expected vs actual UI

**Charlie (p-retrospective RT6-2), Tango APPROVED:**
- Workspace §6.4–6.5 polish: process-only framing; stated intent / what executed grid; honest empty; gap optional.

## 2026-07-29 — DL-111 RT6-G R6 phase gate PASS

**Delta:** Gate **PASS** — what_worked / expected_vs_actual present or honestly absent; no P&amp;L figures in adverse what-worked; 33 pytest.
Report: `agents/p-retrospective/gate-reports/RT6-G-r6.md`.
Next: RT7-1 cadence meter.

## 2026-07-29 — DL-112 RT7-1 retrospective cadence meter

**Alpha (p-retrospective RT7-1), India · Tango APPROVED:**
- Meter profiles carry `retro_horizon_days` (trial 42 / monthly 30 / annual 90 / free n/a).
- `retrospective` meter uses §4.1a formula; not `soon`; E1–E3 empty; only `completed_at` moves clock; `nudge` when d>H.

## 2026-07-29 — DL-113 RT7-2 cadence UI + nudge

**Charlie (p-retrospective RT7-2), Tango · Echo APPROVED:**
- ProcessMeter shows Retrospective cadence with grade chip (not soon; empty = "—").
- `RetroCadenceNudge`: Tango N1 + **Not now** (session dismiss); home, journey, retro library.
- No grade↔late cross-link in copy.

## 2026-07-29 — DL-114 RT7-3 cadence verification (§D.2 10–17)

**Kilo (p-retrospective RT7-3), Alpha APPROVED:**
- Characterization in `test_journey_scores.py`: formula boundaries, open/abandoned clock, E2 grace excluded from average, free observer empty, maiden live 100, nudge↔horizon same field, UI copy sweep + N1 dismiss.
- Suite: 23 passed ×2. Comment-only fix on `RetroCadenceNudge.tsx` so whole-file sweep does not match banned tokens in docs.
- Next: RT7-G phase gate.

## 2026-07-29 — DL-115 RT7-G R7 phase gate PASS

**Delta (p-retrospective RT7-G):** R7 cadence meter + nudge **PASS**.
- Meter un-soon; formula + E1–E3 + completed_at-only clock proven; nudge/horizon single field; copy sweep clean.
- Gate re-run: `test_journey_scores.py` 23 passed; adjacent retro/habit/agent 59 passed.
- Report: `agents/p-retrospective/gate-reports/RT7-G-r7.md`.
- Next: RT8-1 as-built + program close.

## 2026-07-29 — DL-116 RT8-1 Journal Retrospective as-built (program close docs)

**Lima · India (p-retrospective RT8-1), India APPROVED; Coach pending RT8-G:**

**Decision:** Land **Spec v0.6** as as-built product truth for Journal Retrospectives. v0.5 remains historical build authority (Coach GO). Locked product decisions (Option C, MIN_INFERENCE_N=20, §10.1 entitlement, cadence formula, copy/marketing locks) are unchanged. Honesty and residuals live in v0.6.

**As-built shipped (R1b–R7, gates RT0-G…RT7-G PASS):** plan-aware create; process-first gather/UI; normalized comparison; habit plans (max 2); local agent analyze; what worked / expected vs actual; cadence meter + N1 nudge.

**Docs updated:** Spec v0.6; v0.51 marked non-binding (H=7 draft ≠ shipped trial H=42); Journey §4.1a R7 shipped; Architecture 02/03/04/12 + README; CHARTER DoD.

**Residuals (not shipped — do not claim):** cost-of-deviation counterfactual; external agent LLM; trial agent default-on; N2/N3 nudge rotation; Journey milestone feed from complete; alumni create TBD.

**Suite snapshot:** 82 passed (`test_retrospectives` + habit + agent + journey_scores).

**Next:** Delta **RT8-G** program gate.

## 2026-07-29 — DL-117 RT8-G p-retrospective program COMPLETE

**Delta (p-retrospective RT8-G): PASS — program closed.**

- CHARTER Definition of Done satisfied; phase gates RT0-G…RT7-G + RT8-G all **PASS** on file.
- Live suite: retro + habit + agent + journey_scores **82 passed**.
- As-built truth: Spec **v0.6**; decisions from v0.5 locks unchanged.
- Residuals (cost-of-deviation, external agent LLM, trial agent default-on, N2/N3 rotation, Journey milestone feed, alumni create) remain explicit non-ship — not blocking.
- Report: `agents/p-retrospective/gate-reports/RT8-G-program-close.md`.
- Board: **COMPLETE**. Future residual work requires a new Spec / new board.

## 2026-07-29 — DL-118 Spec v0.51 cadence teaching horizons (Coach amendment)

**Coach decision (landed after RT8-G close as post-close amendment):**

1. Retrospectives are immutable process, not gated features — Observer trial full create path remains.
2. **Cadence horizons are teaching rhythms:** Observer trial **weekly** (`retro_horizon_days = 7`). Navigators own rhythm after convert (monthly 30 / annual 90). Alumni **90**.
3. **Meter is signal, not enforcement** — one of six process meters; integrity is contextual.

**Code:** `journey_scores.py` — trial H **7** (was 42); alumni H **90** (was 60). `grade_ramp_days` trial still **42** (tenure ≠ cadence).

**Docs:** Spec v0.51 restored as COACH AMENDMENT; Journey §4.4; Spec v0.6 honesty; `Specs/Advisor-Gates-Retrospective-v0.51.md` filed; CHARTER G1 H=7.

**Tests:** profile assertions updated in `test_journey_scores.py`.

## 2026-07-30 — DL-160 Journal Session Spec v0.5 BUILD AUTHORITY (Coach GO)

**Coach (p-journal-session-v05 J0-0):**

- Spec: `Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md` → **BUILD AUTHORITY**
- Product: chatbot = journal; interview on request → bar; no second write path
- **Tags:** Tag Manager v0.3 only; admin vocabulary; members assign via **compact control +
  list window** (not chip wall); never gate/script/instruct agent
- **Retro nav:** Session action, not a system tag
- **Seal:** retrospective complete only, scope-true
- Prerequisite Tag Manager shipped (DL-159)
- Board: `agents/p-journal-session-v05/` · plan
  `docs/Journal-Session-v0.5-Implementation-Plan.md`
- §17 open items residual unless they block critical path (voice optional; principals interim)

## 2026-07-30 — DL-159 Tag Manager v1 land (admin lexicon)

**Coach locks + Alpha/Charlie (p-tag-manager):**

- **Admin-only** tag definition CRUD; members **assign/unassign** existing tags only
- No `/me` tag manager; no free-text auto-create; no personal tag ownership table
- Schema mig **053**: `tag_categories`, `tags`, `tag_assignments` + seed vocabulary
- APIs: `GET /api/tags`, assign PUT/POST/DELETE, admin `/api/admin/tags` (+ merge, retire)
- UI: `/admin/tags` Tag Manager; Resources hub **Library | Lexicon** browse
- `TagPicker` component for Practice consumers (Journal next)
- Export journal sessions include assigned tags; purge removes assignments
- Tests: `tests/test_tags.py` (7 passed)
- Spec v0.2 personal-tier text superseded by product locks; amend to v0.3 residual
- **Journal Session v0.5 J1 unblocked** after this program (TM ready)

## 2026-07-30 — DL-158 Journal Session v0.4a program land (J1–J9)

**Alpha · Charlie · Kilo (p-journal-session-v04 autonext after JS0-0 GO):**

- Migration **052**: tags join, absence keys, closed denorm, market_calendar_config,
  status map partial→open, sealed→closed iff closure exists
- Domain: optional tags; create without tag; seal deprecated no-op (stays open);
  dual-read includes open pre_market + pre_open turns; retro complete closes sessions
- Agent: `llm|local|off`; once-only keys; no depth refusal; RTH quiet/silent; LLM path
  via `ai.client.complete`; plain-text degrade
- UI: **Start conversation** primary; closed status labels
- Tests: journal 52 + retro suite green (85 combined)
- Gates: JS0-G…JS9-G PASS · board COMPLETE

## 2026-07-30 — DL-157 Journal Session Spec v0.4a BUILD AUTHORITY (Coach GO)

**Coach (p-journal-session-v04 JS0-0) · India:**

- Spec: `Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md` → **BUILD AUTHORITY**
- Board: `agents/p-journal-session-v04/` (v0.2 board complete and **not reopened**)
- **Locks:**
  - **§20.9 scope-true closure** — close NY dates from `scope_start` through gather−1
  - **§20.11 agent mode** — product `llm` when configured; `local` test/offline only;
    `off` fail-loud; member plain-text always available
  - **§20.10** — no Journal create without Practice membership (planless/lapsed)
  - **§20.6 interim** — `agent_service` + member session Family B ACL until P2 principals
  - **Migration** — `partial`→`open`; `sealed`→`closed` only if a closure covers the date,
    else `open`; never reopen grandfathered closed dates
- Product frame: chat primary · optional structured · phase gate · one seal on retro complete
- Program executes J1–J9 autonomously under this GO

## 2026-07-30 — DL-156 Journal agent chat default ON (product flip)

**Coach product lock (post JS3-G):**
- **Agent interview chat is the default primary path.** Structured form is the
  **alternative**, not the default UI surface.
- `LABS_JOURNAL_AGENT_MODE`: unset → **`local`** (was default `off` per DL-148).
  Explicit `off` still fails loud on agent routes (503). Form always available.
- Code: `journal_session_agent.agent_mode()` default local; day view form collapsed
  behind “Structured form · alternative”; chat remains above.
- Spec board line updated. Dev `.env`: `LABS_JOURNAL_AGENT_MODE=local`.
- Tests: `test_agent_off_fail_loud` uses explicit off; `test_agent_default_mode_is_local`.

## 2026-07-30 — DL-155 p-journal-session program complete (J5–J9)

**Juliet autonext (Coach: seeds to gates without pause):**
- **J5** media: mig 050 · `journal_session_media` · attach API · isolation 404 · private Cache-Control
- **J6** export `fattail.labs.journal_session` dual-read in pack/zip; purge sessions+media
- **J7** retrospective tag navigate-only (422 create)
- **J8** mig 051 `identities.is_demo`
- **J9** as-built + **JS9-G PASS** program close
- Residuals: full session import rehydrate, LLM agent path, media paste UI polish, Journey wording

## 2026-07-30 — DL-154 JS4 date closure + JS4-G PASS

**Alpha · Charlie · Kilo · Delta (p-journal-session J4):**
- On retro complete: write `member_journal_date_closures` for NY days strictly before
  gather date; gather stays open. Preview + list APIs; 409 with retro link.
- UI: complete confirm names dates; journal day closed banner.
- JS4-G **PASS**. Suite 51+. Next: **JS5** private media.

## 2026-07-30 — DL-153 JS3-G Delta phase PASS

**Delta (p-journal-session JS3-G):**
- Verdict **PASS** — `gate-reports/JS3-G-phase.md`. Agent path: mode off-by-default,
  Appendix A, D7/D8, validator + form fallback, chat UI, **49 tests**.
- Next: **JS4-1** date closure (autonext per Coach).

## 2026-07-30 — DL-152 JS3-4 journal agent characterization (Kilo)

**Kilo (p-journal-session JS3-4) · Alpha · Mike:**
- Expanded agent tests: validator corpus, intraday silent, isolation on agent
  routes, observer-trial agent, depth status, no author escalation.
- Flake check: **49 passed** ×2. Next: **JS3-G** Delta phase gate.

## 2026-07-30 — DL-151 JS3-3 journal interview chat UI

**Charlie (p-journal-session JS3-3) · Tango:**
- `SessionInterviewChat` on day view: agent transcript, depth budget, auto first
  probe, member reply via `…/agent/turn`; intraday quiet hint; clean_day max-1 copy;
  form fallback uses Appendix B tone (no “AI failed”).
- Structured form remains always below. `tsc --noEmit` clean.
- Next: **JS3-4** Kilo agent tests · JS3-G.

## 2026-07-30 — DL-150 JS3-2 agent turn validator + form fallback

**Alpha (p-journal-session JS3-2) · Mike:**
- `journal_session_validator.py` — Spec §8.2 block rules before render.
- One retry with safe fallback; double-fail → form_fallback, **no** agent row inserted.
- Wired in `run_agent_turn`. Tests: **42 passed**. Next: **JS3-3** chat UI.

## 2026-07-30 — DL-149 JS3-1 journal session agent interview API

**Alpha · Mike (p-journal-session JS3-1) · India · Tango · Hotel:**
- `journal_session_agent.py`: `LABS_JOURNAL_AGENT_MODE=local|off`; Appendix A as
  `JOURNAL_SESSION_SYSTEM_PROMPT_V1`; local checklist-driven probes; D8 depth caps;
  intraday silent; D7 via `append_agent_message`.
- Routes: `GET/POST …/agent` + `…/agent/turn`. Depth exhausted → 409 form_fallback.
- Tests: **38 passed**. Next: **JS3-2** turn validator + double-fail → form.

## 2026-07-30 — DL-148 JS3-0 Coach GO journal session agent path

**Coach (p-journal-session JS3-0):**
- **GO** on J3 agent interview track (not DEFER).
- Product-wide mode: `LABS_JOURNAL_AGENT_MODE=local|off` (default **off**; fail loud when
  off). When on: Observer trial = Navigator for agent (D6). Free no-plan still no create.
- Form path remains DoD and always available; validator double-fail → J2 form (§8.2).
- D7 attribution + D8 depth + Appendix A apply. J3 still requires JS3-G evidence.
- Next: **JS3-1** interview endpoint + system prompt constant.

## 2026-07-30 — DL-147 JS2-G Delta phase PASS

**Delta (p-journal-session JS2-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS2-G-phase.md`.
- Falsifiable pre_market **without LLM** proven: schemas/checklist, form UI + seal
  confirm, tests (33 passed). Seeds JS2-1…JS2-3 APPROVED.
- Next: **JS3-0** Coach agent GO/DEFER, or **JS4-1** date closure (form path shippable).

## 2026-07-30 — DL-146 JS2-3 form characterization (Kilo)

**Kilo (p-journal-session JS2-3) · Alpha:**
- Expanded form tests: absent fields not invented on seal; PATCH structured-only;
  complete seal path; empty→absent; require_complete gate; multi-tag schemas.
- Flake check: **33 passed** ×2. Next: **JS2-G** Delta phase gate.

## 2026-07-30 — DL-145 JS2-2 structured form UI + seal confirm

**Charlie (p-journal-session JS2-2) · Tango · Echo:**
- `StructuredSessionForm` on journal day view: schema fields, save, checklist,
  seal confirmation (complete vs absences), partial path; create uses `prefill: true`.
- Free-text notes remain optional under the form. No agent required.
- Tango: no shame/grade; Echo: tokens consistent. `tsc --noEmit` clean.
- Next: **JS2-3** Kilo form tests · JS2-G.

## 2026-07-30 — DL-144 JS2-1 structured_json schemas + checklist

**Alpha · India (p-journal-session JS2-1) · Hotel:**
- `journal_session_structured.py` — per-tag field specs; code checklist;
  `invalidation` required_for_complete; uncertainty phrases allowed; normalize drops
  unknown keys; prefill instrument/size from prior plan + day trades — **never**
  invent invalidation.
- API: GET schemas/schema/prefill; create `prefill`; seal `require_complete`;
  session payload includes `checklist`.
- Tests: **26 passed** in `test_journal_sessions.py`.
- Next: **JS2-2** confirmation UI.

## 2026-07-30 — DL-143 JS1-G Delta phase PASS

**Delta (p-journal-session JS1-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS1-G-phase.md`.
- J1 complete: schema 049 · domain/API · dual-read · calendar attach · Kilo suite.
- Live evidence: `pytest tests/test_journal_sessions.py tests/test_retrospectives.py`
  → **54 passed**. Seeds JS1-1…JS1-5 all APPROVED; no waived reviews.
- Residuals named (J2 form, J3 agent, J4 closure, J5 media, J6 export).
- Next: **JS2-1** structured form (no LLM).

## 2026-07-30 — DL-142 JS1-5 Journal session characterization (Kilo)

**Kilo (p-journal-session JS1-5) · Alpha · Mike:**
- Expanded `tests/test_journal_sessions.py` — isolation, multi-entry, seal locks,
  free 403, trial/navigator create, dual-read, open excluded from §6.5, list filters,
  unauth deny, entitlement unit matrix.
- Flake check: **21 passed** ×2 identical; retro regression **33 passed**.
- Next: **JS1-G** Delta phase gate.

## 2026-07-30 — DL-141 JS1-4 Journal calendar session attach

**Charlie (p-journal-session JS1-4) · Echo:**
- Day view starts sessions by tag via `/api/me/journal-sessions`; lists entries for
  `journal_date`; member notes + partial/seal; retrospective chip still navigates.
- `web/lib/journalSessionApi.ts`; `JournalCalendar` day shell; day-book trades panel
  unchanged; multi-year trade interest dots untouched.
- `tsc --noEmit` clean. Next: **JS1-5** Kilo tests · JS1-G.

## 2026-07-30 — DL-140 JS1-3 dual-read notes + sessions

**Alpha (p-journal-session JS1-3) · India:**
- Spec §2.1 dual-read: gather §6.5, process journal days, activity gaps, what-worked
  stretch, Journey routine (D2) union legacy `member_tool_notes` with
  `member_journal_sessions` (`session_started_at` NY day; pre_market sessions by
  `journal_date` for expected-vs-actual).
- Helpers on `journal_session_domain`; wired in `retrospective_domain` + `journey_scores`.
- Never invent structured fields. Tests: journal + retro suites **46 passed**.
- Next: **JS1-4** calendar UI · **JS1-5** more isolation tests · JS1-G.

## 2026-07-30 — DL-139 JS1-2 Journal session domain + API

**Alpha (p-journal-session JS1-2) · India:**
- `server/journal_session_domain.py` + `routes/journal_sessions.py` wired in `main.py`.
- Endpoints: list/create/get/patch/messages/seal/partial under `/api/me/journal-sessions`.
- Entitlement D6 via `can_create_or_gather`; free 403; sealed/closed 409; isolation 404;
  multi entry/date; member messages only (agent J3); phase interim US RTH NY.
- Tests: `tests/test_journal_sessions.py` — **10 passed**.
- Next: **JS1-3** dual-read notes → sessions for gather/routine.

## 2026-07-30 — DL-138 JS1-1 Journal session schema migration

**Alpha (p-journal-session JS1-1) · Mike · India:**
- Migration `migrations/049_journal_sessions.sql` applied on dev (`migrate.py`).
- Tables: `member_journal_sessions`, `member_journal_messages`,
  `member_journal_date_closures` — Spec v0.2 §14 SoR.
- Attachments deferred to J5. Closures: `closed_by_retrospective_id` ON DELETE SET NULL
  (date stays closed). Messages append-only (no updated_at). export_key unique per owner.
- Next: **JS1-2** domain + API.

## 2026-07-30 — DL-137 Journal Session Spec v0.2 Coach GO (BUILD AUTHORITY)

**Coach (p-journal-session JS0-0):**
- **GO** — Spec `FatTail-Labs-Journal-Session-Spec-v0.2.md` is **BUILD AUTHORITY**.
- Prerequisite: Delta JS0-G **PASS** (`gate-reports/JS0-G-spec-lock.md`).
- **D1–D9 locked** (D9 promoted LOCKED at GO: additive import; never overwrite sealed
  transcript). D6 Observer = Navigator features; sole difference = 6-week term.
- Ship order: **J1–J2 before LLM**; J3 agent needs separate product enablement / JS3-0.
- Carry residuals: Journey routine wording (JS1/J9); Export Spec `journal_session` (JS6-1).
- Board: J0 frozen · **next JS1-1** (Alpha schema). Program board
  `agents/p-journal-session/`.

## 2026-07-30 — DL-136 JS0-G Delta Spec lock PASS

**Delta (p-journal-session JS0-G):**
- Verdict **PASS** — report `agents/p-journal-session/gate-reports/JS0-G-spec-lock.md`.
- Parent citations real (Retro v0.6, Journey §4.1a, Export v1.1); D3–D5 APPROVED (no
  silent waive); D1–D2·D4·D7·D8·§20 also locked with seed+DL evidence; D6/DL-128
  Observer 6-week term + parity stated; J1–J2 before LLM + §8.2 form fallback present.
- Named residuals (non-blocking): D9 formal LOCK row; Journey routine wording patch;
  Export Spec `journal_session` section; Spec Status remains DRAFT until Coach GO.
- **Do not start J1** until **JS0-0 Coach GO**.

## 2026-07-30 — DL-135 JS0-6 Sierra marketing / public boundary APPROVED

**Sierra (p-journal-session JS0-6) · Tango co-sign:**
- **§20 LOCKED** — Journal sessions are Family B only; **no** SEO/AEO/public marketing
  pipeline from transcripts, structured fields, media, or session aggregates.
- **Demo ban** — `is_demo` content never used as real member proof/testimonials (D5).
- Aligns Retrospective Spec v0.5 §20 (RT0-5). Process-outcome catalog copy OK; no
  production quotes; no JSON-LD from practice data; no marketing CMS export.
- Tango: trust > acquisition; member not turned into content.
- Owner seeds JS0-1…JS0-6 complete. Next: **JS0-G** Delta → **JS0-0** Coach GO.

## 2026-07-30 — DL-134 JS0-5 Hotel tag scripts + D8 APPROVED

**Hotel (p-journal-session JS0-5) · Tango co-sign:**
- **D8 LOCKED** — ≤8 agent **absence** questions per interview phase (ceiling not quota);
  trade-log/prior-plan prefill; ≥2 slots reserved for **invalidation** if missing;
  confirmation restatement is one code-owned turn outside the 8 absence budget.
- **pre_market §5.1** — field meanings; invalidation load-bearing; never invent levels;
  “I don’t know” > false precision; same checklist for agent and J2 form.
- **Scripts §8.4** — clean_day = one process question (not a day grade); post_session
  member-named deviations; reflection does not feed §6.5 as plan.
- Appendix A soft-review PASS (no text change). Feeds JS2-1 / JS3-1.
- Next: JS0-6 Sierra → JS0-G → Coach GO.

## 2026-07-29 — DL-133 JS0-4 India·Mike D5 is_demo APPROVED

**India · Mike (p-journal-session JS0-4):**
- **D5 LOCKED** — `identities.is_demo TINYINT(1) NOT NULL DEFAULT 0`; set only at identity
  create (ops/CLI); **immutable** (no flip via API/webhook/admin); never convert flag off.
- Identity-level only (no per-session demo column). Migration named for **JS8-1**
  (`0NN_identities_is_demo.sql`). Wholesale purge+reseed; admin date reopen demo-only.
- Hard exclude: leaderboard, journey peer visibility, live aggregates, marketing proof.
- Audit still fires with demo label. `is_demo` is not an auth bypass.
- Spec §13 full. D1–D7 now locked at owner level; build still needs JS0-G + Coach GO.
- Next: JS0-5 · JS0-6 → JS0-G → Coach GO.

## 2026-07-29 — DL-132 JS0-3 Mike D4 media + D7 attribution APPROVED

**Mike (p-journal-session JS0-3) · India co-sign:**
- **D4 LOCKED** — separate Family B journal media store (not course `uploads/private` /
  `private:` / `/api/media/`). Config root fail-loud; owner via `ft_session` only;
  **no public URL**; cookie-authenticated stream; export_ref + purge binaries; PD-8 no
  admin back door; never journey-public. Spec §11.2 · §14 attachments SoR for J5.
- **D7 LOCKED** — `author=agent` ⇒ `agent_service=labs-journal-session`; member owns ACL;
  server sets attribution; audit every turn; P2 principals later without re-key. Spec §11.3.
- Isolation: identity from cookie only; cross-member → 404. Attack notes listed for J1/J3/J5.
- Next: JS0-4 (D5) … JS0-6 → JS0-G → Coach GO.

## 2026-07-29 — DL-131 JS0-2 Tango D3 + Appendix B APPROVED

**Tango (p-journal-session JS0-2) · Hotel co-sign:**
- **D3 LOCKED** — journal session image/book P&L chrome inherits Retrospective process-first
  section collapse (default collapsed; member expands). Spec §11.1 SoR for JS5-3.
- **Appendix B APPROVED** — leave/gather/complete copy; banned late/grade/meter/P&L-hero phrases;
  agent→form capacity path added.
- **Capacity §16 APPROVED** — form always a path; validator withdraws to form; no member-facing ratio.
- **D2 soft-review PASS** — routine copy = days started a sitting; no backdate shame.
- Hotel: D3 prevents resulting; Appendix B no trading falsehoods; clean_day/invalidation → JS0-5.
- Next: JS0-3…JS0-6 → JS0-G → Coach GO. D4–D5 still open.

## 2026-07-29 — DL-130 JS0-1 India Spec integrity APPROVED

**India (p-journal-session JS0-1):**
- Session Spec v0.2 consistent with Retrospective v0.6, Journey §4.1a, Practice Export v1.1.
- **D1 LOCKED** — tags replace dual surface/type taxonomy.
- **D2 LOCKED** — Journey routine keys `session_started_at` NY day; `journal_date` scopes retros only.
- Schema §14 approved as JS1-1 migration SoR (expanded indexes/FKs/phase enum).
- Dual-read plan §2.1 mandatory until cutover (gather, routine, export union notes + sessions).
- Next: JS0-2…JS0-6 owner gates → JS0-G → Coach GO.

## 2026-07-29 — DL-129 p-journal-session Agent Bench board

**Juliet:** Full multi-agent implementation board for Journal Session Spec v0.2:
- `agents/p-journal-session/` — CHARTER, ORCHESTRATOR, IMPLEMENTATION-PLAN, seeds JS0–JS9,
  gate-reports.
- Phases: J0 Spec GO → J1 schema → J2 form (no LLM) → J3 agent (optional) → J4 closure →
  J5 media → J6 portability → J7 retro routing → J8 demo → J9 close.
- Program status **READY**; **do not code J1** until JS0-G PASS + Coach GO.
- Coach locks already in force: D6/DL-128 (Observer 6-week term, full Navigator access);
  D3–D5 still owner gates.

## 2026-07-29 — DL-128 Observer vs Navigator: only difference is 6-week term

**Coach:** The **only** product difference between **Observer** membership and **Navigator** is that
Observer’s membership **term is limited to 6 weeks**. Feature access is identical for that term
(Trade Log, Journal, Retrospective, habits, agent when product-enabled). Observer is **not free**.
Free no-plan remains a separate, non-Practice-create population.

Docs updated: Journal Session D6, Retrospective v0.5/v0.6 entitlement matrix, CHARTER G1,
Dual-Goal strategy. Agent parity remains DL-127.

## 2026-07-29 — DL-127 Retrospective agent: Observer parity (fix RT5-0 trial lockout)

**Coach correction:** Retrospective Spec/code wrongly treated Observer trial agent as optional
(403 unless `LABS_RETRO_AGENT_TRIAL`). **Observer = Navigator** for Practice including analyze.

**Code:** `can_run_agent_for_role` allows active `observer-trial` whenever agent mode is on
(no trial env flag). Tests: `test_analyze_observer_trial_parity_with_navigator`.  
**Docs:** Spec v0.5/v0.6 agent tables + Architecture 02 updated. Free no-plan still no create.

## 2026-07-29 — DL-126 Observer = Navigator Practice access (not free)

**Coach:** Observers are **not** free accounts. **Observer has the same Practice access as Navigator**
for the membership term. **Refined in DL-128:** sole difference is **6-week term**.  
Free no-plan remains outside Practice create. Agent lockout fixed in **DL-127**.

## 2026-07-29 — DL-125 Journal Session Spec v0.2 (then critique fix)

**v0.2** supersedes v0.1 (as-built honesty, phasing, portability, citations to Retrospective **v0.6**).

**Post-critique amendment (same day):** Status = **DRAFT** only (not dual “build authority + draft”).
D3/D4/D5 proposed-pending Tango / Mike·Alpha·India / India·Mike — not waived gates.
D6 free-observer create **OPEN for Coach**. Validator double-fail → J2 form (not dead partial).
Interview depth **≤8** with trade-log prefill. Schema: `status` only (no redundant incomplete).
Format id **`fattail.labs.journal_session`**. Warning copy + system prompt inlined (App A/B).
Script telemetry + backdate-into-closure restored.

## 2026-07-29 — DL-124 Demo Practice pack generator

**Ops/demo:** `server/seed_practice_demo_pack.py` builds a canonical member export
(ZIP/JSON) with trades, journal, retrospective, habit, check-ins; optional
`--import-email` / `--purge-first`. Walkthrough: `agents/p-member-export/DEMO.md`.

## 2026-07-29 — DL-123 Purge Practice data (keep membership)

**Coach:** Member may delete all Practice data while keeping membership, then load from export.
- `POST /api/me/practice-data/purge` with confirm `DELETE_PRACTICE_DATA`.
- Deletes: trade log, journal notes, retros, habits, live check-ins.
- Keeps: identity, memberships, enrollments, lesson progress, privacy prefs.
- Full replace = download → purge → additive load.
- Profile UI: **Delete Practice data…** warns; **Download backup first** offered; delete requires acknowledge checkbox; audit `purge_practice`.

## 2026-07-29 — DL-122 Import is additive only (non-destructive)

**Coach:** Load must not be destructive — **insert only**, never overwrite or delete.
- Import policy fixed to **`additive`**: matching `export_key` / external id / session_key → **skip**.
- No UPDATE of notes, retros, habits, check-ins, or privacy prefs on load.
- Journey: new check-ins only; meters never written.
- Spec v1.1 amended; UI copy states additive; tests include no-overwrite case.

## 2026-07-29 — DL-121 Member Practice portability two-way (import)

**Coach GO (plan defaults I1–I6 + Profile load UI):**
- Spec **v1.1**: `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md` — reverse export-only D6.
- Migration `048_practice_export_keys.sql` — `export_key` on notes / retros / habit plans.
- API: `POST /api/me/import/detect|preview|commit`; pack ZIP or JSON.
- **Superseded on merge:** see DL-122 additive-only.
- UI: Profile **Load Practice data** (preview → confirm).
- Tests: round-trip + isolation in `test_member_export.py`.

## 2026-07-29 — DL-120 Member Practice Canonical Export v1.0

**Coach plan GO (recommended D1–D7) + Alpha/Lima implement:**

- Spec: `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md`
- Formats: `fattail.labs.journal` · `fattail.labs.retrospective` · `fattail.labs.journey` · `fattail.labs.member_export` (embeds existing `fattail.labs.trade_log`)
- API: `GET /api/me/export` (zip default / json), per-surface export routes; audit action=`export`
- UI: Profile **Download my data** (ZIP)
- Export-only v1; omit raw identity_id; include email; Journey is derived snapshot
- Tests: `server/tests/test_member_export.py` (isolation, pack, zip, audit)
- Board: `agents/p-member-export/`

## 2026-07-29 — DL-119 Advisor Gates v0.51 packet filed + clearance

**Lima (post-close docs):** Canonical advisor packet landed at
`Specs/Advisor-Gates-Retrospective-v0.51.md` (Coach text + clearance matrix).

| Gate | Clearance |
|------|-----------|
| Hotel MIN_INFERENCE_N=20 | RT0-2 · DL-082 |
| Tango sample banner / collapsed book | RT0-3 · DL-083 |
| Mike Family B / pre_market isolation | RT0-4 · DL-084 |
| India habit_plans + pnl_expanded on identities | RT1-1 · DL-088 (schema) · RT0-1 fold |
| Sierra no marketing reuse of book P&L | RT0-5 · DL-085 · Spec §20 |
| Delta evidence plan R2b–R7 | RT0-G…RT8-G PASS · characterization suites |

**Deferred (unchanged):** cost-of-deviation; external agent provider; anti-gaming empty-retro clock.
Cross-ref Spec v0.51, v0.6 residuals, DL-118.

