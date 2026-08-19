# FatTail — Native Apply Form Spec v0.1

**Status:** **DRAFT** — not BUILD AUTHORITY · not ACCEPTED  
**Type:** Product Specification (Phase 1 — Juliet draft from Coach Phase 0)  
**Short name:** **Native Apply**  
**Filename:** `FatTail-Native-Apply-Form-Spec-v0.1.md`  
**Public URL (Coach):** `https://fattail.ai/apply`  
**Date:** 2026-08-19  
**DL stub:** **DL-450** (draft-intent: this file exists — **not** a Coach lock)  
**Process:** Spec-first. **Not BUILD** until chair / Coach GO. No Juliet execution plan, seeds, or form code until that GO.

**Coach Content Law:** Coach’s words below are product intent. Reviewer objections sit **beside** them, labeled as the reviewer’s. This draft does **not** drop Coach content.

**This draft does not authorize:** a Next.js page, a WordPress plugin, an ActiveCampaign API implementation, a Labs `/signup` rewrite, or any Strategy Lab product change.

---

## 0. Phase 0 — Coach / chair intent (verbatim, preserved)

> Native application at **https://fattail.ai/apply** (today this URL is HTTP 404; WordPress has no apply slug; Labs has /signup and /membership only). The desk cannot set until this form writes Cole’s seven ActiveCampaign handoff fields. Those fields exist and have zero writes.

> The seven fields (Bob created in AC, 2026-08-19 walk — do not rename, do not add sales fields):
> 1. Hell Island — HELL
> 2. Heaven Island — HEAVEN
> 3. Money/timing — MONEY_TIMING
> 4. Coaching SKU — COACHING_SKU
> 5. Can make 11am ET — ELEVEN_AM_ET
> 6. What they tried — TRIED
> 7. Partner/support — PARTNER_SUPPORT

> Existing apply path to replace as the write source: go.0-dte.com/application (private Typeform). ClickFunnels today only collects name, email, phone. Live join on fattail.ai is Woo Add to cart, not an application.

**Success (Coach):** Shaw can book and Cole can close because a submit on `/apply` produces **non-empty values on all seven AC fields** for that contact. Evidence is ActiveCampaign `fieldValues`, not “it should work.”

---

## 1. Purpose

Ship a **native** FatTail application (HIG web, not Typeform, not ClickFunnels) at **`https://fattail.ai/apply`** whose job is to **write Cole’s seven ActiveCampaign handoff fields** so:

- **Shaw** can book.
- **Cole** can close.
- The desk can **set**.

Until those seven fields are written, the desk cannot set. That is the product reason this form exists.

This is **not** Labs account creation (`/signup`). This is **not** WooCommerce checkout (live join on fattail.ai today). This is **not** a Strategy Lab surface.

**Native** here means FatTail-owned apply — our URL, our labels, our write path — replacing the private Typeform as the **write source**. It does **not** mean a native App Store app.

---

## 2. As-built (research — not a host pick)

Recorded so India can review against reality. **None of this is a BUILD pick.**

| Fact | Evidence / source |
|------|-------------------|
| `https://fattail.ai/apply` is the intended public URL | Coach Phase 0. Chair: today HTTP 404 |
| WordPress on fattail.ai has **no** apply slug | Coach Phase 0 |
| Labs (`labs.fattail.ai`) public funnel is **`/signup`** and **`/membership`** only | Coach Phase 0 · Arch 01 · `Architecture/03-frontend-design.md` |
| Existing apply **write source** is private Typeform at `go.0-dte.com/application` | Coach Phase 0 — **replace this as the write source** |
| ClickFunnels today collects **name, email, phone** only | Coach Phase 0 — not the seven handoff fields |
| Live join on fattail.ai is **Woo Add to cart**, not an application | Coach Phase 0 |
| Shared FatTail / 0-DTE ActiveCampaign account already exists | `Specs/FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0.md` · **DL-064** · `server/activecampaign.py` |
| Labs AC v1 writes **waitlist leads** (email + `Labs Lead` tag) and is **best-effort** (never fails the waitlist) | Lead Sync Spec §2 / §4 · DL-064. **Custom fields are explicitly out of that spec.** |
| Bob created Cole’s seven fields in AC on the **2026-08-19 walk**; they exist and have **zero writes** | Coach Phase 0. Draft-time: ActiveCampaign MCP was unavailable — **numeric field IDs are not invented here** |
| Observer membership term is **six weeks** (product law) | Membership Tiers Spec v1.0 · **DL-128**. Do **not** copy a live PDP “four weeks” contradiction |

