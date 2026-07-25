"use client";

// /live orchestrator (Live Sessions specs v1.1–v1.5): month cursor + data
// fetch, calendar, selected-session detail, replays, admin managers.
// The pieces live in components/live/ (refactor step 4/4).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { del, getJSON } from "@/lib/client";
import { useIsAdmin } from "@/lib/useIsAdmin";
import AdminManager from "./live/AdminManager";
import MonthCalendar from "./live/MonthCalendar";
import RecurrenceManager from "./live/RecurrenceManager";
import SessionDetail from "./live/SessionDetail";
import { ENDED_AFTER_MS, monthKey, type Session } from "./live/types";
import { appConfirm } from "@/lib/dialogs";

export default function LiveSessions() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [data, setData] = useState<{ sessions: Session[]; past: Session[] } | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const isAdmin = useIsAdmin();

  const load = useCallback(() => {
    getJSON<{ sessions: Session[]; past: Session[] }>(
      `/api/live/sessions?month=${monthKey(cursor)}`,
    ).then((d) => d && setData(d));
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  // Default selection: the next session that hasn't ended, once per load.
  useEffect(() => {
    if (!data) return;
    setSelected((prev) => {
      if (prev && data.sessions.some((s) => s.id === prev.id)) {
        return data.sessions.find((s) => s.id === prev.id) ?? null;
      }
      const cut = Date.now() - ENDED_AFTER_MS;
      return data.sessions.find((s) => new Date(s.starts_at).getTime() >= cut) ?? null;
    });
  }, [data]);

  if (!data) return <p className="text-sm text-zinc-400">Loading…</p>;

  async function remove(id: number | string) {
    if (!(await appConfirm({ title: "Delete this session?", message: "This cannot be undone.", confirmLabel: "Delete", destructive: true }))) return;
    await del(`/api/admin/live-sessions/${id}`);
    setSelected(null);
    load();
  }

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelected(null);
  }

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]";

  return (
    <div className="space-y-8">
      <section className="surface-card border border-[var(--color-separator)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-label)]">
            {cursor.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className={navBtn}
              title="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(null);
              }}
              className="rounded-full border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className={navBtn}
              title="Next month"
            >
              ›
            </button>
          </span>
        </div>

        <MonthCalendar
          cursor={cursor}
          sessions={data.sessions}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />

        {selected && (
          <SessionDetail s={selected} isAdmin={isAdmin} onChanged={load} />
        )}
      </section>

      <section className="surface-card border border-[var(--color-separator)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Replays
        </h2>
        {data.past.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
            No past sessions yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.past.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--color-label)]">
                  {s.title}
                </span>
                <span className="text-xs text-[var(--color-label-secondary)]">
                  {new Date(s.starts_at).toLocaleDateString()}
                </span>
                {s.replay_course_slug ? (
                  <Link
                    href={`/courses/${s.replay_course_slug}`}
                    className="ml-auto rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-1 text-xs font-medium text-[var(--color-label)]"
                  >
                    Watch replay
                  </Link>
                ) : (
                  <span className="ml-auto text-xs text-[var(--color-label-tertiary)]">
                    Replay coming soon
                  </span>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="text-[var(--color-label-tertiary)] hover:text-[var(--color-destructive)]"
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <>
          <RecurrenceManager onChanged={load} />
          <AdminManager onChanged={load} />
        </>
      )}
    </div>
  );
}
