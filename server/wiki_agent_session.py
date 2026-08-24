"""Session lifecycle: opening turn, accrete, seal, context-into-entry (WA-4)."""

from __future__ import annotations

import re

import wiki_agent_git
import wiki_agent_store as store
import wiki_store
from config import ConfigError
from wiki_agent_store import SessionSealedError


def opening_turn(context: dict) -> dict:
    surface = str((context or {}).get("surface") or "").strip()
    route = str((context or {}).get("route") or "").strip()
    entity = (context or {}).get("entity")
    if isinstance(entity, dict) and entity.get("id"):
        ent = (
            f"{entity.get('kind')} `{entity.get('id')}` "
            f"at `{entity.get('canonical_url')}`"
        )
        registry_note = (
            " Hub is the first registered provider. Further providers are "
            "proposed in this window — nothing registers until you act."
            if entity.get("kind") == "hub"
            else ""
        )
    else:
        ent = "none on screen"
        registry_note = (
            " This surface is not in the context registry; session is "
            "route-context only. I can propose the next provider here — "
            "nothing registers until you act."
        )
    return {
        "role": "agent",
        "content": (
            f"This is {surface} at {route}. Entity: {ent}."
            f"{registry_note} What should the wiki page cover?"
        ),
    }


def apply_opening(contract_id: str) -> dict:
    row = store.get_contract(contract_id)
    if row is None:
        raise KeyError(contract_id)
    payload = dict(row["payload"] or {})
    ctx = payload.get("context") or {}
    payload["transcript"] = [opening_turn(ctx)]
    return store.update_payload_if_unsealed(contract_id, payload)


def append_admin_turn(contract_id: str, content: str) -> dict:
    row = store.get_contract(contract_id)
    if row is None:
        raise KeyError(contract_id)
    if row.get("kind") != "session":
        raise ValueError("not_session")
    if row.get("sealed_at"):
        raise SessionSealedError("session_sealed")
    text = (content or "").strip()
    if not text:
        raise ValueError("empty_turn")
    payload = dict(row["payload"] or {})
    ctx = payload.get("context") or {}
    transcript = list(payload.get("transcript") or [])
    transcript.append({"role": "admin", "content": text})
    transcript.append(
        {
            "role": "agent",
            "content": (
                f"Recorded as a proposal. Context remains {ctx.get('surface')} "
                f"at {ctx.get('route')}. Nothing is filed until you choose "
                "Draft to board — you still approve."
            ),
        }
    )
    payload["transcript"] = transcript
    return store.update_payload_if_unsealed(contract_id, payload)


def _slug(contract_id: str) -> str:
    raw = f"wa4-session-{contract_id}".lower()
    return re.sub(r"[^a-z0-9-]+", "-", raw).strip("-")[:80]


def _title(context: dict) -> str:
    entity = (context or {}).get("entity") or {}
    ident = str(entity.get("id") or "").strip()
    if ident:
        return ident.replace("-", " ").replace("_", " ")
    surface = str((context or {}).get("surface") or "wiki").strip()
    return f"Called from {surface}"


