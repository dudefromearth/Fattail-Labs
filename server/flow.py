"""Aggregate user-flow analytics for the admin "Flow" view.

Pure, testable aggregation over page_views: sessionise each member's navigation
(same 30-min inactivity gap as activity.py), map granular paths to a small set of
readable "areas", and roll up into the pieces a flow visual needs:

  - steps:       per-step columns (step 1 = first page of a session, …) with each
                 area's session count + per-step drop-off — the Sankey's columns.
  - step_links:  area→area transitions between consecutive steps — the Sankey's bands.
  - dropoff:     per area — sessions that reached it and how often they exited from
                 it (exit-rate) — "where do people leave".
  - journeys:    the most common ordered area sequences — the literal common paths.
  - entries:     where sessions begin.

The step columns are cycle-free by construction (a session's Nth view is always to
the right of its (N-1)th), so they render as a clean left-to-right Sankey without a
graph-layout library. Balance invariant the frontend relies on, for every step i
that has a next column:  node[i][A] == sum_B link[i][A→B] + exit[i][A].

No DB access here (the route passes rows in) so this unit-tests without a database.
Spec: FatTail-Labs-User-Flow-Spec-v1.0.
"""

from __future__ import annotations

from collections import Counter, defaultdict

import activity

# Reuse the one definition of "a session" so Flow and the Users view never drift.
SESSION_GAP_SECONDS = activity.SESSION_GAP_SECONDS

# How many steps the flow Sankey shows. Sessions longer than this are still counted
# up to the cap; we simply stop drawing further columns (kept readable, not a wall).
MAX_STEPS = 6

# Most common journeys to surface.
TOP_JOURNEYS = 12

# Granular path -> readable area. Longest matching prefix wins (so "/app/trade-log"
# beats a hypothetical "/app"). Anything unmapped falls back to a titleised first
# segment, so a newly-added route still shows up instead of being silently dropped.
_AREA_PREFIXES: tuple[tuple[str, str], ...] = (
    ("/app/trade-log", "Trade Log"),
    ("/app/journal", "Journal"),
    ("/app/retrospective", "Retrospective"),
    ("/app/reports", "Reports"),
    ("/app/statistics", "Statistics"),
    ("/app/strategy-lab", "Strategy Lab"),
    ("/app/toughness", "Toughness"),
    ("/app/practice", "Practice"),
    ("/app/playbook", "Playbook"),
    ("/app/records", "Records"),
    ("/app/journey", "Journey"),
    ("/app/community", "Community"),
    ("/app/wiki", "Wiki"),
    ("/course", "Courses"),
    ("/live", "Live"),
    ("/hub", "Hub"),
    ("/dashboard", "Dashboard"),
    ("/pathway", "Pathway"),
    ("/resource", "Resources"),
    ("/membership", "Membership"),
    ("/guide", "Guide"),
    ("/me", "Account"),
    ("/profile", "Account"),
    ("/home", "Home"),
    ("/about", "About"),
    ("/campaign", "Campaign"),
    ("/signup", "Signup"),
)


def area_for(path: str) -> str:
    """Map a recorded pathname to a readable flow area."""
    p = (path or "").split("?", 1)[0].split("#", 1)[0].rstrip("/") or "/"
    best: tuple[str, str] | None = None
    for prefix, area in _AREA_PREFIXES:
        if p == prefix or p.startswith(prefix + "/"):
            if best is None or len(prefix) > len(best[0]):
                best = (prefix, area)
    if best is not None:
        return best[1]
    segs = [s for s in p.split("/") if s]
    if not segs:
        return "Home"
    seg = segs[1] if segs[0] == "app" and len(segs) > 1 else segs[0]
    return seg.replace("-", " ").title() or "Home"


def _sessionise(events: list[tuple[int, str]]) -> list[list[str]]:
    """events: (epoch, area) for ONE member, any order. -> list of sessions, each a
    list of areas with consecutive duplicates collapsed (a refresh or intra-area
    sub-navigation is not a flow between areas)."""
    events = sorted(events)
    sessions: list[list[str]] = []
    cur: list[str] = []
    prev: int | None = None
    for ts, area in events:
        if prev is not None and ts - prev > SESSION_GAP_SECONDS:
            if cur:
                sessions.append(cur)
            cur = []
        if not cur or cur[-1] != area:
            cur.append(area)
        prev = ts
    if cur:
        sessions.append(cur)
    return sessions


