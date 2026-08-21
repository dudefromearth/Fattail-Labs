/**
 * Labs-owned Surface scene. Input: SurfaceSheet. No OPF, no Massive, no MSC.
 * W3-2: perspective · orbit · Slow zoom · Fit · ISO. DPR cap 2.
 */

import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { SurfaceSheet } from "../surfaceModel";
import type { CandleBox } from "../surfaceCandles";
import { zeroPnlBoxPolylines } from "../surfaceZero";
import { boxHalfExtents, frameRadius, orthoHalfExtents, type BoxExtents } from "./box";
import {
  surfaceBoxY,
  tauToBoxZ,
  timeCutPoints,
  valueWindowForSheet,
} from "./timeCut";
import { SURFACE_PAD_FRAC, type ValueWindow } from "../surfaceAutofit";
import {
  surfaceFillEnabled,
  SURFACE_VALUE_PLANE_OPACITY_DEFAULT,
  type SurfaceDrawStyle,
} from "./style";
import { clampRelief, RELIEF_DEFAULT, surfaceReliefFromHeights } from "../surfaceRelief";
import { elapsedToBoxZ } from "../surfaceInspect";
import { timeToBoxZ } from "../surfaceCandles";
import {
  formatExpiryClock,
  isRthEt,
  listTimeAxisMarks,
  markBoxZ,
  openToExpirySpan,
  sheetTimeWindow,
  type TimeAxisMark,
  type TimeAxisWindow,
} from "../surfaceTimeAxis";
import {
  PERSPECTIVE_FOV,
  SLOW_ZOOM_GAIN,
  eyeRadius,
  isoPose,
  orbitPose,
  poseWithRadius,
  zoomPose,
  type CameraPose,
  type FactoryViewId,
} from "./camera";

export type PlaneInspect = {
  visible: boolean;
  opacity: number;
  position: number;
};

export type { SurfaceDrawStyle } from "./style";
export { surfaceFillEnabled, SURFACE_VALUE_PLANE_OPACITY_DEFAULT } from "./style";

export type SurfaceSceneHandle = {
  setSheet(sheet: SurfaceSheet | null): void;
  setGhostSheet(sheet: SurfaceSheet | null): void;
  setInspect(patch: {
    camera?: CameraPose;
    timePlayhead?: number;
    /** 0 = Now wall, 1 = Expiry wall. Locks the cut to the box ticks. */
    timeElapsed?: number;
    altered?: boolean;
    valueWindow?: ValueWindow;
    zoomGain?: number;
    spots?: Array<{ on: boolean; brightness: number }>;
    planes?: Partial<Record<"strike" | "time" | "value", PlaneInspect>>;
    candlesOn?: boolean;
    /** 0 = flat color, 1 = max slope/crease darkening. */
    relief?: number;
  }): void;
  setCandles(boxes: CandleBox[]): void;
  setSurfaceLocked(locked: boolean): void;
  dispose(): void;
  fit(): void;
  applyFactoryView(id: import("./camera").FactoryViewId): void;
  setProjection(next: import("./camera").CameraProjection): void;
  orbitBy(dxPx: number, dyPx: number): void;
  zoomBy(deltaY: number): void;
  getPose(): CameraPose;
  /** Screen X of the Now (+Z) and Expiry (−Z) walls — Time Ortho left→right. */
  getTimeAxisScreen(): { nowX: number; expiryX: number };
  /** Pin Now/Expiry to tape X and box sMin/sMax to tape Y (shared strike scale). */
  alignTimeOrtho(
    span: {
      nowX: number;
      expiryX: number;
      sMinY?: number;
      sMaxY?: number;
    } | null,
  ): void;
  /** Removed: T+0 BE ghost rails. Call still clears leftovers. */
  setBeGhosts(strikes: number[]): void;
  /** Paint now and return the WebGL canvas (same-turn read for capture). */
  captureCanvas(): HTMLCanvasElement;
};

const DPR_CAP = 2;
/** Analyzer Risk T+0 — PnLChart theoreticalStroke, rest width 2. */
const T0_STROKE = 0xe879f9;
const T0_WIDTH_PX = 2;
const EXPIRY_STROKE = 0x67e8f9;
const EXPIRY_WIDTH_PX = 2;
/** $0 ∩ surface — a little thicker than magenta Real Time. */
const ZERO_STROKE = 0xfde68a;
const ZERO_WIDTH_PX = 2.6;
/** Listed-strike orbs + floor rails. */
const STRIKE_MARK = 0xc2410c;
/** Analyzer Spot field is `text-yellow-400`. */
const SPOT_MARK = 0xfacc15;
const SPOT_MARK_CSS = "#facc15";
const ZERO_BLEND = 0.045;

function resolveDpr(): number {
  const raw =
    typeof window !== "undefined" ? window.devicePixelRatio : 1;
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new Error("surfaceScene: devicePixelRatio unbounded or invalid");
  }
  return Math.min(raw, DPR_CAP);
}

function look(cam: THREE.Camera, pose: CameraPose) {
  const up = pose.up ?? { x: 0, y: 1, z: 0 };
  cam.up.set(up.x, up.y, up.z);
  cam.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
  cam.lookAt(pose.lookAt.x, pose.lookAt.y, pose.lookAt.z);
  // Mirror in camera X so Now sits on the left without a reversed frustum
  // (left > right breaks setViewOffset and the view does not change).
  cam.scale.set(pose.flipX ? -1 : 1, 1, 1);
  cam.updateMatrixWorld(true);
}

