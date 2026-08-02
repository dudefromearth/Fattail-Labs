"use client";

// Journey Process Flow — hero radar + temporal scrub (practice start → today).

import Link from "next/link";
import { useEffect, useState } from "react";
import ProcessMeter, {
  type ProcessPayload,
  type ProcessTimeline,
} from "@/components/ProcessMeter";
import RetroCadenceNudge from "@/components/RetroCadenceNudge";

type Scores = {
  process?: ProcessPayload;
};

export default function JourneyScores() {
  const [data, setData] = useState<Scores | null | "err">(null);
  const [timeline, setTimeline] = useState<ProcessTimeline | null>(null);

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

    fetch("/api/me/journey/process-timeline?samples=26", {
      credentials: "same-origin",
    })
      .then(async (r) => {
        if (!r.ok) return null;
        return (await r.json()) as ProcessTimeline;
      })
      .then((t) => {
        if (!cancelled && t?.points?.length) setTimeline(t);
      })
      .catch(() => {
        /* non-fatal — radar still works without scrub */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (data === null) {
    return (
      <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">
        Loading your practice map…
      </p>
    );
  }
  if (data === "err") {
    return (
      <p className="mt-6 text-sm text-red-600">
        Could not load Process Flow. Restart the API if migrations are pending.
      </p>
    );
  }

  return (
    <section className="mt-8" data-testid="journey-practice-compass">
      <div className="surface-card border border-[var(--color-separator)] p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-label-tertiary)]">
              Process Flow
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--color-label)]">
              Practice compass
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
              Not a scorecard. A radar of practice pillars, plus a{" "}
              <strong className="font-medium text-[var(--color-label)]">
                timeline of shape strength
              </strong>{" "}
              (sloping up or down) from your start to today. P&amp;L never draws
              the path.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs font-medium">
            <Link
              href="/app/journal"
              className="text-[var(--color-tint)] hover:underline"
            >
              Practice suite →
            </Link>
            <Link
              href="/app/toughness"
              className="text-[var(--color-tint)] hover:underline"
            >
              Toughness (Hard) →
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          {data.process ? (
            <ProcessMeter
              process={data.process}
              hero
              timeline={timeline}
            />
          ) : (
            <p className="text-center text-sm text-[var(--color-label-tertiary)]">
              Radar unavailable — restart API after latest deploy.
            </p>
          )}
        </div>

        {data.process && (
          <RetroCadenceNudge process={data.process} className="mt-6" />
        )}
      </div>
    </section>
  );
}
