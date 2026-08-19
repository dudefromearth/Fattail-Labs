# FatTail — Native Apply Form Spec v0.1

**Status:** **DRAFT** — not BUILD AUTHORITY, not ACCEPTED. Bob chairs this spec.  
**Do not send to Ernie.** After Bob approves, Knox builds.  
**Type:** Product spec — public apply form on fattail.ai  
**Short name:** **Native Apply**  
**Filename:** `FatTail-Native-Apply-Form-Spec-v0.1.md`  
**Date:** 2026-08-19  
**DL:** **DL-450** (this file is the lock-draft Bob chairs)  
**Public URL:** `https://fattail.ai/apply`  
**Author:** Juliet (Phase 1 lock-draft from Ernie 2026-08-19 lock)  
**Chair:** Bob  
**Path (lock):** Ash reviews · Hayes holds the desk · Bob chairs · executives  
**Conor was not ticketed.**

This lock-draft supersedes any unauthorized BUILD or ACCEPTED stamp on a Native Apply spec. If `Specs/FatTail-Native-Apply-Form-Spec-v0.2.md` exists elsewhere, its BUILD claims are not law.

**Coach Content Law:** Coach’s / lock words below are product intent. Reviewer objections sit **beside** them, labeled as the reviewer’s. Nothing of the lock is removed.

---

## 0. The one lock (verbatim · Coach / lock law)

Locked 2026-08-19 by Ernie. Path: Ash → Hayes → Bob → executives.

```
# The one lock

Locked 2026-08-19 by Ernie. Path: Ash → Hayes → Bob → executives.

**Locked hue:**

`#00B478` is the one brand hue. Sampled from the Labs play button. Ernie: “The 00B478 is good.”

`#00FF00` is the fattail.ai hero lime. Off. `#1A4F40` is Ash’s pine. Off. `#0d9488` Labs compiled emerald. Off. `#5856d6` live indigo. Off.

One hue. Three jobs only: next action, live state, defined-risk cue. Strength, health, wealth. Used sparingly to enhance use of the systems.

Labs `web/styles/tokens.css` is the company look. Canvas is paper / ink / grey. Type is system UI (SF Pro / -apple-system). Mark is the black brush-arch. Product word `labs`. Sales word `fattail`. No `ai`. No 0-DTE mark on this path.

Not a wash. Not a second accent.

fattail.ai/apply is the first instance: native FatTail form, Apple HIG, one column, labels above, 44pt, one submit that writes Cole’s handoff and Application Filled. Not Typeform. Not ClickFunnels. Not Flatsome.

Ash reviews. Hayes holds the desk. Bob chairs. Conor was not ticketed.
```

---

## 1. Status and chair

| Fact | Law |
|------|-----|
| Status | **DRAFT** |
| Chair | **Bob** |
| Build | **Knox builds after Bob approves.** Not before. |
| Send to Ernie | **Do not.** |
| Ticket Conor | **Do not.** |
| BUILD AUTHORITY / ACCEPTED | **Not this file.** Do not stamp either. |
| Implementation on this PR | **None.** Spec only. |

This PR is the spec Bob chairs. Juliet does not sequence Knox packets until Bob approves.

---

## 2. Purpose

A **native** Apple HIG apply at **`https://fattail.ai/apply`** so a person can apply in one column, one submit, and the desk can set.

Submit **writes Cole’s seven handoff fields** and tag **18 = Application Filled**. Contact key is **email**.

This replaces Typeform (`go.0-dte.com/application`) as the write source. ClickFunnels today collects only name / email / phone. The native form is not Typeform, not ClickFunnels, not Flatsome.

---

## 3. Problem

Apply today is not a native FatTail page. Write lives on Typeform. ClickFunnels is a name / email / phone capture. The desk cannot take a FatTail-owned HIG form that writes Cole’s handoff and Application Filled in one submit.

The lock names the first instance: `fattail.ai/apply`.

---

## 4. Success (acceptance — DRAFT, for Bob)

A miss is **not** success. Fail loud.

| ID | Criterion |
|----|-----------|
| **NA-1** | Public URL is `https://fattail.ai/apply`. |
| **NA-2** | Native FatTail form. Apple HIG. One column. Labels above fields. Control height **44pt**. **One** submit. |
| **NA-3** | One submit writes Cole’s seven fields (ids **3–9**, §6) and tag **18** (Application Filled). Contact key is **email**. |
| **NA-4** | Write failure is a named failure. The page does not claim success if the handoff or tag 18 did not write. |
| **NA-5** | Hue `#00B478` only on the three jobs: next action, live state, defined-risk cue. Not a wash. Not a second accent. |
| **NA-6** | Company look from Labs `web/styles/tokens.css`. Canvas paper / ink / grey. System UI (SF Pro / `-apple-system`). Mark is the black brush-arch. Sales word `fattail`. Product word `labs`. No `ai`. No 0-DTE mark. |
| **NA-7** | Not Typeform. Not ClickFunnels. Not Flatsome. No AI copy. |

---

## 5. Surface (locked) and host (OPEN)

**Locked public URL:** `https://fattail.ai/apply`

**Implementation surface stays OPEN** for Bob to chair. Do not pick nginx, WordPress, or Labs as BUILD on this draft.

### 5.1 Architecture note (Ash — **opinion**, not a lock)

Ash: apply is a **native page on fattail.ai** that **imports Labs tokens**, not an iframe of Labs and not a funnel.

Labeled **opinion**. Not host BUILD. Bob chairs how the public URL is served.

---

## 6. Cole’s handoff (live AC 2026-08-19)

Do **not** rename these ids, `perstag`s, or titles. Do **not** add sales fields.

