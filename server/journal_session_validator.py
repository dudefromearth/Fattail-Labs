"""Journal Session agent turn validator — Spec v0.2 §8.2 · JS3-2.

Before any agent turn renders: block motive/advice/praise/blame/P&L/meter/
multi-question / chart claims / brevity requests. Log violation; one retry.
Double-fail → form fallback (never seal dead partial).
"""

from __future__ import annotations

import re
from typing import Any

# Violation codes (operator / tests)
VIOLATION_MOTIVE = "motive_or_emotion"
VIOLATION_ADVICE = "advice"
VIOLATION_PRAISE_BLAME = "praise_or_blame"
VIOLATION_PNL = "pnl_figure"
VIOLATION_METER = "grade_meter_streak_score"
VIOLATION_MULTI_Q = "multi_question"
VIOLATION_CHART = "chart_or_price_claim"
VIOLATION_BREVITY = "brevity_request"
VIOLATION_EMPTY = "empty"

# Patterns — case-insensitive; keep conservative (prefer false positive over leak)
_MOTIVE = re.compile(
    r"\b("
    r"hesitat(?:e|ed|ing)|anxious|anxiety|fear(?:ful)?|greed(?:y)?|"
    r"revenge\s*trad(?:e|ing)|lost\s+discipline|lost\s+confidence|"
    r"you\s+(were|are)\s+(scared|emotional|impulsive|tilted)|"
    r"your\s+(fear|greed|emotion|anxiety)"
    r")\b",
    re.I,
)
_ADVICE = re.compile(
    r"\b("
    r"you\s+should|you\s+must|you\s+need\s+to|you\s+ought|"
    r"i\s+recommend|i\s+suggest|better\s+to|try\s+to\s+instead|"
    r"don'?t\s+trade|stop\s+trading|take\s+the\s+trade"
    r")\b",
    re.I,
)
_PRAISE_BLAME = re.compile(
    r"\b("
    r"good\s+trade|nice\s+work|great\s+job|well\s+done|"
    r"poor(?:ly)?\s+(done|trade)|you\s+failed|you\s+messed|"
    r"proud\s+of\s+you|disappointing"
    r")\b",
    re.I,
)
_PNL = re.compile(
    r"("
    r"\$\s*-?\d|"
    r"\bP\s*&\s*L\b|\bPnL\b|\bpnl\b|"
    r"\bprofit\s+of\b|\bloss\s+of\b|"
    r"\bmade\s+\d|\blost\s+\d|"
    r"\b[+-]\s?\d+(\.\d+)?\s*(points?|ticks?|dollars?|bucks?)\b|"
    r"\bnet\s+(profit|loss)\b"
    r")",
    re.I,
)
_METER = re.compile(
    r"\b("
    r"process\s+integrity|grade|meter|streak|scorecard|score|"
    r"your\s+rating|ranked"
    r")\b",
    re.I,
)
_CHART = re.compile(
    r"\b("
    r"the\s+chart\s+shows|chart\s+shows|pattern\s+is|"
    r"price\s+is\s+at|reading\s+the\s+chart|from\s+the\s+image|"
    r"uploaded\s+(chart|image)\s+shows"
    r")\b",
    re.I,
)
_BREVITY = re.compile(
    r"\b("
    r"be\s+brief|keep\s+it\s+short|condense|summarize|"
    r"in\s+a\s+few\s+words|too\s+long|shorter\s+please"
    r")\b",
    re.I,
)


def validate_agent_turn(body_md: str) -> dict[str, Any]:
    """Return {ok, violations:[{code, detail}], body}.

    Does not rewrite body — caller retries or form-falls-back.
    """
    body = body_md if body_md is not None else ""
    text = str(body).strip()
    violations: list[dict[str, str]] = []

    if not text:
        violations.append({"code": VIOLATION_EMPTY, "detail": "empty agent turn"})
        return {"ok": False, "violations": violations, "body": body}

    # Strip control prefixes for multi-q / content checks (keep silent/confirm allowed)
    content = text
    for prefix in ("[silent]", "[confirm]"):
        if content.startswith(prefix):
            content = content[len(prefix) :].strip()
            break

    # Silent acks: very short, no questions required
    if text.startswith("[silent]"):
        if _PNL.search(content) or _MOTIVE.search(content) or _ADVICE.search(content):
            violations.append(
                {"code": VIOLATION_PNL, "detail": "silent ack contains banned content"}
            )
        return {
            "ok": len(violations) == 0,
            "violations": violations,
            "body": body,
        }

    if _MOTIVE.search(content):
        violations.append(
            {
                "code": VIOLATION_MOTIVE,
                "detail": "motive/emotion claim about the member",
            }
        )
    if _ADVICE.search(content):
        violations.append(
            {"code": VIOLATION_ADVICE, "detail": "advice or should-language"}
        )
    if _PRAISE_BLAME.search(content):
        violations.append(
            {
                "code": VIOLATION_PRAISE_BLAME,
                "detail": "praise or blame evaluation",
            }
        )
    if _PNL.search(content):
        violations.append(
            {"code": VIOLATION_PNL, "detail": "P&L or profit/loss figure"}
        )
    if _METER.search(content):
        violations.append(
            {
                "code": VIOLATION_METER,
                "detail": "grade/meter/streak/score mention",
            }
        )
    if _CHART.search(content):
        violations.append(
            {
                "code": VIOLATION_CHART,
                "detail": "chart/image interpretation or price claim",
            }
        )
    if _BREVITY.search(content):
        violations.append(
            {
                "code": VIOLATION_BREVITY,
                "detail": "request for brevity or summary",
            }
        )

    # Multi-question: more than one '?' or numbered list 1. 2.
    qmarks = content.count("?")
    if qmarks > 1:
        violations.append(
            {
                "code": VIOLATION_MULTI_Q,
                "detail": f"multiple questions ({qmarks} question marks)",
            }
        )
    if re.search(r"(?m)^\s*1[\.\)]\s+.+\n\s*2[\.\)]\s+", content):
        violations.append(
            {
                "code": VIOLATION_MULTI_Q,
                "detail": "numbered multi-question list",
            }
        )

    return {
        "ok": len(violations) == 0,
        "violations": violations,
        "body": body,
    }


def safe_fallback_question(tag: str) -> str:
    """Always-valid single absence question for retry path."""
    if tag == "clean_day":
        return "Did anything differ from the plan today?"
    if tag == "reflection":
        return "What is worth recording from this sitting?"
    if tag == "post_session":
        return "How did the day differ from the plan — in your words?"
    # pre_market default — invalidation (Hotel load-bearing)
    return "What would prove this plan wrong — your invalidation, in your words?"