**Do not** treat Labs waitlist `sync_lead()` as this form’s write path. That module does not write custom fields, and it is allowed to “succeed” the member while AC fails. This apply form may **not** inherit that pattern.

---

## 3. Law (normative after Coach GO — draft until then)

| ID | Law |
|----|-----|
| **APPLY-1** | The public apply URL is **`https://fattail.ai/apply`**. |
| **APPLY-2** | The form’s job is to write **Cole’s seven** ActiveCampaign handoff fields (this spec §4). Do **not** rename the AC keys. Do **not** add sales qualifier fields. |
| **APPLY-3** | Writes go to ActiveCampaign **`fieldValues` on the contact**. Contact key is email (this spec §5). |
| **APPLY-4** | **Fail loud.** If any of the seven writes miss, the submit is **not** success. Zero silent success. No thank-you that implies Shaw can book when AC is empty or incomplete. |
| **APPLY-5** | Evidence of done is **non-empty `fieldValues` on all seven fields** for that contact — not a 200, not a thank-you page, not “it should work.” |
| **APPLY-6** | This form **replaces Typeform (`go.0-dte.com/application`) as the write source** for those seven fields. |
| **APPLY-7** | Member-facing chrome follows **Apple HIG for Labs web** (Human Interface Spec v1.0): visible **labels**, **one primary CTA**, **inline errors**. No insider jargon. No profit claims (Tango). |
| **APPLY-8** | If Observer term appears in apply-adjacent copy, it is **six weeks** (**DL-128**). Do not copy a live PDP “four weeks” contradiction. |
| **APPLY-9** | **Not BUILD** until chair / Coach GO. This file is DRAFT. |

---

## 4. The seven fields (normative)

Bob created these in ActiveCampaign (2026-08-19 walk). **Do not rename. Do not add sales fields.**

| # | Coach title | AC key (do not rename) | Role |
|---|-------------|------------------------|------|
| 1 | Hell Island | `HELL` | Cole handoff |
| 2 | Heaven Island | `HEAVEN` | Cole handoff |
| 3 | Money/timing | `MONEY_TIMING` | Cole handoff |
| 4 | Coaching SKU | `COACHING_SKU` | Cole handoff |
| 5 | Can make 11am ET | `ELEVEN_AM_ET` | Cole handoff |
| 6 | What they tried | `TRIED` | Cole handoff |
| 7 | Partner/support | `PARTNER_SUPPORT` | Cole handoff |

**Non-empty** means each of the seven has a stored `fieldValue` that is not blank after submit. A contact with email and six filled fields is a **miss**.

### 4.1 What this draft does **not** invent

These are **open for Echo / Cole / Bob after GO** — not invented here, not implied by the keys:

- Member-facing question wording (Echo owns labels — Phase 3).
- Option lists, SKU catalogs, or boolean vs free-text control types.
- ActiveCampaign numeric field IDs (`field` integers). Implementation (after GO) **resolves IDs from the live account** against Bob’s existing fields. Do not hardcode guessed IDs in a spec.

**Juliet opinion (not law):** keep AC perma / titles stable as Bob created them; Echo’s member labels may differ from the AC titles so the form does not leak desk jargon (APPLY-7). Cole still reads the seven keys.

---

## 5. Identity plumbing (required to write AC — not a sales invention)

ActiveCampaign `fieldValues` attach to a **contact**. The form therefore requires identity sufficient to upsert that contact.

| Field | Status | Why |
|-------|--------|-----|
| **Email** | **Required plumbing** | AC contact key (`POST /api/3/contact/sync` by email). Without it, there is no contact to write. |

Labeled as **plumbing**, not a new qualifier. Coach forbade adding **sales** fields. Email is the contact key, not a Cole close question.

ClickFunnels already collects **name, email, phone**. Those may already exist on the AC contact. This form still requires **email** on submit so the write is keyed even if the visitor did not arrive from ClickFunnels.

**Juliet opinion (not law):** first name is useful for Shaw to book; it is **not** one of Cole’s seven and is **not** added as a sales qualifier in this draft. If Echo/India need a name field for booking, label it **plumbing** and do not expand the seven.

---

## 6. Write contract (ActiveCampaign)

### 6.1 Target

Shared FatTail / 0-DTE ActiveCampaign account (same account as Lead Sync / DL-064).

**SoR for the seven answers:** ActiveCampaign contact **`fieldValues`**.

Illustrative AC v3 shape (not an implementation packet):

