"use client";

import type { MatrixView } from "@/lib/options-lab/templates/matrixView";

export default function MatrixViewToggle({
  value,
  onChange,
  testId = "heatmap-matrix-view",
  compact = false,
}: {
  value: MatrixView;
  onChange: (v: MatrixView) => void;
  testId?: string;
  compact?: boolean;
}) {
  return (
    <nav
      className={
        compact
          ? "inline-flex min-h-9 items-center rounded-full bg-[var(--color-fill)] p-1"
          : "inline-flex min-h-[var(--hit-min)] min-w-0 flex-1 items-center justify-end gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      }
      aria-label="Matrix orientation"
      data-testid={testId}
    >
      {(
        [
          { id: "vertical", label: "Vertical" },
          { id: "horizontal", label: "Horizontal" },
        ] as const
      ).map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={[
              "inline-flex items-center justify-center rounded-full font-medium transition-colors",
              compact
                ? "min-h-7 px-2.5 text-xs"
                : "min-h-9 flex-1 px-3 text-[length:var(--text-subheadline)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
              active
                ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
