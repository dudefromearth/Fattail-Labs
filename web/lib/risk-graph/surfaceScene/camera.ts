/**
 * Camera math for the Surface scene. Pure. No WebGL.
 * W3-2: perspective · ISO · Fit · Slow zoom · orbit.
 * setInspect camera-only must not recompute the sheet (T-CAM-1).
 */

export const ISO_EYE = { x: 1.65, y: 1.25, z: 1.65 } as const;
export const ISO_LOOK = { x: 0, y: 0, z: 0 } as const;
/** DL-407 Slow, then halved again for Surface orbit (¼ prior Work Pane). */
export const SLOW_ZOOM_GAIN = 0.25;
export const ZOOM_GAIN_MIN = 0.1;
export const ZOOM_GAIN_MAX = 1;
export const PERSPECTIVE_FOV = 42;
export const ORBIT_RAD_PER_PX = 0.005;
export const ZOOM_STEP = 0.08;
export const MIN_R = 0.45;
export const MAX_R = 32;

export type Vec3 = { x: number; y: number; z: number };

export type CameraProjection = "perspective" | "orthographic";

export type CameraPose = {
  projection: CameraProjection;
  eye: Vec3;
  lookAt: Vec3;
  zoomGain: number;
  /** Camera up. Default (0,1,0). Time Ortho uses +X so strike reads up. */
  up?: Vec3;
  /** Mirror the view horizontally (Now on the left in Time Ortho). */
  flipX?: boolean;
};

export function isoPose(): CameraPose {
  return {
    projection: "perspective",
    eye: { x: ISO_EYE.x, y: ISO_EYE.y, z: ISO_EYE.z },
    lookAt: { x: ISO_LOOK.x, y: ISO_LOOK.y, z: ISO_LOOK.z },
    zoomGain: SLOW_ZOOM_GAIN,
  };
}

export function eyeRadius(pose: CameraPose): number {
  const dx = pose.eye.x - pose.lookAt.x;
  const dy = pose.eye.y - pose.lookAt.y;
  const dz = pose.eye.z - pose.lookAt.z;
  return Math.hypot(dx, dy, dz);
}

function spherical(pose: CameraPose): { r: number; theta: number; phi: number } {
  const x = pose.eye.x - pose.lookAt.x;
  const y = pose.eye.y - pose.lookAt.y;
  const z = pose.eye.z - pose.lookAt.z;
  const r = Math.hypot(x, y, z) || MIN_R;
  const theta = Math.atan2(x, z);
  const phi = Math.acos(Math.min(1, Math.max(-1, y / r)));
  return { r, theta, phi };
}

function fromSpherical(
  lookAt: Vec3,
  r: number,
  theta: number,
  phi: number,
  zoomGain: number,
  projection: CameraProjection = "perspective",
  extras: Pick<CameraPose, "up" | "flipX"> = {},
): CameraPose {
  const rr = Math.min(MAX_R, Math.max(MIN_R, r));
  const p = Math.min(Math.PI - 0.08, Math.max(0.08, phi));
  return {
    projection,
    lookAt: { ...lookAt },
    zoomGain,
    up: extras.up ? { ...extras.up } : undefined,
    flipX: extras.flipX,
    eye: {
      x: lookAt.x + rr * Math.sin(p) * Math.sin(theta),
      y: lookAt.y + rr * Math.cos(p),
      z: lookAt.z + rr * Math.sin(p) * Math.cos(theta),
    },
  };
}

export function orbitPose(
  pose: CameraPose,
  dxPx: number,
  dyPx: number,
): CameraPose {
  const s = spherical(pose);
  return fromSpherical(
    pose.lookAt,
    s.r,
    s.theta - dxPx * ORBIT_RAD_PER_PX,
    s.phi - dyPx * ORBIT_RAD_PER_PX,
    pose.zoomGain,
    pose.projection,
    { up: pose.up, flipX: pose.flipX },
  );
}

export function zoomPose(pose: CameraPose, deltaY: number): CameraPose {
  const s = spherical(pose);
  const dir = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
  const nextR = s.r * (1 + dir * pose.zoomGain * ZOOM_STEP);
  return fromSpherical(
    pose.lookAt,
    nextR,
    s.theta,
    s.phi,
    pose.zoomGain,
    pose.projection,
    { up: pose.up, flipX: pose.flipX },
  );
}

export function fitPose(pose: CameraPose): CameraPose {
  return { ...isoPose(), zoomGain: pose.zoomGain };
}

/** Keep orbit angles; set radius. Used to frame the enclosing box. */
export function poseWithRadius(pose: CameraPose, r: number): CameraPose {
  const s = spherical(pose);
  return fromSpherical(
    pose.lookAt,
    r,
    s.theta,
    s.phi,
    pose.zoomGain,
    pose.projection,
    { up: pose.up, flipX: pose.flipX },
  );
}

export type FactoryViewId =
  | "iso"
  | "now"
  | "expiry"
  | "spot"
  | "time"
  | "timeOrtho"
  | "top"
  | "fit";

export const FACTORY_VIEW_IDS: FactoryViewId[] = [
  "iso",
  "now",
  "expiry",
  "spot",
  "time",
  "timeOrtho",
  "top",
  "fit",
];

export function applyFactoryView(id: FactoryViewId): CameraPose {
  const g = SLOW_ZOOM_GAIN;
  const look = { x: 0, y: 0, z: 0 };
  if (id === "iso" || id === "fit") return isoPose();
  if (id === "now" || id === "time") {
    return { projection: "orthographic", eye: { x: 0, y: 0, z: 2.45 }, lookAt: look, zoomGain: g };
  }
  if (id === "timeOrtho") {
    return {
      projection: "orthographic",
      eye: { x: 0, y: -2.8, z: 0 },
      lookAt: look,
      zoomGain: g,
      up: { x: 1, y: 0, z: 0 },
    };
  }
  if (id === "expiry") {
    return { projection: "perspective", eye: { x: 0, y: 0.85, z: -2.45 }, lookAt: look, zoomGain: g };
  }
  if (id === "spot") {
    return { projection: "perspective", eye: { x: 2.45, y: 0.85, z: 0 }, lookAt: look, zoomGain: g };
  }
  if (id === "top") {
    return { projection: "perspective", eye: { x: 0, y: 2.8, z: 0.04 }, lookAt: look, zoomGain: g };
  }
  throw new Error(`applyFactoryView: unknown ${id}`);
}

/** T-CAM-1: camera inspect must not invoke compute. */
export function applyCameraInspect(
  pose: CameraPose,
  next: CameraPose,
  compute: () => void,
): CameraPose {
  void compute;
  return {
    projection: next.projection,
    eye: { ...next.eye },
    lookAt: { ...next.lookAt },
    zoomGain: next.zoomGain,
    up: next.up ? { ...next.up } : undefined,
    flipX: next.flipX,
  };
}
