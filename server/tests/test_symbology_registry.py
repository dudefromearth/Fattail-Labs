"""SYM1 characterization — spec v0.2.1 §4 / SYM-AT without the surface.

Isolation: server/symbology + routes/symbology + this file. No LIM/QFRIC/XS/PPL.
"""

from __future__ import annotations

from datetime import date

import pytest

from symbology import catalog, service
from tests.conftest import cookie_for

MEMBER = cookie_for("navigator")
PATHS = (
    "/symbology/v1/universe",
    "/symbology/v1/resolve?q=ES",
    "/symbology/v1/roll-catalog",
    "/symbology/v1/eligibility-report",
)


@pytest.fixture(autouse=True)
def _reset_registry():
    service.reset_runtime_for_tests()
    yield
    service.reset_runtime_for_tests()


def _get(client, path, **params):
    return client.get(path, params=params or None, cookies=MEMBER)


# --- auth -------------------------------------------------------------------


@pytest.mark.parametrize("path", PATHS)
def test_unauthenticated_401(client, path):
    r = client.get(path)
    assert r.status_code == 401, r.text


def test_telemetry_unauthenticated_401(client):
    r = client.post(
        "/symbology/v1/telemetry",
        json={"q": "NQ", "reason_code": "not-supported-yet"},
    )
    assert r.status_code == 401, r.text


def test_eligibility_report_member_403(client):
    r = client.get("/symbology/v1/eligibility-report", cookies=MEMBER)
    assert r.status_code == 403, r.text


