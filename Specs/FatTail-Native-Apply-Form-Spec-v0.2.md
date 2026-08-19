# FatTail — Native Apply Form Spec v0.2

**Status:** **BUILD AUTHORITY** (Coach GO 2026-08-19)  
**Type:** Product Specification  
**Short name:** **Native Apply**  
**Filename:** `FatTail-Native-Apply-Form-Spec-v0.2.md`  
**Public URL (Coach):** `https://fattail.ai/apply`  
**Shipped host (this build):** Labs Next.js `/apply` + `POST /api/apply`  
**Date:** 2026-08-19  
**Decision log:** **DL-450**  
**Supersedes:** Juliet draft v0.1 on PR #3 (DRAFT, not BUILD)

**Coach Content Law:** Coach’s words below are product intent. Nothing of Coach’s is dropped.

**This build does not authorize:** Strategy Lab work, Hostinger deploy, or a fattail.ai WordPress wipe.

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

**Success (Coach):** Shaw can book and Cole can close because a submit produces **non-empty values on all seven AC fields** for that contact. Evidence is ActiveCampaign `fieldValues`, not “it should work.”

---

## 0.1 Coach BUILD GO (2026-08-19) — locked

Coach authorized implementation with these answers to the v0.1 open questions:

| Item | Lock |
|------|------|
| Write | `POST` public apply: email + seven AC fields |
| Field IDs | **3** HELL · **4** HEAVEN · **5** MONEY_TIMING · **6** COACHING_SKU · **7** ELEVEN_AM_ET · **8** TRIED · **9** PARTNER_SUPPORT |
| Tag | **18** Application Filled (write by id) |
| Fail loud | Unconfigured / half-config / AC miss / empty field → **not** success |
| Client | Reuse `server/activecampaign.py` — do **not** inherit `sync_lead()` best-effort |
| CORS | `fattail.ai` (`https://fattail.ai`, `https://www.fattail.ai`) |
| Page | Native HIG: one column, labels above, 44pt targets |
| Accent | `#00B478` **only** on submit / next action |
| Mark | Brush-arch + word **fattail** |
| Copy | No AI · no 0-DTE |
| Tests | Mocked AC |
| Out | No Strategy Lab · no Hostinger deploy · no fattail.ai WordPress wipe |

---

## 1. Purpose

Ship a **native** FatTail application (HIG web, not Typeform, not ClickFunnels) whose job is to **write Cole’s seven ActiveCampaign handoff fields** and tag **18 Application Filled** so Shaw can book, Cole can close, and the desk can set.

This is **not** Labs `/signup`. This is **not** Woo checkout. This is **not** a Strategy Lab surface.

**Native** means FatTail-owned URL, labels, and write path.

---

## 2. Law

| ID | Law |
|----|-----|
| **APPLY-1** | Public URL remains **`https://fattail.ai/apply`**. This build ships the page at Labs `/apply`. Foxtrot proxy/map of the public URL is **not** this packet. |
| **APPLY-2** | Write **Cole’s seven** fields. Do **not** rename AC keys. Do **not** add sales qualifier fields. |
| **APPLY-3** | Writes go to AC **`fieldValues` on the contact**. Contact key is email. |
| **APPLY-4** | **Fail loud.** Any miss → submit is **not** success. No silent thank-you. |
| **APPLY-5** | Evidence of done is **non-empty `fieldValues` on all seven** plus tag 18. The write path read-backs fieldValues before claiming success. |
| **APPLY-6** | This form **replaces Typeform (`go.0-dte.com/application`) as the write source**. |
| **APPLY-7** | HIG: visible labels above, one primary CTA, inline errors, ≥ 44pt. `#00B478` only on submit. Brush-arch + word fattail. No insider desk jargon required on the member surface. No profit claims. |
| **APPLY-8** | If Observer term appears, it is **six weeks** (**DL-128**). SKU string is `Observer $17/wk × 6`. |
| **APPLY-9** | No AI copy. No 0-DTE copy on the apply surface. |
| **APPLY-10** | Tag **18 Application Filled** on successful write. Do not create a new tag. |
| **APPLY-11** | CORS allowlist is fattail.ai. Labs same-origin rewrite does not need CORS. |
| **APPLY-12** | `sync_lead()` waitlist behavior is unchanged. |
| **APPLY-13** | Do **not** create new AC fields. Fields **6 / 7 / 9** are existing dropdowns (live option arrays were empty). Write the exact strings in §3. |

---

## 3. The seven fields + plumbing