def compose_session_draft(row: dict) -> tuple[str, str]:
    """Deterministic page from contract evidence. No model. No invention."""
    cid = row["contract_id"]
    payload = row.get("payload") or {}
    ctx = payload.get("context") or {}
    entity = ctx.get("entity") if isinstance(ctx.get("entity"), dict) else {}
    title = _title(ctx)
    surface = str(ctx.get("surface") or "")
    route = str(ctx.get("route") or "")
    ekind = str(entity.get("kind") or "")
    eid = str(entity.get("id") or "")
    eurl = str(entity.get("canonical_url") or "")
    transcript = payload.get("transcript") or []
    direction = []
    for turn in transcript:
        if not isinstance(turn, dict):
            continue
        if turn.get("role") == "admin":
            direction.append(str(turn.get("content") or "").strip())
    direction_md = "\n\n".join(direction) if direction else "No admin direction yet."
    links = []
    if eid:
        slugish = re.sub(r"[^a-z0-9-]+", "-", eid.lower()).strip("-")
        links.append(f"- [[{slugish}]] ({ekind} `{eid}` at `{eurl}`)")
    else:
        links.append("- none on screen")
    body = (
        f"---\n"
        f"title: {title}\n"
        f"kind: concept\n"
        f"status: draft\n"
        f"session_contract_id: {cid}\n"
        f"calling_surface: {surface}\n"
        f"calling_route: {route}\n"
        f"calling_entity_kind: {ekind}\n"
        f"calling_entity_id: {eid}\n"
        f"calling_entity_url: {eurl}\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"Called from **{surface}** at `{route}`.\n\n"
        f"Entity: {ekind or 'none'} `{eid or 'none on screen'}` "
        f"(`{eurl or ''}`).\n\n"
        f"## Direction\n\n{direction_md}\n\n"
        f"## Candidate linkages\n\n" + "\n".join(links) + "\n"
    )
    rel = f"wiki/concepts/{_slug(cid)}.md"
    return rel, body


def discharge_session(contract_id: str) -> dict:
    """WA-2 path: git draft → board awaiting_approval. No auto-publish."""
    from wiki_agent_discharge import OSCAR, _board_failed_partial

    row = store.get_contract(contract_id)
    if row is None:
        raise KeyError(contract_id)
    if row.get("kind") != "session":
        raise ValueError("not_session")
    rel, body = compose_session_draft(row)
    root = wiki_store.wiki_root()
    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(body, encoding="utf-8")
    try:
        sha = wiki_agent_git.commit_paths(
            root, contract_id=contract_id, relative_paths=[rel]
        )
    except Exception as exc:
        card = _board_failed_partial(contract_id, rel, str(exc))
        return store.mark_failed(
            contract_id, f"git:{exc}", board_card_ids=[card]
        )

    ctx = (row.get("payload") or {}).get("context") or {}
    entity = ctx.get("entity") if isinstance(ctx.get("entity"), dict) else {}
    query_text = " ".join(
        [
            str(ctx.get("surface") or ""),
            str(entity.get("id") or ""),
            str(entity.get("kind") or ""),
            body,
        ]
    )
    suggestions_md = ""
    import os

    if os.environ.get("LABS_WIKI_LINK_INSERT_THRESHOLD", "").strip():
        import db
        import wiki_agent_linkage as linkage

        with db.transaction() as conn:
            wiki_store.reindex(conn, root)
        link = linkage.run_after_ingest(
            contract_id=contract_id,
            draft_slug=_slug(contract_id),
            relative_path=rel,
            root=root,
            query_text=query_text,
        )
        suggestions_md = link["suggestions_md"]

    import board

    item = board.create_item(
        OSCAR,
        title=f"Wiki draft {rel}",
        intent_md=(
            f"contract `{contract_id}`\n"
            f"Draft on the board — you still approve.\n\n"
            f"{suggestions_md}"
        ),
        acceptance_md="Hotel: no invention, no profit claims. Approve to publish in git.",
        product_line="wiki",
    )
    board.transition(
        int(item["id"]), OSCAR, to_status="awaiting_approval", reason="session discharge"
    )
    store.record_commits(contract_id, [sha])
    return store.record_board_ids(contract_id, [int(item["id"])])


def drain_n() -> int:
    import os

    raw = os.environ.get("LABS_WIKI_LINKAGE_DRAIN_N", "").strip()
    if not raw:
        raise ConfigError("Missing required environment variable: LABS_WIKI_LINKAGE_DRAIN_N")
    try:
        n = int(raw)
    except ValueError as exc:
        raise ConfigError(
            f"LABS_WIKI_LINKAGE_DRAIN_N must be an integer, got {raw!r}"
        ) from exc
    if n < 1:
        raise ConfigError(f"LABS_WIKI_LINKAGE_DRAIN_N must be >= 1, got {n}")
    return n
