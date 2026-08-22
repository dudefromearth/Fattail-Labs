/**
 * Template Runner registry (TR-P1 · TR7 · TR8 · TR12).
 * One registry. Hosts differ by sink bindings, not by forked templates.
 */

export type RunnerErrorCode =
  | "UNKNOWN_TEMPLATE"
  | "UNDECLARED_SINK"
  | "TEMPLATE_IO"
  | "MISSING_SOCKET";

export class RunnerError extends Error {
  readonly code: RunnerErrorCode;
  constructor(code: RunnerErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RunnerError";
    this.code = code;
  }
}

export type RunnerOutputKind = "visual/heatmap";
export type RunnerCadence = "static";
export type RunnerSinkId = "render";

export type RunnerControls = Record<string, never>;

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
};

export type RunnerTemplate = {
  id: string;
  version: string;
  inputs: string[];
  controls: RunnerControls;
  outputKind: RunnerOutputKind;
  cadence: RunnerCadence;
  sinks: RunnerSinkId[];
  honesty: string;
  framing: string;
  nonClaim: string;
  compute: (streams: RunnerStreams, controls: RunnerControls) => HeatmapTiles;
};

const _reg = new Map<string, RunnerTemplate>();

function key(id: string, version: string): string {
  return `${id}@${version}`;
}

export function register(template: RunnerTemplate): void {
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

/**
 * Additive flag. Missing or any value other than "1" → current path.
 * Missing is not fail-loud (TR-P1 · DL-533).
 */
export function runnerShellEnabled(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
): boolean {
  return env.NEXT_PUBLIC_LABS_RUNNER_SHELL === "1";
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
