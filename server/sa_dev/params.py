"""Versioned SA v0.3 DRAFT detection parameters."""

from __future__ import annotations

import hashlib
import json
from typing import Any

SA_PARAMS: dict[str, Any] = {
    "spec": "Structural-Analysis-Service-Spec-v0_3",
    "sa.shelf_band": 2.0,
    "sa.shelf_min_rows": 3,
    "sa.edge_contrast": 3.0,
    "sa.edge_span_max": 3,
    "sa.crevasse_max_rows": 4,
    "sa.crevasse_intra_max_rows": 2,
    "sa.node_min_rows": 5,
}


def parameter_set_hash(extra: dict[str, Any] | None = None) -> str:
    blob = {**SA_PARAMS, **(extra or {})}
    raw = json.dumps(blob, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


# Source → member target (mapping offset is INFRA; prototype publishes FAILED).
SOURCE_TARGET = {
    "ES": {"target_symbol": "SPX", "ratio": 1},
    "MES": {"target_symbol": "XSP", "ratio": 0.1},
    "SPY": {"target_symbol": "XSP", "ratio": 1},
    "F1": {"target_symbol": "F1", "ratio": 1},
}

SOURCE_ROW = {
    "ES": 0.25,
    "MES": 0.25,
    "SPY": 0.10,
    "F1": 0.10,
}
