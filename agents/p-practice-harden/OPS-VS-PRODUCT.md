# Ops vs product — Practice / Trade Log tools

**Project:** p-practice-harden · **Author:** Juliet · **Coach ACK:** 2026-07-29 (H3)  

These scripts exist for **bench, demos, and operator backfill**. They are **not**
member-facing product features. Do not add them to suite nav, marketing, or
member docs without a separate approved Spec slice.

## Bench / ops only

| Artifact | Role |
|----------|------|
| `server/import_0dte_xlsx.py` | Load historical 0DTE spreadsheet books for demos; **synthetic/illustrative** strike geometry where needed |
| `server/seed_reports_demo_pnl.py` | Backfill NULL close `pnl_amount` via `trade_log_domain` |
| `server/seed_trade_log_demo.py` | Demo trade fixtures |
| `server/seed_clone_trade_log.py` | Clone books between identities for ops |
| Local one-off scripts / xlsx under private paths | Operator only |

## Product (member)

| Surface | Role |
|---------|------|
| Trade Log blotter + Import sheet | Member import: ToS CSV / canonical JSON (in-app) |
| Reports / Journal | Analytics read models over **member** books |
| Practice suite nav | Trade Log · Reports · Journal · Retrospective shell · Playbook shell |

## Rules for future agents

1. **Do not** ship ops scripts as UI without Coach + Spec.  
2. Label synthetic/illustrative data as such (Hotel).  
3. Prefer domain package for any PnL/structure backfill — no twin algorithms.  
4. Cross-link: Spec Trade Log §15.5 · CHARTER out-of-scope.  
