"use client";

/**
 * Invitational retrospective cadence nudge (Spec §7.5 · Tango RT0-3).
 * Shows when process.meters[retrospective].nudge is true (d > H).
 * Invitational only — no shame framing (Tango N1).
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProcessPayload } from "@/components/ProcessMeter";
import { Button } from "@/components/ui";

const DISMISS_KEY = "ft_labs_retro_cadence_nudge_dismissed";

/** Tango N1 — fixed; no rotation guilt. */
const NUDGE_COPY =
  "It's been a while since your last completed retrospective. When you're ready, start one from Journal.";

export default function RetroCadenceNudge({
  process,
  className = "",
}: {
  process?: ProcessPayload | null;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(true); // hide until client hydrates

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const retro = process?.meters?.find((m) => m.id === "retrospective");
  const show = !!(retro && !retro.empty && !retro.soon && retro.nudge);

  if (!show || dismissed) return null;

  function notNow() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <aside
      className={`rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--elevation-1)] ${className}`}
      data-testid="retro-cadence-nudge"
      role="status"
    >
      <p className="text-sm text-[var(--color-label)]">{NUDGE_COPY}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href="/app/journal"
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-tint)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Open Journal
        </Link>
        <Link
          href="/app/retrospective"
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Retrospectives
        </Link>
        <Button
          type="button"
          variant="plain"
          className="text-xs"
          onClick={notNow}
          data-testid="retro-cadence-nudge-dismiss"
        >
          Not now
        </Button>
      </div>
    </aside>
  );
}
