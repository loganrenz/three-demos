<template>
  <div class="space-y-4">
    <div class="mb-2">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">LexiStack</h2>
            <p class="text-gray-600 dark:text-gray-300">Build words, clear tiles, and keep the stack from reaching the danger line.</p>
          </div>
          <div class="text-right">
            <div class="text-sm uppercase tracking-wide text-emerald-400">Score</div>
            <div class="text-4xl font-bold text-gray-900 dark:text-white">{{ score }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Best streak: x{{ bestCombo.toFixed(1) }}</div>
          </div>
        </div>

        <div class="relative rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
          <div ref="container" class="w-full h-[640px]"></div>

          <div class="absolute top-4 left-4 bg-black/40 border border-white/10 rounded-lg px-4 py-3 backdrop-blur">
            <div class="text-xs uppercase tracking-wide text-gray-300">Next row</div>
            <div class="w-56 h-3 bg-white/10 rounded-full overflow-hidden mt-2">
              <div
                class="h-full bg-emerald-400 transition-all duration-200"
                :style="{ width: `${timerPercent}%` }"
              ></div>
            </div>
            <div class="text-[11px] text-gray-400 mt-2">Interval: {{ rowInterval.toFixed(1) }}s</div>
          </div>

          <div class="absolute top-4 right-4 bg-black/40 border border-white/10 rounded-lg px-4 py-3 backdrop-blur text-right">
            <div class="text-xs uppercase tracking-wide text-amber-300">Danger line</div>
            <div class="text-sm text-gray-200">Don't let the tower cross the top!</div>
          </div>

          <div v-if="isGameOver" class="absolute inset-0 bg-black/70 backdrop-blur flex items-center justify-center">
            <div class="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-sm text-center space-y-4 shadow-xl">
              <h3 class="text-xl font-semibold text-white">Game Over</h3>
              <p class="text-gray-300">Final score: <span class="font-semibold">{{ score }}</span></p>
              <UButton color="emerald" icon="i-heroicons-arrow-path" @click="resetGame">Play again</UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm uppercase tracking-wide text-gray-400">Current Word</div>
                <div class="text-xl font-semibold text-gray-900 dark:text-white">{{ currentWord || '—' }}</div>
              </div>
              <div class="text-right text-sm text-gray-500 dark:text-gray-400">Combo x{{ comboMultiplier.toFixed(1) }}</div>
            </div>
          </template>
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2 min-h-[44px]">
              <span
                v-for="(tile, index) in selectedTiles"
                :key="`${tile.row}-${tile.col}-${index}`"
                class="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 font-semibold"
              >
                {{ tile.letter }}
              </span>
            </div>
            <div class="flex gap-2">
              <UButton color="emerald" icon="i-heroicons-check" :disabled="!selectedTiles.length || isGameOver" @click="submitWord">
                Submit (Enter)
              </UButton>
              <UButton variant="ghost" icon="i-heroicons-x-mark" :disabled="!selectedTiles.length" @click="clearSelection">
                Clear
              </UButton>
            </div>
            <p v-if="statusMessage" class="text-sm text-gray-500 dark:text-gray-400">{{ statusMessage }}</p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">How to Play</h3>
            </div>
          </template>
          <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click tiles to build a word. Tiles must touch (including diagonals).</li>
            <li>Press <kbd class="px-1 py-0.5 bg-slate-800 text-white rounded">Enter</kbd> or hit Submit to clear valid words.</li>
            <li>Every few seconds a new row spawns at the bottom. Keep the tower below the danger line.</li>
            <li>Valid words award points, drop tiles, and slow the next row timer a bit.</li>
          </ol>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tips</h3>
          </template>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300">
            <li>Longer words pay better thanks to the combo multiplier.</li>
            <li>Diagonal chains are allowed — weave through the stack for surprise words.</li>
            <li>Stuck? Clear small words to buy a little more time before the next row.</li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import * as THREE from 'three'
import { isValidWord } from '~/utils/lexistack-dictionary'

interface TileData {
  letter: string
  mesh: THREE.Mesh
  row: number
  col: number
  targetY: number
  removing: boolean
  removeTimer: number
  flashTimer: number
}

const GRID_COLS = 8
const GRID_ROWS_VISIBLE = 10
const TILE_SIZE = 0.9
const TILE_GAP = 0.14
const INITIAL_ROWS = 5
const START_INTERVAL = 7
const MIN_INTERVAL = 3
const INTERVAL_DECREASE = 0.05
const TIMER_REWARD = 1.1

const LETTER_SCORES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
}

