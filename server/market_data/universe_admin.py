"""Admin CRUD for market_symbol_universe — single SoR for Practice + Lab marks.

Create / enable validates symbol is available from Massive (or proxy path).
"""

from __future__ import annotations

from typing import Any

from market_data.live_stream import _fetch_for_row
from market_data.massive_client import MassiveClient, MassiveClientError


class UniverseError(Exception):
    def __init__(self, code: int, detail: str, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


_KINDS = frozenset({"equity", "etf", "index", "future", "crypto", "other"})
_ROLES = frozenset({"tradeable", "reference"})


def _norm_symbol(raw: Any) -> str:
    s = str(raw or "").strip().upper()
    if not s:
        raise UniverseError(422, "symbol is required")
    if len(s) > 32:
        raise UniverseError(422, "symbol max 32 characters")
    # Allow I:SPX style feed on feed_symbol; product symbol is alnum + . -
    for ch in s:
        if not (ch.isalnum() or ch in ".-_"):
            raise UniverseError(422, f"invalid symbol character in {s!r}")
    return s


def _opt_sym(raw: Any) -> str | None:
    if raw is None or raw == "":
        return None
    s = str(raw).strip().upper()
    return s or None


def serialize_row(r: dict) -> dict:
    return {
        "symbol": r["symbol"],
        "feed_symbol": r.get("feed_symbol"),
        "proxy_symbol": r.get("proxy_symbol"),
        "kind": r.get("kind") or "equity",
        "role": r.get("role") or "tradeable",
        "enabled": bool(int(r["enabled"])) if r.get("enabled") is not None else True,
        "sort_order": int(r.get("sort_order") or 0),
        "note": r.get("note") or "",
        "options_cadence": r.get("options_cadence") or "",
    }


def list_all(cur, *, enabled_only: bool = False) -> list[dict]:
    if enabled_only:
        cur.execute(
            """SELECT * FROM market_symbol_universe
               WHERE enabled = 1
               ORDER BY sort_order ASC, symbol ASC"""
        )
    else:
        cur.execute(
            """SELECT * FROM market_symbol_universe
               ORDER BY sort_order ASC, symbol ASC"""
        )
    return [serialize_row(r) for r in (cur.fetchall() or [])]


def get_one(cur, symbol: str) -> dict | None:
    symbol = _norm_symbol(symbol)
    cur.execute(
        "SELECT * FROM market_symbol_universe WHERE symbol = %s",
        (symbol,),
    )
    r = cur.fetchone()
    return serialize_row(r) if r else None


def validate_with_massive(
    *,
    symbol: str,
    feed_symbol: str | None = None,
    proxy_symbol: str | None = None,
    kind: str = "equity",
) -> dict:
    """Prove Massive can return a mid for this universe row (or proxy).

    Returns validation payload with mid + feed_used. Raises UniverseError on fail.
    """
    row = {
        "symbol": _norm_symbol(symbol),
        "feed_symbol": _opt_sym(feed_symbol),
        "proxy_symbol": _opt_sym(proxy_symbol),
        "kind": kind,
    }
    try:
        client = MassiveClient()
    except MassiveClientError as exc:
        raise UniverseError(
            503,
            f"Massive client not configured: {exc}",
        ) from exc
    try:
        m = _fetch_for_row(client, row)
    except MassiveClientError as exc:
        raise UniverseError(
            422,
            f"Massive cannot price {row['symbol']}: {exc}",
            extra={
                "symbol": row["symbol"],
                "feed_symbol": row["feed_symbol"],
                "proxy_symbol": row["proxy_symbol"],
                "provider": "massive",
            },
        ) from exc
    return {
        "ok": True,
        "symbol": row["symbol"],
        "mid": m.get("mid"),
        "feed_used": m.get("feed_used"),
        "via_proxy": bool(m.get("via_proxy")),
        "provider": "massive",
    }


def create(
    cur,
    *,
    symbol: str,
    kind: str = "equity",
    feed_symbol: str | None = None,
    proxy_symbol: str | None = None,
    role: str = "tradeable",
    enabled: bool = True,
    sort_order: int = 0,
    note: str | None = None,
    options_cadence: str | None = None,
    validate: bool = True,
) -> dict:
    symbol = _norm_symbol(symbol)
    kind = str(kind or "equity").lower()
    if kind not in _KINDS:
        raise UniverseError(422, f"kind must be one of {sorted(_KINDS)}")
    role = str(role or "tradeable").lower()
    if role not in _ROLES:
        raise UniverseError(422, f"role must be one of {sorted(_ROLES)}")
    feed_symbol = _opt_sym(feed_symbol)
    proxy_symbol = _opt_sym(proxy_symbol)

    cur.execute(
        "SELECT symbol FROM market_symbol_universe WHERE symbol = %s",
        (symbol,),
    )
    if cur.fetchone():
        raise UniverseError(409, f"symbol {symbol} already exists")

    validation = None
    if validate and enabled:
        validation = validate_with_massive(
            symbol=symbol,
            feed_symbol=feed_symbol,
            proxy_symbol=proxy_symbol,
            kind=kind,
        )

    cur.execute(
        """INSERT INTO market_symbol_universe
             (symbol, feed_symbol, proxy_symbol, kind, role, enabled,
              sort_order, note, options_cadence)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            symbol,
            feed_symbol,
            proxy_symbol,
            kind,
            role,
            1 if enabled else 0,
            int(sort_order or 0),
            (note or "").strip() or None,
            (options_cadence or "").strip() or None,
        ),
    )
    out = get_one(cur, symbol)
    assert out is not None
    if validation:
        out["validation"] = validation
    return out


def patch(
    cur,
    symbol: str,
    body: dict,
    *,
    validate: bool = True,
) -> dict:
    symbol = _norm_symbol(symbol)
    cur.execute(
        "SELECT * FROM market_symbol_universe WHERE symbol = %s",
        (symbol,),
    )
    row = cur.fetchone()
    if not row:
        raise UniverseError(404, f"symbol {symbol} not found")

    feed = (
        _opt_sym(body["feed_symbol"])
        if "feed_symbol" in body
        else row.get("feed_symbol")
    )
    proxy = (
        _opt_sym(body["proxy_symbol"])
        if "proxy_symbol" in body
        else row.get("proxy_symbol")
    )
    kind = str(body.get("kind") or row.get("kind") or "equity").lower()
    if kind not in _KINDS:
        raise UniverseError(422, f"kind must be one of {sorted(_KINDS)}")
    role = str(body.get("role") or row.get("role") or "tradeable").lower()
    if role not in _ROLES:
        raise UniverseError(422, f"role must be one of {sorted(_ROLES)}")
    if "enabled" in body:
        enabled = bool(body["enabled"])
    else:
        enabled = bool(int(row.get("enabled") or 0))
    sort_order = (
        int(body["sort_order"])
        if body.get("sort_order") is not None
        else int(row.get("sort_order") or 0)
    )
    note = body["note"] if "note" in body else row.get("note")
    cadence = (
        body["options_cadence"]
        if "options_cadence" in body
        else row.get("options_cadence")
    )

    validation = None
    # Re-validate when enabling or changing feed/proxy
    needs_validate = validate and enabled and (
        "enabled" in body
        or "feed_symbol" in body
        or "proxy_symbol" in body
        or "kind" in body
    )
    if needs_validate:
        validation = validate_with_massive(
            symbol=symbol,
            feed_symbol=feed,
            proxy_symbol=proxy,
            kind=kind,
        )

    cur.execute(
        """UPDATE market_symbol_universe
           SET feed_symbol = %s,
               proxy_symbol = %s,
               kind = %s,
               role = %s,
               enabled = %s,
               sort_order = %s,
               note = %s,
               options_cadence = %s
           WHERE symbol = %s""",
        (
            feed,
            proxy,
            kind,
            role,
            1 if enabled else 0,
            sort_order,
            (str(note).strip() if note is not None else None) or None,
            (str(cadence).strip() if cadence is not None else None) or None,
            symbol,
        ),
    )
    out = get_one(cur, symbol)
    assert out is not None
    if validation:
        out["validation"] = validation
    return out


def delete(cur, symbol: str) -> None:
    symbol = _norm_symbol(symbol)
    cur.execute(
        "DELETE FROM market_symbol_universe WHERE symbol = %s",
        (symbol,),
    )
    if cur.rowcount == 0:
        raise UniverseError(404, f"symbol {symbol} not found")
    # Leave market_live_marks row if any — harmless stale; stream stops updating
