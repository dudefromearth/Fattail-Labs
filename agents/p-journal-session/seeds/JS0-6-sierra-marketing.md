# Seed JS0-6 — Sierra: Marketing / public boundary

**Project:** p-journal-session  
**Primary:** Sierra  
**Reviewers:** Tango  
**Phase:** J0  
**Prerequisite:** D5 demo exclusion (JS0-4); D4 no public media (JS0-3)

## Goal

Confirm journal sessions never feed SEO/AEO/public marketing; demo accounts excluded from public proof.

## Files in scope

- `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md` (§18 non-goals, **§20** marketing boundary, §17, §19)  
- `Architecture/00-decision-log.md`  

## Out of scope

Course catalog copy rewrites; implementation of public pages (none should exist); demo column impl (JS8-1).

## Invariants

- Process outcomes only · no profit claims.  
- Family B never becomes acquisition content.  
- Demo ≠ real member proof (D5).

## Completion criteria

- [x] APPROVED boundary statement in Spec or DL  
- [x] Tango co-sign  

## Feeds

→ JS0-G  

---

## Evidence (2026-07-30 — Sierra JS0-6 · Tango co-sign)

### Verdict: **APPROVED**

### Boundary statement: Spec **§20** (normative)

Journal sessions are **member-private (Family B)**, not an acquisition content source. Public catalog / SEO / AEO must **never** ingest:

- session transcripts or agent turns  
- `structured_json` / pre_market fields / invalidation  
- private journal media or captions  
- session-table aggregates as marketing stats  
- **`is_demo=1` content as real member proof**

Aligned with Retrospective Spec v0.5 **§20** (Sierra RT0-5).

### Hard bans (summary)

| Ban | Status |
|-----|--------|
| Public member-journal results / SEO URLs from session tables | **BANNED** |
| Testimonials / ads quoting session content | **BANNED** |
| JSON-LD / meta / OG from session data | **BANNED** |
| Journey public rows from sessions | **BANNED** |
| Demo-as-testimonial / demo landing proof | **BANNED** |
| Marketing CMS / webhook from sessions | **BANNED** |

### Allowed (doctrine-consistent)

- Process-outcome marketing language (no profit figures)  
- Feature description of the journal loop (no production quotes)  
- Catalog SEO independent of session DB  
- Opt-in research **outside** this product pipeline (separate legal)

### Tango co-sign

| Check | Verdict |
|-------|---------|
| Member not turned into content | **PASS** |
| Trust > acquisition cleverness | **PASS** |
| External ban matches UI anti-resulting (D3 / Appendix B) | **PASS** |
| Demo exclusion dignity (not fake social proof) | **PASS** |

### Spec edits this seed

1. §20 Marketing & public acquisition boundary (full)  
2. §18 non-goals: marketing pipeline + demo-as-proof  
3. §17 verification line for marketing  
4. §19 / §21 document map renumber; board header owner gates complete  

### Required follow-ons (not RETURN)

| Item | Owner |
|------|--------|
| No public session routes in build | Charlie (all UI phases) |
| No admin marketing export | Alpha · Mike |
| Demo pack ops-only | JS8-2 |
| Delta confirms §20 in JS0-G evidence | JS0-G |
