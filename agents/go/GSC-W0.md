# GSC-W0 — Coach GO token · program `p-sessions`

**Plan:** `docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md` (operative until Juliet files v1.3 fold)  
**Spec:** `Specs/FatTail-Labs-Sessions (Global Session Clock).md` · **v0.2** · sha1 `6616b1753f21e334c21dc65336c405acafa5d958`  
**BUILD AUTHORITY:** this hash **supersedes** GO hash `81984ba9f2394d52aa359cefcdb108451fdec9e3` (and the OD-S7-note hash `fab85adacefc4898ab377930154d5b8bfef8cd7c`).  
**Stamped by:** Coach  
**Date:** 2026-09-09  
**GSC6-2:** India checks the Spec hash against the **most recent BUILD AUTHORITY entry**, not the GO entry.

> Ticks below are Coach’s stamp. This file, saved, is the stamp — chat "go" is not (DL-328).

---

## 1. Verdict

- [x] **GO** — fire GSC1 ∥ GSC2-axis
- [ ] Amend
- [ ] Stop

GO is issued **with the four recorded corrections in §5**. Lima logs them in the DL with the GO entry.

---

## 2. Spec and plan

- [x] Spec sha1 confirmed `81984ba9f2394d52aa359cefcdb108451fdec9e3`
- [x] Spec designated **BUILD AUTHORITY** as of this stamp
- [x] Plan **v1.2** is the program of record (v1.3 = Juliet fold of §5; does not reopen ODs)
- [x] L1 – L11 are now **LOCKED** (L4 includes override-empty / unscheduled-only)

---

## 3. Open decisions

| OD | Tick | Decision |
|----|------|----------|
| **OD-S0** | (a) | Keep Coach's filename. Lima records sha1 + BUILD AUTHORITY in the DL. **No pointer file** — one Spec, no shadow copy to drift. |
| **OD-S1** | (a) | Implemented path is **`/resource/sessions`**. Spec's `/resources/sessions` stays as Coach text. Do not invent `/resources`. No redirect. |
| **OD-S2** | (a) | Sessions is a **Link** pill. Library and Tags stay in-page tabs on `/resource`. Tags is **not** promoted to a route. |
| **OD-S3** | (a) | Route gated at the existing authenticated floor; **pill hidden when anonymous**. Observer included via existing `access_role`. No new policy, no new membership slug. |
| **OD-S4** | **(c)** | **RECONSTRUCT.** HTML not found on five surfaces (Trash, iCloud, Containers, git deleted names, git objects, plus Desktop/Documents/Downloads HTML grep). Echo owns the visual contract at `agents/p-sessions/evidence/echo-visual-contract.md`. That document is the reference from this stamp. |
| **OD-S5** | (a) | Short Guide entry + `server/help_reference/sessions.md` at GSC6 (docs-parity). |
| **OD-S6** | — | Ops tick, not a product decision. Foxtrot confirms Mini Two vs Dude Two from DL-683 / DL-684 at GSC6. Staging first, always. Never Dude One. |
| **OD-S7** | (a) | Lima places one sentence **beside** Spec §6.2 recording that the 12:00 UTC single-sample model is valid for this zone set because the 2026–2027 transitions fall on Sundays when these markets are closed. Coach text is not deleted. |
| **OD-S8** | **(a)** | Nav label stays **`Sessions`**. L6 stands. |

**JR1 – JR12: Accept all as written.** No overrides.

---

## 4. OD-S4 — reference HTML

`session-clock.html` was not found by `find ~ -name 'session-clock*.html'`.

**Four extra searches (2026-09-09, Ernies-MacBook-Pro.local):** Trash · `~/Library/Mobile Documents` · `~/Library/Containers` · `git rev-list --all --objects | grep -i session-clock` → **all empty**. (a) is not live on this checkout. OD-S4 remains **PENDING Coach tick** of (c) or Stop. GSC1/GSC2 do not wait.

**MACHINE: the dev machine holding the `Fattail-Labs` checkout.**

```bash
ls -la ~/.Trash | grep -i session
find ~/Library/Mobile\ Documents -name 'session-clock*' 2>/dev/null
find ~/Library/Containers -name 'session-clock*' 2>/dev/null
cd <path-to>/Fattail-Labs && git rev-list --all --objects | grep -i session-clock
```

Then tick one:

