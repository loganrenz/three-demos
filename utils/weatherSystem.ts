import * as THREE from 'three'

export interface WeatherSystem {
  rainParticles: THREE.Points | null
  rainGeometry: THREE.BufferGeometry | null
  rainMaterial: THREE.PointsMaterial | null
  fogMesh: THREE.Mesh | null
  leafParticles: THREE.Points | null
  leafGeometry: THREE.BufferGeometry | null
  leafMaterial: THREE.PointsMaterial | null
  leafPositions: Float32Array
  leafVelocities: Float32Array
  leafRotations: Float32Array
  leafLifetimes: Float32Array
}

export function createRainSystem(
  scene: THREE.Scene,
  area: number = 100,
  intensity: number = 1000
): WeatherSystem['rainParticles'] {
  const particleCount = Math.floor(intensity)
  const positions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * area
    positions[i * 3 + 1] = Math.random() * 30 + 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * area
    
    velocities[i * 3] = (Math.random() - 0.5) * 0.2
    velocities[i * 3 + 1] = -5 - Math.random() * 5
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
  
  const material = new THREE.PointsMaterial({
    color: 0x88ccff,
    size: 0.1,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  })
  
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  
  return particles
}

export function updateRain(
  rainParticles: THREE.Points | null,
  area: number = 100,
  windStrength: number = 0
): void {
  if (!rainParticles) return
  
  const positions = rainParticles.geometry.attributes.position.array as Float32Array
  const velocities = rainParticles.geometry.attributes.velocity.array as Float32Array
  
  for (let i = 0; i < positions.length / 3; i++) {
    // Update position
    positions[i * 3] += velocities[i * 3] + windStrength * 0.3
    positions[i * 3 + 1] += velocities[i * 3 + 1]
    positions[i * 3 + 2] += velocities[i * 3 + 2] + windStrength * 0.1
    
    // Reset if below ground
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3] = (Math.random() - 0.5) * area
      positions[i * 3 + 1] = 30 + Math.random() * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * area
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.2
      velocities[i * 3 + 1] = -5 - Math.random() * 5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2
    }
  }
  
  rainParticles.geometry.attributes.position.needsUpdate = true
}

export function createFog(
  scene: THREE.Scene,
  area: number = 100,
  height: number = 5
): THREE.Mesh {
  const fogGeometry = new THREE.PlaneGeometry(area * 2, area * 2, 32, 32)
  const fogMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    fog: true
  })
  
  // Displace vertices for wispy effect
  const positions = fogGeometry.attributes.position.array as Float32Array
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] = (Math.random() - 0.5) * 0.5
  }
  fogGeometry.attributes.position.needsUpdate = true
  
  const fogMesh = new THREE.Mesh(fogGeometry, fogMaterial)
  fogMesh.rotation.x = -Math.PI / 2
  fogMesh.position.y = height
  fogMesh.receiveShadow = false
  
  scene.add(fogMesh)
  return fogMesh
}

export function updateFog(
  fogMesh: THREE.Mesh | null,
  time: number,
  windStrength: number = 0
): void {
  if (!fogMesh) return
  
  const positions = fogMesh.geometry.attributes.position.array as Float32Array
  
  // Animate fog with wind
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const z = positions[i + 2]
    positions[i + 1] = Math.sin(time * 0.5 + x * 0.1 + z * 0.1) * 0.3 +
                       Math.cos(time * 0.3 + x * 0.15) * 0.2
    
    // Drift with wind
    positions[i] += windStrength * 0.01
    if (positions[i] > 100) positions[i] -= 200
    if (positions[i] < -100) positions[i] += 200
  }
  
  fogMesh.geometry.attributes.position.needsUpdate = true
}

export function createLeafParticles(
  scene: THREE.Scene,
  count: number = 200,
  area: number = 100
): {
  particles: THREE.Points
  positions: Float32Array
  velocities: Float32Array
  rotations: Float32Array
  lifetimes: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const rotations = new Float32Array(count * 3)
  const lifetimes = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * area
    positions[i * 3 + 1] = 5 + Math.random() * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * area
    
    velocities[i * 3] = (Math.random() - 0.5) * 0.3
    velocities[i * 3 + 1] = -0.5 - Math.random() * 0.5
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    
    rotations[i * 3] = Math.random() * Math.PI * 2
    rotations[i * 3 + 1] = Math.random() * Math.PI * 2
    rotations[i * 3 + 2] = Math.random() * Math.PI * 2
    
    lifetimes[i] = Math.random()
    
    // Fall colors
    const hue = 0.08 + Math.random() * 0.15
    const saturation = 0.7 + Math.random() * 0.3
    const lightness = 0.4 + Math.random() * 0.3
    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    map: createLeafTexture(),
    alphaTest: 0.5,
    blending: THREE.NormalBlending
  })
  
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  
  return {
    particles,
    positions,
    velocities,
    rotations,
    lifetimes
  }
}

function createLeafTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  
  // Draw a simple leaf shape
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(32, 32, 20, 8, Math.PI / 4, 0, Math.PI * 2)
  ctx.fill()
  
  // Add a stem
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(32, 0, 2, 15)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function updateLeafParticles(
  system: ReturnType<typeof createLeafParticles>,
  time: number,
  windStrength: number = 0,
  area: number = 100
): void {
  const { positions, velocities, rotations, lifetimes } = system
  
  for (let i = 0; i < positions.length / 3; i++) {
    // Wind effect
    const windEffect = Math.sin(time * 2 + positions[i * 3] * 0.1) * windStrength
    velocities[i * 3] += windEffect * 0.02
    velocities[i * 3 + 1] += Math.sin(time * 3 + i) * 0.01 * windStrength
    velocities[i * 3 + 2] += Math.cos(time * 2.5 + positions[i * 3] * 0.1) * windStrength * 0.02
    
    // Tumbling rotation
    rotations[i * 3] += velocities[i * 3] * 0.5
    rotations[i * 3 + 1] += velocities[i * 3 + 1] * 0.3
    rotations[i * 3 + 2] += velocities[i * 3 + 2] * 0.4
    
    // Update position
    positions[i * 3] += velocities[i * 3]
    positions[i * 3 + 1] += velocities[i * 3 + 1]
    positions[i * 3 + 2] += velocities[i * 3 + 2]
    
    // Gravity
    velocities[i * 3 + 1] -= 0.01
    
    // Air resistance
    velocities[i * 3] *= 0.995
    velocities[i * 3 + 2] *= 0.995
    
    lifetimes[i] += 0.01
    
    // Reset if below ground or too old
    if (positions[i * 3 + 1] < 0 || lifetimes[i] > 10) {
      positions[i * 3] = (Math.random() - 0.5) * area
      positions[i * 3 + 1] = 15 + Math.random() * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * area
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.3
      velocities[i * 3 + 1] = -0.3 - Math.random() * 0.3
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3
      
      rotations[i * 3] = Math.random() * Math.PI * 2
      rotations[i * 3 + 1] = Math.random() * Math.PI * 2
      rotations[i * 3 + 2] = Math.random() * Math.PI * 2
      
      lifetimes[i] = 0
    }
  }
  
  system.particles.geometry.attributes.position.needsUpdate = true
}

