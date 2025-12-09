<template>
  <div>
    <div class="mb-4">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
    </div>
    <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
      Procedural Forest with Dynamic Weather
    </h2>
    <div class="relative">
      <div ref="container" class="w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-lg"></div>
      
      <!-- UI Controls -->
      <div class="absolute top-4 right-4 bg-gray-900/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg min-w-[250px] z-10 max-h-[90vh] overflow-y-auto">
        <div class="space-y-4">
          <!-- Weather Controls -->
          <div class="border-b border-gray-700 pb-3">
            <h3 class="text-sm font-semibold text-green-400 mb-2">Weather</h3>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-300 mb-1">
                  Rain Intensity: {{ rainIntensity.toFixed(0) }}
                </label>
                <input
                  v-model.number="rainIntensity"
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  class="w-full"
                  @input="updateRainIntensity"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-300 mb-1">
                  Fog Density: {{ fogDensity.toFixed(2) }}
                </label>
                <input
                  v-model.number="fogDensity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  class="w-full"
                />
              </div>
              <div>
                <label class="flex items-center text-sm text-gray-300">
                  <input
                    v-model="showLeaves"
                    type="checkbox"
                    class="mr-2"
                  />
                  Falling Leaves
                </label>
              </div>
            </div>
          </div>
          
          <!-- Wind Controls -->
          <div class="border-b border-gray-700 pb-3">
            <h3 class="text-sm font-semibold text-green-400 mb-2">Wind</h3>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-300 mb-1">
                  Wind Speed: {{ windSpeed.toFixed(2) }}
                </label>
                <input
                  v-model.number="windSpeed"
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-300 mb-1">
                  Wind Strength: {{ windStrength.toFixed(2) }}
                </label>
                <input
                  v-model.number="windStrength"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full"
                />
              </div>
            </div>
          </div>
          
          <!-- Time of Day -->
          <div class="border-b border-gray-700 pb-3">
            <h3 class="text-sm font-semibold text-green-400 mb-2">Time of Day</h3>
            <div>
              <label class="block text-xs text-gray-300 mb-1">
                Time: {{ timeOfDay.toFixed(2) }}
              </label>
              <input
                v-model.number="timeOfDay"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>Dawn</span>
                <span>Noon</span>
                <span>Dusk</span>
                <span>Night</span>
              </div>
            </div>
            <div class="mt-2">
              <label class="flex items-center text-sm text-gray-300">
                <input
                  v-model="autoTime"
                  type="checkbox"
                  class="mr-2"
                />
                Auto Cycle
              </label>
            </div>
          </div>
          
          <!-- Camera Presets -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Camera Presets
            </label>
            <div class="grid grid-cols-2 gap-2">
              <UButton 
                @click="jumpToCameraPreset(0)" 
                variant="ghost" 
                size="xs"
              >
                Overview
              </UButton>
              <UButton 
                @click="jumpToCameraPreset(1)" 
                variant="ghost" 
                size="xs"
              >
                Close Up
              </UButton>
              <UButton 
                @click="jumpToCameraPreset(2)" 
                variant="ghost" 
                size="xs"
              >
                Ground Level
              </UButton>
              <UButton 
                @click="jumpToCameraPreset(3)" 
                variant="ghost" 
                size="xs"
              >
                Canopy View
              </UButton>
            </div>
          </div>
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
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { generateForest, updateTreeWind, type Tree } from '@/utils/forestGenerator'
import {
  createRainSystem,
  updateRain,
  createFog,
  updateFog,
  createLeafParticles,
  updateLeafParticles
} from '@/utils/weatherSystem'

const container = ref<HTMLDivElement | null>(null)
const rainIntensity = ref(500)
const fogDensity = ref(0.3)
const showLeaves = ref(true)
const windSpeed = ref(1.0)
const windStrength = ref(0.8)
const timeOfDay = ref(0.5)
const autoTime = ref(false)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let composer: EffectComposer | null = null
let controls: OrbitControls | null = null
let trees: Tree[] = []
let rainParticles: THREE.Points | null = null
let fogMesh: THREE.Mesh | null = null
let leafSystem: ReturnType<typeof createLeafParticles> | null = null
let terrain: THREE.Mesh | null = null
let directionalLight: THREE.DirectionalLight | null = null
let ambientLight: THREE.AmbientLight | null = null
let skyMesh: THREE.Mesh | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null
let handleResize: (() => void) | null = null

