"""Trade Log import / export routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

import db
import trade_log_catalog as cat
from guards import require_session
from routes.trade_log.common import (
    _account_row,
    _dec,
    _ensure_default_account,
    _get_account,
    _insert_legs,
    _load_legs_for_trades,
    _maybe_set_account_venue,
    _parse_exec_at,
    _process_fields,
    _require_tool_member,
    _storage_identity_id,
    _trade_row,
)

router = APIRouter(tags=["trade-log"])

@router.get("/api/me/trade-log/adapters")
def list_adapters(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    return {"adapters": tio.ADAPTERS}


@router.get("/api/me/trade-log/export")
def export_trades(
    request: Request,
    account_id: int | None = None,
    format: str = "canonical",
) -> Any:
    """Export trades for download (data-bearing export capability).

    ``format``:
      - ``canonical`` / ``json`` / ``fattail`` — FatTail ``.tradlog.json``
      - ``native`` — account venue's native format (ToS CSV if thinkorswim;
        canonical if fattail / unset)
      - ``thinkorswim`` / ``tos`` — ToS Account Trade History CSV
      - ``csv`` — flat generic legs CSV

    Prefer a single ``account_id`` for ``native`` so venue is unambiguous.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="export")
    import trade_log_io as tio
    from fastapi.responses import JSONResponse, PlainTextResponse, Response

    fmt_in = (format or "canonical").lower()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if account_id is not None:
                accts = [_get_account(cur, iid, account_id)]
            else:
                cur.execute(
                    """SELECT * FROM member_trade_log_accounts
                       WHERE identity_id = %s ORDER BY sort_order, id""",
                    (iid,),
                )
                accts = cur.fetchall()
            by_acct: dict[int, list] = {}
            flat: list = []
            for a in accts:
                aid = int(a["id"])
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       WHERE identity_id = %s AND account_id = %s
                       ORDER BY exec_at ASC, id ASC""",
                    (iid, aid),
                )
                rows = cur.fetchall()
                legs_by_trade = _load_legs_for_trades(
                    cur, [int(r["id"]) for r in rows], iid
                )
                trades = []
                for r in rows:
                    t = _trade_row(r, legs_by_trade.get(int(r["id"]), []))
                    trades.append(t)
                    flat.append(t)
                by_acct[aid] = trades
            accounts = [_account_row(a) for a in accts]

    # Resolve serializer: native uses first account's venue
    primary_broker = accounts[0]["broker"] if accounts else "fattail"
    if len(accounts) > 1 and fmt_in == "native":
        # Multi-account native is ambiguous — use canonical
        resolved = "canonical"
    else:
        resolved = tio.resolve_export_format(fmt_in, primary_broker)

    label = (accounts[0]["label"] if accounts else "account").replace(" ", "-")
    slug = "".join(c for c in label.lower() if c.isalnum() or c in "-_")[:40] or "account"

    if resolved == "thinkorswim":
        body = tio.export_thinkorswim(flat, account_label=accounts[0]["label"] if accounts else "")
        return Response(
            content=body,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}-tos-trade-history.csv"'
            },
        )
    if resolved == "csv_generic":
        return PlainTextResponse(
            tio.export_csv_flat(flat),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{slug}-legs.csv"'
            },
        )
    # canonical FatTail JSON
    doc = tio.export_canonical(accounts, by_acct)
    # Ensure export marks fattail when user asked for canonical
    if fmt_in in ("canonical", "json", "fattail", "tradlog"):
        for acct in doc.get("accounts") or []:
            # Keep real broker on account metadata; format is always canonical
            pass
    return JSONResponse(
        doc,
        headers={
            "Content-Disposition": f'attachment; filename="{slug}.tradlog.json"'
        },
    )


@router.post("/api/me/trade-log/import/detect")
async def import_detect(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    body = await request.json()
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    detections = tio.detect(text)
    # Filename hint (client may send only a head sample of a large JSON file)
    fname = (body.get("filename") or "").lower()
    if fname.endswith(".tradlog.json") or (
        fname.endswith(".json") and "fattail" in fname
    ):
        detections = [{"id": "native", "confidence": 0.999}] + [
            d for d in detections if d["id"] != "native"
        ]
        detections.sort(key=lambda x: -x["confidence"])
    return {"detections": detections, "sample_len": len(text)}


@router.post("/api/me/trade-log/import/preview")
async def import_preview(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio

    body = await request.json()
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    adapter = (body.get("adapter") or "auto").lower()
    result = tio.parse("" if adapter == "auto" else adapter, text)
    # Cap preview size
    trades = result.get("trades") or []
    return {
        "adapter": result.get("adapter"),
        "trade_count": len(trades),
        "trades": trades[:50],
        "truncated": len(trades) > 50,
        "warnings": result.get("warnings") or [],
        "errors": result.get("errors") or [],
    }


@router.post("/api/me/trade-log/import/commit")
async def import_commit(request: Request) -> dict:
    """Parse and write trades into account_id (required). Idempotent on external_order_id.

    Campaign stamp (Amendment Top-Level Account):
      - practice_campaign_id: int → stamp that deliberate campaign (not furniture)
      - omit / null → **undirected** (null stamp) — lawful rest
      Memory is not consulted or updated by bulk import.
    """
    claims = require_session(request)
    _require_tool_member(claims)
    import trade_log_io as tio
    import practice_spine_domain as psd
    from practice_spine_domain import PracticeSpineError

    body = await request.json()
    account_id = body.get("account_id")
    text = body.get("text") or body.get("content") or ""
    if not text and body.get("base64"):
        import base64

        text = base64.b64decode(body["base64"]).decode("utf-8", errors="replace")
    if not text:
        raise HTTPException(status_code=422, detail="text or base64 content required")
    adapter = (body.get("adapter") or "auto").lower()
    result = tio.parse("" if adapter == "auto" else adapter, text)
    if result.get("errors"):
        raise HTTPException(
            status_code=422,
            detail={"message": "parse failed", "errors": result["errors"]},
        )
    trades = result.get("trades") or []
    adapter_id = result.get("adapter") or adapter or "import"
    # Campaign target: explicit deliberate id only; else undirected
    raw_camp = body.get("practice_campaign_id")
    created = 0
    skipped = 0
    camp_id: int | None = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if account_id is None:
                acct = _ensure_default_account(cur, iid)
                account_id = int(acct["id"])
            else:
                acct = _get_account(cur, iid, int(account_id))
                account_id = int(account_id)
            try:
                if raw_camp not in (None, ""):
                    camp_id = int(raw_camp)
                    psd.assert_campaign_owned(cur, iid, camp_id)
                    cur.execute(
                        """SELECT is_ledger FROM member_practice_campaigns
                           WHERE id = %s AND identity_id = %s""",
                        (camp_id, iid),
                    )
                    crow = cur.fetchone() or {}
                    if bool(int(crow.get("is_ledger") or 0)):
                        raise PracticeSpineError(
                            422,
                            "Cannot stamp import to furniture ledger — use a deliberate campaign or none",
                        )
                else:
                    camp_id = None  # undirected import
            except PracticeSpineError as e:
                raise HTTPException(status_code=e.code, detail=e.detail) from e
            except (TypeError, ValueError) as e:
                raise HTTPException(
                    status_code=422, detail="practice_campaign_id must be an integer"
                ) from e
            # Books stay FatTail-canonical. Import adapter is per-trade provenance
            # (external_adapter), never the account brand. Optional body.broker only
            # for explicit member choice (e.g. sim book); defaults to fattail.
            venue = cat.CANONICAL_BOOK_VENUE
            if body.get("broker"):
                venue = str(body["broker"]).strip()
            _maybe_set_account_venue(
                cur,
                iid,
                account_id,
                broker=venue,
                broker_label=body.get("broker_label"),
                only_if_unset=True,
            )
            for t in trades:
                ext = t.get("external_order_id") or None
                if ext:
                    cur.execute(
                        """SELECT id FROM member_trade_log_trades
                           WHERE identity_id = %s AND account_id = %s
                             AND external_adapter = %s AND external_order_id = %s""",
                        (iid, account_id, adapter_id, ext),
                    )
                    if cur.fetchone():
                        skipped += 1
                        continue
                proc = {
                    "setup_md": t.get("setup_md") or "",
                    "plan_md": t.get("plan_md") or "",
                    "rules_md": t.get("rules_md") or "",
                    "adherence": t.get("adherence")
                    if t.get("adherence") in cat.ADHERENCE
                    else "unknown",
                    "deviation_md": t.get("deviation_md") or "",
                    "lesson_md": t.get("lesson_md") or "",
                    "pnl_amount": t.get("pnl_amount"),
                }
                exec_at = _parse_exec_at(t.get("exec_at"))
                strategy = t.get("strategy") or "CUSTOM"
                from trade_log_domain.strategy_infer import refine_strategy_from_legs

                legs_list = t.get("legs") if isinstance(t.get("legs"), list) else []
                strategy = refine_strategy_from_legs(str(strategy), legs_list)
                if strategy not in cat.STRATEGY_CODES:
                    strategy = "CUSTOM"
                net_price = _dec(t.get("net_price"))
                net_side = t.get("net_side")
                if net_side and net_side not in cat.NET_SIDES:
                    net_side = None
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, asset_class, strategy,
                          order_type, net_price, net_side, setup_md, plan_md, rules_md,
                          adherence, deviation_md, lesson_md, pnl_amount,
                          external_adapter, external_order_id, entry_source,
                          practice_campaign_id)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        iid,
                        account_id,
                        exec_at,
                        (t.get("asset_class") or "equity_option").lower(),
                        strategy,
                        (t.get("order_type") or "LMT")[:32],
                        net_price,
                        net_side,
                        proc["setup_md"],
                        proc["plan_md"],
                        proc["rules_md"],
                        proc["adherence"],
                        proc["deviation_md"],
                        proc["lesson_md"],
                        proc["pnl_amount"],
                        adapter_id,
                        ext,
                        "import",
                        camp_id,
                    ),
                )
                tid = int(cur.lastrowid)
                _insert_legs(cur, tid, iid, account_id, t.get("legs") or [])
                created += 1
    return {
        "ok": True,
        "adapter": adapter_id,
        "account_id": account_id,
        "practice_campaign_id": camp_id,
        "created": created,
        "skipped": skipped,
        "warnings": result.get("warnings") or [],
    }
