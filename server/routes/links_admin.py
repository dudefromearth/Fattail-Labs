"""Admin Links/QR API (LK-1.1, W3 — create a link, render its QR, show reporting).

Reuses the already-built C1 link store (links.store), C4 QR renderer
(links.qr), and reads C2 events (link_events) directly for reporting.
Admin only (AD-L1). Phase 1 columns only (AD-L3): timestamp, slug, kind,
device_class, os_family, referrer, country, region, bot. member_id,
marker_id, and owner are never read or returned here (AT-11b).
"""

from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException, Request, Response
from PIL import Image, ImageDraw, ImageFont

import db
from config import get_config
from guards import require_admin
from links.fence import FenceError
from links.qr import QrRefused, render as qr_render
from links.store import create_link, get_link, update_link

router = APIRouter(prefix="/api/admin/links", tags=["admin-links"])

_HOST = "https://labs.fattail.ai"
_TOP_N = 10
_DAY_WINDOWS = (7, 30, 90, 0)  # 0 = all time
# Dimensions shown as top-N panels on the detail page and reachable at
# /{slug}/breakdown/{dimension}. Columns are a fixed whitelist — never
# interpolated from caller input. AD-L3's exact Phase 1 columns only.
_BREAKDOWN_COLUMNS = {
    "os_family": "os_family",
    "device_class": "device_class",
    "country": "country",
    "region": "region",
    "kind": "kind",
}


def _short_url(slug: str) -> str:
    return f"{_HOST}/q/{slug}"


def _with_url(row: dict) -> dict:
    row = dict(row)
    row["short_url"] = _short_url(row["slug"])
    return row


def _day_window(days: int) -> int:
    return days if days in _DAY_WINDOWS else 30


def _since(days: int) -> datetime | None:
    if days <= 0:
        return None
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)


def _grouped_counts(cur, slug: str, column: str, since: datetime | None) -> list[dict]:
    where = "slug=%s AND bot=0"
    params: list = [slug]
    if since is not None:
        where += " AND occurred_at >= %s"
        params.append(since)
    cur.execute(
        f"SELECT {column} AS k, COUNT(*) AS c FROM link_events WHERE {where} "
        f"GROUP BY {column} ORDER BY c DESC",
        params,
    )
    return cur.fetchall()


def _normalize_source(referrer: str) -> str:
    """Admin-layer grouping of the stored referrer (RD-L2) into a traffic
    source. Read-only — does not change what the redirect route stores."""
    text = referrer.strip() if isinstance(referrer, str) else ""
    if not text or text.lower() == "direct":
        return "Direct / camera scan"
    try:
        host = (urlsplit(text).hostname or "").lower()
    except ValueError:
        host = ""
    if not host:
        return "Other"
    if host.startswith("www."):
        host = host[4:]
    return host


def _source_counts(cur, slug: str, since: datetime | None) -> list[dict]:
    where = "slug=%s AND bot=0"
    params: list = [slug]
    if since is not None:
        where += " AND occurred_at >= %s"
        params.append(since)
    cur.execute(
        f"SELECT referrer, COUNT(*) AS c FROM link_events WHERE {where} GROUP BY referrer",
        params,
    )
    agg: dict[str, int] = {}
    for r in cur.fetchall():
        src = _normalize_source(r["referrer"])
        agg[src] = agg.get(src, 0) + r["c"]
    return sorted(({"k": k, "c": v} for k, v in agg.items()), key=lambda r: -r["c"])


def _top(rows: list[dict], limit: int = _TOP_N) -> dict:
    total = sum(r["c"] for r in rows)
    top = rows[:limit]
    return {
        "top": [
            {
                "key": r["k"] if r["k"] not in (None, "") else "unknown",
                "count": r["c"],
                "pct": round(r["c"] / total * 100, 1) if total else 0.0,
            }
            for r in top
        ],
        "total_count": total,
        "distinct": len(rows),
        "has_more": len(rows) > limit,
    }


