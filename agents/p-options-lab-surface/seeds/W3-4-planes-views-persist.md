# W3-4 — Planes, named views, save-12, profile persist + migration

**Project:** Options Lab 3D Surface  
**Agents:** Charlie · **Alpha last**  
**Depends:** W3-3-G · W0-G (migration forbidden before GO)  
**Feeds:** W3-4-G  
**Order:** last W3 packet

## In scope

| Who | Files |
|-----|--------|
| Charlie | Planes HUD (Strike walk/hide, Time walk/hide, Value opacity + position) · factory named views · save / recall / rename / delete · cap 12 |
| Alpha **last** | Next free `migrations/NNN_*.sql` — `identities.surface_inspect_json` · GET/PATCH `/api/me/profile` |

Comment on the column: **Options Lab** Surface inspect defaults + saved
views (Tech §5). Reserved factory names 422. 13th view 422.

## Out of scope

Migration **before** this packet. Backtest seeds. Mini graphic.
Time-machine feed. Flat σ. MiniTwo. MSC. Reopening S1–S8.

## Evidence (W3-4-G)

- Desktop + phone browser walk: hide Strike & Time; Value off $0;
  save ≤12 views; recall does not reprice.  
- Curl: PATCH profile 200; 13th view 422; name `iso` 422.  
- Tests: T-VW-1 · T-VW-2 · T-BOOK-1 remains **document-law** (do not
  encode focused-only as product).
