# GSC0-2 — Hotel · NYSE calendar golden

**Agent:** Hotel  
**Date:** 2026-09-09  
**Machine:** Ernies-MacBook-Pro.local  
**Method:** Derived from Spec §7 rules, then diffed against plan §8.2. **Dates were not copied from §8.2 first.**

Anonymous Gregorian computus used for Easter (year mods 19/100/4 …) then Good Friday = Easter − 2.

Weekday: Mon=0 … Sun=6 in the scratch computer; observation:

- Sunday → following Monday  
- Saturday → preceding Friday **except New Year's Day** (that Friday is **not** an NYSE holiday)

Nth weekday: 3rd Monday Jan / 3rd Monday Feb / last Monday May / 1st Monday Sep / 4th Thursday Nov.

---

## Derivation (before the diff)

### 2026

| Holiday | Rule applied | Date | Weekday |
|---------|--------------|------|---------|
| New Year's Day | Jan 1 | 2026-01-01 | Thursday (no shift) |
| MLK | 3rd Monday January | 2026-01-19 | Monday |
| Presidents' | 3rd Monday February | 2026-02-16 | Monday |
| Good Friday | Easter 2026-04-05 − 2 | **2026-04-03** | Friday |
| Memorial | last Monday May | 2026-05-25 | Monday |
| Juneteenth | Jun 19 (Fri) | 2026-06-19 | Friday |
| Independence | Jul 4 is Saturday → observed Friday | **2026-07-03** | Friday |
| Labor | 1st Monday September | 2026-09-07 | Monday |
| Thanksgiving | 4th Thursday November | 2026-11-26 | Thursday |
| Christmas | Dec 25 Friday | 2026-12-25 | Friday |

**Count = 10.**

Early closes 2026:

- Jul 3 is **itself** the observed Independence holiday → **not** an early close  
- Day after Thanksgiving = 2026-11-27  
- Dec 24 Thursday, Christmas observed Dec 25 (not Dec 24) → early close  

**earlyCloses(2026) = 11-27, 12-24.**

### 2027

| Holiday | Rule applied | Date | Weekday |
|---------|--------------|------|---------|
| New Year's | Jan 1 Friday | 2027-01-01 | Friday |
| MLK | 3rd Monday Jan | 2027-01-18 | Monday |
| Presidents' | 3rd Monday Feb | 2027-02-15 | Monday |
| Good Friday | Easter 2027-03-28 − 2 | **2027-03-26** | Friday |
| Memorial | last Monday May | 2027-05-31 | Monday |
| Juneteenth | Jun 19 Saturday → Friday | **2027-06-18** | Friday |
| Independence | Jul 4 Sunday → Monday | **2027-07-05** | Monday |
| Labor | 1st Monday Sep | 2027-09-06 | Monday |
| Thanksgiving | 4th Thursday Nov | 2027-11-25 | Thursday |
| Christmas | Dec 25 Saturday → Friday | **2027-12-24** | Friday |

**Count = 10.**

Early closes 2027:

- Jul 3 2027 is **Saturday** → not a weekday eve  
- Day after Thanksgiving = 2027-11-26  
- Dec 24 **is** the observed Christmas holiday → **cannot also be an early close**  

**earlyCloses(2027) = 11-26 only.**

### 2028 (S3 year)

Jan 1 2028 is **Saturday**. New Year's Saturday exception: **do not** observe Friday 2027-12-31. So `nyseHolidays(2028)` has **no Jan 1 row**. That is nine weekday closures, not ten — Spec §9.2 does not claim ten for 2028.

| Holiday | Date | Weekday |
|---------|------|---------|
| MLK | 2028-01-17 | Monday |
| Presidents' | 2028-02-21 | Monday |
| Good Friday | 2028-04-14 (Easter 2028-04-16 − 2) | Friday |
| Memorial | 2028-05-29 | Monday |
| Juneteenth | 2028-06-19 | Monday |
| Independence | 2028-07-04 | **Tuesday** |
| Labor | 2028-09-04 | Monday |
| Thanksgiving | 2028-11-23 | Thursday |
| Christmas | 2028-12-25 | Monday |

Early closes 2028:

- Jul 3 Monday, weekday, **not** equal to observed Jul 4 (Tuesday) → **13:00 cash early close**  
- Day after Thanksgiving = 2028-11-24  
- Dec 24 2028 is **Sunday** → not a weekday eve  

**earlyCloses(2028) = 07-03, 11-24.** Hours: cash 13:00 ET; SPX regular and ES **13:15 ET** (Spec §7.3) — derived from the cash early close, not stored per date.

### 2031

Independently: 01-01 Wed, MLK 01-20, Presidents 02-17, GF 04-11 (Easter 04-13), Memorial 05-26, Juneteenth 06-19 Thu, Independence 07-04 Fri, Labor 09-01, Thanksgiving 11-27, Christmas 12-25 Thu. **Count = 10.** No table.

### Specials

- **2021-12-31:** Friday. Jan 1 2022 is Saturday. Exception: NYSE **open** that Friday. `statusFor("2021-12-31").kind === "open"`. Not in 2021 or 2022 holiday lists.  
- **2020-07-03:** Jul 4 2020 Saturday → observed Friday 2020-07-03. `statusFor("2020-07-03").kind === "closed"` (Independence observed).

---

## Diff vs plan §8.2 / Spec §9.2

| Assertion | Plan/Spec | Hotel derived | Diff |
|-----------|-----------|---------------|------|
| nyseHolidays(2026) | 01-01, 01-19, 02-16, 04-03, 05-25, 06-19, 07-03, 09-07, 11-26, 12-25 | identical | **none** |
| nyseHolidays(2027) | 01-01, 01-18, 02-15, 03-26, 05-31, 06-18, 07-05, 09-06, 11-25, 12-24 | identical | **none** |
| earlyCloses(2026) | 11-27, 12-24 | identical | **none** |
| earlyCloses(2027) | 11-26 | identical | **none** |
| GF 2026 / 2027 | 04-03 / 03-26 | identical (computus) | **none** |
| 2021-12-31 | open | open | **none** |
| 2020-07-03 | closed | closed | **none** |
| nyseHolidays(2031) | 10 dates | 10 dates as listed above | **none** |
| earlyCloses(2028) | 07-03, 11-24 | identical | **none** |

**No Spec date is wrong. No block.**

---

## TSE 15:30

Spec §5 Tokyo local session `09:00–11:30, 12:30–15:30`. TSE extended the cash close to **15:30 JST in November 2024**. A 15:00 close would shift every Tokyo ET range in Spec §9.1 by 30 minutes. Hotel: **15:30 is load-bearing.** Pin in GSC2-0 exchange table.

---

## ES on a US holiday = `modified`

CME Globex equity-index holiday hours **vary by product and by year**. Thanksgiving Thursday is typically a short or closed Globex day for ES; the day after is often an early close (~13:15 ET). Spec §8.4 and L7: hatch + label `modified`; **do not assert specific Globex hours** on a full US cash close (AT-GSC-20). AT-GSC-21 (Friday early close) **does** name ES `6:00 PM – 1:15 PM` because that is the **early-close** path (cash 13:00 → ES 13:15), not a holiday-hours invention for Thanksgiving itself.

Hotel: that split is correct. Inventing Wednesday/Thursday Globex hours would be reckless. **No block.**

---

## Coach content intact?

Yes. No Spec edits. If a future year disagrees, flag beside §9.2 — do not patch a table into `marketCalendar`.
