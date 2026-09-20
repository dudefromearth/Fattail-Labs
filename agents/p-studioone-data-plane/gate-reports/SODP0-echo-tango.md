# SODP0 — Echo + Tango (design)

**Date:** 2026-09-19  
**Agents:** Echo · Tango  
**Machine:** StudioTwo, read-only. No `server/` `web/` product edits.  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-echo-tango.md`  
**Token:** `agents/go/SODP0-W0.md` (intake / review — not a data-plane build GO)  
**Gate:** SODP0-G (Echo + Tango slice)

**Review object:**

| File | Role | Evidence |
|------|------|----------|
| `Architecture/36-studioone-data-plane-design.md` | Interaction + honesty design | 72 lines · sha1 `4e10524c2f2e02bb6759f9f225f80c74cc647f6e` |
| `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` §§6–7 + **SODP-6** | Hop + UI hosts + banner law | 202 lines · sha1 `7fc421483c9a69cdfe4d0119deb493008fff44dc` |

Also read (not restyled): HI Spec v1.0 §2 / §6.3 `Banner` · kit `web/components/ui/Banner.tsx` · as-built `web/components/sa/SaPriceChart.tsx` (predicate + chip only, as contrast) · Arch 36 as-built honesty · plan v1.0 seats.

**Status of object:** DRAFT. Not BUILD AUTHORITY. REQ-001 · REQ-002 · REQ-003 **OPEN**. No report writes "done" before AP-1 (SODP-9).

---

## Up front

**Nothing of Coach’s was changed or dropped.** Coach’s 2026-09-19 clean-separation sentence (spec header; RL-1) is intact. This pass did **not** edit the design, the spec, or product code. Objections sit **beside** the source, labeled.

---

## Verdict

| Gate | Callsign | Verdict |
|------|----------|---------|
| HIG / three hosts / banner / chrome | **Echo** | **APPROVED** |
| Honesty / SHORT HISTORY / capacity | **Tango** | **APPROVED** |

Not a WHETHER veto of the data-plane split. Not a chrome restyle of REQ-002. Charlie does not invent the locks in **§ Echo binds** / **§ Tango copy locks** when SODP3 consumes the payload.

---

## Coach content intact?

**Yes.** Clean separation (StudioOne = data movement + data APIs; UI remote on StudioTwo / MacBook / MiniTwo) stays. REQ-002 white/black settings dialog stays out of this plane (design §6). REQ-003 picker stays Next. TS-1 fill is not repaired here.

---

## Echo — HIG / interaction

Seed: three UI hosts, one desk · banner payload-mandatory · no vendor ticker (ESZ6) in chrome · computing-class never in the browser.

### 1. Three UI hosts, one desk — **APPROVED**

Design §2 and spec §7 name the same three hosts: StudioTwo (`http://studiotwo:3000`), MacBook (named later), MiniTwo (`https://labs.fattail.ai`). Law: **same chrome, same picker, same banner grammar.** Host difference is site URL + SSO callback + hop pin — not a second chart dialect.

If StudioTwo shows June and MiniTwo shows Sep 6, that is a **hop failure**, not “dev vs prod.” Echo will not accept a MiniTwo-only badge, a “open production” CTA, or a MacBook-only density on this surface.

MacBook remains unnamed until Coach wires it (SODP6). Until then it is not a live third desk. That is correct deference, not missing chrome.

### 2. Banner payload-mandatory (SODP-6) — **APPROVED**

SODP-6 (spec §2): SHORT HISTORY is a **payload flag**. Every surface that draws those bars must render it. A route cannot skip a banner that ships in the payload.

Spec §7: `if short_history === true`, render SHORT HISTORY. Cannot skip.  
Design §3: amber banner mandatory; `data-testid="sa-short-history"`; zinc “Price Nd” chip **must not replace** it when the flag is set.

HI Spec §6.3 already has `Banner` (info / warning / success). Kit: `web/components/ui/Banner.tsx` — `tone="warning"`, `role="status"`, `--text-footnote` (0.8125rem), **no dismiss control**. SHORT HISTORY is payload truth, not an announcement: **not dismissible.** Dismissing it would recreate a silent wall.

