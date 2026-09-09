# Charter — p-sessions (Global Session Clock)

**Mission:** Ship **Sessions** — a read-only Resources page that shows every major
global market open and close on one CME trading day (18:00 → 17:00 ET), so a member
can answer *what is trading right now, and what opens next* without leaving Labs.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Full plan:** [`docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md) **v1.2**  
**Spec:** [`Specs/FatTail-Labs-Sessions (Global Session Clock).md`](../../Specs/FatTail-Labs-Sessions%20(Global%20Session%20Clock).md)  
sha1 `81984ba9f2394d52aa359cefcdb108451fdec9e3`  
**W0 token:** [`agents/go/GSC-W0.md`](../go/GSC-W0.md) **GO** 2026-09-09 · **DL-685**  
**Evidence:** [`evidence/`](./evidence/)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Doctrine:** standalone repo · no live quotes · no persist · no server SoR · IANA
offsets (never stored UTC-offset pairs; local-time constants OK) · NYSE calendar from
rules (New Year's Saturday exception) · override empty/unscheduled · Toronto unmodified ·
ES `modified` · TSE 15:30 · `sessionView` SoR for row state · DL-539 frozen trees
untouched · no waived Delta gates.

---

## Coach locks (provisional until GSC0-0)

| # | Lock | Default (Spec / plan) |
|---|------|------------------------|
| L1 | Read-only | No persist, no server, no quotes |
| L2 | Axis | **Unlocked GSC7** — ordered list of CME trading days · per-day 1380 · `SPAN = n × 1380` |
| L3 | Offsets | **Amended GSC7** — IANA at 12:00 UTC **per day** in the list |
| L4 | Calendar | Rules; Saturday→Friday **not** for New Year's Day; override **empty**, unscheduled only |
| L5 | Row order | Americas → Futures → Europe → Asia-Pacific; **TSE 15:30** |
| L6 | Label | `Sessions` exactly |
| L7 | US close | Cash `closed`; Toronto live; ES `modified` |
| L8 | Disclosures | Four DST calendars; foreign holidays omitted; CME halt |
| L9 | Pure libs | `marketCalendar` + `web/lib/sessions/*`; proven by bare `npx tsx` |
| L10 | Pan detect | Not via the `scroll` event |
| L11 | View-model | `sessionView` is SoR for per-row state and banner kind |

---

## Goals

1. Resources child **Sessions** on the stamped path.  
2. Pure `marketCalendar` + time-axis + `sessionView` with Spec §9 tests.  
3. Chart, controls, now-line, holiday states, §11 copy.  
4. Light/dark at 1440 / 1024 / 390; application network after auth = `/api/auth/me` once.  
5. Staging Mini Two, then production host named, then close.

**Board NEXT:** Coach stamps **OD-S4** (GSC4) and/or **addendum §12** (GSC2.5). Neither is ticked. GSC3-G PASS. No product code on the addendum until stamped.