```text
upsert contact by email
  → write fieldValues for HELL, HEAVEN, MONEY_TIMING, COACHING_SKU,
    ELEVEN_AM_ET, TRIED, PARTNER_SUPPORT
```

### 6.2 Fail loud (APPLY-4)

| Outcome | Member-facing | Desk / evidence |
|---------|---------------|-----------------|
| All seven `fieldValues` written, non-empty | Success may be shown | Shaw can book; Cole can close |
| AC unconfigured, half-configured, timeout, HTTP error, or any field missing / empty after write | **Not** success. Inline (and page-level if needed) **truthful** error. No silent thank-you | Zero silent success |
| Partial write (some fields land, others miss) | **Not** success | A miss. Do not tell the desk the contact is set |

**Forbidden:** treating a Labs 200, a Woo cart, or a ClickFunnels opt-in as apply success.

**Contrast (do not inherit):** Lead Sync Spec §4 / `sync_lead()` **never raises** and the waitlist still returns 200. That is correct for a waitlist email. It is **wrong** for Cole’s handoff. Apply submit **fails the member-visible action** when the seven writes miss.

**Juliet opinion (not law):** whether a partial write should be rolled back vs left and retried is an India HOW question. Law is only: do not claim success.

### 6.3 Config (after GO — not a BUILD packet)

When `/apply` is live, ActiveCampaign must be configured. Half-config **fails loud**. “Skipped because unset” is **not** allowed for this path (unlike waitlist when `LABS_AC_REQUIRED` is off).

This draft does **not** name env vars or authorize a new `server/` module. That is execution after Coach GO.

---

## 7. Member experience (Echo / HIG + Tango)

Normative **bar**, not pixel art. Echo still owns labels and layout in Phase 3.

| Rule | Source |
|------|--------|
| Visible **labels** on every field — never placeholder-only | HIG Spec §6.2 `TextField` |
| **One primary CTA** per region (submit) | HIG Spec §2.1 Clarity |
| **Inline errors** on the field that failed; Toast is never the sole carrier of an error the member must act on | HIG Spec §2.1 Feedback · §6.3 |
| Targets ≥ 44×44 pt; keyboard; associated label; WCAG AA | HIG Spec §2.1 |
| No emoji as chrome | HIG Spec §2.1 |
| **No insider jargon** on the member surface (desk names like Hell Island / Heaven Island are AC titles; Echo may use plain language) | Coach · Tango |
| **No profit claims** — process / fit / booking, never “you will make” | Tango · North Star v1.2 · doctrine |
| Observer term, if mentioned, is **six weeks** | APPLY-8 · DL-128 |

Capacity-over-dependency (Tango): this form qualifies for **booking**, it does not hook, shame, or sell a dream with P&L flex.

---

## 8. Scope

### 8.1 In scope (this spec, after Coach GO)

- Native apply at **`https://fattail.ai/apply`**.
- Collect the **seven** answers + **email plumbing**.
- Write all seven to AC **`fieldValues`** on that contact.
- Fail loud on any miss.
- Replace Typeform as the **write source**.
- HIG / Tango bar in §7.

### 8.2 Out of scope (do not expand this draft)

| Out | Why |
|-----|-----|
| **Strategy Lab** | Coach: do not touch. Different product surface |
| **Tradier** | Coach: out |
| **Labs `/signup` rewrite** | Coach: out. `/signup` remains identity / free account |
| **Discounting** | Coach: out |
| **Inventing extra qualifier fields** | Coach: do not add sales fields |
| **Tickets to CEO / CTO** | Coach: out |
| Woo Add to cart / checkout rewrite | Live join is a different job |
| ClickFunnels replacement | CF still collects name / email / phone; this form writes the seven |
| WordPress plugin or Next.js page **in this draft** | Draft only — no implementation |
| Typeform account deletion / ops sunset | Replacing the **write source** is in scope; killing the Typeform tenant is ops, not this spec |
| Lead-sync retag, lists, automations, unsubscribe | Lead Sync Spec owns that lane |
| Visualize AI, Bot Marketplace, Community Discord | Unrelated |
| Dual-host Practice vs Labs cutover | DL-248–250 — not this program |

---

## 9. Ideas inventory (never silently dropped)