const LETTER_POOL: Array<{ letter: string; weight: number }> = [
  { letter: 'E', weight: 12 },
  { letter: 'A', weight: 9 },
  { letter: 'I', weight: 9 },
  { letter: 'O', weight: 8 },
  { letter: 'N', weight: 6 },
  { letter: 'R', weight: 6 },
  { letter: 'T', weight: 6 },
  { letter: 'L', weight: 4 },
  { letter: 'S', weight: 4 },
  { letter: 'U', weight: 4 },
  { letter: 'D', weight: 4 },
  { letter: 'G', weight: 3 },
  { letter: 'B', weight: 2 },
  { letter: 'C', weight: 2 },
  { letter: 'M', weight: 2 },
  { letter: 'P', weight: 2 },
  { letter: 'F', weight: 2 },
  { letter: 'H', weight: 2 },
  { letter: 'V', weight: 2 },
  { letter: 'W', weight: 2 },
  { letter: 'Y', weight: 2 },
  { letter: 'K', weight: 1 },
  { letter: 'J', weight: 1 },
  { letter: 'X', weight: 1 },
  { letter: 'Q', weight: 1 },
  { letter: 'Z', weight: 1 }
]

const container = ref<HTMLDivElement | null>(null)
const scene = ref<THREE.Scene | null>(null)
const camera = ref<THREE.OrthographicCamera | null>(null)
const renderer = ref<THREE.WebGLRenderer | null>(null)
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const clock = new THREE.Clock()
let animationId: number | null = null

const grid = ref<Array<Array<TileData | null>>>([])
const selectedTiles = ref<TileData[]>([])
const score = ref(0)
const comboMultiplier = ref(1)
const bestCombo = ref(1)
const rowInterval = ref(START_INTERVAL)
const timeUntilNextRow = ref(rowInterval.value)
const isGameOver = ref(false)
const statusMessage = ref('')

const boardWidth = GRID_COLS * (TILE_SIZE + TILE_GAP) - TILE_GAP
const boardHeight = GRID_ROWS_VISIBLE * (TILE_SIZE + TILE_GAP) - TILE_GAP
const boardOriginY = -boardHeight / 2

const timerPercent = computed(() => Math.max(0, Math.min(100, (timeUntilNextRow.value / rowInterval.value) * 100)))
const currentWord = computed(() => selectedTiles.value.map((tile) => tile.letter).join(''))

const tileMeshes = () => {
  return grid.value.flatMap((row) => row.filter((tile): tile is TileData => !!tile).map((tile) => tile.mesh))
}

const getTileY = (row: number) => boardOriginY + row * (TILE_SIZE + TILE_GAP)
const getTileX = (col: number) => (col - (GRID_COLS - 1) / 2) * (TILE_SIZE + TILE_GAP)

const resetMaterials = (tile: TileData) => {
  const material = tile.mesh.material as THREE.MeshStandardMaterial
  material.color.set('#cbd5f5')
  material.emissive.set('#0ea5e9')
  material.opacity = 1
}

const createLetterTexture = (letter: string, background = '#0f172a', textColor = '#e5e7eb') => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = textColor
  ctx.font = 'bold 72px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, size / 2, size / 2)
  return new THREE.CanvasTexture(canvas)
}

const createTile = (letter: string, row: number, col: number, startY?: number): TileData => {
  const geometry = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE * 0.4)
  const texture = createLetterTexture(letter)
  const material = new THREE.MeshStandardMaterial({
    color: '#cbd5f5',
    emissive: '#0ea5e9',
    metalness: 0.05,
    roughness: 0.5,
    map: texture ?? undefined,
    transparent: true
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(getTileX(col), startY ?? getTileY(row), 0)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData = { row, col }
  return { letter, mesh, row, col, targetY: getTileY(row), removing: false, removeTimer: 0.3, flashTimer: 0 }
}

const getRandomLetter = () => {
  const totalWeight = LETTER_POOL.reduce((sum, entry) => sum + entry.weight, 0)
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const entry of LETTER_POOL) {
    cumulative += entry.weight
    if (roll <= cumulative) return entry.letter
  }
  return 'E'
}

const initScene = () => {
  if (!container.value) return
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color('#0b1021')

  const width = container.value.clientWidth
  const height = container.value.clientHeight
  const halfW = boardWidth / 1.3
  const halfH = boardHeight / 1.3
  camera.value = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 100)
  camera.value.position.set(0, boardHeight / 3, 15)
  camera.value.lookAt(0, boardHeight / 3, 0)

  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(width, height)
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.value.shadowMap.enabled = false
  container.value.appendChild(renderer.value.domElement)

  const ambient = new THREE.AmbientLight('#ffffff', 0.6)
  scene.value.add(ambient)

  const dir = new THREE.DirectionalLight('#87d1ff', 0.8)
  dir.position.set(4, 8, 6)
  scene.value.add(dir)

  const planeGeo = new THREE.PlaneGeometry(boardWidth * 1.2, boardHeight * 1.4)
  const planeMat = new THREE.MeshBasicMaterial({ color: '#0f172a', transparent: true, opacity: 0.75 })
  const base = new THREE.Mesh(planeGeo, planeMat)
  base.position.set(0, boardOriginY + boardHeight / 2, -1)
  scene.value.add(base)
}

