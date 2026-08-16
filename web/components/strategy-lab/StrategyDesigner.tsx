"use client";

/**
 * Schema-driven Butterfly designer (Implementation Plan PR-4/5).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPack,
  fieldVisible,
  fieldsForConfig,
  savePackConfig,
  validatePackConfig,
  type FieldDefinition,
  type PackDetail,
  type StrategyConfig,
} from "@/lib/strategyPacks";

type Props = {
  strategyId: string;
  strategyName: string;
  initialConfig?: StrategyConfig | null;
  /** Designer section id to open first (e.g. "risk" for house-started bots). */
  initialSectionId?: string | null;
  /** Underlying chosen next to the strategy name in the work-area header. */
  headerUnderlying?: string | null;
  onSaved?: () => void;
  pushNotice?: (
    level: "info" | "success" | "warning" | "error",
    msg: string,
  ) => void;
};

const controlClass =
  "mt-0.5 w-full rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-2.5 py-2 text-[var(--text-footnote)] text-[var(--color-label)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)]";

const CARD =
  "flex h-[32rem] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]";

const TAB_PASTEL: Record<string, string> = {
  identity: "bg-sky-100 text-sky-950 dark:bg-sky-900 dark:text-sky-50",
  structure: "bg-violet-100 text-violet-950 dark:bg-violet-900 dark:text-violet-50",
  risk: "bg-rose-100 text-rose-950 dark:bg-rose-900 dark:text-rose-50",
  edge: "bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50",
  timing: "bg-teal-100 text-teal-950 dark:bg-teal-900 dark:text-teal-50",
  exits: "bg-orange-100 text-orange-950 dark:bg-orange-900 dark:text-orange-50",
  review: "bg-lime-100 text-lime-950 dark:bg-lime-900 dark:text-lime-50",
};