| ID | Idea | Disposition |
|----|------|-------------|
| **IN-1** | Native HIG apply at fattail.ai/apply | **IN-SCOPE** |
| **IN-2** | Write Cole’s seven AC fields (Bob 2026-08-19; do not rename) | **IN-SCOPE** |
| **IN-3** | Email / contact key as required plumbing | **IN-SCOPE** (labeled plumbing) |
| **IN-4** | Fail loud; zero silent success | **IN-SCOPE** |
| **IN-5** | Replace Typeform (`go.0-dte.com/application`) as write source | **IN-SCOPE** |
| **IN-6** | Shaw books / Cole closes / desk can set | **IN-SCOPE** (purpose) |
| **IN-7** | Observer term six weeks in any apply-adjacent copy | **IN-SCOPE** (copy law) |
| **IN-8** | Host: WordPress vs Labs route vs MiniThree proxy | **FLAGGED** — India + Foxtrot after GO; this draft does not pick |
| **IN-9** | Echo member-facing labels (plain language vs AC titles) | **FLAGGED** — Phase 3 Echo + Tango; not invented here |
| **IN-10** | First name / phone on the apply form | **FLAGGED** — plumbing only if required for booking; not a sales field |
| **IN-11** | AC tag on apply submit (e.g. “Applied”) | **FLAGGED** — Coach did not specify; do not invent as law |
| **IN-12** | Labs `/signup` rewrite | **DEFERRED** (Coach out) |
| **IN-13** | Extra sales qualifier fields | **PARKED** (Coach: do not add) |
| **IN-14** | Discounting | **DEFERRED** (Coach out) |
| **IN-15** | Tickets to CEO / CTO | **DEFERRED** (Coach out) |
| **IN-16** | Strategy Lab / Tradier | **DEFERRED** (Coach out) |
| **IN-17** | Typeform tenant teardown | **DEFERRED** (ops after write-source cutover) |

Flagged ideas: none erased. Coach disposes flags.

---

## 10. Open questions (not law — India / Echo / Coach)

| # | Question | Draft note (opinion) |
|---|---------|----------------------|
| **OQ-1** | Where does `/apply` **run**? fattail.ai WordPress, Labs Next.js behind nginx, or a thin proxy? | As-built: WP has no slug; Labs has no `/apply`. **Do not pick in this draft.** Foxtrot + India after GO. Public URL stays `https://fattail.ai/apply`. |
| **OQ-2** | How does implementation bind Bob’s fields (title vs perma vs numeric id)? | Resolve from the **live** AC account. Do not invent IDs in the spec. |
| **OQ-3** | Partial-write repair (rollback vs retry)? | Law: not success. HOW is India’s. |
| **OQ-4** | Is first name required plumbing? | Email is the only plumbing this draft requires. |
| **OQ-5** | Apply tag in AC? | Not specified by Coach. Do not add as a sales field. |
| **OQ-6** | What happens after success (Shaw calendar, Cole view)? | Out of this draft except: the seven values exist so they **can** book and close. |

---

## 11. Acceptance (when BUILD is authorized — not now)

A submit on **`https://fattail.ai/apply`** produces **non-empty values on all seven** ActiveCampaign fields (`HELL`, `HEAVEN`, `MONEY_TIMING`, `COACHING_SKU`, `ELEVEN_AM_ET`, `TRIED`, `PARTNER_SUPPORT`) for that contact.

**Evidence:** ActiveCampaign `fieldValues` read-back for that contact. Not “it should work.” Not a screenshot of a thank-you page alone.

Also true:

1. Missing email → no silent AC write; member sees an inline error.
2. AC miss / incomplete seven → submit is **not** success; member sees a truthful error.
3. Typeform is no longer the write source for these seven fields.
4. No extra sales qualifier fields shipped.
5. Copy: no profit claims; Observer term, if present, is six weeks.

---

## 12. India review checklist (Phase 2 — invite)

India: **block only** for invariant / law / system breakage. Everything else is a **labeled opinion**. Coach Content Law: do not remove Coach text.

### 12.1 Law vs opinion (for the review comment)

| Item | This draft treats as |
|------|----------------------|
| Public URL `https://fattail.ai/apply` | **Law** (APPLY-1) after GO |
| The seven keys, do not rename, do not add sales fields | **Law** (APPLY-2) |
| Writes = AC `fieldValues` on the contact; fail loud | **Law** (APPLY-3, APPLY-4, APPLY-5) |
| Replace Typeform as write source | **Law** (APPLY-6) |
| Email required as contact key | **Law**, labeled **plumbing** |
| HIG labels / one CTA / inline errors; no jargon; no profit claims; Observer = 6 weeks | **Law** (APPLY-7, APPLY-8) |
| Host (WP vs Labs vs proxy) | **Opinion / open** (OQ-1) — not a lock |
| Echo’s exact question copy | **Opinion / open** (IN-9) |
| First name, apply tag, rollback HOW | **Opinion / open** |
| Reuse vs do-not-reuse `server/activecampaign.py` | **India HOW** — law is only: do not inherit waitlist best-effort success |

