# WU-R0-2 Mike — Wiki Spec v0.2.1 (auth / exposure)

**Agent:** Mike  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` I.3, II.1 principals, III.2, III.3  
**Date:** 2026-08-23  
**Spec not modified.**  
**Verdict:** Auth design is **implementable**. **No BLOCKING** for GO SPEC.
WU-2 implementation notes **block any future WU-2 stamp request** until
addressed in that packet (not this one).

---

## Public read (III.2) — implementable without leaking Family B or drafts

**APPROVED as specified**, with the mechanics below as WU-2 law (reviews
cover implementation, not whether — DL-551 already directed).

As-built today (`server/routes/wiki.py`):

- `wiki_index`, `wiki_page`, search, graph all `require_session`.
- Non-admin SQL adds `AND status = 'published'`.
- Admin sees drafts.

WU-2 must:

| # | Mechanic | Proof |
|---|----------|--------|
| 1 | Unauthenticated GET of `status=published` → 200 | Kilo |
| 2 | Unauthenticated GET of `status=draft` → **404** (not 401/403 that confirms existence) | Kilo + this review |
| 3 | Non-admin member GET of draft → 404 (today’s member 404 stays) | already WA-2/3 |
| 4 | “In your practice” / any Family B-adjacent rail **absent** on unauthenticated responses (no empty shell that hints) | Kilo DOM/JSON |
| 5 | No `identity_id`, journal, trade-log, capital in public JSON | grep + tests |
| 6 | Session / ledger / board / agent APIs stay admin (or agent-scoped). Openness is **published wiki content only** (I.3). | existing WA-4 Rider 3 |
| 7 | **Unpublish-transition** (Coach-adopted): published → draft returns public 404 **and** drops from sitemap | Juliet records in WU-2 seeds at stamp time |

**ADVISORY:** Prefer 404 over 401 on drafts for unauthenticated callers so the
public cannot enumerate unpublished slugs via status codes. 401 on the whole
`/app/wiki` tree would re-gate published content and contradict DL-551.

**ADVISORY:** Feature-gate / “sign in to read” copy on published pages is the
contamination sweep (III.2). As-built `web/app/app/wiki/page.tsx` still keys
off `/api/auth/me`. That is WU-2 Charlie, not a spec block.

**BLOCKING if implemented (WU-2):** public read of drafts; public session
open; Family B on a public page; sitemap listing drafts.

## Floating launcher vs Help (III.3)

**APPROVED as a visibility split.** HelpLauncher (`web/components/HelpLauncher.tsx`)
renders for **authenticated members**, null on `/admin`. Wiki launcher is
**administrator only**, both layers (DOM + API), proven not assumed.

**BLOCKING if implemented:** mounting wiki launcher by editing HelpLauncher
to “also show for admin,” which would risk member-visible wiki direction.
Must be a **distinct** component. AppChrome host is frozen — Mike does not
authorize the mount; DL-539 does.

Session API already rejects `ftl_ag_` (`session_requires_human`) and
non-admin cookies (WA-4-G). WU-1 repeats both-layers proof.

## Principal model

**Unchanged from WA-1/R0-2.** `contracts:deliver` is in `VALID_SCOPES`.
Session = admin cookie, server-assigned `admin` id. Family B refs still
`family_b_ref` at envelope. Do not reopen.

## Arch 05 seven-line doctrine

**DECLARED, right home.** DL-552 is platform access doctrine; DL-551 is the
wiki-directed rule. Public wiki read does not make other `/app/*` public.
SSO remains the instrument when Coach **names** a restriction.

## Secrets

Git credentials never in `ai.complete()`. No keys in contract payload. Unchanged.

## Bench delta

Unpublish-transition is now a named WU-2-G row. Draft 404 for anon should not
leak slug existence via 401.
