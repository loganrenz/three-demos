import * as THREE from 'three'

export interface Building {
  mesh: THREE.Mesh
  glowMesh: THREE.Mesh
  windowLights: THREE.Points
  position: THREE.Vector3
  isEnergized: boolean
  energyLevel: number
  lastEnergizedTime: number
  pulsePhase: number
  scale: number
  buildingType: 'box' | 'L' | 'T'
}

function createWindowLights(
  width: number,
  height: number,
  depth: number,
  position: THREE.Vector3
): THREE.Points {
  const windowPositions: number[] = []
  const windowColors: number[] = []
  const windowSizes: number[] = []
  
  const windowSpacing = 1.5
  const windowSize = 0.3
  
  // Create windows on all four sides
  const sides = [
    { axis: 'x', offset: width / 2, dim1: depth, dim2: height },
    { axis: 'x', offset: -width / 2, dim1: depth, dim2: height },
    { axis: 'z', offset: depth / 2, dim1: width, dim2: height },
    { axis: 'z', offset: -depth / 2, dim1: width, dim2: height }
  ]
  
  for (const side of sides) {
    const count1 = Math.floor(side.dim1 / windowSpacing)
    const count2 = Math.floor(side.dim2 / windowSpacing)
    
    for (let i = 0; i < count1; i++) {
      for (let j = 0; j < count2; j++) {
        // Randomly light some windows
        if (Math.random() > 0.7) {
          const offset1 = (i - count1 / 2) * windowSpacing
          const offset2 = (j - count2 / 2) * windowSpacing + position.y - height / 2
          
          let x = position.x
          let y = offset2
          let z = position.z
          
          if (side.axis === 'x') {
            x = position.x + side.offset
            z = position.z + offset1
          } else {
            z = position.z + side.offset
            x = position.x + offset1
          }
          
          windowPositions.push(x, y, z)
          
          // Random warm window colors
          const brightness = 0.3 + Math.random() * 0.7
          windowColors.push(
            brightness * 1.0,
            brightness * 0.8,
            brightness * 0.4,
            1.0
          )
          windowSizes.push(windowSize * (0.8 + Math.random() * 0.4))
        }
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(windowPositions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(windowColors, 4))
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(windowSizes, 1))
  
  const material = new THREE.PointsMaterial({
    size: windowSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
  
  return new THREE.Points(geometry, material)
}

function createBuildingGeometry(
  type: 'box' | 'L' | 'T',
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  if (type === 'box') {
    return new THREE.BoxGeometry(width, height, depth)
  }
  
  // For L and T shapes, create a group or use a single geometry
  // For simplicity, we'll use box geometry but could enhance later
  return new THREE.BoxGeometry(width, height, depth)
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
      
      // Random building type
      const buildingType = Math.random() < 0.7 ? 'box' : (Math.random() < 0.5 ? 'L' : 'T')

      // Main building mesh (dark)
      const geometry = createBuildingGeometry(buildingType, width, height, depth)
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
      
      // Window lights
      const windowLights = createWindowLights(width, height, depth, new THREE.Vector3(posX, height / 2, posZ))

      scene.add(mesh)
      scene.add(glowMesh)
      scene.add(windowLights)

      buildings.push({
        mesh,
        glowMesh,
        windowLights,
        position: new THREE.Vector3(posX, height / 2, posZ),
        isEnergized: false,
        energyLevel: 0,
        lastEnergizedTime: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        scale: 1.0,
        buildingType
      })
    }
  }

  return buildings
}

export function updateBuildingEnergy(
  building: Building,
  time: number,
  decayRate: number = 2,
  nearbyBuildings?: Building[]
): void {
  const timeSinceEnergized = time - building.lastEnergizedTime

  if (building.isEnergized) {
    building.energyLevel = Math.min(1, building.energyLevel + 0.1)
  } else {
    building.energyLevel = Math.max(0, building.energyLevel - decayRate * 0.016)
  }
  
  // Energy cascade: nearby energized buildings give small boost
  if (nearbyBuildings && building.energyLevel < 1) {
    for (const nearby of nearbyBuildings) {
      if (nearby.isEnergized && nearby !== building) {
        const distance = building.position.distanceTo(nearby.position)
        if (distance < 15) {
          const cascadeBoost = (1 - distance / 15) * 0.05 * nearby.energyLevel
          building.energyLevel = Math.min(1, building.energyLevel + cascadeBoost)
        }
      }
    }
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
  
  // Breathing animation when energized
  const breathingScale = 1.0 + Math.sin(time * 2 + building.pulsePhase) * 0.02 * intensity
  building.scale = breathingScale
  building.mesh.scale.setScalar(breathingScale)
  building.glowMesh.scale.setScalar(breathingScale)
  
  // Update window lights intensity
  if (building.windowLights) {
    const windowMaterial = building.windowLights.material as THREE.PointsMaterial
    const baseOpacity = 0.3 + intensity * 0.5
    windowMaterial.opacity = baseOpacity
    
    // Make windows pulse with energy
    const windowPulse = 1.0 + Math.sin(time * 3 + building.pulsePhase) * 0.2 * intensity
    windowMaterial.size = 0.3 * windowPulse
  }
}

