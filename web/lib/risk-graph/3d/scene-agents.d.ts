declare module "@/lib/risk-graph/3d/alpha.js" {
  export function initScene(container: HTMLElement): {
    scene: import("three").Scene;
    renderer: import("three").WebGLRenderer;
    camera: import("three").Camera;
    startLoop: () => void;
    stopLoop: () => void;
    onResize: () => void;
    dispose: () => void;
    setCameraMode: (mode: "perspective" | "orthographic") => void;
  };
}

declare module "@/lib/risk-graph/3d/charlie.js" {
  export function buildCoords(
    range: {
      sMin: number;
      sMax: number;
      pMin: number;
      pMax: number;
      maxDTE: number;
    },
    viewport?: { width: number; height: number } | null,
  ): {
    nx: (s: number) => number;
    ny: (p: number) => number;
    nz: (d: number) => number;
    dx: (x: number) => number;
    dy: (y: number) => number;
    dz: (z: number) => number;
    range: {
      sMin: number;
      sMax: number;
      pMin: number;
      pMax: number;
      maxDTE: number;
    };
    extents: { x: number; y: number; z: number };
  };
}

declare module "@/lib/risk-graph/3d/echo.js" {
  export function buildReferenceBox(
    coords: unknown,
    scene: import("three").Scene,
    renderer?: unknown,
    opts?: unknown,
  ): { dispose?: () => void };
  export function buildZeroPnLPlane(
    coords: unknown,
    scene: import("three").Scene,
  ): { dispose: () => void };
  export function buildSpotPlane(
    coords: unknown,
    scene: import("three").Scene,
  ): { update: (spot: number, rtPnL: number) => void; dispose: () => void };
}
