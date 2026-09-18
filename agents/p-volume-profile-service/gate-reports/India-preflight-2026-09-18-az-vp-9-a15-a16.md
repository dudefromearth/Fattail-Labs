# India pre-flight — AZ-VP-9-A15 + A16 2026-09-18

**Machine:** StudioTwo · no spec-body invention · Coach expected triples

| File | Lines | sha1 | `## ` | Last heading | Verdict |
|------|------:|------|------:|--------------|---------|
| `Specs/amendments/AZ-VP-9-A15.md` | 39 | `671e11365d95032353b923abfbf4403d0477b56a` | 2 | `## Standing` | **MATCH** |
| `Specs/amendments/AZ-VP-9-A16.md` | 26 | `156577a1d3fea9d4d33e6ac8c6606afc2841a008` | 2 | `## Standing` | **MATCH** |

**A15:** Round-2 annotated TV verdicts (fonts bigger, bordered candles, responsive time axis, 75 px y-padding, futures-increment scale). Extends A13/A14. Nothing struck. Benchmark PNGs on the board.

**A16:** Price-scale increments from the instrument's own tick metadata (symbol-metadata / vendor Contracts). Refines A15.5. No hardcoded 0.25 in surface code.

**Does not.** Invent hashes. Client-side tick tables. Stop `:3000`/`:4000`.

**§ Bench delta:** A16 forbids a surface tick table; display consumers must read tick from metadata/API.

**§ Flagged ideas:** inventory intact. Tick-path gap recorded in `A16-tick-path-2026-09-18.md` (contract candidate, not a client table).