@router.get("")
def list_links(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT slug, destination, label, active, `static` AS static_flag,
                       created_at, updated_at
                FROM links
                ORDER BY created_at DESC
                """
            )
            links = cur.fetchall()
            stats: dict[str, dict] = {}
            slugs = [row["slug"] for row in links]
            if slugs:
                marks = ",".join(["%s"] * len(slugs))
                cur.execute(
                    f"""
                    SELECT slug, COUNT(*) AS scans, MAX(occurred_at) AS last_scan
                    FROM link_events
                    WHERE bot = 0 AND slug IN ({marks})
                    GROUP BY slug
                    """,
                    slugs,
                )
                for row in cur.fetchall():
                    stats[row["slug"]] = {"scans": row["scans"], "last_scan": row["last_scan"]}
    out = []
    for row in links:
        static = bool(row["static_flag"])
        stat = stats.get(row["slug"], {"scans": 0, "last_scan": None})
        out.append(
            {
                "slug": row["slug"],
                "short_url": _short_url(row["slug"]),
                "destination": row["destination"],
                "label": row["label"],
                "active": bool(row["active"]),
                "static": static,
                "scans": None if static else stat["scans"],
                "last_scan": None if static else stat["last_scan"],
                "created_at": row["created_at"],
            }
        )
    return {"links": out}


@router.post("")
async def create(request: Request) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    destination = body.get("destination")
    label = body.get("label")
    static = bool(body.get("static", False))
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                row = create_link(cur, destination=destination, label=label, static=static)
    except FenceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"link": _with_url(row)}


@router.get("/{slug}")
def detail(slug: str, request: Request, days: int = 30) -> dict:
    require_admin(request)
    window = _day_window(days)
    since = _since(window)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
            if row is None:
                raise HTTPException(status_code=404, detail="unknown link")

            if row["static"]:
                return {
                    "link": _with_url(row),
                    "tracked": False,
                    "days": window,
                    "total_scans": None,
                    "scan_count": None,
                    "click_count": None,
                    "last_scan": None,
                    "daily": [],
                    "breakdowns": {},
                    "events": [],
                }

            # Headline totals are all-time (bots excluded), independent of
            # the chart/breakdown date window — matches "Active since X".
            cur.execute(
                "SELECT kind, COUNT(*) AS c FROM link_events "
                "WHERE slug=%s AND bot=0 GROUP BY kind",
                (slug,),
            )
            kind_counts = {r["kind"]: r["c"] for r in cur.fetchall()}
            cur.execute(
                "SELECT MAX(occurred_at) AS t FROM link_events WHERE slug=%s AND bot=0",
                (slug,),
            )
            last_scan = cur.fetchone()["t"]

            # Chart + breakdowns respect the selected window.
            where = "slug=%s AND bot=0"
            params: list = [slug]
            if since is not None:
                where += " AND occurred_at >= %s"
                params.append(since)
            cur.execute(
                f"SELECT DATE(occurred_at) AS day, kind, COUNT(*) AS c FROM link_events "
                f"WHERE {where} GROUP BY DATE(occurred_at), kind ORDER BY day",
                params,
            )
            daily_map: dict[str, dict[str, int]] = {}
            for r in cur.fetchall():
                bucket = daily_map.setdefault(r["day"].isoformat(), {"scan": 0, "click": 0})
                if r["kind"] in bucket:
                    bucket[r["kind"]] = r["c"]
            daily = [
                {"day": day, "scan": v["scan"], "click": v["click"], "count": v["scan"] + v["click"]}
                for day, v in sorted(daily_map.items())
            ]

            breakdowns = {}
            for dim, column in _BREAKDOWN_COLUMNS.items():
                if dim == "kind":
                    continue  # shown as the scan/click stat tiles instead
                breakdowns[dim] = _top(_grouped_counts(cur, slug, column, since))
            breakdowns["source"] = _top(_source_counts(cur, slug, since))

            cur.execute(
                """
                SELECT occurred_at, kind, device_class, os_family, referrer,
                       country, region, bot
                FROM link_events
                WHERE slug = %s
                ORDER BY occurred_at DESC
                LIMIT 100
                """,
                (slug,),
            )
            events = cur.fetchall()

    scan_count = kind_counts.get("scan", 0)
    click_count = kind_counts.get("click", 0)
    return {
        "link": _with_url(row),
        "tracked": True,
        "days": window,
        "total_scans": scan_count + click_count,
        "scan_count": scan_count,
        "click_count": click_count,
        "last_scan": last_scan,
        "daily": daily,
        "breakdowns": breakdowns,
        "events": events,
    }


@router.get("/{slug}/breakdown/{dimension}")
def breakdown(slug: str, dimension: str, request: Request, days: int = 30) -> dict:
    """Full ranked list for one dimension — the drill-down behind a
    detail-page top-10 panel's "View all" link."""
    require_admin(request)
    if dimension != "source" and dimension not in _BREAKDOWN_COLUMNS:
        raise HTTPException(status_code=404, detail="unknown dimension")
    window = _day_window(days)
    since = _since(window)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
            if row is None:
                raise HTTPException(status_code=404, detail="unknown link")
            if row["static"]:
                raise HTTPException(status_code=422, detail="static link is not tracked")
            if dimension == "source":
                rows = _source_counts(cur, slug, since)
            else:
                rows = _grouped_counts(cur, slug, _BREAKDOWN_COLUMNS[dimension], since)
    total = sum(r["c"] for r in rows)
    items = [
        {
            "key": r["k"] if r["k"] not in (None, "") else "unknown",
            "count": r["c"],
            "pct": round(r["c"] / total * 100, 1) if total else 0.0,
        }
        for r in rows
    ]
    return {
        "link": _with_url(row),
        "dimension": dimension,
        "days": window,
        "total_count": total,
        "items": items,
    }


@router.patch("/{slug}")
async def update(slug: str, request: Request) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    placement_keys = ("source", "medium", "campaign", "placement")
    placement = (
        {k: body[k] for k in placement_keys if k in body}
        if any(k in body for k in placement_keys)
        else None
    )
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                row = update_link(
                    cur,
                    slug,
                    destination=body.get("destination"),
                    label=body.get("label"),
                    active=body.get("active"),
                    placement=placement,
                )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="unknown link") from exc
    except FenceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"link": _with_url(row)}


