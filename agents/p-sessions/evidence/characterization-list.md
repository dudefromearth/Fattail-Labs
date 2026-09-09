# GSC0-7 — Kilo · Characterization list (lock)

**Agent:** Kilo  
**Date:** 2026-09-09  
**Plan §8** is the oracle plus Spec §9 rows. Hotel GSC0-2: **zero diffs** on §8.2 — this matrix does not rewrite dates.  
**Exactly one evidence class per row.** Commands are the ones Delta must see.

Classes: `tsx` = `npx --yes tsx <file>` bare Node · `grep` · `pw` = Playwright · `shot` · `ops`

GSC2 `tsx` commands run **twice**: `TZ=UTC` and `TZ=Asia/Tokyo`.

---

## §8.1 DST — GSC2-axis (`tsx`)

| ID | Assertion | Class | Command |
|----|-----------|-------|---------|
| AT-GSC-01 | 2026-09-08 NY/LON/TOK/SYD ET strings | tsx | `TZ=UTC npx --yes tsx web/lib/sessions/timeAxis.test.ts` and `TZ=Asia/Tokyo npx --yes tsx web/lib/sessions/timeAxis.test.ts` (filter 2026-09-08). TSE close **15:30** |
| AT-GSC-02 | 2026-10-12 SYD/TOK/LON + **Toronto normal-open** + §11 disclosure flag from `sessionView` | tsx | same runner; sessionView test for Toronto/`disclosureCanadian` on 2026-10-12 |
| AT-GSC-03 | 2026-10-27 LON/SYD | tsx | timeAxis.test.ts both TZs |
| AT-GSC-04 | 2026-12-07 TOK/SYD/LON | tsx | timeAxis.test.ts both TZs |
| AT-GSC-05 | 2027-03-16 LON/SYD | tsx | timeAxis.test.ts both TZs |
| AT-GSC-06a | 2026-03-08 US spring-forward Sunday; one 12:00 UTC sample; **does not error**; weekend/closed banner | tsx | timeAxis + sessionView both TZs |
| AT-GSC-06b | 2026-10-25 London DST-end Sunday; one sample; does not error; weekend/closed | tsx | same |
| AT-GSC-06c | 2026-10-03 Sydney DST-start Saturday mid-window; one sample; does not error; weekend/closed | tsx | same |

## §8.2 Calendar — GSC1 (`tsx`) / India (`grep`)

| ID | Assertion | Class | Command |
|----|-----------|-------|---------|
| AT-GSC-10 | nyseHolidays(2026) exact 10 dates | tsx | `npx --yes tsx web/lib/marketCalendar/index.test.ts` |
| AT-GSC-11 | nyseHolidays(2027) exact 10 dates | tsx | same |
| AT-GSC-12 | earlyCloses(2026) = 11-27, 12-24 | tsx | same |
| AT-GSC-13 | earlyCloses(2027) = 11-26 | tsx | same |
| AT-GSC-14 | GF 2026-04-03 and 2027-03-26 | tsx | same |
| AT-GSC-15 | statusFor("2021-12-31").kind === "open" | tsx | same |
| AT-GSC-16 | statusFor("2020-07-03").kind === "closed" | tsx | same |
| AT-GSC-17a | nyseHolidays(2031) length 10 | tsx | same |
| AT-GSC-17b | no year-table literals outside tests | grep | `rg -n '20[0-9]{2}-[0-9]{2}-[0-9]{2}' web/lib/marketCalendar --glob '!*.test.ts'` → empty of holiday tables |
| AT-GSC-18 | earlyCloses(2028) = 07-03, 11-24 | tsx | index.test.ts |
| AT-GSC-19a | override array length 0 in shipped module | tsx | assert exported overrides `.length === 0` |
| AT-GSC-19b | override ∩ nyseHolidays/earlyCloses empty | grep | India GSC6-2: if array non-empty, every `date` not in that year’s rules lists |

## §8.3 Holiday view-model — GSC2-view (`tsx`)

| ID | Assertion | Class | Command |
|----|-----------|-------|---------|
| AT-GSC-20 | 2026-11-26 CLOSED; NY+SPX closed; Toronto normal; ES modified; band absent | tsx | `npx --yes tsx web/lib/sessions/sessionView.test.ts` |
| AT-GSC-21 | 2026-11-27 early; NY 9:30–1:00; SPX reg 9:30–1:15; ES 6:00 PM–1:15 PM; band end 13:00 | tsx | same |
| AT-GSC-22 | 2026-09-05 weekend; US rows closed; Globex Sunday 18:00 named; copy must not imply unmodified Monday | tsx | sessionView banner + next-open fields; Tango string fixture |

