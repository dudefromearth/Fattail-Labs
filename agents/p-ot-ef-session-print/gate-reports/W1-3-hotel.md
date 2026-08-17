# W1-3 — Hotel honesty pass on Echo labels

**Date:** 2026-08-16  
**Agent:** Hotel  
**Artifact:** [`agents/p-ot-ef-session-print/echo-labels.md`](../echo-labels.md) (W1-1 Echo · 2026-08-16)  
**Seed:** `seeds/W1-3-hotel-honesty.md`  
**Law read:** Hotel charter (no reckless trading education) · OT-EF v1.1 **A6** · **B2** · **Law C** · §8.3 Hotel line · Session/Print Spec v0.1 **§6** · OPF-SESS-1…5 · India H3/H4 (W3-1 · DL-398) · DL-393 · DL-394 · DL-395 · DL-396  
**Coach Content Law:** nothing of Echo’s (or Coach’s six-word list) was removed or rewritten. Objections sit **beside** quoted rows, labeled Hotel’s. This file does **not** edit `echo-labels.md`.

**Not touched:** chrome · envelope field names · OPF29 · `web/` · `server/` · `echo-labels.md`.

---

## Up front

Hotel did **not** drop, rename, or replace any of Echo’s badges, package readings, must-not-say lists, Show verb, HIG lines, or control-grammar placements.

Coach’s six-word list stays: **Live · Pre/post · Off market · last print · Held residual · EXPIRED**. Echo assigned them; Hotel does not reopen the list.

---

## Verdict

| Gate | Verdict |
|------|---------|
| **Honesty** (live vs last print vs residual vs expired readable as a liftable quote when it is not) | **APPROVED** |
| **RETURNED / BLOCK** | **No.** No label, as written in the required table + control grammar, teaches a false lift. |

W1-G may take this as Hotel sign-off on the **word list**. Opinions below are for W3-2 / W5 **placement**, not a second vocabulary.

---

## Coach / Echo content intact?

**Yes.** Quoted rows below are Echo’s. Hotel notes are labeled **Hotel:** or **Hotel opinion:**. Downstream agents must not treat an opinion as deletion (doctrine §11.1).

---

## What was checked (evidence of review)

| Check | Against | Result |
|-------|---------|--------|
| Six badges + last-print-is-not-a-badge | Session/Print §6 · OT-EF §8.3 | Matches Coach list. Two axes kept. |
| `open` + `live` → **Live** | OPF-SESS: only `open` is the Live NBBO claim | Honest. |
| `extended` + last print → **Pre/post** | OPF-SESS-5 · §6 “not RTH NBBO” | Does not claim RTH NBBO when paired as Echo wrote. |
| `closed` + last print → **Off market** | OPF36 · B1 last print ≠ outage | Does not claim a now-tradeable market. |
| Held / residual after τ | Law C · A6 · B2 **HELD / RESIDUAL** · H4 | Never live. Forbids “through the close” / “expires at 4.” |
| EXPIRED after midnight ET | Law C · DL-393 · B2 | Named state + defined debit. Not a live mark. Not $0-as-worthless. |
| `print_quality=none` → **No print** | OPF36 named incomplete | No guessed mid. Not a lift. |
| Must-not-say lists | Hotel “false lift” test | Catch the harmful readings. |
| Show checkbox | DL-394 | Not a quote claim. No Hotel issue. |
| Profit theater / process | Hotel invariant 3 · Echo HIG | EXPIRED forbids “you made / you lost.” |
| Envelope / OPF29 | Seed NX | Untouched. |

Sources actually read (doctrine §11.3): OT-EF v1.1 §§1–3, 5, 8; Session/Print v0.1 §§0–6, 10 (H3/H4); `echo-labels.md` in full; seed W1-3; India W3-1 note that `print_quality=live` is forbidden after that contract’s OPF29 instant.

---

## The four asks

### 1. Does “Pre/post” clearly not claim RTH NBBO?

**Yes — as Echo paired it. Not as a badge-alone number.**

Echo (quoted):

> Badge / plane: **Pre/post**  
> Package / curve: *The numeric **last print** plus a short held disclaimer. Curve is that held print, not an RTH NBBO book. Member reads: pre/post print — not the RTH book.*  
> Must not say: *Live; open; NBBO; “after-hours live”; “you can lift this”; unavailable; closed; outage; error*

