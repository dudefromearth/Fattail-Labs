# FatTail Labs — OPF Session and Print Authority Spec v0.1

**Status:** **WHETHER = BUILD** (Coach W3-0 2026-08-16 · **DL-397**). Build the market-state feed. **HOW** review still lands (W3-1 India → Echo/Tango → Hotel). HOW may amend envelope shape / writer / OD-SESS. HOW does **not** reopen WHETHER.  
**Type:** Product Spec amendment — OPF feed law for session + live vs last print  
**Short name:** **OPF Session / Print**  
**Filename:** `FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md`  
**Date:** 2026-08-16  
**DL:** **DL-395** (intent locked; this file is the review packet)  
**Parent (normative after GO):** [`FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) (proposed **OPF34–36** · §3.8)  
**Also cites:** OT-EF Doctrine v1.0 · Analyzer Spec v0_2 §1.3 · Arch **28** · Arch **30**  
**Process:** Spec-first. Juliet plan: [`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`](../docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md) (board `agents/p-ot-ef-session-print/`). **WHETHER** is BUILD (DL-397). **No envelope coding** until W1-G + W2-G + **W3-G** (HOW packet). Coach 2026-08-16.

**Coach Content Law:** Coach’s words below are product intent. Reviewer objections sit **beside** them, labeled as the reviewer’s.

---

## 0. Phase 0 — Coach intent (verbatim, preserved)

> I feel the problem is at OPF, not in the client. OPF needs to manage the feed to the client. OPF need to tell the client when the market is open/closed. OPF needs to tell the market what the last print was, or that what you are seeing is not a live market, but the last known print. This is the behavior that OPF should control.

> The rule should take into account if there are pre and post market prices too. Don't just put a hard stop and start at market close and market open. My understanding is that Massive is printing pre and post market data.

> Yes, fix it, this is a bug as long as this bad behavior is allowed to continue.

> I don't want you to ever just jump into such a big infrastructure change without a multi-agent plan. Create the spec change, we will review it and go from there.

**Success (Coach):** The client does not invent session or print quality. OPF states them. Last print is not an outage. Pre/post Massive prints are in the feed when they exist. The Edit dialog does not flash “OPF unavailable” and retry-loop because RTH is closed.

---

## 1. Problem

Analyzer, Builder, and chain consumers currently **infer** market state and then **behave as if OPF is down** when that inference says “not RTH.”

Observed (2026-08-16):

| Symptom | What the client did | Why it is a bug |
|---------|---------------------|-----------------|
| Edit Position flashes **OPF unavailable** | Retry-loop on chain hydrate when RTH is closed | OPF still holds last print; Massive may still print pre/post |
| Cash-bell hard cut | Clock 09:30 / 16:00 or `session-status.open` only | Drops pre/post prints; treats extended hours as dead |
| Live vs last print is guessed | Analyzer `/session-status` + clock; ladder uses local `session_open` | Second SoR beside OPF marks |

This is a **feed-authority** defect. It will keep recurring as long as the client is allowed to invent session/print quality.

---

## 2. Law (normative after Coach GO)

Proposed parent laws **OPF34–36** (also listed on the OPF spec as **DRAFT until this spec is GO**):

| ID | Law |
|----|-----|
| **OPF34** | **OPF owns the session/print feed to the client.** The client does not invent open/closed, pre/post, or last-print vs live from a clock or a second Massive path. |
| **OPF35** | Every OPF envelope the UI consumes (package quote, resolve, chain generation, ladder) **must** say whether the market is **open / extended (pre-post printing) / closed**, and whether the marks are **live** or **last known print** (held). |
| **OPF36** | Last known print is a **named held fact**, not an outage. Missing generation → named incomplete. The client does not retry-loop OPF as “unavailable” when OPF has already said closed + last print. |

### 2.1 Session & print (OPF-SESS)

| ID | Meaning |
|----|---------|
| **OPF-SESS-1** | OPF tells the client **market state**: `open` (RTH) · `extended` (Massive still printing pre or post) · `closed` (plane dark). Not a client cash-bell 09:30 / 16:00 hard cut. |
| **OPF-SESS-2** | OPF tells the client **print quality** on every mark it serves: **live** or **last known print** (held last trade / prior close). The member must never have to guess. |
| **OPF-SESS-3** | Last known print is **valid instrument truth** while OPF holds that generation. It is not “OPF unavailable.” |
| **OPF-SESS-4** | The client **consumes** this envelope. It must not open a private Massive session poll, invent a clock fallback as SoR, or retry-loop the chain because RTH is closed. |
| **OPF-SESS-5** | Massive pre/post prints are **in** the feed when they exist. OPF labels them (not live RTH NBBO). Do not drop the feed at cash close if Massive is still printing. |

**RTH `open` vs `extended`:** `open` remains the only **Live NBBO claim** (RECON, “live” chip). `extended` is still a **printing** feed — last_trade / extended quote — labeled, not an outage.

---

## 3. Target envelope

Every ladder, package quote, and resolve **carries or cites**:

```text
opf_session: {
  market: "open" | "extended" | "closed",
  printing: boolean,                 // Massive still producing prints
  print_quality: "live" | "last_print" | "none",
  as_of: ISO-8601,
  generation_as_of: ISO-8601 | null
}
```

| Field | Meaning |
|-------|---------|
| `market` | Session class OPF computed (not the client clock) |
| `printing` | True while Massive is producing prints (RTH **or** pre/post) |
| `print_quality` | `live` = defendable NBBO mid; `last_print` = held last trade / prior close; `none` = no generation |
| `as_of` | When OPF stated this session fact |
| `generation_as_of` | When the held/live generation was written; null if `print_quality=none` |

**Consistency:** `market=open` ∧ complete NBBO → `print_quality=live`. `market=extended` → typically `last_print` (or live if a real book exists — OPF says which). `market=closed` ∧ generation held → `last_print`. `print_quality=none` → named incomplete, not retry-as-outage.

**India (HOW · W3-1 · not a WHETHER challenge):** `print_quality=live` is **forbidden** for a contract past its **OPF29** expiry instant (OT-EF Law C · DL-396). Extended hours + a remaining book ≠ live for a settled 0DTE. Session `market` is **not** τ. Cite of a global session object does **not** satisfy OPF-SESS-2 for `print_quality` — that field rides the mark-bearing payload. Full HOW: `agents/p-ot-ef-session-print/gate-reports/W3-1-india.md`.

Field names are **proposed**. Review may rename; the **facts** (market · printing · live vs last print · as_of) are Coach content and stay.

---

## 4. As-built (honest) — gap, not the law

| Surface | What exists today | Gap |
|---------|-------------------|-----|
| Package quote / resolve | `mark_mode` + `mark_disclaimer` + per-leg `mark_source` (`nbbo` / `last_trade` / `day_close` / `theo_bs`) | Package-level only; no session envelope on the feed |
| Chain ladder HTTP | Local clock `session_open` for 0DTE selectability (16:00 ET) | Clock, not OPF session SoR |
| Analyzer chrome | `GET /api/me/market/session-status` + clock fallback | **Second path** — rejected as client SoR |
| Massive | Pre/post prints; snapshot often zeros NBBO and still has last_trade / day | OPF already **forms** held mids; it does not **state session** on every envelope |

**Keep:** per-leg `mark_source` and package `mark_mode`. The session envelope **sits beside** them. Do not delete mark_mode.

---

## 5. Client duty (after the envelope exists)

| Must | Must not |
|------|----------|
| Display OPF `market` + `print_quality` (badge, package chip, Builder plane) | Invent open/closed from 09:30–16:00 ET |
| Treat `last_print` as held truth; draw / quote from that generation | Flash **OPF unavailable** when `print_quality=last_print` |
| One hydrate when `printing=false` and last print is already held | Retry-loop chain/resolve because RTH is closed |
| Consume OPF as the only session SoR | Private Massive `/marketstatus` or clock as SoR when OPF is warm |

`GET /api/me/market/session-status` may remain as an **OPF/L0 input** (bus Redis / Massive). It is **not** a member-client SoR after GO.

---

## 6. Member experience (target)

| State | Badge / plane | Package / curve | Member reads |
|-------|---------------|-----------------|--------------|
| `open` + `live` | Live | Numeric live mark | This is the market now |
| `extended` + `last_print` | Pre/post | Numeric held + disclaimer | Pre/post print — not RTH NBBO |
| `closed` + `last_print` | Off market | Numeric last print + held | Last known print — market is closed |
| `none` | Named incomplete | UPDATING / CHECK LEGS as today | No generation yet — not “the app is broken” |

Copy is **honest**. No “unavailable” when OPF has a last print.

---

## 7. Scope

### In scope (this spec)

- Session/print **authority** and the envelope facts  
- Mapping to existing `mark_mode` / `mark_source`  
- Client **consumption** rules (no second SoR, no outage loop)  
- Pre/post Massive prints **in** the feed when present  
- Acceptance tests and open decisions for the later plan  

### Out of scope (this spec)

- Implementation, migrations, Juliet execution plan, seeds  
- Deleting `/session-status` in this draft  
- Changing τ / 16:00 **settlement** law (OPF29) — that is expiry instant, not session SoR  
- Brokerage hours, Tradier, OMS  
- Inventing a third market-data vendor  

### Non-goals

Client-side “fix” that keeps inventing session. MSC as SoR. Silent last-print presented as live.

---

## 8. Ideas inventory (Phase 0)

| Idea | Disposition |
|------|-------------|
| OPF manages the feed to the client | **IN-SCOPE** |
| OPF tells client open/closed | **IN-SCOPE** |
| OPF tells client last print vs live | **IN-SCOPE** |
| Pre/post Massive prints count; no cash-bell hard cut | **IN-SCOPE** |
| Last print ≠ OPF unavailable | **IN-SCOPE** |
| Envelope field names (`opf_session`, `printing`, …) | **IN-SCOPE** (names may change in review; facts stay) |
| `/session-status` becomes OPF-only L0 input | **IN-SCOPE** (target) |
| Exact poll cadence while `extended` | **DEFERRED** to execution plan |
| Juliet multi-agent **sequencing** plan | **IN-SCOPE** — landed 2026-08-16; BUILD packets still wait for W3-0 |
| Juliet multi-agent BUILD (W4+) | **DEFERRED** — after Echo labels + Delta characterization list + Coach GO |
| Client removal of clock fallback | **DEFERRED** to execution plan (after envelope ships) |
| Header marks UI | **FLAGGED** — still no header surface Spec (existing market invariant 8) |

---

## 9. Acceptance (after BUILD — not this draft)

| AT | Criterion |
|----|-----------|
| **AT-SESS-1** | Ladder, package-quote, and resolve each carry or cite `opf_session` |
| **AT-SESS-2** | `market=extended` when Massive `extended-hours` / printing; not `closed` |
| **AT-SESS-3** | `print_quality=last_print` when mids are last_trade / day_close; UI does not say unavailable |
| **AT-SESS-4** | `market=closed` + held generation → last print served; client does not retry-loop |
| **AT-SESS-5** | Client has **no** clock SoR when OPF envelope is present |
| **AT-SESS-6** | Builder Edit with last print open does **not** flash OPF unavailable |
| **AT-SESS-7** | Live RTH still claims `print_quality=live` and RECON as today |

---

## 10. Open decisions — **Accepted** (Coach 2026-08-16 · **DL-398**)

India HOW shape (W3-1 H1–H4). Draft recommendations kept. Accept sits beside them.

| ID | Question | Draft recommendation (kept) | **Accept (India shape)** |
|----|----------|-----------------------------|--------------------------|
| **OD-SESS-1** | Envelope on every payload vs one cited session object? | Both: one OPF session object; payloads include or cite it | **Accept + split (H2):** `print_quality` + `generation_as_of` on every mark-bearing payload. Cite-by-hash only for `market` / `printing` after snapshot. |
| **OD-SESS-2** | Who writes `mb:session:*`? | Bus writer L0 input; **OPF** is what the client reads | **Accept (H1):** do not overwrite `mb:session:market_status`. OPF computes `opf_session`. No Massive from the envelope writer. |
| **OD-SESS-3** | Index 16:15 vs equity 16:00 for `open` → `extended` | Product table / profile; OPF states it | **Accept as written.** Session class, not τ. |
| **OD-SESS-4** | Keep Analyzer `/session-status` as a shim until cutover? | Yes, labeled shim; drop as SoR with the envelope | **Accept as written.** Shim through W4; drop as member SoR in W5. Do not delete the route in W3/W4. |

Also W4 law (India H3–H4, Coach accepted with the set): no `print_quality=live` after that contract’s OPF29 expiry instant; session last-print ≠ Law C Held/residual.

---

## 11. Review gates (required before any plan)

| Gate | Agent | Asks |
|------|-------|------|
| Spec / architecture | **India** | Domain: is OPF the right SoR? Envelope vs bus? Invariant clash with B2 / Arch 28? |
| Design / member | **Echo + Tango** | Badge/copy: Live · Pre/post · Off market · last print. No panic on closed. |
| Trading honesty | **Hotel** | Live vs last print must not be misread as a quote they can lift now |
| Final | **Coach** | GO / return |

**Juliet** sequencing plan is on disk. W3-0 WHETHER is **BUILD** (DL-397). W1 (Echo labels) and W2 (Delta characterization list) still fire before envelope code. **W4 fires when W1-G + W2-G + W3-G pass.** India shapes HOW.

---

## 12. Success criterion (spec review)

A reviewer can validate, without reading implementation code:

1. Who owns session and print quality (**OPF**).  
2. What the client is forbidden to invent.  
3. That last print is held truth, not an outage.  
4. That pre/post prints are in the feed when Massive has them.  
5. What as-built is, and that BUILD waits for GO + a multi-agent plan.

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-16 | DRAFT from Coach Phase 0. WHETHER = BUILD (DL-397). |
| **v0.1 + India HOW notes** | 2026-08-16 | W3-1: labeled India note beside §3 consistency; §14 reviewer section. Coach Phase 0 untouched. |

---

## 14. India HOW review (W3-1 · 2026-08-16)

**Lane:** HOW only. **WHETHER = BUILD** (Coach W3-0 · DL-397). This section does **not** reopen OPF as SoR. It does **not** change OPF29. Coach Phase 0 is intact above.

**Verdict:** **APPROVED** for HOW. Gate report: [`agents/p-ot-ef-session-print/gate-reports/W3-1-india.md`](../agents/p-ot-ef-session-print/gate-reports/W3-1-india.md).

**W4 must honor (India recommended Accepts — Coach may discard opinions; Law C lock is not optional):**

| # | Lock | Cite |
|---|------|------|
| **H1** | Bus `mb:session:market_status` stays the Massive L0 document (sym_feed writer). OPF **computes** the client envelope. Do not overwrite that key. | OD-SESS-2 · Arch 28 §5 · Market Bus Spec “one writer per upstream class” |
| **H2** | `print_quality` + `generation_as_of` **on every** mark-bearing payload (ladder, package-quote, resolve). Cite-by-hash only for session class (`market` / `printing`) after a snapshot. No second WebSocket. No client Massive. | OD-SESS-1 · OPF-SESS-2 · OPF35 · Arch 28 one WS |
| **H3** | Session envelope does **not** feed τ. `print_quality=live` is forbidden after that contract’s OPF29 expiry instant, even if Massive is still printing extended. | OPF29 · OT-EF Law C · this spec §7 NX · plan NX12 |
| **H4** | Session `last_print` = mark quality (not an outage). Law C **HELD / RESIDUAL** = between-clocks pointer. Do not collapse the two “helds.” | OT-EF B1 · OPF36 · Law C |

**OD-SESS-3 (opinion):** Accept draft — product table / profile (index 16:15 vs equity 16:00). OPF states the class; not a client constant.

**OD-SESS-4 (opinion):** Accept draft — keep `/session-status` as a **labeled as-built shim** until W5; it is not member-client SoR once the envelope is present. Do not delete the route in W4.

**Not a clash:** Analyzer B2 is the shim named in §4 / OD-SESS-4. Arch 28 one-WS / no-client-Massive is honored by H1–H2. OT-EF B1 last-print-as-held **aligns** with OPF36 (no outage loop).
