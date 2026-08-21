/**
 * Analyzer ISO Picture-in-Picture — size + canvas corner.
 */

export const ANALYZER_PIP_KEY = "ft_analyzer_surface_pip_v1";

export type PipSize = "sm" | "md" | "lg";
export type PipCorner = "ul" | "ur" | "ll" | "lr";

export type AnalyzerPipPrefs = {
  on: boolean;
  size: PipSize;
  corner: PipCorner;
};

/** Small = former Large. Medium = 1.5× Small. Large = 2× Small. */
const PIP_SM = { w: 336, h: 252 };
export const PIP_SIZE_PX: Record<PipSize, { w: number; h: number }> = {
  sm: PIP_SM,
  md: { w: Math.round(PIP_SM.w * 1.5), h: Math.round(PIP_SM.h * 1.5) },
  lg: { w: PIP_SM.w * 2, h: PIP_SM.h * 2 },
};

export const DEFAULT_PIP: AnalyzerPipPrefs = {
  on: false,
  size: "md",
  corner: "ur",
};

export function asSize(raw: unknown): PipSize {
  return raw === "sm" || raw === "md" || raw === "lg" ? raw : DEFAULT_PIP.size;
}

export function asCorner(raw: unknown): PipCorner {
  return raw === "ul" || raw === "ur" || raw === "ll" || raw === "lr"
    ? raw
    : DEFAULT_PIP.corner;
}

export function loadAnalyzerPip(): AnalyzerPipPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PIP };
  try {
    const raw = window.localStorage.getItem(ANALYZER_PIP_KEY);
    if (!raw) return { ...DEFAULT_PIP };
    const j = JSON.parse(raw) as Partial<AnalyzerPipPrefs>;
    return {
      on: j.on === true,
      size: asSize(j.size),
      corner: asCorner(j.corner),
    };
  } catch {
    return { ...DEFAULT_PIP };
  }
}

export function saveAnalyzerPip(p: AnalyzerPipPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANALYZER_PIP_KEY, JSON.stringify(p));
  } catch {
    /* quota */
  }
}

export function pipCornerClass(corner: PipCorner): string {
  if (corner === "ul") return "top-2 left-2";
  if (corner === "ll") return "bottom-2 left-2";
  if (corner === "lr") return "bottom-2 right-2";
  return "top-2 right-2";
}
