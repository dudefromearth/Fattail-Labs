"""Progress admin surface — live growth telemetry for administrators.

Standalone read-only analytics over three external sources (WooCommerce,
YouTube, ActiveCampaign). Nothing here is on a member path.

Layout:
  metrics.py     pure — derives members/revenue/churn/funnel from source facts
  projection.py  pure — steady state, ramp, gap to target
  rules.py       pure — threshold findings, each carrying its trigger number
  sources_*.py   I/O — fetch + normalise one external source
  refresh.py     orchestration — fetch, compute, snapshot (per-source isolation)

Spec: Specs/FatTail-Labs-Progress-Admin-Spec-v1.0.md · DL-530
"""
