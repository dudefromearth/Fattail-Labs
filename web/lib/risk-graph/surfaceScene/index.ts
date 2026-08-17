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
import { boxHalfExtents, frameRadius, type BoxExtents } from "./box";
import { tauToBoxZ, timeCutPoints } from "./timeCut";
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

export type SurfaceSceneHandle = {
  setSheet(sheet: SurfaceSheet | null): void;
  setInspect(patch: {
    camera?: CameraPose;
    timePlayhead?: number;
    altered?: boolean;
    planes?: Partial<Record<"strike" | "time" | "value", PlaneInspect>>;
  }): void;
  dispose(): void;
  fit(): void;
  applyFactoryView(id: import("./camera").FactoryViewId): void;
  orbitBy(dxPx: number, dyPx: number): void;
  zoomBy(deltaY: number): void;
  getPose(): CameraPose;
};

const DPR_CAP = 2;
/** Analyzer Risk T+0 — PnLChart theoreticalStroke, rest width 2. */
const T0_STROKE = 0xe879f9;
const T0_WIDTH_PX = 2;
const EXPIRY_STROKE = 0x67e8f9;
const EXPIRY_WIDTH_PX = 2;

function resolveDpr(): number {
  const raw =
    typeof window !== "undefined" ? window.devicePixelRatio : 1;
  if (!Number.isFinite(raw) || raw <= 0) {
    throw new Error("surfaceScene: devicePixelRatio unbounded or invalid");
  }
  return Math.min(raw, DPR_CAP);
}

function look(cam: THREE.Camera, pose: CameraPose) {
  cam.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
  cam.lookAt(pose.lookAt.x, pose.lookAt.y, pose.lookAt.z);
}

