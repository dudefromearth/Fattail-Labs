# W3-1 — India Session/Print HOW review

**Date:** 2026-08-16  
**Agent:** India  
**Artifact:** `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md`  
**Workflow:** `agents/bench/spec-create-review-workflow.md` Phase 2  
**Parents read:** OT-EF v1.1 Law C + B1 · OPF v0.2.1 OPF29 / proposed OPF34–36 / §3.7–3.8 · Arch 28 · Market Bus Spec v1.0.1 session topic · Analyzer Spec v0_2 §1.3 B2 / AZ-POSTURE-1 · Arch 30 topology · plan v1.0.1 · DL-395 · DL-396 · DL-397 · W3-0 GO · as-built `server/routes/market_session.py` · `web/lib/market/usEquitySession.ts`  
**Coach Content Law:** nothing of Coach’s was removed. Objections sit beside, labeled India’s.

---

## Up front

This pass **did not drop or rewrite** Coach Phase 0, OPF34–36 facts, or the envelope field *facts*.

India **added** (labeled, beside the text — not a silent rewrite):

1. One **India (HOW · W3-1)** note immediately after the §3 consistency paragraph.  
2. Spec **§14** India HOW review section.  
3. A document-control row pointing at this gate report.

Document-control **v0.1 notes** cell only: replaced stale “No BUILD” with “WHETHER = BUILD (DL-397)” so §13 matches the header Coach already set. Not a product-scope change.

WHETHER is untouched (**BUILD** · DL-397). This verdict does **not** mean “do not build this program.”

---

## Verdict

| Gate | Verdict |
|------|---------|
| **HOW** (envelope shape · writer · OD-SESS · parent clash) | **APPROVED** |
| **WHETHER** | **Not in scope.** Already **BUILD** (Coach W3-0 · DL-397). Not reopened. |

W4 may expand the Alpha envelope seed against the four HOW locks below. Envelope **code** still waits for **W1-G + W2-G + W3-G**.

---

## Coach content intact?

**Yes.** Phase 0 verbatim. Success criterion intact. OPF34–36 / OPF-SESS-1…5 facts intact. Envelope facts (`market` · `printing` · live vs last print · `as_of`) intact. Ideas inventory not deleted. `/session-status` not marked for deletion. OPF29 not touched.

---

## The six asks

### 1. Is OPF the right SoR for session + print quality?

**Yes.** That is Coach Phase 0 and **DL-395**. India does not relitigate WHETHER.

**Why OPF, not the bus, not a client clock** (architecture, not a product veto):

| Candidate | What it actually knows | Why it cannot be the *client* SoR |
|-----------|------------------------|-----------------------------------|
| **Client clock** | 09:30–16:00 ET weekday heuristic | Holidays, early close, pre/post prints, whether OPF holds a generation. This is the bug (spec §1). |
| **Bus `mb:session:market_status`** | Raw Massive `GET /v1/marketstatus/now` (sym_feed writer · Arch 28 §5 · Market Bus Spec §4.1) | L0 **input**. It does not know product session bounds (OD-SESS-3: index 16:15 vs equity 16:00) or whether *this* generation’s marks are NBBO vs last_trade vs none. |
| **OPF (L2/L4)** | Massive session doc + product table + the generation it holds | Can state **market class** and **print quality of the marks it is serving**. That is OPF34–36. |

Layer map already says so: OPF Spec §1 L0 = transport (sym/session); §3.1 session status is **OPF-owned** after this program. Analyzer A3 target column is the same (OT-EF v1.1).

As-built confirmation (research, not a challenge): Massive `market` values used today are `open` · `closed` · `extended-hours` · `early-close` (`market_session.py`). Coach’s “Massive is printing pre and post” matches `_printing_from_massive_doc` (`extended-hours` ⇒ printing). The missing piece is OPF **stating** that on every envelope, not the client inferring it.

### 2. Envelope-on-payload vs cited session object (OD-SESS-1)

**Opinion (India recommended Accept — Coach may discard the *shape*, not the facts):**

**Both, split by fact class.**

| Fact | Where it lives | Why |
|------|----------------|-----|
| Session **class** (`market`, `printing`, session `as_of`) | One OPF-computed object. HTTP payloads **include** it. WS may **cite** by hash after snapshot (existing `session` topic on the **one** market stream). | Slow (Massive 30–60s). Shared across envelopes for a product. |
| Print **quality** (`print_quality`, `generation_as_of`) | **On every** mark-bearing payload (ladder, package-quote, resolve). Cite-only is **not** enough. | OPF-SESS-2 / OPF35: quality is a property of *the marks being served*. A global cited object can be stale vs a new generation. |

