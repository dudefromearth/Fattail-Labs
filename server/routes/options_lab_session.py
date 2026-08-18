"""Options Lab session-note — T Ortho process note (positions, not strategies)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

from ai import complete
from ai.types import AiConfigError, AiError, AiProviderError
from guards import require_session
from labs_member_ai_ethos import compose_member_system_prompt

router = APIRouter(tags=["options-lab"])

SURFACE_ROLE = """You write a 2–3 sentence session note for a member looking at
their OPTIONS POSITIONS on a live underlier tape.

Rules:
- Call them positions. Never call a position a strategy.
- Process only: what the tape and the book's mark are doing right now.
- Never forecast P&L, never promise profit, never tell them to trade.
- Mention they can hide, show, or add a position in the Position List.
- Plain language. No slogans. No profit claims.
"""

_PROFIT_CLAIM = (
    "guaranteed profit",
    "you will make",
    "you will profit",
    "easy money",
    "can't lose",
    "cannot lose",
    "will print",
)


def local_session_note(payload: dict[str, Any]) -> str:
    phase = str(payload.get("phase") or "").strip().lower()
    tape = (
        "Premarket — yesterday’s regular session is on the tape so the day is already readable."
        if phase == "pre"
        else "Regular session — the chart starts at this morning’s cash open."
    )
    names: list[str] = []
    for raw in payload.get("positions") or []:
        if not isinstance(raw, dict):
            continue
        name = str(raw.get("label") or raw.get("notation") or "").strip()
        if name:
            names.append(name)
        if len(names) >= 4:
            break
    book = (
        "No visible position on this symbol yet. Add or change one in Analyzer; the book stays yours."
        if not names
        else f"On the book: {' · '.join(names)}. Hide, show, or add a position any time."
    )
    mid = payload.get("lastMid")
    mid_bit = ""
    if isinstance(mid, (int, float)) and mid == mid:
        mid_bit = f" Live mid {mid}."
    pnl = payload.get("bookPnl")
    pnl_bit = ""
    if isinstance(pnl, (int, float)) and pnl == pnl:
        sign = "+" if pnl >= 0 else ""
        pnl_bit = f" Current book mark {sign}{pnl:.2f} (a mark, not a forecast)."
    state = str(payload.get("bookState") or "").strip()
    state_bit = f" State: {state}." if state else ""
    return f"{tape}{mid_bit}{pnl_bit}{state_bit} {book}".replace("  ", " ").strip()


def _sanitize_model_text(text: str) -> str | None:
    body = (text or "").strip()
    if not body:
        return None
    low = body.lower()
    if any(p in low for p in _PROFIT_CLAIM):
        return None
    return body


def _try_model_note(payload: dict[str, Any]) -> str | None:
    symbol = str(payload.get("symbol") or "").strip().upper() or "the underlier"
    local = local_session_note(payload)
    user = (
        f"Symbol={symbol}. Phase={payload.get('phase') or ''}.\n"
        f"Positions={payload.get('positions') or []}.\n"
        f"Last mid={payload.get('lastMid')}. Book mark={payload.get('bookPnl')}. "
        f"State={payload.get('bookState')}.\n"
        f"Local note for facts (do not invent different numbers): {local}"
    )
    result = complete(
        [
            {"role": "system", "content": compose_member_system_prompt(SURFACE_ROLE)},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        max_tokens=220,
    )
    return _sanitize_model_text(result.text or "")


@router.post("/api/me/options-lab/session-note")
async def session_note(request: Request) -> dict:
    require_session(request)
    try:
        payload = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    local = local_session_note(payload)
    try:
        model = _try_model_note(payload)
    except (AiConfigError, AiError, AiProviderError):
        model = None
    except Exception:  # noqa: BLE001 — never break the egg on a model miss
        model = None

    if model:
        return {"text": model, "source": "model"}
    return {"text": local, "source": "local"}
