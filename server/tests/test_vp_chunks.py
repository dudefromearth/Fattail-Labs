"""Session-chunk encode / assemble. No Redis required."""

from market_data.vp_chunks import assemble_bars, encode_chunk, decode_chunk, ns_bars


def test_roundtrip_gzip_chunk():
    obj = {"session": "2026-09-18", "tf": "5m", "bars": [{"t": 1000, "o": 1, "h": 2, "l": 1, "c": 2, "v": 3}]}
    blob = encode_chunk(obj)
    assert blob[:2] == b"\x1f\x8b"
    back = decode_chunk(blob)
    assert back["session"] == "2026-09-18"
    assert len(back["bars"]) == 1


def test_assemble_concats_and_skips_outside_window():
    chunks = [
        {"session": "2026-09-17", "contract": "ESZ6", "lead_rule": "volume_only", "bars": [{"t": 1, "v": 1}]},
        {"session": "2026-09-18", "contract": "ESZ6", "lead_rule": "volume_only", "bars": [{"t": 2, "v": 2}]},
    ]
    from datetime import date

    bars, served, contract, rule = assemble_bars(
        chunks, from_d=date(2026, 9, 18), to_d=date(2026, 9, 18)
    )
    assert served == ["2026-09-18"]
    assert bars == [{"t": 2, "v": 2}]
    assert contract == "ESZ6"


def test_ns_bars_promote_ms():
    out = ns_bars([{"t": 1789660800000, "o": 1}])
    assert out[0]["t"] == 1789660800000 * 1_000_000
