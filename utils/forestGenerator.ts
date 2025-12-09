import * as THREE from 'three'

export interface Tree {
  trunk: THREE.Group
  leaves: THREE.Group
  windPhase: number
  windStrength: number
  basePosition: THREE.Vector3
  branches: Array<{ mesh: THREE.Mesh; length: number; tilt: number }>
}

function createTree(
  height: number = 8,
  trunkRadius: number = 0.3,
  leafDensity: number = 100
): Tree {
  const treeGroup = new THREE.Group()
  const trunkGroup = new THREE.Group()
  const leavesGroup = new THREE.Group()
  
  // Create trunk with slight taper
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadius * 0.7,
    trunkRadius,
    height,
    8
  )
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.9,
    metalness: 0.1
  })
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.position.y = height / 2
  trunk.castShadow = true
  trunk.receiveShadow = true
  trunkGroup.add(trunk)
  
  // Create branches
  const branches: Array<{ mesh: THREE.Mesh; length: number; tilt: number }> = []
  const branchCount = 3 + Math.floor(Math.random() * 4)
  
  for (let i = 0; i < branchCount; i++) {
    const branchHeight = height * (0.5 + Math.random() * 0.4)
    const branchLength = 1.5 + Math.random() * 2
    const branchAngle = (Math.PI * 2 * i) / branchCount + (Math.random() - 0.5) * 0.5
    const branchTilt = Math.random() * 0.3
    
    const branchGeometry = new THREE.CylinderGeometry(
      trunkRadius * 0.3,
      trunkRadius * 0.4,
      branchLength,
      6
    )
    const branchMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2819,
      roughness: 0.9
    })
    const branch = new THREE.Mesh(branchGeometry, branchMaterial)
    branch.rotation.z = branchAngle
    branch.rotation.x = -Math.PI / 2 + branchTilt
    branch.position.y = branchHeight
    branch.position.x = Math.cos(branchAngle) * trunkRadius * 1.2
    branch.position.z = Math.sin(branchAngle) * trunkRadius * 1.2
    branch.castShadow = true
    trunkGroup.add(branch)
    branches.push({ mesh: branch, length: branchLength, tilt: branchTilt })
  }
  
  // Create leaf clusters
  const leafGeometry = new THREE.ConeGeometry(2, 3, 8)
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.3 + Math.random() * 0.1, 0.7, 0.4),
    roughness: 0.8,
    metalness: 0.0,
    flatShading: true
  })
  
  const leafClusters: THREE.Mesh[] = []
  for (let i = 0; i < leafDensity; i++) {
    const cluster = new THREE.Mesh(
      leafGeometry.clone(),
      leafMaterial.clone()
    )
    
    // Position on branches and trunk top
    if (branches.length > 0) {
      const branchIndex = Math.floor(Math.random() * branches.length)
      const branch = branches[branchIndex]
      const t = 0.2 + Math.random() * 0.8
      
      const branchPos = new THREE.Vector3()
      branchPos.copy(branch.mesh.position)
      const branchAngle = branch.mesh.rotation.z
      branchPos.add(
        new THREE.Vector3(
          Math.cos(branchAngle) * branch.length * t,
          branch.length * t * Math.sin(branch.tilt),
          Math.sin(branchAngle) * branch.length * t
        )
      )
      
      cluster.position.copy(branchPos)
      cluster.scale.setScalar(0.5 + Math.random() * 0.8)
      cluster.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
    } else {
      // Top of trunk
      cluster.position.set(
        (Math.random() - 0.5) * 1.5,
        height * 0.8 + Math.random() * height * 0.3,
        (Math.random() - 0.5) * 1.5
      )
      cluster.scale.setScalar(0.8 + Math.random() * 1.2)
    }
    
    cluster.castShadow = true
    cluster.receiveShadow = true
    leavesGroup.add(cluster)
    leafClusters.push(cluster)
  }
  
  treeGroup.add(trunkGroup)
  treeGroup.add(leavesGroup)
  
  return {
    trunk: trunkGroup,
    leaves: leavesGroup,
    windPhase: Math.random() * Math.PI * 2,
    windStrength: 0.5 + Math.random() * 0.5,
    basePosition: new THREE.Vector3(),
    branches
  }
}

export function generateForest(
  scene: THREE.Scene,
  size: number = 50,
  treeCount: number = 150,
  minHeight: number = 4,
  maxHeight: number = 12
): Tree[] {
  const trees: Tree[] = []
  const occupiedPositions: THREE.Vector2[] = []
  const minDistance = 3
  
  for (let i = 0; i < treeCount; i++) {
    let attempts = 0
    let position: THREE.Vector2
    
    do {
      position = new THREE.Vector2(
        (Math.random() - 0.5) * size,
        (Math.random() - 0.5) * size
      )
      attempts++
    } while (
      attempts < 50 &&
      occupiedPositions.some(
        pos => position.distanceTo(pos) < minDistance
      )
    )
    
    if (attempts >= 50) continue
    
    occupiedPositions.push(position)
    
    const height = minHeight + Math.random() * (maxHeight - minHeight)
    const tree = createTree(height, 0.2 + Math.random() * 0.2, 80 + Math.floor(Math.random() * 40))
    tree.basePosition.set(position.x, 0, position.y)
    tree.trunk.position.copy(tree.basePosition)
    tree.leaves.position.copy(tree.basePosition)
    
    scene.add(tree.trunk)
    scene.add(tree.leaves)
    
    trees.push(tree)
  }
  
  return trees
}

export function updateTreeWind(
  tree: Tree,
  time: number,
  windSpeed: number = 1.0,
  windStrength: number = 1.0
): void {
  const baseWind = Math.sin(time * windSpeed + tree.windPhase) * windStrength
  const highWind = Math.sin(time * windSpeed * 1.5 + tree.windPhase) * windStrength * 0.5
  
  // Trunk sways slightly at base
  tree.trunk.rotation.z = baseWind * 0.05 * tree.windStrength
  tree.trunk.position.x = tree.basePosition.x + baseWind * 0.1 * tree.windStrength
  
  // Leaves sway more
  tree.leaves.rotation.z = baseWind * 0.15 * tree.windStrength
  tree.leaves.rotation.x = highWind * 0.1 * tree.windStrength
  tree.leaves.position.x = tree.basePosition.x + baseWind * 0.2 * tree.windStrength
  
  // Update individual leaf clusters
  tree.leaves.children.forEach((child, index) => {
    if (child instanceof THREE.Mesh) {
      const leafPhase = tree.windPhase + index * 0.5
      const leafWind = Math.sin(time * windSpeed * 2 + leafPhase) * windStrength * 0.3
      child.rotation.z += leafWind * 0.02
      child.rotation.x += leafWind * 0.01
    }
  })
}