const cameraPresets = [
  { position: new THREE.Vector3(40, 30, 40), target: new THREE.Vector3(0, 5, 0), name: 'Overview' },
  { position: new THREE.Vector3(10, 8, 10), target: new THREE.Vector3(0, 4, 0), name: 'Close Up' },
  { position: new THREE.Vector3(5, 2, 5), target: new THREE.Vector3(10, 3, 10), name: 'Ground Level' },
  { position: new THREE.Vector3(0, 15, 0), target: new THREE.Vector3(0, 12, 10), name: 'Canopy View' }
]

function jumpToCameraPreset(index: number) {
  if (index >= 0 && index < cameraPresets.length && camera && controls) {
    const preset = cameraPresets[index]
    camera.position.copy(preset.position)
    controls.target.copy(preset.target)
    controls.update()
  }
}

function updateRainIntensity() {
  if (!scene || !rainParticles) return
  
  scene.remove(rainParticles)
  rainParticles.geometry.dispose()
  if (rainParticles.material instanceof THREE.Material) {
    rainParticles.material.dispose()
  }
  
  rainParticles = createRainSystem(scene, 80, rainIntensity.value)
}

function updateSkyColor(time: number): THREE.Color {
  // time: 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = night
  const t = time % 1
  
  if (t < 0.25) {
    // Dawn: orange to blue
    const ratio = t / 0.25
    return new THREE.Color().lerpColors(
      new THREE.Color(0xff6b35),
      new THREE.Color(0x87ceeb),
      ratio
    )
  } else if (t < 0.5) {
    // Day: blue
    return new THREE.Color(0x87ceeb)
  } else if (t < 0.75) {
    // Dusk: blue to orange to dark
    const ratio = (t - 0.5) / 0.25
    if (ratio < 0.5) {
      return new THREE.Color().lerpColors(
        new THREE.Color(0x87ceeb),
        new THREE.Color(0xff6b35),
        ratio * 2
      )
    } else {
      return new THREE.Color().lerpColors(
        new THREE.Color(0xff6b35),
        new THREE.Color(0x1a1a2a),
        (ratio - 0.5) * 2
      )
    }
  } else {
    // Night: dark blue/purple
    const ratio = (t - 0.75) / 0.25
    return new THREE.Color().lerpColors(
      new THREE.Color(0x1a1a2a),
      new THREE.Color(0x0a0a1a),
      ratio
    )
  }
}

function updateLighting(time: number) {
  if (!directionalLight || !ambientLight || !scene) return
  
  const skyColor = updateSkyColor(time)
  scene.background = skyColor.clone()
  scene.fog = new THREE.Fog(skyColor.clone().multiplyScalar(0.3), 20, 100)
  
  // Sun position
  const sunAngle = time * Math.PI * 2 - Math.PI / 2
  const sunHeight = Math.sin(sunAngle)
  const sunDistance = 50
  
  directionalLight.position.set(
    Math.cos(sunAngle) * sunDistance,
    Math.max(0, sunHeight * sunDistance),
    Math.sin(sunAngle) * sunDistance
  )
  
  // Light intensity based on time
  const intensity = Math.max(0.1, Math.min(1, (sunHeight + 1) / 2))
  directionalLight.intensity = intensity * 0.8
  directionalLight.color = new THREE.Color().lerpColors(
    new THREE.Color(0xffffff),
    new THREE.Color(0xffa500),
    time < 0.25 || time > 0.5 ? 0.3 : 0
  )
  
  ambientLight.intensity = intensity * 0.3
  
  // Update sky mesh
  if (skyMesh && skyMesh.material instanceof THREE.MeshBasicMaterial) {
    skyMesh.material.color.copy(skyColor)
  }
}

