<template>
  <div class="mx-auto max-w-6xl space-y-4 text-white">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-cyan-300/80">City pulse</p>
        <h2 class="text-2xl font-semibold">Hydrogen City Pulse Map</h2>
        <p class="text-sm text-slate-400">Built for touch: orbit, pinch, and dive into the grid without scrolling.</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-200">
        <span class="rounded-full bg-cyan-500/20 px-3 py-1 border border-cyan-500/40">Interactive</span>
        <span class="rounded-full bg-white/5 px-3 py-1 border border-white/10">No scroll UI</span>
      </div>
    </div>

    <div class="relative rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl h-[72vh] min-h-[360px] sm:min-h-[420px] overflow-hidden">
      <div ref="container" class="absolute inset-0"></div>

      <button
        @click="showControls = !showControls"
        class="absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-slate-900/90 backdrop-blur transition hover:bg-slate-800/90 md:top-4 md:right-4"
        aria-label="Toggle controls"
      >
        <span class="text-lg">{{ showControls ? '×' : '⚙' }}</span>
      </button>

      <div
        v-show="showControls"
        class="absolute inset-x-3 bottom-3 z-10 grid gap-3 rounded-xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur md:inset-auto md:top-4 md:right-4 md:w-72 md:p-4"
      >
        <div class="flex items-center justify-between text-sm">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Energy</p>
            <p class="font-semibold">{{ totalEnergy.toFixed(1) }}</p>
          </div>
          <div class="text-right text-xs text-slate-300">
            <p>Active: {{ activeBuildings }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs text-slate-200">
          <label class="space-y-1">
            <span class="flex items-center justify-between">Time <span>{{ timeScale.toFixed(2) }}x</span></span>
            <input v-model.number="timeScale" type="range" min="0" max="3" step="0.1" />
          </label>
          <label class="space-y-1">
            <span class="flex items-center justify-between">Pulse <span>{{ pulseSpeed.toFixed(1) }}</span></span>
            <input v-model.number="pulseSpeed" type="range" min="0.5" max="3" step="0.1" />
          </label>
          <label class="space-y-1">
            <span class="flex items-center justify-between">Glow <span>{{ glowIntensity.toFixed(1) }}</span></span>
            <input v-model.number="glowIntensity" type="range" min="0.5" max="3" step="0.1" />
          </label>
          <label class="space-y-1">
            <span class="flex items-center justify-between">View</span>
            <select
              v-model="visualizationMode"
              @change="onViewModeChange"
              class="w-full rounded-md bg-slate-800/70 px-2 py-1 text-[13px]"
            >
              <option value="normal">Normal</option>
              <option value="underground">Underground</option>
              <option value="heatmap">Heat Map</option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <UButton @click="isPaused = !isPaused" :variant="isPaused ? 'solid' : 'outline'" size="xs" class="w-full min-h-[44px]">
            {{ isPaused ? 'Play' : 'Pause' }}
          </UButton>
          <UButton @click="timeScale = 1.0" variant="ghost" size="xs" class="w-full min-h-[44px]">Reset</UButton>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <label class="flex items-center gap-2 text-slate-200 min-h-[44px]">
            <input v-model="showVeins" type="checkbox" class="accent-cyan-400 w-5 h-5" />
            <span>Show veins</span>
          </label>
          <UButton @click="replayFlythrough" variant="outline" size="xs" class="w-full min-h-[44px]">Flythrough</UButton>
        </div>

        <div class="flex flex-wrap gap-2 text-xs text-slate-200">
          <UButton
            v-for="(preset, index) in cameraPresets"
            :key="preset?.name ?? index"
            v-if="preset && preset.name"
            @click="jumpToCameraPreset(index)"
            variant="ghost"
            size="xs"
            class="flex-1 min-h-[44px]"
          >
            {{ preset.name }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'

definePageMeta({ layout: 'demo' })
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { generateCity, updateBuildingEnergy, type Building } from '@/utils/cityGenerator'
import { generateVeins, updateVeinFlow, checkBuildingEnergized, type Vein } from '@/utils/veinGenerator'
import { CameraController } from '@/utils/cameraController'
import { createVeinParticles, createBuildingSparks, updateVeinParticles, type ParticleSystem } from '@/utils/particleSystem'

const container = ref<HTMLDivElement | null>(null)
const showControls = ref(false)
const pulseSpeed = ref(1.0)
const glowIntensity = ref(1.5)
const showVeins = ref(true)
const timeScale = ref(1.0)
const isPaused = ref(false)
const visualizationMode = ref('normal')
const totalEnergy = ref(0)
const activeBuildings = ref(0)
const cameraPresets = ref<Array<{ position: THREE.Vector3; target: THREE.Vector3; name: string }>>([])

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let composer: EffectComposer | null = null
let cameraController: CameraController | null = null
let buildings: Building[] = []
let veins: Vein[] = []
let veinParticles: ParticleSystem[] = []
let buildingSparks: THREE.Points[] = []
let groundPlane: THREE.Mesh | null = null
let groundGrid: THREE.LineSegments | null = null
let energyRipples: THREE.Mesh[] = []
let animationId: number | null = null
let clock: THREE.Clock | null = null
let handleResize: (() => void) | null = null

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  // Scene setup
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)
  scene.fog = new THREE.Fog(0x0a0a1a, 50, 200)

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  // Camera controller
  cameraController = new CameraController(camera, renderer)
  cameraController.setupControls(renderer)
  if (cameraController) {
    cameraPresets.value = cameraController.getPresets()
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
  directionalLight.position.set(20, 30, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Enhanced ground plane with grid
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    metalness: 0.1,
    roughness: 0.8,
    transparent: true,
    opacity: 0.4
  })
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.receiveShadow = true
  scene.add(groundPlane)
  
  // Grid lines on ground
  groundGrid = new THREE.GridHelper(200, 20, 0x00ffff, 0x003333) as unknown as THREE.LineSegments
  groundGrid.position.y = 0.01
  scene.add(groundGrid)
  
  // Energy bleed-through spots (will be updated dynamically)
  const bleedGeometry = new THREE.PlaneGeometry(10, 10, 1, 1)
  const bleedMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  })
  
  // Create multiple bleed spots
  for (let i = 0; i < 20; i++) {
    const bleed = new THREE.Mesh(bleedGeometry, bleedMaterial.clone())
    bleed.rotation.x = -Math.PI / 2
    bleed.position.set(
      (Math.random() - 0.5) * 180,
      0.02,
      (Math.random() - 0.5) * 180
    )
    scene.add(bleed)
    energyRipples.push(bleed)
  }

  // Generate city
  buildings = generateCity(scene, 12, 10, 4, 18)

  // Generate veins
  veins = generateVeins(scene, 10, -5)
  
  // Create particle systems for veins
  for (const vein of veins) {
    if (!vein || !vein.curve) continue
    try {
      const particles = createVeinParticles(vein, 50)
      scene.add(particles.points)
      veinParticles.push(particles)
    } catch (e) {
      // Skip if particle creation fails
    }
  }

  // Postprocessing
  composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.value.clientWidth, container.value.clientHeight),
    1.5,
    0.4,
    0.85
  )
  composer.addPass(bloomPass)
  
  // Chromatic Aberration
  const chromaticAberrationShader = {
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: 0.003 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float amount;
      varying vec2 vUv;
      void main() {
        vec2 offset = amount * vec2(cos(vUv.y * 3.14159), sin(vUv.x * 3.14159));
        vec4 cr = texture2D(tDiffuse, vUv + offset);
        vec4 cga = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - offset);
        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
      }
    `
  }
  const chromaticPass = new ShaderPass(chromaticAberrationShader)
  chromaticPass.renderToScreen = false
  composer.addPass(chromaticPass)
  
  // Color Grading / Output
  const outputPass = new OutputPass()
  composer.addPass(outputPass)

  // Clock
  clock = new THREE.Clock()

  // Handle resize
  handleResize = () => {
    if (!container.value || !camera || !renderer || !composer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    composer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)

  // Animation loop
  let lastFrameTime = 0
  let animationTime = 0
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    if (!clock || !scene || !camera || !renderer || !cameraController || !composer) return

    const currentTime = clock.getElapsedTime()
    const deltaTime = isPaused.value ? 0 : (currentTime - lastFrameTime) * timeScale.value
    if (!isPaused.value) {
      animationTime += deltaTime
    }
    const time = animationTime
    lastFrameTime = currentTime

    try {
      // Update camera
      if (cameraController) {
        cameraController.update(time)
      }

      // Update veins
      for (let i = 0; i < veins.length; i++) {
        const vein = veins[i]
        if (!vein || !vein.tube || !vein.material || !vein.curve) continue
        
        try {
          updateVeinFlow(vein, time, pulseSpeed.value)
          vein.tube.visible = showVeins.value || visualizationMode.value === 'underground'
          
          // Update shader material time uniform
          if (vein.material instanceof THREE.ShaderMaterial) {
            vein.material.uniforms.time.value = time * pulseSpeed.value
          }
          
          // Update vein particles
          if (veinParticles[i] && vein.curve) {
            updateVeinParticles(veinParticles[i], vein, time, pulseSpeed.value)
            veinParticles[i].points.visible = showVeins.value || visualizationMode.value === 'underground'
          }
        } catch (e) {
          // Skip this vein if there's an error
        }
      }
    
    // Update building sparks
    for (const sparks of buildingSparks) {
      const sparkTime = time % 2
      const colors = sparks.geometry.attributes.color.array as Float32Array
      const opacity = Math.max(0, 1 - sparkTime)
      for (let i = 0; i < colors.length / 3; i++) {
        colors[i * 3 + 1] = opacity
        colors[i * 3 + 2] = opacity
      }
      sparks.geometry.attributes.color.needsUpdate = true
    }

      // Check building energy from veins
      let totalEnergyValue = 0
      let activeCount = 0
      for (const building of buildings) {
        if (!building || !building.position) continue
        
        try {
          const wasEnergized = building.isEnergized
          building.isEnergized = checkBuildingEnergized(building, veins, time, pulseSpeed.value)

          if (building.isEnergized && !wasEnergized) {
            building.lastEnergizedTime = time
            // Create energy ripple
            if (scene && building.position && typeof building.position.x === 'number' && typeof building.position.z === 'number') {
              createEnergyRipple(building.position.x, building.position.z, time)
            }
            // Create building sparks
            if (building.position && scene && typeof building.position.x === 'number' && typeof building.position.z === 'number') {
              const sparks = createBuildingSparks(building.position, 15)
              scene.add(sparks)
              buildingSparks.push(sparks)
              // Remove sparks after animation
              setTimeout(() => {
                if (scene) {
                  scene.remove(sparks)
                  sparks.geometry.dispose()
                  ;(sparks.material as THREE.Material).dispose()
                  const index = buildingSparks.indexOf(sparks)
                  if (index > -1) buildingSparks.splice(index, 1)
                }
              }, 2000)
            }
          }

          updateBuildingEnergy(building, time, 2, buildings)
          totalEnergyValue += building.energyLevel
          if (building.energyLevel > 0.1) activeCount++
        } catch (e) {
          // Skip this building if there's an error
        }
      }
      // Update energy ripples
      updateEnergyRipples(time)

      // Update energy bleed-through on ground
      updateEnergyBleedThrough(time)

      // Apply glow intensity
      for (const building of buildings) {
        if (building && building.energyLevel > 0 && building.glowMesh && building.mesh) {
          try {
            const baseIntensity = building.energyLevel * glowIntensity.value
            ;(building.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = baseIntensity * 2
            ;(building.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = baseIntensity * 0.5
          } catch (e) {
            // Skip if error
          }
        }
      }

      totalEnergy.value = totalEnergyValue
      activeBuildings.value = activeCount
    } catch (e) {
      // Prevent animation loop from crashing
    }

    // Render
    composer.render()
  }
  animate()
  
  function createEnergyRipple(x: number, z: number, time: number): void {
    const rippleGeometry = new THREE.RingGeometry(0, 1, 32)
    const rippleMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial)
    ripple.rotation.x = -Math.PI / 2
    ripple.position.set(x, 0.05, z)
    ripple.userData = { startTime: time, maxRadius: 15 }
    scene.add(ripple)
    
    // Remove after animation
    setTimeout(() => {
      scene.remove(ripple)
      ripple.geometry.dispose()
      ;(ripple.material as THREE.Material).dispose()
    }, 2000)
  }
  
  function updateEnergyRipples(time: number): void {
    if (!scene) return
    scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.userData.startTime !== undefined) {
        const elapsed = time - child.userData.startTime
        const progress = Math.min(1, elapsed / 2)
        const scale = progress * child.userData.maxRadius
        child.scale.setScalar(scale)
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = 0.8 * (1 - progress)
        }
      }
    })
  }
  
  function updateEnergyBleedThrough(time: number): void {
    for (let i = 0; i < energyRipples.length; i++) {
      const ripple = energyRipples[i]
      if (!ripple || !ripple.position || typeof ripple.position.x !== 'number' || typeof ripple.position.z !== 'number') continue
      
      // Find nearest vein and check if it's active
      let nearestDistance = Infinity
      let nearestIntensity = 0
      
      for (const vein of veins) {
        if (!vein?.curve) continue
        const points = vein.curve.getPoints(64)
        if (!points || points.length === 0) continue
        
        for (let idx = 0; idx < points.length; idx++) {
          const point = points[idx]
          if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') continue
          
          const distance = Math.sqrt(
            Math.pow(point.x - ripple.position.x, 2) + Math.pow(point.z - ripple.position.z, 2)
          )
          if (distance < nearestDistance) {
            nearestDistance = distance
            // Check if this point is active
            const t = idx / points.length
            const wavePosition = ((time * vein.speed * pulseSpeed.value + vein.phase) % 12) - 1
            const waveDistance = Math.abs(t * 10 - wavePosition)
            if (waveDistance < 1.5) {
              nearestIntensity = Math.max(0, 1 - waveDistance / 1.5)
            }
          }
        }
      }
      
      const opacity = Math.max(0, nearestIntensity * 0.3 * (1 - nearestDistance / 20))
      ;(ripple.material as THREE.MeshStandardMaterial).opacity = opacity
      ;(ripple.material as THREE.MeshStandardMaterial).emissiveIntensity = nearestIntensity
    }
  }

})

watch(showVeins, (value) => {
  if (!veins || veins.length === 0) return
  for (const vein of veins) {
    if (vein && vein.tube) {
      vein.tube.visible = value || visualizationMode.value === 'underground'
    }
  }
  for (const particleSystem of veinParticles) {
    if (particleSystem && particleSystem.points) {
      particleSystem.points.visible = value || visualizationMode.value === 'underground'
    }
  }
})

watch(visualizationMode, (value) => {
  onViewModeChange()
})

function replayFlythrough() {
  if (cameraController) {
    cameraController.replayIntro()
  }
}

function jumpToCameraPreset(index: number) {
  if (cameraController) {
    cameraController.jumpToPreset(index)
  }
}

function onViewModeChange() {
  if (cameraController && visualizationMode.value === 'underground') {
    if (!cameraController.undergroundView) {
      cameraController.toggleUndergroundView()
    }
  } else if (cameraController && visualizationMode.value !== 'underground' && cameraController.undergroundView) {
    cameraController.toggleUndergroundView()
  }
}

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
  if (composer) {
    composer.dispose()
    composer = null
  }
  if (cameraController) {
    cameraController = null
  }
  if (clock) {
    clock = null
  }
  
  // Clean up geometries and materials
  if (scene) {
    for (const building of buildings) {
      if (building.mesh) {
        scene.remove(building.mesh)
        building.mesh.geometry.dispose()
        ;(building.mesh.material as THREE.Material).dispose()
      }
      if (building.glowMesh) {
        scene.remove(building.glowMesh)
        building.glowMesh.geometry.dispose()
        ;(building.glowMesh.material as THREE.Material).dispose()
      }
      if (building.windowLights) {
        scene.remove(building.windowLights)
        building.windowLights.geometry.dispose()
        ;(building.windowLights.material as THREE.Material).dispose()
      }
    }
    buildings = []
    
    for (const vein of veins) {
      if (vein.tube) {
        scene.remove(vein.tube)
        vein.tube.geometry.dispose()
        vein.material.dispose()
      }
    }
    veins = []
    
    for (const particleSystem of veinParticles) {
      if (particleSystem.points) {
        scene.remove(particleSystem.points)
        particleSystem.points.geometry.dispose()
        ;(particleSystem.points.material as THREE.Material).dispose()
      }
    }
    veinParticles = []
    
    for (const sparks of buildingSparks) {
      scene.remove(sparks)
      sparks.geometry.dispose()
      ;(sparks.material as THREE.Material).dispose()
    }
    buildingSparks = []
    
    if (groundPlane) {
      scene.remove(groundPlane)
      groundPlane.geometry.dispose()
      ;(groundPlane.material as THREE.Material).dispose()
      groundPlane = null
    }
    if (groundGrid) {
      scene.remove(groundGrid)
      groundGrid = null
    }
    for (const ripple of energyRipples) {
      scene.remove(ripple)
      ripple.geometry.dispose()
      ;(ripple.material as THREE.Material).dispose()
    }
    energyRipples = []
  }
  
  scene = null
  camera = null
})
</script>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  outline: none;
  touch-action: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  touch-action: none;
}

input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  touch-action: none;
  border: none;
}
</style>

