"""SA v0.3 §4 detection (DRAFT). Computing consumer of histograms only."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sa_dev.params import SA_PARAMS, parameter_set_hash


def _median(vals: list[float]) -> float:
    s = sorted(vals)
    n = len(s)
    if n == 0:
        return 0.0
    if n % 2 == 1:
        return float(s[n // 2])
    return (s[n // 2 - 1] + s[n // 2]) / 2.0


def _in_band(vol: float, median: float, band: float) -> bool:
    v = max(float(vol), 1.0)
    m = max(float(median), 1.0)
    return (m / band) <= v <= (m * band)


@dataclass
class _Run:
    i0: int
    i1: int
    kind: str
    median: float
    vols: list[float]


def _segment(vols: list[float]) -> list[_Run]:
    band = float(SA_PARAMS["sa.shelf_band"])
    min_rows = int(SA_PARAMS["sa.shelf_min_rows"])
    if not vols:
        return []
    runs: list[_Run] = []
    start = 0
    cur = [float(vols[0])]
    for i in range(1, len(vols)):
        med = _median(cur)
        if _in_band(float(vols[i]), med, band):
            cur.append(float(vols[i]))
            continue
        i1 = start + len(cur) - 1
        kind = "shelf" if len(cur) >= min_rows else "transition"
        runs.append(_Run(start, i1, kind, _median(cur), list(cur)))
        start = i
        cur = [float(vols[i])]
    i1 = start + len(cur) - 1
    kind = "shelf" if len(cur) >= min_rows else "transition"
    runs.append(_Run(start, i1, kind, _median(cur), list(cur)))
    return runs


def _width(run: _Run) -> int:
    return run.i1 - run.i0 + 1


def detect(bins: list[dict[str, Any]]) -> dict[str, Any]:
    """Return SA objects for an ascending `{price, volume}` histogram."""
    ordered = sorted(bins, key=lambda b: float(b["price"]))
    prices = [float(b["price"]) for b in ordered]
    vols = [float(b.get("volume") or 0) for b in ordered]
    runs = _segment(vols)
    shelves = [r for r in runs if r.kind == "shelf"]

    contrast_min = float(SA_PARAMS["sa.edge_contrast"])
    span_max = int(SA_PARAMS["sa.edge_span_max"])
    edges: list[dict[str, Any]] = []
    high_ids: set[int] = set()

    for a, b in zip(shelves, shelves[1:]):
        gap = b.i0 - a.i1 - 1
        if gap > span_max:
            continue
        hi, lo = (a, b) if a.median >= b.median else (b, a)
        if lo.median <= 0:
            continue
        contrast = hi.median / max(lo.median, 1.0)
        if contrast < contrast_min:
            continue
        if hi is b:
            # high shelf above: outermost row facing lower = bottom of hi
            price = prices[hi.i0]
            direction = "up"
        else:
            price = prices[hi.i1]
            direction = "down"
        edges.append(
            {
                "price": price,
                "direction": direction,
                "contrast": round(contrast, 2),
                "span": gap,
            }
        )
        high_ids.add(id(hi))

    crevasse_max = int(SA_PARAMS["sa.crevasse_max_rows"])
    intra_max = int(SA_PARAMS["sa.crevasse_intra_max_rows"])
    crevasses: list[dict[str, Any]] = []
    intra_spans: list[tuple[int, int]] = []

    for i, run in enumerate(runs):
        w = _width(run)
        if w > crevasse_max or w < 1:
            continue
        left = right = None
        for r in reversed(runs[:i]):
            if r.kind == "shelf":
                left = r
                break
        for r in runs[i + 1 :]:
            if r.kind == "shelf":
                right = r
                break
        if left is None or right is None:
            continue
        floor = run.median
        if floor <= 0:
            continue
        if left.median < contrast_min * floor:
            continue
        if right.median < contrast_min * floor:
            continue
        tag = "intra-node" if w <= intra_max else "inter-node"
        crevasses.append(
            {
                "span": [prices[run.i0], prices[run.i1]],
                "floor": floor,
                "flanks": [left.median, right.median],
                "tag": tag,
            }
        )
        if tag == "intra-node":
            intra_spans.append((run.i0, run.i1))

    node_min = int(SA_PARAMS["sa.node_min_rows"])
    nodes: list[dict[str, Any]] = []
    i = 0
    while i < len(runs):
        run = runs[i]
        if run.kind != "shelf" or id(run) not in high_ids:
            i += 1
            continue
        group = [run]
        j = i + 1
        while j < len(runs):
            nxt = runs[j]
            if nxt.kind == "shelf" and id(nxt) in high_ids:
                group.append(nxt)
                j += 1
                continue
            if nxt.kind != "shelf" and any(
                nxt.i0 == a and nxt.i1 == b for a, b in intra_spans
            ):
                j += 1
                continue
            if (
                nxt.kind == "shelf"
                and id(nxt) not in high_ids
                and any(nxt.i0 == a and nxt.i1 == b for a, b in intra_spans)
            ):
                j += 1
                continue
            break
        i0 = group[0].i0
        i1 = group[-1].i1
        width = i1 - i0 + 1
        if width >= node_min:
            high_vols = [v for r in group for v in r.vols]
            nodes.append(
                {
                    "span": [prices[i0], prices[i1]],
                    "attributed_volume": int(sum(vols[i0 : i1 + 1])),
                    "first_touch": None,
                    "median": _median(high_vols),
                }
            )
        i = j if j > i else i + 1

    grouping = None
    if nodes:
        grouping = {
            "span": [nodes[0]["span"][0], nodes[-1]["span"][1]],
            "boundary_voids": [],
        }

    return {
        "groupings": [grouping] if grouping else [],
        "nodes": nodes,
        "edges": edges,
        "crevasses": crevasses,
        "uncharted": [],
        "parameter_set_hash": parameter_set_hash(),
        "sa_q2": "open",
        "sa_q4": "owed",
    }
