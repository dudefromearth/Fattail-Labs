/** Client for /api/me/strategy-lab/* — identity-scoped strategies. */

import { getJSON, patchJSON, postJSON } from "@/lib/client";

export type PhaseKey = "development" | "curation" | "deployment" | "bin";

/** Board phases only (Archive page holds bin). */
export type BoardPhaseKey = "development" | "curation" | "deployment";

export type StrategyLabStrategy = {
  id: string;
  db_id?: number;
  product_key: string;
  name: string;
  description: string;
  version: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
  phase: PhaseKey | string;
  phase_state: string;
  phase_state_label: string;
  disposition: string;
  attributes: Record<string, unknown>;
  spec: Record<string, unknown> | null;
  lifecycle_log: Array<Record<string, unknown>>;
  bin_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PhaseMeta = {
  key: string;
  label: string;
  states: { key: string; label: string }[];
};

export async function fetchStrategyLabMeta(): Promise<{
  phases: PhaseMeta[];
  max_per_phase: number;
} | null> {
  return getJSON("/api/me/strategy-lab/meta");
}

export async function listStrategies(): Promise<{
  strategies: StrategyLabStrategy[];
  max_per_phase: number;
  identity_scoped: boolean;
} | null> {
  return getJSON("/api/me/strategy-lab/strategies");
}

export async function createStrategy(body?: {
  name?: string;
  description?: string;
}): Promise<StrategyLabStrategy | null> {
  const r = await postJSON("/api/me/strategy-lab/strategies", body || {});
  if (!r.ok) return null;
  const j = (await r.json()) as { strategy: StrategyLabStrategy };
  return j.strategy;
}

export async function patchStrategy(
  id: string,
  body: {
    name?: string;
    description?: string;
    phase_state?: string;
    bump_version?: boolean;
    bump_part?: "major" | "minor" | "patch";
  },
): Promise<{ strategy?: StrategyLabStrategy; error?: string }> {
  const r = await patchJSON(`/api/me/strategy-lab/strategies/${id}`, body);
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Update failed" };
  }
  return { strategy: j.strategy };
}

export async function advanceState(
  id: string,
): Promise<{ strategy?: StrategyLabStrategy; error?: string }> {
  const r = await postJSON(
    `/api/me/strategy-lab/strategies/${id}/advance-state`,
    {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Advance failed" };
  }
  return { strategy: j.strategy };
}

export async function moveStrategy(
  id: string,
  body: { phase: string; reason?: string; phase_state?: string },
): Promise<{ strategy?: StrategyLabStrategy; error?: string }> {
  const r = await postJSON(`/api/me/strategy-lab/strategies/${id}/move`, body);
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Move failed" };
  }
  return { strategy: j.strategy };
}

export type ValidationResultEntry = {
  at?: string;
  status?: string;
  kind?: string;
  metrics?: Record<string, unknown>;
  data_provenance?: { source?: string; label?: string };
};

export type StrategyValidationStatus = {
  validation: {
    backtest?: ValidationResultEntry;
    forward_walk?: ValidationResultEntry;
  };
  gaps: string[];
  ready_for_curation: boolean;
  phase_state?: string;
  phase_state_label?: string;
};

export async function runBacktest(
  id: string,
): Promise<{
  strategy?: StrategyLabStrategy;
  result?: ValidationResultEntry;
  error?: string;
}> {
  const r = await postJSON(`/api/me/strategy-lab/strategies/${id}/backtest`, {});
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    result?: ValidationResultEntry;
    detail?: string;
  };
  if (!r.ok) {
    return {
      error: typeof j.detail === "string" ? j.detail : "Back test failed",
    };
  }
  return { strategy: j.strategy, result: j.result };
}

export async function runForwardWalk(
  id: string,
): Promise<{
  strategy?: StrategyLabStrategy;
  result?: ValidationResultEntry;
  ready_for_curation?: boolean;
  error?: string;
}> {
  const r = await postJSON(
    `/api/me/strategy-lab/strategies/${id}/forward-walk`,
    {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    result?: ValidationResultEntry;
    ready_for_curation?: boolean;
    detail?: string;
  };
  if (!r.ok) {
    return {
      error: typeof j.detail === "string" ? j.detail : "Forward walk failed",
    };
  }
  return {
    strategy: j.strategy,
    result: j.result,
    ready_for_curation: j.ready_for_curation,
  };
}

export async function fetchValidation(
  id: string,
): Promise<StrategyValidationStatus | null> {
  return getJSON(`/api/me/strategy-lab/strategies/${id}/validation`);
}

export async function promoteStrategy(
  id: string,
): Promise<{ strategy?: StrategyLabStrategy; error?: string }> {
  const r = await postJSON(
    `/api/me/strategy-lab/strategies/${id}/promote`,
    {},
  );
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Promote failed" };
  }
  return { strategy: j.strategy };
}

