# IKI Labs — Node Card Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-Node-Card-Spec-v0_1.md`
**Component id:** `node-card` · **Layout:** `card` (**new**) · **Plane:** none (derives from Profile)
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— GXF law is not restated here.

**Duplicates:** DealerEdge key levels · GEXBoard level chip · MenthorQ GEX1-style top levels.

---

## 0. Why this spec is stricter than the other five

The Node Card exists to **leave the screen**. Its stated purpose is a scan, a Discord print, a
pre-market stack and a journal entry — a compact object consumed where none of the surrounding
chrome travels with it.

Every honesty mechanism the other five tools rely on — the persistent coverage strip, the legend,
the axis label, the invalid marker — is a **surface** mechanism (**GXF31** L2). The Card is the one
component whose primary consumption is off-surface. That inverts the usual risk: for the other
tools, a member misreads a picture; for this one, **a four-line object is pasted into a channel and
read by people who never saw the tool.**

So the rules here are tighter, and two of them (**NC1**, **NC9**) have no analogue elsewhere in the
family.

---

## 1. Purpose

**The question it answers:** *where is the largest gamma concentration, where does the profile change
sign, and how far is spot from each — under a named scope, as of a stated time?*

**The question it does not answer:** anything about what to do (**GXF36**).

---

## 2. Component declaration

```ts
{
  id: "node-card",
  runner_template_id: "node-card",
  layout: "card",
  dataPlane: undefined,               // derives from gex-profile (and gex-surface if sourced)
  analyzer_handoff: false,
  transport: ["render", "sse"],       // SSE authenticated + entitlement-gated — NC10
}
```

**Endpoint before view (Foundation OD-GXF3).** The contract is the payload; the card is one
renderer of it.

---

## 3. Derivation

1. **Anchor** = Profile `peak_abs` (or Surface `peak` when `node_source = surface`).
2. **Sign changes** = Profile `sign_changes[]` with count — **NC2**.
3. **Secondary concentrations** = next strikes by `|net|` after the anchor, one above and one below
   spot where each exists — **NC3**.
4. **Distances** from spot to each, in points and in strikes.
5. **Regime** = `pos` / `neg` / `near_zero` by `GexPolicy.near_zero_threshold` — a **mechanical**
   band, **NC4**.
6. **Scope stamp** and full coverage — **NC1**.

---

## 4. Tool law

| # | Law |
|---|---|
| **NC1** | **The card carries its terms, or it does not publish.** Every rendered card and every SSE message carries, inline and non-optionally: `scope` (expiring / rollup), `as_of`, `oi_asof`, `sign_convention`, `algo_version`, `lens`, and session completeness. Not a link to them, not a hover, not "available in the tool" — **inline**. A card without them is **malformed and is not emitted** (**AT-NC1**). This is **GXF30** applied where there is no strip to fall back on |
| **NC2** | **No scalar `flip` field, ever.** The payload carries `sign_changes[]` and `sign_change_count`. A consumer that wants one number takes the nearest to spot **and** reads the count. Publishing a lone `flip: 5712` over SSE hardens a possibly-non-unique, direction-dependent construct into a number a bot will size against (**GP1**, **AT-NC2**) |
| **NC3** | **"Defense lines" is not a name we ship.** Field name `secondary_concentrations`, each with its strike, value and side. No copy, field, tooltip or print template frames a strike as a defence, a floor, a ceiling, or a level that holds (**GXF35**, **AT-NC3**) |
| **NC4** | **Regime is a band, not a forecast.** The payload states the threshold and the value that produced the label. No consumer should have to guess whether `neg` means −$1M or −$900M (**AT-NC4**) |
| **NC5** | **`anchor_expiry` is `null` when the anchor came from a rollup Profile.** The Profile sums expiries away, so the field has no defined value there. It is explicitly `null` and never a plausible-looking arbitrary date — a bot reading `gex.node.SPX.ROLLUP` must be able to tell (**AT-NC5**, review G6) |
| **NC6** | **Two sources, two names.** Profile anchor (`argmax \|net[strike]\|`) and Surface anchor (`argmax \|cell(strike, expiry)\|`) are different objects. `node_source` is in the payload, and the two never share a field without it |
| **NC7** | **No rating. Not off-by-default — absent.** Coach's spec correctly disables the DealerEdge 1–5 rating and labels it heuristic. This spec goes further: **a compressed 1–5 score in a payload built to be pasted into a channel is a signal product**, and "off by default" is one config flip and one enthusiastic member away from being one. If a rating is ever wanted it is a separate component with its own Hotel gate, not a field on this one (**AT-NC7**, **OD-NC1**) |
| **NC8** | **No top-N level list.** MenthorQ-style `GEX1–GEX5` ranks strikes into an ordered list of "levels", which is the ranking-into-significance step the whole toolset avoids. Absent, same reasoning as **NC7** |
| **NC9** | **The print template is a member-facing artifact and is reviewed as copy.** A Discord or journal render is where **GXF36** leaks, because a four-line card invites a fifth line. The template ships reviewed by Echo and Tango, versioned, and carrying **NC1**'s terms in the printed form — not only in the JSON behind it (**AT-NC9**) |
| **NC10** | **The SSE topic is authenticated and entitlement-gated.** `gex.node.{symbol}.{scope}` is a member stream: `require_session`, component entitlement, universe gate. **No new public unauthenticated surface** (Foundation §17) |
| **NC11** | **Flow lens: no card.** The Card is built from signed objects — anchor sign, crossings, regime — and `gex_vol` is unsigned (**GXF11**). Under `flow` the component reports **magnitude and scope only**, or is unavailable with a stated reason. It does not render a signed card from an unsigned series (**AT-NC11**) |
| **NC12** | **Alerts are member-configured, never shipped on.** Spot-crossing and anchor-change alerts default **off**. An alert that arrives unbidden is a recommendation with a delivery mechanism |

