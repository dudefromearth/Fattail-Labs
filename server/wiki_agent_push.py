"""S7 admin push — artifact + intent; infer envelope; L12 decline; git+board (SC-2)."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone

import wiki_agent_git
import wiki_agent_schema as schema
import wiki_agent_store as store
import wiki_store
from wiki_agent_discharge import OSCAR, PROFIT_RE, _guidelines, _board_failed_partial

THIN_MIN_WORDS = 40
THIN_MIN_CHARS = 120


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def _slug(source_id: str) -> str:
    raw = f"sc2-{source_id}".lower()
    return re.sub(r"[^a-z0-9-]+", "-", raw).strip("-")[:80]


def is_thin(artifact: str) -> bool:
    text = (artifact or "").strip()
    if len(text) < THIN_MIN_CHARS:
        return True
    return len(re.findall(r"\S+", text)) < THIN_MIN_WORDS


def infer_title(artifact: str) -> str:
    for line in (artifact or "").splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("#"):
            return s.lstrip("#").strip()[:200]
        return s[:200]
    return ""


def content_hash(body: str) -> str:
    return hashlib.sha256((body or "").encode("utf-8")).hexdigest()


def infer_envelope(*, artifact: str, intent: str, origin_owner: str) -> dict:
    body = (artifact or "").strip()
    digest = content_hash(body)
    title = infer_title(body)
    source_id = f"admin-push-{digest[:16]}"
    return {
        "source_kind": "admin_push",
        "source_id": source_id,
        "title": title,
        "body": body,
        "body_format": "markdown",
        "intent": (intent or "").strip(),
        "origin_ref": f"admin-push:{source_id}",
        "origin_owner": origin_owner,
        "change_type": "created",
        "submitted_at": _now_iso(),
        "content_hash": digest,
        "acquired_by": "push",
        "contract_version": "0.1.4",
    }


def _ledger(
    *,
    envelope: dict,
    principal: str,
    status: str,
    reason: str = "",
) -> dict:
    row = store.insert_contract(
        envelope={
            "contract_version": "0.1.4",
            "kind": "source_contract",
            "source": envelope.get("origin_owner") or "",
            "refs": [],
            "payload": envelope,
        },
        principal=principal,
        status=status,
        reject_reason=reason if status == "rejected" else "",
        failure_reason=reason if status == "failed-partial" else "",
    )
    out = {
        "contract_id": row["contract_id"],
        "status": status,
        "page_path": "",
        "linkages": [],
        "kind": "source_contract",
        "payload": envelope,
        "watermark": None,
        "retries": 0,
    }
    if status != "accepted":
        out["reason"] = reason
    return out, row


def _compose_markdown(env: dict) -> str:
    title = str(env.get("title") or "").replace('"', "'")
    origin = str(env.get("origin_ref") or "")
    updated = datetime.now(timezone.utc).date().isoformat()
    body = str(env.get("body") or "")
    return (
        f"---\n"
        f'title: "{title}"\n'
        f"kind: topic\n"
        f"status: draft\n"
        f"sources: [{origin}]\n"
        f"updated: {updated}\n"
        f"compiled_by: oscar\n"
        f"source_kind: admin_push\n"
        f"---\n\n"
        f"{body.rstrip()}\n"
    )


def push_handoff(*, artifact: str, intent: str, origin_owner: str) -> dict:
    """One-shot delivery. No draft store, no retry loop, no schema form."""
    missing: list[str] = []
    if not (artifact or "").strip():
        missing.append("body")
    if not (intent or "").strip():
        missing.append("intent")
    if missing:
        stub = {
            "source_kind": "admin_push",
            "intent": (intent or "").strip(),
            "acquired_by": "push",
        }
        out, _ = _ledger(
            envelope=stub,
            principal=origin_owner,
            status="failed-partial",
            reason="incomplete_required_set:" + ",".join(missing),
        )
        return out

    env = infer_envelope(
        artifact=artifact, intent=intent, origin_owner=origin_owner
    )

    if is_thin(env["body"]):
        out, _ = _ledger(
            envelope=env,
            principal=origin_owner,
            status="failed-partial",
            reason="insufficient_substance:too_thin",
        )
        return out

    if PROFIT_RE.search(env["body"] or ""):
        out, _ = _ledger(
            envelope=env,
            principal=origin_owner,
            status="failed-partial",
            reason="profit_claim",
        )
        return out

    if not env["title"]:
        out, _ = _ledger(
            envelope=env,
            principal=origin_owner,
            status="failed-partial",
            reason="incomplete_required_set:title",
        )
        return out

    parsed = schema.parse_source_envelope(env)
    out, row = _ledger(
        envelope=parsed,
        principal=origin_owner,
        status="accepted",
    )

    _guidelines()  # Hotel law: file present, fail-loud
    rel = f"wiki/topics/{_slug(parsed['source_id'])}.md"
    text = _compose_markdown(parsed)
    root = wiki_store.wiki_root()
    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")
    try:
        sha = wiki_agent_git.commit_paths(
            root, contract_id=row["contract_id"], relative_paths=[rel]
        )
    except Exception as exc:
        dest.unlink(missing_ok=True)
        card = _board_failed_partial(row["contract_id"], rel, str(exc))
        failed = store.mark_failed(
            row["contract_id"], f"git:{exc}", board_card_ids=[card]
        )
        return {
            "contract_id": failed["contract_id"],
            "status": "failed-partial",
            "page_path": "",
            "linkages": [],
            "reason": failed.get("failure_reason") or str(exc),
            "payload": parsed,
            "watermark": None,
            "retries": 0,
        }

    mark = store.upsert_watermark(
        source_kind=parsed["source_kind"],
        source_id=parsed["source_id"],
        content_hash=parsed["content_hash"],
        contract_id=row["contract_id"],
    )
    out["watermark"] = {
        "source_kind": mark["source_kind"],
        "source_id": mark["source_id"],
        "content_hash": mark["content_hash"],
        "seen_at": mark["seen_at"],
    }

    import board

    item = board.create_item(
        OSCAR,
        title=f"Wiki draft {rel}",
        intent_md=(
            f"contract `{row['contract_id']}`\n"
            f"S7 handoff. Draft on the board — you still approve.\n"
            f"intent: {parsed.get('intent')}\n"
        ),
        acceptance_md="Hotel: no invention, no profit claims. Approve to publish in git.",
        product_line="wiki",
    )
    board.transition(
        int(item["id"]),
        OSCAR,
        to_status="awaiting_approval",
        reason="sc2 push discharge",
    )
    store.record_commits(row["contract_id"], [sha])
    store.record_board_ids(row["contract_id"], [int(item["id"])])
    out["page_path"] = rel
    out["status"] = "accepted"
    return out
