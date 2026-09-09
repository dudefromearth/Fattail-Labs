# GSC5-G — theme · a11y · runtime · widths

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **PASS**

## Evidence

`evidence/gsc5/walk.json`

- Light and dark at 1440 / 1024 / 390.
- `--color-session-*` on `:root`, `prefers-color-scheme: dark`, and `:root[data-theme="dark"]`.
- Keyboard: date field and Fit receive focus (`sessions-date`, `sessions-scale-fit`).
- `scroll-behavior: auto` under `prefers-reduced-motion: reduce`.
- `/api/auth/me`: 3 on load (SiteHeader + HelpLauncher + `fetchMe` cache). **0 extra** after three date changes (AT-GSC-30 date half + AT-GSC-36: one interval, empty deps).

## Allowlist

`web/styles/tokens.css` · session components (`motion-reduce` on scroller).

## BLOCKERS

*(empty)*
