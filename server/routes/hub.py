"""Course hub page content + FAQ.

Public read for SSG; admin write for in-place editing (same role gate as courses).
"""

from fastapi import APIRouter, HTTPException, Request

import db
from guards import require_admin

public = APIRouter(tags=["hub"])
admin = APIRouter(prefix="/api/admin", tags=["admin"])

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


@public.get("/api/hub")
def get_hub() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            page = _load_page(cur, "hub")
            if page is None:
                raise HTTPException(status_code=404, detail="Hub page not configured")
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
    """Replace hub page fields and the full FAQ list (ordered).

    Body: page fields + faq_items: [{id?, question, answer_md, sort_order}].
    Items without id are inserted; missing existing ids are deleted.
    """
    require_admin(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    patch = {k: body[k] for k in PAGE_FIELDS if k in body}
    if "intro_video_id" in patch:
        raw = (patch["intro_video_id"] or "").strip() or None
        if raw:
            # Accept bare id or YouTube URL; store 11-char id when possible.
            import re
            from urllib.parse import urlparse, parse_qs

            if re.fullmatch(r"[\w-]{11}", raw):
                patch["intro_video_id"] = raw
            else:
                try:
                    u = urlparse(raw)
                    if "youtu.be" in (u.netloc or ""):
                        cand = u.path.strip("/").split("/")[0]
                    else:
                        cand = parse_qs(u.query).get("v", [None])[0]
                        if not cand:
                            m = re.search(r"/(?:embed|shorts)/([\w-]{11})", u.path or "")
                            cand = m.group(1) if m else None
                    patch["intro_video_id"] = (
                        cand if cand and re.fullmatch(r"[\w-]{11}", cand) else raw[:32]
                    )
                except Exception:
                    patch["intro_video_id"] = raw[:32]
        else:
            patch["intro_video_id"] = None

    faq_items = body.get("faq_items")
    if faq_items is not None and not isinstance(faq_items, list):
        raise HTTPException(status_code=422, detail="faq_items must be a list")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM site_pages WHERE slug = 'hub'")
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Hub page not configured")

            if patch:
                cols = ", ".join(f"{k} = %s" for k in patch)
                cur.execute(
                    f"UPDATE site_pages SET {cols} WHERE slug = 'hub'",
                    tuple(patch.values()),
                )

            if faq_items is not None:
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
                               WHERE id = %s AND page_slug = 'hub'""",
                            (sort_order, q, a, int(item_id)),
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
                               VALUES ('hub', %s, %s, %s)""",
                            (sort_order, q, a),
                        )
                        keep_ids.append(cur.lastrowid)

                if keep_ids:
                    placeholders = ",".join(["%s"] * len(keep_ids))
                    cur.execute(
                        f"""DELETE FROM site_faq_items
                            WHERE page_slug = 'hub' AND id NOT IN ({placeholders})""",
                        tuple(keep_ids),
                    )
                else:
                    cur.execute(
                        "DELETE FROM site_faq_items WHERE page_slug = 'hub'"
                    )

            page = _load_page(cur, "hub")
            return page