Hotel: “Pre/post” is Coach’s session word (Spec §6). It names an **extended printing** class, not an RTH book. The denial of NBBO lives in the **required pairing**: plane **Pre/post** + chip **last print** + held disclaimer + member-read “not the RTH book.” Echo also forbids the exact false-lift phrases (“after-hours live”, “you can lift this”, “NBBO”).

**Hotel opinion (not a block · placement for W3-2):** A **naked number** under a Pre/post badge, with no “last print” / held disclaimer on the chip, would be glance-readable as a now-book. Echo already forbade that in control grammar (*“A number only when OPF can stand behind it, labeled **live** or **last print**…”*). Do not implement Pre/post as badge + unlabeled mid.

**Hotel opinion (not a block):** “Pre/post” does not distinguish pre-open from after the cash bell. That is correct for session class. Both are not RTH NBBO. Hotel does not want a third badge.

### 2. Does “Off market” + last print clearly not claim a now-tradeable market?

**Yes.**

Echo (quoted):

> Badge / plane: **Off market**  
> Package / curve: *The numeric **last print**, labeled held. Curve is the last known print. Member reads: last known print — the market is closed.*  
> Must not say: *Live; Pre/post; unavailable; OPF unavailable; error; offline; broken; “no data”; “market down”; a blank cell*

Hotel: “Off market” + “the market is closed” + chip **last print** / held is the opposite of a lift claim. Last print remains a named held fact (OPF36 · B1), not an outage and not a live bid/offer. Forbidding **Live** and **Pre/post** on this row keeps a dark plane from wearing a printing-session word.

**Hotel opinion (not a block · dialect homonym):** In some tape dialects, “off-market” means a print **away from** the prevailing NBBO (a bad or through-the-book print), not “session dark.” Coach named **Off market**; it stays. The member-read *“the market is closed”* is what blocks that homonym. Do not “clarify” by adding **stale**, **offline**, or **no data** — Echo correctly forbids those (they read as outage or as a still-almost-liftable quote).

**Hotel opinion (not a block):** Echo’s Pre/post must-not-say includes “you can lift this.” Off market’s list does not repeat that phrase. Not required for approval — “market is closed” + no Live already bars a lift. W3-2 may reuse the same forbid if a tooltip is written.

### 3. Does Held/residual avoid “still live through the close”?

**Yes. Echo forbids the exact false teachings.**

Echo (quoted):

> Badge / plane: **Held residual**  
> Package / curve: *Frozen last print / residual **plus** the named state. Numeric is allowed (Coach 2026-08-16). Curve is residual, never live. Member reads: settled; still on the card until midnight ET; not live.* Package-cell token: **HELD RESIDUAL**.  
> Must not say: *Live; open; “still trading”; “through the close”; “expires at the bell”; “expires at 4”; last print presented as current tape; a blank cell*

Hotel: This is Law C in member words. τ has fired; the card pointer is still current until the **next midnight Eastern Time**; the number is residual, **never live**. Forbidding “through the close”, “expires at the bell”, and “expires at 4” is the Hotel bar — those phrases would teach cash close as the EXPIRED clock and imply the contract is still a live market until the bell (or that death of the card is the bell). Echo does not teach that.

**Hotel opinion (not a block):** Keep the member-read as a **whole sentence**. “Settled” and “not live” must not be dropped if this line is used in a tooltip. “Still on the card until midnight ET” **alone** could be heard as “I still have until midnight to do something.” The card clock is a **display** clock (DL-393), not a trading window. The badge **Held residual** does not say “until midnight”; do not shorten chrome to that.

**Hotel opinion (not a block · precedence, not a word change):** Echo listed **Held residual** and **Expired** as their **own** plane badges, separate from **Pre/post** / **Off market** / **Live**. India H3/H4 (accepted · DL-398): `print_quality=live` is forbidden after that contract’s OPF29 instant; session last-print ≠ Law C Held/residual. When both a session class and a Law C clock apply (0DTE after τ while Massive is still `extended`; **AM-settled** contract while the house session is still `open`), **Law C wins the card’s claim.** A settled card must not inherit house **Live** or **Pre/post**. Echo already said *“Held residual is never Live”* and *“last print presented as current tape”* is forbidden on this row. Hotel is not adding a seventh word — only stating the waterfall implementers must not invert.

