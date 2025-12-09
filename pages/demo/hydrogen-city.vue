<template>
  <div>
    <div class="mb-4">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
    </div>
    <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
      Hydrogen City Pulse Map
    </h2>
    <div class="relative">
      <div ref="container" class="w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-lg"></div>
      
      <!-- UI Controls -->
      <div class="absolute top-4 right-4 bg-gray-900/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg min-w-[200px] z-10">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Pulse Speed: {{ pulseSpeed.toFixed(2) }}
          </label>
          <input
            v-model.number="pulseSpeed"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Glow Intensity: {{ glowIntensity.toFixed(2) }}
          </label>
          <input
            v-model.number="glowIntensity"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            class="w-full"
          />
        </div>
        <div>
          <label class="flex items-center text-sm font-medium text-gray-300">
            <input
              v-model="showVeins"
              type="checkbox"
              class="mr-2"
            />
            Show Veins
          </label>
        </div>
        <UButton @click="replayFlythrough" variant="outline" size="sm" class="w-full">
          Replay Flythrough
        </UButton>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { generateCity, updateBuildingEnergy, type Building } from '@/utils/cityGenerator'
import { generateVeins, updateVeinFlow, checkBuildingEnergized, type Vein } from '@/utils/veinGenerator'
import { CameraController } from '@/utils/cameraController'

const container = ref<HTMLDivElement | null>(null)
const pulseSpeed = ref(1.0)
const glowIntensity = ref(1.5)
const showVeins = ref(true)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let composer: EffectComposer | null = null
let cameraController: CameraController | null = null
let buildings: Building[] = []
let veins: Vein[] = []
let groundPlane: THREE.Mesh | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null

onMounted(() => {
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

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
  directionalLight.position.set(20, 30, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(200, 200)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    metalness: 0.1,
    roughness: 0.8,
    transparent: true,
    opacity: 0.7
  })
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.receiveShadow = true
  scene.add(groundPlane)

  // Generate city
  buildings = generateCity(scene, 12, 10, 4, 18)

  // Generate veins
  veins = generateVeins(scene, 10, -5)

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

  // Clock
  clock = new THREE.Clock()

  // Handle resize
  const handleResize = () => {
    if (!container.value || !camera || !renderer || !composer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    composer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', handleResize)

  // Animation loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    if (!clock || !scene || !camera || !renderer || !cameraController || !composer) return

    const time = clock.getElapsedTime()

    // Update camera
    cameraController.update(time)

    // Update veins
    for (const vein of veins) {
      updateVeinFlow(vein, time, pulseSpeed.value)
      vein.tube.visible = showVeins.value
    }

    // Check building energy from veins
    for (const building of buildings) {
      const wasEnergized = building.isEnergized
      building.isEnergized = checkBuildingEnergized(building, veins, time, pulseSpeed.value)

      if (building.isEnergized && !wasEnergized) {
        building.lastEnergizedTime = time
      }

      updateBuildingEnergy(building, time, 2)
    }

    // Apply glow intensity
    for (const building of buildings) {
      if (building.energyLevel > 0) {
        const baseIntensity = building.energyLevel * glowIntensity.value
        ;(building.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = baseIntensity * 2
        ;(building.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = baseIntensity * 0.5
      }
    }

    // Render
    composer.render()
  }
  animate()

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

watch(showVeins, (value) => {
  for (const vein of veins) {
    vein.tube.visible = value
  }
})

const replayFlythrough = () => {
  if (cameraController) {
    cameraController.replayIntro()
  }
}

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer && container.value && renderer.domElement.parentNode) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  if (composer) {
    composer.dispose()
  }
  // Clean up geometries and materials
  for (const building of buildings) {
    building.mesh.geometry.dispose()
    ;(building.mesh.material as THREE.Material).dispose()
    building.glowMesh.geometry.dispose()
    ;(building.glowMesh.material as THREE.Material).dispose()
  }
  for (const vein of veins) {
    vein.tube.geometry.dispose()
    vein.material.dispose()
  }
  if (groundPlane) {
    groundPlane.geometry.dispose()
    ;(groundPlane.material as THREE.Material).dispose()
  }
})
</script>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>

