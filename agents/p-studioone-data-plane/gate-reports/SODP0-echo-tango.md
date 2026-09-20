# SODP0 — Echo + Tango (design) · re-gate v0.1.5

**Date:** 2026-09-19  
**Agents:** Echo · Tango  
**Machine:** StudioTwo, read-only. No `server/` `web/` product edits. This file overwrite only.  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-echo-tango.md`  
**Token:** `agents/go/SODP0-W0.md` (intake / review — not a data-plane build GO)  
**Gate:** SODP0-G (Echo + Tango slice) — **re-gate**. Prior APPROVED was spec **v0.1.1**.

**Review object (this pass):**

| File | Role | Evidence |
|------|------|----------|
| `Architecture/36-studioone-data-plane-design.md` | Interaction + honesty design | 72 lines · sha1 `4e10524c2f2e02bb6759f9f225f80c74cc647f6e` · **byte-identical** to prior Echo+Tango pass |
| `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` **v0.1.5** §§6–7 + **SODP-6** | Hop + UI hosts + banner law | 295 lines · sha1 `dab97e4f19cb1fdc71a7b165dfadbc0d617876fd` |

Prior object (APPROVED, this same file): spec **v0.1.1** 202 lines · sha1 `7fc421483c9a69cdfe4d0119deb493008fff44dc`. Design sha1 unchanged.

Also read (not restyled): HI Spec v1.0 §2 / §6.3 `Banner` · kit `web/components/ui/Banner.tsx` · as-built `web/components/sa/SaPriceChart.tsx` (predicate + chip only, as contrast) · Hotel H-H4 (empty ≠ short) · Mike v0.1.5 hop hold.

**Status of object:** DRAFT. **Not BUILD AUTHORITY.** REQ-001 · REQ-002 · REQ-003 **OPEN**. No report writes "done" before AP-1 (SODP-9).

---

## Up front

**Nothing of Coach’s was changed or dropped.** Coach’s 2026-09-19 clean-separation sentence (spec header; RL-1) is intact. This pass did **not** edit the design, the spec, or product code. Objections sit **beside** the source, labeled.

v0.1.2–v0.1.5 did not rewrite SODP-6 or the §7 banner sentence. They added hop/SSO binds (v0.1.3), SODP-MB (v0.1.4), and interim combined Massive standing (v0.1.5). Those strengthen Echo/Tango chrome law. They do not reverse it.

---

## Verdict

| Gate | Callsign | Prior (v0.1.1) | This pass (v0.1.5) |
|------|----------|----------------|--------------------|
| HIG / three hosts / banner / chrome | **Echo** | APPROVED | **APPROVED** (held) |
| Honesty / SHORT HISTORY / capacity | **Tango** | APPROVED | **APPROVED** (held) |

Not a WHETHER veto of the data-plane split. Not a chrome restyle of REQ-002. Charlie does not invent the locks in **§ Echo binds** / **§ Tango copy locks** when SODP3 consumes the payload.

---

## What changed vs the prior APPROVED (Echo/Tango lane only)

| Item | v0.1.1 (prior) | v0.1.5 (now) | Seat effect |
|------|----------------|--------------|-------------|
| **SODP-6** | Payload flag. Every surface that draws those bars must render it. A route cannot skip a banner that ships in the payload. | **Verbatim.** | Echo/Tango: no re-open. |
| **§7 banner sentence** | `Banner: if short_history === true, render SHORT HISTORY. Cannot skip.` | **Verbatim.** | Echo: predicate lock held. |
| **Design 36** | sha1 `4e10524c…` | **Same bytes.** | All design binds held. |
| **§6 hop** | Short: `require_session` → computing Cookie; never forward `ft_session`. | Explicit: never put computing-class, LAN IPs, or StudioOne URLs in the browser or Next rewrites; never `Set-Cookie` computing JWT on the member response. | Echo computing-class lock **now in spec text**. |
| **§7 three hosts** | StudioTwo / MacBook / MiniTwo; MacBook named later. | Same three. SSO callback + hop pin per host. MacBook **named at SODP6 — not invented**. SSO mismatch = **401 identity miss**. Computing-class never in the browser. | Echo one-desk held. Tango FI-SODP-ET-2 now **spec law**. |
| **§5 Hotel honor** | (not yet) | Massive empty is a named failure, **not** SHORT HISTORY. | Tango: empty ≠ short (Hotel H-H4). Copy locks already split those states. |
| **§11 `fetchGen`** | (census not yet) | Bust / refuse if `short_history` or span < window — **no Sep-6 cache win**. | Tango silent-wall bind now on the census row. |
| **§14 Tailscale down** | (not yet) | Named 503, **not a local fill**. | Tango: hop fail is named, not a Sep-6 blank, not “try MiniTwo.” |
| **v0.1.5 §12 standing** | n/a | Interim Massive counts **both** StudioOne and StudioTwo writers until SODP-MB. | **Out of chrome.** No member CTA. Not a RETURN. |

No delta in this table reverses a prior bind. **RETURNED is not warranted.**

---

## Coach content intact?

**Yes.** Clean separation (StudioOne = data movement + data APIs; UI remote on StudioTwo / MacBook / MiniTwo) stays. REQ-002 white/black settings dialog stays out of this plane (design §6). REQ-003 picker stays Next. TS-1 fill is not repaired here. SODP-6 wording was not trimmed.

---

## Echo — HIG / interaction

Seed: three UI hosts, one desk · banner payload-mandatory · no vendor ticker (ESZ6) in chrome · computing-class never in the browser.

### 1. Three UI hosts, one desk — **APPROVED** (held)

Design §2 (unchanged) and spec §7 name the same three hosts: StudioTwo (`http://studiotwo:3000`), MacBook (named at SODP6), MiniTwo (`https://labs.fattail.ai`). Law: **same chrome, same picker, same banner grammar.** Spec §11: three UI hosts consume the **same** hop contract. Spec §14: topology is three hops, not discovered at deploy.

