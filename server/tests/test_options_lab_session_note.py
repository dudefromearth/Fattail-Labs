"""T Ortho session-note — positions language + local fallback."""

from __future__ import annotations

from ai.types import AiConfigError, CompletionResult
from routes.options_lab_session import local_session_note
from tests.conftest import cookie_for


def test_local_session_note_uses_position_not_strategy():
    text = local_session_note(
        {
            "symbol": "SPY",
            "phase": "rth",
            "positions": [
                {"label": "SPY short put vertical", "notation": "-1 500P / +1 490P"}
            ],
            "lastMid": 640.12,
            "bookPnl": -12.5,
            "bookState": None,
        }
    )
    assert "position" in text.lower()
    assert "strateg" not in text.lower()
    assert "Hide, show, or add a position" in text
    assert "short put vertical" in text
    assert "not a forecast" in text


def test_local_session_note_empty_book():
    text = local_session_note(
        {
            "symbol": "QQQ",
            "phase": "pre",
            "positions": [],
            "lastMid": None,
            "bookPnl": None,
        }
    )
    assert "No visible position" in text
    assert "Premarket" in text
    assert "strateg" not in text.lower()


def test_session_note_requires_session(client):
    r = client.post("/api/me/options-lab/session-note", json={"symbol": "SPY"})
    assert r.status_code == 401


def test_session_note_falls_back_local_when_model_unavailable(client, monkeypatch):
    def boom(*_a, **_k):
        raise AiConfigError("XAI_API_KEY is not set")

    monkeypatch.setattr("routes.options_lab_session.complete", boom)
    cookies = cookie_for("navigator")
    r = client.post(
        "/api/me/options-lab/session-note",
        cookies=cookies,
        json={
            "symbol": "SPY",
            "phase": "rth",
            "positions": [{"label": "SPY vertical", "notation": "500/490P"}],
            "lastMid": 640.0,
            "bookPnl": 1.25,
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "local"
    assert "position" in body["text"].lower()
    assert "strateg" not in body["text"].lower()
    assert "SPY vertical" in body["text"]


def test_session_note_uses_model_when_clean(client, monkeypatch):
    monkeypatch.setattr(
        "routes.options_lab_session.complete",
        lambda *_a, **_k: CompletionResult(
            text="SPY is on the tape. Hide, show, or add a position in the Position List.",
            provider="xai",
            model="grok-4.5",
            usage={},
        ),
    )
    r = client.post(
        "/api/me/options-lab/session-note",
        cookies=cookie_for("navigator"),
        json={"symbol": "SPY", "phase": "rth", "positions": []},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "model"
    assert "position" in body["text"].lower()
    assert "Position List" in body["text"]


def test_session_note_rejects_profit_claim_model(client, monkeypatch):
    monkeypatch.setattr(
        "routes.options_lab_session.complete",
        lambda *_a, **_k: CompletionResult(
            text="You will make guaranteed profit on this.",
            provider="xai",
            model="grok-4.5",
            usage={},
        ),
    )
    r = client.post(
        "/api/me/options-lab/session-note",
        cookies=cookie_for("navigator"),
        json={"symbol": "SPY", "phase": "rth", "positions": []},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "local"
    assert "guaranteed profit" not in body["text"].lower()
