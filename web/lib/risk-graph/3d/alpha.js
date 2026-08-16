/**
 * Heritage: MSC Risk Graph 3D scene agent (presentation only).
 * Source: strategy-lab-proto/msc-risk-graph-ui/src/3d/alpha.js
 * AZ-VP-S4 / DL-302: scene + lighting + reference frame.
 * Pricing SoR is web/lib/risk-graph/surfaceModel.ts — do not call
 * charlie.computeSurface from product paths (flat-IV sheet).
 */
/**
 * alpha.js — SceneAgent
 * Three.js scene initialization module for the 3D options P&L surface visualizer.
 *
 * Spec source: SURFACE SHADING § 3 Lighting
 * Doctrine: Alpha owns the scene object. All other agents receive scene as a
 * parameter — they never construct it. Alpha is the only agent that calls
 * renderer.render() in the main loop.
 *
 * Exports: initScene(container) → SceneContext
 */

import * as THREE from 'three'

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMERA_FOV      = 60
const CAMERA_NEAR     = 0.1
const CAMERA_FAR      = 100
const CAMERA_INIT_POS = { x: 8, y: 6, z: 10 }
const LOOKAT_TARGET   = { x: 0, y: 0, z: 0 }

// Orthographic frustum half-height calibrated to match perspective view
// at the default camera distance (R=8) with FOV=60°: 8 * tan(30°) ≈ 4.62.
// Used by the RISK detent to give stable, distortion-free P&L measurements.
const ORTHO_FRUSTUM_HEIGHT = 4.62

// ─── Scene Init ───────────────────────────────────────────────────────────────

/**
 * initScene(container: HTMLElement) → SceneContext
 *
 * Creates and mounts the Three.js renderer into the provided container.
 * Returns the full scene context that every other agent imports.
 */
export function initScene(container) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // Scene
  const scene = new THREE.Scene()

  // Cameras — both perspective and orthographic are kept alive so the host
  // can swap between them without rebuilding the scene.  The render loop
  // always reads from `activeCamera`; the public `ctx.camera` getter returns
  // whichever one is currently active.
  const aspect = container.clientWidth / container.clientHeight
  const perspectiveCamera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR)
  perspectiveCamera.position.set(CAMERA_INIT_POS.x, CAMERA_INIT_POS.y, CAMERA_INIT_POS.z)
  perspectiveCamera.lookAt(LOOKAT_TARGET.x, LOOKAT_TARGET.y, LOOKAT_TARGET.z)

  const orthoTop    =  ORTHO_FRUSTUM_HEIGHT
  const orthoBottom = -ORTHO_FRUSTUM_HEIGHT
  const orthoRight  =  ORTHO_FRUSTUM_HEIGHT * aspect
  const orthoLeft   = -ORTHO_FRUSTUM_HEIGHT * aspect
  const orthographicCamera = new THREE.OrthographicCamera(
    orthoLeft, orthoRight, orthoTop, orthoBottom, CAMERA_NEAR, CAMERA_FAR,
  )
  orthographicCamera.position.copy(perspectiveCamera.position)
  orthographicCamera.lookAt(LOOKAT_TARGET.x, LOOKAT_TARGET.y, LOOKAT_TARGET.z)

  let activeCamera = perspectiveCamera

  // Clock (shared deltaTime source — all agents use this, never Date.now())
  const clock = new THREE.Clock()

  // ── Lighting ─────────────────────────────────────────────────────────────
  // Per SURFACE SHADING § 3: ambient 0.5 + directional 0.7 at (5,8,5)
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7)
  directionalLight.position.set(5, 8, 5)
  directionalLight.target.position.set(
    LOOKAT_TARGET.x,
    LOOKAT_TARGET.y,
    LOOKAT_TARGET.z
  )
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width  = 1024
  directionalLight.shadow.mapSize.height = 1024
  directionalLight.shadow.camera.near   = 0.1
  directionalLight.shadow.camera.far    = 30
  directionalLight.shadow.camera.left   = -10
  directionalLight.shadow.camera.right  =  10
  directionalLight.shadow.camera.top    =  10
  directionalLight.shadow.camera.bottom = -10
  directionalLight.shadow.bias = -0.002
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  // ── Render loop ───────────────────────────────────────────────────────────
  // frameCallbacks: registered by other agents via registerFrameCallback()
  // Each callback receives deltaTime and is called once per frame.
  const frameCallbacks = new Map()
  let animFrameId = null
  let isRunning = false

  function loop() {
    if (!isRunning) return
    animFrameId = requestAnimationFrame(loop)
    const delta = clock.getDelta()
    for (const cb of frameCallbacks.values()) {
      cb(delta)
    }
    renderer.render(scene, activeCamera)
  }

  function startLoop() {
    if (isRunning) return
    isRunning = true
    clock.start()
    loop()
  }

  function stopLoop() {
    isRunning = false
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
  }

  /**
   * registerFrameCallback(key: string, cb: (delta: number) => void)
   * Bravo, Delta, Echo, Foxtrot register their per-frame work here.
   * Key is the agent name — idempotent (re-register replaces the old one).
   */
  function registerFrameCallback(key, cb) {
    frameCallbacks.set(key, cb)
  }

  function unregisterFrameCallback(key) {
    frameCallbacks.delete(key)
  }

  // ── Resize handler ────────────────────────────────────────────────────────
  // Called by the host app on window resize.
  // Echo also hooks this to recompute box dimensions — Alpha fires the event,
  // Echo listens. Alpha does NOT rebuild surfaces.
  function setActiveCamera(cam) {
    activeCamera = cam
  }

  function onResize() {
    const w = container.clientWidth
    const h = container.clientHeight
    const a = w / h
    perspectiveCamera.aspect = a
    perspectiveCamera.updateProjectionMatrix()
    orthographicCamera.left   = -ORTHO_FRUSTUM_HEIGHT * a
    orthographicCamera.right  =  ORTHO_FRUSTUM_HEIGHT * a
    orthographicCamera.top    =  ORTHO_FRUSTUM_HEIGHT
    orthographicCamera.bottom = -ORTHO_FRUSTUM_HEIGHT
    orthographicCamera.updateProjectionMatrix()
    renderer.setSize(w, h)
    // Broadcast so Echo can recompute the reference frame box
    window.dispatchEvent(new CustomEvent('scene:resize', { detail: { w, h } }))
  }

  /**
   * setCameraMode(mode: 'perspective' | 'orthographic')
   * Swap which camera the render loop uses.  Position and lookAt are
   * synced from the previous camera so the swap is visually continuous.
   * Idempotent — calling with the current mode is a no-op.
   *
   * Updates `ctx.camera` so callers reading it always see the active camera.
   */
  function setCameraMode(mode) {
    const next = mode === 'orthographic' ? orthographicCamera : perspectiveCamera
    if (next === activeCamera) return
    next.position.copy(activeCamera.position)
    next.quaternion.copy(activeCamera.quaternion)
    next.updateProjectionMatrix()
    activeCamera = next
    ctx.camera = next
  }

  window.addEventListener('resize', onResize)

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function dispose() {
    stopLoop()
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    container.removeChild(renderer.domElement)
  }

  // `ctx.camera` is mutated by setCameraMode so callers always see the
  // currently-active projection.  Position writes happen on whichever camera
  // is active — the setCameraMode swap copies position/quaternion across so
  // writes carry over.
  const ctx = {
    scene,
    renderer,
    camera: activeCamera,
    clock,
    startLoop,
    stopLoop,
    registerFrameCallback,
    unregisterFrameCallback,
    onResize,
    dispose,
    setCameraMode,
  }
  return ctx
}
