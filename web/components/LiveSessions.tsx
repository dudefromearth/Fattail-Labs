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
    if (!confirm("Delete this session?")) return;
    await del(`/api/admin/live-sessions/${id}`);
    setSelected(null);
    load();
  }

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelected(null);
  }

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <span className="ml-auto flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className={navBtn} title="Previous month">
              ‹
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(null);
              }}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Today
            </button>
            <button onClick={() => shiftMonth(1)} className={navBtn} title="Next month">
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Replays</h2>
        {data.past.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No past sessions yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.past.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(s.starts_at).toLocaleDateString()}
                </span>
                {s.replay_course_slug ? (
                  <Link
                    href={`/courses/${s.replay_course_slug}`}
                    className="ml-auto rounded-full border border-zinc-300 px-4 py-1 text-xs font-medium dark:border-zinc-700"
                  >
                    Watch replay
                  </Link>
                ) : (
                  <span className="ml-auto text-xs text-zinc-400">
                    Replay coming soon
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => remove(s.id)}
                    className="text-zinc-400 hover:text-red-500"
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
