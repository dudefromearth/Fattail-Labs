"""VP ops snapshot helper for the live Chain Snapshot pane.

Live pane (only): StudioOne Chain Snapshot
  http://studioone.local:5055
  on-box http://127.0.0.1:5055
  GET /api/vp-ops  (named states, no bins)

This package does not bind a dashboard. `python -m market_data.ops_dash` exits 1.
"""

LIVE_PANE = "http://studioone.local:5055"
LIVE_PANE_ONBOX = "http://127.0.0.1:5055"
