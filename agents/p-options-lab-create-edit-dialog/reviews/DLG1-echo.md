# DLG1 — Echo · named code-surface token

**Date:** 2026-09-11
**Verdict:** named. Charlie implements; does not invent a parallel set.

## Token

| Name | Value | Rule |
|------|-------|------|
| `--color-code-surface` | `#1c1c1e` | Dark in **both** themes. Defined once on `:root`. Not overridden by `data-theme`. |

This is the named **code-surface token** of DLG-THEME-4. The ToS script block
renders from it. The exception is the token, never a hex in `PositionBuilder.tsx`.

Script **text** uses the existing `--color-success` (readable on `#1c1c1e` in
both themes). No second invented token.

## Dialog mapping (existing application tokens — do not fork)

| Role | Token |
|------|-------|
| Panel | `--color-surface` · `--color-label` · `--color-separator` · `--radius-lg` · `--elevation-3` |
| Title | `--text-title-3` · `--color-label` |
| Section label | `--text-caption` · `--color-label-secondary` |
| Field | `--color-fill` · `--text-body` · `--hit-min` at rest · `--radius-sm` |
| Buy / payoff buy | `--color-success` |
| Sell / payoff sell | `--color-destructive` |
| Primary action | `--color-tint` · `--color-on-tint` |
| Script surface | `--color-code-surface` |
| Script text | `--color-success` · `--font-mono` |

Honour `data-theme`, `data-font-size`, `data-density`, `data-corners`, `data-tint`
already on the document root. No `[color-scheme:dark]` on the panel.

`surface="dialog"`: `--hit-min` at rest, **no** grow-on-hover.
`surface="card"`: PC-HIG-8 unchanged. ToS triangle stays card-only.
