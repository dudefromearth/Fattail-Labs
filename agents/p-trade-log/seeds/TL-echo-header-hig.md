# Seed TL-Echo — Trade Log page chrome (HIG)

**Project:** p-trade-log · **Agent:** Echo (design) → Charlie (implement)  
**Surface:** Trade Log app page header/toolbar only — **not** blotter table body  
**Constitution:** `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`  
**Domain skin exception:** ToS solid blocks remain on table body only.

---

## Design packet (Echo APPROVED for implement)

### Regions

| Region | Role |
|--------|------|
| Breadcrumb | Quiet path: Apps › Trade Log |
| Title block | Large title + one-line deference subtitle |
| Toolbar | Trailing action cluster — **one primary** |

### Action hierarchy

| Control | Intent | Primitive |
|---------|--------|-----------|
| Account scope | Filter / scope | Native `select` on `color.fill` pill (not outline chrome) |
| Import | Secondary action | `Button` `secondary` |
| Export | Secondary + menu | `Button` `secondary` → menu of formats |
| Accounts | Tertiary / setup | `Button` `plain` (or secondary when panel open) |
| **New trade** | **Primary CTA** | `Button` `primary` + `IconPlus` |

### Rules

1. No equal-weight outline pill farm.
2. Max one filled tint primary.
3. Hit targets ≥ 44pt (`--hit-min`).
4. Export formats in a surface menu (elevation-2), not a second competing select that looks like a button.
5. Tokens only; kit `Button` / icons from `web/components/ui`.
6. Narrow: toolbar wraps under title, still right-aligned cluster where possible.
7. Accounts panel remains below chrome (surface-card); Create uses primary kit button.

### Explicitly out of scope

- Blotter row colors / ToS selection model
- Sheet interiors (ImportSheet / TradeSheet) polish pass (follow-up)

### Verdict after implement

Echo re-checks: hierarchy, tokens, 44pt, no emoji, one primary.
