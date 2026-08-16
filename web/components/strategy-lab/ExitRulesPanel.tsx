"use client";

/**
 * Design tab — Exit Rules.
 * Generally a dynamic trailing stop. The dynamic part is time,
 * premium decay, and whatever else the pseudo-code names.
 */

import type { StrategyConfig } from "@/lib/strategyPacks";

type Props = {
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
};

const group =
  "overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]";

export const EXIT_DRIVERS: { id: string; label: string }[] = [
  { id: "premium_decay", label: "Premium decay" },
  { id: "time", label: "Time" },
];

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? { ...(v as Record<string, unknown>) }
    : {};
}

export function exitDriversOf(config: StrategyConfig): string[] {
  const rules = asObj(config.exit_rules);
  const raw = rules.drivers;
  if (Array.isArray(raw)) {
    return raw.map(String).filter((id) => EXIT_DRIVERS.some((d) => d.id === id));
  }
  return ["premium_decay", "time"];
}

export default function ExitRulesPanel({ config, setField }: Props) {
  const rules = asObj(config.exit_rules);
  const trail = asObj(rules.dynamic_premium_decay_trailing);
  const drivers = exitDriversOf(config);
  const pseudocode = String(rules.pseudocode ?? "");

  function patchRules(patch: Record<string, unknown>) {
    setField("exit_rules", {
      ...rules,
      dynamic_premium_decay_trailing: {
        ...trail,
        mode: trail.mode || "rate",
        enabled: true,
      },
      ...patch,
    });
  }

  function toggleDriver(id: string) {
    const next = drivers.includes(id)
      ? drivers.filter((d) => d !== id)
      : [...drivers, id];
    patchRules({ drivers: next.length ? next : ["premium_decay"] });
  }

  return (
    <div className="space-y-2">
      <div className={group}>
        <div className="px-3 py-2">
          <div className="text-[13px] font-medium text-[var(--color-label)]">
            Dynamic trailing stop
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {EXIT_DRIVERS.map((d) => {
              const on = drivers.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDriver(d.id)}
                  className={
                    "min-h-8 rounded-[var(--radius-full)] px-2.5 text-[13px] font-medium " +
                    (on
                      ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]")
                  }
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label className={group + " block px-3 py-2"}>
        <span className="text-[13px] text-[var(--color-label-secondary)]">
          Pseudo-code
        </span>
        <textarea
          className="mt-1 block h-28 w-full resize-y border-0 bg-transparent font-mono text-[var(--text-caption)] leading-snug text-[var(--color-label)] outline-none"
          spellCheck={false}
          placeholder="trail on decay rate; flatten T−N if still on"
          value={pseudocode}
          onChange={(e) => patchRules({ pseudocode: e.target.value })}
        />
      </label>
    </div>
  );
}
