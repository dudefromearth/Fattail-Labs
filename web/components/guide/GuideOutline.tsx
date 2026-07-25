"use client";

/**
 * Hierarchical contents outline for the User's Guide.
 * Desktop: sticky sidebar list. Mobile: single “Contents” control → sheet.
 * (Apple HIG help pattern — scales as the guide grows.)
 */

import { useEffect, useState } from "react";
import { GUIDE_GROUPS, type GuideGroup } from "@/lib/guide";

function OutlineList({
  groups,
  onNavigate,
  dense,
}: {
  groups: GuideGroup[];
  onNavigate?: () => void;
  dense?: boolean;
}) {
  return (
    <nav aria-label="Guide contents">
      <ul className={dense ? "space-y-4" : "space-y-5"}>
        {groups.map((group) => (
          <li key={group.title}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              {group.title}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {group.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={onNavigate}
                    className="block rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] text-[var(--color-label-secondary)] transition-colors hover:bg-[var(--color-fill)] hover:text-[var(--color-label)]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Sticky desktop sidebar — elevated surface on canvas. */
export function GuideSidebar() {
  return (
    <aside className="surface-card sticky top-[calc(var(--header-height-lg)+0.75rem)] hidden max-h-[calc(100vh-var(--header-height-lg)-2rem)] w-56 shrink-0 overflow-y-auto border border-[var(--color-separator)] p-4 lg:block">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        Contents
      </p>
      <OutlineList groups={GUIDE_GROUPS} />
    </aside>
  );
}

/** Mobile: compact control + sheet listing the same outline. */
export function GuideContentsMobile() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="chip font-medium"
        aria-expanded={open}
        aria-controls="guide-contents-sheet"
        onClick={() => setOpen(true)}
      >
        Contents
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:p-6"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-[var(--color-overlay)]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id="guide-contents-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Guide contents"
            className="relative max-h-[min(85vh,32rem)] w-full overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-3)] sm:mx-auto sm:max-w-md sm:rounded-[var(--radius-xl)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-[var(--color-label)]">
                Contents
              </p>
              <button
                type="button"
                className="chip text-xs"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <OutlineList
              groups={GUIDE_GROUPS}
              dense
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