This is a refinement of the spec’s own draft rec (“Both: one OPF session object; payloads include or cite it”). It does not invent a third GET as member SoR. A standalone `GET /api/me/pricing/session` may exist as an **OPF L0/L4 helper**; after GO it is **not** a second client SoR beside the envelope (same rule as `/session-status`).

**Not a block.** If Coach prefers “always include the full blob, never cite,” that also satisfies OPF-SESS-2. Cite-only for `print_quality` would not.

### 3. Who writes `mb:session:*` (OD-SESS-2)

**Opinion (India recommended Accept):**

| Key | Writer | Role |
|-----|--------|------|
| `mb:session:market_status` | **Existing `sym_feed`** (unchanged) | Massive L0 document. Market Bus Spec §5.2 + “one writer per upstream class.” |
| Client `opf_session` | **OPF** (compute at package-quote / resolve / ladder assemble) | What the member client reads. |

Do **not** overwrite `mb:session:market_status` with the OPF interpretation. That would collapse L0 and L2 and create a second writer on a bus key (Arch 28 / Market Bus Spec hard rule).

Optional later cache `mb:session:opf:{product}` is **not required for W4**. If added, it is a **derived** key, not a replacement for the Massive doc.

OPF envelope writer **reads Redis** (or the already-hydrated generation). It does **not** call Massive `marketstatus/now`. As-built `/session-status` already has a labs-api Massive miss path (`market_session.py` step 2). W4 must not add another. **Opinion:** W4 L0 read is Redis-only; if the session doc is missing, session class is a named incomplete, not a clock and not a new Massive hop.

### 4. Clash with Analyzer B2 or Arch 28?

**No invariant clash.** Cutover, not contradiction.

**Analyzer B2** (Analyzer Spec §1.3 · AZ-POSTURE-1 · review table §15): as-built `GET /api/me/market/session-status` + labeled clock fallback. The same spec already names **this** Session/Print envelope as the target SoR and the B2 path as the **wrong client SoR, keep until the envelope ships**. That is OD-SESS-4. W4 does not delete the route (plan NX10). W5 drops it as member SoR when the envelope is present.

B2 chrome states (`Live` · `Held` · `Closed` · `Error`) are **as-built words**. Echo’s W1 seed owns the mapping onto `open` / `extended` / `closed` + `live` / `last_print` / `none`. India does not invent chrome.

**Arch 28:** one WebSocket per tab; Massive only from feeds or single-flight miss; no client Massive. Honored if W4:

- attaches `opf_session` to existing OPF HTTP (ladder / package-quote / resolve);  
- if published on WS, uses the **existing** `/api/me/market/stream` `session` topic (already in Arch 28 §4.1 / Market Bus Spec §6.3);  
- does not open a second socket;  
- does not have Next.js or the member client call Massive `/marketstatus`.

Header UI remains **out** (market invariant 8 · spec ideas inventory FLAGGED · plan NX4).

### 5. Two clocks: does this spec accidentally change τ / OPF29?

**The spec does not change OPF29.** §7 out of scope and plan NX12 say so explicitly. Session class ≠ expiry instant ≠ EXPIRED midnight ET.

**HOW hole (law, not WHETHER):** §3 consistency says `market=extended` → typically `last_print` **“or live if a real book exists — OPF says which.”** Read literally, W4 could claim `print_quality=live` on a **settled 0DTE** during Massive extended hours. That would break **OT-EF Law C** / **OPF29** (after the expiry instant the card is Held / residual, **never live**).

Coach text stays. India’s note now sits beside that sentence. **W4 honor H3:** session `market` is not an input to τ; `print_quality=live` is forbidden after that contract’s OPF29 expiry instant, even if Massive is still printing.

These are **three facts**:

| Fact | Clock / SoR | After 16:00 ET on a PM 0DTE |
|------|-------------|------------------------------|
| τ / settlement | OPF29 expiry instant | Settled |
| Card pointer | Law C EXPIRED = next midnight ET | Still **current** until midnight → **HELD / RESIDUAL** |
| Session / print | This envelope | May be `extended` + `printing=true` on the underlier; option mark is **`last_print`**, never live |

A 45DTE after cash close is `last_print` (session) and **not** Law C residual (its τ is not done). Do not wire session close into settlement.

### 6. Invariant clash with last-print-as-held (OT-EF B1)?

**No clash — they align.**