Host difference is site URL + SSO callback + hop pin — not a second chart dialect. If StudioTwo shows June and MiniTwo shows Sep 6, that is a **hop failure**, not “dev vs prod.” Echo will not accept a MiniTwo-only badge, a “open production” CTA, or a MacBook-only density on this surface.

MacBook remains unnamed until Coach wires it (SODP6). Until then it is not a live third desk. That is correct deference, not missing chrome. v0.1.5 §7 says so in the spec.

### 2. Banner payload-mandatory (SODP-6) — **APPROVED** (held)

SODP-6 (spec §2) **verbatim vs v0.1.1:** SHORT HISTORY is a **payload flag**. Every surface that draws those bars must render it. A route cannot skip a banner that ships in the payload.

Spec §7 **verbatim:** `if short_history === true`, render SHORT HISTORY. Cannot skip.  
Design §3: amber banner mandatory; `data-testid="sa-short-history"`; zinc “Price Nd” chip **must not replace** it when the flag is set.

HI Spec §6.3 already has `Banner` (info / warning / success; “dismissible when appropriate”). Kit: `web/components/ui/Banner.tsx` — `tone="warning"`, `role="status"`, `--text-footnote` (0.8125rem), **no dismiss control**. SHORT HISTORY is payload truth, not an announcement: **not dismissible.** Dismissing it would recreate a silent wall.

As-built contrast (not this packet’s edit): `SaPriceChart.tsx` paints `data-testid="sa-short-history"` for **both** the amber warn and the zinc “Price Nd” chip, and computes warn from `days < need` rather than `short_history`. That is a **route that can skip SODP-6**. Echo lock for Charlie (SODP3): render the banner **iff** `short_history === true`. Do not invent a second predicate. Do not keep the zinc chip on the same testid.

Hotel H-H4 (spec §5 Hotel honors; v0.1.x later than the prior Echo pass): MASSIVE EMPTY is **not** SHORT HISTORY. Echo: do not paint the SHORT HISTORY banner on an empty/unavailable payload. Named empty is a different vehicle (design §4 table).

### 3. No vendor ticker (ESZ6) in chrome — **APPROVED** (held)

Design §1: members never see `ESZ6` vs `ESZ2026`. Vendor translation is backstage.  
Spec §5: translate on the server; never hardcode ESZ6 in the client; payload may include `vendor_ticker`.

Echo lock: `vendor_ticker` may exist on the JSON. Chrome, picker, titles, `aria-*`, `data-*` shown to the member, and empty-state copy bind **`bound_symbol` only** (Labs identity, e.g. ESZ2026). Never render `ESZ6` / `MESZ6` / month-code year-digit vendor keys. `FGHJKMNQUVXZ` remains forbidden in `web/lib/symbology` (Arch 36 §5).

### 4. Computing-class never in the browser — **APPROVED** (held; now explicit in §6/§7)

Design §1 / §7. Spec SODP-3. v0.1.5 §6: never put computing-class, LAN IPs, or StudioOne URLs in the browser or in Next rewrites. §7: computing-class never in the browser. Next never rewrites `/api/*` to StudioOne.

Echo lock: no LAN IP (`192.168.1.111`), no Tailscale IP (`100.74.220.38`), no hop URL, no `computing-class`, no `identity_id=0`, no raw upstream HTML in the chart region. Hop failures are **named Labs states** (design §4), not a leaked sidecar page.

