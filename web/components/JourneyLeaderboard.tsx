"use client";

// Community Leaderboard — opt-in process peers (not P&L competition).

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  reputation: number | null;
  personal_growth: number | null;
  attendance_streak: number | null;
  contribution: number;
  is_self: boolean;
};

function cell(v: number | null, suffix = ""): string {
  if (v === null || v === undefined) return "—";
  return `${v}${suffix}`;
}

function initials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function JourneyLeaderboard() {
  const [rows, setRows] = useState<Row[] | null | "err">(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/journey/leaderboard", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return [] as Row[];
        if (!r.ok) return "err" as const;
        const d = await r.json();
        return (d.members ?? []) as Row[];
      })
      .then((d) => {
        if (!cancelled) setRows(d);
      })
      .catch(() => {
        if (!cancelled) setRows("err");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Community board
        </h2>
        <Link
          href="/me"
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Opt in on Profile →
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
        Process peers who opted in — ranked by{" "}
        <strong>shared</strong> contribution only. Members tailor what they
        show (e.g. community reputation on, personal growth private). Em dash
        (—) means not shared. Never profit.
      </p>

      {rows === null && (
        <p className="mt-4 text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      )}
      {rows === "err" && (
        <p className="mt-4 text-sm text-red-600">Could not load community board.</p>
      )}
      {Array.isArray(rows) && rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          No one is on the board yet. When you&apos;re ready, turn on Journey
          visibility in{" "}
          <Link href="/me" className="text-[var(--color-tint)] hover:underline">
            Profile
          </Link>
          .
        </p>
      )}
      {Array.isArray(rows) && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-separator)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-[var(--color-separator)] bg-[var(--color-fill)]/50 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2 text-right">Contribution</th>
                <th className="px-3 py-2 text-right">Rep</th>
                <th className="px-3 py-2 text-right">Growth</th>
                <th className="px-3 py-2 text-right">Attend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr
                  key={`${m.rank}-${m.display_name}`}
                  className={
                    m.is_self
                      ? "bg-[var(--color-tint)]/10 font-medium"
                      : "odd:bg-[var(--color-fill)]/30"
                  }
                >
                  <td className="px-3 py-2.5 tabular-nums text-[var(--color-label-secondary)]">
                    {m.rank}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      {m.avatar_url ? (
                        <Image
                          src={m.avatar_url}
                          alt=""
                          width={28}
                          height={28}
                          unoptimized
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-tint)] text-[10px] font-semibold text-white">
                          {initials(m.display_name)}
                        </span>
                      )}
                      <span className="truncate">
                        {m.display_name}
                        {m.is_self && (
                          <span className="ml-1.5 text-[10px] font-normal text-[var(--color-tint)]">
                            you
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[var(--color-label)]">
                    {m.contribution}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
                    {cell(m.reputation)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
                    {cell(m.personal_growth)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
                    {m.attendance_streak === null
                      ? "—"
                      : `${m.attendance_streak}w`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
