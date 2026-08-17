"""Unit tests for traffic capture helpers (no DB) — bot filter, referrer, UTM, path."""

from __future__ import annotations

import traffic


def test_is_bot():
    assert traffic.is_bot("Googlebot/2.1") is True
    assert traffic.is_bot("curl/8.1") is True
    assert traffic.is_bot(None) is True  # missing UA = noise
    assert traffic.is_bot("Mozilla/5.0 (Macintosh) Safari/605") is False


def test_clean_path_drops_admin_and_query():
    assert traffic._clean_path("/pricing?utm_source=x#top") == "/pricing"
    assert traffic._clean_path("/admin") is None
    assert traffic._clean_path("/admin/stats") is None
    assert traffic._clean_path("relative") is None
    assert traffic._clean_path("") is None


def test_referrer_external_vs_internal():
    host, full = traffic._referrer_parts("https://t.co/abc", "labs.fattail.ai")
    assert host == "t.co" and full == "https://t.co/abc"
    # same-origin referral collapses to direct
    assert traffic._referrer_parts("https://labs.fattail.ai/course", "labs.fattail.ai") == (None, None)
    assert traffic._referrer_parts("", "labs.fattail.ai") == (None, None)
    assert traffic._referrer_parts(None, None) == (None, None)


def test_clean_utm_trims_and_caps():
    assert traffic._clean_utm("  newsletter  ") == "newsletter"
    assert traffic._clean_utm("") is None
    assert traffic._clean_utm(None) is None
    assert len(traffic._clean_utm("x" * 500)) == 128
