/**
 * echo.js — PlaneAgent
 * Domain: Reference frame box (wireframe prism), dynamic axes + labels,
 *         zero P&L plane, spot plane, expiry marker line
 *
 * Spec sources:
 *   REFERENCE FRAME BOX
 *   DYNAMIC REFERENCE FRAME BOX
 *   ZERO P&L PLANE AND SPOT PLANE
 *   MULTIPLE EXPIRIES § 6 Axes and Labels (expiry dashed line)
 *
 * Dependencies:
 *   charlie.js → buildCoords(), DataRange (CoordFns)
 *   alpha.js   → scene, renderer (for dynamic sizing)
 *
 * Doctrine:
 *   - Echo NEVER rebuilds the surface mesh.
 *   - Spot plane updates (market tick) call update(spot, rtPnL) only.
 *   - Dynamic box listens to scene:resize event (fired by Alpha). Echo handles it.
 *   - Axis labels use THREE.Sprite. They always face the camera (billboard).
 *   - spotCtrl.update() must not touch surface geometry. Zero lines.
 *
 * Exports:
 *   buildReferenceBox(coords, scene, renderer?)          → BoxSet
 *   buildZeroPnLPlane(coords, scene)                     → ZeroPlaneSet
 *   buildSpotPlane(coords, scene)                        → SpotPlaneController
 *   buildExpiryMarker(coords, scene, splitDTE)           → ExpiryMarker
 *   syncExpiryMarker(coords, scene, legs, existing?)     → ExpiryMarker | null
 *   updateSpotPlane(ctrl, spot, rtPnL)                   → void
 */

import * as THREE from 'three'
import { getExpiryBoundaries } from './charlie.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const BOX_LINE_COLOR    = 0xFFFFFF
const BOX_LINE_OPACITY  = 0.15
const AXIS_LABEL_COLOR  = '#FFFFFF'
const TICK_OPACITY      = 0.65

const ZERO_PLANE_COLOR   = 0xFFFFFF
const ZERO_PLANE_OPACITY = 0.18
const ZERO_EDGE_OPACITY  = 0.40

const SPOT_PLANE_COLORS = {
  profit:  new THREE.Color(0.133, 0.773, 0.369),  // #22C55E
  loss:    new THREE.Color(0.937, 0.267, 0.267),  // #EF4444
  neutral: new THREE.Color(1.0,   1.0,   1.0),
}
const SPOT_PLANE_BASE_OPACITY = 0.22
const SPOT_EDGE_BASE_OPACITY  = 0.50

const AXIS_TICKS = 5   // intervals per axis (X/Z fallback)

/**
 * niceYTicks(pMin, pMax) → number[]
 *
 * Generates readable P&L tick values at round dollar increments.
 * Targets 3–8 ticks by choosing the largest step size that produces at
 * least 3 ticks.  Always includes $0 when it falls inside the range.
 */
function niceYTicks(pMin, pMax) {
  const range = pMax - pMin
  if (range <= 0) return [0]
  const steps = [5, 10, 25, 50, 100, 200, 250, 500, 1000, 2500, 5000, 10000]
  let step = steps[steps.length - 1]
  for (const s of steps) {
    const count = Math.floor(range / s)
    if (count >= 3 && count <= 8) { step = s; break }
    if (count < 3) { step = s; break }   // too few — use this step (gives 1-2 ticks, still ok)
  }
  const first = Math.ceil(pMin / step) * step
  const ticks = []
  for (let v = first; v <= pMax + step * 0.001; v += step) {
    const snapped = Math.round(v / step) * step
    if (snapped >= pMin - step * 0.001 && snapped <= pMax + step * 0.001) {
      ticks.push(snapped)
    }
  }
  return ticks
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * makeTextSprite(text, opts?) → THREE.Sprite
 * Canvas-backed billboard label. Always faces camera (Sprite default).
 */
function makeTextSprite(text, { fontSize = 30, color = '#ffffff' } = {}) {
  const canvas  = document.createElement('canvas')
  const ctx     = canvas.getContext('2d')
  canvas.width  = 512
  canvas.height = 80
  ctx.font          = fontSize + 'px "Courier New", monospace'
  ctx.fillStyle     = color
  ctx.textAlign     = 'center'
  ctx.textBaseline  = 'middle'
  ctx.fillText(text, 256, 40)

  const texture = new THREE.CanvasTexture(canvas)
  const mat     = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false })
  const sprite  = new THREE.Sprite(mat)
  return sprite
}

