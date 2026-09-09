"use client";

import type { SessionView } from "@/lib/sessions/sessionView";

export default function ClosuresList({ view }: { view: SessionView }) {
  return (
    <section className="mt-8" data-testid="sessions-closures">
      <h2 className="text-sm font-semibold text-[var(--color-label)]">
        Upcoming US closures
      </h2>
      {view.closures.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-label-tertiary)]">
          No US closures in the next few sessions on this calendar.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-label-secondary)]">
          {view.closures.map((c) => (
            <li key={c.date} data-testid={`sessions-closure-${c.date}`}>
              {c.date} · {c.kind === "early" ? "Early close" : "Closed"} · {c.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
