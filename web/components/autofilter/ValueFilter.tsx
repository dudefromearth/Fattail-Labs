"use client";

/**
 * Value-list Autofilter dropdown. Extracted from Campaign Find and Badge.
 * Select-time (O3): disabledValues greys out structurally impossible picks.
 */

import { useEffect, useRef, useState } from "react";
import FilterMenuPortal from "@/components/autofilter/FilterMenuPortal";

export default function ValueFilter({
  col,
  label,
  values,
  labels,
  applied,
  open,
  onOpen,
  onApply,
  onClear,
  disabledValues,
}: {
  col: string;
  label: string;
  values: string[];
  labels?: Map<string, string>;
  applied: string[] | undefined;
  open: boolean;
  onOpen: (k: string | null) => void;
  onApply: (k: string, picked: string[] | null) => void;
  onClear: (k: string) => void;
  /** value → reason (O3 select-time). */
  disabledValues?: Map<string, string>;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const active = applied != null && applied.length > 0;

  useEffect(() => {
    if (!open) return;
    setQ("");
    setPicked(new Set(applied && applied.length ? applied : values));
  }, [open, applied, values]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (box.current?.contains(t) || menu.current?.contains(t)) return;
      onOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpen]);

  const shown = values.filter((v) =>
    (labels?.get(v) || v).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const allOn = shown.length > 0 && shown.every((v) => picked.has(v));

  return (
    <div className="relative inline-flex" ref={box}>
      <button
        type="button"
        className={[
          "inline-flex h-4 w-4 items-center justify-center rounded-[2px] border text-[9px] leading-none",
          active
            ? "border-[var(--color-tint)] bg-[var(--color-tint-soft)] text-[var(--color-tint-emphasis)]"
            : "border-[var(--color-separator)] bg-[var(--color-fill)] text-[var(--color-label-tertiary)]",
        ].join(" ")}
        aria-label={`Filter ${label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid={`autofilter-${col}`}
        data-filtered={active ? "1" : "0"}
        onClick={() => onOpen(open ? null : col)}
      >
        ▾
      </button>
      <FilterMenuPortal
        open={open}
        anchorRef={box}
        menuRef={menu}
        width={224}
      >
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-2 shadow-[var(--elevation-2)]"
          role="listbox"
          data-testid={`autofilter-menu-${col}`}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1 text-xs"
          />
          <label className="mt-2 flex items-center gap-2 border-b border-[var(--color-separator)] pb-1.5 text-xs text-[var(--color-label)]">
            <input
              type="checkbox"
              checked={allOn}
              onChange={() => {
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (allOn) shown.forEach((v) => next.delete(v));
                  else shown.forEach((v) => next.add(v));
                  return next;
                });
              }}
            />
            (Select All)
          </label>
          <ul className="mt-1 max-h-44 overflow-auto">
            {shown.map((v) => {
              const blocked = disabledValues?.get(v);
              return (
                <li key={v}>
                  <label
                    className={[
                      "flex items-center gap-2 py-0.5 text-xs",
                      blocked
                        ? "cursor-not-allowed text-[var(--color-label-tertiary)]"
                        : "text-[var(--color-label)]",
                    ].join(" ")}
                    title={blocked || undefined}
                  >
                    <input
                      type="checkbox"
                      checked={picked.has(v)}
                      disabled={!!blocked}
                      onChange={() => {
                        if (blocked) return;
                        setPicked((prev) => {
                          const next = new Set(prev);
                          if (next.has(v)) next.delete(v);
                          else next.add(v);
                          return next;
                        });
                      }}
                    />
                    <span className="truncate">{labels?.get(v) || v}</span>
                  </label>
                  {blocked ? (
                    <p className="pl-6 text-[10px] text-[var(--color-label-tertiary)]">
                      {blocked}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex justify-end gap-1.5">
            <button
              type="button"
              className="rounded px-2 py-1 text-[11px] text-[var(--color-label-secondary)]"
              onClick={() => {
                onClear(col);
                onOpen(null);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="rounded bg-[var(--color-tint)] px-2 py-1 text-[11px] font-medium text-[var(--color-on-tint)]"
              onClick={() => {
                const all =
                  values.length > 0 && values.every((v) => picked.has(v));
                onApply(col, all ? null : [...picked]);
                onOpen(null);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </FilterMenuPortal>
    </div>
  );
}
