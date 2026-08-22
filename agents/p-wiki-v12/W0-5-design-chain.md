# W0-5 — UX · Echo · Interaction · Tango

**Date:** 2026-08-22  
**Depends:** W0-4 (`web/app/app/wiki/page.tsx`)  
**Feeds:** W0-7 Kilo  
**Law:** HIS v1.0 · Admin Interface v0.1.2 §2 · WI1 search-first · WI9 stay-put · WI10 admin-only DOM

Charlie placed a read-only empty region **below search**, `data-testid="wiki-compile-inbox"`. No Compile, no Dismiss, no target chooser. OD-WA3 (chord vs mark) stays W1.

Each reviewer below is a distinct seat. Echo does **not** cover UX / Interaction / Tango.

---

## UX — PASS

- Region is an in-flow `<section>` on the Wiki entry, not a modal, not a route, not a drawer.
- Search (WI1) remains the first interactive block; inbox is `mt-8` under a separator after the search form.
- Empty copy is one line. No illustration, no extra chrome, no competing CTA.
- Does not eat Start here / New this week.

## Echo (UI) — PASS

- Tokens only: `--color-separator`, `--color-label-tertiary`, `--color-label-secondary`. Heading matches Start here (`text-sm font-semibold uppercase tracking-wide`).
- No ad-hoc card, no invented toolbar, no new color.
- W0 has **no controls**, so `--hit-min` / 44pt does not apply to a button. When W1 adds Compile / Dismiss, those must be `min-h-[var(--hit-min)]`.
- Density matches the entry page: paragraph empty state, same as Start here when empty.

## Interaction — PASS

- Stay-put: the region contains no links, buttons, or forms. AT-WA6 W0 reading (does not navigate) holds by construction.
- Absent from DOM unless `index.admin === true` (WI10). Navigator / activator / observer: no node.
- Keyboard: no new tab stops. Search remains the focused control on load.
- Not a modal; does not trap focus; does not paint over member UI.

## Tango — PASS

- Empty copy is the Admin Interface spec string, Coach-adjacent, verbatim: *“Nothing deployed without a wiki/help directive.”*
- No backlog, opportunity, “items waiting,” or profit/process-claim language.
- Wiki **waits** (WK11). Heading “Compile inbox” is the spec surface name, not a member CTA.
- **“Compile this into Wiki”** unused until W1, as required.

Any FAIL from these four seats ⇒ Delta FAIL. None failed.
