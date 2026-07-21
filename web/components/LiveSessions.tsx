"use client";

// /live (Live Sessions Spec v1.0 §4): upcoming with gated Join, replays,
// admin session manager.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Session = {
  id: number;
  title: string;
  kind: "trading_room" | "workshop";
  starts_at: string;
  min_role: string;
  join_url?: string | null;
  join_locked?: "sign_in" | "role" | "too_early" | "ended" | null;
  replay_course_slug: string | null;
  replay_course_title: string | null;
};

const KIND_LABELS = { trading_room: "Live Trading Room", workshop: "Workshop" };

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return <span className="font-medium text-emerald-600">Live now</span>;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <span className="text-zinc-500">
      in {d > 0 ? `${d}d ` : ""}{h}h {m}m
    </span>
  );
}

function JoinControl({ s }: { s: Session }) {
  if (s.join_url) {
    return (
      <a
        href={s.join_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        Join Session
      </a>
    );
  }
  switch (s.join_locked) {
    case "sign_in":
      return (
        <Link
          href="/login"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Sign in to join
        </Link>
      );
    case "role":
      return (
        <Link
          href="/signup"
          className="rounded-full border border-emerald-300 px-5 py-2 text-sm font-medium text-emerald-600 dark:border-emerald-800"
        >
          {s.min_role === "navigator" ? "Coaching members" : "Members"} only —
          upgrade
        </Link>
      );
    case "too_early":
      return (
        <span className="text-sm text-zinc-500">
          Join opens 15 minutes before start
        </span>
      );
    default:
      return null;
  }
}

function AdminManager({ onChanged }: { onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"trading_room" | "workshop">("workshop");
  const [when, setWhen] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [minRole, setMinRole] = useState("activator");

  const field =
    "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  async function create() {
    const r = await fetch("/api/admin/live-sessions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        kind,
        starts_at: new Date(when).toISOString(),
        join_url: joinUrl,
        min_role: minRole,
      }),
    });
    if (r.ok) {
      setTitle("");
      setWhen("");
      setJoinUrl("");
      onChanged();
    } else alert(`Create failed: ${await r.text()}`);
  }

  return (
    <div className="mt-8 rounded-2xl border-2 border-dashed border-emerald-300 p-5 dark:border-emerald-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        Schedule a session (admin)
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${field} w-56`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
          <option value="workshop">Workshop</option>
          <option value="trading_room">Trading Room</option>
        </select>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={field}
        />
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL (Zoom etc.)"
          className={`${field} w-56`}
        />
        <select value={minRole} onChange={(e) => setMinRole(e.target.value)} className={field}>
          <option value="activator">Members (activator+)</option>
          <option value="navigator">Coaching (navigator+)</option>
        </select>
        <button
          onClick={create}
          disabled={!title.trim() || !when}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function LiveSessions() {
  const [data, setData] = useState<{ upcoming: Session[]; past: Session[] } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(() => {
    fetch("/api/live/sessions", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => me?.role === "administrator" && setIsAdmin(true))
      .catch(() => {});
  }, [load]);

  if (!data) return <p className="text-sm text-zinc-400">Loading…</p>;

  async function remove(id: number) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/admin/live-sessions/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    load();
  }

  return (
    <div>
      <section>
        <h2 className="text-lg font-semibold">Upcoming</h2>
        {data.upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No sessions scheduled — check back soon.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.upcoming.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    s.kind === "trading_room"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                  }`}
                >
                  {KIND_LABELS[s.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{s.title}</span>
                  <span className="block text-sm text-zinc-500">
                    {new Date(s.starts_at).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · <Countdown iso={s.starts_at} />
                  </span>
                </span>
                <a
                  href={`/api/live/sessions/${s.id}/ics`}
                  className="text-sm text-zinc-500 hover:underline"
                >
                  Add to Calendar
                </a>
                <JoinControl s={s} />
                {isAdmin && (
                  <button
                    onClick={() => remove(s.id)}
                    className="text-zinc-400 hover:text-red-500"
                    title="Delete session"
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
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

      {isAdmin && <AdminManager onChanged={load} />}
    </div>
  );
}
