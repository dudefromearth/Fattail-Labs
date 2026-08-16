"use client";

/**
 * Design tab — Timing & Entry.
 * Warrant list is wide; OTM flies lead with VP structure + price action.
 * GEX / order flow may also warrant. The remainder is pseudo-code.
 * VP trigger is surface-relative — never a price, never a clock alone.
 */

import type { StrategyConfig } from "@/lib/strategyPacks";

type Props = {
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
};

const group =
  "overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]";
const row =
  "flex items-center gap-3 border-b border-[var(--color-separator)] px-3 py-2 last:border-b-0";
const labelCls =
  "w-[7.5rem] shrink-0 text-[13px] text-[var(--color-label-secondary)]";
const selectCls =
  "min-h-9 min-w-0 flex-1 bg-transparent text-right text-[15px] font-medium text-[var(--color-label)] outline-none";

export const ENTRY_CRITERIA: { id: string; label: string }[] = [
  { id: "vp_structure", label: "VP structure" },
  { id: "price_action", label: "Price action" },
  { id: "gex", label: "GEX" },
  { id: "order_flow", label: "Order flow" },
];

const LEVEL_CLASS = [
  { id: "hvn_top", label: "HVN top" },
  { id: "hvn_bottom", label: "HVN bottom" },
  { id: "lvn", label: "LVN" },
  { id: "intranode", label: "Intranode" },
  { id: "retracement", label: "Retracement" },
];

const INTERACTION = [
  { id: "test", label: "Test" },
  { id: "hold", label: "Hold" },
  { id: "break", label: "Break" },
  { id: "retest", label: "Retest" },
  { id: "reject", label: "Reject" },
];

const SESSION = [
  { id: "overnight", label: "Overnight" },
  { id: "premarket", label: "Premarket" },
  { id: "open", label: "Open" },
  { id: "mid_morning", label: "Mid-morning" },
  { id: "midday", label: "Midday" },
  { id: "early_afternoon", label: "Early afternoon" },
  { id: "late_afternoon", label: "Late afternoon" },
  { id: "close", label: "Close" },
  { id: "t_minus_n", label: "T−N to close" },
];

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? { ...(v as Record<string, unknown>) }
    : {};
}

export function entryCriteriaOf(config: StrategyConfig): string[] {
  const raw = asObj(config.entry_conditions).criteria;
  if (Array.isArray(raw)) {
    return raw.map(String).filter((id) => ENTRY_CRITERIA.some((c) => c.id === id));
  }
  return [];
}

export function isOtmFlySeat(config: StrategyConfig): boolean {
  if (String(config.placement || "") === "otm") return true;
  const tmpl = String(config.strategy_template || "");
  return tmpl === "butterfly" || tmpl === "bwb";
}

export default function TimingEntryPanel({ config, setField }: Props) {
  const entry = asObj(config.entry_conditions);
  const stored = entryCriteriaOf(config);
  const criteria =
    stored.length > 0
      ? stored
      : isOtmFlySeat(config)
        ? ["vp_structure", "price_action"]
        : [];
  const trigger = asObj(config.entry_trigger);
  const showVp = criteria.includes("vp_structure");
  const pseudocode = String(entry.pseudocode ?? "");

  function patchEntry(patch: Record<string, unknown>) {
    setField("entry_conditions", { ...entry, ...patch });
  }

  function toggleCriterion(id: string) {
    const next = criteria.includes(id)
      ? criteria.filter((c) => c !== id)
      : [...criteria, id];
    patchEntry({ criteria: next });
  }

  function patchTrigger(name: string, value: string) {
    const next = { ...trigger, [name]: value || undefined };
    setField("entry_trigger", next);
  }

  return (
    <div className="space-y-2">
      <div className={group}>
        <div className="px-3 py-2">
          <div className="text-[13px] text-[var(--color-label-secondary)]">
            Warrant
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ENTRY_CRITERIA.map((c) => {
              const on = criteria.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCriterion(c.id)}
                  className={
                    "min-h-8 rounded-[var(--radius-full)] px-2.5 text-[13px] font-medium " +
                    (on
                      ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showVp ? (
        <div className={group}>
          <div className={row}>
            <span className={labelCls}>Level</span>
            <select
              className={selectCls}
              aria-label="VP level class"
              value={String(trigger.level_class || "")}
              onChange={(e) => patchTrigger("level_class", e.target.value)}
            >
              <option value="">—</option>
              {LEVEL_CLASS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={row}>
            <span className={labelCls}>Interaction</span>
            <select
              className={selectCls}
              aria-label="VP interaction"
              value={String(trigger.interaction || "")}
              onChange={(e) => patchTrigger("interaction", e.target.value)}
            >
              <option value="">—</option>
              {INTERACTION.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={row}>
            <span className={labelCls}>Window</span>
            <select
              className={selectCls}
              aria-label="Session window"
              value={String(trigger.session_window || "")}
              onChange={(e) => patchTrigger("session_window", e.target.value)}
            >
              <option value="">—</option>
              {SESSION.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={row}>
            <span className={labelCls}>Travel</span>
            <input
              className="min-h-9 min-w-0 flex-1 bg-transparent text-right text-[15px] font-medium text-[var(--color-label)] outline-none"
              aria-label="Travel target"
              placeholder="next level"
              value={String(trigger.travel_target || "")}
              onChange={(e) => patchTrigger("travel_target", e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <label className={group + " block px-3 py-2"}>
        <span className="text-[13px] text-[var(--color-label-secondary)]">
          Pseudo-code
        </span>
        <textarea
          className="mt-1 block h-28 w-full resize-y border-0 bg-transparent font-mono text-[var(--text-caption)] leading-snug text-[var(--color-label)] outline-none"
          spellCheck={false}
          placeholder="level × interaction × window → travel"
          value={pseudocode}
          onChange={(e) => patchEntry({ pseudocode: e.target.value })}
        />
      </label>
    </div>
  );
}
