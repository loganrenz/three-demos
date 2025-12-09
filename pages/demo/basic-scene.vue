<template>
  <div>
    <div class="mb-4">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
    </div>
    <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
      Basic Scene
    </h2>
    <div ref="container" class="w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-lg"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let cube: THREE.Mesh | null = null
let animationId: number | null = null

onMounted(() => {
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
  const handleResize = () => {
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

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer && container.value) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  if (cube) {
    cube.geometry.dispose()
    if (cube.material instanceof THREE.Material) {
      cube.material.dispose()
    }
  }
})
</script>

