/**
 * Template Runner registry (TR-P1 · TR-P2 · TR7 · TR8 · TR12).
 * One registry. Hosts differ by sink bindings, not by forked templates.
 */

export type RunnerErrorCode =
  | "UNKNOWN_TEMPLATE"
  | "UNDECLARED_SINK"
  | "TEMPLATE_IO"
  | "MISSING_SOCKET"
  | "CONTROL_DEFAULT"
  | "CONTROL_INVALID"
  | "STALENESS_MISSING";

export class RunnerError extends Error {
  readonly code: RunnerErrorCode;
  constructor(code: RunnerErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RunnerError";
    this.code = code;
  }
}

export type RunnerOutputKind = "visual/heatmap";
export type RunnerCadence = "static" | "live";
export type RunnerSinkId = "render";

export type ControlKind = "number" | "select" | "toggle";

export type ControlDef = {
  id: string;
  kind: ControlKind;
  default: string | number | boolean;
  /** number: [min, max]. select: unused (see options). */
  bounds?: [number, number];
  /** select: allowed values */
  options?: string[];
};

export type ControlValues = Record<string, string | number | boolean>;

export type HeatmapTiles = {
  rows: { strike: number; label: string }[];
  cols: { id: string; label: string; widthPts: number }[];
  cells: Array<
    Array<{
      display: string | null;
      value: number | null;
      valid: boolean;
      colorT: number | null;
      bgCss?: string;
      tooltip?: string;
    }>
  >;
  contentHash: string | null;
};

export type RunnerStreams = {
  chain?: unknown;
  content_hash?: string | null;
  epoch_quality?: string | null;
  stale?: boolean;
};

export type RunnerTemplate = {
  id: string;
  version: string;
  inputs: string[];
  controls: ControlDef[];
  live: boolean;
  outputKind: RunnerOutputKind;
  cadence: RunnerCadence;
  sinks: RunnerSinkId[];
  honesty: string;
  framing: string;
  nonClaim: string;
  compute: (streams: RunnerStreams, controls: ControlValues) => HeatmapTiles;
};

const _reg = new Map<string, RunnerTemplate>();

function key(id: string, version: string): string {
  return `${id}@${version}`;
}

function assertControlDefaults(template: RunnerTemplate): void {
  if (!Array.isArray(template.controls)) {
    throw new RunnerError(
      "CONTROL_DEFAULT",
      `controls must be a schema array for ${template.id}@${template.version}`,
    );
  }
  for (const c of template.controls) {
    if (c.default === undefined) {
      throw new RunnerError(
        "CONTROL_DEFAULT",
        `control ${c.id} missing default (${template.id}@${template.version})`,
      );
    }
  }
}

export function register(template: RunnerTemplate): void {
  assertControlDefaults(template);
  _reg.set(key(template.id, template.version), template);
}

export function get(id: string, version: string): RunnerTemplate {
  const t = _reg.get(key(id, version));
  if (!t) {
    throw new RunnerError(
      "UNKNOWN_TEMPLATE",
      `Unknown template ${id}@${version}`,
    );
  }
  return t;
}

export function listRegistered(): RunnerTemplate[] {
  return [..._reg.values()];
}

/** Test helper — empty the registry. */
export function _resetRegistryForTests(): void {
  _reg.clear();
}

export function emitToSink(
  template: RunnerTemplate,
  sink: string,
): void {
  if (!template.sinks.includes(sink as RunnerSinkId)) {
    throw new RunnerError(
      "UNDECLARED_SINK",
      `Undeclared sink ${sink} for ${template.id}@${template.version}`,
    );
  }
}

export function controlDefaults(template: RunnerTemplate): ControlValues {
  const out: ControlValues = {};
  for (const c of template.controls) out[c.id] = c.default;
  return out;
}

export function runnerShellEnabled(
  env?: Record<string, string | undefined>,
): boolean {
  if (env) return env.NEXT_PUBLIC_LABS_RUNNER_SHELL === "1";
  return process.env.NEXT_PUBLIC_LABS_RUNNER_SHELL === "1";
}

export function tilesHash(tiles: HeatmapTiles): string {
  const body = JSON.stringify({
    rows: tiles.rows.map((r) => r.strike),
    cols: tiles.cols.map((c) => c.widthPts),
    cells: tiles.cells.map((row) =>
      row.map((c) => [c.display, c.value, c.valid, c.colorT, c.bgCss ?? ""]),
    ),
    contentHash: tiles.contentHash,
  });
  let h = 0;
  for (let i = 0; i < body.length; i++) {
    h = (Math.imul(31, h) + body.charCodeAt(i)) | 0;
  }
  return `${h.toString(16)}:${body.length}`;
}