### 12.2 Checklist

- [ ] Domain: is AC contact `fieldValues` the right SoR for Cole’s handoff? Any clash with Lead Sync Spec v1.0 / DL-064?
- [ ] Product boundary: fattail.ai apply vs Labs `/signup` / `/membership` vs Woo Add to cart — seams named, no collapse?
- [ ] Fail-loud vs Labs “config-driven fail loud” vs waitlist “never fail the member” — APPLY-4 does not silently change waitlist?
- [ ] No MSC import / vendoring?
- [ ] No Strategy Lab / Tradier / Options Lab scope leak?
- [ ] Schema: this draft authorizes **no** Labs migration. Agree?
- [ ] Host/routing (OQ-1) left open — not a fake lock?
- [ ] Seven keys transcribed; no renamed or extra sales fields?
- [ ] Coach Phase 0 intact? Any drop listed **up front**?
- [ ] Ideas inventory complete (IN-SCOPE / FLAGGED / DEFERRED / PARKED — never discarded)?
- [ ] Status remains **DRAFT** — not BUILD, not ACCEPTED?

**India verdict shape** (when reviewing):

```text
## Up front
## Bench delta
## Coach content intact?
## Blocks (invariant | law | system only)
## Opinions / recommendations (not blocks)
## Flagged ideas
## Build disposition
APPROVED | RETURNED  (implementation readiness only — this file is still DRAFT until Coach GO)
```

---

## 13. Delta gate criteria (after BUILD — not this PR)

Delta does **not** gate this draft. When Coach gives GO and Juliet seeds a build, Delta’s bar is:

| # | Criterion | Evidence |
|---|-----------|----------|
| **D1** | Submit on `/apply` with valid email + seven answers | Browser or HTTP walk |
| **D2** | Same contact in AC has **non-empty `fieldValues`** for all seven keys | AC API / UI read-back (command + output) |
| **D3** | Forced AC failure (bad token, missing field id, or timeout) → submit is **not** success; no thank-you-as-booked | Walk + response body / UI |
| **D4** | Empty email → no AC write claimed; inline error | Walk |
| **D5** | No extra sales fields on the form or in the AC write | Form inventory + AC payload |
| **D6** | Labs `/signup`, Strategy Lab, Tradier untouched | Diff scope |
| **D7** | Observer copy, if any, says six weeks — not four | Copy grep / screenshot |

**“It should work” is FAIL.**

---

## 14. Review gates (required before any plan)

| Gate | Agent | Asks |
|------|-------|------|
| Spec / architecture | **India** | §12 checklist. SoR, boundary, fail-loud vs waitlist, host left open |
| Design / member | **Echo + Tango** | Labels, one CTA, inline errors, no jargon, no profit claims, Observer = 6 weeks |
| Auth / secrets | **Mike** (when host + write path are proposed) | AC token handling; no secrets in the client; public form abuse |
| Infra / host | **Foxtrot** (OQ-1) | fattail.ai routing; no silent 404 |
| Trading honesty | **Hotel** only if apply copy makes trading claims — default: form is fit/booking, not a method lesson |
| Final | **Coach / chair** | GO / return. **Not BUILD until that GO** |

**Juliet** does **not** produce `agents/<project>/` seeds or an execution plan in this packet.

---

## 15. Success criterion (spec review — this draft)

A reviewer can validate, **without reading implementation code**:

1. Why the form exists (desk cannot set until the seven fields are written).
2. Which seven keys are law — and that email is plumbing, not a new sales field.
3. That writes are AC `fieldValues` and success is non-empty on all seven.
4. That silent success is forbidden.
5. That Strategy Lab, Tradier, `/signup` rewrite, discounting, extra qualifiers, and CEO/CTO tickets are out.
6. That this file is **DRAFT**, not BUILD, not ACCEPTED.

---

## 16. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-19 | DRAFT. Juliet Phase 1 from Coach / chair Phase 0. Not BUILD. Not ACCEPTED. No form implementation. |

**Next process step:** India architecture review (law vs labeled opinion) → Echo + Tango on labels/copy → Mike/Foxtrot only when host + write path are proposed → **Coach Phase 5 GO** → only then Juliet execution plan.

---

*End of Native Apply Form Spec v0.1 (DRAFT)*