function buildSurface(
  sheet: SurfaceSheet,
  value: ValueWindow,
  style: SurfaceDrawStyle = "solid",
): THREE.Group {
  const nx = sheet.spotAxis.length;
  const nVis = sheet.timeAxis.length;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(nVis * nx * 3);
  const s0 = sheet.sMin;
  const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
  const zOf = (k: number) =>
    nVis <= 1 ? 1 : 1 - (k / (nVis - 1)) * 2;
  for (let k = 0; k < nVis; k++) {
    for (let i = 0; i < nx; i++) {
      const dest = k * nx + i;
      const pnl = sheet.pnlGrid[k][i];
      positions[dest * 3] = ((sheet.spotAxis[i] - s0) / sSpan) * 2 - 1;
      positions[dest * 3 + 1] = surfaceBoxY(pnl, value.yMin, value.yMax);
      positions[dest * 3 + 2] = zOf(k);
    }
  }
  const indices: number[] = [];
  for (let k = 0; k < nVis - 1; k++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = k * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const heights = new Float32Array(nVis * nx);
  for (let v = 0; v < heights.length; v++) heights[v] = positions[v * 3 + 1];
  geo.setAttribute(
    "relief",
    new THREE.BufferAttribute(surfaceReliefFromHeights(heights, nx, nVis), 1),
  );
  const zeroY = surfaceBoxY(0, value.yMin, value.yMax);
  const ghost = style === "ghost";
  const group = new THREE.Group();
  group.name = ghost ? "surface-ghost" : "surface-solid";
  if (surfaceFillEnabled(style)) {
    const mesh = new THREE.Mesh(geo, makeSignedPnlMaterial(zeroY));
    mesh.name = "surface-fill";
    group.add(mesh);
  }
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({
      color: ghost ? 0x9ca3af : 0x6b7c8a,
      transparent: true,
      opacity: ghost ? 0.62 : 0.28,
    }),
  );
  wire.name = ghost ? "surface-ghost-wire" : "surface-wire";
  group.add(wire);
  for (let k = 1; k < nVis - 1; k++) {
    const line = edgeLine(positions, nx, k, ghost ? 0x9ca3af : 0x64748b);
    (line.material as THREE.LineBasicMaterial).opacity = ghost ? 0.48 : 0.32;
    group.add(line);
  }
  if (nVis > 0) {
    group.add(
      fatLine(
        positions,
        nx,
        nVis - 1,
        ghost ? 0x9ca3af : EXPIRY_STROKE,
        EXPIRY_WIDTH_PX,
      ),
    );
  }
  let zi = 0;
  for (const pts of zeroPnlBoxPolylines(sheet, zeroY)) {
    const line = fatPolyline(pts, ZERO_STROKE, ZERO_WIDTH_PX, 1, true);
    line.name = zi === 0 ? "zero-pnl" : `zero-pnl-${zi}`;
    line.material.depthTest = false;
    line.renderOrder = 2;
    group.add(line);
    zi += 1;
  }
  const marks = sheet.listedStrikes || [];
  const seen = new Set<number>();
  for (const k of marks) {
    if (!Number.isFinite(k)) continue;
    const x = ((k - s0) / sSpan) * 2 - 1;
    if (x < -1.05 || x > 1.05) continue;
    const key = Math.round(k * 1e6) / 1e6;
    if (seen.has(key)) continue;
    seen.add(key);
    const rail = fatPolyline(
      [x, -1, 1, x, -1, -1],
      STRIKE_MARK,
      1.5,
      0.95,
      true,
    );
    rail.name = `strike-rail-${key}`;
    group.add(rail);
  }
  const spotX = ((sheet.spot - s0) / sSpan) * 2 - 1;
  if (spotX >= -1.05 && spotX <= 1.05) {
    const spotLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(spotX, -1, 1),
        new THREE.Vector3(spotX, 1, 1),
      ]),
      new THREE.LineBasicMaterial({
        color: SPOT_MARK,
        transparent: true,
        opacity: 0.55,
      }),
    );
    group.add(spotLine);
  }
  return group;
}

function rowPoints(
  positions: Float32Array,
  nx: number,
  j: number,
): Float32Array {
  const pts = new Float32Array(nx * 3);
  for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    pts[i * 3] = positions[k * 3];
    pts[i * 3 + 1] = positions[k * 3 + 1];
    pts[i * 3 + 2] = positions[k * 3 + 2];
  }
  return pts;
}

function edgeLine(
  positions: Float32Array,
  nx: number,
  j: number,
  color: number,
): THREE.Line {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(rowPoints(positions, nx, j), 3));
  return new THREE.Line(
    g,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
}

