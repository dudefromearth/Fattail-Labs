"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import { localSessionNote } from "@/lib/options-lab/timeOrthoNote";
import { chartWindow } from "@/lib/options-lab/timeOrthoSession";

const NARRATIVE_POS_KEY = "ft_options_lab_narrative_pos_v1";
const AI_EVERY_MS = 3 * 60 * 1000;
const EDGE = 16;

function loadNarrativePos(): { x: number; y: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(NARRATIVE_POS_KEY);
    if (!s) return null;
    const p = JSON.parse(s) as { x?: number; y?: number };
    if (typeof p.x === "number" && typeof p.y === "number") return { x: p.x, y: p.y };
  } catch {
    /* ignore */
  }
  return null;
}

function clampPos(
  x: number,
  y: number,
  elW: number,
  elH: number,
  parentW: number,
  parentH: number,
): { x: number; y: number } {
  const maxX = Math.max(EDGE, parentW - elW - EDGE);
  const maxY = Math.max(EDGE, parentH - elH - EDGE);
  return {
    x: Math.min(maxX, Math.max(EDGE, x)),
    y: Math.min(maxY, Math.max(EDGE, y)),
  };
}

export default function TimeOrthoEggPanel({
  symbol,
  positions,
  lastMid,
  bookPnl,
  bookState,
}: {
  symbol: string;
  positions: AnalyzerPosition[];
  lastMid: number | null;
  bookPnl: number | null;
  bookState: string | null;
}) {
  const win = chartWindow(Date.now());
  const visible = positions.filter((p) => p.visible !== false);
  const [note, setNote] = useState(() =>
    localSessionNote({
      symbol,
      phase: win.prefillsPriorDay ? "pre" : "rth",
      positions: visible.map((p) => ({ label: p.label, notation: p.notation })),
      lastMid,
      bookPnl,
      bookState,
    }),
  );
  const [source, setSource] = useState<"local" | "model">("local");
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(
    () => loadNarrativePos(),
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    dx: number;
    dy: number;
    parent: DOMRect;
  } | null>(null);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const parent = (el.offsetParent as HTMLElement | null) ?? el.parentElement;
    if (!parent) return;
    const fit = () => {
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setFloatPos((prev) => {
        const raw = prev ?? {
          x: Math.max(EDGE, pw - w - EDGE),
          y: EDGE,
        };
        const next = clampPos(raw.x, raw.y, w, h, pw, ph);
        if (prev && next.x === prev.x && next.y === prev.y) return prev;
        return next;
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const payload = {
      symbol,
      phase: win.prefillsPriorDay ? "pre" : "rth",
      positions: visible.map((p) => ({ label: p.label, notation: p.notation })),
      lastMid,
      bookPnl,
      bookState,
    };
    setNote(localSessionNote(payload));
    let alive = true;
    const run = async () => {
      try {
        const r = await fetch("/api/me/options-lab/session-note", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!alive || !r.ok) return;
        const doc = (await r.json()) as { text?: string; source?: string };
        if (doc.text) {
          setNote(doc.text);
          setSource(doc.source === "model" ? "model" : "local");
        }
      } catch {
        /* keep local note */
      }
    };
    void run();
    const id = window.setInterval(() => void run(), AI_EVERY_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    symbol,
    lastMid,
    bookPnl,
    bookState,
    win.prefillsPriorDay,
    positions.map((p) => `${p.id}:${p.visible}:${p.label}`).join("|"),
  ]);

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-20 w-[min(22rem,calc(100%-2rem))] rounded-2xl border border-white/12 bg-black/70 px-4 py-3 text-[18px] leading-snug text-white/75"
      data-testid="surface-time-ortho-copy"
      style={
        floatPos
          ? { left: floatPos.x, top: floatPos.y, right: "auto" }
          : { right: EDGE, top: EDGE }
      }
    >
      <div
        className="cursor-grab text-[16.5px] font-semibold uppercase tracking-[0.14em] text-white/90 active:cursor-grabbing"
        data-testid="surface-time-ortho-drag"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const el = panelRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const parent = el.offsetParent?.getBoundingClientRect() ?? r;
          dragRef.current = {
            dx: e.clientX - r.left,
            dy: e.clientY - r.top,
            parent,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          const el = panelRef.current;
          if (!d || !el) return;
          const parent = el.offsetParent as HTMLElement | null;
          const pw = parent?.clientWidth ?? d.parent.width;
          const ph = parent?.clientHeight ?? d.parent.height;
          const x = e.clientX - d.parent.left - d.dx;
          const y = e.clientY - d.parent.top - d.dy;
          setFloatPos(clampPos(x, y, el.offsetWidth, el.offsetHeight, pw, ph));
        }}
        onPointerUp={(e) => {
          if (!dragRef.current) return;
          dragRef.current = null;
          try {
            const el = panelRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const parent = el.offsetParent?.getBoundingClientRect() ?? r;
            const host = el.offsetParent as HTMLElement | null;
            const next = clampPos(
              r.left - parent.left,
              r.top - parent.top,
              el.offsetWidth,
              el.offsetHeight,
              host?.clientWidth ?? parent.width,
              host?.clientHeight ?? parent.height,
            );
            setFloatPos(next);
            localStorage.setItem(NARRATIVE_POS_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }}
      >
        Live session · {symbol}
      </div>
      <p className="mt-2 text-white/55" data-testid="surface-time-ortho-ai">
        <span className="mr-1 uppercase tracking-wider text-white/40">
          {source === "model" ? "AI" : "Note"}
        </span>
        {note}
      </p>
    </div>
  );
}