export async function binStrategy(
  id: string,
  body: { disposition: "retired" | "trashed"; reason: string },
): Promise<{ strategy?: StrategyLabStrategy; error?: string }> {
  const r = await postJSON(`/api/me/strategy-lab/strategies/${id}/bin`, body);
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: StrategyLabStrategy;
    detail?: string;
  };
  if (!r.ok) {
    return { error: typeof j.detail === "string" ? j.detail : "Bin failed" };
  }
  return { strategy: j.strategy };
}

/** Whole-lab pack (Portability Spec v1.0). */
export type StrategyLabPack = {
  format: "fattail.labs.strategy_lab";
  model_version: string;
  foundation_version: number;
  exported_at: string;
  source: { system: string; env?: string; app?: string };
  identity: { export_subject: string; email?: string };
  lab: {
    schema_version: number;
    label?: string | null;
    counts: {
      development: number;
      curation: number;
      deployment: number;
      bin: number;
      total: number;
    };
  };
  strategies: Array<Record<string, unknown>>;
  campaigns: unknown[];
  reports: unknown[];
  lab_settings: Record<string, unknown>;
};

export type StrategyLabImportPreview = {
  ok: boolean;
  format?: string;
  model_version?: string;
  policy?: string;
  summary: {
    strategies_in_pack: number;
    create: number;
    skip: number;
    errors: number;
    warnings: number;
  };
  by_phase?: Record<
    string,
    { create: number; skip: number; after_total: number }
  >;
  issues?: Array<{
    level: string;
    code: string;
    detail?: string;
    strategy_export_key?: string;
  }>;
  error?: string;
  detail?: string;
};

export type StrategyLabImportResult = {
  ok: boolean;
  policy: string;
  created: number;
  skipped: number;
  purged?: number;
  public_ids_created?: string[];
  export_key_map?: Record<string, string>;
  recovery_id?: string | null;
};

export async function exportLabPack(opts?: {
  includeBin?: boolean;
}): Promise<StrategyLabPack | null> {
  const q =
    opts?.includeBin === false ? "?include_bin=false" : "";
  return getJSON(`/api/me/strategy-lab/export${q}`);
}

export async function downloadLabPack(opts?: {
  includeBin?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const q = opts?.includeBin === false ? "?include_bin=false" : "";
    const r = await fetch(`/api/me/strategy-lab/export${q}`, {
      credentials: "same-origin",
    });
    if (!r.ok) {
      return { ok: false, error: `Export failed (${r.status})` };
    }
    const pack = (await r.json()) as StrategyLabPack;
    const blob = new Blob([JSON.stringify(pack, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `strategy-lab-${day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "Export failed" };
  }
}

export async function previewLabImport(
  document: StrategyLabPack | Record<string, unknown>,
  policy: "additive" | "replace_lab" = "additive",
): Promise<{ preview?: StrategyLabImportPreview; error?: string }> {
  const r = await postJSON("/api/me/strategy-lab/import/preview", {
    document,
    policy,
  });
  const j = (await r.json().catch(() => ({}))) as
    | StrategyLabImportPreview
    | { detail?: string | { message?: string; preview?: StrategyLabImportPreview } };
  if (!r.ok) {
    if (typeof j === "object" && j && "detail" in j) {
      const d = j.detail;
      if (typeof d === "object" && d && "preview" in d && d.preview) {
        return { preview: d.preview as StrategyLabImportPreview };
      }
      return {
        error:
          typeof d === "string"
            ? d
            : (d as { message?: string })?.message || "Preview failed",
      };
    }
    return { error: "Preview failed" };
  }
  return { preview: j as StrategyLabImportPreview };
}

export async function commitLabImport(
  document: StrategyLabPack | Record<string, unknown>,
  policy: "additive" | "replace_lab" = "additive",
  confirm?: string,
): Promise<{ result?: StrategyLabImportResult; error?: string }> {
  const body: Record<string, unknown> = { document, policy };
  if (confirm) body.confirm = confirm;
  const r = await postJSON("/api/me/strategy-lab/import/commit", body);
  const j = (await r.json().catch(() => ({}))) as
    | StrategyLabImportResult
    | { detail?: string };
  if (!r.ok) {
    return {
      error:
        typeof j === "object" && j && "detail" in j && typeof j.detail === "string"
          ? j.detail
          : "Import failed",
    };
  }
  return { result: j as StrategyLabImportResult };
}

/** Active life-cycle bins (not Archive). */
export const BOARD_PHASE_ORDER: BoardPhaseKey[] = [
  "development",
  "curation",
  "deployment",
];

/** @deprecated use BOARD_PHASE_ORDER */
export const PHASE_ORDER: PhaseKey[] = [
  "development",
  "curation",
  "deployment",
  "bin",
];

export const PHASE_HINTS: Record<BoardPhaseKey, string> = {
  development: "Hypothesis · Model · Back test · Forward walk · Deployed",
  curation: "Categorized · Grouped · Sized · Monitored",
  deployment: "Strategy · Capital · Schedule · Run · Prune · Retro",
};
