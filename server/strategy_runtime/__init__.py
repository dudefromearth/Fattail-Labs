"""Strategy Lab process runtime — Curate run environment first.

Curate: real market marks (data plane) + simulated broker + fake money.
Deploy/Tradier is out of scope for this package until Coach Deploy gate.
"""

from strategy_runtime.curate_domain import FILL_MODEL_MARK_MID_V1

__all__ = ["FILL_MODEL_MARK_MID_V1"]