/**
 * disposeGroup(group) — recursively disposes geometry + material for all children.
 * Handles Lines (geometry), Sprites (material.map = CanvasTexture), and nested Groups.
 */
function disposeGroup(group) {
  for (const child of group.children) {
    if (child.isGroup) {
      disposeGroup(child)
    }
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (child.material.map) child.material.map.dispose()
      child.material.dispose()
    }
  }
  group.clear()
}

// ─── Axis labels ──────────────────────────────────────────────────────────────

/**
 * selectEvenMajorStrikes(ladder, lo, hi, coords) → number[]
 *
 * Major X-axis labels: independent of any position. Evenly distributed across
 * the visible price window, snapped to real strikes from `ladder`. Target count
 * is chosen for readability (~4–8), bounded by scene-space separation so labels
 * never crowd.
 */
function selectEvenMajorStrikes(ladder, lo, hi, coords, {
  minSep = 0.55,
  minTicks = 4,
  maxTicks = 8,
} = {}) {
  const sorted = [...new Set((ladder || []).filter(v =>
    Number.isFinite(v) && v >= lo - 1e-6 && v <= hi + 1e-6,
  ))].sort((a, b) => a - b)

  if (sorted.length === 0) return []
  if (sorted.length === 1) return sorted

  const span = Math.abs(coords.nx(hi) - coords.nx(lo))
  // How many labeled ticks fit without crowding
  const maxBySpace = Math.max(2, Math.floor(span / minSep) + 1)
  const target = Math.min(
    maxTicks,
    Math.max(minTicks, Math.min(sorted.length, maxBySpace)),
  )

  // Ideal even prices across the axis → nearest ladder strike that still
  // respects min scene-space separation from the previous major.
  const chosen = []
  const taken = new Set()
  for (let i = 0; i < target; i++) {
    const ideal = lo + (target === 1 ? 0 : (i / (target - 1)) * (hi - lo))
    let best = null
    let bestDist = Infinity
    for (const s of sorted) {
      if (taken.has(s)) continue
      if (chosen.length > 0) {
        const prevX = coords.nx(chosen[chosen.length - 1])
        if (Math.abs(coords.nx(s) - prevX) < minSep) continue
      }
      const d = Math.abs(s - ideal)
      if (d < bestDist) { bestDist = d; best = s }
    }
    if (best == null) break
    taken.add(best)
    chosen.push(best)
  }

  // If greedy left-to-right under-filled (tight ladder), fall back to even
  // index sampling across the full ladder — still real strikes only.
  if (chosen.length < Math.min(target, sorted.length) && chosen.length < minTicks) {
    const n = Math.min(target, sorted.length)
    const byIndex = []
    for (let i = 0; i < n; i++) {
      const idx = Math.round(i * (sorted.length - 1) / Math.max(1, n - 1))
      byIndex.push(sorted[idx])
    }
    const uniq = [...new Set(byIndex)].sort((a, b) => a - b)
    const visible = []
    for (const val of uniq) {
      if (visible.length > 0
          && Math.abs(coords.nx(val) - coords.nx(visible[visible.length - 1])) < minSep) {
        continue
      }
      visible.push(val)
    }
    return visible
  }

  return chosen
}

