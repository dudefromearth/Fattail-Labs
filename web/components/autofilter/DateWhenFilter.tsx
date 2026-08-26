"use client";

/**
 * When AutoFilter — calendar stages: year → month → day.
 * Multiple years open collapsed. One year opens with months visible.
 * Days stay collapsed until the month is expanded.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  allDaysOf,
  buildWhenTree,
  defaultExpandedYears,
  triState,
  type WhenMonth,
  type WhenYear,
} from "@/lib/tradeLogWhenTree";
import FilterMenuPortal from "@/components/autofilter/FilterMenuPortal";

function TriCheck({
  state,
  onToggle,
  label,
  testId,
}: {
  state: "all" | "some" | "none";
  onToggle: () => void;
  label: string;
  testId?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-xs text-[var(--color-label)]">
      <input
        ref={ref}
        type="checkbox"
        checked={state === "all"}
        onChange={onToggle}
        data-testid={testId}
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

function setDays(
  prev: Set<string>,
  days: string[],
  on: boolean,
): Set<string> {
  const next = new Set(prev);
  if (on) days.forEach((d) => next.add(d));
  else days.forEach((d) => next.delete(d));
  return next;
}

export default function DateWhenFilter({
  days,
  applied,
  open,
  onOpen,
  onApply,
  onClear,
}: {
  days: string[];
  applied: string[] | undefined;
  open: boolean;
  onOpen: (k: "when" | null) => void;
  onApply: (picked: string[] | null) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [userYears, setUserYears] = useState<Set<string> | null>(null);
  const [userMonths, setUserMonths] = useState<Set<string> | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const active = applied != null && applied.length > 0;

  const tree = useMemo(() => buildWhenTree(days), [days]);
  const universe = useMemo(() => allDaysOf(tree), [tree]);
  const livePicked =
    picked ?? new Set(applied && applied.length ? applied : universe);
  const openYears = userYears ?? defaultExpandedYears(tree);
  const openMonths = userMonths ?? new Set<string>();

  useEffect(() => {
    if (!open) {
      setQ("");
      setPicked(null);
      setUserYears(null);
      setUserMonths(null);
    }
  }, [open]);

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

  const needle = q.trim().toLowerCase();

  function yearMatch(y: WhenYear): boolean {
    if (!needle) return true;
    if (y.year.includes(needle)) return true;
    return y.months.some((m) => monthMatch(m));
  }

  function monthMatch(m: WhenMonth): boolean {
    if (!needle) return true;
    if (m.label.toLowerCase().includes(needle) || m.ym.includes(needle)) {
      return true;
    }
    return m.days.some((d) => dayMatch(d));
  }

  function dayMatch(d: string): boolean {
    if (!needle) return true;
    const n = String(Number(d.slice(8)));
    return (
      d.includes(needle) ||
      n === needle ||
      d.slice(8).includes(needle)
    );
  }

  const shown = needle ? tree.filter(yearMatch) : tree;
  const searchOpenYears = new Set<string>();
  const searchOpenMonths = new Set<string>();
  if (needle) {
    for (const y of shown) {
      if (y.months.some(monthMatch)) searchOpenYears.add(y.year);
      for (const m of y.months) {
        if (m.days.some(dayMatch) && !m.label.toLowerCase().includes(needle)) {
          searchOpenYears.add(y.year);
          searchOpenMonths.add(m.ym);
        }
      }
    }
  }

  const yearOpen = (year: string) =>
    openYears.has(year) || searchOpenYears.has(year);
  const monthOpen = (ym: string) =>
    openMonths.has(ym) || searchOpenMonths.has(ym);

  const allOn =
    universe.length > 0 && universe.every((d) => livePicked.has(d));

  function toggleYearOpen(year: string) {
    setUserYears((prev) => {
      const next = new Set(prev ?? defaultExpandedYears(tree));
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonthOpen(ym: string) {
    setUserMonths((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(ym)) next.delete(ym);
      else next.add(ym);
      return next;
    });
  }

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
        aria-label="Filter When"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid="autofilter-when"
        data-filtered={active ? "1" : "0"}
        onClick={() => onOpen(open ? null : "when")}
      >
        ▾
      </button>
      <FilterMenuPortal
        open={open}
        anchorRef={box}
        menuRef={menu}
        width={256}
      >
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-2 shadow-[var(--elevation-2)]"
          role="listbox"
          data-testid="autofilter-menu-when"
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
                setPicked(allOn ? new Set() : new Set(universe));
              }}
            />
            (Select All)
          </label>
          <ul className="mt-1 max-h-64 overflow-auto" data-testid="when-tree">
            {shown.map((y) => {
              const yDays = y.months.flatMap((m) => m.days);
              const yOpen = yearOpen(y.year);
              const months = needle ? y.months.filter(monthMatch) : y.months;
              return (
                <li key={y.year} className="py-0.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-[var(--color-label-tertiary)]"
                      aria-expanded={yOpen}
                      aria-label={`${yOpen ? "Collapse" : "Expand"} ${y.year}`}
                      data-testid={`when-year-toggle-${y.year}`}
                      onClick={() => toggleYearOpen(y.year)}
                    >
                      {yOpen ? "▾" : "▸"}
                    </button>
                    <TriCheck
                      state={triState(livePicked, yDays)}
                      onToggle={() =>
                        setPicked(
                          setDays(
                            livePicked,
                            yDays,
                            triState(livePicked, yDays) !== "all",
                          ),
                        )
                      }
                      label={y.year}
                      testId={`when-year-${y.year}`}
                    />
                  </div>
                  {yOpen ? (
                    <ul className="ml-4">
                      {months.map((m) => {
                        const mOpen = monthOpen(m.ym);
                        const mDays = needle
                          ? m.days.filter(dayMatch)
                          : m.days;
                        return (
                          <li key={m.ym} className="py-0.5">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-[var(--color-label-tertiary)]"
                                aria-expanded={mOpen}
                                aria-label={`${mOpen ? "Collapse" : "Expand"} ${m.label}`}
                                data-testid={`when-month-toggle-${m.ym}`}
                                onClick={() => toggleMonthOpen(m.ym)}
                              >
                                {mOpen ? "▾" : "▸"}
                              </button>
                              <TriCheck
                                state={triState(livePicked, m.days)}
                                onToggle={() =>
                                  setPicked(
                                    setDays(
                                      livePicked,
                                      m.days,
                                      triState(livePicked, m.days) !== "all",
                                    ),
                                  )
                                }
                                label={m.label}
                                testId={`when-month-${m.ym}`}
                              />
                            </div>
                            {mOpen ? (
                              <ul className="ml-4">
                                {mDays.map((d) => (
                                  <li key={d} className="py-0.5">
                                    <TriCheck
                                      state={
                                        livePicked.has(d) ? "all" : "none"
                                      }
                                      onToggle={() => {
                                        const next = new Set(livePicked);
                                        if (next.has(d)) next.delete(d);
                                        else next.add(d);
                                        setPicked(next);
                                      }}
                                      label={String(Number(d.slice(8)))}
                                      testId={`when-day-${d}`}
                                    />
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
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
                onClear();
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
                  universe.length > 0 &&
                  universe.every((d) => livePicked.has(d));
                onApply(all ? null : [...livePicked]);
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