@router.get("/{slug}/qr.svg")
def qr_svg(slug: str, request: Request) -> Response:
    require_admin(request)
    return _qr_response(slug, "svg", "image/svg+xml")


@router.get("/{slug}/qr.png")
def qr_png(slug: str, request: Request) -> Response:
    require_admin(request)
    return _qr_response(slug, "png", "image/png")


def _qr_response(slug: str, fmt: str, media_type: str) -> Response:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="unknown link")
    payload = row["destination"] if row["static"] else _short_url(slug)
    try:
        image = qr_render(payload, fmt=fmt)
    except QrRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return Response(content=image, media_type=media_type, headers={"Cache-Control": "no-store"})


@router.get("/{slug}/qr-dev-test.svg")
def qr_dev_test(slug: str, request: Request, host: str) -> Response:
    """Dev-only, camera-scannable QR encoding the CALLER'S OWN network
    address instead of the fixed production short link (LK-L0). Exists so
    the full redirect→worker→event pipeline can be scanned and verified on
    StudioTwo before anything is promoted to labs.fattail.ai. Never the
    artifact that gets printed or downloaded — that is always qr.svg/
    qr.png/qr-card.png, which always encode the production host."""
    if get_config().env != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    require_admin(request)
    parsed = urlsplit(host)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.path:
        raise HTTPException(status_code=422, detail="host must be a bare origin, e.g. http://studiotwo:3000")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="unknown link")
    if row["static"]:
        raise HTTPException(status_code=422, detail="static link is not tracked")
    payload = f"{parsed.scheme}://{parsed.netloc}/q/{slug}"
    try:
        image = qr_render(payload, fmt="svg")
    except QrRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return Response(content=image, media_type="image/svg+xml", headers={"Cache-Control": "no-store"})


@router.get("/{slug}/qr-card.png")
def qr_card_png(slug: str, request: Request) -> Response:
    """QR with its label printed under it (display-only compositing — the
    law-bound renderer in links.qr is untouched; the decoded payload is
    still exactly the short link or, for a static code, the destination)."""
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="unknown link")
    payload = row["destination"] if row["static"] else _short_url(slug)
    try:
        base_png = qr_render(payload, fmt="png")
    except QrRefused as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    card = _compose_card(base_png, row["label"])
    filename = f"{_slugify(row['label'])}-{slug}.png"
    return Response(
        content=card,
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


def _compose_card(qr_png: bytes, label: str) -> bytes:
    with Image.open(io.BytesIO(qr_png)) as src:
        qr_img = src.convert("RGB")
    margin = qr_img.width // 12
    band_h = max(48, qr_img.height // 5)
    width = qr_img.width + margin * 2
    height = qr_img.height + margin * 2 + band_h
    canvas = Image.new("RGB", (width, height), "#ffffff")
    canvas.paste(qr_img, (margin, margin))
    band = (margin, margin + qr_img.height + margin // 2, width - margin, margin + qr_img.height + margin // 2 + band_h)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(band, radius=10, fill="#111111")
    text = label if label else ""
    font, tw, th, bbox = _fit_font(draw, text, band[2] - band[0] - 24, band[3] - band[1] - 16)
    tx = band[0] + ((band[2] - band[0]) - tw) / 2 - bbox[0]
    ty = band[1] + ((band[3] - band[1]) - th) / 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill="#ffffff")
    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def _fit_font(draw: "ImageDraw.ImageDraw", text: str, max_w: int, max_h: int):
    size = max_h
    while size >= 10:
        font = ImageFont.load_default(size=size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if tw <= max_w and th <= max_h:
            return font, tw, th, bbox
        size -= 2
    font = ImageFont.load_default(size=10)
    bbox = draw.textbbox((0, 0), text, font=font)
    return font, bbox[2] - bbox[0], bbox[3] - bbox[1], bbox


def _slugify(label: str) -> str:
    out = "".join(c.lower() if c.isalnum() else "-" for c in label).strip("-")
    while "--" in out:
        out = out.replace("--", "-")
    return out or "link"


@router.get("/{slug}/events.csv")
def events_csv(slug: str, request: Request) -> Response:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = get_link(cur, slug)
            if row is None:
                raise HTTPException(status_code=404, detail="unknown link")
            cur.execute(
                """
                SELECT occurred_at, slug, kind, device_class, os_family, referrer,
                       country, region, bot
                FROM link_events
                WHERE slug = %s
                ORDER BY occurred_at DESC
                """,
                (slug,),
            )
            events = cur.fetchall()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "timestamp",
            "slug",
            "kind",
            "device_class",
            "os_family",
            "referrer",
            "country",
            "region",
            "bot",
        ]
    )
    for e in events:
        writer.writerow(
            [
                e["occurred_at"].isoformat(),
                e["slug"],
                e["kind"],
                e["device_class"],
                e["os_family"],
                e["referrer"],
                e["country"],
                e["region"],
                "1" if e["bot"] else "0",
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{slug}-events.csv"'},
    )
