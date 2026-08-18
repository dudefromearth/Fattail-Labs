/**
 * T Ortho Easter Egg lifecycle.
 * The view lives only while a position is on the Position List.
 * Capture is optional — for journal users who want to keep a picture.
 */

import { nyWall } from "./timeOrthoSession";

export function shouldExitTimeOrtho(
  hadPositions: boolean,
  remaining: number,
): boolean {
  return hadPositions && remaining <= 0;
}

export function journalDateYmd(nowMs = Date.now()): string {
  const w = nyWall(nowMs);
  return `${w.year}-${String(w.month).padStart(2, "0")}-${String(w.day).padStart(2, "0")}`;
}

export function captureFilename(
  symbol: string,
  dateYmd: string,
): string {
  const sym = (symbol || "underlier").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `t-ortho-${sym || "underlier"}-${dateYmd}.png`;
}

export function captureCaption(input: {
  symbol: string;
  dateYmd: string;
  positions: Array<{ label?: string; notation?: string }>;
  note?: string | null;
}): string {
  const names = input.positions
    .map((p) => p.label || p.notation || "")
    .filter(Boolean);
  const book = names.length
    ? `On the book: ${names.join(" · ")}.`
    : "No position on the book.";
  return [`T Ortho · ${input.symbol} · ${input.dateYmd}`, book, input.note || ""]
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

/** Composite the day tape under the transparent 3D surface. */
export function compositeCanvases(
  tape: HTMLCanvasElement,
  surface: HTMLCanvasElement | null,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  const w = Math.max(1, tape.width || 1);
  const h = Math.max(1, tape.height || 1);
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return out;
  ctx.fillStyle = "#0a0a0e";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(tape, 0, 0, w, h);
  if (surface && surface.width > 0 && surface.height > 0) {
    ctx.drawImage(surface, 0, 0, w, h);
  }
  return out;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode this view as a PNG."));
    }, "image/png");
  });
}

export function downloadBlob(file: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