GSC4 **shots** do not re-prove 20–22.

## §8.4 Runtime — GSC5 (`pw`)

| ID | Assertion | Class | Command |
|----|-----------|-------|---------|
| AT-GSC-30 | After auth non-`loading`: only **application** request is `/api/auth/me` exactly once; chunks/RSC excluded; date change does not re-fetch | pw | Playwright route listener on `/api/**` excluding Next `/_next/**`; stamped Sessions URL |
| AT-GSC-31 | no storage/cookie **writes** from this route | pw | `page.evaluate` on setItem / document.cookie assignments after load |
| AT-GSC-32 | no console error/warning on mount, date change, theme switch | pw | `page.on('console')` |
| AT-GSC-33 | correct when process TZ ≠ America/New_York | tsx | covered by GSC2 both-TZ runs — **see FLAG below** |
| AT-GSC-34 | date field + both toggles keyboard + visible focus | pw | Tab order + `:focus-visible` |
| AT-GSC-35 | prefers-reduced-motion: no smooth scroll | pw | `emulateMedia({ reducedMotion: 'reduce' })` + computed `scroll-behavior` |
| AT-GSC-36 | interval cleared on unmount; exactly one live interval after three date changes | pw | unmount + `performance.getEntries` / exposed testid count; **class pw** (not unit) |

## Placement / DoD

| ID | Assertion | Class | Command |
|----|-----------|-------|---------|
| AT-GSC-40 | stamped path; Sessions active in Resources sub-nav | pw | `data-testid=resources-suite-nav` aria-current |
| AT-GSC-41a | marketCalendar tests pass bare tsx | tsx | `npx --yes tsx web/lib/marketCalendar/index.test.ts` |
| AT-GSC-41b | no react/next/components/app/dynamic import in lib trees | grep | `rg -n "from ['\\\"]react|from ['\\\"]next|components/|from ['\\\"]@/app|import\\(" web/lib/marketCalendar web/lib/sessions --glob '!*.test.ts'` |
| AT-GSC-41c | no next/dynamic or dynamic import() in Sessions route tree | grep | `rg -n "next/dynamic|import\\(" web/app/resource/sessions web/components/resources/sessions` (adjust if OD-S1 (b) path) |
| AT-GSC-42 | light and dark 1440 / 1024 / 390 | shot | Playwright screenshots three widths × two themes |
| AT-GSC-43 | staging Mini Two re-verified | ops | Foxtrot GSC6-0 log + AT re-run |
| AT-GSC-44 | production host named; rollback named | ops | Foxtrot gate report |
| AT-GSC-45 | existing auth floor; Observer included; no new policy | pw | Observer session loads stamped path 200 — **see FLAG below** |

---

## FLAGs (class cannot fully prove — do not waive; split or add at GO)

**AT-GSC-33.** Plan class `tsx` proves **Node process TZ**. It does **not** prove a **browser** whose `Intl` default is Asia/Tokyo. Kilo: keep 33 as `tsx` (GSC2 both TZ) and add **AT-GSC-33b** `pw` with `locale`/`timezoneId` if Playwright supports it on this machine — **Coach/Juliet**, not Kilo picking in product code. Until split, GSC5-G must not claim 33 closed the browser case.

**AT-GSC-45.** “No new policy” is a **diff/static** check (`git diff` has no `server/` entitlement files). Playwright only shows an Observer can load the page. Kilo: keep 45 as `pw` for load; **AT-GSC-45b** `grep`/`ops` = Mike GSC3-2 + empty `server/` diff. Delta: do not treat 45 pw as proving JR10.

---

## Spec §9 rows mapped

Every Spec §9.1–§9.4 row has an AT-GSC id above (01–05, 10–16, 20–22, 30–35). Plan extras: 06a/b/c, 17a/b, 18, 19a/b, 36, 40–45. **None dropped.**

GSC0-G does not wait on HTML.

## GSC0-7 done

Matrix locked. Hotel dates adopted after independent recompute (handoff: `hotel-calendar.md` zero diffs).
