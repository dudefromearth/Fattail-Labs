"""SA v0.3 F1 / F2 goldens — detection prototype. No live store."""

from __future__ import annotations

from sa_dev.detect import detect
from sa_dev.fixtures import f1_bins


def test_f1_edges_nodes_crevasses():
    out = detect(f1_bins())
    edges = {(e["price"], e["direction"], e["contrast"]) for e in out["edges"]}
    assert (640.70, "up", 15.00) in edges
    assert (641.30, "down", 10.71) in edges
    assert (641.70, "up", 8.93) in edges
    assert (642.40, "down", 12.50) in edges

    crev = {(tuple(c["span"]), c["tag"], c["floor"]) for c in out["crevasses"]}
    assert ((641.40, 641.60), "inter-node", 28) in crev
    assert ((642.00, 642.10), "intra-node", 57.5) in crev

    nodes = {tuple(n["span"]): n["median"] for n in out["nodes"]}
    assert nodes[(640.70, 641.30)] == 300
    assert nodes[(641.70, 642.40)] == 250

    # terminal climb publishes nothing
    assert all(e["price"] < 643.10 for e in out["edges"])


def test_f2_window_invariance_interior():
    bins = f1_bins()
    full = detect(bins)
    left = detect(bins[:28])
    right = detect(bins[3:])

    def interior(payload: dict, lo: float, hi: float) -> dict:
        edges = [
            e
            for e in payload["edges"]
            if lo < e["price"] < hi
        ]
        nodes = [
            n
            for n in payload["nodes"]
            if n["span"][0] > lo and n["span"][1] < hi
        ]
        crev = [
            c
            for c in payload["crevasses"]
            if c["span"][0] > lo and c["span"][1] < hi
        ]
        return {"edges": edges, "nodes": nodes, "crevasses": crev}

    # rows 0–27 end at 642.70; rows 3–33 start at 640.30
    a = interior(full, 640.50, 642.50)
    b = interior(left, 640.50, 642.50)
    c = interior(right, 640.50, 642.50)
    assert a == b == c