def build_flow(rows: list[tuple[int, str, int]]) -> dict:
    """rows: (identity_id, path, epoch_seconds), any order. Returns the flow payload.

    Everything is derived from sessionised, area-mapped navigation. Pure — no I/O.
    """
    by_user: dict[int, list[tuple[int, str]]] = defaultdict(list)
    for ident, path, ts in rows:
        try:
            by_user[int(ident)].append((int(ts), area_for(path)))
        except (TypeError, ValueError):
            continue

    # Step-indexed accumulators (index 0 == step 1).
    step_nodes: list[Counter] = [Counter() for _ in range(MAX_STEPS)]
    step_exit: list[Counter] = [Counter() for _ in range(MAX_STEPS)]
    step_links: list[Counter] = [Counter() for _ in range(MAX_STEPS - 1)]  # i -> i+1

    reached: Counter = Counter()   # sessions that visited an area at all (once/session)
    exited_from: Counter = Counter()  # sessions whose LAST area was this
    entries: Counter = Counter()   # sessions whose FIRST area was this
    journeys: Counter = Counter()
    dwell_total: Counter = Counter()  # area -> summed seconds with a measurable next view
    dwell_n: Counter = Counter()      # area -> number of measurable intervals
    total_sessions = 0

    # Per-area dwell: time from a view to the next view within the same session is
    # "time spent" on that view's area (the last view before a gap is unknowable — no
    # next timestamp — so it's excluded, same limitation as time-on-platform).
    for events in by_user.values():
        ev = sorted(events)  # (ts, area)
        for (t0, a0), (t1, _a1) in zip(ev, ev[1:]):
            gap = t1 - t0
            if 0 <= gap <= SESSION_GAP_SECONDS:
                dwell_total[a0] += gap
                dwell_n[a0] += 1

    for events in by_user.values():
        for seq in _sessionise(events):
            total_sessions += 1
            shown = min(len(seq), MAX_STEPS)
            entries[seq[0]] += 1
            exited_from[seq[-1]] += 1
            for area in set(seq):
                reached[area] += 1
            journeys[tuple(seq[:MAX_STEPS])] += 1
            for i in range(shown):
                step_nodes[i][seq[i]] += 1
            for i in range(shown - 1):
                step_links[i][(seq[i], seq[i + 1])] += 1
            # A session ends at step `len(seq)`. If that terminal step is within the
            # drawn range and has a next column, record it as a drop-off there so the
            # Sankey balances (node = onward links + exits).
            end_i = len(seq) - 1
            if 0 <= end_i < MAX_STEPS - 1:
                step_exit[end_i][seq[end_i]] += 1

    steps = []
    for i in range(MAX_STEPS):
        col_total = sum(step_nodes[i].values())
        if col_total == 0:
            break
        nodes = [{"area": a, "count": c} for a, c in step_nodes[i].most_common()]
        steps.append({
            "step": i + 1,
            "nodes": nodes,
            "exit": sum(step_exit[i].values()),
            "exit_by_area": [
                {"area": a, "count": c} for a, c in step_exit[i].most_common()
            ],
            "total": col_total,
        })

    links = []
    for i, ctr in enumerate(step_links):
        for (a, b), c in ctr.most_common():
            links.append({"step": i + 1, "from": a, "to": b, "count": c})

    dropoff = []
    for area, reached_n in reached.most_common():
        exits = exited_from.get(area, 0)
        n = dwell_n.get(area, 0)
        dropoff.append({
            "area": area,
            "reached": reached_n,
            "exits": exits,
            "exit_rate": round(exits / reached_n, 4) if reached_n else 0.0,
            # Average seconds spent in the area per measured visit; None if we never had
            # a next view to measure against (so the UI shows "—" rather than a fake 0).
            "avg_seconds": round(dwell_total[area] / n) if n else None,
        })

    top_journeys = [
        {"areas": list(seq), "count": c}
        for seq, c in journeys.most_common(TOP_JOURNEYS)
    ]

    return {
        "totals": {
            "sessions": total_sessions,
            "views": len(rows),
            "members": len(by_user),
        },
        "steps": steps,
        "step_links": links,
        "dropoff": dropoff,
        "entries": [{"area": a, "count": c} for a, c in entries.most_common()],
        "journeys": top_journeys,
        "max_steps": MAX_STEPS,
    }
