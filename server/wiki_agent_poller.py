"""Wiki-side change-detection pollers (OD-5). GET-only against canonical catalogs."""

from __future__ import annotations

from typing import Callable

import wiki_agent_pointers as pointers
import wiki_agent_store as store
from wiki_agent_http import GetOnlyClient, WikiAgentHttpError

GetJson = Callable[[str], dict | list]


def poll_courseware(client: GetOnlyClient, *, list_url: str = "/api/courses") -> list[dict]:
    data = client.get(list_url)
    courses = data.get("courses") if isinstance(data, dict) else data
    if not isinstance(courses, list):
        raise WikiAgentHttpError("course catalog must be a list")
    seen: set[tuple[str, str]] = set()
    events: list[dict] = []
    for c in courses:
        if not isinstance(c, dict):
            continue
        slug = str(c.get("slug") or "").strip()
        cid = str(c.get("id") or slug)
        if not slug:
            continue
        detail_url = f"{list_url.rstrip('/')}/{slug}"
        detail = client.get(detail_url)
        if not isinstance(detail, dict):
            raise WikiAgentHttpError("course detail must be an object")
        url = f"/course/{slug}"
        change = pointers.upsert(
            source="courseware",
            ref_kind="course",
            ref_id=cid,
            canonical_url=url,
            payload=detail,
        )
        seen.add(("course", cid))
        if change != "unchanged":
            events.append(
                _emit(
                    source="courseware",
                    change=change,
                    entity={
                        "kind": "course",
                        "id": cid,
                        "canonical_url": url,
                    },
                    summary=f"Course {slug} {change}",
                    pointer=detail_url,
                )
            )
    prior = pointers.list_ids("courseware")
    for kind, rid in prior - seen:
        row = pointers.get("courseware", kind, rid)
        url = (row or {}).get("canonical_url") or f"/course/{rid}"
        events.append(
            _emit(
                source="courseware",
                change="retired",
                entity={"kind": kind, "id": rid, "canonical_url": url},
                summary=f"Course {rid} retired",
                pointer=url,
            )
        )
        pointers.delete("courseware", kind, rid)
    return events


def poll_help(client: GetOnlyClient, *, list_url: str) -> list[dict]:
    if not list_url:
        raise WikiAgentHttpError("help catalog url required")
    data = client.get(list_url)
    articles = data.get("articles") if isinstance(data, dict) else data
    if not isinstance(articles, list):
        raise WikiAgentHttpError("help catalog must be a list")
    seen: set[tuple[str, str]] = set()
    events: list[dict] = []
    for a in articles:
        if not isinstance(a, dict):
            continue
        aid = str(a.get("id") or "").strip()
        if not aid:
            continue
        url = str(a.get("canonical_url") or f"/help/{aid}")
        change = pointers.upsert(
            source="help",
            ref_kind="help_article",
            ref_id=aid,
            canonical_url=url,
            payload=a,
        )
        seen.add(("help_article", aid))
        if change != "unchanged":
            events.append(
                _emit(
                    source="help",
                    change=change,
                    entity={"kind": "help_article", "id": aid, "canonical_url": url},
                    summary=f"Help article {aid} {change}",
                    pointer=url,
                )
            )
    prior = pointers.list_ids("help")
    for kind, rid in prior - seen:
        row = pointers.get("help", kind, rid)
        url = (row or {}).get("canonical_url") or f"/help/{rid}"
        events.append(
            _emit(
                source="help",
                change="retired",
                entity={"kind": kind, "id": rid, "canonical_url": url},
                summary=f"Help article {rid} retired",
                pointer=url,
            )
        )
        pointers.delete("help", kind, rid)
    return events


def _emit(*, source: str, change: str, entity: dict, summary: str, pointer: str) -> dict:
    envelope = {
        "contract_version": "1",
        "kind": "source_change",
        "source": source,
        "refs": [entity],
        "payload": {
            "change": change,
            "entity": entity,
            "summary": summary,
            "content_pointer": pointer,
        },
    }
    return store.insert_contract(
        envelope=envelope, principal="wiki-poller", status="validated"
    )


# --- Source Contract P2 (SC-3) — S1 help + S2 courses -----------------------
# Hash-walk published catalogs (GET-only). Pointers are an optional signal.
# Where signal and hash disagree, the hash wins (L10). OD-6 unpublish is HELD.