| JSON key | AC id | AC key | Control | Member label |
|----------|-------|--------|---------|--------------|
| `email` | — | contact email | email | Email |
| `hell` | 3 | HELL | textarea | What is hard right now? |
| `heaven` | 4 | HEAVEN | textarea | What would better look like? |
| `money_timing` | 5 | MONEY_TIMING | textarea | Money and timing |
| `coaching_sku` | 6 | COACHING_SKU | dropdown (existing AC field) | Which coaching are you applying for? |
| `eleven_am_et` | 7 | ELEVEN_AM_ET | dropdown · Yes / No | Can you make 11:00 AM Eastern? |
| `tried` | 8 | TRIED | textarea | What have you already tried? |
| `partner_support` | 9 | PARTNER_SUPPORT | dropdown · Yes / No | Does someone support this with you? |

Email is **plumbing** (AC contact key), not a sales qualifier.

**Exact strings written to AC** (do not invent option ids; AC option arrays were empty):

| Field | Allowed values |
|-------|----------------|
| 6 COACHING_SKU | `Observer $17/wk × 6` · `Activator $97/mo` · `Navigator $267/mo` · `Annual $1,997` |
| 7 ELEVEN_AM_ET | `Yes` · `No` |
| 9 PARTNER_SUPPORT | `Yes` · `No` |

A contact with email and six filled fields is a **miss**. Any of the seven writes empty after read-back is a **miss**.

---

## 4. Write contract

1. Validate email + seven non-empty answers (400 + inline field errors if not).
2. `POST /api/3/contact/sync` with email + `fieldValues` for IDs 3–9.
3. `GET /api/3/contacts/{id}/fieldValues` — every id 3–9 must be non-empty.
4. `POST /api/3/contactTags` with tag **18**. HTTP 422 (already tagged) is success.
5. Return `{ ok: true, contact_id, tag_id: "18" }` only after those steps.

Config: same `LABS_AC_API_URL` / `LABS_AC_API_TOKEN` as lead sync. **Unset is 503** on this path. Half-config raises.

`sync_apply()` **raises** `ACError`. The route maps that to **503** with a truthful member message: the application was **not** recorded.

---

## 5. HTTP

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/apply` | Public |
| OPTIONS | `/api/apply` | Public (CORS preflight) |

CORS origins: `https://fattail.ai`, `https://www.fattail.ai`.

CSRF is skipped for `/api/apply` (public AC write; fattail.ai may send a shared `.fattail.ai` cookie).

No Labs migration. AC is SoR.

---

## 6. Member experience

- One column. Labels above every field. Never placeholder-only.
- One primary action: **Submit application** at `#00B478`.
- Inline errors on the failed field. Page-level error if the write misses.
- Success copy tells the truth: answers are on file; a seat is **not** reserved.
- Brush-arch + word fattail. No Labs header. No help concierge.
- No AI. No 0-DTE. No profit claims. No emoji chrome.

---

## 7. Scope

**In:** native write + Labs `/apply` page + mocked-AC tests + this spec + DL-450.

**Out:** Strategy Lab · Tradier · Hostinger deploy · fattail.ai WordPress wipe or plugin · Labs `/signup` rewrite · extra sales fields · Typeform tenant teardown · Lead-sync retag · nginx map of fattail.ai/apply (Foxtrot, flagged).

---

## 8. Acceptance

| # | Criterion | Evidence |
|---|-----------|----------|
| D1 | Valid POST `/api/apply` returns 200 only when `sync_apply` reports synced | pytest, mocked AC |
| D2 | Write payload includes field ids 3–9 and tag 18 | pytest |
| D3 | Unconfigured / AC error / empty field / read-back miss → not 200 | pytest |
| D4 | Empty email → 400, no AC call | pytest |
| D5 | CORS `Access-Control-Allow-Origin: https://fattail.ai` | pytest |
| D6 | Waitlist `sync_lead` still skips when unset | pytest |
| D7 | Page is one column, labels above, `#00B478` only on submit; no AI / 0-DTE | source review |
| D8 | SKU / 11am / partner accept only the locked strings; unknown values 400 | pytest |
| D9 | No new AC field create — writes ids 3–9 only | pytest + source |

Live AC read-back remains the desk evidence after deploy.

---

## 9. Files

- `server/activecampaign.py` — `sync_apply()`, field ids, tag 18, read-back
- `server/routes/apply.py` — `POST /api/apply`, CORS middleware
- `server/csrf.py` — skip `/api/apply`
- `server/tests/test_apply.py`
- `web/app/apply/page.tsx`
- `web/components/ApplyForm.tsx`
- `web/components/FatTailWordmark.tsx`

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-19 | Juliet DRAFT — not BUILD (PR #3) |
| **v0.2** | 2026-08-19 | Coach GO. Field ids, tag 18, CORS, HIG page. BUILD. |
| **v0.2.1** | 2026-08-19 | Live AC: 6/7/9 dropdowns, empty options. Exact SKU + Yes/No strings. No new fields. **DL-451**. |
