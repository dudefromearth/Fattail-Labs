"""Market data adapters for Strategy Lab — Massive in, local chain archive.

Historical tests read **local** collected chain snapshots.
Live tests may use the latest local snap and/or a one-shot Massive fetch.
Execution remains Tradier (separate package).
"""

from market_data.chain_store import ChainStore, SnapshotMeta
from market_data.massive_client import MassiveClient, MassiveClientError

__all__ = [
    "ChainStore",
    "SnapshotMeta",
    "MassiveClient",
    "MassiveClientError",
    # live marks: import market_data.live_marks for stream store
]
