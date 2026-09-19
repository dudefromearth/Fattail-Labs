"""SYM-12 gray reasons — member-facing copy, not engineer tokens."""

from __future__ import annotations

# Spec SYM-12 reason ids. Copy uses the spec's own wording where given.
REASONS: dict[str, str] = {
    "not-supported-yet": "Not supported yet",
    "below-expiration-criterion": "Below the expiration coverage this app offers",
    "not-available-in-this-app": "Not available in this app",
    "path-not-yet-verified": "path not yet verified",
    "stack-carries-no-futures-options": "This stack does not carry futures options",
    "needs-the-daily-volume-path": "needs the daily volume path",
}

COMING_REASON = "path-not-yet-verified"

# Help copy per §0.5 / SYM-6 — not an eligibility predicate.
ELIGIBILITY_HELP_COPY = "short-dated including 0DTE (0–5 DTE)"


def payload(code: str) -> dict[str, str]:
    if code not in REASONS:
        raise ValueError(f"unknown gray reason: {code}")
    return {"reason_code": code, "copy": REASONS[code]}
