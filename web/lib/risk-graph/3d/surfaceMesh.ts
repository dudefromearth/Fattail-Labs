/**
 * Heritage: MSC RiskGraph3DView buildSurfaceMesh / getColorForPnL (presentation).
 * Source: strategy-lab-proto/msc-risk-graph-ui/src/components/risk-graph/RiskGraph3DView.tsx
 * AZ-VP-S4 / DL-302: mesh + shader only. P&L grid comes from surfaceModel.ts.
 */

import * as THREE from "three";
import { buildCoords } from "./charlie.js";
import type { SurfaceSheet } from "../surfaceModel";

const COL_MAX_LOSS_DEF = new THREE.Color(0x8b0000);
const COL_MAX_PROFIT_DEF = new THREE.Color(0x00ff00);

const SURFACE_VERT = /* glsl */ `
  attribute vec3 color;
  varying   vec3 vColor;
  varying   vec3 vNormal;
  varying   vec3 vViewPos;
  varying   float vLiveFactor;
  uniform float uLiveZoneZ;
  uniform float uRampZ;
  void main() {
    vColor = color;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mv.xyz;
    vLiveFactor = smoothstep(uLiveZoneZ - uRampZ, uLiveZoneZ + uRampZ, position.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const SURFACE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3  vColor;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  varying float vLiveFactor;
  uniform vec3  uLightDir;
  uniform float uSurfaceIntensity;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    vec3 L = uLightDir;
    float amb = 0.50;
    float diff = max(dot(N, L), 0.0) * 0.70;
    float shin = mix(16.0, 0.5, vLiveFactor);
    vec3 specCol = mix(vec3(1.0 / 17.0), vec3(0.0), vLiveFactor);
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.0), shin);
    vec3 col = mix(vColor, vColor * 0.85, vLiveFactor);
    vec3 final = col * (amb + diff) + specCol * spec;
    float alpha = mix(0.75, 0.55, vLiveFactor);
    gl_FragColor = vec4(final * uSurfaceIntensity, alpha);
  }
`;

function colorForPnl(
  pnl: number,
  minPnL: number,
  maxPnL: number,
  out: THREE.Color,
): THREE.Color {
  if (pnl >= 0) {
    const t = maxPnL > 0 ? Math.min(1, pnl / maxPnL) : 0;
    out.copy(COL_MAX_PROFIT_DEF).multiplyScalar(0.25 + 0.75 * Math.pow(t, 0.7));
  } else {
    const t = minPnL < 0 ? Math.min(1, pnl / minPnL) : 0;
    out.copy(COL_MAX_LOSS_DEF).multiplyScalar(0.25 + 0.75 * Math.pow(t, 0.7));
  }
  return out;
}

export function sheetToMeshData(sheet: SurfaceSheet) {
  const NX = sheet.spotAxis.length;
  const NT = sheet.timeAxis.length;
  const T_max = Math.max(sheet.maxTau * 365.25, 1 / 1440);
  const pnlBuffer = new Float32Array(NT * NX);
  for (let i = 0; i < NT; i++) {
    for (let j = 0; j < NX; j++) {
      pnlBuffer[i * NX + j] = sheet.pnlGrid[i][j];
    }
  }
  const timeSlices = sheet.timeAxis.map((tau) => (sheet.maxTau - tau) * 365.25);
  return {
    pnlBuffer,
    minPnL: sheet.minPnL,
    maxPnL: sheet.maxPnL,
    sMin: sheet.sMin,
    sMax: sheet.sMax,
    T_max,
    spotSlices: sheet.spotAxis,
    timeSlices,
    NX,
    NT,
    spot: sheet.spot,
  };
}

export function buildSurfaceMesh(
  data: ReturnType<typeof sheetToMeshData>,
  coords: ReturnType<typeof buildCoords>,
  scene: THREE.Scene,
) {
  const { pnlBuffer, minPnL, maxPnL, NX, NT, T_max, timeSlices, spotSlices } =
    data;
  const nVerts = NT * NX;
  const positions = new Float32Array(nVerts * 3);
  const colors = new Float32Array(nVerts * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < NT; i++) {
    const remainingDays = T_max - timeSlices[i];
    const z = coords.nz(remainingDays);
    for (let j = 0; j < NX; j++) {
      const idx = i * NX + j;
      positions[idx * 3] = coords.nx(spotSlices[j]);
      positions[idx * 3 + 1] = coords.ny(pnlBuffer[idx]);
      positions[idx * 3 + 2] = z;
      colorForPnl(pnlBuffer[idx], minPnL, maxPnL, tmp);
      colors[idx * 3] = tmp.r;
      colors[idx * 3 + 1] = tmp.g;
      colors[idx * 3 + 2] = tmp.b;
    }
  }
  const indices = new Uint32Array((NT - 1) * (NX - 1) * 6);
  let ii = 0;
  for (let i = 0; i < NT - 1; i++) {
    for (let j = 0; j < NX - 1; j++) {
      const a = i * NX + j;
      const b = (i + 1) * NX + j;
      const cc = i * NX + j + 1;
      const d = (i + 1) * NX + j + 1;
      indices[ii++] = a;
      indices[ii++] = b;
      indices[ii++] = cc;
      indices[ii++] = b;
      indices[ii++] = d;
      indices[ii++] = cc;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    uniforms: {
      uLiveZoneZ: { value: coords.nz(2) },
      uRampZ: { value: 0.15 },
      uLightDir: { value: new THREE.Vector3(5, 8, 5).normalize() },
      uSurfaceIntensity: { value: 1 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  scene.add(mesh);
  const edgeGeo = new THREE.EdgesGeometry(geo, 15);
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x666666,
    transparent: true,
    opacity: 0.08,
  });
  const wire = new THREE.LineSegments(edgeGeo, edgeMat);
  scene.add(wire);
  return {
    dispose() {
      scene.remove(mesh);
      scene.remove(wire);
      geo.dispose();
      mat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
    },
  };
}