As-built contrast (not this packet’s edit): `SaPriceChart.tsx` paints `data-testid="sa-short-history"` for **both** the amber warn and the zinc “Price Nd” chip, and computes warn from `days < need` rather than `short_history`. That is a **route that can skip SODP-6**. Echo lock for Charlie (SODP3): render the banner **iff** `short_history === true`. Do not invent a second predicate. Do not keep the zinc chip on the same testid.

### 3. No vendor ticker (ESZ6) in chrome — **APPROVED**

Design §1: members never see `ESZ6` vs `ESZ2026`. Vendor translation is backstage.  
Spec §5: translate on the server; never hardcode ESZ6 in the client; payload may include `vendor_ticker`.

Echo lock: `vendor_ticker` may exist on the JSON. Chrome, picker, titles, `aria-*`, `data-*` shown to the member, and empty-state copy bind **`bound_symbol` only** (Labs identity, e.g. ESZ2026). Never render `ESZ6` / `MESZ6` / month-code year-digit vendor keys. `FGHJKMNQUVXZ` remains forbidden in `web/lib/symbology` (Arch 36 §5).

### 4. Computing-class never in the browser — **APPROVED**

Design §1 / §6. Spec §6 hop is **server-side** (`require_session` locally → computing-class cookie to StudioOne). SODP-3: the browser never talks to StudioOne.

Echo lock: no LAN IP (`192.168.1.111`), no Tailscale IP (`100.74.220.38`), no hop URL, no `computing-class`, no `identity_id=0`, no raw upstream HTML in the chart region. Hop failures are **named Labs states** (design §4), not a leaked sidecar page.

### Echo binds (Charlie · SODP3 — not a restyle GO)

1. Predicate = payload `short_history === true`. SODP-6. No client-only `days < 90` skip.
2. Vehicle = HI `Banner` `tone="warning"` **or** the existing overlay upgraded to warning tokens (`--color-warning`) and `--text-footnote`. No raw `#1e222d` / Tailwind amber as a new recipe. No 11px operator toast as the honesty carrier.
3. `data-testid="sa-short-history"` only when the flag is true.
4. Zinc “Price Nd · pan left for June” **off** while `short_history` (panning cannot invent June).
5. Not dismissible.
6. Never render vendor ticker or computing-class (above).
7. REQ-002 settings dialog is not this plane. Do not restyle it here.

**Echo: APPROVED.**

---

## Tango — member honesty / capacity

Seed: silent Sep-6 wall is a trust break · SHORT HISTORY readable under stress · no second “try MiniTwo” as the member’s job.

Persona walk: a trader already bleeding, short on trust, panning ES on whatever UI host they have. They picked a contract. They need to know whether the bars are that contract’s price, and whether the window is the one they asked for. They will not debug topology.

### 1. Silent Sep-6 wall is a trust break — **APPROVED** (block if reversed)

Spec as-built §3 (honesty): picker binds `ESZ2026`; Massive empty on that key; fill serves print store from **2026-09-06**. That is a **false instrument window** presented as the chart. Tango: the industry already broke this person’s trust; a quiet wall that looks like “ES only goes back two weeks” is the same class of lie.

Design §1 / §4 forbids it. Named SHORT HISTORY, or named MASSIVE EMPTY / UNAVAILABLE, or named hop 503 — never yesterday’s short prints as if they were the book. Do not re-apply localStorage OHLC when `short_history` is true or span < requested window (design §4 last line). A cached Sep-6 lie after an honest payload is the wall reincarnated.

**Tango will BLOCK build** if a later packet restores silent fill, silent cache-win, or a zinc chip in place of the payload banner.

### 2. SHORT HISTORY readable under stress — **APPROVED** with copy lock

Design §4: amber banner with **served span** and **requested window**. That is the data. As-built copy (`SHORT HISTORY: N days of price (need ≥ 90). Not silent.`) talks to the bench, not the trader. “Not silent.” and “need ≥ 90” are operator meta / REQ jargon.

**Tango copy lock (sits beside design §4; Coach may discard the wording, not the facts):**

> **SHORT HISTORY.** This chart has {history_span_days} days of price; {requested_window_days} were requested. This is still the contract you picked.

Facts that must remain readable if Coach rewords: served span · requested window · same contract · not a later start. Banned in chrome: “Not silent.” · “need ≥ 90” · Massive · ESZ6 · StudioOne · MiniTwo · “try another machine.”

Readable under stress also means **visible**: footnote-or-larger, warning tone, not a 11px chip a pan can hide. Echo bind (2) is the HIG half of this Tango ask.

