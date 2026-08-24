"""Oscar discharge: pointer GET → draft.md → git commit → board (WA-2)."""

from __future__ import annotations

import re
import os
from pathlib import Path

import wiki_agent_git
import wiki_agent_store as store
import wiki_store
from agent_auth import Actor
from ai import complete
from config import ConfigError
from wiki_agent_http import GetOnlyClient, WikiAgentHttpError

GUIDELINES = (
    Path(__file__).resolve().parent.parent
    / "agents"
    / "p-wiki"
    / "hotel-agent-draft-guidelines.md"
)

OSCAR = Actor(
    kind="agent",
    id=0,
    label="oscar",
    role="administrator",
    scopes=frozenset({"board:operate"}),
)

PROFIT_RE = re.compile(
    r"\b(profits?|profitable|p\s*&\s*l|make money|get rich)\b",
    re.I,
)


def _guidelines() -> str:
    if not GUIDELINES.is_file():
        raise ConfigError(f"Hotel guidelines missing: {GUIDELINES}")
    return GUIDELINES.read_text(encoding="utf-8")


def _slug(source: str, ref_id: str) -> str:
    raw = f"wa2-{source}-{ref_id}".lower()
    return re.sub(r"[^a-z0-9-]+", "-", raw).strip("-")[:80]


def _board_failed_partial(contract_id: str, rel: str, reason: str) -> int:
    import board

    item = board.create_item(
        OSCAR,
        title=f"[failed-partial] wiki draft {contract_id}",
        intent_md=(
            f"flag: failed-partial\n\ncontract `{contract_id}`\n"
            f"path `{rel}`\nreason: {reason}\n"
        ),
        acceptance_md="Human must finish or discard the partial draft.",
        product_line="wiki",
    )
    board.transition(
        int(item["id"]), OSCAR, to_status="awaiting_approval", reason=reason
    )
    return int(item["id"])


def discharge(contract_id: str, http: GetOnlyClient) -> dict:
    row = store.get_contract(contract_id)
    if row is None:
        raise WikiAgentHttpError("contract not found")
    payload = row["payload"] or {}
    pointer = str(payload.get("content_pointer") or "")
    change = str(payload.get("change") or "updated")
    entity = payload.get("entity") or {}
    rel = f"wiki/concepts/{_slug(row['source'], str(entity.get('id') or contract_id))}.md"
    root = wiki_store.wiki_root()

    try:
        canonical = http.get(pointer)
    except Exception as exc:
        return store.mark_failed(contract_id, f"bad_pointer:{exc}")

    if not isinstance(canonical, dict):
        return store.mark_failed(contract_id, "bad_pointer:not_object")

    try:
        result = complete(
            [
                {"role": "system", "content": _guidelines()},
                {
                    "role": "user",
                    "content": (
                        f"Contract {contract_id} change={change}\n"
                        f"summary: {payload.get('summary')}\n"
                        f"canonical JSON: {canonical}\n"
                        "Write a wiki markdown page with YAML frontmatter "
                        "status: draft. Follow the guidelines."
                    ),
                },
            ],
            agent="oscar",
        )
        text = result.text
    except Exception as exc:
        return store.mark_failed(contract_id, f"model:{exc}")

    if PROFIT_RE.search(text or ""):
        return store.mark_failed(contract_id, "profit_claim")

    if change == "retired":
        text = (
            f"---\ntitle: Retired {entity.get('id')}\nkind: concept\n"
            f"status: draft\nsources: [{pointer}]\n---\n\n"
            f"Canonical source retired. Do not treat as current. "
            f"{payload.get('summary')}\n"
        )

    dest = root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")

    try:
        sha = wiki_agent_git.commit_paths(
            root, contract_id=contract_id, relative_paths=[rel]
        )
    except Exception as exc:
        card = _board_failed_partial(contract_id, rel, str(exc))
        return store.mark_failed(
            contract_id, f"git:{exc}", board_card_ids=[card]
        )

    suggestions_md = ""
    reverse_hits: list = []
    overflow: list = []
    inline: list = []
    if os.environ.get("LABS_WIKI_LINK_INSERT_THRESHOLD", "").strip():
        import db
        import wiki_agent_linkage as linkage

        with db.transaction() as conn:
            wiki_store.reindex(conn, root)
        link = linkage.run_after_ingest(
            contract_id=contract_id,
            draft_slug=_slug(row["source"], str(entity.get("id") or contract_id)),
            relative_path=rel,
            root=root,
            query_text=f"{payload.get('summary') or ''} {text}",
        )
        suggestions_md = link["suggestions_md"]
        reverse_hits = link["reverse_hits"]
        overflow = link["overflow"]
        inline = link["inline"]

    import board

    item = board.create_item(
        OSCAR,
        title=f"Wiki draft {rel}",
        intent_md=(
            f"contract `{contract_id}`\n{payload.get('summary')}\n\n"
            f"{suggestions_md}"
        ),
        acceptance_md="Hotel: no invention, no profit claims. Approve to publish in git.",
        product_line="wiki",
    )
    board.transition(
        int(item["id"]), OSCAR, to_status="awaiting_approval", reason="oscar discharge"
    )
    card_ids = [int(item["id"])]
    if reverse_hits:
        n = len(reverse_hits)
        lines = [
            f"Reverse-pass for `{contract_id}`: {n} published pages.",
            f"Overflow queued (query wiki_linkage_queue): {len(overflow)}.",
            "",
        ]
        for c in inline:
            lines.append(f"- `{c['slug']}` score={c['explain']['total']}")
        roll = board.create_item(
            OSCAR,
            title=f"Reverse-pass {contract_id} ({n})",
            intent_md="\n".join(lines),
            acceptance_md="Board-gated revision drafts; nothing dropped.",
            product_line="wiki",
        )
        board.transition(
            int(roll["id"]),
            OSCAR,
            to_status="awaiting_approval",
            reason="reverse-pass rollup",
        )
        card_ids.append(int(roll["id"]))
    store.record_commits(contract_id, [sha])
    return store.record_board_ids(contract_id, card_ids)
