# J1-0 — Adhere filter = meter complement (F2)

**Agents:** India · Alpha  
**Verdict:** **PASS** (2026-08-08)

## Meter good set

Among tagged trades in the adherence window: `followed` + `partial`.

## Default “behind the drift” filter (complement)

```
adherence NOT IN ('followed', 'partial')
```

→ `broke` + `unknown` (and any non-good value). **Partial is not in the default drift set.**

## Query param contract

| Param | Value | Effect |
|-------|--------|--------|
| `adherence_mode` | `drift` | Apply complement filter |
| `from_day` / `to_day` | `YYYY-MM-DD` optional | Restrict to meter window when Journey deep-links |
| omit / clear | — | No adherence filter |

Visible + clearable on Trade Log. No Reports destination.

## Alpha ACK

Implement list filter in J1-1 only with this definition.
