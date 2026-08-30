"use client";

/**
 * Rehearsal badge — TMI-81. Half recycle, counter-clockwise.
 * Grammar only this wave; cards mount it in W7.
 */

export default function ReplayBadge(props: { className?: string }) {
  return (
    <span
      className={
        "inline-flex min-h-11 min-w-11 items-center justify-center text-white/70 " +
        (props.className ?? "")
      }
      data-testid="replay-badge"
      data-replay=""
      title="Rehearsal"
      aria-label="Rehearsal"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 7H3v4" />
        <path d="M3.5 11A8 8 0 1 0 6 6.5" />
      </svg>
    </span>
  );
}
