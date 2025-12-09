import * as THREE from 'three'

export interface ParticleSystem {
  points: THREE.Points
  positions: Float32Array
  velocities: Float32Array
  lifetimes: Float32Array
  maxLifetime: number
  count: number
}

export function createVeinParticles(
  vein: { curve: THREE.CatmullRomCurve3 },
  count: number = 100
): ParticleSystem {
  if (!vein?.curve) {
    throw new Error('Vein curve is required')
  }
  
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const lifetimes = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const point = vein.curve.getPointAt(t)
    if (!point) continue
    
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
    
    // Random velocity along curve
    const speed = 0.5 + Math.random() * 0.5
    velocities[i * 3] = (Math.random() - 0.5) * speed
    velocities[i * 3 + 1] = (Math.random() - 0.5) * speed * 0.3
    velocities[i * 3 + 2] = (Math.random() - 0.5) * speed
    
    lifetimes[i] = Math.random()
    
    // Cyan color
    colors[i * 3] = 0.0
    colors[i * 3 + 1] = 1.0
    colors[i * 3 + 2] = 1.0
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
  
  const points = new THREE.Points(geometry, material)
  
  return {
    points,
    positions,
    velocities,
    lifetimes,
    maxLifetime: 5,
    count
  }
}

export function createBuildingSparks(
  position: THREE.Vector3,
  count: number = 20
): THREE.Points {
  if (!position || typeof position.x !== 'number') {
    throw new Error('Valid position is required')
  }
  
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    const radius = Math.random() * 2
    const height = Math.random() * 3
    
    positions[i * 3] = position.x + Math.cos(angle) * radius
    positions[i * 3 + 1] = position.y + height
    positions[i * 3 + 2] = position.z + Math.sin(angle) * radius
    
    velocities[i * 3] = Math.cos(angle) * 0.5
    velocities[i * 3 + 1] = 0.5 + Math.random() * 0.5
    velocities[i * 3 + 2] = Math.sin(angle) * 0.5
    
    const brightness = 0.7 + Math.random() * 0.3
    colors[i * 3] = brightness * 0.0
    colors[i * 3 + 1] = brightness * 1.0
    colors[i * 3 + 2] = brightness * 1.0
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  })
  
  return new THREE.Points(geometry, material)
}

export function updateVeinParticles(
  system: ParticleSystem,
  vein: { curve: THREE.CatmullRomCurve3 },
  time: number,
  speed: number = 1
): void {
  if (!vein?.curve) return
  
  const positions = system.positions
  const velocities = system.velocities
  const lifetimes = system.lifetimes
  
  for (let i = 0; i < system.count; i++) {
    lifetimes[i] += 0.016 * speed
    
    if (lifetimes[i] > system.maxLifetime) {
      // Reset particle
      const t = Math.random()
      const point = vein.curve.getPointAt(t)
      if (!point) continue
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      lifetimes[i] = 0
    } else {
      // Update position along curve
      const t = (lifetimes[i] / system.maxLifetime) % 1
      const point = vein.curve.getPointAt(t)
      if (!point) continue
      
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    }
  }
  
  system.points.geometry.attributes.position.needsUpdate = true
}

export function updateBuildingSparks(
  sparks: THREE.Points,
  velocities: Float32Array,
  time: number,
  buildingEnergy: number
): void {
  const positions = sparks.geometry.attributes.position.array as Float32Array
  const colors = sparks.geometry.attributes.color.array as Float32Array
  
  for (let i = 0; i < positions.length / 3; i++) {
    // Update position
    positions[i * 3] += velocities[i * 3] * 0.1
    positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.1
    positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.1
    
    // Fade out
    const opacity = Math.max(0, 1 - time * 0.5)
    colors[i * 3 + 1] = opacity * buildingEnergy
    colors[i * 3 + 2] = opacity * buildingEnergy
  }
  
  sparks.geometry.attributes.position.needsUpdate = true
  sparks.geometry.attributes.color.needsUpdate = true
}

