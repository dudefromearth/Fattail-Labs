# Seeds — Labs Alerts

Plan: [`docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md`](../../../docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md).

| Seed | Agent | Phase | Fire |
|------|-------|-------|------|
| `W0-0-coach-plan-stamp.md` | Coach | W0 | First |
| `W0-1-lima-hash.md` | Lima | W0 | After W0-0 |
| `W0-2-india-parents.md` | India | W0 | After W0-1 |
| `W0-3-echo.md` | Echo | W0 | After W0-2 |
| `W0-4-tango.md` | Tango | W0 | After W0-2 |
| `W0-5-hotel.md` | Hotel | W0 | After W0-2 |
| `W0-6-mike.md` | Mike | W0 | After W0-2 |
| `W0-G-delta.md` | Delta | W0 | After W0-2…6 |
| `W0-BA-coach-build-authority.md` | Coach | W0 | After W0-G |
| `D0-1-charlie-dark-gate.md` | Charlie | D0 | **Only if** W0-BA chose keep-dark |
| `M1-1-alpha-api.md` | Alpha | M | After W0-BA names M |
| `M2-1-charlie-app.md` | Charlie | M | After M1 |
| `M3-1-echo-review.md` | Echo | M | After M2 |
| `M4-1-kilo-at.md` | Kilo | M | After M1+M2 |
| `M5-1-lima-docs.md` | Lima | M | After M1 (∥ M4) |
| `MG-delta.md` | Delta | M | After M3+M4+M5 |
| `C1-1-charlie-builder.md` | Charlie | C1 | After W0-BA names C1 |
| `C1-2-echo-review.md` | Echo | C1 | After C1-1 |
| `C1-3-kilo-at.md` | Kilo | C1 | After C1-1 |
| `C1-4-lima-analyzer-spec.md` | Lima | C1 | After C1-1 (∥ C1-3) |
| `C1-G-delta.md` | Delta | C1 | After C1-2+C1-3+C1-4 |
| `C2-0-india-lock.md` | India | C2 | Both viewport W-G PASS |
| `C2-BA-coach.md` | Coach | C2 | After C2-0 |
| `C2-1-charlie-canvas.md` | Charlie | C2 | After C2-BA |
| `C2-2-echo-review.md` | Echo | C2 | After C2-1 |
| `C2-3-kilo-at.md` | Kilo | C2 | After C2-1 |
| `C2-G-delta.md` | Delta | C2 | After C2-2+C2-3 |
| `S-1-charlie-adapter-swap.md` | Charlie | S | After M-G + C1-G |
| `S-2-kilo-at-alb-9.md` | Kilo | S | After S-1 |
| `S-G-delta.md` | Delta | S | After S-2 |

Each seed: specs + plan phase, files in scope, NX, invariants, done criteria, gate it feeds.
