"use client";

/**
 * Schema-driven Butterfly designer (Implementation Plan PR-4/5).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPack,
  fieldVisible,
  fieldsForConfig,
  rankPackConfig,
  savePackConfig,
  validatePackConfig,
  type PackDetail,
  type RankedStructure,
  type StrategyConfig,
} from "@/lib/strategyPacks";

type Props = {
  strategyId: string;
  strategyName: string;
  initialConfig?: StrategyConfig | null;
  onSaved?: () => void;
};

export default function StrategyDesigner({
  strategyId,
  strategyName,
  initialConfig,
  onSaved,
}: Props) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [config, setConfig] = useState<StrategyConfig>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ranked, setRanked] = useState<RankedStructure[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const d = await fetchPack("butterfly");
      if (!d) return;
      setPack(d);
      const base =
        initialConfig && Object.keys(initialConfig).length
          ? { ...initialConfig }
          : { ...(d.defaults[0] || {}) };
      if (!base.name) base.name = strategyName;
      setConfig(base);
    })();
  }, [initialConfig, strategyName]);

  const sections = pack?.ui.sections || [];
  const section = sections[step];

  const visibleFields = useMemo(() => {
    if (!pack) return [];
    return fieldsForConfig(pack, config).filter((f) => fieldVisible(f, config));
  }, [pack, config]);

  // Map fields to sections heuristically
  const sectionFields = useMemo(() => {
    if (!section) return visibleFields;
    const id = section.id;
    const bySection: Record<string, string[]> = {
      identity: ["name", "direction", "butterfly_family", "underlying"],
      structure: [
        "dte_type",
        "dte_min",
        "dte_max",
        "symmetric_regime",
        "width_style",
        "width_points_min",
        "width_points_max",
        "bwb_style",
        "broken_wing_side",
      ],
      risk: ["max_capital_at_risk", "max_capital_unit", "primary_metric"],
      edge: [
        "debit_to_width_min",
        "debit_to_width_max",
        "target_debit_to_payoff_min",
        "target_debit_to_payoff_max",
        "min_convexity_quality",
      ],
      timing: [
        "timing",
        "directional_bias",
        "frequency_per_week",
        "vix_1d_mode",
        "entry_conditions",
      ],
      exits: ["exit_rules"],
      review: [],
    };
    const names = new Set(bySection[id] || []);
    if (id === "review") return [];
    const matched = visibleFields.filter((f) => names.has(f.name));
    return matched.length ? matched : visibleFields;
  }, [section, visibleFields]);

  const setField = useCallback((name: string, value: unknown) => {
    setConfig((c) => ({ ...c, [name]: value }));
  }, []);

  async function onValidate() {
    setBusy(true);
    setMsg(null);
    const v = await validatePackConfig("butterfly", config);
    setErrors(v.errors);
    setWarnings(v.warnings);
    setBusy(false);
    if (v.valid) setMsg("Config valid.");
  }

  async function onRank() {
    setBusy(true);
    setMsg(null);
    setErrors([]);
    const v = await validatePackConfig("butterfly", config);
    setErrors(v.errors);
    setWarnings(v.warnings);
    if (!v.valid) {
      setBusy(false);
      return;
    }
    const res = await rankPackConfig("butterfly", config);
    setBusy(false);
    if (res.error) {
      setErrors([res.error]);
      return;
    }
    setRanked(res.ranked || []);
    setSummary(res.summary || null);
  }

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const v = await validatePackConfig("butterfly", config);
    if (!v.valid) {
      setErrors(v.errors);
      setBusy(false);
      return;
    }
    const res = await savePackConfig(strategyId, "butterfly", config, true);
    setBusy(false);
    if (res.error) {
      setErrors([res.error]);
      return;
    }
    setMsg("Saved pack config (version bumped).");
    onSaved?.();
  }

  function applyTemplate(t: StrategyConfig) {
    setConfig({ ...t, name: t.name || strategyName });
    setRanked([]);
    setSummary(null);
    setMsg(`Loaded template: ${String(t.name || "")}`);
  }

  if (!pack) {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Loading Butterfly pack…
      </p>
    );
  }

  const top = ranked[0];
  const substituted = !!summary?.primary_metric_substituted;
  const provenance = (summary?.data_provenance || top?.data_provenance) as
    | { source?: string; label?: string }
    | undefined;

  return (
    <div className="mt-4 space-y-4" data-testid="strategy-designer">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--color-label)]">
          Butterfly designer
        </h3>
        <select
          className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            const t = pack.defaults.find((d) => d.name === e.target.value);
            if (t) applyTemplate(t);
          }}
        >
          <option value="">Load template…</option>
          {pack.defaults.map((d) => (
            <option key={String(d.name)} value={String(d.name)}>
              {String(d.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-1">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={
              "rounded-full px-2.5 py-1 text-xs font-medium " +
              (i === step
                ? "bg-blue-600 text-white"
                : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
            }
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-sm font-semibold">{section?.title}</p>
        {section?.id === "review" ? (
          <div className="space-y-2 text-sm text-[var(--color-label-secondary)]">
            <p>
              Family: <strong>{String(config.butterfly_family)}</strong> · Metric:{" "}
              <strong>{String(config.primary_metric)}</strong> · DTE:{" "}
              <strong>{String(config.dte_type)}</strong>
            </p>
            <p className="text-xs">
              Save stamps butterfly_config@1 on this strategy and advances version.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionFields.map((f) => (
              <label key={f.name} className="block text-xs">
                <span className="font-medium text-[var(--color-label)]">
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {f.description && (
                  <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                    {f.description}
                  </span>
                )}
                {f.type === "enum" ? (
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                    value={String(config[f.name] ?? f.default ?? "")}
                    onChange={(e) => setField(f.name, e.target.value)}
                  >
                    <option value="">—</option>
                    {(f.options || []).map((o) => (
                      <option key={String(o)} value={String(o)}>
                        {String(o)}
                      </option>
                    ))}
                  </select>
                ) : f.type === "number" ? (
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
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
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 font-mono text-xs"
                    rows={4}
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
                ) : (
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                    value={String(config[f.name] ?? "")}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                )}
              </label>
            ))}
            {sectionFields.length === 0 && (
              <p className="text-xs text-[var(--color-label-secondary)]">
                No fields for this step with current options.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={step === 0}
            className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          <button
            type="button"
            disabled={step >= sections.length - 1}
            className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setStep((s) => Math.min(sections.length - 1, s + 1))}
          >
            Next
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold"
            onClick={() => void onValidate()}
          >
            Validate
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={() => void onRank()}
          >
            Rank structures
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-semibold text-emerald-700"
            onClick={() => void onSave()}
          >
            Save to strategy
          </button>
        </div>
      </div>

      {/* Honesty banners */}
      {(substituted || provenance?.source === "stub" || top?.metrics.convexityProvisional) && (
        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {substituted && (
            <p>
              <strong>Ranking proxy:</strong> primary metric{" "}
              <code>{String(config.primary_metric)}</code> is not computable yet
              (no backtest distribution). Sorted by{" "}
              <code>{String(summary?.ranked_by || top?.ranked_by)}</code>.
            </p>
          )}
          {provenance?.source === "stub" && (
            <p>
              <strong>Data proxy:</strong>{" "}
              {provenance.label || "Stub chain — not live market data."}
            </p>
          )}
          {top?.metrics.convexityProvisional && (
            <p>
              <strong>Provisional convexity:</strong> scores use a Phase-1 heuristic
              until calibration.
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-red-600">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-amber-700">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      {/* Rank results + simple payoff bars */}
      {ranked.length > 0 && (
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
          <h4 className="text-sm font-semibold">
            Ranked structures ({ranked.length}) · by{" "}
            <code className="text-xs">{String(summary?.ranked_by)}</code>
          </h4>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {ranked.slice(0, 12).map((row) => {
              const legs = (row.structure.legs || []) as Array<{
                strike: number;
                side: string;
                qty: number;
              }>;
              const strikes = legs.map((l) => l.strike).join("/");
              return (
                <div
                  key={row.rank}
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-xs"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">
                      #{row.rank} · {strikes}
                    </span>
                    <span className="tabular-nums">
                      debit ${row.metrics.debitOrCredit.toFixed(0)} · max loss $
                      {row.metrics.maxLoss.toFixed(0)} · R/W{" "}
                      {row.metrics.debitToWidthRatio?.toFixed(3) ?? "—"} · convex{" "}
                      {row.metrics.convexityScore.toFixed(0)}
                    </span>
                  </div>
                  {/* Mini payoff sketch: max profit vs max loss bars */}
                  <div className="mt-1 flex h-2 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (row.metrics.maxProfit /
                            Math.max(
                              row.metrics.maxProfit + row.metrics.maxLoss,
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                      title={`Max profit $${row.metrics.maxProfit.toFixed(0)}`}
                    />
                    <div
                      className="bg-red-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (row.metrics.maxLoss /
                            Math.max(
                              row.metrics.maxProfit + row.metrics.maxLoss,
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                      title={`Max loss $${row.metrics.maxLoss.toFixed(0)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
