<template>
  <div class="mx-auto max-w-6xl space-y-4 text-white">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Word tower</p>
        <h2 class="text-2xl font-semibold">LexiStack</h2>
        <p class="text-sm text-slate-400">A single-column experience built to stay within the viewport on phones.</p>
      </div>
      <div class="text-right text-sm">
        <p class="text-xs uppercase tracking-[0.2em] text-emerald-300">Score</p>
        <p class="text-3xl font-bold">{{ score }}</p>
        <p class="text-[12px] text-slate-400">Best streak x{{ bestCombo.toFixed(1) }}</p>
      </div>
    </div>

    <div class="relative h-[75vh] min-h-[400px] sm:min-h-[480px] rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden shadow-2xl">
      <div ref="container" class="h-full w-full"></div>

      <button
        @click="showInfo = !showInfo"
        class="absolute top-3 left-3 z-20 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-black/40 backdrop-blur transition hover:bg-black/60"
        aria-label="Toggle info"
      >
        <span class="text-lg">{{ showInfo ? '×' : 'ℹ' }}</span>
      </button>

      <div v-show="showInfo" class="absolute top-3 left-3 z-10 bg-black/40 border border-white/10 rounded-lg px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
        <div class="text-[11px] uppercase tracking-[0.15em] text-gray-300">Next row</div>
        <div class="w-40 sm:w-48 h-2.5 bg-white/10 rounded-full overflow-hidden mt-2">
          <div class="h-full bg-emerald-400 transition-all duration-200" :style="{ width: `${timerPercent}%` }"></div>
        </div>
        <div class="text-[11px] text-gray-400 mt-2">Interval: {{ rowInterval.toFixed(1) }}s</div>
      </div>

      <div v-show="showInfo" class="absolute top-3 right-3 z-10 bg-black/40 border border-white/10 rounded-lg px-3 py-2 backdrop-blur text-right sm:px-4 sm:py-3">
        <div class="text-[11px] uppercase tracking-[0.15em] text-amber-300">Danger line</div>
        <div class="text-xs text-gray-200 hidden sm:block">Keep the tower below the rim.</div>
      </div>

      <div
        class="absolute inset-x-3 bottom-3 z-10 grid gap-2 rounded-xl border border-white/10 bg-black/55 p-3 backdrop-blur sm:flex sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2 text-sm text-emerald-200">
          <span class="text-xs uppercase tracking-[0.15em] text-slate-300">Word</span>
          <div class="flex flex-wrap gap-1 min-h-[32px]">
            <span
              v-for="(tile, index) in selectedTiles"
              :key="`${tile.row}-${tile.col}-${index}`"
              class="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 font-semibold"
            >
              {{ tile.letter }}
            </span>
            <span v-if="!selectedTiles.length" class="text-xs text-slate-400">Tap connected letters</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton color="emerald" size="sm" icon="i-heroicons-check" :disabled="!selectedTiles.length || isGameOver" @click="submitWord" class="min-h-[44px]">
            Submit
          </UButton>
          <UButton variant="ghost" size="sm" icon="i-heroicons-x-mark" :disabled="!selectedTiles.length" @click="clearSelection" class="min-h-[44px]">
            Clear
          </UButton>
        </div>
      </div>

      <div v-if="isGameOver" class="absolute inset-0 bg-black/70 backdrop-blur flex items-center justify-center">
        <div class="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-sm text-center space-y-4 shadow-xl">
          <h3 class="text-xl font-semibold text-white">Game Over</h3>
          <p class="text-gray-300">Final score: <span class="font-semibold">{{ score }}</span></p>
          <UButton color="emerald" icon="i-heroicons-arrow-path" @click="resetGame">Play again</UButton>
        </div>
      </div>
    </div>

    <details class="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
      <summary class="cursor-pointer text-xs uppercase tracking-[0.15em] text-slate-300">How to play & tips</summary>
      <div class="mt-3 space-y-2">
        <p>Connect adjacent letters to form words. Enter or Submit clears them and drops the tower.</p>
        <p class="text-slate-400">Each cleared word slows the next row timer; longer words boost the combo multiplier.</p>
        <ul class="list-disc list-inside space-y-1">
          <li>Diagonal chains are allowed.</li>
          <li>Keep an eye on the timer bar — it is your breathing room.</li>
          <li>Small clears buy time; long words push your streak.</li>
        </ul>
      </div>
    </details>

    <p v-if="statusMessage" class="text-sm text-emerald-200/80">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  ssr: false,
  layout: 'demo'
})

import { onMounted, onUnmounted, ref, computed, nextTick, markRaw } from 'vue'
import * as THREE from 'three'
import { isAdjacentPosition, scoreWord } from '@/utils/lexistack-logic'
import { preloadDictionary, validateWord } from '@/utils/lexistack-dictionary'
import { useFeatureFlags } from '@/composables/useFeatureFlags'
import { useRuntimeDiagnostics } from '@/composables/useRuntimeDiagnostics'
import { isWebGLAvailable } from '@/utils/webglSupport'
import { trackAnalytics } from '@/utils/analytics'

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
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
const raycaster = markRaw(new THREE.Raycaster())
const pointer = markRaw(new THREE.Vector2())
const clock = markRaw(new THREE.Clock())
let animationId: number | null = null

const featureFlags = useFeatureFlags()
const diagnostics = useRuntimeDiagnostics(computed(() => featureFlags.value.debugPanel))

