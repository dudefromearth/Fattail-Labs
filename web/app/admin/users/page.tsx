"use client";

// Admin Users — roster + per-user login / membership / engagement analytics.
// Read-only. Data: /api/admin/users (list) and /api/admin/users/{id} (detail).
// Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  identity_id: number;
  email: string;
  display_name: string;
  role: string;
  providers: string[];
  membership: string;
  created_at: string | null;
  login_count: number;
  last_login: string | null;
  pageview_count: number;
  last_active: string | null;
  watch_seconds: number;
  courses_enrolled: number;
};

type UserDetail = {
  identity_id: number;
  email: string;
  display_name: string;
  role: string;
  created_at: string | null;
  providers: { provider: string; external_id: string; linked_at: string | null }[];
  memberships: {
    plan_name: string; grants_role: string; status: string; source: string;
    external_ref: string | null; started_at: string | null;
    current_period_end: string | null;
  }[];
  logins: {
    total: number; first_at: string | null; last_at: string | null;
    by_method: Record<string, number>;
    recent: { at: string | null; provider: string; role: string; ip: string | null; user_agent: string | null }[];
  };
  page_views: {
    total: number;
    top_paths: { path: string; count: number }[];
    recent: { path: string; at: string | null }[];
  };
  time_on_platform: { sessions: number; seconds: number };
  engagement: {
    watch_seconds: number; last_lesson_at: string | null;
    courses_enrolled: number; courses_completed: number; quiz_attempts: number;
  };
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const load = useCallback(async (q: string) => {
    setError(null);
    const r = await fetch(
      `/api/admin/users?search=${encodeURIComponent(q)}&limit=100`,
      { credentials: "same-origin" },
    );
    if (!r.ok) {
      setError(r.status === 403 ? "Administrator sign-in required." : await r.text());
      setRows([]);
      return;
    }
    const d = await r.json();
    setRows(d.users || []);
    setTotal(d.total || 0);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const openUser = useCallback(async (id: number) => {
    setSelected(id);
    setDetail(null);
    const r = await fetch(`/api/admin/users/${id}`, { credentials: "same-origin" });
    if (r.ok) setDetail(await r.json());
  }, []);

  return (
    <main className="space-y-6 p-6" data-testid="admin-users">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every identity by email — how they signed in, membership, and platform
            engagement. {total} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            placeholder="Search email or name…"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={() => load(search)}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Search
          </button>
          <a
            href={`/api/admin/users/export.csv?search=${encodeURIComponent(search)}`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
          >
            CSV
          </a>
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,460px)]">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Via</th>
                <th className="px-3 py-2">Membership</th>
                <th className="px-3 py-2 text-right">Logins</th>
                <th className="px-3 py-2 text-right">Watch</th>
                <th className="px-3 py-2">Last active</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((u) => (
                <tr
                  key={u.identity_id}
                  onClick={() => openUser(u.identity_id)}
                  className={`cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    selected === u.identity_id ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.email}</div>
                    {u.display_name && (
                      <div className="text-xs text-zinc-500">{u.display_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {u.providers.length ? u.providers.join(", ") : "native"}
                  </td>
                  <td className="px-3 py-2 text-xs">{u.membership}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{u.login_count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtDuration(u.watch_seconds)}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {fmtDate(u.last_active)}
                  </td>
                </tr>
              ))}
              {rows && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-400">
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {!selected && <p className="text-sm text-zinc-400">Select a user to see detail.</p>}
          {selected && !detail && <p className="text-sm text-zinc-400">Loading…</p>}
          {detail && (
            <div className="space-y-5 text-sm">
              <div>
                <h2 className="text-lg font-semibold">{detail.email}</h2>
                <p className="text-xs text-zinc-500">
                  {detail.display_name || "—"} · role <b>{detail.role}</b> · joined{" "}
                  {fmtDate(detail.created_at)}
                </p>
              </div>

              <Stat label="Logins" value={String(detail.logins.total)}
                sub={`last ${fmtDate(detail.logins.last_at)}`} />
              <div className="text-xs text-zinc-500">
                By method:{" "}
                {Object.entries(detail.logins.by_method)
                  .map(([m, n]) => `${m} ×${n}`).join(" · ") || "—"}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat label="Pages" value={String(detail.page_views.total)} />
                <Stat label="Time on platform" value={fmtDuration(detail.time_on_platform.seconds)}
                  sub={`${detail.time_on_platform.sessions} sessions`} />
                <Stat label="Watch" value={fmtDuration(detail.engagement.watch_seconds)} />
              </div>

              <div>
                <h3 className="mb-1 font-medium">Membership</h3>
                {detail.memberships.length === 0 && (
                  <p className="text-xs text-zinc-500">No memberships (observer).</p>
                )}
                <ul className="space-y-1">
                  {detail.memberships.map((m, i) => (
                    <li key={i} className="text-xs">
                      <b>{m.plan_name}</b> — {m.status} · via {m.source}
                      {m.current_period_end ? ` · until ${fmtDate(m.current_period_end)}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-1 font-medium">Linked accounts</h3>
                <ul className="space-y-1 text-xs text-zinc-500">
                  {detail.providers.length === 0 && <li>native only</li>}
                  {detail.providers.map((p, i) => (
                    <li key={i}>{p.provider} (id {p.external_id})</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-1 font-medium">Top pages</h3>
                <ul className="space-y-1 text-xs">
                  {detail.page_views.top_paths.length === 0 && (
                    <li className="text-zinc-500">No page views recorded yet.</li>
                  )}
                  {detail.page_views.top_paths.map((p, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate text-zinc-600 dark:text-zinc-300">{p.path}</span>
                      <span className="tabular-nums text-zinc-400">{p.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-1 font-medium">Recent logins</h3>
                <ul className="space-y-1 text-xs text-zinc-500">
                  {detail.logins.recent.slice(0, 8).map((l, i) => (
                    <li key={i}>
                      {fmtDate(l.at)} · {l.provider}
                      {l.ip ? ` · ${l.ip}` : ""}
                    </li>
                  ))}
                  {detail.logins.recent.length === 0 && <li>No logins recorded yet.</li>}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}
