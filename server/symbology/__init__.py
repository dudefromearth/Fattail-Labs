"""Symbology & Registry Service (spec v0.2.1 §4) — membership, role, state.

Runtime home is the price server (D1). This package is the repo implementation
for Labs FastAPI. Strip writes stay explicit (SYM-4); no Massive scrape on the
resolve path (SYM-13). D6/D7/D8 are not answered here.
"""

from symbology.service import (
    AliasIngestRefused,
    AdjustmentRefused,
    NamedNotBuiltPreset,
    StripWriteRefused,
    assert_adjustment_none,
    assert_plane_key,
    eligibility_report,
    pair_badge,
    record_telemetry,
    reset_runtime_for_tests,
    resolve,
    roll_catalog,
    row_state_from_artifact,
    universe,
    write_strip_after_close,
)
from symbology.spec import (
    SpecGrainMismatch,
    SpecIncomplete,
    SpecLoadRefused,
    grain_for,
    load_specs,
    reset_specs_for_tests,
)

__all__ = [
    "AliasIngestRefused",
    "AdjustmentRefused",
    "NamedNotBuiltPreset",
    "StripWriteRefused",
    "assert_adjustment_none",
    "assert_plane_key",
    "eligibility_report",
    "pair_badge",
    "record_telemetry",
    "reset_runtime_for_tests",
    "resolve",
    "roll_catalog",
    "row_state_from_artifact",
    "universe",
    "write_strip_after_close",
    "SpecGrainMismatch",
    "SpecIncomplete",
    "SpecLoadRefused",
    "grain_for",
    "load_specs",
    "reset_specs_for_tests",
]
