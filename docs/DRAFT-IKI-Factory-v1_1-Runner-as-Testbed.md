# DRAFT — Factory Spec v1.1 addition: Runner as testbed

**Not landed.** Coach 2026-08-25 ruling, awaiting Coach accept into
`Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md`. Do not treat this file as
BUILD AUTHORITY.

**Ruling (verbatim):** The Runner is the Factory's testbed. It is not a
separate program. A Knowledge app or Intelligence app is validated by
running it, and the Runner is where that happens. The two were built
separately; that was an accident of sequencing, not a decision.

---

## Proposed edits (do not apply until Coach stamps)

### Scope statement (header)

**Today:**

> Active program: IKI Factory — the board, the work item, the lanes, and
> the transitions between them. Touches outside program: **the Wiki**, at
> §7 only.

**Proposed:**

> Active program: IKI Factory — the board, the work item, the lanes, the
> transitions between them, and **the Runner as the Factory's testbed**
> (`/app/iki/runner`, shared `web/lib/runner/**`). A Knowledge app or
> Intelligence app is validated by running it; the Runner is where that
> happens. Touches outside program: **the Wiki**, at §7 only (Oscar
> composes the wiki page after publication).

### New §7.2a (under Staged · Client trial)

Insert after 7.2's three bullets:

> **Where trial happens.** Client trial (§7.2) happens **in the Runner**
> (`/app/iki/runner`). “Use it in earnest” means: run the Knowledge app
> (or Intelligence app) on the live chain through the same Runner path
> Options Lab already uses. The staging server is still the *cohort*
> label (no early-access badge). The Runner is the *venue*. Staged
> gathers signal; clients approve nothing.

### `web/lib/runner/**` is no longer outside the program

The Factory v0.1.5 plan and IF-4 GO treated `web/lib/runner/**` as a
frozen tree unless B5 + three successive OKs (DL-539). This ruling names
the Runner as Factory testbed, so that tree is **in the active program**
for Factory work that validates a Knowledge/Intelligence app.

---

## Flag — DL-539 three-OK (Coach's call, not assumed)

**Do not treat this draft as lifting DL-539.**

If Coach accepts the scope change, **Coach must say** whether:

1. **DL-539 no longer applies** to `web/lib/runner/**` because it is now
   in the Factory/IKI active program, or
2. **DL-539 still applies** to writes in `web/lib/runner/**` until a
   named three-OK / B5 tick on a GO token.

This draft flags the fork. It does not pick one.

---

## Does not (this draft)

- Edit `Specs/FatTail-Labs-IKI-Factory-Spec-v1_1.md`
- Edit `agents/bench/gemba.md`
- Open a GO
- Promote the Runner host
- Change Factory / Runner / About / Catalog nav
