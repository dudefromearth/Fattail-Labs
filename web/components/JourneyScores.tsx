"use client";

// Journey Process Flow — hero radar + temporal scrub (practice start → today).

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProcessMeter, {
  type ProcessPayload,
  type ProcessTimeline,
} from "@/components/ProcessMeter";
import RetroCadenceNudge from "@/components/RetroCadenceNudge";

type Scores = {
  process?: ProcessPayload;
};

type JourneyUiPrefs = {
  recovery_invite_dismissed?: boolean;
  recovery_invite_dismissed_at?: string | null;
};

/** Quiet recovery when shape has climbed back toward a healthy band (J3). */
function recoveryFromTimeline(
  timeline: ProcessTimeline | null,
): { show: boolean; detail: string } {
  const pts = timeline?.points;
  if (!pts || pts.length < 4) return { show: false, detail: "" };
  const n = pts.length;
  const early = pts.slice(0, Math.max(2, Math.floor(n / 3)));
  const late = pts.slice(-Math.max(2, Math.floor(n / 3)));
  const avg = (arr: typeof pts) =>
    arr.reduce((s, p) => s + (Number(p.overall_percent) || 0), 0) / arr.length;
  const a = avg(early);
  const b = avg(late);
  // Return toward True North: was soft, now firmer (process %, never P&L)
  if (a < 45 && b >= 55 && b - a >= 8) {
    return {
      show: true,
      detail: `Shape strength moved from about ${Math.round(a)}% toward ${Math.round(b)}% over this path — process heading recovering.`,
    };
  }
  return { show: false, detail: "" };
}

export default function JourneyScores() {
  const [data, setData] = useState<Scores | null | "err">(null);
  const [timeline, setTimeline] = useState<ProcessTimeline | null>(null);
  const [prefs, setPrefs] = useState<JourneyUiPrefs | null>(null);
  const [dismissBusy, setDismissBusy] = useState(false);

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

    fetch("/api/me/profile", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return null;
        return (await r.json()) as { journey_ui_prefs?: JourneyUiPrefs };
      })
      .then((p) => {
        if (!cancelled && p?.journey_ui_prefs) setPrefs(p.journey_ui_prefs);
      })
      .catch(() => {
        /* non-fatal */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recovery = useMemo(() => recoveryFromTimeline(timeline), [timeline]);
  const showInvite =
    recovery.show && !prefs?.recovery_invite_dismissed;

  async function dismissInvite() {
    if (dismissBusy) return;
    setDismissBusy(true);
    try {
      const r = await fetch("/api/me/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journey_ui_prefs: { recovery_invite_dismissed: true },
        }),
      });
      if (r.ok) {
        const body = (await r.json()) as { journey_ui_prefs?: JourneyUiPrefs };
        setPrefs(body.journey_ui_prefs || { recovery_invite_dismissed: true });
      }
    } finally {
      setDismissBusy(false);
    }
  }

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

        {showInvite && (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/30 px-4 py-3"
            data-testid="journey-recovery-invite"
          >
            <p className="text-sm font-medium text-[var(--color-label)]">
              Heading recovering
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-label-secondary)]">
              {recovery.detail} Optional next step — open material already on
              your plan (never gated by scores):
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
              <Link
                href="/app/journal"
                className="text-[var(--color-tint)] hover:underline"
              >
                Journal
              </Link>
              <Link
                href="/app/retrospective"
                className="text-[var(--color-tint)] hover:underline"
              >
                Retrospective
              </Link>
              <Link
                href="/app/trade-log?adherence_mode=drift"
                className="text-[var(--color-tint)] hover:underline"
              >
                Trade Log (Adhere)
              </Link>
              <button
                type="button"
                disabled={dismissBusy}
                onClick={() => void dismissInvite()}
                className="ml-auto text-[var(--color-label-tertiary)] hover:underline disabled:opacity-50"
                data-testid="journey-recovery-dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
