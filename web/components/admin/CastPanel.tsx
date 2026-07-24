"use client";

// Studio cast registry — Phase G1
// Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.0.md

import { useCallback, useEffect, useState } from "react";

type CastMember = {
  cast_id: string;
  name: string;
  file: string;
  group_id: string | null;
  voice_id: string | null;
  voice_name: string | null;
  orientation: string;
  role: string | null;
  appearance: string[];
  voice_notes: string[];
  ready: boolean;
  error?: string;
};

export default function CastPanel() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [members, setMembers] = useState<CastMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/cast", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setState("denied");
          return;
        }
        setMembers(d.cast || []);
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return <main className="p-8 text-zinc-500">Loading cast…</main>;
  }
  if (state === "denied") {
    return (
      <main className="p-8" data-testid="cast-denied">
        <h1 className="text-xl font-semibold">Studio cast</h1>
        <p className="mt-2 text-red-600">Administrator sign-in required.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6" data-testid="cast-panel">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Studio cast</h1>
        <p className="mt-1 text-sm text-zinc-500">
          HeyGen presenters registered in{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            docs/studio/cast/
          </code>
          . Assign a cast member on each board card before HeyGen production.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          {members.length} member{members.length === 1 ? "" : "s"} · source of truth is
          AVATAR-*.md (not the database)
        </p>
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-600"
          onClick={() => load()}
          data-testid="cast-refresh"
        >
          Refresh
        </button>
      </div>

      <ul className="space-y-3">
        {members.map((m) => (
          <li
            key={m.cast_id}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            data-testid={`cast-member-${m.cast_id}`}
          >
            <div className="flex flex-wrap items-start gap-2">
              <div className="flex-1">
                <h2 className="text-base font-semibold">
                  {m.cast_id}
                  {!m.ready && (
                    <span className="ml-2 text-xs font-normal text-red-600">not ready</span>
                  )}
                  {m.ready && (
                    <span className="ml-2 text-xs font-normal text-emerald-600">ready</span>
                  )}
                </h2>
                {m.role && (
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{m.role}</p>
                )}
              </div>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] uppercase text-zinc-600 dark:bg-zinc-800">
                {m.orientation}
              </span>
            </div>
            <dl className="mt-3 grid gap-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
              <div>
                <dt className="inline text-zinc-400">group_id </dt>
                <dd className="inline break-all">{m.group_id || "—"}</dd>
              </div>
              <div>
                <dt className="inline text-zinc-400">voice_id </dt>
                <dd className="inline break-all">{m.voice_id || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="inline text-zinc-400">file </dt>
                <dd className="inline">{m.file}</dd>
              </div>
            </dl>
            {m.appearance?.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-300">
                {m.appearance.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
            {m.error && <p className="mt-2 text-xs text-red-600">{m.error}</p>}
          </li>
        ))}
        {!members.length && (
          <li className="rounded border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            No AVATAR-*.md files in the cast registry yet. Add files under{" "}
            <code>docs/studio/cast/</code> (see cast README).
          </li>
        )}
      </ul>

      <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <h3 className="font-medium">Adding cast members</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
          <li>Create or confirm the avatar in HeyGen (heygen-avatar skill).</li>
          <li>
            Write <code>AVATAR-NAME.md</code> with Group ID + Voice ID in this directory.
          </li>
          <li>Coach approves before use on member-facing course masters.</li>
          <li>Assign <code>cast_id</code> on the board card, then Produce with HeyGen.</li>
        </ol>
      </section>
    </main>
  );
}