### 4. Would a wrong reading make a member worse?

**Yes — if they believed the harmful reading. Echo’s words do not teach that reading.**

Analyzer is capital-adjacent judgment (OT-EF §5). A member who treated a **last print**, a **residual**, or a **defined-debit ghost** as a **now-liftable** quote could size, delay an exit, or judge risk as if a live book still stood behind the number. That is worse than no mark.

| Harmful reading | Would it make them worse? | Do Echo’s labels teach it? |
|-----------------|---------------------------|----------------------------|
| Pre/post last print = RTH NBBO I can lift | **Yes** | **No.** Must-not-say: Live, NBBO, “after-hours live”, “you can lift this.” Member-read: not the RTH book. |
| Off market last print = a now-tradeable market | **Yes** | **No.** Member-read: market is closed. Must-not-say: Live, Pre/post. |
| Held residual = still live through the close / until 4 | **Yes** | **No.** Must-not-say those phrases. Member-read: settled; not live. |
| Held residual = I can manage it until midnight ET | **Yes** | **No**, if the full member-read is kept. See opinion on not shortening. |
| EXPIRED defined debit = live mark, or $0 “worthless”, or “you lost” | **Yes** | **No.** Ghost is defined debit, not a live mark. $0-as-worthless and profit theater forbidden. |
| No print = guess a mid / hammer retry as if the market is there | **Yes** (false market) | **No.** No number. UPDATING / CHECK LEGS. No guessed mid. |
| Live = last print / delayed / theoretical | Under-claim, not a false lift | Echo correctly forbids those on the Live row so a real NBBO is not silver-dressed. |

Hotel invariant 1 (block if the **statement** can harm capital through misunderstanding): the **statements Echo proposed** do not encode the harmful readings. The must-not-say columns are the lock. **No block.**

No sentence in the label file is a trading recommendation (buy, sell, lift, hold through). “This is the market now” on `open` + `live` is mark honesty, not an order.

---

## Row-by-row (objections beside Echo’s words)

Echo’s proposals stay. Hotel sits next to them.

### Plane table (six badges)

Echo (quoted):

> 1. `open` + `live` → **Live**  
> 2. `extended` + last print → **Pre/post**  
> 3. `closed` + last print → **Off market**  
> 4. Held / residual (after τ, before midnight ET) → **Held residual**  
> 5. EXPIRED (after midnight ET) → **Expired**  
> 6. `print_quality=none` → **No print**  
> **Last print** is not a seventh badge. It is the **package-quality phrase** under a number when OPF has a held print (`extended` or `closed`).

**Hotel:** Correct two-axis split (A6: live \| last print \| expired are named states). Badge **Last print** as if it were a session would collapse print quality into market class — Echo did not do that.

**Hotel opinion:** Sentence-case **Expired** on the plane vs Law B **EXPIRED** on the package replacement is Echo’s casing rule, not an honesty defect. Keep both; do not put a live-looking mid in the ALL-CAPS cell.

### `open` + `live` → **Live**

Echo (quoted): *The numeric live mark. Curve is the live book. Member reads: this is the market now.* Must not say: *Last print; held; delayed; estimated; theoretical; “approx”; Pre/post; Off market.*

**Hotel:** This is the **only** row that may read as a liftable RTH book — and only because OPF said `open` + `live` (defendable NBBO mid). Forbidding theoretical / approx / last print on this row is required. A theo mid wearing **Live** would be a false lift; Echo already barred the words.

### `extended` + last print → **Pre/post**

Quoted above under ask 1. **Hotel:** No false RTH-NBBO claim in the row as written.

### `closed` + last print → **Off market**

Quoted above under ask 2. **Hotel:** No now-tradeable-market claim in the row as written.

### Held / residual → **Held residual**

Quoted above under ask 3. **Hotel:** No “still live through the close.” Numeric + named state matches B2 (Coach 2026-08-16). Curve “residual, never live” matches A6 / Law C.

### EXPIRED → **Expired**

