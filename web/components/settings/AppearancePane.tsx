"use client";

import {
  COLOR_SCHEMES,
  FONT_SIZES,
  type ColorScheme,
  type FontSize,
} from "@/lib/memberSettings";

const SCHEME_LABEL: Record<ColorScheme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const FONT_LABEL: Record<FontSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  larger: "Larger",
};

function Segmented<T extends string>({
  name,
  value,
  options,
  labels,
  onChange,
}: {
  name: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="inline-flex max-w-full flex-wrap rounded-[var(--radius-md)] bg-[var(--color-fill)] p-0.5"
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`settings-${name}-${opt}`}
            onClick={() => onChange(opt)}
            className={[
              "min-h-[var(--hit-min)] min-w-[4.5rem] rounded-[calc(var(--radius-md)-2px)] px-3 text-sm font-medium transition-colors",
              selected
                ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-sm"
                : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
            ].join(" ")}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

export default function AppearancePane({
  colorScheme,
  fontSize,
  onColorScheme,
  onFontSize,
}: {
  colorScheme: ColorScheme;
  fontSize: FontSize;
  onColorScheme: (next: ColorScheme) => void;
  onFontSize: (next: FontSize) => void;
}) {
  return (
    <div className="space-y-8" data-testid="settings-appearance">
      <section className="surface-card space-y-3 border border-[var(--color-separator)] p-6">
        <div>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Light and Dark, or follow your device. Applies across the site on
            this browser.
          </p>
        </div>
        <Segmented
          name="scheme"
          value={colorScheme}
          options={COLOR_SCHEMES}
          labels={SCHEME_LABEL}
          onChange={onColorScheme}
        />
      </section>

      <section className="surface-card space-y-3 border border-[var(--color-separator)] p-6">
        <div>
          <h2 className="text-lg font-semibold">Font size</h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Scales site type. Medium is the default.
          </p>
        </div>
        <Segmented
          name="font"
          value={fontSize}
          options={FONT_SIZES}
          labels={FONT_LABEL}
          onChange={onFontSize}
        />
        <p
          className="text-[var(--color-label-secondary)]"
          data-testid="settings-font-preview"
        >
          Preview — the quick brown fox jumps over the lazy dog.
        </p>
      </section>
    </div>
  );
}
