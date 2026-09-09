# GSC7-G — multi-day axis (revised)

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **PASS**

No deploy.

## Order run

GSC4.3 (`tradingDayInProgress`) → GSC7 day-list → GSC4.1 now-line always + centered → GSC4.2 hour labels, banner clock, visible segment labels.

## Paperwork

Spec **v0.3** sha1 `88a063109a95e94c0b2f06327ec7045a28de6c51` · **DL-687**. L2 unlocked, L3 amended (per-day sample), Fit = current trading day.

## Lib evidence

```text
TZ=UTC npx --yes tsx lib/sessions/sessionView.test.ts  # AT-GSC-20..22, 50..54 ok
TZ=UTC npx --yes tsx lib/sessions/timeAxis.test.ts     # AT-GSC-01..06 ok
TZ=UTC npx --yes tsx lib/sessions/window.test.ts       # AT-GSC-80..83, 85, 88 + GSC4.3
TZ=Asia/Tokyo — window + sessionView ok
```

No existing assertion was adjusted.

## Geometry (`evidence/gsc7/walk.json`)

| AT | Result |
|----|--------|
| 80 | `data-days=7`; weekends not days |
| 81/82 | window tests: London 3:00 AM Fri vs 4:00 AM Mon; Sydney labels differ across 10-03 |
| 83 | 11-26 hatch; 11-27 afternoon `truncated`; Closing absent |
| 84 | `scrollLeft` reaches end (`atEnd: true`) |
| 85 | Fri→Mon weekend seam, Sat/Sun not occupying |
| 86 | Fit `dayPx === viewport − 232` (744) |
| 87 | now-line centered on load (`nowCentered: true`) |
| 88 | 12-25 not a day; `cme-closed` seam; 11-26 occupies |

Banner clock present. `marketCalendar` not written.

## BLOCKERS

*(empty)*

## NOTES

GSC6 remains blocked on the host map (Mini Two is still production; no Labs staging vhost). This gate is dev-only.
