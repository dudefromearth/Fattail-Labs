"""Characterization tests — aggregate user-flow rollup (flow.py).

Pure aggregation, no DB. These lock the two things a wrong refactor would break:
the path→area mapping, and the Sankey balance invariant the frontend relies on
(a step node's throughput equals its onward links plus its drop-offs).
Spec: FatTail-Labs-User-Flow-Spec-v1.0.
"""

from __future__ import annotations

import flow


# --- area mapping ------------------------------------------------------------


def test_area_for_known_prefixes():
    assert flow.area_for("/app/trade-log") == "Trade Log"
    assert flow.area_for("/app/trade-log/123") == "Trade Log"
    assert flow.area_for("/course/getting-started/intro") == "Courses"
    assert flow.area_for("/hub") == "Hub"
    assert flow.area_for("/me?tab=billing") == "Account"


def test_area_for_unknown_falls_back_to_titleised_segment():
    # Never dropped — a new route shows up as a readable area, not lost.
    assert flow.area_for("/brand-new-thing") == "Brand New Thing"
    assert flow.area_for("/app/some-new-tool") == "Some New Tool"
    assert flow.area_for("/") == "Home"


# --- sessionisation ----------------------------------------------------------


def test_sessionise_splits_on_gap_and_collapses_repeats():
    gap = flow.SESSION_GAP_SECONDS
    events = [
        (0, "Home"),
        (10, "Home"),        # collapse consecutive dup
        (20, "Hub"),
        (20 + gap + 5, "Courses"),  # new session after the gap
    ]
    sessions = flow._sessionise(events)
    assert sessions == [["Home", "Hub"], ["Courses"]]


# --- rollup + balance invariant ---------------------------------------------


def _rows():
    # Two members. Member 1: Home→Courses→Lesson(=Courses collapses? no, Lesson maps
    # to Courses too) — use distinct areas. Session A: Home→Hub→Courses (completes).
    # Session B (member 2): Home→Hub (drops at Hub). Session C (member 2, later):
    # Home (drops immediately).
    g = flow.SESSION_GAP_SECONDS
    return [
        (1, "/home", 0),
        (1, "/hub", 30),
        (1, "/course", 60),
        (2, "/home", 0),
        (2, "/hub", 30),
        (2, "/home", 10 * g),   # much later → new session, single page
    ]


def test_build_flow_totals_and_entries():
    out = flow.build_flow(_rows())
    assert out["totals"]["members"] == 2
    assert out["totals"]["sessions"] == 3
    # Every session starts at Home.
    entries = {e["area"]: e["count"] for e in out["entries"]}
    assert entries == {"Home": 3}


def test_build_flow_dropoff():
    out = flow.build_flow(_rows())
    drop = {d["area"]: d for d in out["dropoff"]}
    # Home reached by all 3 sessions; one session (the lone Home visit) ended there.
    assert drop["Home"]["reached"] == 3
    assert drop["Home"]["exits"] == 1
    # Hub reached by 2 sessions; one ended at Hub.
    assert drop["Hub"]["reached"] == 2
    assert drop["Hub"]["exits"] == 1
    # Courses reached + exited by the one completing session.
    assert drop["Courses"]["exits"] == 1


def test_sankey_balance_invariant():
    """For every step with a next column: node throughput == onward links + exits."""
    out = flow.build_flow(_rows())
    steps = out["steps"]
    links = out["step_links"]
    for i in range(len(steps) - 1):
        step_no = i + 1
        onward: dict[str, int] = {}
        for l in links:
            if l["step"] == step_no:
                onward[l["from"]] = onward.get(l["from"], 0) + l["count"]
        exits = {e["area"]: e["count"] for e in steps[i]["exit_by_area"]}
        for nd in steps[i]["nodes"]:
            a = nd["area"]
            assert nd["count"] == onward.get(a, 0) + exits.get(a, 0), (
                f"step {step_no} area {a}: {nd['count']} != "
                f"{onward.get(a, 0)} + {exits.get(a, 0)}"
            )


def test_empty_rows_safe():
    out = flow.build_flow([])
    assert out["totals"]["sessions"] == 0
    assert out["steps"] == []
    assert out["dropoff"] == []
    assert out["journeys"] == []
