"""Options Pricing Foundation (OPF) — L0–L4 data plane + model packs.

Law: Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md (v0.2.1)
Architecture: Architecture/30-options-pricing-foundation.md
Program: docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md

MSC is not the standard. No Massive clients here — consume generations only.
"""

from __future__ import annotations

__all__ = [
    "config",
    "keys",
    "strike",
    "tau",
    "static_facts",
    "generation",
    "interest",
    "leg",
    "package",
    "lock",
    "archive",
    "resolve",
    "session",
]