const showInfo = ref(false)
const grid = ref<Array<Array<TileData | null>>>([])
const selectedTiles = ref<TileData[]>([])
const score = ref(0)
const comboMultiplier = ref(1)
const bestCombo = ref(1)
const rowInterval = ref(START_INTERVAL)
const timeUntilNextRow = ref(rowInterval.value)
const isGameOver = ref(false)
const statusMessage = ref('')
const dictionaryLocale = ref('en-US')
const isDictionaryReady = ref(false)
const webglSupported = ref(true)
const renderError = ref('')

const boardWidth = GRID_COLS * (TILE_SIZE + TILE_GAP) - TILE_GAP
const boardHeight = GRID_ROWS_VISIBLE * (TILE_SIZE + TILE_GAP) - TILE_GAP
const boardOriginY = -boardHeight / 2

const timerPercent = computed(() => Math.max(0, Math.min(100, (timeUntilNextRow.value / rowInterval.value) * 100)))
const currentWord = computed(() => selectedTiles.value.map((tile) => tile.letter).join(''))
const formattedMemory = computed(() => {
  if (!diagnostics.memory.value) return '—'
  const mb = diagnostics.memory.value / 1024 / 1024
  return `${mb.toFixed(1)} MB`
})

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
  scene = markRaw(new THREE.Scene())
  scene.background = new THREE.Color('#0b1021')

  const width = container.value.clientWidth
  const height = container.value.clientHeight
  const halfW = boardWidth / 1.3
  const halfH = boardHeight / 1.3
  camera = markRaw(new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 100))
  camera.position.set(0, boardHeight / 3, 15)
  camera.lookAt(0, boardHeight / 3, 0)

  renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }))
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = false
  container.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight('#ffffff', 0.6)
  scene.add(ambient)

  const dir = new THREE.DirectionalLight('#87d1ff', 0.8)
  dir.position.set(4, 8, 6)
  scene.add(dir)

  const planeGeo = new THREE.PlaneGeometry(boardWidth * 1.2, boardHeight * 1.4)
  const planeMat = new THREE.MeshBasicMaterial({ color: '#0f172a', transparent: true, opacity: 0.75 })
  const base = new THREE.Mesh(planeGeo, planeMat)
  base.position.set(0, boardOriginY + boardHeight / 2, -1)
  scene.add(base)
}

const spawnInitialRows = () => {
  if (!scene) return
  grid.value = Array.from({ length: GRID_ROWS_VISIBLE }, () => Array.from({ length: GRID_COLS }, () => null))
  for (let r = 0; r < INITIAL_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const letter = getRandomLetter()
      const tile = createTile(letter, r, c)
      grid.value[r][c] = tile
      scene.add(tile.mesh)
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
    if (scene) scene.add(tile.mesh)
  }

  rowInterval.value = Math.max(MIN_INTERVAL, rowInterval.value - INTERVAL_DECREASE)
  timeUntilNextRow.value = rowInterval.value
}

const handlePointerDown = (event: PointerEvent) => {
  if (!renderer || !camera || !scene || isGameOver.value) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)

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
  if (last && !isAdjacentPosition(last, tile)) {
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

const submitWord = async () => {
  if (!selectedTiles.value.length || isGameOver.value) return
  const word = currentWord.value.toUpperCase()

  if (!isDictionaryReady.value) {
    statusMessage.value = 'Loading dictionary... validation may be slower.'
  }

  let validation
  try {
    validation = await validateWord(word, {
      locale: dictionaryLocale.value,
      minLength: 2,
      maxLength: 12
    })
  } catch (error) {
    console.error('[lexistack] Dictionary lookup failed', error)
    statusMessage.value = 'Dictionary unavailable. Check your connection and try again.'
    comboMultiplier.value = 1
    flashTiles(selectedTiles.value)
    clearSelection()
    return
  }

  if (!validation.valid) {
    statusMessage.value = validation.reason ?? 'That word is not allowed.'
    comboMultiplier.value = 1
    flashTiles(selectedTiles.value)
    clearSelection()
    return
  }

  const letters = selectedTiles.value.map((tile) => tile.letter)
  const total = scoreWord(letters, comboMultiplier.value)
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
  if (!scene || !camera || !renderer) return

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
          scene?.remove(tile.mesh)
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

  renderer.render(scene, camera)
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

  if (scene) {
    const removals = tileMeshes()
    for (const mesh of removals) {
      scene.remove(mesh)
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
  if (!container.value || !camera || !renderer) return
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  const halfW = boardWidth / 1.3
  const halfH = boardHeight / 1.3
  camera.left = -halfW
  camera.right = halfW
  camera.top = halfH
  camera.bottom = -halfH
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  try {
    await preloadDictionary(dictionaryLocale.value)
    isDictionaryReady.value = true
    statusMessage.value = 'Dictionary cached for offline play.'
  } catch (error) {
    console.warn('[lexistack] Unable to preload dictionary', error)
    statusMessage.value = 'Dictionary could not cache offline; validation will attempt live lookups.'
  }

  initScene()
  spawnInitialRows()

  if (renderer) {
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)

  clock.start()
  update()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)

  if (scene) {
    const meshes = tileMeshes()
    for (const mesh of meshes) {
      scene.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material && mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }
  }

  if (renderer) {
    if (container.value && renderer.domElement.parentNode) {
      container.value.removeChild(renderer.domElement)
    }
    renderer.dispose()
    renderer = null
  }
  
  scene = null
  camera = null
})
</script>