function FieldGrid({
  fields,
  config,
  setField,
}: {
  fields: FieldDefinition[];
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
      {fields.map((f, i) => (
        <label
          key={f.name}
          className={
            "block px-3 py-2 text-[var(--text-caption)] " +
            (i > 0 ? "border-t border-[var(--color-separator)] " : "") +
            (f.type === "json" ? "min-w-0" : "")
          }
        >
          <span className="font-medium text-[var(--color-label)]">
            {f.label}
            {f.required ? " *" : ""}
          </span>
          {f.type === "boolean" ? (
            <select
              className={controlClass}
              value={
                config[f.name] === false || config[f.name] === "false"
                  ? "false"
                  : "true"
              }
              onChange={(e) => setField(f.name, e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : f.type === "enum" ? (
            <select
              className={controlClass}
              value={String(config[f.name] ?? f.default ?? "")}
              disabled={
                f.name === "direction" &&
                (String(config.butterfly_family) === "batman" ||
                  String(config.butterfly_family) === "symmetric")
              }
              onChange={(e) => setField(f.name, e.target.value)}
            >
              <option value="">—</option>
              {(f.options || []).map((o) => (
                <option key={String(o)} value={String(o)}>
                  {f.name === "direction"
                    ? { call: "Call", put: "Put", both: "Both" }[String(o)] ||
                      String(o)
                    : f.name === "butterfly_family"
                      ? {
                          batman: "Batman",
                          single: "Single",
                          broken_wing: "Broken wing",
                        }[String(o)] || String(o)
                      : String(o)}
                </option>
              ))}
            </select>
          ) : f.type === "number" ? (
            <input
              type="number"
              className={controlClass}
              value={
                config[f.name] === undefined || config[f.name] === null
                  ? ""
                  : String(config[f.name])
              }
              min={f.min}
              max={f.max}
              step="any"
              onChange={(e) =>
                setField(
                  f.name,
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
            />
          ) : f.type === "json" ? (
            <div className="mt-0.5 min-w-0 max-w-full overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)]">
              <textarea
                className="block h-36 w-full resize-none border-0 bg-transparent px-2 py-1.5 font-mono text-[var(--text-caption)] leading-snug text-[var(--color-label)] outline-none"
                style={{ whiteSpace: "pre", overflowWrap: "normal" }}
                spellCheck={false}
                wrap="off"
                value={
                  typeof config[f.name] === "string"
                    ? String(config[f.name])
                    : JSON.stringify(config[f.name] ?? {}, null, 2)
                }
                onChange={(e) => {
                  try {
                    setField(f.name, JSON.parse(e.target.value));
                  } catch {
                    setField(f.name, e.target.value);
                  }
                }}
              />
            </div>
          ) : (
            <input
              type="text"
              className={controlClass}
              value={String(config[f.name] ?? "")}
              onChange={(e) => setField(f.name, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}

export default function StrategyDesigner({
  strategyId,
  strategyName,
  initialConfig,
  initialSectionId,
  headerUnderlying,
  onSaved,
  pushNotice,
}: Props) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [config, setConfig] = useState<StrategyConfig>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(
    () => !!(initialConfig && Object.keys(initialConfig).length > 0),
  );
  const lastNotice = useRef<string>("");

  useEffect(() => {
    void (async () => {
      const d = await fetchPack("butterfly");
      if (!d) return;
      setPack(d);
      const hasSaved =
        initialConfig && Object.keys(initialConfig).length > 0;
      const newbornEmpty =
        initialSectionId === "identity" && !hasSaved;
      const base: StrategyConfig = hasSaved
        ? { ...initialConfig }
        : newbornEmpty
          ? { name: strategyName }
          : { ...(d.defaults[0] || {}), name: strategyName };
      if (!base.name) base.name = strategyName;
      const fam = String(base.butterfly_family || "");
      if (fam === "batman" || fam === "symmetric") {
        base.direction = "both";
      }
      setConfig(base);
      setPersisted(!!hasSaved);
      const sections = d.ui?.sections || [];
      if (initialSectionId) {
        const idx = sections.findIndex(
          (s) => s.id === initialSectionId || s.title === initialSectionId,
        );
        setStep(idx >= 0 ? idx : 0);
      } else {
        setStep(0);
      }
    })();
  }, [initialConfig, strategyName, initialSectionId, strategyId]);

  const sections = pack?.ui.sections || [];
  const section = sections[step];

  const visibleFields = useMemo(() => {
    if (!pack) return [];
    return fieldsForConfig(pack, config).filter((f) => fieldVisible(f, config));
  }, [pack, config]);

  const fieldToSection: Record<string, string> = useMemo(
    () => ({
      name: "identity",
      direction: "identity",
      butterfly_family: "identity",
      underlying: "identity",
      dte_type: "structure",
      dte_min: "structure",
      dte_max: "structure",
      symmetric_regime: "structure",
      width_style: "structure",
      width_points_min: "structure",
      width_points_max: "structure",
      match_side_widths: "structure",
      call_width_points: "structure",
      put_width_points: "structure",
      bwb_style: "structure",
      broken_wing_side: "structure",
      max_capital_at_risk: "risk",
      max_capital_unit: "risk",
      primary_metric: "risk",
      debit_to_width_min: "edge",
      debit_to_width_max: "edge",
      target_debit_to_payoff_min: "edge",
      target_debit_to_payoff_max: "edge",
      min_convexity_quality: "edge",
      timing: "timing",
      directional_bias: "timing",
      frequency_per_week: "timing",
      vix_1d_mode: "timing",
      entry_conditions: "timing",
      exit_rules: "exits",
    }),
    [],
  );

  function fieldsOf(id: string): FieldDefinition[] {
    if (id === "review") return [];
    return visibleFields.filter(
      (f) =>
        f.name !== "underlying" &&
        f.name !== "name" &&
        (fieldToSection[f.name] || "identity") === id,
    );
  }

  const featureTiles = useMemo(() => {
    const dash = (v: unknown): string => {
      if (v == null || v === "") return "—";
      return String(v);
    };
    const famRaw = String(config.butterfly_family || "");
    const fam =
      famRaw === "batman" || famRaw === "symmetric"
        ? "Batman"
        : famRaw === "single"
          ? "Single"
          : famRaw === "broken_wing"
            ? "Broken wing"
            : "—";
    const dirMap: Record<string, string> = {
      call: "Call",
      put: "Put",
      both: "Both",
    };
    const trail =
      config.exit_rules &&
      typeof config.exit_rules === "object" &&
      (
        config.exit_rules as {
          dynamic_premium_decay_trailing?: { enabled?: boolean };
        }
      ).dynamic_premium_decay_trailing?.enabled;
    const width =
      config.match_side_widths === false
        ? `${dash(config.call_width_points)} / ${dash(config.put_width_points)}`
        : dash(config.width_points_min || config.width_style);
    const risk =
      config.max_capital_at_risk != null
        ? `${config.max_capital_at_risk} ${dash(config.max_capital_unit)}`
        : "—";
    const edge =
      config.debit_to_width_min != null || config.debit_to_width_max != null
        ? `${dash(config.debit_to_width_min)}–${dash(config.debit_to_width_max)}`
        : "—";
    return [
      { key: "family", label: "Family", value: fam, sectionId: "identity" },
      {
        key: "direction",
        label: "Direction",
        value: dirMap[String(config.direction || "")] || "—",
        sectionId: "identity",
      },
      {
        key: "underlying",
        label: "Underlying",
        value: dash(config.underlying || config.symbol),
        sectionId: "identity",
      },
      {
        key: "dte",
        label: "DTE",
        value: dash(config.dte_type),
        sectionId: "structure",
      },
      { key: "width", label: "Width", value: width, sectionId: "structure" },
      { key: "risk", label: "Risk", value: risk, sectionId: "risk" },
      {
        key: "metric",
        label: "Metric",
        value: dash(config.primary_metric),
        sectionId: "risk",
      },
      { key: "edge", label: "Edge", value: edge, sectionId: "edge" },
      {
        key: "timing",
        label: "Timing",
        value: dash(config.timing),
        sectionId: "timing",
      },
      {
        key: "exits",
        label: "Exits",
        value: trail ? "Trail" : config.exit_rules ? "Set" : "—",
        sectionId: "exits",
      },
      {
        key: "backtest",
        label: "Back test",
        value: "—",
        sectionId: "review",
      },
      {
        key: "walk",
        label: "Forward walk",
        value: "—",
        sectionId: "review",
      },
    ];
  }, [config]);

  function goToFieldSection(sectionId: string) {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx >= 0) setStep(idx);
  }

  const setField = useCallback((name: string, value: unknown) => {
    setConfig((c) => {
      const next: StrategyConfig = { ...c, [name]: value };
      if (name === "butterfly_family") {
        const fam = String(value);
        if (fam === "batman" || fam === "symmetric") {
          next.direction = "both";
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const sym = headerUnderlying?.trim();
    if (!sym) return;
    setConfig((c) => {
      if (c.underlying === sym && c.symbol === sym) return c;
      return { ...c, underlying: sym, symbol: sym };
    });
  }, [headerUnderlying]);

  useEffect(() => {
    if (!pack) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void validatePackConfig("butterfly", config).then((v) => {
        if (cancelled) return;
        setErrors(v.errors);
        setWarnings(v.warnings);
        const line = v.errors[0] || v.warnings[0] || "";
        if (line && line !== lastNotice.current) {
          lastNotice.current = line;
          pushNotice?.(v.errors[0] ? "warning" : "warning", line);
        }
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pack, config, pushNotice]);

  const stepIssues = useMemo(() => {
    const names = fieldsOf(section?.id || "identity").map((f) => f.name);
    const hit = (s: string) =>
      names.some((n) => s.toLowerCase().includes(n.toLowerCase()));
    return {
      errors: errors.filter(hit),
      warnings: warnings.filter(hit),
    };
  }, [errors, warnings, section, visibleFields, fieldToSection]);

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const v = await validatePackConfig("butterfly", config);
    if (!v.valid) {
      setErrors(v.errors);
      setWarnings(v.warnings);
      setMsg(v.errors[0] || "Fix the form before saving.");
      pushNotice?.("warning", v.errors[0] || "Fix the form before saving.");
      setBusy(false);
      return;
    }
    const res = await savePackConfig(strategyId, "butterfly", config, true);
    setBusy(false);
    if (res.error) {
      setErrors([res.error]);
      pushNotice?.("error", res.error);
      return;
    }
    setPersisted(true);
    const ok = persisted ? "Updated." : "Saved.";
    setMsg(ok);
    pushNotice?.("success", ok);
    onSaved?.();
  }

  if (!pack) {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">Loading…</p>
    );
  }

  return (
    <div className="mt-3 space-y-3" data-testid="strategy-designer">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <div className={CARD}>
          <div
            role="tablist"
            aria-label="Strategy design"
            className="m-2 flex rounded-[var(--radius-full)] bg-[var(--color-fill)] p-1"
          >
            {sections.map((s, i) => {
              const selected = i === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`design-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls="design-tab-panel"
                  title={s.title.replace(/\n/g, " ")}
                  onClick={() => setStep(i)}
                  className={
                    "min-h-[var(--hit-min)] min-w-0 flex-1 rounded-[var(--radius-full)] px-1 py-1 text-center text-[var(--text-caption)] font-medium leading-tight whitespace-pre-line transition-colors " +
                    (selected
                      ? `${TAB_PASTEL[s.id] || "bg-[var(--color-surface)] text-[var(--color-label)]"} shadow-[var(--elevation-1)]`
                      : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]")
                  }
                >
                  {s.title}
                </button>
              );
            })}
          </div>
          <div
            id="design-tab-panel"
            role="tabpanel"
            aria-labelledby={section ? `design-tab-${section.id}` : undefined}
            className="min-h-0 flex-1 overflow-y-auto px-3"
          >
            <FieldGrid
              fields={fieldsOf(section?.id || "identity")}
              config={config}
              setField={setField}
            />
            {stepIssues.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-[var(--text-caption)] text-[var(--color-destructive)]">
                {stepIssues.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {stepIssues.warnings.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-[var(--text-caption)] text-[var(--color-label-secondary)]">
                {stepIssues.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className={CARD} data-testid="strategy-choices-panel" aria-label="Choices">
          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <h4 className="text-[var(--text-footnote)] font-semibold text-[var(--color-label)]">
              Choices
            </h4>
            <button
              type="button"
              disabled={busy}
              data-testid="strategy-build"
              title={persisted ? "Update this configuration" : "Save this configuration"}
              className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1 text-[var(--text-caption)] font-medium text-[var(--color-label)] shadow-[var(--elevation-1)] disabled:opacity-40"
              onClick={() => void onSave()}
            >
              {persisted ? "Update" : "Save"}
            </button>
          </div>
          <div className="m-3 min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-separator)]">
              {featureTiles.map((tile) => (
                <button
                  key={tile.key}
                  type="button"
                  onClick={() => goToFieldSection(tile.sectionId)}
                  className="flex min-h-[4.25rem] flex-col justify-center bg-[var(--color-surface)] px-2.5 py-2 text-left hover:bg-[var(--color-surface-secondary)]"
                >
                  <span className="text-[var(--text-caption)] text-[var(--color-label-secondary)]">
                    {tile.label}
                  </span>
                  <span
                    className={
                      "truncate text-[var(--text-footnote)] font-medium " +
                      (tile.value === "—"
                        ? "text-[var(--color-label-tertiary)]"
                        : "text-[var(--color-label)]")
                    }
                  >
                    {tile.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {msg && (
        <p className="text-[var(--text-caption)] text-[var(--color-label-secondary)]">
          {msg}
        </p>
      )}
    </div>
  );
}