function buildAxisLabels(
  corners, coords, zLabelFn = null, xTicks = null, strikeOnExpiry = false,
  xStructureMarks = null,
) {
  const { xMin, xMax, yMin, yMax, zMin, zMax } = corners
  const strikeZ = strikeOnExpiry ? zMin : zMax
  const { range } = coords
  const group = new THREE.Group()

  // ── Axis name labels (dimmed gray, pushed further out) ────────────────────

  const strikeLabel = makeTextSprite('STRIKE', { fontSize: 26, color: '#888888' })
  strikeLabel.scale.set(2.6, 0.52, 1)
  strikeLabel.position.set((xMin + xMax) / 2, yMin - 1.0, strikeZ)
  group.add(strikeLabel)

  const pnlLabel = makeTextSprite('P&L', { fontSize: 26, color: '#888888' })
  pnlLabel.scale.set(1.8, 0.52, 1)
  pnlLabel.position.set(xMin - 3.2, (yMin + yMax) / 2, zMin)
  group.add(pnlLabel)

  const timeLabel = makeTextSprite('TIME (DTE)', { fontSize: 26, color: '#888888' })
  timeLabel.scale.set(1.8, 0.52, 1)
  timeLabel.position.set(xMax + 2.7, yMin - 0.30, (zMin + zMax) / 2)
  group.add(timeLabel)

  const tickMat = () => new THREE.LineBasicMaterial({
    color: 0xFFFFFF, transparent: true, opacity: 0.65,
  })
  const structureTickMat = () => new THREE.LineBasicMaterial({
    color: 0xFBBF24, transparent: true, opacity: 0.85,  // amber — position intersection
  })

  // ── Strike axis ticks (X) ─────────────────────────────────────────────────
  // Major ticks: even across the axis, snapped to real chain strikes.
  // Independent of any position. Structure legs get small unmarked ticks only.

  function paintMajorTick(val) {
    const x = coords.nx(val)
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, yMin,        strikeZ),
      new THREE.Vector3(x, yMin - 0.32, strikeZ),
    ])
    group.add(new THREE.Line(tickGeo, tickMat()))

    const sp = makeTextSprite(Math.round(val).toString(), { fontSize: 23, color: '#dddddd' })
    sp.scale.set(3.2, 0.62, 1)
    sp.position.set(x, yMin - 0.55, strikeZ)
    group.add(sp)
  }

  /** Short amber tick + tiny dot — marks where a position strike hits the axis. No label. */
  function paintStructureMark(val) {
    const x = coords.nx(val)
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, yMin,        strikeZ),
      new THREE.Vector3(x, yMin - 0.18, strikeZ),
    ])
    group.add(new THREE.Line(tickGeo, structureTickMat()))

    // Small billboard dot above the short tick
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx2 = canvas.getContext('2d')
    ctx2.beginPath()
    ctx2.arc(16, 16, 10, 0, Math.PI * 2)
    ctx2.fillStyle = '#FBBF24'
    ctx2.fill()
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.9,
    })
    const dot = new THREE.Sprite(mat)
    dot.scale.set(0.22, 0.22, 1)
    dot.position.set(x, yMin - 0.28, strikeZ)
    group.add(dot)
  }

  const lo = range.sMin, hi = range.sMax
  let ladder = (xTicks && xTicks.length > 0)
    ? xTicks
    : null

  if (!ladder) {
    // Last resort: strike-like grid (multiples of 5), still not arbitrary floats
    const stepGuess = 5
    const synthetic = []
    const start = Math.ceil(lo / stepGuess) * stepGuess
    for (let v = start; v <= hi + 1e-6; v += stepGuess) synthetic.push(v)
    ladder = synthetic.length >= 2 ? synthetic : null
  }

  const majors = ladder && ladder.length > 0
    ? selectEvenMajorStrikes(ladder, lo, hi, coords)
    : (() => {
        // Absolute fallback: even division of the range (no strike data at all)
        const out = []
        for (let i = 0; i <= AXIS_TICKS; i++) {
          out.push(lo + (i / AXIS_TICKS) * (hi - lo))
        }
        return out
      })()

  const majorSet = new Set(majors.map(v => Math.round(v * 1000) / 1000))
  for (const val of majors) paintMajorTick(val)

  // Position structure intersections — secondary marks only (no labels, not majors)
  if (xStructureMarks && xStructureMarks.length > 0) {
    for (const raw of xStructureMarks) {
      if (!Number.isFinite(raw) || raw < lo - 1e-6 || raw > hi + 1e-6) continue
      // Skip if a major already sits on this strike (already labeled)
      const key = Math.round(raw * 1000) / 1000
      if (majorSet.has(key)) continue
      // Also skip if nearly equal to any major (float / rounding)
      let nearMajor = false
      for (const m of majors) {
        if (Math.abs(m - raw) < 0.01) { nearMajor = true; break }
      }
      if (nearMajor) continue
      paintStructureMark(raw)
    }
  }

  // ── P&L axis ticks (Y) — nice dollar increments, density-filtered ────────
  // Ticks land on round dollar values (e.g. -$500, -$250, $0, +$250, +$500).
  // Scene-space minimum separation (0.40 units) prevents overlap when the
  // P&L range is small; the nice-step algorithm caps total count at ~8.

  const Y_MIN_SEP = 0.40
  let prevY = -Infinity

  for (const val of niceYTicks(range.pMin, range.pMax)) {
    const y = coords.ny(val)
    if (y - prevY < Y_MIN_SEP) continue   // too close — skip
    prevY = y

    const prefix = val > 0 ? '+$' : val < 0 ? '-$' : '$'
    const label  = prefix + Math.abs(val).toString()
    const color  = val === 0 ? '#ffffff' : '#aaaaaa'   // zero line in white

    // Back-left edge tick + label
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMin,        y, zMin),
      new THREE.Vector3(xMin - 0.32, y, zMin),
    ])
    group.add(new THREE.Line(tickGeo, tickMat()))

    const sp = makeTextSprite(label, { fontSize: 23, color })
    sp.scale.set(3.4, 0.62, 1)
    sp.position.set(xMin - 1.1, y, zMin)
    group.add(sp)

    // Front-left edge tick + label
    const tickGeoFrontL = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMin,        y, zMax),
      new THREE.Vector3(xMin - 0.32, y, zMax),
    ])
    group.add(new THREE.Line(tickGeoFrontL, tickMat()))

    const spFrontL = makeTextSprite(label, { fontSize: 23, color })
    spFrontL.scale.set(3.4, 0.62, 1)
    spFrontL.position.set(xMin - 1.1, y, zMax)
    group.add(spFrontL)

    // Front-right edge tick + label
    const tickGeoFrontR = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMax,        y, zMax),
      new THREE.Vector3(xMax + 0.32, y, zMax),
    ])
    group.add(new THREE.Line(tickGeoFrontR, tickMat()))

    const spFrontR = makeTextSprite(label, { fontSize: 23, color })
    spFrontR.scale.set(3.4, 0.62, 1)
    spFrontR.position.set(xMax + 1.1, y, zMax)
    group.add(spFrontR)
  }

  // ── TIME axis ticks (Z) — 5 intervals ────────────────────────────────────

  for (let i = 0; i <= AXIS_TICKS; i++) {
    const t   = i / AXIS_TICKS
    const val = Math.round(t * range.maxDTE)        // DTE in days
    const z   = coords.nz(val)

    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMax,        yMin, z),
      new THREE.Vector3(xMax + 0.32, yMin, z),
    ])
    group.add(new THREE.Line(tickGeo, tickMat()))

    const zText = zLabelFn ? zLabelFn(val) : val.toString() + 'd'
    const sp = makeTextSprite(zText)
    sp.scale.set(2.0, 0.58, 1)
    sp.position.set(xMax + 1.45, yMin - 0.30, z)
    group.add(sp)
  }

  return group
}

