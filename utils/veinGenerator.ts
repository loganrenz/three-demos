import * as THREE from 'three'
import type { Building } from './cityGenerator'

export interface Vein {
  curve: THREE.CatmullRomCurve3
  tube: THREE.Mesh
  material: THREE.MeshStandardMaterial | THREE.ShaderMaterial
  phase: number
  speed: number
  activeSegments: number[]
}

export function generateVeins(
  scene: THREE.Scene,
  count: number = 8,
  depth: number = -5
): Vein[] {
  const veins: Vein[] = []
  const citySize = 60

  // Create a network of veins
  for (let i = 0; i < count; i++) {
    const points: THREE.Vector3[] = []

    // Start from center or random point
    const startX = (Math.random() - 0.5) * citySize * 0.5
    const startZ = (Math.random() - 0.5) * citySize * 0.5
    points.push(new THREE.Vector3(startX, depth, startZ))

    // Create branching path (need at least 4 points for CatmullRomCurve3)
    const segments = 5 + Math.floor(Math.random() * 5)
    let currentX = startX
    let currentZ = startZ

    for (let j = 0; j < segments; j++) {
      currentX += (Math.random() - 0.5) * citySize * 0.8
      currentZ += (Math.random() - 0.5) * citySize * 0.8
      const yVariation = depth + (Math.random() - 0.5) * 2
      points.push(new THREE.Vector3(currentX, yVariation, currentZ))
    }

    // Ensure we have enough points for the curve
    if (points.length < 4) {
      // Add more points if needed
      while (points.length < 4) {
        currentX += (Math.random() - 0.5) * citySize * 0.8
        currentZ += (Math.random() - 0.5) * citySize * 0.8
        const yVariation = depth + (Math.random() - 0.5) * 2
        points.push(new THREE.Vector3(currentX, yVariation, currentZ))
      }
    }

    const curve = new THREE.CatmullRomCurve3(points)
    if (!curve || points.length < 4) continue
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.8, 8, false)
    
    // Enhanced shader material with animated flow and depth-based glow
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ffff) },
        depth: { value: depth }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vDepth;
        void main() {
          vPosition = position;
          vDepth = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float depth;
        varying vec3 vPosition;
        varying float vDepth;
        void main() {
          // Depth-based intensity (closer to surface = brighter)
          float depthFactor = 1.0 - abs(vDepth - depth) / 5.0;
          depthFactor = clamp(depthFactor, 0.4, 1.0);
          
          // Animated pulse along the vein
          float pulse = sin(time * 2.0 + vPosition.x * 0.2 + vPosition.z * 0.2) * 0.15 + 0.85;
          
          // Flow effect
          float flow = sin(time * 1.5 + length(vPosition) * 0.1) * 0.1 + 0.9;
          
          vec3 finalColor = color * depthFactor * pulse * flow;
          float alpha = 0.7 * depthFactor;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    })

    const tube = new THREE.Mesh(tubeGeometry, shaderMaterial)
    scene.add(tube)

    veins.push({
      curve,
      tube,
      material: shaderMaterial,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      activeSegments: []
    })
  }

  return veins
}

export function updateVeinFlow(
  vein: Vein,
  time: number,
  pulseSpeed: number = 1
): THREE.Vector3[] {
  const activePoints: THREE.Vector3[] = []
  if (!vein?.curve) return activePoints
  
  const points = vein.curve.getPoints(64)
  if (!points || points.length === 0) return activePoints
  
  const waveLength = 10
  const waveSpeed = vein.speed * pulseSpeed

  // Calculate which segments are active based on wave position
  let maxIntensity = 0
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    if (!point) continue
    
    const t = i / points.length
    const wavePosition = ((time * waveSpeed + vein.phase) % (waveLength + 2)) - 1
    const distance = Math.abs(t * waveLength - wavePosition)

    if (distance < 1.5) {
      const intensity = Math.max(0, 1 - distance / 1.5)
      activePoints.push(point)
      maxIntensity = Math.max(maxIntensity, intensity)
    }
  }

  // Update material intensity based on max active intensity
  if (vein.material instanceof THREE.ShaderMaterial) {
    vein.material.uniforms.time.value = time
  } else if (vein.material instanceof THREE.MeshStandardMaterial) {
    const emissiveIntensity = 0.5 + maxIntensity * 1.5
    vein.material.emissiveIntensity = emissiveIntensity
    vein.material.opacity = 0.4 + maxIntensity * 0.4
  }

  return activePoints
}

export function getActiveVeinPoints(
  vein: Vein,
  time: number,
  pulseSpeed: number
): THREE.Vector3[] {
  const activePoints: THREE.Vector3[] = []
  try {
    const points = vein.curve.getPoints(64)
    if (!points || points.length === 0) return activePoints
    
    const waveLength = 10
    const waveSpeed = vein.speed * pulseSpeed

    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (!point) continue
      
      const t = i / points.length
      const wavePosition = ((time * waveSpeed + vein.phase) % (waveLength + 2)) - 1
      const distance = Math.abs(t * waveLength - wavePosition)

      if (distance < 1.5) {
        activePoints.push(point)
      }
    }
  } catch (e) {
    console.error('Error getting active vein points:', e)
  }

  return activePoints
}

export function checkBuildingEnergized(
  building: Building,
  veins: Vein[],
  time: number,
  pulseSpeed: number
): boolean {
  if (!building || !building.position) return false
  if (typeof building.position.x !== 'number' || typeof building.position.z !== 'number') return false
  
  const buildingX = building.position.x
  const buildingZ = building.position.z
  const threshold = 6

  for (const vein of veins) {
    if (!vein || !vein.curve) continue
    
    const activePoints = getActiveVeinPoints(vein, time, pulseSpeed)

    for (const point of activePoints) {
      if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') continue
      
      const distance = Math.sqrt(
        Math.pow(point.x - buildingX, 2) + Math.pow(point.z - buildingZ, 2)
      )

      if (distance < threshold) {
        return true
      }
    }
  }

  return false
}

