"""Course hub + section hub page content (site_pages CMS).

Public read for SSG/SEO; admin write for in-place editing.
Slugs: hub (course home), labs, resources, live.
"""

from fastapi import APIRouter, HTTPException, Request

import db
from guards import require_admin

public = APIRouter(tags=["hub"])
admin = APIRouter(prefix="/api/admin", tags=["admin"])

# Public section hubs + course hub
ALLOWED_PAGE_SLUGS = frozenset({"hub", "labs", "resources", "live"})

PAGE_FIELDS = frozenset(
    {
        "title",
        "description_md",
        "intro_video_id",
        "intro_video_title",
        "faq_title",
        "faq_description_md",
    }
)


def _load_page(cur, slug: str) -> dict | None:
    cur.execute(
        """SELECT slug, title, description_md, intro_video_id, intro_video_title,
                  faq_title, faq_description_md
           FROM site_pages WHERE slug = %s""",
        (slug,),
    )
    page = cur.fetchone()
    if not page:
        return None
    cur.execute(
        """SELECT id, sort_order, question, answer_md
           FROM site_faq_items WHERE page_slug = %s
           ORDER BY sort_order ASC, id ASC""",
        (slug,),
    )
    page["faq_items"] = cur.fetchall()
    return page


def _normalize_intro_video_id(raw: str | None) -> str | None:
    import re
    from urllib.parse import parse_qs, urlparse

    if not raw:
        return None
    raw = raw.strip()
    if not raw:
        return None
    if re.fullmatch(r"[\w-]{11}", raw):
        return raw
    try:
        u = urlparse(raw)
        if "youtu.be" in (u.netloc or ""):
            cand = u.path.strip("/").split("/")[0]
        else:
            cand = parse_qs(u.query).get("v", [None])[0]
            if not cand:
                m = re.search(r"/(?:embed|shorts)/([\w-]{11})", u.path or "")
                cand = m.group(1) if m else None
        return cand if cand and re.fullmatch(r"[\w-]{11}", cand) else raw[:32]
    except Exception:
        return raw[:32]


def _put_page(cur, slug: str, body: dict) -> dict:
    if slug not in ALLOWED_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown page slug")
    patch = {k: body[k] for k in PAGE_FIELDS if k in body}
    if "intro_video_id" in patch:
        patch["intro_video_id"] = _normalize_intro_video_id(
            (patch["intro_video_id"] or "").strip() or None
        )

    faq_items = body.get("faq_items")
    if faq_items is not None and not isinstance(faq_items, list):
        raise HTTPException(status_code=422, detail="faq_items must be a list")

    cur.execute("SELECT 1 FROM site_pages WHERE slug = %s", (slug,))
    if cur.fetchone() is None:
        raise HTTPException(status_code=404, detail="Hub page not configured")

    if patch:
        cols = ", ".join(f"{k} = %s" for k in patch)
        cur.execute(
            f"UPDATE site_pages SET {cols} WHERE slug = %s",
            (*tuple(patch.values()), slug),
        )

    if faq_items is not None:
        # Full FAQ replace only for course hub (others may have empty FAQ)
        keep_ids: list[int] = []
        for i, item in enumerate(faq_items):
            if not isinstance(item, dict):
                raise HTTPException(status_code=422, detail="FAQ item must be object")
            q = (item.get("question") or "").strip()
            a = item.get("answer_md")
            if a is None:
                a = ""
            if not q:
                raise HTTPException(status_code=422, detail="FAQ question required")
            sort_order = int(item.get("sort_order", i))
            item_id = item.get("id")
            if item_id:
                cur.execute(
                    """UPDATE site_faq_items
                       SET sort_order = %s, question = %s, answer_md = %s
                       WHERE id = %s AND page_slug = %s""",
                    (sort_order, q, a, int(item_id), slug),
                )
                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=404, detail=f"FAQ item {item_id} not found"
                    )
                keep_ids.append(int(item_id))
            else:
                cur.execute(
                    """INSERT INTO site_faq_items
                         (page_slug, sort_order, question, answer_md)
                       VALUES (%s, %s, %s, %s)""",
                    (slug, sort_order, q, a),
                )
                keep_ids.append(cur.lastrowid)

        if keep_ids:
            placeholders = ",".join(["%s"] * len(keep_ids))
            cur.execute(
                f"""DELETE FROM site_faq_items
                    WHERE page_slug = %s AND id NOT IN ({placeholders})""",
                (slug, *tuple(keep_ids)),
            )
        else:
            cur.execute(
                "DELETE FROM site_faq_items WHERE page_slug = %s", (slug,)
            )

    page = _load_page(cur, slug)
    if page is None:
        raise HTTPException(status_code=404, detail="Hub page not configured")
    return page


@public.get("/api/hub")
def get_hub() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            page = _load_page(cur, "hub")
            if page is None:
                raise HTTPException(status_code=404, detail="Hub page not configured")
            return page


@public.get("/api/site-pages/{slug}")
def get_site_page(slug: str) -> dict:
    """Public CMS page for section hubs (labs, resources, live) and course hub."""
    if slug not in ALLOWED_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown page")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            page = _load_page(cur, slug)
            if page is None:
                raise HTTPException(status_code=404, detail="Page not configured")
            return page


@admin.get("/hub")
def admin_get_hub(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            page = _load_page(cur, "hub")
            if page is None:
                raise HTTPException(status_code=404, detail="Hub page not configured")
            return page


@admin.put("/hub")
async def admin_put_hub(request: Request) -> dict:
    """Replace hub page fields and the full FAQ list (ordered)."""
    require_admin(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return _put_page(cur, "hub", body)


@admin.get("/site-pages/{slug}")
def admin_get_site_page(slug: str, request: Request) -> dict:
    require_admin(request)
    if slug not in ALLOWED_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown page")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            page = _load_page(cur, slug)
            if page is None:
                raise HTTPException(status_code=404, detail="Page not configured")
            return page


@admin.put("/site-pages/{slug}")
async def admin_put_site_page(slug: str, request: Request) -> dict:
    """Update section hub title/description_md (and optional FAQ for any slug)."""
    require_admin(request)
    if slug not in ALLOWED_PAGE_SLUGS:
        raise HTTPException(status_code=404, detail="Unknown page")
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return _put_page(cur, slug, body)