/** Fragment-shaded profit/loss so $0 is a smooth iso, not a vertex-color stair. */
function makeSignedPnlMaterial(zeroY: number): THREE.MeshPhongMaterial {
  const mat = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78,
    shininess: 36,
    color: 0xffffff,
  });
  mat.userData.uLossAlpha = { value: 1 };
  mat.userData.uProfitAlpha = { value: 1 };
  mat.userData.uRelief = { value: RELIEF_DEFAULT };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uZeroBand = { value: ZERO_BLEND };
    shader.uniforms.uZeroY = { value: zeroY };
    shader.uniforms.uLossAlpha = mat.userData.uLossAlpha;
    shader.uniforms.uProfitAlpha = mat.userData.uProfitAlpha;
    shader.uniforms.uRelief = mat.userData.uRelief;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float relief;\nvarying float vPnlY;\nvarying float vRelief;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvPnlY = position.y;\nvRelief = relief;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vPnlY;\nvarying float vRelief;\nuniform float uZeroBand;\nuniform float uZeroY;\nuniform float uLossAlpha;\nuniform float uProfitAlpha;\nuniform float uRelief;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float band = max(uZeroBand, 1e-4);
        float signedPnl = vPnlY - uZeroY;
        float t = smoothstep(-band, band, signedPnl);
        vec3 profit = vec3(0.16, 0.86, 0.42);
        vec3 loss = vec3(0.725, 0.110, 0.110);
        float mag = 0.35 + 0.65 * min(1.0, abs(signedPnl));
        float overlay = step(0.001, 1.0 - min(uLossAlpha, uProfitAlpha));
        float shade = mix(mag, 1.0, overlay);
        float fold = clamp(vRelief, 0.0, 1.0);
        float hi = uRelief * uRelief;
        fold = mix(fold, pow(fold, 0.32), hi);
        float gain = mix(0.78, 1.0, hi);
        shade *= max(0.0, 1.0 - uRelief * fold * gain);
        shade *= max(0.0, 1.0 - hi * fold * 0.88);
        diffuseColor.rgb = mix(loss, profit, t) * shade;
        diffuseColor.a *= mix(uLossAlpha, uProfitAlpha, t);`,
      );
  };
  mat.customProgramCacheKey = () => `surface-signed-pnl-${ZERO_BLEND}-relief`;
  return mat;
}

function fatPolyline(
  pts: number[],
  color: number,
  widthPx: number,
  opacity = 1,
  antialias = false,
): Line2 {
  const geo = new LineGeometry();
  geo.setPositions(pts);
  const mat = new LineMaterial({
    color,
    linewidth: widthPx,
    worldUnits: false,
    transparent: true,
    opacity,
    alphaToCoverage: antialias,
    toneMapped: false,
    depthTest: true,
  });
  const line = new Line2(geo, mat);
  line.computeLineDistances();
  return line;
}

/** Pixel-width polyline. Analyzer T+0 is canvas lineWidth 2 — GL LineBasic is 1px on Mac. */
function fatLine(
  positions: Float32Array,
  nx: number,
  j: number,
  color: number,
  widthPx: number,
): Line2 {
  const geo = new LineGeometry();
  geo.setPositions(Array.from(rowPoints(positions, nx, j)));
  const mat = new LineMaterial({
    color,
    linewidth: widthPx,
    worldUnits: false,
    transparent: true,
    opacity: 1,
    toneMapped: false,
    depthTest: true,
  });
  const line = new Line2(geo, mat);
  line.computeLineDistances();
  return line;
}

function makeTnLine(): Line2 {
  const line = fatLine(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 2, 0, T0_STROKE, T0_WIDTH_PX);
  line.name = "realtime-pnl";
  line.visible = false;
  line.material.depthTest = false;
  return line;
}

function setTnPoints(line: Line2, pts: number[]) {
  if (pts.length < 6) {
    line.visible = false;
    return;
  }
  line.geometry.setPositions(pts);
  line.computeLineDistances();
  line.visible = true;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) (mat as THREE.Material).dispose();
  });
}

const BOX_REALITY = 0x8b8b96;
const BOX_ALTERED = 0xef4444;

function makeBoxFrame(scale = 2, color = BOX_REALITY, opacity = 0.45): THREE.LineSegments {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(scale, scale, scale)),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
}

const BOX_EDGE_POS = [
  -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, -1,
  -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, 1,
  -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, -1, 1, 1,
];

function makeBoxGlow(widthPx: number, opacity: number): LineSegments2 {
  const geo = new LineSegmentsGeometry();
  geo.setPositions(BOX_EDGE_POS);
  const mat = new LineMaterial({
    color: BOX_ALTERED,
    linewidth: widthPx,
    worldUnits: false,
    transparent: true,
    opacity,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
  });
  const line = new LineSegments2(geo, mat);
  line.visible = false;
  return line;
}

function factoryPose(
  id: FactoryViewId,
  box: BoxExtents,
  aspect: number,
  zoomGain: number,
  planeZ = 0,
): CameraPose {
  const r = frameRadius(box, aspect);
  const look = { x: 0, y: 0, z: 0 };
  const g = zoomGain || SLOW_ZOOM_GAIN;
  if (id === "iso" || id === "fit") {
    return poseWithRadius({ ...isoPose(), zoomGain: g }, r);
  }
  if (id === "now" || id === "time") {
    const z = planeZ * box.hz;
    return {
      projection: "orthographic",
      eye: { x: 0, y: 0, z: z + r },
      lookAt: { x: 0, y: 0, z },
      zoomGain: g,
    };
  }
  if (id === "expiry") {
    return {
      projection: "perspective",
      eye: { x: 0, y: box.hy * 0.35, z: -r },
      lookAt: look,
      zoomGain: g,
    };
  }
  if (id === "spot") {
    return {
      projection: "perspective",
      eye: { x: r, y: box.hy * 0.35, z: 0 },
      lookAt: look,
      zoomGain: g,
    };
  }
  if (id === "timeOrtho") {
    // From below: Expiry (−Z) to the right, strike (+X) up. No frustum flip.
    return {
      projection: "orthographic",
      eye: { x: 0, y: -r, z: 1e-4 },
      lookAt: look,
      zoomGain: g,
      up: { x: 1, y: 0, z: 0 },
    };
  }
  if (id === "top") {
    return {
      projection: "perspective",
      eye: { x: 0, y: r, z: 0.04 },
      lookAt: look,
      zoomGain: g,
    };
  }
  throw new Error(`applyFactoryView: unknown ${id}`);
}

export function mountSurfaceScene(
  host: HTMLElement,
  init: { sheet?: SurfaceSheet | null; windowLift?: boolean } = {},
): SurfaceSceneHandle {
  /** Full Surface page centers the box on the window. PiP must not. */
  const windowLift = init.windowLift !== false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0e);
  const persp = new THREE.PerspectiveCamera(PERSPECTIVE_FOV, 1, 0.05, 80);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 80);
  let camera: THREE.Camera = persp;
  let pose = isoPose();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x0a0a0e, 1);
  renderer.setPixelRatio(resolveDpr());
  const canvas = renderer.domElement;
  canvas.dataset.testid = "surface-webgl";
  canvas.style.display = "block";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";
  canvas.style.zIndex = "1";
  let surfaceLocked = false;
  const applySurfaceLock = (locked: boolean) => {
    surfaceLocked = locked;
    host.dataset.surfaceLocked = locked ? "1" : "0";
    canvas.style.pointerEvents = locked ? "none" : "auto";
    canvas.style.cursor = locked ? "default" : "grab";
  };
  const chart2d = document.createElement("canvas");
  chart2d.dataset.testid = "surface-time-ortho-chart";
  chart2d.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  host.style.overflow = "hidden";
  host.style.position = host.style.position || "relative";
  host.dataset.heightPad = String(SURFACE_PAD_FRAC);
  host.replaceChildren(chart2d, canvas);
  // CSS size = host CSS pixels. updateStyle true so a Retina
  // backing store does not display at 2× and crop to a plane face.
  renderer.setSize(Math.max(host.clientWidth, 1), Math.max(host.clientHeight, 1), true);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(2, 3, 1);
  scene.add(key);
  const world = new THREE.Group();
  world.name = "surface-box";
  scene.add(world);
  /** Corner spots: top four, then bottom four. Each aims at the opposite corner. */
  const CORNER_SPOTS: Array<{ pos: [number, number, number]; aim: [number, number, number] }> = [
    { pos: [1.08, 1.08, 1.08], aim: [-1, -1, -1] },
    { pos: [-1.08, 1.08, 1.08], aim: [1, -1, -1] },
    { pos: [1.08, 1.08, -1.08], aim: [-1, -1, 1] },
    { pos: [-1.08, 1.08, -1.08], aim: [1, -1, 1] },
    { pos: [1.08, -1.08, 1.08], aim: [-1, 1, -1] },
    { pos: [-1.08, -1.08, 1.08], aim: [1, 1, -1] },
    { pos: [1.08, -1.08, -1.08], aim: [-1, 1, 1] },
    { pos: [-1.08, -1.08, -1.08], aim: [1, 1, 1] },
  ];
  const cornerSpots = CORNER_SPOTS.map(({ pos, aim }) => {
    const spot = new THREE.SpotLight(0xfff6e8, 0, 12, Math.PI / 5.2, 0.45, 1.05);
    spot.position.set(pos[0], pos[1], pos[2]);
    spot.target.position.set(aim[0], aim[1], aim[2]);
    spot.castShadow = false;
    world.add(spot);
    world.add(spot.target);
    return spot;
  });
  const layoutSpots = (lamps: Array<{ on: boolean; brightness: number }>) => {
    for (let i = 0; i < cornerSpots.length; i++) {
      const lamp = lamps[i];
      const on = !!(lamp && lamp.on);
      const b =
        lamp && Number.isFinite(lamp.brightness)
          ? Math.min(1, Math.max(0, lamp.brightness))
          : 0;
      cornerSpots[i].visible = on && b > 0;
      cornerSpots[i].intensity = on ? b * 2.4 : 0;
    }
    host.dataset.spots = lamps
      .map((l) => `${l.on ? 1 : 0}:${l.brightness}`)
      .join(",");
    paint();
  };
  const boxFrame = makeBoxFrame(2, BOX_REALITY, 0.45);
  boxFrame.name = "surface-box-wire";
  world.add(boxFrame);
  const tickGeo = new THREE.BufferGeometry();
  const tickMat = new THREE.LineBasicMaterial({
    color: BOX_REALITY,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const tickLines = new THREE.LineSegments(tickGeo, tickMat);
  tickLines.name = "surface-time-ticks";
  tickLines.frustumCulled = false;
  world.add(tickLines);
  const SESSION_WIDTH_PX = 2.4;
  const sessionGeo = new LineSegmentsGeometry();
  const sessionMat = new LineMaterial({
    color: BOX_REALITY,
    linewidth: SESSION_WIDTH_PX,
    worldUnits: false,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
    depthTest: true,
    depthWrite: false,
  });
  const sessionRails = new LineSegments2(sessionGeo, sessionMat);
  sessionRails.name = "surface-session-rail";
  sessionRails.frustumCulled = false;
  world.add(sessionRails);
  const heavyTickGeo = new LineSegmentsGeometry();
  const heavyTickMat = new LineMaterial({
    color: BOX_REALITY,
    linewidth: SESSION_WIDTH_PX,
    worldUnits: false,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
    depthTest: true,
    depthWrite: false,
  });
  const heavyTicks = new LineSegments2(heavyTickGeo, heavyTickMat);
  heavyTicks.name = "surface-time-ticks-rth";
  heavyTicks.frustumCulled = false;
  world.add(heavyTicks);
  const boxGlowA = makeBoxGlow(7, 0.22);
  const boxGlowB = makeBoxGlow(3, 0.55);
  boxGlowA.name = "surface-box-glow-a";
  boxGlowB.name = "surface-box-glow-b";
  world.add(boxGlowA);
  world.add(boxGlowB);
  const layoutBoxAltered = (next: boolean) => {
    const mat = boxFrame.material as THREE.LineBasicMaterial;
    mat.color.setHex(next ? BOX_ALTERED : BOX_REALITY);
    mat.opacity = next ? 0.95 : 0.45;
    tickMat.color.setHex(next ? BOX_ALTERED : BOX_REALITY);
    tickMat.opacity = next ? 0.95 : 0.45;
    sessionMat.color.setHex(next ? BOX_ALTERED : BOX_REALITY);
    sessionMat.opacity = next ? 0.95 : 0.72;
    heavyTickMat.color.setHex(next ? BOX_ALTERED : BOX_REALITY);
    heavyTickMat.opacity = next ? 0.95 : 0.72;
    boxGlowA.visible = next;
    boxGlowB.visible = next;
    host.dataset.altered = next ? "1" : "0";
  };

  const labels = document.createElement("div");
  labels.dataset.testid = "surface-box-labels";
  labels.style.cssText =
    "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;";
  const eggCap = document.createElement("span");
  eggCap.dataset.testid = "surface-time-ortho-egg";
  eggCap.textContent = "live · strike × time";
  eggCap.style.cssText =
    "position:absolute;left:50%;bottom:1.25rem;transform:translateX(-50%);" +
    "color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.16em;" +
    "text-transform:uppercase;display:none;";
  labels.appendChild(eggCap);
  const mkLab = (id: string, text: string) => {
    const s = document.createElement("span");
    s.dataset.axis = id;
    s.textContent = text;
    s.style.cssText =
      "position:absolute;transform:translate(-50%,-50%);color:rgba(255,255,255,0.45);" +
      "font-size:11px;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;";
    labels.appendChild(s);
    return s;
  };
  const labStrike = mkLab("strike", "Strike");
  const labPnl = mkLab("pnl", "P&L");
  const labNow = mkLab("now", "Now");
  const labNowOpp = mkLab("now-opp", "Now");
  const decorateExpiry = (el: HTMLElement, testId: string) => {
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    el.style.gap = "1px";
    el.style.whiteSpace = "normal";
    el.replaceChildren();
    const title = document.createElement("span");
    title.textContent = "Expiry";
    const at = document.createElement("span");
    at.dataset.testid = testId;
    at.style.cssText =
      "font-size:10px;letter-spacing:0.04em;text-transform:none;" +
      "color:rgba(255,255,255,0.40);font-variant-numeric:tabular-nums;";
    el.append(title, at);
    return at;
  };
  const labExpiry = mkLab("expiry", "Expiry");
  const labExpiryAt = decorateExpiry(labExpiry, "surface-expiry-clock");
  const labExpiryOpp = mkLab("expiry-opp", "Expiry");
  const labExpiryAtOpp = decorateExpiry(labExpiryOpp, "surface-expiry-clock-opp");
  const labTn = mkLab("tn", "tn");
  host.appendChild(labels);

  type StrikeHud = { x: number; k: number; orb: HTMLElement; lab: HTMLElement };
  const strikeHud: StrikeHud[] = [];
  const formatStrike = (k: number) => {
    if (Math.abs(k - Math.round(k)) < 1e-6) return String(Math.round(k));
    return String(k);
  };
  const clearStrikeHud = () => {
    for (const h of strikeHud) {
      h.orb.remove();
      h.lab.remove();
    }
    strikeHud.length = 0;
  };
  const rebuildStrikeHud = (sheet: SurfaceSheet | null) => {
    clearStrikeHud();
    if (!sheet) return;
    const s0 = sheet.sMin;
    const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
    const seen = new Set<number>();
    for (const k of sheet.listedStrikes || []) {
      if (!Number.isFinite(k)) continue;
      const key = Math.round(k * 1e6) / 1e6;
      if (seen.has(key)) continue;
      seen.add(key);
      const x = ((k - s0) / sSpan) * 2 - 1;
      if (x < -1.05 || x > 1.05) continue;
      const orb = document.createElement("span");
      orb.dataset.strikeOrb = String(key);
      orb.style.cssText =
        "position:absolute;width:10px;height:10px;border-radius:50%;" +
        "background:#c2410c;transform:translate(-50%,-50%);pointer-events:none;" +
        "box-shadow:0 0 0 1px rgba(0,0,0,0.35);";
      const lab = document.createElement("span");
      lab.dataset.strikeLab = String(key);
      lab.textContent = formatStrike(k);
      lab.style.cssText =
        "position:absolute;transform:translate(-50%,8px);color:#c2410c;" +
        "font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap;" +
        "pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,0.7);";
      labels.appendChild(orb);
      labels.appendChild(lab);
      strikeHud.push({ x, k, orb, lab });
    }
  };

  let spotHud: { x: number; orb: HTMLElement; lab: HTMLElement } | null = null;
  const formatSpot = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
  const clearSpotHud = () => {
    spotHud?.orb.remove();
    spotHud?.lab.remove();
    spotHud = null;
  };
  const rebuildSpotHud = (sheet: SurfaceSheet | null) => {
    clearSpotHud();
    if (!sheet || !(sheet.spot > 0)) return;
    const s0 = sheet.sMin;
    const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
    const x = ((sheet.spot - s0) / sSpan) * 2 - 1;
    if (x < -1.05 || x > 1.05) return;
    const orb = document.createElement("span");
    orb.dataset.spotOrb = "1";
    orb.style.cssText =
      "position:absolute;width:10px;height:10px;border-radius:50%;" +
      `background:${SPOT_MARK_CSS};transform:translate(-50%,-50%);pointer-events:none;` +
      "box-shadow:0 0 0 1px rgba(0,0,0,0.35);";
    const lab = document.createElement("span");
    lab.dataset.spotLab = "1";
    lab.textContent = formatSpot(sheet.spot);
    lab.style.cssText =
      "position:absolute;transform:translate(-50%,8px);" +
      `color:${SPOT_MARK_CSS};` +
      "font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap;" +
      "pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,0.7);";
    labels.appendChild(orb);
    labels.appendChild(lab);
    spotHud = { x, orb, lab };
  };

  const TICK_MINOR = 0.045;
  const TICK_MAJOR = 0.085;
  let timeWin: TimeAxisWindow | null = null;
  let timeMarks: TimeAxisMark[] = [];
  const hourLabs: HTMLElement[] = [];

  const clearHourLabs = () => {
    for (const el of hourLabs) el.remove();
    hourLabs.length = 0;
  };

  const rebuildTimeAxis = (sheet: SurfaceSheet | null) => {
    clearHourLabs();
    if (!sheet) {
      timeWin = null;
      timeMarks = [];
      tickGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
      tickLines.visible = false;
      sessionRails.visible = false;
      heavyTicks.visible = false;
      labExpiryAt.textContent = "";
      labExpiryAtOpp.textContent = "";
      return;
    }
    timeWin = sheetTimeWindow(sheet, Date.now());
    timeMarks = listTimeAxisMarks(timeWin);
    const clock = formatExpiryClock(timeWin.tExp);
    labExpiryAt.textContent = clock;
    labExpiryAtOpp.textContent = clock;
    for (const m of timeMarks) {
      if (!m.label) continue;
      for (const side of ["pos", "neg"] as const) {
        const s = document.createElement("span");
        s.dataset.timeTick = m.kind;
        s.dataset.timeSide = side;
        s.textContent = m.label;
        s.style.cssText =
          "position:absolute;transform:translate(-50%,-50%);color:rgba(255,255,255,0.40);" +
          "font-size:10px;letter-spacing:0.10em;text-transform:uppercase;white-space:nowrap;";
        labels.appendChild(s);
        hourLabs.push(s);
      }
    }
  };

  const layoutSessionRail = () => {
    if (!timeWin) {
      sessionRails.visible = false;
      return;
    }
    const span = openToExpirySpan(timeWin, timeMarks);
    if (!span) {
      sessionRails.visible = false;
      return;
    }
    const z0 = timeToBoxZ(span.tNow, timeWin.tNow, timeWin.tExp);
    const z1 = timeToBoxZ(span.tExp, timeWin.tNow, timeWin.tExp);
    sessionGeo.setPositions([
      1, -1, z0, 1, -1, z1, -1, -1, z0, -1, -1, z1,
    ]);
    sessionMat.resolution.set(
      Math.max(host.clientWidth, 1),
      Math.max(host.clientHeight, 1),
    );
    sessionRails.visible = true;
  };

  const layoutTimeTicks = () => {
    if (!timeWin) {
      tickLines.visible = false;
      sessionRails.visible = false;
      heavyTicks.visible = false;
      return;
    }
    if (!timeMarks.length) {
      tickLines.visible = false;
      heavyTicks.visible = false;
      layoutSessionRail();
      return;
    }
    const light: number[] = [];
    const heavy: number[] = [];
    let li = 0;
    for (const m of timeMarks) {
      const z = markBoxZ(m, timeWin);
      const len = m.label ? TICK_MAJOR : TICK_MINOR;
      const dest = isRthEt(m.tMs) ? heavy : light;
      for (const x of [1, -1]) {
        dest.push(x, -1, z, x, -1 + len, z);
      }
      if (m.label) {
        const a = hourLabs[li++];
        const b = hourLabs[li++];
        if (a) placeOne(a, 1.02, -1.02, z);
        if (b) placeOne(b, -1.02, -1.02, z);
      }
    }
    tickGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(light), 3),
    );
    tickGeo.computeBoundingSphere();
    tickLines.visible = light.length > 0;
    if (heavy.length) {
      heavyTickGeo.setPositions(heavy);
      heavyTickMat.resolution.set(
        Math.max(host.clientWidth, 1),
        Math.max(host.clientHeight, 1),
      );
      heavyTicks.visible = true;
    } else {
      heavyTicks.visible = false;
    }
    layoutSessionRail();
  };

  let surface: THREE.Group | null = null;
  let ghostSurface: THREE.Group | null = null;
  let lastGhostSheet: SurfaceSheet | null = null;
  let lastFrontTau: number | null = null;
  let lastElapsed: number | null = null;
  const tnLine = makeTnLine();
  world.add(tnLine);
  const paint = () => {
    renderer.render(scene, camera);
    placeLabels();
    drawChart2d();
  };
  const apply = (sheet: SurfaceSheet | null) => {
    if (surface) {
      world.remove(surface);
      disposeObject(surface);
      surface = null;
    }
    lastSheet = sheet;
    if (sheet) {
      surface = buildSurface(sheet, valueOf(sheet), "solid");
      world.add(surface);
      paintRelief(reliefAmt);
    }
    rebuildStrikeHud(sheet ?? lastGhostSheet);
    rebuildSpotHud(sheet ?? lastGhostSheet);
    rebuildTimeAxis(sheet ?? lastGhostSheet);
    layoutTnCut();
    applyMapOverlay(mapOverlay);
    paint();
  };
  const applyGhost = (sheet: SurfaceSheet | null) => {
    if (ghostSurface) {
      world.remove(ghostSurface);
      disposeObject(ghostSurface);
      ghostSurface = null;
    }
    lastGhostSheet = sheet;
    if (sheet) {
      ghostSurface = buildSurface(sheet, valueOf(sheet), "ghost");
      world.add(ghostSurface);
    }
    host.dataset.ghost = sheet ? "1" : "0";
    if (!lastSheet) {
      rebuildStrikeHud(sheet);
      rebuildSpotHud(sheet);
      rebuildTimeAxis(sheet);
      layoutTnCut();
    }
    applyMapOverlay(mapOverlay);
    paint();
  };
  let lastSheet: SurfaceSheet | null = init.sheet ?? null;
  const boxSheet = () => lastSheet ?? lastGhostSheet;
  let valueWindow: ValueWindow | null = null;
  let mapOverlay = false;
  let reliefAmt = RELIEF_DEFAULT;
  const paintRelief = (amt: number) => {
    reliefAmt = clampRelief(amt);
    host.dataset.relief = String(reliefAmt);
    if (!surface) return;
    surface.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhongMaterial | undefined;
      if (mat?.userData?.uRelief) mat.userData.uRelief.value = reliefAmt;
    });
  };
  const valueOf = (sheet: SurfaceSheet) =>
    valueWindow ?? valueWindowForSheet(sheet);
  const applyMapOverlay = (on: boolean) => {
    mapOverlay = on;
    host.dataset.mapOverlay = on ? "1" : "0";
    eggCap.style.display = on ? "block" : "none";
    if (on) {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
    } else {
      scene.background = new THREE.Color(0x0a0a0e);
      renderer.setClearColor(0x0a0a0e, 1);
      host.dataset.mapFrame = "0";
    }
    if (!surface) return;
    surface.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      if (mat && mat.userData && mat.userData.uLossAlpha) {
        mat.userData.uLossAlpha.value = on ? 0.02 : 1;
        mat.userData.uProfitAlpha.value = on ? 0.2 : 1;
        mat.depthWrite = !on;
        mat.opacity = on ? 1 : 0.78;
      }
      const lineMat = mesh.material as THREE.LineBasicMaterial;
      if (lineMat && lineMat.isLineBasicMaterial) {
        lineMat.opacity = on ? 0.1 : 0.28;
      }
    });
  };
  let candleBoxes: CandleBox[] = [];
  let candlesOn = false;
  let candleGroup: THREE.Group | null = null;
  const clearCandles = () => {
    if (!candleGroup) return;
    world.remove(candleGroup);
    const mats = candleGroup.userData.mats as THREE.Material[] | undefined;
    const geo = candleGroup.userData.geo as THREE.BufferGeometry | undefined;
    mats?.forEach((m) => m.dispose());
    geo?.dispose();
    candleGroup.traverse((child) => {
      const line = child as THREE.Line;
      if (line.geometry && line.type === "Line") line.geometry.dispose();
      const lm = line.material as THREE.Material | undefined;
      if (lm && line.type === "Line") lm.dispose();
    });
    candleGroup = null;
  };
  /**
   * 3D candle meshes were hanging off the Now wall in ISO (history
   * maps to z > 1). Candles belong only on the T Ortho 2D underlay.
   */
  const layoutCandles = () => {
    clearCandles();
    host.dataset.candles =
      mapOverlay && candlesOn ? String(candleBoxes.length) : "0";
  };
  const priceToLocalX = (sheet: SurfaceSheet) => {
    if (!(sheet.spot > 0)) return null;
    const span = Math.max(sheet.sMax - sheet.sMin, 1e-9);
    const x = ((sheet.spot - sheet.sMin) / span) * 2 - 1;
    if (x < -1.2 || x > 1.2) return null;
    return x;
  };

  const worldX = (s: number) => {
    const sheet = boxSheet();
    if (!sheet) return 0;
    const span = Math.max(sheet.sMax - sheet.sMin, 1e-9);
    return ((s - sheet.sMin) / span) * 2 - 1;
  };
  const worldZ = (tau: number) => {
    const sheet = boxSheet();
    if (!sheet) return 0;
    return tauToBoxZ(sheet, tau);
  };
  const playheadTau = () => {
    if (lastFrontTau != null && Number.isFinite(lastFrontTau)) return lastFrontTau;
    return boxSheet()?.timeAxis[0] ?? 0;
  };
  const playheadZ = () => {
    if (lastElapsed != null && Number.isFinite(lastElapsed)) {
      return elapsedToBoxZ(lastElapsed);
    }
    const sheet = boxSheet();
    if (!sheet) return 1;
    return tauToBoxZ(sheet, playheadTau());
  };
  const layoutTnCut = () => {
    if (!lastSheet || lastSheet.spotAxis.length < 2) {
      tnLine.visible = false;
      return;
    }
    const pts = timeCutPoints(lastSheet, playheadTau(), valueOf(lastSheet));
    const z = playheadZ();
    for (let i = 2; i < pts.length; i += 3) pts[i] = z;
    setTnPoints(tnLine, pts);
  };
  const worldY = (pnl: number) => {
    const sheet = boxSheet();
    if (!sheet) return 0;
    return surfaceBoxY(pnl, valueOf(sheet).yMin, valueOf(sheet).yMax);
  };

  const mkPlane = (color: number, opacity: number) => {
    const g = new THREE.PlaneGeometry(2, 2);
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return new THREE.Mesh(g, m);
  };
  const strikePlane = mkPlane(0x34d399, 0.14);
  const timePlane = mkPlane(0xfde68a, 0.18);
  timePlane.renderOrder = 1;
  tnLine.renderOrder = 2;
  const valuePlane = mkPlane(0x000000, SURFACE_VALUE_PLANE_OPACITY_DEFAULT);
  const valueMat0 = valuePlane.material as THREE.MeshBasicMaterial;
  valueMat0.transparent = true;
  valueMat0.depthWrite = false;
  valueMat0.depthTest = true;
  valueMat0.toneMapped = false;
  valueMat0.polygonOffset = true;
  valueMat0.polygonOffsetFactor = -2;
  valueMat0.polygonOffsetUnits = -2;
  valuePlane.renderOrder = 4;
  const valueEdge = fatPolyline(
    [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0],
    0x737373,
    1.5,
    1,
    true,
  );
  valueEdge.material.depthWrite = false;
  valueEdge.renderOrder = 5;
  valuePlane.add(valueEdge);
  strikePlane.rotation.y = Math.PI / 2;
  valuePlane.rotation.x = Math.PI / 2;
  world.add(strikePlane);
  world.add(timePlane);
  world.add(valuePlane);

  const projectLocal = (x: number, y: number, z: number) => {
    const v = new THREE.Vector3(x, y, z);
    world.localToWorld(v);
    v.project(camera);
    return {
      left: (v.x * 0.5 + 0.5) * (host.clientWidth || 1),
      top: (-v.y * 0.5 + 0.5) * (host.clientHeight || 1),
      front: v.z < 1,
    };
  };
  const drawChart2d = () => {
    chart2d.style.display = "none";
  };
  const placeOne = (el: HTMLElement, x: number, y: number, z: number) => {
    const p = projectLocal(x, y, z);
    el.style.left = `${p.left}px`;
    el.style.top = `${p.top}px`;
    el.style.opacity = p.front ? "1" : "0";
  };
  const placeLabels = () => {
    placeOne(labStrike, 0, -1.08, -1);
    const zeroY = lastSheet
      ? surfaceBoxY(0, valueOf(lastSheet).yMin, valueOf(lastSheet).yMax)
      : 0;
    placeOne(labPnl, -1.08, zeroY, -1);
    placeOne(labNow, 1.02, -1.02, 1);
    placeOne(labNowOpp, -1.02, -1.02, 1);
    placeOne(labExpiry, 1.02, -1.02, -1);
    placeOne(labExpiryOpp, -1.02, -1.02, -1);
    const zTn = playheadZ();
    placeOne(labTn, 1.08, 0, zTn);
    for (const h of strikeHud) {
      const p = projectLocal(h.x, -1, 1);
      h.orb.style.left = `${p.left}px`;
      h.orb.style.top = `${p.top}px`;
      h.orb.style.opacity = p.front ? "1" : "0";
      h.lab.style.left = `${p.left}px`;
      h.lab.style.top = `${p.top}px`;
      h.lab.style.opacity = p.front ? "1" : "0";
    }
    if (spotHud) {
      const p = projectLocal(spotHud.x, -1, 1);
      spotHud.orb.style.left = `${p.left}px`;
      spotHud.orb.style.top = `${p.top}px`;
      spotHud.orb.style.opacity = p.front ? "1" : "0";
      spotHud.lab.style.left = `${p.left}px`;
      spotHud.lab.style.top = `${p.top}px`;
      spotHud.lab.style.opacity = p.front ? "1" : "0";
    }
    layoutTimeTicks();
  };

  if (init.sheet) apply(init.sheet);

  const planes: Record<"strike" | "time" | "value", PlaneInspect> = {
    strike: {
      visible: true,
      opacity: 0.22,
      position: lastSheet?.spot ?? 0,
    },
    time: {
      visible: false,
      opacity: 0.28,
      position: 0,
    },
    value: { visible: true, opacity: 0.16, position: 0 },
  };

  const layoutPlanes = () => {
    strikePlane.visible = planes.strike.visible;
    timePlane.visible = planes.time.visible;
    valuePlane.visible = planes.value.opacity > 0;
    (strikePlane.material as THREE.MeshBasicMaterial).opacity = planes.strike.opacity;
    (timePlane.material as THREE.MeshBasicMaterial).opacity = planes.time.opacity;
    const valueMat = valuePlane.material as THREE.MeshBasicMaterial;
    const valueAlpha = Math.min(1, Math.max(0, planes.value.opacity));
    valueMat.opacity = valueAlpha;
    valueMat.transparent = true;
    valueMat.depthWrite = false;
    valueEdge.material.opacity = valueAlpha;
    valueEdge.visible = valueAlpha > 0;
    const clamp = (n: number) => Math.min(1, Math.max(-1, n));
    strikePlane.position.set(clamp(worldX(planes.strike.position)), 0, 0);
    timePlane.position.set(0, 0, clamp(elapsedToBoxZ(planes.time.position)));
    valuePlane.position.set(0, clamp(worldY(planes.value.position)), 0);
    paint();
  };
  layoutPlanes();

  let box = boxHalfExtents(1, 1);
  let lastFitR = 0;
  const BOX_CORNERS = [
    -1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1,
    -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
  ];
  /**
   * Screen-space center of the enclosing box vs the window mid-line.
   * Look-down ISO puts the silhouette below lookAt; app header + OL nav
   * put the canvas mid-line below the window. Positive Three.js offsetY
   * lifts the projection on screen.
   */
  const windowCenterLiftPx = (cam: THREE.Camera, w: number, h: number) => {
    const v = new THREE.Vector3();
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 8; i++) {
      v.set(BOX_CORNERS[i * 3], BOX_CORNERS[i * 3 + 1], BOX_CORNERS[i * 3 + 2]);
      world.localToWorld(v);
      v.project(cam);
      if (!Number.isFinite(v.y) || Math.abs(v.y) > 4) continue;
      const y = (-v.y * 0.5 + 0.5) * h;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return 0;
    const boxMid = (minY + maxY) / 2;
    const rect = host.getBoundingClientRect();
    if (!(rect.height > 0)) return 0;
    const view = window.visualViewport;
    const windowMid = view
      ? view.offsetTop + view.height / 2
      : window.innerHeight / 2;
    const lift = Math.round(boxMid - (windowMid - rect.top));
    const cap = Math.round(h * 0.45);
    return Math.max(-cap, Math.min(cap, lift));
  };
  const applyLift = (cam: THREE.PerspectiveCamera | THREE.OrthographicCamera, w: number, h: number) => {
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
    if (!windowLift) {
      host.dataset.liftPx = "0";
      return;
    }
    cam.updateMatrixWorld();
    world.updateMatrixWorld(true);
    const liftPx = windowCenterLiftPx(cam, w, h);
    if (liftPx) cam.setViewOffset(w, h, 0, liftPx, w, h);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    host.dataset.liftPx = String(liftPx);
  };
  const applyActivePose = () => {
    const w = Math.max(host.clientWidth, 1);
    const h = Math.max(host.clientHeight, 1);
    const aspect = w / Math.max(h, 1);
    const far = Math.max(80, lastFitR * 6 || 80);
    if (pose.projection === "orthographic") {
      const zoom = lastFitR > 0 ? eyeRadius(pose) / lastFitR : 1;
      const { halfW, halfH } = orthoHalfExtents(box, aspect, zoom);
      ortho.left = -halfW;
      ortho.right = halfW;
      ortho.top = halfH;
      ortho.bottom = -halfH;
      ortho.near = 0.05;
      ortho.far = far;
      look(ortho, pose);
      applyLift(ortho, w, h);
      camera = ortho;
    } else {
      persp.fov = PERSPECTIVE_FOV;
      persp.aspect = aspect;
      persp.near = 0.05;
      persp.far = far;
      look(persp, pose);
      applyLift(persp, w, h);
      camera = persp;
    }
    host.dataset.projection = pose.projection;
  };
  const applyBox = (w: number, h: number, keepZoom: boolean) => {
    box = boxHalfExtents(w, h);
    world.scale.set(box.hx, box.hy, box.hz);
    const aspect = w / h;
    const rFit = frameRadius(box, aspect);
    const factor = keepZoom && lastFitR > 0 ? eyeRadius(pose) / lastFitR : 1;
    lastFitR = rFit;
    pose = poseWithRadius(pose, rFit * factor);
    applyActivePose();
    host.dataset.boxHx = String(box.hx);
    host.dataset.boxHy = String(box.hy);
    host.dataset.boxHz = String(box.hz);
  };

  const resize = () => {
    const w = Math.max(host.clientWidth, 1);
    const h = Math.max(host.clientHeight, 1);
    renderer.setPixelRatio(resolveDpr());
    renderer.setSize(w, h, true);
    sessionMat.resolution.set(w, h);
    heavyTickMat.resolution.set(w, h);
    applyBox(w, h, true);
    paint();
    host.dataset.eyeX = String(pose.eye.x);
    host.dataset.eyeY = String(pose.eye.y);
    host.dataset.eyeZ = String(pose.eye.z);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const setPose = (next: CameraPose) => {
    pose = next;
    applyActivePose();
    paint();
    host.dataset.eyeX = String(pose.eye.x);
    host.dataset.eyeY = String(pose.eye.y);
    host.dataset.eyeZ = String(pose.eye.z);
    host.dataset.zoomGain = String(pose.zoomGain);
  };
  setPose(pose);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch0 = 0;

  const onDown = (e: PointerEvent) => {
    if (surfaceLocked) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    } else if (pointers.size === 2) {
      dragging = false;
      const pts = [...pointers.values()];
      pinch0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    if (surfaceLocked) return;
    if (pointers.has(e.pointerId)) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch0 > 0) {
        const delta = pinch0 - d;
        if (Math.abs(delta) > 0.5) setPose(zoomPose(pose, delta));
        pinch0 = d;
      }
      return;
    }
    if (!dragging) return;
    setPose(orbitPose(pose, e.clientX - lastX, e.clientY - lastY));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = 0;
    if (pointers.size === 0) {
      dragging = false;
      canvas.style.cursor = "grab";
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (surfaceLocked) return;
    e.preventDefault();
    setPose(zoomPose(pose, e.deltaY));
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  host.addEventListener("wheel", onWheel, { passive: false });

  return {
    setSheet(sheet: SurfaceSheet | null) {
      apply(sheet);
      const boxSheet = sheet ?? lastGhostSheet;
      if (boxSheet) {
        if (
          !Number.isFinite(planes.strike.position) ||
          planes.strike.position < boxSheet.sMin ||
          planes.strike.position > boxSheet.sMax
        ) {
          planes.strike.position = boxSheet.spot;
        }
      }
      layoutPlanes();
    },
    setGhostSheet(sheet: SurfaceSheet | null) {
      applyGhost(sheet);
      layoutPlanes();
    },
    setInspect(patch) {
      if (patch.camera) setPose(patch.camera);
      if (patch.timePlayhead != null) {
        lastFrontTau = patch.timePlayhead;
      }
      if (patch.timeElapsed != null && Number.isFinite(patch.timeElapsed)) {
        lastElapsed = Math.min(1, Math.max(0, patch.timeElapsed));
      }
      if (patch.timePlayhead != null || patch.timeElapsed != null) {
        layoutTnCut();
      }
      if (patch.altered != null) layoutBoxAltered(patch.altered);
      if (patch.spots) layoutSpots(patch.spots);
      if (patch.zoomGain != null && Number.isFinite(patch.zoomGain) && patch.zoomGain > 0) {
        if (patch.zoomGain !== pose.zoomGain) {
          pose = { ...pose, zoomGain: patch.zoomGain };
          host.dataset.zoomGain = String(pose.zoomGain);
        }
      }
      if (patch.valueWindow) {
        const next = patch.valueWindow;
        const same =
          valueWindow &&
          valueWindow.yMin === next.yMin &&
          valueWindow.yMax === next.yMax &&
          valueWindow.padFrac === next.padFrac;
        if (!same) {
          valueWindow = next;
          host.dataset.heightPad = String(next.padFrac);
          apply(lastSheet);
          applyGhost(lastGhostSheet);
          layoutCandles();
        }
      }
      if (patch.candlesOn != null && patch.candlesOn !== candlesOn) {
        candlesOn = patch.candlesOn;
        layoutCandles();
        paint();
      }
      if (patch.planes) {
        for (const id of ["strike", "time", "value"] as const) {
          const next = patch.planes[id];
          if (next) planes[id] = { ...planes[id], ...next };
        }
      }
      if (patch.relief != null && Number.isFinite(patch.relief)) {
        paintRelief(patch.relief);
      }
      layoutPlanes();
    },
    fit() {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      setPose(factoryPose("fit", box, w / h, pose.zoomGain));
      lastFitR = frameRadius(box, w / h);
    },
    setProjection(next) {
      if (next !== "perspective" && next !== "orthographic") {
        throw new Error(`setProjection: unknown ${String(next)}`);
      }
      pose = { ...pose, projection: next };
      applyActivePose();
      paint();
      host.dataset.projection = pose.projection;
    },
    applyFactoryView(id: FactoryViewId) {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      const planeZ = lastSheet ? tauToBoxZ(lastSheet, playheadTau()) : 1;
      if (id === "fit" || id === "iso" || id === "timeOrtho") {
        lastFitR = frameRadius(box, w / h);
      }
      const egg = id === "timeOrtho";
      // T Ortho tape-align mutates world x/z. ISO/Fit/other views must not inherit it.
      if (!egg) {
        world.position.x = 0;
        world.position.z = 0;
        world.scale.x = box.hx;
        world.scale.z = 1;
      }
      const next = factoryPose(id, box, w / h, pose.zoomGain, planeZ);
      setPose(next);
      host.dataset.factoryView = id;
      applyMapOverlay(egg);
      applySurfaceLock(egg);
      if (egg) {
        // Live LWC 5m chart is the tape; keep the 3D candle mesh off.
        candlesOn = false;
        clearCandles();
      }
      paint();
    },
    setSurfaceLocked(locked) {
      applySurfaceLock(!!locked);
    },
    orbitBy(dx, dy) {
      setPose(orbitPose(pose, dx, dy));
    },
    zoomBy(deltaY) {
      setPose(zoomPose(pose, deltaY));
    },
    getPose() {
      return pose;
    },
    getTimeAxisScreen() {
      const now = projectLocal(0, 0, 1);
      const exp = projectLocal(0, 0, -1);
      return { nowX: now.left, expiryX: exp.left };
    },
    setBeGhosts(_strikes) {
      const old = world.getObjectByName("be-ghosts");
      if (old) {
        world.remove(old);
        disposeObject(old);
        paint();
      }
    },
    alignTimeOrtho(span) {
      const pinStrike =
        span != null &&
        Number.isFinite(span.sMinY) &&
        Number.isFinite(span.sMaxY) &&
        Math.abs((span.sMaxY as number) - (span.sMinY as number)) > 8;
      if (!span || !(span.expiryX > span.nowX + 8)) {
        world.position.x = 0;
        world.position.z = 0;
        world.scale.x = box.hx;
        world.scale.z = 1;
        paint();
        return;
      }
      world.position.x = 0;
      world.position.z = 0;
      world.scale.x = 1;
      world.scale.z = 1;
      world.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const sNow = projectLocal(0, 0, 1).left;
      const sExp = projectLocal(0, 0, -1).left;
      const Bz = (sNow - sExp) / 2;
      const Az = (sNow + sExp) / 2;
      if (Math.abs(Bz) < 1e-6) return;
      world.position.z =
        (span.nowX + span.expiryX - 2 * Az) / (2 * Bz);
      world.scale.z = (span.nowX - span.expiryX) / (2 * Bz);
      if (pinStrike) {
        const sHi = projectLocal(1, -1, 0).top;
        const sLo = projectLocal(-1, -1, 0).top;
        const Bx = (sHi - sLo) / 2;
        const Ax = (sHi + sLo) / 2;
        if (Math.abs(Bx) > 1e-6) {
          world.position.x =
            ((span.sMaxY as number) + (span.sMinY as number) - 2 * Ax) /
            (2 * Bx);
          world.scale.x =
            ((span.sMaxY as number) - (span.sMinY as number)) / (2 * Bx);
        }
      } else {
        world.scale.x = box.hx;
      }
      paint();
    },
    setCandles(boxes) {
      candleBoxes = Array.isArray(boxes) ? boxes : [];
      layoutCandles();
      paint();
    },
    captureCanvas() {
      paint();
      return canvas;
    },
    dispose() {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      host.removeEventListener("wheel", onWheel);
      clearCandles();
      if (surface) disposeObject(surface);
      if (ghostSurface) disposeObject(ghostSurface);
      clearHourLabs();
      tickGeo.dispose();
      tickMat.dispose();
      sessionGeo.dispose();
      sessionMat.dispose();
      heavyTickGeo.dispose();
      heavyTickMat.dispose();
      disposeObject(tnLine);
      disposeObject(boxFrame);
      disposeObject(boxGlowA);
      disposeObject(boxGlowB);
      for (const p of [strikePlane, timePlane, valuePlane]) {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      }
      renderer.dispose();
      clearStrikeHud();
      clearSpotHud();
      labels.remove();
      host.replaceChildren();
    },
  };
}

export {
  ISO_EYE,
  SLOW_ZOOM_GAIN,
  applyCameraInspect,
  applyFactoryView,
  fitPose,
  isoPose,
  orbitPose,
  zoomPose,
} from "./camera";
export type { CameraPose, FactoryViewId } from "./camera";
export { FACTORY_VIEW_IDS } from "./camera";
export { boxHalfExtents, frameRadius } from "./box";
export type { BoxExtents } from "./box";
