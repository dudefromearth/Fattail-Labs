/**
 * Runner run — TR5 purity + TR-P2 control validation.
 * Unknown / out-of-bounds control → CONTROL_INVALID (no coerce, no clamp).
 */

import {
  controlDefaults,
  RunnerError,
  type ControlValues,
  type HeatmapTiles,
  type RunnerStreams,
  type RunnerTemplate,
} from "./registry";

type GlobalBag = typeof globalThis & Record<string, unknown>;

const GUARDED = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "document",
] as const;

function trap(): never {
  throw new RunnerError("TEMPLATE_IO", "template attempted I/O");
}

function withPurityGuard<T>(fn: () => T): T {
  const g = globalThis as GlobalBag;
  const saved = GUARDED.map((name) => ({
    name,
    desc: Object.getOwnPropertyDescriptor(g, name),
    value: g[name],
  }));

  const bag = g as Record<string, unknown>;
  bag.fetch = trap;
  bag.XMLHttpRequest = function ForbiddenXHR() {
    trap();
  };
  bag.WebSocket = function ForbiddenWS() {
    trap();
  };
  for (const name of ["localStorage", "sessionStorage", "document"] as const) {
    const desc =
      Object.getOwnPropertyDescriptor(g, name) ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g), name);
    if (desc && desc.configurable === false) continue;
    try {
      Object.defineProperty(g, name, {
        configurable: true,
        enumerable: true,
        get: trap,
        set: trap,
      });
    } catch {
      bag[name] = trap;
    }
  }

  try {
    return fn();
  } finally {
    for (const s of saved) {
      try {
        if (s.desc) {
          Object.defineProperty(g, s.name, s.desc);
        } else {
          delete g[s.name];
        }
      } catch {
        (g as Record<string, unknown>)[s.name] = s.value;
      }
    }
  }
}

export function validateControls(
  template: RunnerTemplate,
  supplied: ControlValues,
): ControlValues {
  const schema = new Map(template.controls.map((c) => [c.id, c]));
  for (const id of Object.keys(supplied)) {
    if (!schema.has(id)) {
      throw new RunnerError(
        "CONTROL_INVALID",
        `unknown control ${id} (${template.id}@${template.version})`,
      );
    }
  }
  const merged = { ...controlDefaults(template), ...supplied };
  for (const def of template.controls) {
    const v = merged[def.id];
    if (def.kind === "number") {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new RunnerError(
          "CONTROL_INVALID",
          `control ${def.id} not a finite number`,
        );
      }
      if (def.bounds) {
        const [lo, hi] = def.bounds;
        if (v < lo || v > hi) {
          throw new RunnerError(
            "CONTROL_INVALID",
            `control ${def.id} out of bounds`,
          );
        }
      }
    } else if (def.kind === "select") {
      const opts = def.options ?? [];
      if (typeof v !== "string" || !opts.includes(v)) {
        throw new RunnerError(
          "CONTROL_INVALID",
          `control ${def.id} not in options`,
        );
      }
    } else if (def.kind === "toggle") {
      if (typeof v !== "boolean") {
        throw new RunnerError(
          "CONTROL_INVALID",
          `control ${def.id} not a boolean`,
        );
      }
    }
  }
  return merged;
}

export function run(
  template: RunnerTemplate,
  streams: RunnerStreams,
  controls: ControlValues,
): HeatmapTiles {
  const values = validateControls(template, controls);
  return withPurityGuard(() => template.compute(streams, values));
}

export const TEMPLATE_IO_SURFACES = GUARDED;
