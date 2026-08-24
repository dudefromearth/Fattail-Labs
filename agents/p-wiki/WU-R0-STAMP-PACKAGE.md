# Wiki Spec v0.2.1 — R0 stamp package (Coach 2026-08-23)

**Plan:** `docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md`  
(Coach prompt cited `...Plan-v1_0.md` — that path does not exist; the in-tree
file uses a dot in `v1.0`. ADVISORY filename only.)  
**Spec:** `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` **still DRAFT**  
**Date:** 2026-08-23  
**Landed (Coach stamp + GO WU-0):** **DL-555**. Spec v0.2.1 APPROVED. SUPERSEDED
banners on the four source specs (+ agent lineage). WU-0-G PASS. Chrome ruling
still blank — WU-1 not started.

---

## Task 1 — R0 outcomes

| ID | Agent | File | BLOCKING (invariant) | GO SPEC effect |
|----|--------|------|----------------------|----------------|
| R0-1 | India | `reviews/WU-R0-1-india.md` | **None** | **FLAG:** landing diff not recon-only → do not grant GO SPEC |
| R0-2 | Mike | `reviews/WU-R0-2-mike.md` | **None** (WU-2 impl blocks listed for later) | No block |
| R0-3 | Sierra | `reviews/WU-R0-3-sierra.md` | **None** (WU-2 SEO law for later stamp) | No block; **must remain in-tree before any WU-2 stamp request** |
| R0-4 | Echo+Tango | `reviews/WU-R0-4-echo-tango.md` | **None** on spec (WU-1 impl: member-visible / AppChrome without three-OK) | No block |
| R0-5 | Hotel | `reviews/WU-R0-5-hotel.md` | **None** | No block |

Landing diff: `reviews/WU-R0-v0.2-to-v0.2.1-diff.md`

**India on the diff:** hunk 1 RECON (contents TOC). Hunks 2–4 **BEYOND**
(I.1 DL-539 mount; registration new-vs-update + Factory emit/poller; IV.5.1
discovery as first seed). No silent edits. **GO SPEC condition fails.**

WU-2-G unpublish-transition (Coach-adopted): recorded below; Juliet writes
the seed **at WU-2 stamp time**, not now.

---

## Task 2 — Stamp sheet (from the plan, outcomes filled)

- [ ] **Spec v0.2.1** APPROVED — **not granted** (see GO SPEC)
- [ ] **GO SPEC** — **STOPPED.** Condition was: zero BLOCKING **and**
      v0.2→v0.2.1 recon-only. R0 BLOCKING = none. Diff **not** recon-only
      (hunks 2, 3, 4). Return to Coach.
- [ ] **Chrome ruling for WU-1:** **blank** — WU-1 does not start  
      (A) three-OK AppChrome lines 16 + 35–39 — this checkbox alone is NOT the ritual  
      (B) narrow wiki-owned layouts  
      (C) other: ________  
      Ruling: ________
- [ ] **GO WU-0** — not reached (depends on GO SPEC)
- [ ] **GO WU-1** — not reached (chrome ruling blank **and** GO SPEC stopped)
- [ ] **WU-2 timing** — blank. Sierra + Mike notes filed. Unpublish-transition
      queued for WU-2 seeds at stamp time.
- [ ] **WU-3** — blocked. Help Package spec: `Specs/____________` v______
- [x] **Stop** — first unfilled Task 3 checkbox is **GO SPEC**.

---

## Lima unification-DL skeleton (not landed)

Blanks are Coach’s. Do not append to `Architecture/00-decision-log.md` until
GO SPEC.

```
## 2026-08-23 — DL-___ Wiki Spec v0.2.1 seated (unified organism)

**Decision (Coach GO SPEC):** Wiki Spec v0.2.1 is APPROVED and is the spec of
record for the Wiki program. SUPERSEDED (banner-only, never deleted):
Member Wiki v0.1 · Wiki Interface v0.1 · Wiki Agent v0.1.3 lineage.
Proactive Compilation v0.2 remains superseded per OD-3.

**Landing vs advisor v0.2 (Coach confirms):** I.1 DL-539 never licenses a
frozen mount · registration new-vs-update declaration + Factory emit /
wiki-side poller bridge · IV.5.1 Help-mount discovery is the first seed,
India-gated before chrome-adjacent code.

**Access:** DL-551 / DL-552 unchanged (wide open by default; restrictions
only when Coach names them).

**Owed WA-4 record checks:**
(a) Member Wiki v0.1 access hunk (D-3 dissolved) absorbed by I.3; IKI door
    rename (DL-527) flagged unrelated, not folded.
(b) Architecture/05-security-and-access.md seven-line doctrine DECLARED.

**Does not:** public read (WU-2, timing _____) · floating launcher (WU-1,
chrome ruling _____) · registration live (WU-3, Help Package
Specs/_____ v_____) · AppChrome · MiniTwo.

**Spec:** Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md
**Plan:** docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md
```

---

## Juliet — WU-2 seed record (stamp time, not now)

WU-2-G additional row (Coach-endorsed):

> Unpublish-transition: a published page flipped back to `status: draft`
> returns **404** on the unauthenticated read path **and** is removed from
> the sitemap. Prove with commands + captured output (before URL 200 + in
> sitemap; after URL 404 + absent from sitemap).

Write this into WU-2-4 Kilo when **WU-2 timing** is stamped.

---

## Isolation this packet

Touched: `agents/p-wiki/reviews/WU-R0-*.md`, this package, plan WU-2-G note.
**Not touched:** AppChrome, `web/app/layout.tsx`, Factory, Runner, Options
Lab, Market Bus, Trade Log, spec body, SUPERSEDED sources, `00-decision-log.md`.