- [ ] **(a)** Found. Path + sha1 pinned under `docs/evidence/sessions/`. GSC4 entry satisfied.
- [x] **(c)** Not found. Reconstruct from the Spec; **Echo owns the visual contract**; GSC4-1 is a longer pass. GSC4 entry is Echo's contract note on the board. **Stamped 2026-09-09.** Five-surface search empty (Trash · iCloud Mobile Documents · Containers · git `diff-filter=D` · `rev-list --objects` · Desktop/Documents/Downloads `*.html`). Contract: `agents/p-sessions/evidence/echo-visual-contract.md`.
- [ ] **Stop** the visual port. (Lawful, but ends the program at GSC3.)

Also worth checking Studio Two and Conor's Mac when reachable.

---

## 5. Corrections recorded at stamp

Accepted from GSC0. Lima logs with the GO entry; Juliet folds into the plan as v1.3.

1. **AT-GSC-33** evidence class `tsx` → **`tsx + pw`**. A bare-Node test proves process-TZ independence, not that a browser set to Asia/Tokyo renders correctly. (Kilo)
2. **AT-GSC-45** evidence class `pw` → **`static + pw`**. "No new policy" is a static check; Playwright cannot demonstrate it. (Kilo)
3. **`web/components/resources/ResourcesHub.tsx`** is **named on the GO allowlist** for GSC3, so DL-539 does not surprise that phase. (India)
4. **§13 N1 checkbox** reworded from a string-absence test to a wiring test:

```markdown
- [x] **N1** No phantom gate in the operative surface: §6 DAG and §7 phase tables name only
      GSC0-G · GSC1-G · GSC2-G · GSC3-G · GSC4-G · GSC5-G · GSC6-G. No seed's Depends/Feeds
      names a gate outside that set. Historical references in the fold table and risk register
      are records, not citations, and stay.
```

India's `GSC2-axis-G` finding is **disposed as no-defect**: the string appears only in the fold changelog, the risk register, and that checkbox — all historical. No seed depends on the gate.

---

## 6. Reporting format (standing, all future phases)

Split the summary into **BLOCKERS** and **NOTES**. Do not print "no FAIL" findings under a
`FAIL / BLOCK` heading. An empty blockers list reads as empty.

---

## 7. What fires on this stamp

1. Delta runs **GSC0-G**. The stamp alone does not unlock anything.
2. On GSC0-G PASS: **GSC1 ∥ GSC2-axis** (two Charlie instances, separate write trees).
3. GSC2-view after GSC1-G. Then GSC2-G.
4. GSC3 needs the stamped path and auth shape above — both decided.
5. GSC4 needs OD-S4 resolved — **(c) stamped 2026-09-09**.
6. **Addendum §12** stamped same day: GSC2.5 then GSC4 ribbon. Spec **v0.2** sha1 `6616b1753f21e334c21dc65336c405acafa5d958` is BUILD AUTHORITY.

Program PASS is **GSC6-G**. Not earlier.

---

## 8. Coach stamp 2026-09-09 — addendum §12 · OD-S4 (c) · OD-S8 (a)

- [x] §12.7 defaults **ACCEPTED**: 09:30 / 12:30 / 14:30 / 16:00 ET · Morning · Afternoon · Closing · early close **truncates**.
- [x] **OD-S8 (a)** — nav label `Sessions`. L6 stands.
- [x] §12 appended to the parent Spec. Filename unchanged (OD-S0 a). Designation **Sessions Spec v0.2**.
- [x] **OD-S4 (c)** RECONSTRUCT. Echo visual contract is the program reference.
- [x] Lima files **DL-686**. New whole-file sha1 **supersedes** the GO BUILD AUTHORITY hash. GSC6-2 India compares against the most recent BUILD AUTHORITY entry, not the GO entry.

---

## GO allowlist (GSC3 named now so DL-539 cannot surprise)

In addition to plan §9 creates (`web/lib/marketCalendar/`, `web/lib/sessions/timeAxis.ts`, `web/lib/sessions/exchanges.ts`, later `sessionView.ts` and page/components):

| File | Phase |
|------|--------|
| `web/components/resources/ResourcesHub.tsx` | **GSC3** (named at GO) |
| `web/app/resource/ResourcesPageClient.tsx` | GSC3 (nav host; Sessions Link) |
| `web/styles/tokens.css` | GSC5 Echo additive `--color-session-*` |