const spawnInitialRows = () => {
  grid.value = Array.from({ length: GRID_ROWS_VISIBLE }, () => Array.from({ length: GRID_COLS }, () => null))
  for (let r = 0; r < INITIAL_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const letter = getRandomLetter()
      const tile = createTile(letter, r, c)
      grid.value[r][c] = tile
      scene.value?.add(tile.mesh)
    }
  }
}

const addNewRow = () => {
  if (isGameOver.value) return
  if (grid.value[GRID_ROWS_VISIBLE - 1].some((tile) => tile)) {
    triggerGameOver()
    return
  }

  for (let row = GRID_ROWS_VISIBLE - 1; row >= 1; row--) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = grid.value[row - 1][col]
      grid.value[row][col] = tile
      if (tile) {
        tile.row = row
        tile.targetY = getTileY(row)
        tile.mesh.userData.row = row
      }
    }
  }

  for (let col = 0; col < GRID_COLS; col++) {
    const letter = getRandomLetter()
    const tile = createTile(letter, 0, col, boardOriginY - TILE_SIZE * 2)
    grid.value[0][col] = tile
    scene.value?.add(tile.mesh)
  }

  rowInterval.value = Math.max(MIN_INTERVAL, rowInterval.value - INTERVAL_DECREASE)
  timeUntilNextRow.value = rowInterval.value
}

const handlePointerDown = (event: PointerEvent) => {
  if (!renderer.value || !camera.value || !scene.value || isGameOver.value) return
  const rect = renderer.value.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera.value)

  const intersects = raycaster.intersectObjects(tileMeshes())
  if (intersects.length) {
    const mesh = intersects[0].object as THREE.Mesh
    const tile = findTileByMesh(mesh)
    if (tile) {
      toggleTileSelection(tile)
    }
  }
}

const findTileByMesh = (mesh: THREE.Object3D): TileData | null => {
  for (const row of grid.value) {
    for (const tile of row) {
      if (tile && tile.mesh === mesh) return tile
    }
  }
  return null
}

const isAdjacent = (a: TileData, b: TileData) => {
  const rowDiff = Math.abs(a.row - b.row)
  const colDiff = Math.abs(a.col - b.col)
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)
}

const toggleTileSelection = (tile: TileData) => {
  if (tile.removing) return
  const index = selectedTiles.value.findIndex((t) => t.row === tile.row && t.col === tile.col)
  if (index !== -1) {
    selectedTiles.value.splice(index, 1)
    resetMaterials(tile)
    tile.mesh.scale.setScalar(1)
    return
  }

  const last = selectedTiles.value[selectedTiles.value.length - 1]
  if (last && !isAdjacent(last, tile)) {
    statusMessage.value = 'Tiles must be adjacent.'
    flashTiles([tile])
    return
  }

  selectedTiles.value.push(tile)
  const material = tile.mesh.material as THREE.MeshStandardMaterial
  material.color.set('#67e8f9')
  material.emissive.set('#22d3ee')
  tile.mesh.scale.setScalar(1.08)
  statusMessage.value = ''
}

const flashTiles = (tiles: TileData[]) => {
  for (const tile of tiles) {
    tile.flashTimer = 0.3
  }
}

const clearSelection = () => {
  selectedTiles.value.forEach((tile) => {
    resetMaterials(tile)
    tile.mesh.scale.setScalar(1)
  })
  selectedTiles.value = []
}

const submitWord = () => {
  if (!selectedTiles.value.length || isGameOver.value) return
  const word = currentWord.value.toUpperCase()
  if (word.length < 2) {
    statusMessage.value = 'Select at least two letters.'
    flashTiles(selectedTiles.value)
    clearSelection()
    return
  }

  if (!isValidWord(word)) {
    statusMessage.value = `${word} is not in the dictionary.`
    comboMultiplier.value = 1
    flashTiles(selectedTiles.value)
    clearSelection()
    return
  }

  const wordScore = selectedTiles.value.reduce((sum, tile) => sum + LETTER_SCORES[tile.letter], 0)
  const total = Math.round(wordScore * (1 + selectedTiles.value.length * 0.1) * comboMultiplier.value)
  score.value += total
  comboMultiplier.value = Math.min(5, comboMultiplier.value + 0.1)
  bestCombo.value = Math.max(bestCombo.value, comboMultiplier.value)
  statusMessage.value = `Cleared ${word}! +${total} points`

  for (const tile of selectedTiles.value) {
    tile.removing = true
    tile.removeTimer = 0.35
  }

  clearSelection()
  applyGravityAfterDelay()
  timeUntilNextRow.value = Math.min(rowInterval.value, timeUntilNextRow.value + TIMER_REWARD)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    submitWord()
  }
}