// ─── Reference frame box ─────────────────────────────────────────────────────

/**
 * buildReferenceBox(coords, scene, renderer?) → BoxSet
 *
 * Builds the 12-edge wireframe bounding box at data-range dimensions.
 * THREE.Sprite axis labels (STRIKE / P&L / TIME) with numeric ticks at 5
 * intervals per axis. Labels always face camera.
 *
 * When renderer is supplied: listens to window 'scene:resize' event and
 * rebuilds box + labels. Does NOT rebuild the surface mesh.
 *
 * @param {import('./charlie.js').CoordFns} coords
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} [renderer]
 * @returns {{ box: THREE.LineSegments, axisGroup: THREE.Group, rebuild: Function, dispose: Function }}
 */
export function buildReferenceBox(coords, scene, renderer = null, opts = {}) {
  const { nx, ny, nz, range } = coords
  // xTicks: full chain strike ladder in the window (majors sampled evenly from these).
  // xStructureMarks: position leg strikes — short amber marks only, do not drive majors.
  const { zLabelFn = null, xTicks = null, xStructureMarks = null } = opts
  let strikeOnExpiry = false   // toggled by setTickFace('expiry' | 'today')

  function getCorners() {
    return {
      xMin: nx(range.sMin), xMax: nx(range.sMax),
      yMin: ny(range.pMin), yMax: ny(range.pMax),
      zMin: nz(0),          zMax: nz(range.maxDTE),
    }
  }

  function buildBoxLines(c) {
    const { xMin, xMax, yMin, yMax, zMin, zMax } = c
    const edges = [
      // Bottom face
      [xMin,yMin,zMin, xMax,yMin,zMin],
      [xMax,yMin,zMin, xMax,yMin,zMax],
      [xMax,yMin,zMax, xMin,yMin,zMax],
      [xMin,yMin,zMax, xMin,yMin,zMin],
      // Top face
      [xMin,yMax,zMin, xMax,yMax,zMin],
      [xMax,yMax,zMin, xMax,yMax,zMax],
      [xMax,yMax,zMax, xMin,yMax,zMax],
      [xMin,yMax,zMax, xMin,yMax,zMin],
      // Verticals
      [xMin,yMin,zMin, xMin,yMax,zMin],
      [xMax,yMin,zMin, xMax,yMax,zMin],
      [xMax,yMin,zMax, xMax,yMax,zMax],
      [xMin,yMin,zMax, xMin,yMax,zMax],
    ]

    const pts = []
    for (const [x1,y1,z1, x2,y2,z2] of edges) {
      pts.push(new THREE.Vector3(x1, y1, z1))
      pts.push(new THREE.Vector3(x2, y2, z2))
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color: BOX_LINE_COLOR, transparent: true, opacity: BOX_LINE_OPACITY,
    })
    return new THREE.LineSegments(geo, mat)
  }

  let corners   = getCorners()
  let box       = buildBoxLines(corners)
  let axisGroup = buildAxisLabels(corners, coords, zLabelFn, xTicks, strikeOnExpiry, xStructureMarks)
  scene.add(box)
  scene.add(axisGroup)

  // Rebuild box + labels on resize. Never touches surface.
  function rebuild() {
    scene.remove(box)
    box.geometry.dispose()
    box.material.dispose()

    scene.remove(axisGroup)
    disposeGroup(axisGroup)

    corners   = getCorners()
    box       = buildBoxLines(corners)
    axisGroup = buildAxisLabels(corners, coords, zLabelFn, xTicks, strikeOnExpiry, xStructureMarks)
    scene.add(box)
    scene.add(axisGroup)
  }

  // Move strike ticks/labels to the 0DTE face (CHART detent) or back to Today face.
  function setTickFace(face) {
    const wantExpiry = face === 'expiry'
    if (wantExpiry === strikeOnExpiry) return   // no change
    strikeOnExpiry = wantExpiry
    rebuild()
  }


  let resizeListener = null
  if (renderer) {
    resizeListener = () => rebuild()
    window.addEventListener('scene:resize', resizeListener)
  }

  function dispose() {
    scene.remove(box)
    box.geometry.dispose()
    box.material.dispose()

    scene.remove(axisGroup)
    disposeGroup(axisGroup)

    if (resizeListener) window.removeEventListener('scene:resize', resizeListener)
  }

  return {
    get box()       { return box },
    get axisGroup() { return axisGroup },
    rebuild,
    setTickFace,
    dispose,
  }
}