function buildSurface(sheet: SurfaceSheet): THREE.Group {
  const nx = sheet.spotAxis.length;
  const nVis = sheet.timeAxis.length;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(nVis * nx * 3);
  const colors = new Float32Array(nVis * nx * 3);
  const s0 = sheet.sMin;
  const sSpan = Math.max(sheet.sMax - sheet.sMin, 1e-9);
  const pAbs = Math.max(sheet.displayAbs || 0, 1);
  const clampY = (n: number) => Math.min(1, Math.max(-1, n));
  const profit = new THREE.Color(0x22c55e);
  const loss = new THREE.Color(0xb91c1c);
  const tmp = new THREE.Color();
  const zOf = (k: number) =>
    nVis <= 1 ? 1 : 1 - (k / (nVis - 1)) * 2;
  for (let k = 0; k < nVis; k++) {
    for (let i = 0; i < nx; i++) {
      const dest = k * nx + i;
      const pnl = sheet.pnlGrid[k][i];
      positions[dest * 3] = ((sheet.spotAxis[i] - s0) / sSpan) * 2 - 1;
      positions[dest * 3 + 1] = clampY(pnl / pAbs);
      positions[dest * 3 + 2] = zOf(k);
      if (pnl >= 0) tmp.copy(profit).multiplyScalar(0.35 + 0.65 * Math.min(1, pnl / pAbs));
      else tmp.copy(loss).multiplyScalar(0.35 + 0.65 * Math.min(1, -pnl / pAbs));
      colors[dest * 3] = tmp.r;
      colors[dest * 3 + 1] = tmp.g;
      colors[dest * 3 + 2] = tmp.b;
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
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      shininess: 12,
    }),
  );
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({
      color: 0x6b7c8a,
      transparent: true,
      opacity: 0.28,
    }),
  );
  const group = new THREE.Group();
  group.add(mesh);
  group.add(wire);
  for (let k = 1; k < nVis - 1; k++) {
    const line = edgeLine(positions, nx, k, 0x64748b);
    (line.material as THREE.LineBasicMaterial).opacity = 0.32;
    group.add(line);
  }
  if (nVis > 0) {
    group.add(fatLine(positions, nx, nVis - 1, EXPIRY_STROKE, EXPIRY_WIDTH_PX));
  }
  const marks = sheet.listedStrikes || [];
  for (const k of marks) {
    if (!Number.isFinite(k)) continue;
    const x = ((k - s0) / sSpan) * 2 - 1;
    if (x < -1.05 || x > 1.05) continue;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    );
    dot.position.set(x, -1, 1);
    group.add(dot);
  }
  const spotX = ((sheet.spot - s0) / sSpan) * 2 - 1;
  if (spotX >= -1.05 && spotX <= 1.05) {
    const spotDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    );
    spotDot.position.set(spotX, -1, 1);
    group.add(spotDot);
    const spotLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(spotX, -1, 1),
        new THREE.Vector3(spotX, 1, 1),
      ]),
      new THREE.LineBasicMaterial({
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.35,
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
  init: { sheet?: SurfaceSheet | null } = {},
): SurfaceSceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0e);
  const persp = new THREE.PerspectiveCamera(PERSPECTIVE_FOV, 1, 0.05, 80);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 80);
  let camera: THREE.Camera = persp;
  let pose = isoPose();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(resolveDpr());
  const canvas = renderer.domElement;
  canvas.dataset.testid = "surface-webgl";
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";
  host.style.overflow = "hidden";
  host.style.position = host.style.position || "relative";
  host.replaceChildren(canvas);
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
  const boxFrame = makeBoxFrame(2, BOX_REALITY, 0.45);
  boxFrame.name = "surface-box-wire";
  world.add(boxFrame);
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
    boxGlowA.visible = next;
    boxGlowB.visible = next;
    host.dataset.altered = next ? "1" : "0";
  };

  const labels = document.createElement("div");
  labels.dataset.testid = "surface-box-labels";
  labels.style.cssText =
    "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
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
  const labTime = mkLab("time", "Time");
  const labNow = mkLab("now", "Now");
  const labExpiry = mkLab("expiry", "Expiry");
  const labTn = mkLab("tn", "tn");
  host.appendChild(labels);

  let surface: THREE.Group | null = null;
  let lastFrontTau: number | null = null;
  const tnLine = makeTnLine();
  world.add(tnLine);
  const paint = () => {
    renderer.render(scene, camera);
    placeLabels();
  };
  const apply = (sheet: SurfaceSheet | null) => {
    if (surface) {
      world.remove(surface);
      disposeObject(surface);
      surface = null;
    }
    lastSheet = sheet;
    if (sheet) {
      surface = buildSurface(sheet);
      world.add(surface);
    }
    layoutTnCut();
    paint();
  };
  let lastSheet: SurfaceSheet | null = init.sheet ?? null;

  const worldX = (s: number) => {
    if (!lastSheet) return 0;
    const span = Math.max(lastSheet.sMax - lastSheet.sMin, 1e-9);
    return ((s - lastSheet.sMin) / span) * 2 - 1;
  };
  const worldZ = (tau: number) => {
    if (!lastSheet) return 0;
    return tauToBoxZ(lastSheet, tau);
  };
  const playheadTau = () => {
    if (lastFrontTau != null && Number.isFinite(lastFrontTau)) return lastFrontTau;
    return lastSheet?.timeAxis[0] ?? 0;
  };
  const layoutTnCut = () => {
    if (!lastSheet || lastSheet.spotAxis.length < 2) {
      tnLine.visible = false;
      return;
    }
    setTnPoints(tnLine, timeCutPoints(lastSheet, playheadTau()));
  };
  const worldY = (pnl: number) => {
    if (!lastSheet) return 0;
    const pAbs = Math.max(lastSheet.displayAbs || 0, 1);
    return Math.min(1, Math.max(-1, pnl / pAbs));
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
  const valuePlane = mkPlane(0xd4d4d8, 0.1);
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
  const placeOne = (el: HTMLElement, x: number, y: number, z: number) => {
    const p = projectLocal(x, y, z);
    el.style.left = `${p.left}px`;
    el.style.top = `${p.top}px`;
    el.style.opacity = p.front ? "1" : "0";
  };
  const placeLabels = () => {
    placeOne(labStrike, 0, -1.08, -1);
    placeOne(labPnl, -1.08, 0, -1);
    placeOne(labTime, 1.08, -1.08, 0);
    placeOne(labNow, 1.08, -1.08, 1);
    placeOne(labExpiry, 1.08, -1.08, -1);
    const zTn = lastSheet ? tauToBoxZ(lastSheet, playheadTau()) : 1;
    placeOne(labTn, 1.08, 0, zTn);
  };

  if (init.sheet) apply(init.sheet);

  const planes: Record<"strike" | "time" | "value", PlaneInspect> = {
    strike: {
      visible: true,
      opacity: 0.22,
      position: lastSheet?.spot ?? 0,
    },
    time: {
      visible: true,
      opacity: 0.28,
      position: lastSheet?.timeAxis[0] ?? 0,
    },
    value: { visible: true, opacity: 0.16, position: 0 },
  };

  const layoutPlanes = () => {
    strikePlane.visible = planes.strike.visible;
    timePlane.visible = planes.time.visible;
    valuePlane.visible = planes.value.opacity > 0;
    (strikePlane.material as THREE.MeshBasicMaterial).opacity = planes.strike.opacity;
    (timePlane.material as THREE.MeshBasicMaterial).opacity = planes.time.opacity;
    (valuePlane.material as THREE.MeshBasicMaterial).opacity = planes.value.opacity;
    const clamp = (n: number) => Math.min(1, Math.max(-1, n));
    strikePlane.position.set(clamp(worldX(planes.strike.position)), 0, 0);
    timePlane.position.set(0, 0, clamp(worldZ(planes.time.position)));
    valuePlane.position.set(0, clamp(worldY(planes.value.position)), 0);
    paint();
  };
  layoutPlanes();

  let box = boxHalfExtents(1, 1);
  let lastFitR = 0;
  const applyActivePose = () => {
    const w = Math.max(host.clientWidth, 1);
    const h = Math.max(host.clientHeight, 1);
    const aspect = w / Math.max(h, 1);
    const far = Math.max(80, lastFitR * 6 || 80);
    if (pose.projection === "orthographic") {
      const pad = 1.12;
      let halfW = Math.max(box.hx, 0.1) * pad;
      let halfH = Math.max(box.hy, 0.1) * pad;
      const boxAspect = halfW / halfH;
      if (aspect > boxAspect) halfW = halfH * aspect;
      else halfH = halfW / aspect;
      ortho.left = -halfW;
      ortho.right = halfW;
      ortho.top = halfH;
      ortho.bottom = -halfH;
      ortho.near = 0.05;
      ortho.far = far;
      look(ortho, pose);
      ortho.updateProjectionMatrix();
      camera = ortho;
    } else {
      persp.fov = PERSPECTIVE_FOV;
      persp.aspect = aspect;
      persp.near = 0.05;
      persp.far = far;
      look(persp, pose);
      persp.updateProjectionMatrix();
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
      if (sheet) {
        if (
          !Number.isFinite(planes.strike.position) ||
          planes.strike.position < sheet.sMin ||
          planes.strike.position > sheet.sMax
        ) {
          planes.strike.position = sheet.spot;
        }
      }
      layoutPlanes();
    },
    setInspect(patch) {
      if (patch.camera) setPose(patch.camera);
      if (patch.timePlayhead != null) {
        lastFrontTau = patch.timePlayhead;
        planes.time.position = patch.timePlayhead;
        layoutTnCut();
      }
      if (patch.altered != null) layoutBoxAltered(patch.altered);
      if (patch.planes) {
        for (const id of ["strike", "time", "value"] as const) {
          const next = patch.planes[id];
          if (next) planes[id] = { ...planes[id], ...next };
        }
      }
      layoutPlanes();
    },
    fit() {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      setPose(factoryPose("fit", box, w / h, pose.zoomGain));
      lastFitR = frameRadius(box, w / h);
    },
    applyFactoryView(id: FactoryViewId) {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      const planeZ = lastSheet ? tauToBoxZ(lastSheet, playheadTau()) : 1;
      setPose(factoryPose(id, box, w / h, pose.zoomGain, planeZ));
      if (id === "fit" || id === "iso") lastFitR = frameRadius(box, w / h);
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
    dispose() {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      host.removeEventListener("wheel", onWheel);
      if (surface) disposeObject(surface);
      disposeObject(tnLine);
      disposeObject(boxFrame);
      disposeObject(boxGlowA);
      disposeObject(boxGlowB);
      for (const p of [strikePlane, timePlane, valuePlane]) {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      }
      renderer.dispose();
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
