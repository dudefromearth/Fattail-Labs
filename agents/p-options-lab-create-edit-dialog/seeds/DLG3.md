# DLG3 — Symbol

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Phase:** DLG3
**Depends:** DLG2-G PASS
**Laws:** DLG-SYM-1…9
**ATs named:** AT-DLG-12 · AT-DLG-13 · AT-DLG-14
**Gate:** `gate-reports/DLG3-G.md` — fifteen-row table. Tango sits.

Amendments become DLG3b. Never edit this file.

## Exact files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/lib/options-lab/dlgSymbol.test.ts` (new)
- `web/components/options-lab/OpfRiskAnalyzer.tsx` **only if** Charlie routes universe/chain as props. **Prop-wire only. Zero chrome.** Prefer consuming `useOptionsLab` / `useBuilderChain` inside `PositionBuilder` so the host is untouched (plan §14).

Delta **FAIL**s any extra file. A host chrome diff is FAIL.

## Why this exists

As-built at `71a9ab5` (~1682–1692): a `<select>` with one `<option>` and an inert `onChange`
commented `/* session symbol is host-owned */`. A picker that cannot pick.

Build a real one against the existing `{ symbol, setSymbol, universe }` source. **Do not call
`setSymbol`.** Symbol changes the position's underlying only (DLG-SYM-7 · §8.4).

## Intent

1. Real control. Choices from `useOptionsLab()` universe — the same source `OpfRiskAnalyzer` already uses (~249). Unloaded: **"Loading symbols…"**, never a one-option finished choice.
2. OPF truth (DL-309): only symbols with an OPF-held chain are selectable. Others listed and **disabled**, reading **"no chain held"**.
3. On change: write `position.underlying` only. Do **not** call `setSymbol`. Do not rewrite `?symbol=` or sessionStorage. Header `analyzer-symbol-select` must not move.
4. Hydrate the new underlying through existing `useBuilderChain` (already takes a symbol argument). Affected fields: **"Loading chain…"** until the ladder is in hand. Then re-resolve centre, width, legs, basis. No strike, width or price carries across.
5. Multiplier follows the new symbol's existing `profile.contract_multiplier`. Never carry SPX ×100 onto MES. Package value and script recompute.
6. Locked basis: **unlock and re-derive**, and say so. Old debit never appears on the new instrument. Symbol control stays enabled while locked.
7. Package count carries. Presets and saved widths re-resolve to the new grid via the loading state, never silently reused.

## Stop and ask

If the existing chain path cannot hydrate a non-session symbol without `setSymbol` or a new
OPF endpoint — **stop and ask Coach**. Do not invent a fetch. Do not substitute
`supports_options` for OPF-held unless that is already how OPF marks a missing chain (verify).
Plan §14.

## Out

Session `setSymbol` · new universe API · new OPF endpoint · hardcoded symbols · disabling the
symbol control while locked · carrying strikes/widths/prices/multiplier · restyle · IKI fork.

## Gate notes

Tango: "no chain held" / "Loading symbols…" / "Loading chain…" / unlock-on-symbol-change copy.
Live: pick a held symbol in the dialog; header selector unchanged.
AT-DLG-4/11/15 remain PASS. Grep `setSymbol` in `PositionBuilder.tsx` must be empty (or only
a comment that it is **not** called).
