"""A14.6 ETag helpers. No Massive."""

from market_data.vp_http_cache import (
    cache_control_for,
    etag_match,
    format_etag,
    generation_id_of,
)


def test_etag_quotes_generation_id():
    assert format_etag("g-test") == '"g-test"'
    assert format_etag('"g-test"') == '"g-test"'


def test_etag_match_strips_weak():
    assert etag_match('"g-test"', '"g-test"')
    assert etag_match('W/"g-test"', '"g-test"')
    assert not etag_match('"other"', '"g-test"')


def test_session_immutable_developing_revalidate():
    assert "immutable" in cache_control_for("session")
    assert "must-revalidate" in cache_control_for("developing")
    assert "must-revalidate" in cache_control_for("range", live=True)


def test_generation_id_prefers_profile_generation():
    assert generation_id_of({"profile_generation_id": "g1", "parameter_set_hash": "p"}) == "g1"
    assert generation_id_of({"parameter_set_hash": "p"}) == "p"
