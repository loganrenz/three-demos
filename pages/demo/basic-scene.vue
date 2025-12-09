<template>
  <div class="mx-auto max-w-5xl space-y-4 text-white">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Starter</p>
        <h2 class="text-2xl font-semibold">Basic Scene</h2>
        <p class="text-sm text-slate-400">Tap, rotate, and pinch — the cube fills the view on mobile.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
        <span>Live render</span>
      </div>
    </div>

    <div
      ref="container"
      class="w-full h-[68vh] min-h-[320px] sm:min-h-[360px] rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl overflow-hidden"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'

definePageMeta({ layout: 'demo' })

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let cube: THREE.Mesh | null = null
let animationId: number | null = null
let handleResize: (() => void) | null = null

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // Cube
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  // Handle resize
  handleResize = () => {
    if (!container.value || !camera || !renderer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    if (cube) {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
    handleResize = null
  }
  if (renderer && container.value && renderer.domElement.parentNode) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
    renderer = null
  }
  if (cube) {
    cube.geometry.dispose()
    if (cube.material instanceof THREE.Material) {
      cube.material.dispose()
    }
    cube = null
  }
  scene = null
  camera = null
})
</script>