from datetime import datetime, timezone

import wiki_agent_schema as schema
from wiki_agent_discharge import OSCAR, PROFIT_RE, _board_failed_partial, _guidelines
from wiki_agent_push import content_hash, is_thin
import wiki_agent_git
import wiki_store


def _iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def _published(item: dict) -> bool:
    st = str(item.get("status") or "published").strip().lower()
    return st in {"", "published", "live"}


def _page_md(env: dict) -> str:
    title = str(env.get("title") or "").replace('"', "'")
    origin = str(env.get("origin_ref") or "")
    kind = str(env.get("source_kind") or "")
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
        f"source_kind: {kind}\n"
        f"---\n\n"
        f"{body.rstrip()}\n"
    )


def _slug_sc3(source_kind: str, source_id: str) -> str:
    import re

    raw = f"sc3-{source_kind}-{source_id}".lower()
    return re.sub(r"[^a-z0-9-]+", "-", raw).strip("-")[:80]


def _land(parsed: dict) -> dict:
    _guidelines()
    rel = f"wiki/topics/{_slug_sc3(parsed['source_kind'], parsed['source_id'])}.md"
    text = _page_md(parsed)
    root = wiki_store.wiki_root()
    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")
    try:
        sha = wiki_agent_git.commit_paths(
            root, contract_id=parsed["_contract_id"], relative_paths=[rel]
        )
    except Exception as exc:
        dest.unlink(missing_ok=True)
        card = _board_failed_partial(parsed["_contract_id"], rel, str(exc))
        store.mark_failed(
            parsed["_contract_id"], f"git:{exc}", board_card_ids=[card]
        )
        return {"composed": False, "page_path": "", "reason": f"git:{exc}"}
    import board

    item = board.create_item(
        OSCAR,
        title=f"Wiki draft {rel}",
        intent_md=(
            f"contract `{parsed['_contract_id']}`\n"
            f"SC-3 poll. Draft on the board — you still approve.\n"
        ),
        acceptance_md="Hotel: no invention, no profit claims. Approve to publish in git.",
        product_line="wiki",
    )
    board.transition(
        int(item["id"]), OSCAR, to_status="awaiting_approval", reason="sc3 poll"
    )
    store.record_commits(parsed["_contract_id"], [sha])
    store.record_board_ids(parsed["_contract_id"], [int(item["id"])])
    store.upsert_watermark(
        source_kind=parsed["source_kind"],
        source_id=parsed["source_id"],
        content_hash=parsed["content_hash"],
        contract_id=parsed["_contract_id"],
    )
    return {"composed": True, "page_path": rel, "reason": ""}


