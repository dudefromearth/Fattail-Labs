/** Client for Strategy Pack APIs (Butterfly Phase 1). */

import { getJSON, postJSON } from "@/lib/client";

export type FieldDefinition = {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: (string | number)[];
  min?: number;
  max?: number;
  default?: unknown;
  dependsOn?: string[];
  description?: string;
};

export type PackMeta = {
  id: string;
  name: string;
  version: string;
  description: string;
  isEnabled: boolean;
};

export type PackDetail = PackMeta & {
  schema: {
    common: FieldDefinition[];
    variants: Record<string, FieldDefinition[]>;
    validationRules: string[];
  };
  ui: {
    layout: string;
    livePreview: boolean;
    sections: { id: string; title: string }[];
  };
  defaults: StrategyConfig[];
};

export type StrategyConfig = Record<string, unknown> & {
  name?: string;
  butterfly_family?: string;
  primary_metric?: string;
};

export type RankedStructure = {
  structure: Record<string, unknown>;
  metrics: {
    debitOrCredit: number;
    maxProfit: number;
    maxLoss: number;
    netPremiumAbs: number;
    debitToPayoffRatio: number | null;
    debitToWidthRatio?: number | null;
    convexityScore: number;
    convexityProvisional: boolean;
  };
  rank: number;
  score: number;
  ranked_by: string;
  primary_metric_substituted: boolean;
  data_provenance: { source: string; label?: string; provider?: string };
  reasons?: string[];
};

export async function listPacks(): Promise<PackMeta[]> {
  const j = await getJSON<{ packs: PackMeta[] }>("/api/me/strategy-lab/packs");
  return j?.packs || [];
}

export async function fetchPack(packId: string): Promise<PackDetail | null> {
  return getJSON(`/api/me/strategy-lab/packs/${packId}`);
}

export async function validatePackConfig(
  packId: string,
  config: StrategyConfig,
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const r = await postJSON(`/api/me/strategy-lab/packs/${packId}/validate`, {
    config,
  });
  const j = (await r.json().catch(() => ({}))) as {
    valid?: boolean;
    errors?: string[];
    warnings?: string[];
    detail?: string;
  };
  if (!r.ok) {
    return {
      valid: false,
      errors: [typeof j.detail === "string" ? j.detail : "Validate failed"],
      warnings: [],
    };
  }
  return {
    valid: !!j.valid,
    errors: j.errors || [],
    warnings: j.warnings || [],
  };
}

export async function rankPackConfig(
  packId: string,
  config: StrategyConfig,
  opts?: { strict_primary?: boolean },
): Promise<{
  ranked?: RankedStructure[];
  summary?: Record<string, unknown>;
  error?: string;
}> {
  const r = await postJSON(`/api/me/strategy-lab/packs/${packId}/rank`, {
    config,
    strict_primary: opts?.strict_primary ?? false,
  });
  const j = (await r.json().catch(() => ({}))) as {
    ranked?: RankedStructure[];
    summary?: Record<string, unknown>;
    detail?: { error?: string; message?: string } | string;
  };
  if (!r.ok) {
    const d = j.detail;
    const msg =
      typeof d === "string"
        ? d
        : d?.message || d?.error || "Rank failed";
    return { error: msg };
  }
  return { ranked: j.ranked, summary: j.summary };
}

export async function savePackConfig(
  strategyId: string,
  packId: string,
  config: StrategyConfig,
  bumpVersion = true,
): Promise<{ strategy?: unknown; error?: string }> {
  const r = await fetch(
    `/api/me/strategy-lab/strategies/${strategyId}/pack-config`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack_id: packId, config, bump_version: bumpVersion }),
    },
  );
  const j = (await r.json().catch(() => ({}))) as {
    strategy?: unknown;
    detail?: string;
  };
  if (!r.ok) {
    return {
      error: typeof j.detail === "string" ? j.detail : "Save pack config failed",
    };
  }
  return { strategy: j.strategy };
}

/** Whether a field's dependsOn is satisfied. */
export function fieldVisible(
  field: FieldDefinition,
  config: StrategyConfig,
): boolean {
  const deps = field.dependsOn;
  if (!deps || deps.length === 0) return true;
  return deps.every((d) => {
    const [k, v] = d.split("=");
    // boolean dependsOn: match_side_widths=false
    const raw = config[k];
    if (v === "true" || v === "false") {
      const b = raw === true || raw === "true";
      return v === "true" ? b : !b;
    }
    return String(raw ?? "") === v;
  });
}

function normalizeFamily(raw: unknown): string {
  const f = String(raw || "batman").toLowerCase();
  if (f === "symmetric" || f === "dual") return "batman";
  return f;
}

export function fieldsForConfig(
  detail: PackDetail,
  config: StrategyConfig,
): FieldDefinition[] {
  const family = normalizeFamily(config.butterfly_family);
  const variant = detail.schema.variants[family] || [];
  return [...detail.schema.common, ...variant];
}
