# Seed WK7 — Delta + Lima: Gate, docs, ship

**Project:** p-wiki · **Agents:** Delta, Lima · **Prerequisite:** WK1–WK6 done

## Delta — gate with evidence

1. Execute Interface Spec **§8.1 runbook** end-to-end on dev (and staging if up):
   every runnable row, outputs captured verbatim.
2. File `gate-reports/W1-delta-gate.md`: row → PASS/FAIL/BLOCKED(+why).
   Rows blocked on parent-W2 scope (transcript search WI2) are marked deferred, not
   failed. Practice-rail rows (WI5/WI6) deferred to parent W4.
3. FAIL rows route back to owning seed; gate re-runs after fixes. No waived gates.

## Lima — institutional memory (same body of work)

1. `Architecture/00-decision-log.md`: entries for WIK-D1…D-8 landing, scaffold
   repair, and spec status changes.
2. New `Architecture/11-wiki-design.md` (as-built): store → index → API → surfaces,
   with the lab-wiki repo relationship diagram.
3. Spec headers: flip status lines per Coach approval outcome (W0).
4. `docs/ADMIN-GUIDE.md`: short section — publishing flow (flip `status:` in
   lab-wiki → push → tick → live), reindex button/endpoint.

## Ship (Coach call)

- [ ] Delta gate PASS filed
- [ ] Coach flips card: `UPDATE apps SET status='live' WHERE slug='wiki';`
      (via admin or migration 036 — Coach chooses)
- [ ] Coach publishes starter content set in lab-wiki (topics + glossary suggested)
- [ ] Post-ship smoke on production URL logged in gate report
