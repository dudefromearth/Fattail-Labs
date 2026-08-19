"""Characterization — apply endings and follow-ons. No invented Typeform rubric."""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from apply_score import endings_live, resolve_ending, walk_path


def _q(**kwargs):
    base = {
        "id": 1,
        "slug": "q",
        "ask": "Ask",
        "hint": "",
        "qtype": "binary",
        "options": [],
        "on_path": True,
        "is_email": False,
        "sort_order": 10,
    }
    base.update(kwargs)
    return base


def test_no_tags_means_endings_are_not_live():
    q = _q(options=[{"label": "Yes", "outcome": "", "reveal": []}])
    assert endings_live([q]) is False
    assert resolve_ending([q], {"q": "Yes"}) is None


def test_plurality_picks_coach():
    q = _q(
        options=[
            {"label": "In", "outcome": "coach", "reveal": []},
            {"label": "Out", "outcome": "trial", "reveal": []},
        ]
    )
    assert resolve_ending([q], {"q": "In"}) == "coach"
    assert resolve_ending([q], {"q": "Out"}) == "trial"


def test_tie_is_trial():
    a = _q(
        slug="a",
        options=[
            {"label": "Yes", "outcome": "coach", "reveal": []},
            {"label": "No", "outcome": "", "reveal": []},
        ],
    )
    b = _q(
        id=2,
        slug="b",
        options=[
            {"label": "Yes", "outcome": "lakesia", "reveal": []},
            {"label": "No", "outcome": "", "reveal": []},
        ],
    )
    assert resolve_ending([a, b], {"a": "Yes", "b": "Yes"}) == "trial"


def test_untagged_path_with_live_map_is_trial():
    scored = _q(
        slug="gate",
        on_path=False,
        options=[{"label": "Yes", "outcome": "coach", "reveal": []}],
    )
    email = _q(
        id=2,
        slug="email",
        qtype="free_text",
        options=[],
        is_email=True,
    )
    assert endings_live([scored, email]) is True
    assert resolve_ending([scored, email], {"email": "a@b.co"}) == "trial"


def test_answer_reveals_follow_on():
    gate = _q(
        slug="gate",
        options=[
            {"label": "Yes", "outcome": "coach", "reveal": ["more"]},
            {"label": "No", "outcome": "trial", "reveal": []},
        ],
    )
    more = _q(id=2, slug="more", qtype="free_text", on_path=False, options=[])
    path = walk_path([gate, more], {"gate": "Yes"})
    assert [q["slug"] for q in path] == ["gate", "more"]
    skip = walk_path([gate, more], {"gate": "No"})
    assert [q["slug"] for q in skip] == ["gate"]
