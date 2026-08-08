"""J0 pure alignment — Spec §6a.2 / Kilo #21 celebrate-the-drift regression."""

from campaign_alignment import axis_extension, boundary_alignment, goal_progress


def test_boundary_in_band_full():
    assert boundary_alignment(50.0, 40.0, 60.0) == 1.0


def test_boundary_oob_high_reduces():
    """85% win rate against 40–60 must not spike — decays."""
    a = boundary_alignment(85.0, 40.0, 60.0)
    assert a < 1.0
    assert a < boundary_alignment(60.0, 40.0, 60.0)
    # further out → lower
    assert boundary_alignment(100.0, 40.0, 60.0) <= a


def test_boundary_oob_low_reduces():
    a = boundary_alignment(20.0, 40.0, 60.0)
    assert 0.0 <= a < 1.0


def test_goal_progress_reaches_band():
    assert goal_progress(50.0, 40.0, 60.0) == 1.0
    assert goal_progress(10.0, 40.0, 60.0) < 1.0


def test_axis_extension_role_dispatch():
    # OOB high is bad for boundary, fine (reached) if somehow goal mid
    b = axis_extension("boundary", 85.0, 40.0, 60.0)
    g = axis_extension("goal", 85.0, 40.0, 60.0)
    assert b < 1.0
    assert g == 1.0
