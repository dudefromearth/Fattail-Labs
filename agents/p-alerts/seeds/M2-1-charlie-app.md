# Seed M2-1 — Charlie Manager app + Settings wire

**Project:** p-alerts  
**Agent:** Charlie  
**Phase:** M  
**Depends:** M1 (API exists) · Echo W0-3  
**Law:** ALM §2 · HI Spec  
**Gate it feeds:** M3 · M4

## Intent

Member can open **Alerts** from the user menu. Settings stays configuration-only. Index is read-only with “Open in {app}.”

## Files in scope

- `web/app/app/alerts/page.tsx` (new)  
- `web/components/SiteHeader.tsx` (user menu item **Alerts** → `/app/alerts`)  
- `web/components/settings/AlertsPane.tsx` — **remove** any + Add Rule / second builder; honest “delivery not live” banner until destinations GO  
- `web/lib/alerts/` client for Manager fetches (not Analyzer canvas)

## Out of scope

`HostPnLChart`. Alert Builder dialog. MiniTwo. SMS/email live. Delete chrome. Analyzer holder.

## Wire

1. `/app/alerts` — Overview stats (armed / active / fired / by suite / by class) — **no P&L**. Index list + deep link. **§8.5 H8 / AT-ALM-12:** Member dialect, kit `List`/`Banner`/`Button`, calm grouped content — **not** `/admin`. Do not drift to dashboard-dense.  
2. User menu: Alerts **and** Settings both visible.  
3. Stats from `GET /api/me/alerts/stats`. Fail honest if flag off. Honesty banner = kit `Banner`. Tokens only (FP14).

## Done when

Signed-in: menu → `/app/alerts` renders. Settings Alerts has no second builder. AT-ALM-1, 2 **would** pass once M4 lands.

## Invariants

Kit only. **FP14.** Echo already stamped grammar. Position never strategy (N/A on this page except titles passed through).
