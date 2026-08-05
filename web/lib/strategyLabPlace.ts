/**
 * Per-phase place memory for Strategy Lab navigation continuity.
 * Spec: Specs/Strategy-Lab-Navigation-Continuity-Spec-v1.0.md
 *
 * localStorage (v1) — survives tab close and overnight on the same device;
 * still per-device; clear on logout via clearLabDeskPlace().
 * Payload is strategy IDs + chrome state only (not pack secrets).
 */

export type BoardPhaseKey = "development" | "curation" | "deployment";

export type PhasePlace = {
  strategy_id: string | null;
  updated_at: string;
};

export type LabDeskPlace = {
  active_phase: BoardPhaseKey;
  places: Record<BoardPhaseKey, PhasePlace>;
};

const STORAGE_KEY = "ft.strategyLab.place.v1";

const EMPTY_PLACE = (): PhasePlace => ({
  strategy_id: null,
  updated_at: new Date().toISOString(),
});

export function defaultLabDeskPlace(
  active: BoardPhaseKey = "development",
): LabDeskPlace {
  return {
    active_phase: active,
    places: {
      development: EMPTY_PLACE(),
      curation: EMPTY_PLACE(),
      deployment: EMPTY_PLACE(),
    },
  };
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) return fromLocal;
    // One-time migrate from earlier sessionStorage builds
    const legacy = sessionStorage.getItem(STORAGE_KEY);
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy);
      sessionStorage.removeItem(STORAGE_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadLabDeskPlace(): LabDeskPlace {
  if (typeof window === "undefined") return defaultLabDeskPlace();
  try {
    const raw = readRaw();
    if (!raw) return defaultLabDeskPlace();
    const parsed = JSON.parse(raw) as LabDeskPlace;
    if (!parsed?.places) return defaultLabDeskPlace();
    return {
      active_phase:
        parsed.active_phase === "curation" ||
        parsed.active_phase === "deployment" ||
        parsed.active_phase === "development"
          ? parsed.active_phase
          : "development",
      places: {
        development: {
          strategy_id: parsed.places.development?.strategy_id ?? null,
          updated_at:
            parsed.places.development?.updated_at || new Date().toISOString(),
        },
        curation: {
          strategy_id: parsed.places.curation?.strategy_id ?? null,
          updated_at:
            parsed.places.curation?.updated_at || new Date().toISOString(),
        },
        deployment: {
          strategy_id: parsed.places.deployment?.strategy_id ?? null,
          updated_at:
            parsed.places.deployment?.updated_at || new Date().toISOString(),
        },
      },
    };
  } catch {
    return defaultLabDeskPlace();
  }
}

export function saveLabDeskPlace(place: LabDeskPlace): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
  } catch {
    // quota / private mode — continuity best-effort
  }
}

/** Clear place memory (logout, identity switch). */
export function clearLabDeskPlace(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function rememberStrategyInPhase(
  place: LabDeskPlace,
  phase: BoardPhaseKey,
  strategyId: string | null,
): LabDeskPlace {
  const next: LabDeskPlace = {
    active_phase: phase,
    places: {
      ...place.places,
      [phase]: {
        strategy_id: strategyId,
        updated_at: new Date().toISOString(),
      },
    },
  };
  saveLabDeskPlace(next);
  return next;
}

export function setActivePhase(
  place: LabDeskPlace,
  phase: BoardPhaseKey,
): LabDeskPlace {
  const next = { ...place, active_phase: phase };
  saveLabDeskPlace(next);
  return next;
}