const applyGravityAfterDelay = () => {
  setTimeout(() => {
    for (let col = 0; col < GRID_COLS; col++) {
      let writeRow = 0
      for (let row = 0; row < GRID_ROWS_VISIBLE; row++) {
        const tile = grid.value[row][col]
        if (tile && !tile.removing) {
          if (row !== writeRow) {
            grid.value[writeRow][col] = tile
            grid.value[row][col] = null
            tile.row = writeRow
            tile.targetY = getTileY(writeRow)
            tile.mesh.userData.row = writeRow
          }
          writeRow++
        }
      }
      for (let row = writeRow; row < GRID_ROWS_VISIBLE; row++) {
        if (!grid.value[row][col] || grid.value[row][col]?.removing) {
          grid.value[row][col] = null
        }
      }
    }
  }, 220)
}

const update = () => {
  const delta = clock.getDelta()
  if (!scene.value || !camera.value || !renderer.value) return

  if (!isGameOver.value) {
    timeUntilNextRow.value -= delta
    if (timeUntilNextRow.value <= 0) {
      addNewRow()
    }
  }

  for (const row of grid.value) {
    for (const tile of row) {
      if (!tile) continue
      tile.mesh.position.y += (tile.targetY - tile.mesh.position.y) * Math.min(10 * delta, 1)

      if (tile.removing) {
        tile.removeTimer -= delta
        const t = Math.max(tile.removeTimer, 0) / 0.35
        tile.mesh.scale.setScalar(1 + (1 - t) * 0.2)
        const material = tile.mesh.material as THREE.MeshStandardMaterial
        material.opacity = t
        if (tile.removeTimer <= 0) {
          scene.value?.remove(tile.mesh)
          const indexRow = tile.row
          const indexCol = tile.col
          if (grid.value[indexRow][indexCol] === tile) {
            grid.value[indexRow][indexCol] = null
          } else {
            for (let r = 0; r < GRID_ROWS_VISIBLE; r++) {
              for (let c = 0; c < GRID_COLS; c++) {
                if (grid.value[r][c] === tile) grid.value[r][c] = null
              }
            }
          }
          tile.mesh.geometry.dispose()
          if (material.map) material.map.dispose()
          material.dispose()
        }
      }

      if (tile.flashTimer > 0) {
        tile.flashTimer -= delta
        const material = tile.mesh.material as THREE.MeshStandardMaterial
        material.emissive.set('#f97316')
        if (tile.flashTimer <= 0) {
          resetMaterials(tile)
          tile.mesh.scale.setScalar(1)
        }
      }
    }
  }

  renderer.value.render(scene.value, camera.value)
  animationId = requestAnimationFrame(update)
}

const resetGame = () => {
  statusMessage.value = ''
  selectedTiles.value = []
  score.value = 0
  comboMultiplier.value = 1
  bestCombo.value = 1
  rowInterval.value = START_INTERVAL
  timeUntilNextRow.value = rowInterval.value
  isGameOver.value = false

  if (scene.value) {
    const removals = tileMeshes()
    for (const mesh of removals) {
      scene.value.remove(mesh)
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material && mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }
  }

  spawnInitialRows()
}

const triggerGameOver = () => {
  isGameOver.value = true
  statusMessage.value = 'The stack reached the danger line.'
}

const handleResize = () => {
  if (!container.value || !camera.value || !renderer.value) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  renderer.value.setSize(width, height)
}

onMounted(() => {
  initScene()
  spawnInitialRows()

  if (renderer.value) {
    renderer.value.domElement.addEventListener('pointerdown', handlePointerDown)
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)

  clock.start()
  update()
})

onUnmounted(() => {
  if (renderer.value) {
    renderer.value.domElement.removeEventListener('pointerdown', handlePointerDown)
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  if (animationId) cancelAnimationFrame(animationId)

  const meshes = tileMeshes()
  for (const mesh of meshes) {
    scene.value?.remove(mesh)
    mesh.geometry.dispose()
    if (mesh.material && mesh.material instanceof THREE.Material) {
      mesh.material.dispose()
    }
  }

  renderer.value?.dispose()
})
</script>