Echo (quoted): *Named state **EXPIRED** plus the **defined debit** on the viewport ghost. Never a blank price. Member reads: this expiration day has ended (after midnight Eastern Time). The ghost is the defined debit, not a live mark.* Must not say: *Live; last print as a current mark; a blank cell; **$0** as “worthless”; “you made / you lost”; profit theater.*

**Hotel:** Defined debit is an **entry lock**, not a tape. Echo says so. $0-as-worthless would teach a false terminal mark (and a P&L story). Profit-theater forbid is Hotel-aligned (process outcomes only).

**Hotel opinion (not a block):** Credit structures still use Coach’s “defined debit” name. Do not mint **defined credit** as a seventh package word. Sign the number as the package already does; the name stays **defined debit** + **EXPIRED**.

### `print_quality=none` → **No print**

Echo (quoted): *No number. … UPDATING while resolve is in flight; CHECK LEGS if the structure cannot bind. Member reads: no generation yet — the app is not broken.* Must not say: *Unavailable; OPF unavailable; error; broken; offline; retry; a guessed mid; last print (there isn’t one); a blank cell.*

**Hotel:** A guessed mid here would be an invented instrument price (severity high). Echo forbids it. Not a lift surface.

---

## Control grammar / HIG (honesty only)

Echo (quoted):

> **Plane badge** — Session / clock class of the feed (Analyzer chrome and Builder plane — same string): **Live · Pre/post · Off market · Held residual · Expired · No print**  
> **Package chip** — A **number** only when OPF can stand behind it, labeled **live** or **last print** or **held residual** or **defined debit**; otherwise a Law B ALL-CAPS name  
> **Curve** — Same claim as the package chip. … Never a second vocabulary (“focus series”, “stale quote”, “offline curve”)  
> Edit-with-last-print is Off market or Pre/post, never “OPF unavailable.”  
> Held residual is never Live.  
> Last print is not an outage.  
> EXPIRED is never a blank price.  
> No profit theater. No lift-now urgency on a last print or a ghost.

**Hotel:** Same claim on chip and curve is the anti-false-lift rule. “Stale quote” would still sound like a quote. Echo killed it. Edit-with-last-print as Off market / Pre/post is B1, not a lift.

**Hotel opinion (not a block · house chrome vs card):** “Analyzer chrome and Builder plane — same string” must not be read as **one global Live** stamped onto every card. House chrome may reflect OPF `market` (Live / Pre/post / Off market). A **card** past τ wears **Held residual** (or **Expired** after midnight ET) even if the house session is still open. That is Law C + H3, not a new badge. Echo’s “same claim as the package chip” already requires the card not to lie.

---

## Show (checkbox)

Echo: **Show** / **Hide**; not Focus; checking B must not un-show A.

**Hotel:** Not a quote claim. No trading-education defect. Tango’s lane if the verb is heavy; Hotel has no block.

---

## What Hotel did **not** do

- Did not rename Coach/Echo words.  
- Did not change Law C, OPF29, or envelope fields.  
- Did not invent chrome, colors, or a seventh badge.  
- Did not treat India’s H3/H4 as a WHETHER challenge.  
- Did not block on homonym risk, AM-settlement **placement**, or tooltip shortening — those are labeled opinions.

---

## Required change if this had been a block

**None.** No claim in `echo-labels.md` requires a word change for honesty.

If W3-2 ever ships a **naked number** as Live / Pre/post / last print / residual / defined debit **without** the matching name Echo already required, **that implementation** is a Hotel block at W3-3 / W5 — not a return of this seed.

---

## Hand-off

- **W1-G (Delta):** Hotel **APPROVED**. Echo’s table may stand.  
- **W1-2 Tango:** Parallel copy pass; Hotel does not dispose Tango notes.  
- **W3-2 Echo/Tango:** Use **these words**. Honor the pairing (number + live / last print / held residual / defined debit). Law C wins the card over house session.  
- **W3-3 Hotel:** Re-check the spec/HOW packet for the same false-lift test (`print_quality=live` only on defendable NBBO; `extended` ≠ RTH NBBO; last print ≠ lift-now; Held/residual never live). This W1-3 file does not close W3-3.

**What the next invocation can do that this one could not:** W1-G can cite a Hotel honesty sign-off with the four asks answered and the per-card vs house-chrome waterfall written as a labeled opinion, without re-opening the six-word list.
