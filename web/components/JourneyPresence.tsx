"use client";

// Opt-in presence roster — name + avatar only (not a performance leaderboard).

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Member = {
  display_name: string;
  avatar_url: string | null;
};

function initials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function JourneyPresence() {
  const [members, setMembers] = useState<Member[] | null | "err">(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/journey/presence", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return [] as Member[];
        if (!r.ok) return "err" as const;
        const d = await r.json();
        return (d.members ?? []) as Member[];
      })
      .then((d) => {
        if (!cancelled) setMembers(d);
      })
      .catch(() => {
        if (!cancelled) setMembers("err");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Presence roster
        </h2>
        <Link
          href="/me"
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Visibility settings →
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
        Members who chose to be visible. Display name and photo only — not a
        ranking, and never profit or trade data.
      </p>

      {members === null && (
        <p className="mt-4 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      )}
      {members === "err" && (
        <p className="mt-4 text-sm text-red-600">Could not load presence roster.</p>
      )}
      {Array.isArray(members) && members.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          No one is visible yet.{" "}
          <Link href="/me" className="text-[var(--color-tint)] hover:underline">
            Opt in on your Profile
          </Link>{" "}
          if you want to appear here.
        </p>
      )}
      {Array.isArray(members) && members.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {members.map((m, i) => (
            <li
              key={`${m.display_name}-${i}`}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3"
            >
              {m.avatar_url ? (
                <Image
                  src={m.avatar_url}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-tint)] text-xs font-semibold text-white">
                  {initials(m.display_name)}
                </span>
              )}
              <span className="truncate text-sm font-medium text-[var(--color-label)]">
                {m.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
