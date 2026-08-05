"""Strategy Pack shared types (Pack Architecture Spec v1.0.1)."""

from __future__ import annotations

from typing import Any, Literal, TypedDict

PRIMARY_METRICS = frozenset({"sharpe", "sortino", "calmar", "return_avg_dd"})

RankedBy = Literal[
    "sharpe",
    "sortino",
    "calmar",
    "return_avg_dd",
    "convexity_ratio_proxy",
]


class FieldDefinition(TypedDict, total=False):
    name: str
    type: str
    label: str
    required: bool
    options: list[Any]
    min: float
    max: float
    default: Any
    dependsOn: list[str]
    description: str


class ParameterSchema(TypedDict):
    common: list[dict[str, Any]]
    variants: dict[str, list[dict[str, Any]]]
    validationRules: list[str]


class UIDefinition(TypedDict):
    layout: str
    livePreview: bool
    sections: list[dict[str, str]]


class ValidationResult(TypedDict):
    valid: bool
    errors: list[str]
    warnings: list[str]


class StructureLeg(TypedDict, total=False):
    right: str
    side: str
    strike: float
    qty: int
    dte: int
    entry_price: float


class Structure(TypedDict, total=False):
    id: str
    legs: list[StructureLeg]
    width_points: float
    family: str
    right: str
    note: str


class StructureMetrics(TypedDict, total=False):
    debitOrCredit: float
    maxProfit: float
    maxLoss: float
    netPremiumAbs: float
    debitToPayoffRatio: float | None
    debitToWidthRatio: float | None
    convexityScore: float
    convexityProvisional: bool
    expectedSharpe: float | None
    expectedSortino: float | None
    expectedCalmar: float | None
    expectedReturnAvgDd: float | None


class DataProvenance(TypedDict, total=False):
    source: str
    provider: str
    label: str
    asof: str
    run_id: str


class RankedStructure(TypedDict, total=False):
    structure: Structure
    metrics: StructureMetrics
    rank: int
    score: float
    ranked_by: str
    primary_metric_substituted: bool
    data_provenance: DataProvenance
    reasons: list[str]