| id | perstag | title | type |
|----|---------|-------|------|
| 3 | HELL | Hell Island | textarea |
| 4 | HEAVEN | Heaven Island | textarea |
| 5 | MONEY_TIMING | Money / timing | textarea |
| 6 | COACHING_SKU | Coaching SKU | dropdown, options `[]` empty |
| 7 | ELEVEN_AM_ET | Can make 11am ET | dropdown, options `[]` empty |
| 8 | TRIED | What they tried | textarea |
| 9 | PARTNER_SUPPORT | Partner / support | dropdown, options `[]` empty |

**Tag 18** = Application Filled (exists; write by id).

**Contact key** is **email**.

Dropdown **option rows are empty** in live AC as of 2026-08-19. Filling those rows is an **open question for Bob** (§10). This draft does not invent options.

---

## 7. Observer term (if the word appears)

If **Observer** term appears: **six weeks**.

SKU string if needed: `Observer $17/wk × 6`.

Do not invent other prices. Do not touch 4-week copy on Woo.

---

## 8. What this replaces (write source)

| Today | Role now | After native apply |
|-------|----------|--------------------|
| `go.0-dte.com/application` | Typeform write source | **Replace** as write source |
| ClickFunnels | Name / email / phone only | **Not** the native form |

The native form writes Cole’s handoff + tag 18. It is not a Typeform embed, not a ClickFunnels page, not Flatsome.

---

## 9. Visual and interaction (lock)

| Rule | Law |
|------|-----|
| Hue | `#00B478` is the **one** brand hue. Sampled from the Labs play button. Ernie: “The 00B478 is good.” |
| Off | `#00FF00` fattail.ai hero lime. `#1A4F40` Ash’s pine. `#0d9488` Labs compiled emerald. `#5856d6` live indigo. |
| Jobs | Three only: **next action**, **live state**, **defined-risk cue**. Strength, health, wealth. Used sparingly to enhance use of the systems. |
| Not | A wash. A second accent. |
| Tokens | Labs `web/styles/tokens.css` is the company look. |
| Canvas | Paper / ink / grey. |
| Type | System UI (SF Pro / `-apple-system`). |
| Mark | Black brush-arch. |
| Words | Product word `labs`. Sales word `fattail`. No `ai`. |
| Path mark | **No 0-DTE mark** on this path. |
| HIG | One column. Labels above. **44pt**. One submit. |

---

## 10. Open questions (Bob only)

Do **not** invent answers in this draft. Do not send these to Ernie.

1. **Host implementation.** Public URL is locked (`https://fattail.ai/apply`). Whether that page is served from WordPress, nginx static, Labs, or another host is **OPEN**. Ash’s native-page-imports-tokens note is opinion (§5.1), not a pick.
2. **Empty dropdown option rows.** Live AC options for `COACHING_SKU`, `ELEVEN_AM_ET`, and `PARTNER_SUPPORT` are `[]`. Bob chairs the rows. This draft does not invent them.

---

## 11. Out of scope

| Out | Why |
|-----|-----|
| Strategy Lab | Not this path. Do not write Strategy Lab. |
| Hostinger wipe of fattail.ai WordPress | Not this draft. Do not wipe. |
| Ticketing Ernie (CEO) or Conor (CTO) | Lock: Conor was not ticketed. Do not send to Ernie. |
| Implementation (form, page, API, deploy) | Knox after Bob approves. Not this PR. |
| Typeform / ClickFunnels / Flatsome as the form | Lock forbids them. |
| AI copy | Lock: no `ai`. |
| 0-DTE mark | Lock: no 0-DTE mark on this path. |
| Extra sales fields | Do not add fields beyond §6. |
| Invented dropdown options | Bob chairs. |
| Woo 4-week Observer copy | Do not touch. |
| Merge / extra repo clones | Not this packet. |

---

## 12. Fail loud

A missed write is not a successful apply.

- If Cole’s seven fields do not write, the submit is a **failure**.
- If tag **18** (Application Filled) does not write, the submit is a **failure**.
- If there is no email (contact key), there is no contact to write. That is a **failure**.
- The page must not show a success state over a failed write.

Named failure. Not a silent miss. Not a fake thank-you.

---

## 13. Ideas inventory (Phase 0 → this draft)

| Idea | Disposition |
|------|-------------|
| Native HIG apply at fattail.ai/apply | **IN-SCOPE** (lock) |
| One hue `#00B478`, three jobs | **IN-SCOPE** (lock) |
| Cole’s seven fields + tag 18 | **IN-SCOPE** (live AC 2026-08-19) |
| Replace Typeform write source | **IN-SCOPE** (lock) |
| Labs tokens as company look | **IN-SCOPE** (lock) |
| Ash: native page importing tokens, not iframe, not funnel | **FLAGGED** — opinion; Bob chairs host |
| Host pick (WP / nginx / Labs) | **DEFERRED** — open for Bob |
| Dropdown option rows | **DEFERRED** — open for Bob |
| Knox implementation | **DEFERRED** — after Bob approves |
| Strategy Lab | **OUT** |
| Ticket Ernie or Conor | **OUT** |

---

## 14. Authority after this draft

| Who | Role |
|-----|------|
| **Ash** | Reviews (lock). |
| **Hayes** | Holds the desk (lock). |
| **Bob** | Chairs. Approves or returns this DRAFT. Does not send to Ernie. |
| **Knox** | Builds **after** Bob approves. Not from this DRAFT stamp. |
| **Executives** | Path after Bob (lock). Not this PR. |
| **Juliet** | This lock-draft only. No seeds, no form, no page, no API, no deploy. |
| **Conor** | Not ticketed. |
| **Ernie** | Locked the hue and the instance. **Do not send this draft to Ernie.** |

No specialist implementation packet until Bob chairs a GO on this spec.
