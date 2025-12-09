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
      class="relative w-full h-[68vh] min-h-[320px] sm:min-h-[360px] rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl overflow-hidden"
    >
      <div v-if="!webglSupported || renderError" class="absolute inset-0 flex items-center justify-center">
        <div class="bg-slate-950/90 border border-white/10 rounded-xl p-6 text-center space-y-3 max-w-md">
          <p class="text-lg font-semibold">Interactive renderer unavailable</p>
          <p class="text-sm text-slate-300">
            {{
              renderError
                ? 'We lost the WebGL context. Refresh to try again after closing other GPU-heavy tabs.'
                : 'Your browser does not appear to support WebGL. Tap below to learn how to enable hardware acceleration.'
            }}
          </p>
          <UButton
            as="a"
            href="https://get.webgl.org/"
            target="_blank"
            rel="noreferrer"
            icon="i-heroicons-arrow-top-right-on-square"
            color="emerald"
          >
            View WebGL help
          </UButton>
        </div>
      </div>

      <div
        v-else
        ref="container"
        class="absolute inset-0"
      ></div>

      <div
        v-if="featureFlags.debugPanel"
        class="absolute bottom-3 right-3 z-20 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-3 text-xs space-y-2 max-w-xs"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-300">Render quality</span>
          <span class="font-semibold text-emerald-200">{{ featureFlags.renderQuality }}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-300">FPS</span>
          <span class="font-mono">{{ diagnostics.fps }} </span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-300">Memory</span>
          <span class="font-mono">{{ formattedMemory }}</span>
        </div>
        <div v-if="renderError" class="text-amber-200">{{ renderError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as THREE from 'three'

import { useFeatureFlags } from '@/composables/useFeatureFlags'
import { useRuntimeDiagnostics } from '@/composables/useRuntimeDiagnostics'
import { isWebGLAvailable } from '@/utils/webglSupport'

definePageMeta({ layout: 'demo' })

const featureFlags = useFeatureFlags()
const diagnostics = useRuntimeDiagnostics(computed(() => featureFlags.value.debugPanel))

const container = ref<HTMLDivElement | null>(null)
const webglSupported = ref(true)
const renderError = ref('')

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let cube: THREE.Mesh | null = null
let animationId: number | null = null
let handleResize: (() => void) | null = null
let handleVisibility: (() => void) | null = null
let handleContextLoss: ((event: Event) => void) | null = null
let handleContextRestore: (() => void) | null = null

const formattedMemory = computed(() => {
  if (!diagnostics.memory.value) return '—'
  const mb = diagnostics.memory.value / 1024 / 1024
  return `${mb.toFixed(1)} MB`
})

const disposeScene = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
    handleResize = null
  }
  if (handleContextLoss && renderer) {
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLoss)
    renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestore || handleContextLoss)
    handleContextLoss = null
    handleContextRestore = null
  }
  if (renderer && container.value && renderer.domElement.parentNode) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
    renderer.forceContextLoss()
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
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  diagnostics.recordFrame()
  if (cube) {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const initializeScene = () => {
  if (!container.value || !webglSupported.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  renderer = new THREE.WebGLRenderer({
    antialias: featureFlags.value.renderQuality !== 'low'
  })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  if (featureFlags.value.renderQuality === 'high') {
    renderer.setPixelRatio(window.devicePixelRatio)
  } else if (featureFlags.value.renderQuality === 'medium') {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  } else {
    renderer.setPixelRatio(1)
  }

  handleContextLoss = (event: Event) => {
    event.preventDefault()
    renderError.value = 'WebGL renderer encountered an error'
    disposeScene()
  }
  handleContextRestore = () => {
    renderError.value = ''
    initializeScene()
  }

  renderer.domElement.addEventListener('webglcontextlost', handleContextLoss)
  renderer.domElement.addEventListener('webglcontextrestored', handleContextRestore)

  container.value.appendChild(renderer.domElement)

  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  handleResize = () => {
    if (!container.value || !camera || !renderer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)

  animate()
}

onMounted(async () => {
  await nextTick()
  webglSupported.value = isWebGLAvailable()
  if (!webglSupported.value) return

  initializeScene()

  handleVisibility = () => {
    if (document.hidden) {
      disposeScene()
    } else if (!animationId && !renderError.value) {
      initializeScene()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  disposeScene()
  if (handleVisibility) {
    document.removeEventListener('visibilitychange', handleVisibility)
    handleVisibility = null
  }
})
</script>

