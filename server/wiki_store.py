"""Wiki store — reader/indexer over the lab-wiki checkout (Member-Wiki Spec §3.0).

The git checkout at LABS_WIKI_ROOT is the system of record for wiki content.
This module parses it (frontmatter + [[wikilinks]]) and rebuilds the derived
MySQL index (wiki_pages_idx / wiki_links_idx). Idempotent full rebuild (WIK-D7).
Config fail-loud: an invalid root raises ConfigError (WIK-D4).
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

from config import ConfigError

log = logging.getLogger("labs.wiki")

WIKI_DIRS = ("topics", "concepts", "recaps", "glossary", "sources")
VALID_KINDS = {"topic", "concept", "recap", "glossary", "source"}
VALID_STATUS = {"draft", "published"}

# [[slug]] or [[slug|label]]; slug may not contain ] or |
WIKILINK_RE = re.compile(r"\[\[([^\]\|\n]+?)(?:\|([^\]\n]+?))?\]\]")


@dataclass
class WikiPage:
    slug: str
    path: str  # repo-relative
    title: str
    kind: str
    status: str
    body_md: str
    tags: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    updated: str = ""
    links: list[str] = field(default_factory=list)  # outbound wikilink target slugs
    pin: bool = False
    pin_order: int = 1_000_000
    compiled_by: str = ""
    approved_by: str = ""


def wiki_root() -> Path:
    """LABS_WIKI_ROOT — required, validated. Fail loud (WIK-D4)."""
    raw = os.environ.get("LABS_WIKI_ROOT", "").strip()
    if not raw:
        raise ConfigError("Missing required environment variable: LABS_WIKI_ROOT")
    root = Path(raw)
    if not root.is_dir():
        raise ConfigError(f"LABS_WIKI_ROOT is not a directory: {raw}")
    if not (root / "wiki" / "index.md").is_file():
        raise ConfigError(
            f"LABS_WIKI_ROOT does not look like a lab-wiki checkout "
            f"(missing wiki/index.md): {raw}"
        )
    return root


def _parse_list(raw: str) -> list[str]:
    """Parse a frontmatter inline list: [a, b] / ["a", "b"] / []."""
    raw = raw.strip()
    if not (raw.startswith("[") and raw.endswith("]")):
        return [raw.strip("\"' ")] if raw else []
    inner = raw[1:-1].strip()
    if not inner:
        return []
    items: list[str] = []
    for part in re.split(r""",(?=(?:[^"']*["'][^"']*["'])*[^"']*$)""", inner):
        item = part.strip().strip("\"' ")
        if item:
            items.append(item)
    return items


def _parse_bool(raw: str) -> bool:
    return raw.strip().strip("\"'").lower() in {"1", "true", "yes", "on"}


def _parse_int(raw: str, default: int) -> int:
    try:
        return int(str(raw).strip().strip("\"'"))
    except (TypeError, ValueError):
        return default


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Split leading YAML-ish frontmatter from body. Tolerant: no frontmatter →
    ({}, whole text). Only flat `key: value` lines are understood."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    header = text[3:end]
    body = text[end + 4 :].lstrip("\n")
    meta: dict = {}
    for line in header.splitlines():
        line = line.rstrip()
        if not line or line.lstrip().startswith("#") or ":" not in line:
            continue
        if line.startswith((" ", "\t")):  # nested yaml — ignored, flat keys only
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta, body


def parse_wikilinks(body: str) -> list[str]:
    """Outbound wikilink target slugs, deduped, order preserved."""
    seen: list[str] = []
    for match in WIKILINK_RE.finditer(body):
        target = match.group(1).strip()
        if target and target not in seen:
            seen.append(target)
    return seen


def load_pages(root: Path) -> tuple[list[WikiPage], list[str]]:
    """Walk wiki/{topics,concepts,recaps,glossary,sources}/*.md.

    Returns (pages, warnings). Bad files are skipped with a warning — one broken
    page must never take down the index rebuild.
    """
    pages: list[WikiPage] = []
    warnings: list[str] = []
    by_slug: dict[str, str] = {}

    for dirname in WIKI_DIRS:
        directory = root / "wiki" / dirname
        if not directory.is_dir():
            continue
        for file in sorted(directory.glob("*.md")):
            rel = str(file.relative_to(root))
            slug = file.stem
            try:
                text = file.read_text(encoding="utf-8")
            except OSError as exc:
                warnings.append(f"{rel}: unreadable ({exc})")
                continue

            meta, body = parse_frontmatter(text)
            if not meta:
                warnings.append(f"{rel}: missing frontmatter — skipped")
                continue

            status = meta.get("status", "draft").strip().lower()
            if status not in VALID_STATUS:
                warnings.append(f"{rel}: invalid status {status!r} → treated as draft")
                status = "draft"

            kind = meta.get("kind", "").strip().lower()
            if kind not in VALID_KINDS:
                fallback = dirname.rstrip("s") if dirname != "glossary" else "glossary"
                warnings.append(f"{rel}: invalid kind {kind!r} → {fallback}")
                kind = fallback

            if slug in by_slug:
                warnings.append(f"{rel}: duplicate slug {slug!r} (kept {by_slug[slug]})")
                continue
            by_slug[slug] = rel

            pages.append(
                WikiPage(
                    slug=slug,
                    path=rel,
                    title=meta.get("title", "").strip() or slug,
                    kind=kind,
                    status=status,
                    body_md=body,
                    tags=_parse_list(meta.get("tags", "")),
                    sources=_parse_list(meta.get("sources", "")),
                    updated=meta.get("updated", "").strip(),
                    links=parse_wikilinks(body),
                    pin=_parse_bool(meta.get("pin", "")),
                    pin_order=_parse_int(meta.get("pin_order", ""), 1_000_000),
                    compiled_by=meta.get("compiled_by", "").strip().strip("\"'"),
                    approved_by=meta.get("approved_by", "").strip().strip("\"'"),
                )
            )

    return pages, warnings


def reindex(conn, root: Path) -> dict:
    """Idempotent full rebuild of the derived index inside one transaction.

    Caller owns the transaction (db.transaction()). Returns counts.
    """
    pages, warnings = load_pages(root)
    for warning in warnings:
        log.warning("wiki reindex: %s", warning)

    slugs = {p.slug for p in pages}
    with conn.cursor() as cur:
        cur.execute("DELETE FROM wiki_links_idx")
        cur.execute("DELETE FROM wiki_pages_idx")
        for p in pages:
            cur.execute(
                """
                INSERT INTO wiki_pages_idx
                  (slug, path, title, kind, status, body_md, tags_json,
                   sources_json, updated_date, pin, pin_order,
                   compiled_by, approved_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    p.slug,
                    p.path,
                    p.title,
                    p.kind,
                    p.status,
                    p.body_md,
                    json.dumps(p.tags),
                    json.dumps(p.sources),
                    p.updated,
                    1 if p.pin else 0,
                    p.pin_order,
                    p.compiled_by,
                    p.approved_by,
                ),
            )
        unresolved = 0
        for p in pages:
            for target in p.links:
                resolved = target in slugs
                if not resolved:
                    unresolved += 1
                cur.execute(
                    """
                    INSERT INTO wiki_links_idx (from_slug, to_slug, relation, resolved)
                    VALUES (%s, %s, 'wikilink', %s)
                    ON DUPLICATE KEY UPDATE resolved = VALUES(resolved)
                    """,
                    (p.slug, target, 1 if resolved else 0),
                )

    published = sum(1 for p in pages if p.status == "published")
    return {
        "pages": len(pages),
        "published": published,
        "drafts": len(pages) - published,
        "links": sum(len(p.links) for p in pages),
        "unresolved_links": unresolved,
        "skipped": len(warnings),
    }