def _handle_item(
    *,
    source_kind: str,
    source_id: str,
    title: str,
    body: str,
    origin_ref: str,
    origin_owner: str,
    signal: str,
    land: bool,
) -> dict:
    digest = content_hash(body)
    wm = store.get_watermark(source_kind, source_id)
    base = {
        "source_kind": source_kind,
        "source_id": source_id,
        "content_hash": digest,
        "signal": signal,
        "composed": False,
        "page_path": "",
        "retries": 0,
    }
    # L10: hash matches watermark → no compose, even if signal says new.
    if wm is not None and wm["content_hash"] == digest:
        return {
            **base,
            "status": "accepted",
            "reason": "hash_unchanged",
            "contract_id": wm.get("contract_id") or "",
        }

    change_type = "created" if wm is None else "updated"
    env = {
        "source_kind": source_kind,
        "source_id": source_id,
        "title": title,
        "body": body,
        "body_format": "markdown",
        "intent": f"Published {source_kind}",
        "origin_ref": origin_ref,
        "origin_owner": origin_owner,
        "change_type": change_type,
        "submitted_at": _iso_now(),
        "content_hash": digest,
        "acquired_by": "poll",
        "contract_version": "0.1.4",
    }
    if is_thin(body):
        row = store.insert_contract(
            envelope={
                "contract_version": "0.1.4",
                "kind": "source_contract",
                "source": origin_owner,
                "refs": [],
                "payload": env,
            },
            principal="wiki-poller",
            status="failed-partial",
            failure_reason="insufficient_substance:too_thin",
        )
        return {
            **base,
            "status": "failed-partial",
            "reason": "insufficient_substance:too_thin",
            "contract_id": row["contract_id"],
        }
    if PROFIT_RE.search(body or ""):
        row = store.insert_contract(
            envelope={
                "contract_version": "0.1.4",
                "kind": "source_contract",
                "source": origin_owner,
                "refs": [],
                "payload": env,
            },
            principal="wiki-poller",
            status="failed-partial",
            failure_reason="profit_claim",
        )
        return {
            **base,
            "status": "failed-partial",
            "reason": "profit_claim",
            "contract_id": row["contract_id"],
        }
    parsed = schema.parse_source_envelope(env)
    row = store.insert_contract(
        envelope={
            "contract_version": "0.1.4",
            "kind": "source_contract",
            "source": origin_owner,
            "refs": [],
            "payload": parsed,
        },
        principal="wiki-poller",
        status="accepted",
    )
    if not land:
        store.upsert_watermark(
            source_kind=parsed["source_kind"],
            source_id=parsed["source_id"],
            content_hash=parsed["content_hash"],
            contract_id=row["contract_id"],
        )
        return {
            **base,
            "status": "accepted",
            "reason": "",
            "contract_id": row["contract_id"],
            "composed": False,
        }
    parsed["_contract_id"] = row["contract_id"]
    landed = _land(parsed)
    return {
        **base,
        "status": "accepted" if landed["composed"] else "failed-partial",
        "reason": landed["reason"],
        "contract_id": row["contract_id"],
        "composed": landed["composed"],
        "page_path": landed["page_path"],
    }


def poll_courses_source(
    client: GetOnlyClient, *, list_url: str = "/api/courses", land: bool = True
) -> list[dict]:
    """S2: hash-walk published courses. GET-only. Missing signal does not skip hash."""
    data = client.get(list_url)
    courses = data.get("courses") if isinstance(data, dict) else data
    if not isinstance(courses, list):
        raise WikiAgentHttpError("course catalog must be a list")
    out: list[dict] = []
    for c in courses:
        if not isinstance(c, dict) or not _published(c):
            continue
        slug = str(c.get("slug") or "").strip()
        cid = str(c.get("id") or slug)
        if not slug:
            continue
        detail_url = f"{list_url.rstrip('/')}/{slug}"
        detail = client.get(detail_url)
        if not isinstance(detail, dict):
            raise WikiAgentHttpError("course detail must be an object")
        if not _published(detail):
            continue
        url = f"/course/{slug}"
        signal = pointers.upsert(
            source="courseware",
            ref_kind="course",
            ref_id=cid,
            canonical_url=url,
            payload=detail,
        )
        title = str(detail.get("title") or slug).strip()
        body = str(
            detail.get("description_md") or detail.get("subtitle") or ""
        ).strip()
        out.append(
            _handle_item(
                source_kind="course",
                source_id=cid,
                title=title,
                body=body,
                origin_ref=url,
                origin_owner="courseware",
                signal=signal,
                land=land,
            )
        )
    return out


def poll_help_source(
    client: GetOnlyClient, *, list_url: str, land: bool = True
) -> list[dict]:
    """S1: hash-walk published help. GET-only. Missing signal does not skip hash."""
    if not list_url:
        raise WikiAgentHttpError("help catalog url required")
    data = client.get(list_url)
    articles = data.get("articles") if isinstance(data, dict) else data
    if not isinstance(articles, list):
        raise WikiAgentHttpError("help catalog must be a list")
    out: list[dict] = []
    for a in articles:
        if not isinstance(a, dict) or not _published(a):
            continue
        aid = str(a.get("id") or "").strip()
        if not aid:
            continue
        url = str(a.get("canonical_url") or f"/help/{aid}")
        signal = pointers.upsert(
            source="help",
            ref_kind="help_article",
            ref_id=aid,
            canonical_url=url,
            payload=a,
        )
        title = str(a.get("title") or aid).strip()
        body = str(a.get("body") or a.get("body_md") or "").strip()
        out.append(
            _handle_item(
                source_kind="help_guide",
                source_id=aid,
                title=title,
                body=body,
                origin_ref=url,
                origin_owner="help",
                signal=signal,
                land=land,
            )
        )
    return out
