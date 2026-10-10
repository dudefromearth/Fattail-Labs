"""QR renderings of a short link (LK-L4).

Error-correction is L, M, Q, or H. A center logo forces H.
The logo is off unless the caller turns the FatTail mark on.
Contrast that will not scan is refused. The image is decoded
before it is returned.
"""

from __future__ import annotations

import base64
import io
import xml.etree.ElementTree as ET
from pathlib import Path

import segno
import zxingcpp
from PIL import Image, ImageColor

class QrRefused(Exception):
    """Contrast failed, or the image did not decode. Nothing is offered."""


_LEVELS = {"L": "l", "M": "m", "Q": "q", "H": "h"}
_QUIET = 4
_SCALE = 8
_MIN_CONTRAST = 3.0
_SVG = "http://www.w3.org/2000/svg"


def render(
    payload,
    *,
    fmt,
    error="M",
    logo=False,
    dark="#000000",
    light="#ffffff",
) -> bytes:
    """Return one SVG or PNG. The FatTail mark is the only logo, and it is off by default."""
    if not isinstance(payload, str) or not payload:
        raise TypeError("payload")
    if not isinstance(logo, bool):
        raise TypeError("logo")
    kind = _fmt(fmt)
    level = _level(error, logo)
    dark_rgb = _rgb(dark)
    light_rgb = _rgb(light)
    if not _contrast_ok(dark_rgb, light_rgb):
        raise QrRefused("contrast")
    drawing = _draw(payload, level, dark_rgb, light_rgb, logo)
    raw = _svg_bytes(drawing) if kind == "svg" else _png_bytes(drawing)
    text, got = decode_image(raw, kind)
    if text != payload or got != level.upper():
        raise QrRefused("decode")
    return raw


def decode_image(image: bytes, fmt: str) -> tuple[str, str]:
    """Read the short link and the error-correction level from SVG or PNG bytes."""
    kind = _fmt(fmt)
    if not isinstance(image, (bytes, bytearray)) or not image:
        raise QrRefused("decode")
    if kind == "png":
        with Image.open(io.BytesIO(image)) as src:
            img = src.convert("RGB")
    else:
        img = _rasterize_svg(bytes(image))
    found = zxingcpp.read_barcodes(
        img,
        formats=zxingcpp.BarcodeFormat.QRCode,
        try_rotate=False,
        try_invert=False,
    )
    if len(found) != 1 or not found[0].valid:
        raise QrRefused("decode")
    text = found[0].text
    level = found[0].ec_level
    if not isinstance(text, str) or not text:
        raise QrRefused("decode")
    if level not in _LEVELS:
        raise QrRefused("decode")
    return text, level


def _fmt(fmt) -> str:
    if not isinstance(fmt, str):
        raise TypeError("fmt")
    kind = fmt.strip().lower()
    if kind not in ("svg", "png"):
        raise ValueError("fmt")
    return kind


def _level(error, logo: bool) -> str:
    if not isinstance(error, str):
        raise TypeError("error")
    key = error.strip().upper()
    if key not in _LEVELS:
        raise ValueError("error")
    if logo:
        return "h"
    return _LEVELS[key]


def _rgb(color) -> tuple[int, int, int]:
    if not isinstance(color, str) or not color.strip():
        raise TypeError("color")
    parsed = ImageColor.getrgb(color.strip())
    if len(parsed) == 4:
        red, green, blue, alpha = parsed
        scale = alpha / 255
        return (
            round(red * scale + 255 * (1 - scale)),
            round(green * scale + 255 * (1 - scale)),
            round(blue * scale + 255 * (1 - scale)),
        )
    return parsed[0], parsed[1], parsed[2]


def _channel(value: int) -> float:
    scale = value / 255
    if scale <= 0.04045:
        return scale / 12.92
    return ((scale + 0.055) / 1.055) ** 2.4


def _luminance(rgb: tuple[int, int, int]) -> float:
    red, green, blue = rgb
    return 0.2126 * _channel(red) + 0.7152 * _channel(green) + 0.0722 * _channel(blue)


def _contrast_ok(dark: tuple[int, int, int], light: tuple[int, int, int]) -> bool:
    dark_l = _luminance(dark)
    light_l = _luminance(light)
    if dark_l >= light_l:
        return False
    return (light_l + 0.05) / (dark_l + 0.05) >= _MIN_CONTRAST


class _Drawing:
    def __init__(self, size, scale, light, dark, modules, pad, mark):
        self.size = size
        self.scale = scale
        self.light = light
        self.dark = dark
        self.modules = modules
        self.pad = pad
        self.mark = mark


def _draw(payload: str, level: str, dark, light, logo: bool) -> _Drawing:
    code = segno.make_qr(payload, error=level, boost_error=False)
    if str(code.error).lower() != level:
        raise QrRefused("error level")
    matrix = code.matrix
    modules_n = len(matrix)
    scale = _SCALE
    quiet = _QUIET
    size = (modules_n + quiet * 2) * scale
    modules = []
    for y, row in enumerate(matrix):
        for x, cell in enumerate(row):
            if cell:
                modules.append(((x + quiet) * scale, (y + quiet) * scale))
    pad = None
    mark = None
    if logo:
        pad, mark = _mark(modules_n, scale, size)
    return _Drawing(size, scale, light, dark, modules, pad, mark)