onMounted(() => {
  if (!container.value) return

  // Scene setup
  scene = new THREE.Scene()
  const skyColor = updateSkyColor(timeOfDay.value)
  scene.background = skyColor
  scene.fog = new THREE.Fog(skyColor.clone().multiplyScalar(0.3), 20, 100)

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(40, 30, 40)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 10
  controls.maxDistance = 150
  controls.target.set(0, 5, 0)
  controls.update()

  // Lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(30, 40, 20)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 200
  directionalLight.shadow.camera.left = -60
  directionalLight.shadow.camera.right = 60
  directionalLight.shadow.camera.top = 60
  directionalLight.shadow.camera.bottom = -60
  scene.add(directionalLight)

  // Sky dome
  const skyGeometry = new THREE.SphereGeometry(200, 32, 16)
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: skyColor,
    side: THREE.BackSide,
    fog: false
  })
  skyMesh = new THREE.Mesh(skyGeometry, skyMaterial)
  scene.add(skyMesh)

  // Terrain
  const terrainGeometry = new THREE.PlaneGeometry(150, 150, 50, 50)
  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5016,
    roughness: 0.9,
    metalness: 0.1
  })
  
  // Slight terrain variation
  const positions = terrainGeometry.attributes.position.array as Float32Array
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const z = positions[i + 2]
    positions[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5
  }
  terrainGeometry.attributes.position.needsUpdate = true
  terrainGeometry.computeVertexNormals()
  
  terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
  terrain.rotation.x = -Math.PI / 2
  terrain.receiveShadow = true
  scene.add(terrain)

  // Generate forest
  trees = generateForest(scene, 80, 120, 4, 12)

  // Weather systems
  rainParticles = createRainSystem(scene, 80, rainIntensity.value)
  fogMesh = createFog(scene, 80, 3)
  leafSystem = createLeafParticles(scene, 150, 80)

  // Postprocessing
  composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.value.clientWidth, container.value.clientHeight),
    0.5,
    0.4,
    0.85
  )
  composer.addPass(bloomPass)

  const outputPass = new OutputPass()
  composer.addPass(outputPass)

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
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    if (!clock || !scene || !camera || !renderer || !composer || !controls) return

    const elapsed = clock.getElapsedTime()
    const delta = clock.getDelta()

    // Auto time progression
    if (autoTime.value) {
      timeOfDay.value = (timeOfDay.value + delta * 0.02) % 1
    }

    // Update lighting
    updateLighting(timeOfDay.value)

    // Update controls
    controls.update()

    // Update trees with wind
    for (const tree of trees) {
      updateTreeWind(tree, elapsed, windSpeed.value, windStrength.value)
    }

    // Update weather
    if (rainParticles && rainIntensity.value > 0) {
      updateRain(rainParticles, 80, windStrength.value)
      rainParticles.visible = true
    } else if (rainParticles) {
      rainParticles.visible = false
    }

    if (fogMesh) {
      updateFog(fogMesh, elapsed, windStrength.value)
      if (fogMesh.material instanceof THREE.MeshStandardMaterial) {
        fogMesh.material.opacity = fogDensity.value
      }
    }

    if (leafSystem && showLeaves.value) {
      updateLeafParticles(leafSystem, elapsed, windStrength.value, 80)
      leafSystem.particles.visible = true
    } else if (leafSystem) {
      leafSystem.particles.visible = false
    }

    // Render
    composer.render()
  }
  animate()
})

watch(timeOfDay, (value) => {
  updateLighting(value)
})

onUnmounted(() => {
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }
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
  
  // Cleanup
  for (const tree of trees) {
    tree.trunk.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose()
        }
      }
    })
    tree.leaves.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose()
        }
      }
    })
  }
  
  if (rainParticles) {
    rainParticles.geometry.dispose()
    if (rainParticles.material instanceof THREE.Material) {
      rainParticles.material.dispose()
    }
  }
  
  if (fogMesh) {
    fogMesh.geometry.dispose()
    if (fogMesh.material instanceof THREE.Material) {
      fogMesh.material.dispose()
    }
  }
  
  if (leafSystem) {
    leafSystem.particles.geometry.dispose()
    if (leafSystem.particles.material instanceof THREE.Material) {
      leafSystem.particles.material.dispose()
    }
  }
  
  if (terrain) {
    terrain.geometry.dispose()
    if (terrain.material instanceof THREE.Material) {
      terrain.material.dispose()
    }
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
  background: #22c55e;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #22c55e;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>

