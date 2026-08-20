"use client";

/**
 * HI Spec SegmentedControl — 2–5 mutually exclusive segments, 44pt hits.
 */

export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
};

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  if (options.length < 2 || options.length > 5) {
    throw new Error("SegmentedControl requires 2–5 segments");
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex min-h-[var(--hit-min)] flex-1 rounded-[var(--radius-md)] bg-[var(--color-fill)] p-0.5"
    >
      {options.map((opt) => {
        const on = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={opt.disabled}
            onClick={() => onChange(opt.id)}
            className={
              "flex min-h-[var(--hit-min)] flex-1 items-center justify-center rounded-[var(--radius-sm)] " +
              "px-2 text-[length:var(--text-subheadline)] font-medium " +
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
              "focus-visible:outline-[var(--color-tint)] " +
              "disabled:opacity-45 " +
              (on
                ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                : "text-[var(--color-label-secondary)]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
