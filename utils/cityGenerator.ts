import * as THREE from 'three'

export interface Building {
  mesh: THREE.Mesh
  glowMesh: THREE.Mesh
  position: THREE.Vector3
  isEnergized: boolean
  energyLevel: number
  lastEnergizedTime: number
  pulsePhase: number
}

export function generateCity(
  scene: THREE.Scene,
  gridSize: number = 10,
  spacing: number = 12,
  minHeight: number = 3,
  maxHeight: number = 15
): Building[] {
  const buildings: Building[] = []
  const halfSize = (gridSize * spacing) / 2

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      // Skip some cells for streets
      if (Math.random() < 0.15) continue

      const posX = -halfSize + x * spacing + (Math.random() - 0.5) * 2
      const posZ = -halfSize + z * spacing + (Math.random() - 0.5) * 2
      const height = minHeight + Math.random() * (maxHeight - minHeight)
      const width = 4 + Math.random() * 3
      const depth = 4 + Math.random() * 3

      // Main building mesh (dark)
      const geometry = new THREE.BoxGeometry(width, height, depth)
      const material = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        emissive: 0x000000,
        metalness: 0.3,
        roughness: 0.8
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(posX, height / 2, posZ)
      mesh.castShadow = true
      mesh.receiveShadow = true

      // Glow mesh (slightly larger, transparent, emissive)
      const glowGeometry = new THREE.BoxGeometry(width * 1.05, height * 1.05, depth * 1.05)
      const glowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      })
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
      glowMesh.position.copy(mesh.position)

      scene.add(mesh)
      scene.add(glowMesh)

      buildings.push({
        mesh,
        glowMesh,
        position: new THREE.Vector3(posX, height / 2, posZ),
        isEnergized: false,
        energyLevel: 0,
        lastEnergizedTime: 0,
        pulsePhase: Math.random() * Math.PI * 2
      })
    }
  }

  return buildings
}

export function updateBuildingEnergy(building: Building, time: number, decayRate: number = 2): void {
  const timeSinceEnergized = time - building.lastEnergizedTime

  if (building.isEnergized) {
    building.energyLevel = Math.min(1, building.energyLevel + 0.1)
  } else {
    building.energyLevel = Math.max(0, building.energyLevel - decayRate * 0.016)
  }

  // Update glow mesh
  const intensity = building.energyLevel
  building.glowMesh.material.opacity = intensity * 0.6
  ;(building.glowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity * 2

  // Update main mesh emissive
  ;(building.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(
    intensity > 0 ? 0x00ffff : 0x000000
  )
  ;(building.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity * 0.5
}

