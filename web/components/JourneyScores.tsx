"use client";

// My presence — private process meter + community contribution snapshot.
// Spec: Journey Gamification v1.0 · process over achievements

import Link from "next/link";
import { useEffect, useState } from "react";
import ProcessMeter, { type ProcessPayload } from "@/components/ProcessMeter";

type Scores = {
  reputation: number;
  personal_growth: number;
  attendance_streak: number;
  contribution: number;
  journey_visible: boolean;
  rank: number | null;
  process?: ProcessPayload;
};

export default function JourneyScores() {
  const [data, setData] = useState<Scores | null | "err">(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/journey/scores", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return null;
        if (!r.ok) return "err" as const;
        return (await r.json()) as Scores;
      })
      .then((d) => {
        if (!cancelled) setData(d === null ? null : d);
      })
      .catch(() => {
        if (!cancelled) setData("err");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (data === null) {
    return (
      <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">
        Loading your presence…
      </p>
    );
  }
  if (data === "err") {
    return (
      <p className="mt-6 text-sm text-red-600">
        Could not load scores. Restart the API if migrations are pending.
      </p>
    );
  }

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="surface-card border border-[var(--color-separator)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-label)]">
              Personal process
            </h2>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              A meter for long-term success habits — including persistence with
              Trade Log, Journal, lessons, and live — not a scoreboard of wins.
            </p>
          </div>
          <Link
            href="/app/journal"
            className="text-xs font-medium text-[var(--color-tint)] hover:underline"
          >
            Practice suite →
          </Link>
        </div>
        <div className="mt-5">
          {data.process ? (
            <ProcessMeter process={data.process} />
          ) : (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Process meter unavailable — restart API after latest deploy.
            </p>
          )}
        </div>
      </div>

      <div className="surface-card border border-[var(--color-separator)] p-5">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Community presence
        </h2>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          How you show up for peers when you opt in. Tailor pillars on Profile
          (e.g. share reputation, keep growth private).
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-separator)] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Reputation
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {data.reputation}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-separator)] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Contribution
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-tint)]">
              {data.contribution}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-separator)] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Attendance
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {data.attendance_streak}w
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-separator)] p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Board
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {data.journey_visible
                ? data.rank != null
                  ? `Rank #${data.rank}`
                  : "Visible"
                : "Private"}
            </dd>
          </div>
        </dl>
        <Link
          href="/me"
          className="mt-4 inline-block text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Visibility settings →
        </Link>
      </div>
    </section>
  );
}
