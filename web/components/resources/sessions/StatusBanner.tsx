"use client";

import type { SessionView } from "@/lib/sessions/sessionView";

function eyebrow(view: SessionView): string {
  if (view.banner === "open" && view.currentSegment) {
    const seg = view.segments.find((s) => s.id === view.currentSegment);
    return seg ? `Open · ${seg.label}` : "Full session";
  }
  if (view.banner === "open") return "Full session";
  if (view.banner === "early") return "Early close";
  if (view.banner === "closed") return "Closed";
  return "Weekend";
}

function body(view: SessionView): string {
  if (view.banner === "open") {
    return "US cash is on a regular session.";
  }
  if (view.banner === "early") {
    return "US cash closes early. Shifted ends are marked.";
  }
  if (view.banner === "closed") {
    const name = view.holidayName ?? "US holiday";
    return `${name}. US cash (pre-market, New York, after-hours) and both SPX rows are closed. Toronto is shown unmodified. ES is marked modified — Globex hours are not asserted.`;
  }
  const labor = view.closures.find((c) => /labor day/i.test(c.name));
  if (labor) {
    return `US cash is closed. Globex is scheduled to reopen Sunday 6:00 PM ET. That reopen is not a promise of an unmodified Monday. Globex: Sunday 6:00 PM ET. US cash: after ${labor.name}. Monday is a US holiday — ES is modified, not a regular cash session.`;
  }
  return "US cash is closed. Globex is scheduled to reopen Sunday 6:00 PM ET. That reopen is not a promise of an unmodified Monday.";
}

export default function StatusBanner({
  view,
  clock,
}: {
  view: SessionView;
  clock: string;
}) {
  return (
    <div
      className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-4 py-3"
      data-testid="sessions-banner"
      data-banner={view.banner}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          {eyebrow(view)}
        </p>
        <p
          className="text-sm font-medium tabular-nums text-[var(--color-label)]"
          data-testid="sessions-clock"
        >
          {clock}
        </p>
      </div>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">{body(view)}</p>
    </div>
  );
}