### 3. No second “try MiniTwo” as the member’s job — **APPROVED**

Design §6: one honest range, not a second “try another machine.” Design §2: host mismatch is hop failure, not a member comparison. Capacity over dependency: the member is not the deploy board.

SSO miss on a host (localhost callback, unnamed MacBook) is a **login** named state, not SHORT HISTORY and not a Sep-6 blank. Mike owns the hop; Tango only: do not send the trader to another machine to “find the real chart.”

### Tango labeled objection (not a block — Coach Content Law)

Design §4 hop 503 member sentence: `Named “StudioOne registry/history unreachable”`.

**Tango:** that names the data building. A tired trader should not learn StudioOne exists, and must not be invited to try MiniTwo / production as a workaround. Labs already has the archive pattern: member sentence without the box name (“Archive Not Available, Try Later.”). Operator logs may name StudioOne. Chrome must not.

**Tango copy lock (beside design §4):**

> **History unavailable.** Price is not on this chart right now. Try again later.

MASSIVE EMPTY / UNAVAILABLE (same table): calm, not yesterday’s prints. Suggested: **Price history unavailable for this contract.**  
NO STORE: quiet — overlay missing is not a BASE failure. Do not scare the member that price is broken.

No profit claim in banners (design §6). None present. No humiliation, no paywall theater. REQ-001/002/003 stay OPEN — Tango does not write them done.

**Tango: APPROVED.**

---

## Blocks (invariant | law | system only)

None on this DRAFT. The silent-wall reversal, SODP-6 skip, ESZ6-in-chrome, computing-class-in-browser, and “try the other host” CTA would be **blocks on build** (SODP3+). They are not in the design as law; they are forbidden by it.

---

## Opinions / recommendations (not blocks — Coach may discard)

1. **Echo:** When Charlie touches the overlay for SODP3, prefer kit `Banner` `tone="warning"` over keeping the 11px as-built chip. Not a SODP0 restyle; DL-539 still applies — do not open REQ-002 chrome.
2. **Tango:** Hop-503 / MASSIVE EMPTY copy as locked above. Facts stay; machine names out of chrome.
3. **Echo:** SSO miss ≠ empty chart. Named login. Mike’s packet; flagged so Charlie does not paint it as SHORT HISTORY.
4. White/black settings remain REQ-002. Echo will not smuggle a Labs-token restyle through this plane.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-SODP-ET-1 | Map the as-built 11px overlay onto kit `Banner` warning when SODP3 wires the payload | Honesty carrier should use HI Spec §6.3; not a SODP0 restyle of the chart | Coach + Echo + Charlie |
| FI-SODP-ET-2 | SSO / unnamed-MacBook miss as a named login state, never a Sep-6-looking blank | Capacity: identity failure is not a data-plane story | Coach + Mike + Echo |
| FI-SODP-ET-3 | Quiet NO STORE copy for missing VP overlay vs shouting BASE failure | Same page, two claims; do not let overlay absence look like price death | Coach + Tango + Hotel |

Flagged ideas: these three — inventory otherwise intact. Not killed.

---

## Bench delta

1. SODP-6 is now an Echo/Tango chrome law: **payload flag → mandatory, non-dismissible warning Banner**; zinc chip cannot replace it; testid only when the flag is true.
2. Next Charlie packet cannot render `vendor_ticker` or computing-class; `bound_symbol` is the only identity in chrome.
3. Silent Sep-6 wall (and short localStorage re-apply) is named a **Tango trust break** — block on build if reversed.
4. Hop-503 copy that names StudioOne is on file as a Tango objection; member sentence is “History unavailable… Try again later.”
5. Three UI hosts are one desk: host mismatch is hop failure, never the member’s job to try MiniTwo.

---

## Isolation / REQs

LIM · QFRIC · XS · PPL · Help Watch · IKI — not opened. REQ-002 dialog not restyled. REQ-001 range is AP-1, not this review.

**Open REQs:** REQ-001 · REQ-002 · REQ-003.

---

## Build disposition

**Echo: APPROVED**  
**Tango: APPROVED**

Implementation readiness for SODP0 design slice only. Coach stamps BUILD + `SODP2-W0` before any history rewrite. Juliet may fold the copy locks and Echo binds into the design without erasing Coach product.