### Echo binds (Charlie · SODP3 — not a restyle GO)

1. Predicate = payload `short_history === true`. SODP-6. No client-only `days < 90` skip.
2. Vehicle = HI `Banner` `tone="warning"` **or** the existing overlay upgraded to warning tokens (`--color-warning`) and `--text-footnote`. No raw `#1e222d` / Tailwind amber as a new recipe. No 11px operator toast as the honesty carrier.
3. `data-testid="sa-short-history"` only when the flag is true.
4. Zinc “Price Nd · pan left for June” **off** while `short_history` (panning cannot invent June).
5. Not dismissible.
6. Never render vendor ticker or computing-class (above).
7. REQ-002 settings dialog is not this plane. Do not restyle it here.
8. Do not paint SHORT HISTORY on MASSIVE EMPTY / UNAVAILABLE / hop 503 / SSO miss (Hotel H-H4 · FI-SODP-ET-2).

**Echo: APPROVED.**

---

## Tango — member honesty / capacity

Seed: silent Sep-6 wall is a trust break · SHORT HISTORY readable under stress · no second “try MiniTwo” as the member’s job.

Persona walk: a trader already bleeding, short on trust, panning ES on whatever UI host they have. They picked a contract. They need to know whether the bars are that contract’s price, and whether the window is the one they asked for. They will not debug topology. v0.1.5’s combined Massive standing is Foxtrot’s arithmetic, not a member job.

### 1. Silent Sep-6 wall is a trust break — **APPROVED** (held; block if reversed)

Spec as-built §3 (honesty): picker binds `ESZ2026`; Massive empty on that key; fill serves print store from **2026-09-06**. That is a **false instrument window** presented as the chart. Tango: the industry already broke this person’s trust; a quiet wall that looks like “ES only goes back two weeks” is the same class of lie.

Design §1 / §4 forbids it. Named SHORT HISTORY, or named MASSIVE EMPTY / UNAVAILABLE, or named hop 503 — never yesterday’s short prints as if they were the book. Do not re-apply localStorage OHLC when `short_history` is true or span < requested window (design §4 last line). Spec §11 `fetchGen` row now says the same: **no Sep-6 cache win**. Spec §14: Tailscale down → named 503, **not a local fill**. A cached Sep-6 lie after an honest payload is the wall reincarnated.

Hotel H-H4 (now spec §5): empty ≠ short. Tango agrees: SHORT HISTORY is a short **successful** serve. Empty Massive must not wear the SHORT HISTORY jacket — that would teach “we have some days” when we have the wrong tape.

**Tango will BLOCK build** if a later packet restores silent fill, silent cache-win, a zinc chip in place of the payload banner, or SHORT HISTORY painted on an empty payload.

### 2. SHORT HISTORY readable under stress — **APPROVED** with copy lock (held)

Design §4: amber banner with **served span** and **requested window**. That is the data. As-built copy (`SHORT HISTORY: N days of price (need ≥ 90). Not silent.`) talks to the bench, not the trader. “Not silent.” and “need ≥ 90” are operator meta / REQ jargon.

**Tango copy lock (sits beside design §4; Coach may discard the wording, not the facts):**

> **SHORT HISTORY.** This chart has {history_span_days} days of price; {requested_window_days} were requested. This is still the contract you picked.

Facts that must remain readable if Coach rewords: served span · requested window · same contract · not a later start. Banned in chrome: “Not silent.” · “need ≥ 90” · Massive · ESZ6 · StudioOne · MiniTwo · “try another machine.”

Readable under stress also means **visible**: footnote-or-larger, warning tone, not a 11px chip a pan can hide. Echo bind (2) is the HIG half of this Tango ask.

### 3. No second “try MiniTwo” as the member’s job — **APPROVED** (held)

Design §7: one honest range, not a second “try another machine.” Design §2: host mismatch is hop failure, not a member comparison. Capacity over dependency: the member is not the deploy board.

v0.1.5 does **not** add a member CTA to compare hosts because StudioTwo feeds remain live until SODP-MB. That is operator standing, not a trader task.

SSO miss on a host (localhost callback, unnamed MacBook) is a **login** named state (spec §7: 401 identity miss — page may load; `/api/auth/me` does not). Not SHORT HISTORY and not a Sep-6 blank. Mike owns the hop; Tango only: do not send the trader to another machine to “find the real chart.”

### Tango labeled objection (not a block — Coach Content Law)

Design §4 hop 503 member sentence: `Named “StudioOne registry/history unreachable”`.