def _mark_path() -> Path:
    root = Path(__file__).resolve().parents[2]
    for rel in ("web/app/icon.png", "web/icon.png"):
        path = root / rel
        if path.is_file():
            return path
    raise QrRefused("mark")


def _logo_modules(count: int) -> int:
    box = int(count * 0.28)
    if box % 2 == 0:
        box -= 1
    limit = count - 16
    if limit < 1:
        limit = 1
    if limit % 2 == 0:
        limit -= 1
    if box > limit:
        box = limit
    if box < 1:
        box = 1
    return box


def _mark(modules_n: int, scale: int, size: int):
    box = _logo_modules(modules_n)
    with Image.open(_mark_path()) as src:
        mark = src.convert("RGBA")
    mark.thumbnail((box * scale, box * scale), Image.Resampling.LANCZOS)
    cx = size // 2
    cy = size // 2
    pad_w = mark.size[0] + scale * 2
    pad_h = mark.size[1] + scale * 2
    pad = (cx - pad_w // 2, cy - pad_h // 2, pad_w, pad_h)
    origin = (cx - mark.size[0] // 2, cy - mark.size[1] // 2)
    buf = io.BytesIO()
    mark.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return pad, (origin[0], origin[1], mark.size[0], mark.size[1], encoded, mark)


def _png_bytes(drawing: _Drawing) -> bytes:
    img = _paint(drawing, drawing.mark[5] if drawing.mark else None)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _paint(drawing: _Drawing, mark_image) -> Image.Image:
    img = Image.new("RGB", (drawing.size, drawing.size), drawing.light)
    block = Image.new("RGB", (drawing.scale, drawing.scale), drawing.dark)
    for x, y in drawing.modules:
        img.paste(block, (x, y))
    if drawing.pad and mark_image is not None:
        px, py, pw, ph = drawing.pad
        img.paste(Image.new("RGB", (pw, ph), drawing.light), (px, py))
        mx, my = drawing.mark[0], drawing.mark[1]
        img.paste(mark_image, (mx, my), mark_image)
    return img


def _hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def _svg_bytes(drawing: _Drawing) -> bytes:
    light = _hex(drawing.light)
    dark = _hex(drawing.dark)
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        (
            f'<svg xmlns="{_SVG}" width="{drawing.size}" height="{drawing.size}" '
            f'viewBox="0 0 {drawing.size} {drawing.size}">'
        ),
        f'<rect x="0" y="0" width="{drawing.size}" height="{drawing.size}" fill="{light}"/>',
    ]
    step = drawing.scale
    for x, y in drawing.modules:
        lines.append(f'<rect x="{x}" y="{y}" width="{step}" height="{step}" fill="{dark}"/>')
    if drawing.pad and drawing.mark:
        px, py, pw, ph = drawing.pad
        lines.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{light}"/>')
        mx, my, mw, mh, encoded, _image = drawing.mark
        lines.append(
            f'<image x="{mx}" y="{my}" width="{mw}" height="{mh}" '
            f'href="data:image/png;base64,{encoded}"/>'
        )
    lines.append("</svg>")
    return "\n".join(lines).encode("utf-8")


def _rasterize_svg(raw: bytes) -> Image.Image:
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise QrRefused("decode") from exc
    try:
        width = int(float(root.get("width") or "0"))
        height = int(float(root.get("height") or "0"))
    except ValueError as exc:
        raise QrRefused("decode") from exc
    if width < 1 or height < 1 or width > 4096 or height > 4096:
        raise QrRefused("decode")
    img = Image.new("RGB", (width, height), "#ffffff")
    for elem in root.iter():
        tag = elem.tag.split("}")[-1]
        if tag == "rect":
            _fill_rect(img, elem)
        elif tag == "image":
            _paste_image(img, elem)
    return img


def _fill_rect(img: Image.Image, elem) -> None:
    try:
        x = int(float(elem.get("x") or "0"))
        y = int(float(elem.get("y") or "0"))
        w = int(float(elem.get("width") or "0"))
        h = int(float(elem.get("height") or "0"))
    except ValueError as exc:
        raise QrRefused("decode") from exc
    fill = elem.get("fill")
    if not fill or w < 1 or h < 1:
        raise QrRefused("decode")
    img.paste(Image.new("RGB", (w, h), _parse_hex(fill)), (x, y))


def _paste_image(img: Image.Image, elem) -> None:
    href = elem.get("href") or ""
    if not href.startswith("data:image/png;base64,"):
        raise QrRefused("decode")
    try:
        blob = base64.b64decode(href.split(",", 1)[1], validate=True)
        x = int(float(elem.get("x") or "0"))
        y = int(float(elem.get("y") or "0"))
    except (ValueError, TypeError) as exc:
        raise QrRefused("decode") from exc
    with Image.open(io.BytesIO(blob)) as src:
        overlay = src.convert("RGBA")
    img.paste(overlay, (x, y), overlay)


def _parse_hex(value: str) -> tuple[int, int, int]:
    text = value.strip()
    if not text.startswith("#"):
        raise QrRefused("decode")
    text = text[1:]
    if len(text) == 3:
        text = "".join(ch * 2 for ch in text)
    if len(text) != 6:
        raise QrRefused("decode")
    try:
        return tuple(int(text[i : i + 2], 16) for i in (0, 2, 4))
    except ValueError as exc:
        raise QrRefused("decode") from exc