// ─── Zero P&L plane ───────────────────────────────────────────────────────────

/**
 * buildZeroPnLPlane(coords, scene) → ZeroPlaneSet
 *
 * Horizontal THREE.Mesh at ny(0). rgba(255,255,255,0.18) fill.
 * Bold border at 0.4 opacity. renderOrder=1.
 *
 * @param {import('./charlie.js').CoordFns} coords
 * @param {THREE.Scene} scene
 * @returns {{ mesh: THREE.Mesh, border: THREE.Line, dispose: Function }}
 */
export function buildZeroPnLPlane(coords, scene) {
  const { nx, ny, nz, range } = coords

  const xMin = nx(range.sMin), xMax = nx(range.sMax)
  const z0   = nz(0),          zMax = nz(range.maxDTE)
  const y0   = ny(0)

  const w = xMax - xMin
  const d = zMax - z0

  // Translucent fill
  const planeGeo = new THREE.PlaneGeometry(w, d)
  const planeMat = new THREE.MeshBasicMaterial({
    color:      ZERO_PLANE_COLOR,
    transparent: true,
    opacity:    ZERO_PLANE_OPACITY,
    side:       THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(planeGeo, planeMat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set((xMin + xMax) / 2, y0, (z0 + zMax) / 2)
  mesh.renderOrder = 1
  scene.add(mesh)

  // Bold perimeter border
  const borderPts = [
    new THREE.Vector3(xMin, y0, z0),
    new THREE.Vector3(xMax, y0, z0),
    new THREE.Vector3(xMax, y0, zMax),
    new THREE.Vector3(xMin, y0, zMax),
    new THREE.Vector3(xMin, y0, z0),   // close loop
  ]
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts)
  const borderMat = new THREE.LineBasicMaterial({
    color: ZERO_PLANE_COLOR, transparent: true, opacity: ZERO_EDGE_OPACITY,
  })
  const border = new THREE.Line(borderGeo, borderMat)
  border.renderOrder = 2
  scene.add(border)

  function dispose() {
    scene.remove(mesh);   mesh.geometry.dispose();   mesh.material.dispose()
    scene.remove(border); border.geometry.dispose(); border.material.dispose()
  }

  return { mesh, border, dispose }
}

// ─── Spot plane ───────────────────────────────────────────────────────────────

/**
 * buildSpotPlane(coords, scene) → SpotPlaneController
 *
 * Vertical THREE.Mesh at current spot price. Conditional color: green (profit) /
 * red (loss) / neutral (white). update(spot, rtPnL) repositions by mutating
 * position and geometry attributes in-place — never rebuilds the surface mesh.
 *
 * Doctrine: spotCtrl.update() must not touch surface geometry. Zero lines.
 *
 * @param {import('./charlie.js').CoordFns} coords
 * @param {THREE.Scene} scene
 * @returns {{ update: (spot: number, rtPnL: number) => void, dispose: Function }}
 */
export function buildSpotPlane(coords, scene) {
  const { nx, ny, nz, range } = coords

  const yMin = ny(range.pMin), yMax = ny(range.pMax)
  const z0   = nz(0),          zMax = nz(range.maxDTE)

  const h     = yMax - yMin
  const d     = zMax - z0
  const initX = nx((range.sMin + range.sMax) / 2)

  // Translucent fill — rotated to stand vertical along X
  const planeGeo = new THREE.PlaneGeometry(d, h)
  const planeMat = new THREE.MeshBasicMaterial({
    color:      SPOT_PLANE_COLORS.neutral,
    transparent: true,
    opacity:    SPOT_PLANE_BASE_OPACITY,
    side:       THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(planeGeo, planeMat)
  mesh.rotation.y = Math.PI / 2
  mesh.position.set(initX, (yMin + yMax) / 2, (z0 + zMax) / 2)
  mesh.renderOrder = 1
  scene.add(mesh)

  // Bold perimeter border
  const borderPts = [
    new THREE.Vector3(initX, yMin, z0),
    new THREE.Vector3(initX, yMax, z0),
    new THREE.Vector3(initX, yMax, zMax),
    new THREE.Vector3(initX, yMin, zMax),
    new THREE.Vector3(initX, yMin, z0),   // close loop
  ]
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts)
  const borderMat = new THREE.LineBasicMaterial({
    color: SPOT_PLANE_COLORS.neutral, transparent: true, opacity: SPOT_EDGE_BASE_OPACITY,
  })
  const border = new THREE.Line(borderGeo, borderMat)
  border.renderOrder = 2
  scene.add(border)

  /**
   * update(spot, rtPnL) — called on every market tick (4 Hz).
   * Mutates position and geometry attributes in-place. Never rebuilds surface.
   */
  function update(spot, rtPnL) {
    const x = nx(spot)

    // Reposition mesh (translate only — geometry stays at origin-relative coords)
    mesh.position.setX(x)

    // Reposition border vertices in-place
    const pos = border.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, x)
    }
    pos.needsUpdate = true

    // Recolor based on real-time P&L sign
    const col = rtPnL > 0 ? SPOT_PLANE_COLORS.profit
              : rtPnL < 0 ? SPOT_PLANE_COLORS.loss
              :              SPOT_PLANE_COLORS.neutral

    planeMat.color.copy(col)
    borderMat.color.copy(col)
  }

  function dispose() {
    scene.remove(mesh);   mesh.geometry.dispose();   mesh.material.dispose()
    scene.remove(border); border.geometry.dispose(); border.material.dispose()
  }

  return { update, dispose }
}

/**
 * updateSpotPlane(ctrl, spot, rtPnL) → void
 *
 * Standalone export alias for callers that hold a controller reference.
 * Identical to ctrl.update(spot, rtPnL). Provided for symmetry with the
 * module-level API surface declared in the seed header.
 *
 * @param {{ update: Function }} ctrl  — return value of buildSpotPlane()
 * @param {number} spot                — current underlying price
 * @param {number} rtPnL               — real-time position P&L
 */
export function updateSpotPlane(ctrl, spot, rtPnL) {
  ctrl.update(spot, rtPnL)
}

// ─── Expiry marker ────────────────────────────────────────────────────────────

/**
 * buildExpiryMarker(coords, scene, splitDTE) → ExpiryMarker
 *
 * Dashed rectangle outline at the earliest-expiry boundary on the Z axis.
 * Billboard label at top center. Per MULTIPLE EXPIRIES § 6.
 *
 * @param {import('./charlie.js').CoordFns} coords
 * @param {THREE.Scene} scene
 * @param {number} splitDTE  — DTE of earliest leg expiry (from getExpiryBoundaries)
 * @returns {{ line: THREE.Line, label: THREE.Sprite, dispose: Function }}
 */
/**
 * syncExpiryMarker(coords, scene, legs, existingMarker?) → ExpiryMarker | null
 *
 * Canonical call-site for expiry marker lifecycle. Disposes any existing marker
 * before building a new one. Returns null when all legs share a single expiry
 * (no boundary to mark).
 *
 * @param {import('./charlie.js').CoordFns} coords
 * @param {THREE.Scene} scene
 * @param {import('./charlie.js').Leg[]} legs
 * @param {{ dispose: Function } | null} [existingMarker]
 * @returns {{ line: THREE.Line, label: THREE.Sprite, dispose: Function } | null}
 */
export function syncExpiryMarker(coords, scene, legs, existingMarker = null) {
  if (existingMarker) existingMarker.dispose()
  const { earliest, latest } = getExpiryBoundaries(legs)
  if (earliest < latest) {
    return buildExpiryMarker(coords, scene, earliest)
  }
  return null   // single expiry — no marker needed
}

export function buildExpiryMarker(coords, scene, splitDTE) {
  const { nx, ny, nz, range } = coords

  const xMin = nx(range.sMin), xMax = nx(range.sMax)
  const xMid = (xMin + xMax) / 2
  const yMin = ny(range.pMin), yMax = ny(range.pMax)
  const z    = nz(splitDTE)

  // Dashed rectangular outline at the expiry DTE slice
  const pts = [
    new THREE.Vector3(xMin, yMin, z),
    new THREE.Vector3(xMin, yMax, z),
    new THREE.Vector3(xMax, yMax, z),
    new THREE.Vector3(xMax, yMin, z),
    new THREE.Vector3(xMin, yMin, z),   // close loop
  ]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineDashedMaterial({
    color:       0x888888,
    transparent: true,
    opacity:     0.50,
    dashSize:    0.15,
    gapSize:     0.08,
  })
  const line = new THREE.Line(geo, mat)
  line.computeLineDistances()
  scene.add(line)

  // Billboard label centered above the marker
  const label = makeTextSprite('EXPIRY', { fontSize: 12, color: '#888888' })
  label.position.set(xMid, yMax + 0.40, z)
  label.scale.set(0.8, 0.2, 1)
  scene.add(label)

  function dispose() {
    scene.remove(line);  line.geometry.dispose();  line.material.dispose()
    scene.remove(label); label.material.map.dispose(); label.material.dispose()
  }

  return { line, label, dispose }
}