**Tango:** that names the data building. Unchanged in this re-gate (design bytes identical). Spec §14 says “named 503” without a member sentence — it does not fix the design line and does not worsen it. A tired trader should not learn StudioOne exists, and must not be invited to try MiniTwo / production as a workaround. Labs already has the archive pattern: member sentence without the box name (“Archive Not Available, Try Later.”). Operator logs may name StudioOne. Chrome must not.

**Tango copy lock (beside design §4):**

> **History unavailable.** Price is not on this chart right now. Try again later.

MASSIVE EMPTY / UNAVAILABLE (same table): calm, not yesterday’s prints. Suggested: **Price history unavailable for this contract.**  
NO STORE: quiet — overlay missing is not a BASE failure. Do not scare the member that price is broken.

No profit claim in banners (design §7). None present. No humiliation, no paywall theater. REQ-001/002/003 stay OPEN — Tango does not write them done.

**Tango: APPROVED.**

---

## Blocks (invariant | law | system only)

None on this DRAFT. The silent-wall reversal, SODP-6 skip, ESZ6-in-chrome, computing-class-in-browser, SHORT HISTORY on an empty payload, and “try the other host” CTA would be **blocks on build** (SODP3+). They are not in the design as law; they are forbidden by it. v0.1.5 did not introduce any of them.

---

## Opinions / recommendations (not blocks — Coach may discard)

1. **Echo:** When Charlie touches the overlay for SODP3, prefer kit `Banner` `tone="warning"` over keeping the 11px as-built chip. Not a SODP0 restyle; DL-539 still applies — do not open REQ-002 chrome.
2. **Tango:** Hop-503 / MASSIVE EMPTY copy as locked above. Facts stay; machine names out of chrome. Spec §14 “named 503” still needs a member sentence that does not say StudioOne.
3. **Echo:** SSO miss ≠ empty chart. Named login. Now spec §7 (v0.1.3 bind, still in v0.1.5). Mike’s packet; flagged so Charlie does not paint it as SHORT HISTORY.
4. White/black settings remain REQ-002. Echo will not smuggle a Labs-token restyle through this plane.
5. **Tango:** Hotel H-H4 (empty ≠ short) is the instrument half of the same honesty. Chrome must not collapse those two named states into one banner.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-SODP-ET-1 | Map the as-built 11px overlay onto kit `Banner` warning when SODP3 wires the payload | Honesty carrier should use HI Spec §6.3; not a SODP0 restyle of the chart | Coach + Echo + Charlie |
| FI-SODP-ET-2 | SSO / unnamed-MacBook miss as a named login state, never a Sep-6-looking blank | Capacity: identity failure is not a data-plane story. **Now spec §7 law** (401 identity miss). Still a chrome packet at SODP3/SODP6. | Coach + Mike + Echo |
| FI-SODP-ET-3 | Quiet NO STORE copy for missing VP overlay vs shouting BASE failure | Same page, two claims; do not let overlay absence look like price death | Coach + Tango + Hotel |

Flagged ideas: these three — inventory otherwise intact. Not killed. FI-SODP-ET-2 moved from “flag” toward spec; chrome still unbuilt.

---

## Bench delta

1. Re-gate on spec **v0.1.5** sha1 `dab97e4f…`: Echo **APPROVED** · Tango **APPROVED**. Prior v0.1.1 APPROVED **held**, not reopened.
2. Design sha1 `4e10524c…` **unchanged**. SODP-6 and the §7 banner sentence are **verbatim**.
3. v0.1.3 hop/SSO text now states Echo’s computing-class lock and Tango’s SSO-miss ≠ SHORT HISTORY in the spec. Charlie cannot treat those as Echo-only folklore.
4. v0.1.5 interim Massive standing is **not** member chrome. No “try MiniTwo because StudioTwo feeds are still live.”
5. Hotel H-H4 (empty ≠ short) is now a Tango chrome bind: do not paint SHORT HISTORY on MASSIVE EMPTY.
6. Spec §11 `fetchGen` + §14 named 503 put the silent-wall bans on the census/topology rows. Next Charlie packet cannot claim the design was silent on cache-win.

---

## Isolation / REQs

LIM · QFRIC · XS · PPL · Help Watch · IKI — not opened. REQ-002 dialog not restyled. REQ-001 range is AP-1, not this review.

**Open REQs:** REQ-001 · REQ-002 · REQ-003.

---

## Build disposition

**Echo: APPROVED** (held on v0.1.5)  
**Tango: APPROVED** (held on v0.1.5)

Implementation readiness for SODP0 design slice only. Coach stamps BUILD + `SODP2-W0` before any history rewrite. Juliet may fold the copy locks and Echo binds into the design without erasing Coach product.
