# DLG2 — Echo · AT-DLG-17 itemised (v0.8 rebuild)

**Date:** 2026-09-12
**Spec:** v0.8
**Verdict:** each line **PASS**. Prototype is the layout. Five additions gone.

| Line | Echo |
|------|------|
| Type ladder | **PASS** |
| Buy/Sell segmented | **PASS** — radiogroup; selected Buy uses `--color-success`. Direction row is payoff + Buy/Sell only |
| Pop-up menus | **PASS** |
| Alignment axis | **PASS** — SYMBOL/STRATEGY two-column; legs on a column grid, full content width, nowrap |
| Commit last / Return-bound | **PASS** — Analyze above Cancel, stacked beside script |
| Colour semantic, hue not sole meaning | **PASS** — tokens only; Buy also labelled and selected. Green is **present** |
| Hairline / one elevation / one radius | **PASS** |
| Reduce-motion | **PASS** — no CSS transitions added |
| Accessibility labels | **PASS** |

**AT-DLG-18.** TOS SCRIPT label, code-surface, order string, click to copy.
**AT-DLG-19.** Legs on `--color-surface-secondary`, bordered, `p-4`.
**AT-DLG-20.** Buy segment and payoff stroke `--color-success`.
**AT-DLG-21.** No wrap at default and `data-font-size=larger`, light and dark.
**AT-DLG-22.** Call/Put, derived name, Centre, Width, structure-level Expiration absent.
**AT-DLG-29.** Corner-nested triangle on menu fields only. `--color-menu-marker` follows the theme. Not a chevron.