---

## 5. Output contract

```json
{
  "ts": 0,
  "component": { "id": "node-card", "version": "0.1.0" },
  "symbol": "SPX",
  "scope": "expiring|rollup",
  "node_source": "profile|surface",
  "lens": "oi",
  "scale": "per_1pct",
  "spot": 0,
  "net_gex": 0,
  "regime": { "label": "pos|neg|near_zero", "threshold": 0, "value": 0 },
  "anchor": { "strike": 0, "gex": 0, "expiry": null },
  "sign_changes": [ { "px": 0, "strike_lo": 0, "strike_hi": 0 } ],
  "sign_change_count": 0,
  "secondary_concentrations": [
    { "strike": 0, "gex": 0, "side": "above|below" }
  ],
  "dist": { "to_nearest_sign_change": 0, "to_anchor": 0 },
  "terms": {
    "as_of": 0,
    "oi_asof": "2026-08-31",
    "sign_convention": "dealer_short_public_v1",
    "algo_version": "gex_v1",
    "session_window": "09:30-16:00",
    "complete": true,
    "scope_note": "band(±25)"
  }
}
```

`terms` is **required**. A message without it is not emitted (**NC1**).

---

## 6. Rendered card

Four lines maximum for the body, plus a required terms line. The terms line is not decoration and
is not truncated to fit — if the card cannot show its terms, the card is too small
(**AT-SV30** discipline, applied here).

```text
SPX · expiring · OI lens
net −$451M (neg, |t| > $500M)      spot 5,684
anchor 5,700  ·  −$88M             16 pts above
sign changes: 2   nearest 5,712    28 pts above
──────────────────────────────────────────────
as of 14:22 ET · OI as of 31 Aug · dealer-short convention assumed · band(±25)
```

Regime carries colour; the colour is not the only carrier of the label.

---

## 7. Controls

| Control | Default | Notes |
|---|---|---|
| Scope | `expiring` | dual publish (expiring + rollup) allowed; each carries its own stamp |
| Node source | `profile` | **NC5**, **NC6** |
| Lens | `oi` | `flow` → magnitude only or unavailable (**NC11**) |
| Secondary count | 2 | neutral name (**NC3**) |
| Rating | **absent** | **NC7** |
| Top-N level list | **absent** | **NC8** |
| Alerts | **off** | member-configured (**NC12**) |
| Print template | on | versioned, Echo-reviewed (**NC9**) |

---

## 8. Acceptance tests

| ID | Test |
|---|---|
| **AT-NC1** | A card or SSE message missing any `terms` field **fails validation and is not emitted**; the rendered card shows the terms line at every supported size |
| **AT-NC2** | No payload field named `flip` exists; a fixture with three crossings publishes all three with `sign_change_count: 3` |
| **AT-NC3** | The strings defense, defence, wall, floor, ceiling, magnet, pin, support, resistance appear in no field name, label, tooltip or print template |
| **AT-NC4** | `regime` publishes its threshold and the value that produced the label |
| **AT-NC5** | `node_source: "profile"` with a rollup scope → `anchor.expiry` is explicitly `null`, never a date |
| **AT-NC6** | Profile-sourced and Surface-sourced anchors are distinguishable in the payload without inference |
| **AT-NC7** | No rating field exists in any build; a grep of the component for a 1–5 score returns nothing |
| **AT-NC8** | No ranked level list (`GEX1..GEX5` or equivalent) exists in payload or render |
| **AT-NC9** | The print template renders the terms line; a template lacking it fails the doc gate. Template version is recorded |
| **AT-NC10** | SSE topic rejects an unauthenticated subscriber and a member without the component entitlement; universe gate enforced |
| **AT-NC11** | `lens: "flow"` → no signed fields; component reports magnitude and scope, or is unavailable with a stated reason |
| **AT-NC12** | Alerts default off in a fresh member state |
| **AT-NC13** | Card values are **byte-identical** to the Profile's for the same frame (**GXF23**) |
| **AT-NC14** | On a `complete: false` session the card publishes `complete: false` and the render shows it |

---

## 9. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-NC1** | Rating — absent, or off-by-default? | **Absent** (**NC7**). Coach's spec already declines to ship it on; this makes the decline structural rather than a setting |
| **OD-NC2** | Member-facing names for anchor and secondary concentrations | **Echo + Tango**, and this is the highest-stakes naming call in the family because these names travel |
| **OD-NC3** | Is dual publish (expiring **and** rollup) on by default? | **One scope at a time by default.** Two cards in a channel with different scopes and similar numbers is how a scope stamp gets ignored |
| **OD-NC4** | Does the Card ship in the first wave? | **After Profile and after the misread metrics come back clean.** It is the family's highest-leverage honesty risk and its lowest build cost — that combination argues for shipping it last, not first |
| **OD-NC5** | Journal integration | Member-initiated. Same reasoning as **OD-SP3** |

---

## 10. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. §0 states why this spec is stricter. Terms travel inline or nothing publishes (NC1). No scalar flip (NC2). Defense lines renamed structurally (NC3). `anchor_expiry` null on rollup (NC5). **Rating absent rather than off** (NC7); no ranked level list (NC8). Print template reviewed as copy (NC9). SSE authenticated and gated (NC10). Flow lens publishes no card (NC11). AT-NC1–14 · OD-NC1–5 |

**One-line law:**
**A compact object built to leave the screen carries every term it was derived under, inline, or it
is not published — and it never compresses a chain into a score, a rank, or a single flip.**