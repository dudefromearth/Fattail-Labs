"""Links Phase 3a — marker minting and attribution recording
(links/marker.py, links/attribution.py).

Specs/Links-Attribution-Affiliates-Spec-v0_1.md: AF-L1/AF-L2 (marker
alphabet/length), D8 (attribution signal only, no commission math).
link_markers/link_attributions carry no foreign key to links (see
migrations/156_attribution.sql) — a plain 6-char slug string is enough
to exercise this module without creating a real link row.
"""

from __future__ import annotations

import uuid

import db
import pytest

import links.attribution as attribution
from links.attribution import lookup_marker, mint_marker, record_attribution
from links.marker import LENGTH, new_marker
from links.slug import ALPHABET

SLUG = "zztst1"
PROVIDER = "stripe"


def _external_ref() -> str:
    return f"zztest-cs-{uuid.uuid4().hex[:8]}"


@pytest.fixture(autouse=True)
def _sweep():
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM link_markers WHERE slug = %s", (SLUG,))
            cur.execute("DELETE FROM link_attributions WHERE slug = %s", (SLUG,))


def test_new_marker_length_and_alphabet():
    marker = new_marker()
    assert len(marker) == LENGTH == 10
    assert set(marker) <= set(ALPHABET)


def test_new_marker_is_not_deterministic():
    markers = {new_marker() for _ in range(50)}
    assert len(markers) == 50


def test_mint_marker_inserts_and_is_retrievable():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG)
            found = lookup_marker(cur, marker)
    assert len(marker) == 10
    assert found is not None
    assert found["marker"] == marker
    assert found["slug"] == SLUG
    assert found["issued_at"] is not None


def test_mint_marker_retries_on_collision(monkeypatch):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            taken = mint_marker(cur, SLUG)

    fresh = "zztstcoll2"  # CHAR(10) — must be exactly 10 chars like a real marker
    assert len(fresh) == 10
    calls = iter([taken, taken, fresh])
    monkeypatch.setattr(attribution, "new_marker", lambda: next(calls))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            minted = mint_marker(cur, SLUG)
    assert minted == fresh
    assert minted != taken


def test_lookup_marker_unknown_returns_none():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert lookup_marker(cur, "zzzzzzzzzz") is None


@pytest.mark.parametrize("bad", [None, "", 123, 4.5])
def test_lookup_marker_rejects_non_string_or_empty(bad):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            assert lookup_marker(cur, bad) is None


def test_record_attribution_is_idempotent_on_provider_external_ref():
    ref = _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG)
            first = record_attribution(
                cur,
                marker=marker,
                slug=SLUG,
                identity_id=999001,
                provider=PROVIDER,
                external_ref=ref,
                amount_cents=4900,
                currency="usd",
            )
    assert first is True
    with db.transaction() as conn:
        with conn.cursor() as cur:
            # A redelivered webhook carrying the same provider+external_ref.
            second = record_attribution(
                cur,
                marker=marker,
                slug=SLUG,
                identity_id=999001,
                provider=PROVIDER,
                external_ref=ref,
                amount_cents=4900,
                currency="usd",
            )
            cur.execute(
                "SELECT COUNT(*) AS n FROM link_attributions WHERE external_ref = %s", (ref,)
            )
            count = cur.fetchone()["n"]
    assert second is False
    assert count == 1


def test_record_attribution_different_external_ref_both_recorded():
    ref_a, ref_b = _external_ref(), _external_ref()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            marker = mint_marker(cur, SLUG)
            assert record_attribution(
                cur,
                marker=marker,
                slug=SLUG,
                identity_id=999001,
                provider=PROVIDER,
                external_ref=ref_a,
                amount_cents=None,
                currency=None,
            )
            assert record_attribution(
                cur,
                marker=marker,
                slug=SLUG,
                identity_id=999001,
                provider=PROVIDER,
                external_ref=ref_b,
                amount_cents=None,
                currency=None,
            )
            cur.execute(
                "SELECT COUNT(*) AS n FROM link_attributions WHERE marker = %s", (marker,)
            )
            count = cur.fetchone()["n"]
    assert count == 2
