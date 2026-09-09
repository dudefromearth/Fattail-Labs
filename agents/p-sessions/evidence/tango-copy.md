# GSC0-4 — Tango · Member copy

**Agent:** Tango  
**Date:** 2026-09-09  
**Persona:** bleeding trader, low trust, short on time. This page is a **clock**, not a setup scanner.  
**Product code:** none. Spec §11 wording not edited.

Label: **`Sessions`** exactly (L6). Title template as-built: `Sessions — FatTail Labs` (`web/app/layout.tsx` `title.template`).

Forbidden: profit, “best hours,” “opportunity,” “edge,” “where to trade.” Process / honesty only.

---

## Banners (four states)

Place above the chart. One banner always.

| State | Eyebrow | Body |
|-------|---------|------|
| Full session | `Full session` | `US cash is on a regular 9:30 AM – 4:00 PM ET session.` |
| Early close | `Early close` | `US cash closes 1:00 PM ET. SPX regular and ES halt 1:15 PM ET. Shifted ends are marked.` |
| Closed (US holiday) | `Closed` | `{holiday name}. US cash (pre-market, New York, after-hours) and both SPX rows are closed. Toronto is shown unmodified. ES is marked modified — Globex hours are not asserted.` |
| Weekend | `Weekend` | `US cash is closed. Globex is scheduled to reopen Sunday 6:00 PM ET. That reopen is not a promise of an unmodified Monday.` |

Weekend body is written so AT-GSC-22 cannot imply Labor Day Monday is regular. When the following weekday is a US holiday, append (ClosuresList will also show it): `Next US cash session is after {holiday name}.`

---

## Spec §11 disclosures (page copy — correctness, not decoration)

Keep all four facts. Suggested member register (Coach’s facts intact):

1. `Daylight saving is taken from each exchange's own time zone, so the four regional calendars resolve even in the weeks they disagree.`  
2. `Toronto keeps the Canadian calendar and is shown unmodified — including on most US closures.`  
3. `Foreign closures (Lunar New Year, Golden Week, UK bank holidays, and others) are not on this page. They can hollow out the overnight session even when New York is open.`  
4. `The axis skips 5:00–6:00 PM ET: CME Globex maintenance.`

---

## AT-GSC-02 instance — 2026-10-12 (Canadian Thanksgiving)

Toronto will render **normal-open**. That is L7/L8, not a bug. Disclosure Kilo can assert (exact string):

`Toronto is shown on the Canadian calendar and is not adjusted here. Canadian holidays (including Thanksgiving) are a known omission — the TSX bar can read open when Toronto is actually closed.`

Place with §11 item 2 so the limitation is named on the same page as the bar.

---

## AT-GSC-22 instance — 2026-09-05 (Saturday before Labor Day)

`Globex reopens Sunday 6:00 PM ET` is true. Monday 2026-09-07 is **Labor Day** (US cash closed; ES `modified`).

ClosuresList / “what opens next” must **not** say the next session is a regular Monday cash open.

Suggested next-open line when weekend + following Monday is a US full close:

`Globex: Sunday 6:00 PM ET. US cash: Tuesday after Labor Day. Monday is a US holiday — ES is modified, not a regular cash session.`

---

## ClosuresList

Heading: `Upcoming US closures`  
Empty: `No US closures in the next few sessions on this calendar.`  
Row: `{date} · {Closed | Early close} · {name}`  
Tone: inventory, not a warning siren. No “stay out of the market.”

Row labels on the chart: `closed` and `modified` — lowercase, same as Spec §8.4. Do not write `halted`, `dark`, or `dead`.

---

## Capacity

This page answers “what is open / what opens next.” It does not rank sessions. If Charlie wants a CTA, Tango blocks anything but `Today` and the timescale toggle.
