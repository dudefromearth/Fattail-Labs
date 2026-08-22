/**
 * Runner run — TR5 purity. Template is a pure function of streams + controls.
 * I/O during compute → RunnerError('TEMPLATE_IO').
 *
 * Guarded surfaces (all six, always): fetch, XMLHttpRequest, WebSocket,
 * localStorage, sessionStorage, document.
 */

import {
  RunnerError,
  type HeatmapTiles,
  type RunnerControls,
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

  function install(name: string, value: unknown): void {
    try {
      Object.defineProperty(g, name, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } catch {
      g[name] = value;
    }
  }

  g.fetch = trap;
  g.XMLHttpRequest = function ForbiddenXHR() {
    trap();
  };
  g.WebSocket = function ForbiddenWS() {
    trap();
  };
  for (const name of ["localStorage", "sessionStorage", "document"] as const) {
    try {
      Object.defineProperty(g, name, {
        configurable: true,
        enumerable: true,
        get: trap,
        set: trap,
      });
    } catch {
      g[name] = trap;
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
        g[s.name] = s.value;
      }
    }
  }
}

export function run(
  template: RunnerTemplate,
  streams: RunnerStreams,
  controls: RunnerControls,
): HeatmapTiles {
  return withPurityGuard(() => template.compute(streams, controls));
}

export const TEMPLATE_IO_SURFACES = GUARDED;
