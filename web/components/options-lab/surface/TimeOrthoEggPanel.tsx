"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import { localSessionNote } from "@/lib/options-lab/timeOrthoNote";
import { chartWindow } from "@/lib/options-lab/timeOrthoSession";
import {
  loadTapePrefs,
  minToTimeValue,
  saveTapePrefs,
  TAPE_CANDLE_KINDS,
  timeValueToMin,
  type SessionLabelAlign,
  type TapeAxisContent,
  type TapeAxisSide,
  type TapePrefs,
} from "@/lib/options-lab/timeOrthoTapePrefs";

const NARRATIVE_POS_KEY = "ft_options_lab_narrative_pos_v1";

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

const AI_EVERY_MS = 3 * 60 * 1000;

export default function TimeOrthoEggPanel({
  symbol,
  positions,
  lastMid,
  bookPnl,
  bookState,
  onToggleVisibility,
  onSendToTradeLog,
  onClosePosition,
  onRemovePosition,
  onCapture,
  captureBusy = false,
}: {
  symbol: string;
  positions: AnalyzerPosition[];
  lastMid: number | null;
  bookPnl: number | null;
  bookState: string | null;
  onToggleVisibility: (id: string) => void;
  onSendToTradeLog: (id: string) => void;
  onClosePosition: (id: string) => void;
  onRemovePosition: (id: string) => void;
  onCapture: () => void;
  captureBusy?: boolean;
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
  const [prefs, setPrefs] = useState<TapePrefs>(() => loadTapePrefs());
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(
    () => loadNarrativePos(),
  );
  const dragRef = useRef<{
    dx: number;
    dy: number;
    parent: DOMRect;
  } | null>(null);

  const patchPrefs = (partial: Partial<TapePrefs>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    saveTapePrefs(next);
  };

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
    // positions identity via labels — parent persists visibility
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
      className="pointer-events-auto absolute z-20 max-h-[calc(100%-6rem)] w-[min(24rem,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-white/12 bg-black/70 px-4 py-3 text-[18px] leading-snug text-white/75"
      data-testid="surface-time-ortho-copy"
      style={
        floatPos
          ? { left: floatPos.x, top: floatPos.y, right: "auto" }
          : { right: 12, top: 64 }
      }
    >
      <div
        className="cursor-grab text-[16.5px] font-semibold uppercase tracking-[0.14em] text-white/90 active:cursor-grabbing"
        data-testid="surface-time-ortho-drag"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const el = e.currentTarget.parentElement;
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
          if (!d) return;
          const x = Math.max(8, e.clientX - d.parent.left - d.dx);
          const y = Math.max(8, e.clientY - d.parent.top - d.dy);
          setFloatPos({ x, y });
        }}
        onPointerUp={(e) => {
          if (!dragRef.current) return;
          dragRef.current = null;
          try {
            const el = e.currentTarget.parentElement;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const parent = el.offsetParent?.getBoundingClientRect() ?? r;
            const next = { x: r.left - parent.left, y: r.top - parent.top };
            setFloatPos(next);
            localStorage.setItem(NARRATIVE_POS_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }}
      >
        Live session · {symbol}
        <span className="ml-2 font-normal normal-case tracking-normal text-white/35">
          drag
        </span>
      </div>
      <p className="mt-1.5">
        This is your position sitting on a live {symbol} market. The tape is
        the trading day: pre-market on the left, cash open just past the
        controls, Morning · Afternoon · Closing across the window, and
        post-market on the right. Empty grid after the last print — candle
        width stays even. Updates run through the session as the book’s mark —
        profitability of what you have on, not a forecast. Hide, show, or add
        a position. Remove the last one from the list and this view goes with
        it — capture it to the journal if you want to keep a picture.
      </p>
      <p className="mt-2 text-white/55" data-testid="surface-time-ortho-ai">
        <span className="mr-1 uppercase tracking-wider text-white/40">
          {source === "model" ? "AI" : "Note"}
        </span>
        {note}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div
          className="text-[16.5px] font-semibold uppercase tracking-[0.14em] text-white/90"
          data-testid="surface-time-ortho-pos-heading"
        >
          Position List
          {positions.length > 0 ? (
            <span className="ml-1 font-normal normal-case tracking-normal text-white/50">
              ({positions.length})
            </span>
          ) : null}
        </div>
        <Link
          href="/app/options-lab/analyzer?builder=1"
          className="rounded-full border border-white/25 px-2.5 py-0.5 text-[16.5px] text-white/90"
          data-testid="surface-time-ortho-add"
        >
          Add position
        </Link>
      </div>
      <ul className="mt-2 space-y-1" data-testid="surface-time-ortho-positions">
        {positions.length === 0 ? (
          <li className="text-white/45">
            No positions on this symbol. Add one to put it on the book.
          </li>
        ) : (
          positions.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-2"
              data-visible={p.visible === false ? "0" : "1"}
            >
              <span
                className={
                  "min-w-0 flex-1 truncate " +
                  (p.visible === false ? "text-white/40" : "text-white/85")
                }
              >
                {p.label || p.notation}
              </span>
              <button
                type="button"
                className="rounded-full border border-white/20 px-2 py-0.5 text-[16.5px] text-white/85"
                data-testid={`surface-time-ortho-vis-${p.id}`}
                aria-label={
                  p.visible === false
                    ? `Show ${p.label || p.notation}`
                    : `Hide ${p.label || p.notation}`
                }
                onClick={() => onToggleVisibility(p.id)}
              >
                {p.visible === false ? "Show" : "Hide"}
              </button>
              {p.closedAt == null ? (
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-2 py-0.5 text-[16.5px] text-white/85"
                  data-testid={`surface-time-ortho-close-${p.id}`}
                  onClick={() => onClosePosition(p.id)}
                >
                  Close
                </button>
              ) : (
                <span className="text-white/45">Closed</span>
              )}
              <button
                type="button"
                className="rounded-full border border-white/20 px-2 py-0.5 text-[16.5px] text-white/85"
                data-testid={`surface-time-ortho-send-${p.id}`}
                onClick={() => onSendToTradeLog(p.id)}
              >
                To Trade Log
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 px-2 py-0.5 text-[16.5px] text-white/85"
                data-testid={`surface-time-ortho-remove-${p.id}`}
                onClick={() => onRemovePosition(p.id)}
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-white/25 px-2.5 py-0.5 text-[16.5px] text-white/90 disabled:opacity-50"
          data-testid="surface-time-ortho-capture"
          title="Save this view to today’s journal"
          disabled={captureBusy}
          onClick={() => onCapture()}
        >
          {captureBusy ? "Capturing…" : "Capture"}
        </button>
        <Link
          href="/app/options-lab/analyzer"
          className="rounded-full border border-white/25 px-2.5 py-0.5 text-[16.5px] text-white/90"
        >
          Open Analyzer (2D)
        </Link>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2 text-[16.5px] text-white/70">
        <div className="flex flex-wrap items-center gap-1">
          <span className="uppercase tracking-wider text-white/40">Candles</span>
          {TAPE_CANDLE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={
                "rounded-full border px-2 py-0.5 " +
                (prefs.candleKind === k.id
                  ? "border-white/50 text-white"
                  : "border-white/15 text-white/60")
              }
              onClick={() => patchPrefs({ candleKind: k.id })}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="uppercase tracking-wider text-white/40">Labels</span>
          {(["top", "middle", "bottom"] as SessionLabelAlign[]).map((a) => (
            <button
              key={a}
              type="button"
              className={
                "rounded-full border px-2 py-0.5 capitalize " +
                (prefs.labelAlign === a
                  ? "border-white/50 text-white"
                  : "border-white/15 text-white/60")
              }
              onClick={() => patchPrefs({ labelAlign: a })}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="uppercase tracking-wider text-white/40">
            Sessions
          </span>
          <label className="inline-flex items-center gap-1">
            Noon
            <input
              type="time"
              className="rounded bg-black/40 px-1 py-0.5 text-white"
              value={minToTimeValue(prefs.noonMin)}
              onChange={(e) => {
                const n = timeValueToMin(e.target.value);
                if (n != null) patchPrefs({ noonMin: n });
              }}
            />
          </label>
          <label className="inline-flex items-center gap-1">
            Close split
            <input
              type="time"
              className="rounded bg-black/40 px-1 py-0.5 text-white"
              value={minToTimeValue(prefs.closeSplitMin)}
              onChange={(e) => {
                const n = timeValueToMin(e.target.value);
                if (n != null) patchPrefs({ closeSplitMin: n });
              }}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="uppercase tracking-wider text-white/40">Axis</span>
          {(["right", "left", "both"] as TapeAxisSide[]).map((s) => (
            <button
              key={s}
              type="button"
              className={
                "rounded-full border px-2 py-0.5 capitalize " +
                (prefs.axisSide === s
                  ? "border-white/50 text-white"
                  : "border-white/15 text-white/60")
              }
              onClick={() => patchPrefs({ axisSide: s })}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="uppercase tracking-wider text-white/40">Show</span>
          {(
            [
              ["both", "px + K"],
              ["ticker", "ticker"],
              ["strikes", "strikes"],
            ] as Array<[TapeAxisContent, string]>
          ).map(([id, lab]) => (
            <button
              key={id}
              type="button"
              className={
                "rounded-full border px-2 py-0.5 " +
                (prefs.axisContent === id
                  ? "border-white/50 text-white"
                  : "border-white/15 text-white/60")
              }
              onClick={() => patchPrefs({ axisContent: id })}
            >
              {lab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
