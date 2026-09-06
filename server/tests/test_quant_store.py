"""Characterization: builder + store. AT-ATRV-1, 2, 3, 5, 6 and the two
absences. Runs against a synthetic day in the REAL era-1 shape (side, not
right; expiration on the snapshot; null bid/greeks; ratcheting band)."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from quant.build import build_day
from quant.layout import NULL_I32
from quant.store import DayStore
from tests.quant_fixture import write_day

pytest.importorskip("zstandard")


@pytest.fixture(scope="module")
def built(tmp_path_factory) -> tuple[Path, Path, dict]:
    root = tmp_path_factory.mktemp("qa")
    arch = write_day(root / "arch", snaps=120)
    out = root / "store"
    meta = build_day(arch, out, "2026-09-04", "XSP", greeks_quantum=6)
    return arch, out / "day=2026-09-04" / "book=XSP", meta


def test_build_refuses_to_write_inside_archive(tmp_path):
    arch = write_day(tmp_path / "arch", snaps=5)
    with pytest.raises(SystemExit):
        import subprocess, sys
        r = subprocess.run([sys.executable, "-m", "quant.build", "--archive", str(arch),
                            "--out", str(arch / "derived"), "--day", "2026-09-04",
                            "--book", "XSP", "--greeks-quantum", "6"],
                           capture_output=True, text=True, cwd=Path(__file__).resolve().parents[1])
        assert "REFUSING" in r.stdout + r.stderr
        raise SystemExit(r.returncode)


def test_packs_are_byte_identical_and_cells_verify(built):
    _, _, meta = built
    assert meta["verify"]["packs_byte_identical"] is True
    assert meta["verify"]["cells_mismatched"] == 0
    assert meta["verify"]["cells_checked"] > 100


def test_calls_and_puts_are_distinct_contracts(built):
    _, path, meta = built
    st = DayStore(path)
    cs = st.contracts()
    strikes = {c[0] for c in cs}
    # every strike appears with BOTH sides — the Track A experiments collapsed them
    for k in strikes:
        assert (k, "C", "2026-09-04") in cs and (k, "P", "2026-09-04") in cs
    assert st.C == 2 * len(strikes)


def test_ratchet_band_grows_C_and_presence_is_honest(built):
    _, path, _ = built
    st = DayStore(path)
    # a strike admitted late is absent early: present=0, and value() is None
    late = st.find(619.0, "C")            # fixture first ratchet strike, admitted after 60 snaps
    assert late is not None
    assert st.present(late, 0) is False
    assert st.value("mid", late, 0) is None
    assert st.present(late, st.T - 1) is True
    assert st.value("mid", late, st.T - 1) is not None


def test_null_field_is_not_absence(built):
    _, path, _ = built
    st = DayStore(path)
    # find a present cell whose bid was null in the fixture (3% of rows)
    found = False
    for c in range(st.C):
        for t in range(st.T):
            if st.present(c, t) and st.value("bid", c, t) is None:
                assert st.value("mid", c, t) is not None   # present, priced, bid null
                found = True; break
        if found: break
    assert found, "fixture should contain null bids on present rows"


def test_quotes_exact_greeks_quantised_with_recorded_error(built):
    _, path, meta = built
    f = meta["fields"]
    for q in ("mid", "bid", "ask"):
        assert f[q]["quantised"] is False and f[q]["scale_violations"] == 0
    for g in ("delta", "gamma", "theta", "vega", "iv"):
        assert f[g]["quantised"] is True
        assert 0 < f[g]["max_error"] <= 5e-7
    assert f["last_updated"]["scale_violations"] == 0
    assert meta["stamp_encoding"]["last_updated"] == "offset_ms_from_time[t]"


def test_series_without_opening_a_snapshot(built, monkeypatch):
    """AT-ATRV-3: a contract's series is retrieved without opening any snapshot."""
    arch, path, _ = built
    st = DayStore(path)
    opened = []
    real_open = Path.read_bytes
    def spy(self, *a, **k):
        if self.suffix == ".json" and "snap-" in self.name:
            opened.append(self)
        return real_open(self, *a, **k)
    monkeypatch.setattr(Path, "read_bytes", spy)
    c = st.find(630.0, "C")
    s = st.series("mid", c)
    assert len(s) == st.T and any(v is not None for v in s)
    assert opened == []


def test_mark_withheld_never_interpolated(built):
    """AT-ATRV-6: mark is None at any t where ANY leg is absent."""
    _, path, _ = built
    st = DayStore(path)
    early = st.find(630.0, "C"); late = st.find(619.0, "C")
    mark, ok = st.mark([(early, 1), (late, -1)])
    assert ok[0] is False and mark[0] is None      # late leg absent at t=0
    assert ok[-1] is True and mark[-1] is not None
    # and it never fills: count of withheld equals count of late-leg absence
    assert sum(1 for o in ok if not o) == sum(1 for p in st.present_series(late) if not p)


def test_rebuild_is_byte_identical(built, tmp_path):
    """AT-ATRV-1: delete and rebuild -> identical columns."""
    arch, path, _ = built
    out2 = tmp_path / "store2"
    build_day(arch, out2, "2026-09-04", "XSP", greeks_quantum=6, verify=False)
    p2 = out2 / "day=2026-09-04" / "book=XSP"
    for name in ("present.u8", "mid.i32", "delta.i32", "time.i64", "spot.i32"):
        assert (path / name).read_bytes() == (p2 / name).read_bytes(), name


def test_time_lookup_never_interpolates(built):
    _, path, _ = built
    st = DayStore(path)
    t5 = st.time_ms(5)
    assert st.t_at_or_before(t5) == 5
    assert st.t_at_or_before(t5 + 999) == 5        # inside the 2 s gap -> the snapshot that WAS the surface
    assert st.t_at_or_before(st.time_ms(0) - 1) is None
