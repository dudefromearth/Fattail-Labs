"""Butterfly ParameterSchema (Pack Spec §4.3)."""

from __future__ import annotations

from typing import Any


def get_schema() -> dict[str, Any]:
    return {
        "common": [
            {
                "name": "butterfly_family",
                "type": "enum",
                "label": "Butterfly Family",
                "required": True,
                "options": ["batman", "single", "broken_wing"],
                "description": (
                    "Batman = call fly + put fly package (each wing-symmetric). "
                    "Single = one call or put fly. Broken wing = BWB. "
                    "Family can set direction — Batman defaults to both."
                ),
            },
            {
                "name": "direction",
                "type": "enum",
                "label": "Direction",
                "required": False,
                "options": ["call", "put", "both"],
                "description": (
                    "Call, put, or both. Batman sets both. "
                    "Single / BWB may be call, put, or both."
                ),
            },
            {
                "name": "dte_type",
                "type": "enum",
                "label": "DTE Type",
                "required": True,
                "options": [
                    "0dte",
                    "1dte",
                    "next",
                    "1_2_dte",
                    "2_4_dte",
                    "2_5_dte",
                    "5_10_dte",
                    "custom",
                ],
                "description": (
                    "Expiration schedule target: 0dte · 1dte · next listed · "
                    "house bands 1–2 / 2–4 / 2–5 / 5–10 · custom"
                ),
            },
            {
                "name": "dte_min",
                "type": "number",
                "label": "Min DTE",
                "required": False,
                "min": 0,
                "max": 45,
                "dependsOn": ["dte_type=custom"],
            },
            {
                "name": "dte_max",
                "type": "number",
                "label": "Max DTE",
                "required": False,
                "min": 0,
                "max": 45,
                "dependsOn": ["dte_type=custom"],
            },
            {
                "name": "exp_days",
                "type": "string",
                "label": "Schedule",
                "required": False,
                "description": (
                    "Weekday schedule the bot may trade, limited by the "
                    "symbol book (daily Mon–Fri, or Mon/Wed/Fri)."
                ),
            },
            {
                "name": "max_capital_at_risk",
                "type": "number",
                "label": "Max Capital at Risk",
                "required": True,
                "min": 0.01,
            },
            {
                "name": "max_capital_unit",
                "type": "enum",
                "label": "Capital Unit",
                "required": True,
                "options": ["dollars", "percent_of_capital"],
                "default": "dollars",
            },
            {
                "name": "primary_metric",
                "type": "enum",
                "label": "Primary Optimization Metric",
                "required": True,
                "options": [
                    "distribution_shape",
                    "sharpe",
                    "sortino",
                    "calmar",
                    "return_avg_dd",
                ],
                "description": (
                    "What Design judges the seat by. Return distribution shape "
                    "is the Monte Carlo of returns (right-skewed, long right tail, "
                    "short left tail). Ratios remain allowed. Never win rate or raw return."
                ),
            },
            {
                "name": "convexity_roc_min_pct",
                "type": "number",
                "label": "Min convexity RoC (%)",
                "required": False,
                "min": 0,
                "max": 500,
                "description": (
                    "Floor on the magnitude of convex change (Advanced Flies "
                    "tick %). Empty = no floor. 20 means >20%."
                ),
            },
            {
                "name": "convexity_roc_max_pct",
                "type": "number",
                "label": "Max convexity RoC (%)",
                "required": False,
                "min": 0,
                "max": 500,
                "description": (
                    "Cap on the magnitude of convex change (tick %). "
                    "Empty = no cap. 40 means <40%."
                ),
            },
            {
                "name": "entry_conditions",
                "type": "json",
                "label": "Entry Conditions",
                "required": False,
                "description": (
                    "Warrant list + pseudo-code (SL-GD37). criteria ⊂ "
                    "{vp_structure, price_action, gex, order_flow}. "
                    "OTM flies lead with VP structure + price action. "
                    "GEX / order flow may also warrant. pseudocode holds the "
                    "wide remainder. Never a price. Never a clock alone."
                ),
            },
            {
                "name": "entry_trigger",
                "type": "json",
                "label": "Entry trigger",
                "required": False,
                "description": (
                    "VP trigger grammar (SL-GD29): "
                    "level_class (hvn_top|hvn_bottom|lvn|intranode|retracement) "
                    "× interaction (test|hold|break|retest|reject) "
                    "× session_window (overnight|premarket|open|mid_morning|midday|"
                    "early_afternoon|late_afternoon|close|t_minus_n) "
                    "→ optional travel_target. Never a price. Never a clock alone. "
                    "May filter on node age + confirmation count (SL-GD33). "
                    "profile_version and structure_maturity are surface provenance "
                    "(SL-GD30–32), not config fields."
                ),
            },
            {
                "name": "exit_rules",
                "type": "json",
                "label": "Exit Rules",
                "required": True,
                "description": (
                    "Generally a dynamic trailing stop (required). "
                    "drivers ⊂ {premium_decay, time} are the dynamic part "
                    "(SL-GD38). pseudocode holds the wide remainder."
                ),
            },
            {
                "name": "underlying",
                "type": "string",
                "label": "Underlying",
                "required": False,
                "default": "SPX",
            },
            {
                "name": "strategy_template",
                "type": "enum",
                "label": "Strategy",
                "required": False,
                "options": [
                    "batman",
                    "single",
                    "vertical",
                    "butterfly",
                    "bwb",
                    "condor",
                    "straddle",
                    "strangle",
                    "iron_fly",
                    "iron_condor",
                    "calendar",
                    "diagonal",
                ],
            },
            {
                "name": "trade_side",
                "type": "enum",
                "label": "Side",
                "required": False,
                "options": ["buy", "sell"],
                "default": "buy",
            },
            {
                "name": "placement",
                "type": "enum",
                "label": "Center",
                "required": False,
                "options": ["atm", "otm"],
                "default": "atm",
            },
            {
                "name": "bias",
                "type": "enum",
                "label": "Bias",
                "required": False,
                "options": ["bullish", "bearish", "neutral"],
                "default": "neutral",
            },
            {
                "name": "bias_steps",
                "type": "number",
                "label": "Distance",
                "required": False,
                "min": 1,
                "max": 8,
                "default": 1,
            },
            {
                "name": "option_right",
                "type": "enum",
                "label": "Right",
                "required": False,
                "options": ["call", "put"],
            },
            {
                "name": "wing_width",
                "type": "number",
                "label": "Width",
                "required": False,
                "min": 1,
                "max": 20,
                "default": 4,
                "description": "Wing width in strikes (3 = three strikes wide).",
            },
            {
                "name": "body_width",
                "type": "number",
                "label": "Body",
                "required": False,
                "min": 1,
                "max": 200,
            },
            {
                "name": "short_gap",
                "type": "number",
                "label": "Shorts",
                "required": False,
                "min": 0,
                "max": 20,
                "default": 0,
                "description": "Strikes between short strikes. 0 = fly, n = condor body.",
            },
            {
                "name": "otm_r2r",
                "type": "number",
                "label": "R2R",
                "required": False,
                "min": 0.1,
                "max": 50,
                "description": (
                    "Larger R:R number (1:9 → 9). Chosen later by selecting "
                    "the strategy tile on the convexity heatmap — not typed "
                    "in Position Builder."
                ),
            },
            {
                "name": "batman_style",
                "type": "enum",
                "label": "Ears",
                "required": False,
                "options": ["symmetric", "broken"],
                "default": "symmetric",
                "description": (
                    "Each Batman ear is a fly. Symmetric = equal wings. "
                    "Broken = further-out wing smaller than the inner wing."
                ),
            },
            {
                "name": "broken_side",
                "type": "enum",
                "label": "Broken wing",
                "required": False,
                "options": ["far", "near"],
                "description": (
                    "Far = further-out wing smaller (004 / 007). "
                    "Near = closest wing smaller (005)."
                ),
            },
            {
                "name": "outer_width",
                "type": "number",
                "label": "Outer",
                "required": False,
                "min": 1,
                "max": 20,
                "description": "Further-out wing in strikes.",
            },
            {
                "name": "broken_extra",
                "type": "number",
                "label": "Broken extra",
                "required": False,
                "min": 1,
                "max": 200,
            },
            {
                "name": "dte_gap",
                "type": "number",
                "label": "DTE gap",
                "required": False,
                "min": 1,
                "max": 6,
                "default": 1,
            },
        ],
        "variants": {
            "batman": [
                {
                    "name": "symmetric_regime",
                    "type": "enum",
                    "label": "Regime",
                    "required": True,
                    "options": ["high_vix", "mid_vix", "low_vix", "campaign"],
                },
                {
                    "name": "width_style",
                    "type": "enum",
                    "label": "Width Style (scan)",
                    "required": True,
                    "options": ["wide", "variable", "narrow", "fixed_30_50"],
                },
                {
                    "name": "width_points_min",
                    "type": "number",
                    "label": "Min Width (points)",
                    "required": False,
                    "min": 10,
                    "max": 100,
                },
                {
                    "name": "width_points_max",
                    "type": "number",
                    "label": "Max Width (points)",
                    "required": False,
                    "min": 10,
                    "max": 100,
                },
                {
                    "name": "match_side_widths",
                    "type": "boolean",
                    "label": "Match call & put widths",
                    "required": False,
                    "default": True,
                    "description": (
                        "When true (usual Batman), call fly and put fly share the same width. "
                        "When false, set call_width_points and put_width_points separately."
                    ),
                },
                {
                    "name": "call_width_points",
                    "type": "number",
                    "label": "Call fly width (points)",
                    "required": False,
                    "min": 5,
                    "max": 150,
                    "dependsOn": ["match_side_widths=false"],
                    "description": "Width of the call-side symmetric fly only",
                },
                {
                    "name": "put_width_points",
                    "type": "number",
                    "label": "Put fly width (points)",
                    "required": False,
                    "min": 5,
                    "max": 150,
                    "dependsOn": ["match_side_widths=false"],
                    "description": "Width of the put-side symmetric fly only",
                },
                {
                    "name": "debit_to_width_min",
                    "type": "number",
                    "label": "Min Debit-to-Width",
                    "required": True,
                    "min": 0.01,
                    "max": 0.15,
                    "description": "Uses total package debit / (call_width + put_width)",
                },
                {
                    "name": "debit_to_width_max",
                    "type": "number",
                    "label": "Max Debit-to-Width",
                    "required": True,
                    "min": 0.01,
                    "max": 0.15,
                },
                {
                    "name": "directional_bias",
                    "type": "enum",
                    "label": "Directional Bias",
                    "required": False,
                    "options": ["none", "with_trend"],
                    "dependsOn": ["symmetric_regime=mid_vix"],
                },
                {
                    "name": "timing",
                    "type": "enum",
                    "label": "Timing",
                    "required": False,
                    "options": ["morning", "before_close", "any"],
                },
                {
                    "name": "frequency_per_week",
                    "type": "number",
                    "label": "Target Frequency per Week",
                    "required": False,
                    "min": 1,
                    "max": 5,
                    "dependsOn": ["symmetric_regime=campaign"],
                },
                {
                    "name": "vix_1d_mode",
                    "type": "enum",
                    "label": "1-Day VIX Adjustment",
                    "required": False,
                    "options": ["auto", "manual"],
                    "default": "auto",
                },
            ],
            "single": [
                {
                    "name": "symmetric_regime",
                    "type": "enum",
                    "label": "Regime",
                    "required": False,
                    "options": ["high_vix", "mid_vix", "low_vix", "campaign"],
                },
                {
                    "name": "width_style",
                    "type": "enum",
                    "label": "Width Style",
                    "required": True,
                    "options": ["wide", "variable", "narrow", "fixed_30_50"],
                },
                {
                    "name": "width_points_min",
                    "type": "number",
                    "label": "Min Width (points)",
                    "required": False,
                    "min": 10,
                    "max": 100,
                },
                {
                    "name": "width_points_max",
                    "type": "number",
                    "label": "Max Width (points)",
                    "required": False,
                    "min": 10,
                    "max": 100,
                },
                {
                    "name": "debit_to_width_min",
                    "type": "number",
                    "label": "Min Debit-to-Width",
                    "required": True,
                    "min": 0.01,
                    "max": 0.15,
                },
                {
                    "name": "debit_to_width_max",
                    "type": "number",
                    "label": "Max Debit-to-Width",
                    "required": True,
                    "min": 0.01,
                    "max": 0.15,
                },
                {
                    "name": "timing",
                    "type": "enum",
                    "label": "Timing",
                    "required": False,
                    "options": ["morning", "before_close", "any"],
                },
            ],
            "broken_wing": [
                {
                    "name": "bwb_style",
                    "type": "enum",
                    "label": "BWB Style",
                    "required": True,
                    "options": [
                        "A_efficiency",
                        "A_plus_scalp",
                        "B_steep",
                        "B_plus_gamma",
                    ],
                },
                {
                    "name": "broken_wing_side",
                    "type": "enum",
                    "label": "Broken Wing Side",
                    "required": True,
                    "options": ["upper", "lower"],
                },
                {
                    "name": "target_debit_to_payoff_min",
                    "type": "number",
                    "label": "Min Debit-to-Payoff",
                    "required": True,
                    "min": 0.01,
                    "max": 1.0,
                },
                {
                    "name": "target_debit_to_payoff_max",
                    "type": "number",
                    "label": "Max Debit-to-Payoff",
                    "required": True,
                    "min": 0.01,
                    "max": 1.0,
                },
                {
                    "name": "min_convexity_quality",
                    "type": "enum",
                    "label": "Minimum Convexity Quality",
                    "required": False,
                    "options": ["medium", "high", "extreme"],
                    "description": "Optional until convexity calibration (Q1); scores are provisional",
                },
                {
                    "name": "positioning_notes",
                    "type": "string",
                    "label": "Positioning Notes",
                    "required": False,
                },
            ],
        },
        "validationRules": [
            "max_capital_at_risk must be > 0",
            "primary_metric must be distribution_shape or a risk-adjusted ratio",
            "exit_rules must include dynamic premium decay trailing",
            "entry_conditions.criteria ⊂ {vp_structure, price_action, gex, order_flow}",
            "exit_rules.drivers ⊂ {premium_decay, time}; generally a dynamic trail",
            "No undefined risk structures allowed",
            "Batman = call fly + put fly; each fly is wing-symmetric",
            "Batman widths usually matched; match_side_widths=false allows per-side width",
            "Debit-to-width uses package debit / total width for Batman",
            "Broken Wing requires bwb_style and broken_wing_side",
            "min_convexity_quality is optional until calibration",
            "convexity_roc_min_pct / max_pct is the change band (tick % magnitude); omit a side for open-ended; never a debit-to-width substitute",
        ],
    }