def test_eligibility_report_admin_200(client, admin_cookies):
    r = client.get("/symbology/v1/eligibility-report", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["gate"]["min_expirations_per_week"] == 3
    assert body["gate"]["help_copy"] == "short-dated including 0DTE (0–5 DTE)"
    assert body["coach_selects"] == "from measured results only"
    symbols = {row["symbol"] for row in body["rows"]}
    assert symbols == {"SPX", "XSP"}
    for row in body["rows"]:
        assert row["state"] == "COMING"
        assert row["artifact"] is None
        assert row["measured_expirations_per_week"] is None


# --- universe (SYM-1, SYM-2, SYM-4, initial COMING rows) --------------------


def test_universe_typed_groups_no_spy_no_family(client):
    r = _get(client, "/symbology/v1/universe")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["house_preset_id"] == "ts-es-106X"
    assert body["strip_generation_id"] == service.INITIAL_GENERATION_ID
    assert "family" not in str(body.get("groups"))
    roots = [g["root"] for g in body["groups"]]
    assert roots == ["SPX", "XSP", "ES", "MES"]
    spy = [g for g in body["groups"] if g["root"] == "SPY"]
    assert spy == []
    seen_types = set()
    for group in body["groups"]:
        for row in group["rows"]:
            assert row["type"] in service.ROW_TYPES
            seen_types.add(row["type"])
            assert isinstance(row["roles"], list)
            assert row["roles"] == sorted(set(row["roles"]))
            assert row.get("kinds") is None
            if row["type"] in {"contract", "index", "stock"}:
                assert row["state"] == "COMING"
                assert row["state"] != "ACTIVE"
            else:
                assert row["state"] is None
                assert row["may_be_active"] is False
    assert "root" in seen_types
    assert "continuity-alias" in seen_types
    assert "contract" in seen_types
    assert "index" in seen_types


def test_universe_es_aliases_and_long_form(client):
    r = _get(client, "/symbology/v1/universe", roles="price-structure")
    assert r.status_code == 200, r.text
    es = next(g for g in r.json()["groups"] if g["root"] == "ES")
    symbols = [row["symbol"] for row in es["rows"]]
    types = {row["symbol"]: row["type"] for row in es["rows"]}
    assert types["ES"] == "root"
    for tok in ("ES1!", "ES2!", "/ES", "@ES"):
        assert types[tok] == "continuity-alias"
    assert "ESZ2026" in symbols
    assert types["ESZ2026"] == "contract"
    assert "ESZ6" not in symbols
    for row in es["rows"]:
        assert "options" not in row["roles"]
        assert row["has_chains"] is False
        assert row["roles"] == ["price-structure"]


def test_universe_spy_only_when_volume_source(client):
    hidden = _get(client, "/symbology/v1/universe", roles="options,price-structure")
    assert hidden.status_code == 200
    roots = {g["root"] for g in hidden.json()["groups"]}
    assert "SPY" not in roots
    shown = _get(client, "/symbology/v1/universe", roles="volume-source")
    assert shown.status_code == 200, shown.text
    spy = next(g for g in shown.json()["groups"] if g["root"] == "SPY")
    row = spy["rows"][0]
    assert row["type"] == "stock"
    assert row["roles"] == ["volume-source"]
    assert row["member_visible"] is False
    assert row["state"] == "COMING"


def test_universe_options_omits_futures(client):
    r = _get(client, "/symbology/v1/universe", roles="options")
    assert r.status_code == 200
    roots = {g["root"] for g in r.json()["groups"]}
    assert roots == {"SPX", "XSP"}


def test_universe_unknown_role_422(client):
    r = _get(client, "/symbology/v1/universe", roles="tradable")
    assert r.status_code == 422


def test_no_model_kind_active_on_live_rows(client):
    r = _get(client, "/symbology/v1/universe", roles="price-structure,options,volume-source")
    body = r.json()
    for group in body["groups"]:
        for row in group["rows"]:
            assert row.get("state") != "ACTIVE"
            kinds = row.get("kinds")
            if isinstance(kinds, dict):
                assert kinds.get("prints") != "ACTIVE"
                assert kinds.get("model") != "ACTIVE"


# --- resolve: aliases, ambiguous, roots (SYM-AT-1, 8, 11, 14) ---------------


def test_esz6_matches_never_binds(client):
    r = _get(client, "/symbology/v1/resolve", q="ESZ6")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "matches"
    assert body["binding"] is None
    assert "bound_symbol" not in body
    symbols = [m["symbol"] for m in body["matches"]]
    assert "ESZ2026" in symbols
    assert body["strip_generation_id"] == service.INITIAL_GENERATION_ID


@pytest.mark.parametrize("q", ["ES1!", "/ES", "@ES", "es1!", "/es", "@es"])
def test_continuity_alias_binds_dated_long_form(client, q):
    r = _get(client, "/symbology/v1/resolve", q=q)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "binding"
    binding = body["binding"]
    assert binding["type"] == "continuity-alias"
    assert binding["bound_symbol"] == "ESZ2026"
    assert binding["bound_symbol"] != "ESZ6"
    assert binding["root"] == "ES"
    assert body["strip_generation_id"] == service.INITIAL_GENERATION_ID
    assert body["house_preset_id"] == "ts-es-106X"
    assert binding.get("state") is None
    assert binding["may_be_active"] is False


def test_mes_alias_binds_mesz2026(client):
    r = _get(client, "/symbology/v1/resolve", q="MES1!")
    assert r.status_code == 200, r.text
    assert r.json()["binding"]["bound_symbol"] == "MESZ2026"


def test_root_es_lists_does_not_bind(client):
    r = _get(client, "/symbology/v1/resolve", q="ES")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "matches"
    assert body["binding"] is None
    types = {m["type"] for m in body["matches"]}
    assert "contract" in types
    assert "continuity-alias" in types
    symbols = {m["symbol"] for m in body["matches"]}
    assert "ES1!" in symbols
    assert "ESZ2026" in symbols
    assert "ES" not in symbols


def test_long_form_bind_ignores_preset(client):
    r = _get(client, "/symbology/v1/resolve", q="ESZ2026", preset="cme-customary")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "binding"
    assert body["binding"]["type"] == "contract"
    assert body["binding"]["bound_symbol"] == "ESZ2026"
    assert body["preset_applied"] == "ts-es-106X"
    assert body["strip_generation_id"] == service.INITIAL_GENERATION_ID


def test_alias_preset_overlay_does_not_write_generation(client):
    house = _get(client, "/symbology/v1/resolve", q="ES1!")
    overlay = _get(client, "/symbology/v1/resolve", q="ES1!", preset="cme-customary")
    assert overlay.status_code == 200, overlay.text
    assert overlay.json()["strip_generation_id"] == house.json()["strip_generation_id"]
    assert overlay.json()["strip_generation_id"] == service.INITIAL_GENERATION_ID
    assert overlay.json()["preset_applied"] == "cme-customary"
    bound = overlay.json()["binding"]["bound_symbol"]
    assert bound.startswith("ES")
    assert len(bound) == len("ESZ2026")
    assert bound[-4:].isdigit()


def test_named_not_built_preset_refused(client):
    r = _get(client, "/symbology/v1/resolve", q="ES1!", preset="tv-1VO")
    assert r.status_code == 422, r.text
    detail = r.json()["detail"]
    assert detail["code"] == "named-not-built"
    assert detail["preset"] == "tv-1VO"
    assert detail["reason"]["reason_code"] == "needs-the-daily-volume-path"
    assert detail["reason"]["copy"] == "needs the daily volume path"


def test_es_options_role_miss_futures_copy(client):
    r = _get(client, "/symbology/v1/resolve", q="ES", roles="options")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "miss"
    assert body["binding"] is None
    assert body["miss"]["copy"] == "This stack does not carry futures options"


def test_unsupported_real_symbol_miss_never_empty(client):
    r = _get(client, "/symbology/v1/resolve", q="NQ")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "miss"
    assert body["miss"]["reason_code"] == "not-supported-yet"
    assert body["miss"]["copy"]
    assert body["binding"] is None


def test_spy_hidden_from_default_resolve(client):
    r = _get(client, "/symbology/v1/resolve", q="SPY")
    assert r.status_code == 200, r.text
    assert r.json()["type"] == "miss"
    assert r.json()["miss"]["reason_code"] == "not-available-in-this-app"
    shown = _get(client, "/symbology/v1/resolve", q="SPY", roles="volume-source")
    assert shown.status_code == 200
    assert shown.json()["type"] == "binding"
    assert shown.json()["binding"]["bound_symbol"] == "SPY"


def test_dec_without_year_matches(client):
    r = _get(client, "/symbology/v1/resolve", q="dec")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["type"] == "matches"
    assert body["binding"] is None
    symbols = {m["symbol"] for m in body["matches"]}
    assert "ESZ2026" in symbols
    assert "MESZ2026" in symbols


# --- roll catalog (SYM-AT-13) -----------------------------------------------


def test_roll_catalog_tv1vo_named_not_built(client):
    r = _get(client, "/symbology/v1/roll-catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["house_preset_id"] == "ts-es-106X"
    assert body["adjustment"] == "none"
    by_id = {row["id"]: row for row in body["rows"]}
    assert by_id["ts-es-106X"]["default"] is True
    assert by_id["ts-es-106X"]["status"] == "live"
    tv = by_id["tv-1VO"]
    assert tv["status"] == "named-not-built"
    assert tv["applyable"] is False
    assert tv["kind"] == "activity"
    assert tv["reason"]["copy"] == "needs the daily volume path"
    assert by_id["ts-1IN"]["status"] == "named-not-built"
    assert by_id["ts-2VO"]["status"] == "named-not-built"


# --- telemetry --------------------------------------------------------------


def test_telemetry_aggregates_into_eligibility_report(client, admin_cookies):
    r = client.post(
        "/symbology/v1/telemetry",
        json={"q": "nq", "reason_code": "not-supported-yet"},
        cookies=MEMBER,
    )
    assert r.status_code == 200, r.text
    assert r.json()["count"] == 1
    r2 = client.post(
        "/symbology/v1/telemetry",
        json={"q": "NQ", "reason_code": "not-supported-yet"},
        cookies=MEMBER,
    )
    assert r2.json()["count"] == 2
    report = client.get("/symbology/v1/eligibility-report", cookies=admin_cookies)
    assert report.status_code == 200
    tel = report.json()["telemetry"]
    assert {"q": "NQ", "reason_code": "not-supported-yet", "count": 2} in tel


# --- plane fences (SYM-AT-2, 10) — no surface required ----------------------


@pytest.mark.parametrize("key", ["ES1!", "/ES", "@ES", "ES2!", "1!", "ES", "ESZ6"])
def test_alias_as_ingest_key_refused(key):
    with pytest.raises(service.AliasIngestRefused):
        service.assert_plane_key(key)


def test_dated_contract_is_ingest_key():
    assert service.assert_plane_key("ESZ2026") == "ESZ2026"
    assert service.assert_plane_key("SPX") == "SPX"


@pytest.mark.parametrize("mode", ["B_ADJ", "constant", "ratio", "C", "R"])
def test_adjustment_refused(mode):
    with pytest.raises(service.AdjustmentRefused):
        service.assert_adjustment_none(mode)


def test_adjustment_none_ok():
    service.assert_adjustment_none("none")
    service.assert_adjustment_none(None)


# --- pair badge (SYM-AT-4, 12) ----------------------------------------------


def test_pair_badge_uses_front_contract_not_root_and_stays_dark():
    badge = service.pair_badge(["ES", "SPX"])
    symbols = [e["symbol"] for e in badge["ends"]]
    types = [e["type"] for e in badge["ends"]]
    assert "ES" not in symbols
    assert "ESZ2026" in symbols
    assert "SPX" in symbols
    assert "contract" in types
    assert "index" in types
    assert badge["active"] is False
    assert badge["state"] == "COMING"
    assert badge["worst_end"]


# --- STALE vs COMING (SYM-AT-7); no model ACTIVE ----------------------------


def test_artifact_max_age_renders_stale():
    assert service.row_state_from_artifact(None, now_iso="2026-09-19") == "COMING"
    stale = service.row_state_from_artifact(
        {
            "symbol": "ESZ2026",
            "type": "contract",
            "kind": "aggs",
            "source": "test",
            "as_of": "2026-01-01",
            "tests_run": ["ping"],
            "results": {"ok": True},
            "max_age": 30,
        },
        now_iso="2026-09-19",
    )
    assert stale == "STALE"
    prints = service.row_state_from_artifact(
        {
            "symbol": "ESZ2026",
            "kind": "prints",
            "as_of": "2026-09-19",
            "max_age": 7,
        },
        now_iso="2026-09-19",
    )
    assert prints == "COMING"


# --- strip write clock (SYM-AT-5, 9) ----------------------------------------


def test_rth_strip_write_refused_generation_unchanged():
    before = service.current_strip().generation_id
    with pytest.raises(service.StripWriteRefused):
        service.write_strip_after_close(as_of=date(2026, 12, 10), session_open=True)
    assert service.current_strip().generation_id == before
    assert service.resolve("ES1!")["binding"]["bound_symbol"] == "ESZ2026"


def test_post_close_write_advances_front_and_generation():
    before = service.current_strip()
    assert before.front_by_root["ES"] == "ESZ2026"
    new = service.write_strip_after_close(as_of=date(2026, 12, 10), session_open=False)
    assert new.generation_id != before.generation_id
    assert new.generation_id.startswith("sg-20261210-")
    bound = service.resolve("ES1!")
    assert bound["strip_generation_id"] == new.generation_id
    assert bound["binding"]["bound_symbol"] == "ESH2027"


# --- calendar SoT (server, not client) --------------------------------------


def test_third_friday_sep_and_dec_2026():
    assert catalog.third_friday(2026, 9) == date(2026, 9, 18)
    assert catalog.third_friday(2026, 12) == date(2026, 12, 18)
    assert catalog.trading_days_before(date(2026, 12, 18), 6) == date(2026, 12, 10)
