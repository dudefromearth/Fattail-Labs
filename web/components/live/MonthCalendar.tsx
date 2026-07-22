"use client";

// Monday-first month grid (spec v1.2): chips colored by kind, today ringed,
// past days dimmed, click selects.

import { DAY_KEYS, DAY_LABELS, KIND_CHIP, KIND_LABELS, shortTime, type Session } from "./types";

export default function MonthCalendar({
  cursor,
  sessions,
  selectedId,
  onSelect,
}: {
  cursor: Date;
  sessions: Session[];
  selectedId: number | string | null;
  onSelect: (s: Session) => void;
}) {
  const byDay = new Map<number, Session[]>();
  for (const s of sessions) {
    const d = new Date(s.starts_at);
    if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth())
      continue; // UTC↔local edge spill
    const list = byDay.get(d.getDate()) ?? [];
    list.push(s);
    byDay.set(d.getDate(), list);
  }
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leading = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7; // Mon-first
  const today = new Date();
  const isThisMonth =
    today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {DAY_KEYS.map((d) => (
            <div key={d} className="pb-2">{DAY_LABELS[d]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {cells.map((day, i) => {
            const isToday = isThisMonth && day === today.getDate();
            const isPastDay =
              day !== null &&
              new Date(cursor.getFullYear(), cursor.getMonth(), day + 1) <= today &&
              !isToday;
            return (
              <div
                key={i}
                className={`min-h-24 border-zinc-200 p-1.5 dark:border-zinc-800 ${
                  i % 7 !== 0 ? "border-l" : ""
                } ${i >= 7 ? "border-t" : ""} ${
                  day === null ? "bg-zinc-50 dark:bg-zinc-900/40" : ""
                }`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-emerald-500 text-white"
                          : isPastDay
                            ? "text-zinc-400"
                            : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {(byDay.get(day) ?? []).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => onSelect(s)}
                          title={`${KIND_LABELS[s.kind]} — ${s.title}`}
                          className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium leading-tight transition-colors ${
                            KIND_CHIP[s.kind]
                          } ${isPastDay ? "opacity-45" : ""} ${
                            selectedId === s.id
                              ? "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-950"
                              : ""
                          }`}
                        >
                          {shortTime(s.starts_at)} {s.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