| Law | Sentence | This spec |
|-----|----------|-----------|
| OT-EF **B1** | “Last known print is not an outage. Do not flash OPF unavailable when OPF holds a last print (DL-395).” | OPF36 · OPF-SESS-3 · AT-SESS-3/4/6 |
| OT-EF **A6** | A last print must not render as live. | `print_quality` is named; `open`+complete NBBO is the only Live NBBO claim (spec §2.1) |

**Vocabulary (HOW, not a block):** B1/OPF36 “held” means **OPF still has a generation**. Law C **HELD / RESIDUAL** means **between the two clocks**. Spec §6 “Numeric last print + held” uses the first sense. Echo already seeds both label families (Live · Pre/post · Off market · last print · Held residual · EXPIRED). **W4 honor H4:** do not map session `last_print` onto Law B **HELD / RESIDUAL** (that would ghost or freeze far-dated cards at cash close).

---

## Blocks (invariant | law | system only)

**None that reopen WHETHER.**

The only **law** item is H3 (do not let §3 “live if a book exists” override OPF29 / Law C). That is a HOW lock, filed beside the sentence. It is **not** a program veto.

---

## Opinions / HOW recommendations W4 must honor

Coach may discard **shape** opinions (cite vs always-include; optional derived Redis key). **H3** is law (OPF29 · Law C), not taste.

| # | Lock | Cite |
|---|------|------|
| **H1 — writer** | `mb:session:market_status` remains the Massive L0 document (`sym_feed`). OPF **computes** `opf_session`. Do not overwrite that key. OPF does not call Massive for session. | OD-SESS-2 · Arch 28 §5 · Market Bus Spec “one writer per upstream class” · OPF1 |
| **H2 — envelope** | `print_quality` + `generation_as_of` on **every** mark-bearing payload. Cite-by-hash only for `market` / `printing` after snapshot. No second WS. No client Massive. Keep `mark_mode` / `mark_source` beside the envelope. | OD-SESS-1 · OPF-SESS-2 · OPF35 · Arch 28 one WS · spec §4 “Keep” |
| **H3 — two clocks** | Session envelope does **not** feed τ. `print_quality=live` forbidden after that contract’s OPF29 expiry instant. Extended + book ≠ live for a settled option. | OPF29 · OT-EF Law C · DL-396 · spec §7 · plan NX12 |
| **H4 — two helds** | Session `last_print` = mark quality, not an outage (B1 / OPF36). Law C **HELD / RESIDUAL** = between-clocks pointer. Do not collapse them. | OT-EF B1 · OPF36 · Law C · Echo W1 labels |

### OD-SESS recommended Accepts (opinions until Coach Accepts at W3-G)

| ID | India | Notes |
|----|-------|-------|
| **OD-SESS-1** | **Accept + split** (H2) | Full object on HTTP quote/resolve/ladder. Cite allowed for session class on WS after snapshot. `print_quality` never cite-only. |
| **OD-SESS-2** | **Accept** (H1) | Bus writer = L0 input; OPF = what the client reads. Distinct keys. |
| **OD-SESS-3** | **Accept as written** | Product table / profile. Index 16:15 vs equity 16:00 is **session class**, not τ. OPF states it; not a client constant. |
| **OD-SESS-4** | **Accept as written** | Keep `/session-status` as labeled shim through W4; drop as member SoR in W5 when envelope present. Do not delete the route in W3/W4. |

---

## Flagged ideas

**Inventory intact.** Header marks UI remains **FLAGGED** in the spec’s own §8 (market invariant 8). No new FI. The two-held vocabulary is a W1/W4 honor, not a parked product idea.

---

## Bench delta

What the next invocation (W3-2 · W3-3 · W3-G · W4 Alpha expand) gains that this one did not have:

1. **HOW verdict on disk** — APPROVED, WHETHER not reopened.  
2. **Four W4 locks (H1–H4)** — writer, payload-vs-cite, OPF29 non-overtake, two “helds.”  
3. **OD-SESS-1…4 recommended Accepts** ready for Coach at W3-G (plan §4.1 was waiting on W3-0, which already fired as WHETHER).  
4. **Parent clash map** — B2 is the named shim; Arch 28 one-WS holds; B1 aligns with OPF36; Law C is a third clock from session.  
5. **Labeled notes on the spec** — §3 consistency cannot be read as “extended book ⇒ live on settled 0DTE” without seeing India’s HOW constraint.

---

## Build disposition

**APPROVED** for **HOW**.

Not a WHETHER veto. Not BUILD AUTHORITY for envelope code (W1-G + W2-G + W3-G still required). Echo / Tango / Hotel still review labels and quote honesty (W3-2 · W3-3).
