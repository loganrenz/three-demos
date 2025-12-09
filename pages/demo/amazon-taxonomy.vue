<template>
  <div class="space-y-6 pb-16">
    <div class="flex items-center gap-3">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Merch taxonomy</p>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Amazon Taxonomy Investigator</h2>
        <p class="text-gray-600 dark:text-gray-300">
          Follow category paths, double-check destinations, and jump into a spatial 3D lattice to see how branches relate.
        </p>
      </div>
    </div>

    <div
      v-if="isMobile"
      class="xl:hidden sticky top-0 z-30 -mx-4 px-4 pb-2 pt-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-gray-200 dark:border-gray-800"
    >
      <div class="grid grid-cols-3 gap-2 text-xs">
        <UButton variant="soft" color="gray" icon="i-heroicons-list-bullet" @click="scrollToSection(pathCard)">
          Path
        </UButton>
        <UButton variant="soft" color="gray" icon="i-heroicons-cube-transparent" @click="scrollToSection(spatialCard)">
          3D view
        </UButton>
        <UButton variant="soft" color="gray" icon="i-heroicons-magnifying-glass-20-solid" @click="scrollToSection(searchCard)">
          Search
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      <UCard ref="pathCard" class="xl:col-span-2 space-y-4 order-2 xl:order-1">
        <template #header>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="space-y-1">
              <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current path</p>
              <div class="flex items-center flex-wrap gap-2 text-sm">
                <UButton
                  color="amber"
                  variant="soft"
                  size="xs"
                  label="Root"
                  @click="selectTrail([])"
                  :ui="{ padding: { sm: 'px-2 py-1' } }"
                />
                <template v-for="(crumb, index) in selectedTrail" :key="crumb + index">
                  <span class="text-gray-400">/</span>
                  <UButton
                    variant="ghost"
                    size="xs"
                    :label="crumb"
                    @click="jumpTo(index)"
                    :ui="{ padding: { sm: 'px-2 py-1' } }"
                  />
                </template>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-wrap" :class="{ 'w-full': isMobile }">
              <UBadge color="gray" variant="soft">{{ datasetSize }} total nodes</UBadge>
              <UInput
                v-model="search"
                placeholder="Search categories (e.g. Laptop, DSLR, Bedding)"
                icon="i-heroicons-magnifying-glass-20-solid"
                :class="isMobile ? 'w-full' : 'min-w-[260px]'"
              />
            </div>
          </div>
        </template>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Children</h3>
            <div v-if="!childNodes.length" class="text-sm text-gray-500 dark:text-gray-400">
              This is a leaf node. Jump to another breadcrumb to continue exploring.
            </div>
            <div class="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1">
              <UCard
                v-for="child in childNodes"
                :key="child.name"
                class="cursor-pointer hover:shadow-sm"
                @click="selectChild(child.name)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ child.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ describe(child.name, child.description) }}</p>
                  </div>
                  <UBadge color="gray" variant="soft">{{ child.children?.length ?? 0 }} children</UBadge>
                </div>
              </UCard>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Node details</h3>
            <UCard>
              <p class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ activeNode?.name ?? 'Root' }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">{{ activeDescription }}</p>
              <div v-if="activeNode?.children?.length" class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Signals</p>
                <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
                  <li>Depth: {{ selectedTrail.length }}</li>
                  <li>Child count: {{ activeNode.children.length }}</li>
                  <li>Leaf previews: {{ leafPaths.length }}</li>
                </ul>
              </div>
              <div v-else class="text-sm text-emerald-700 dark:text-emerald-300">
                You landed on a leaf — try jumping back up or click a badge below to branch elsewhere.
              </div>
            </UCard>
          </div>
        </div>

        <template #footer>
          <div class="space-y-2">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Leaf previews</p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="path in leafPaths"
                :key="path.join('>')"
                color="amber"
                variant="outline"
                class="cursor-pointer"
                @click="selectTrail(path)"
              >
                {{ path.join(' › ') }}
              </UBadge>
            </div>
          </div>
        </template>
      </UCard>

      <UCard ref="spatialCard" class="space-y-4 order-1 xl:order-2">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Spatial view</p>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">3D lattice explorer</h3>
            </div>
            <UBadge color="amber" variant="soft">Click nodes to jump</UBadge>
          </div>
        </template>

        <div
          ref="sceneContainer"
          class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-inner"
          :class="isMobile ? 'min-h-[320px]' : 'min-h-[420px]'"
        ></div>
        <div class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
          <UBadge color="sky" variant="outline">Branch nodes</UBadge>
          <UBadge color="green" variant="outline">Leaf nodes</UBadge>
          <UBadge color="amber" variant="outline">Selected path</UBadge>
          <span class="text-gray-600 dark:text-gray-300">Orbit to inspect; click any sphere to move the breadcrumb.</span>
        </div>
      </UCard>

      <UCard ref="searchCard" class="space-y-3 order-3 xl:order-3">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick find</p>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Search results</h3>
            </div>
            <UBadge color="gray" variant="soft">{{ filteredResults.length }} matches</UBadge>
          </div>
        </template>

        <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          <div v-if="!filteredResults.length" class="text-sm text-gray-500 dark:text-gray-400">
            Type a partial name to surface matching categories.
          </div>
          <UCard
            v-for="result in filteredResults"
            :key="result.path.join('>')"
            class="cursor-pointer hover:shadow-sm"
            @click="selectTrail(result.path)"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ result.node.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ describe(result.node.name, result.node.description) }}</p>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ result.path.join(' › ') }}</div>
              </div>
              <UBadge color="green" variant="outline" v-if="!result.node.children?.length">Leaf</UBadge>
            </div>
          </UCard>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface TaxonomyNode {
  name: string
  description?: string
  children?: TaxonomyNode[]
}

const taxonomy: TaxonomyNode[] = [
  {
    name: 'Electronics',
    children: [
      {
        name: 'TV & Video',
        children: [
          { name: 'Televisions', children: [] },
          { name: 'Projectors', children: [] },
          { name: 'Streaming Media Players', children: [] }
        ]
      },
      {
        name: 'Computers & Accessories',
        children: [
          { name: 'Laptops', children: [] },
          { name: 'Desktops', children: [] },
          { name: 'Monitors', children: [] },
          { name: 'Computer Components', children: [] },
          { name: 'Computer Accessories', children: [] }
        ]
      },
      {
        name: 'Camera & Photo',
        children: [
          { name: 'Digital Cameras', children: [] },
          { name: 'Lenses', children: [] },
          { name: 'Tripods & Monopods', children: [] },
          { name: 'Camera Accessories', children: [] }
        ]
      },
      {
        name: 'Headphones',
        children: [
          { name: 'Over-Ear Headphones', children: [] },
          { name: 'In-Ear Headphones', children: [] },
          { name: 'True Wireless Earbuds', children: [] },
          { name: 'Noise-Cancelling Headphones', children: [] }
        ]
      },
      {
        name: 'Cell Phones & Accessories',
        children: [
          { name: 'Smartphones', children: [] },
          { name: 'Cases', children: [] },
          { name: 'Chargers & Power Banks', children: [] },
          { name: 'Screen Protectors', children: [] }
        ]
      },
      {
        name: 'Wearable Technology',
        children: [
          { name: 'Smartwatches', children: [] },
          { name: 'Fitness Trackers', children: [] }
        ]
      },
      {
        name: 'Portable Audio & Video',
        children: [
          { name: 'Bluetooth Speakers', children: [] },
          { name: 'MP3 Players', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Computers',
    children: [
      {
        name: 'Laptops',
        children: [
          { name: 'Traditional Laptops', children: [] },
          { name: '2-in-1 Laptops', children: [] },
          { name: 'Gaming Laptops', children: [] }
        ]
      },
      {
        name: 'Desktops',
        children: [
          { name: 'Towers', children: [] },
          { name: 'All-in-One Desktops', children: [] },
          { name: 'Mini PCs', children: [] }
        ]
      },
      {
        name: 'Tablets',
        children: [
          { name: 'Android Tablets', children: [] },
          { name: 'iPad', children: [] },
          { name: 'Windows Tablets', children: [] }
        ]
      },
      {
        name: 'Computer Components',
        children: [
          { name: 'CPUs', children: [] },
          { name: 'Motherboards', children: [] },
          { name: 'Graphics Cards', children: [] },
          { name: 'Memory (RAM)', children: [] },
          { name: 'Storage (SSD & HDD)', children: [] },
          { name: 'Power Supplies', children: [] }
        ]
      },
      {
        name: 'Networking Products',
        children: [
          { name: 'Routers', children: [] },
          { name: 'Mesh WiFi Systems', children: [] },
          { name: 'Switches', children: [] },
          { name: 'Network Adapters', children: [] }
        ]
      },
      {
        name: 'Computer Accessories & Peripherals',
        children: [
          { name: 'Keyboards', children: [] },
          { name: 'Mice', children: [] },
          { name: 'External Hard Drives', children: [] },
          { name: 'USB Hubs', children: [] },
          { name: 'Webcams', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Home & Kitchen',
    children: [
      {
        name: 'Furniture',
        children: [
          { name: 'Living Room Furniture', children: [] },
          { name: 'Bedroom Furniture', children: [] },
          { name: 'Office Furniture', children: [] },
          { name: 'Kitchen & Dining Room Furniture', children: [] }
        ]
      },
      {
        name: 'Bedding',
        children: [
          { name: 'Sheet Sets', children: [] },
          { name: 'Comforters & Sets', children: [] },
          { name: 'Pillows', children: [] },
          { name: 'Mattress Toppers', children: [] }
        ]
      },
      {
        name: 'Kitchen & Dining',
        children: [
          { name: 'Cookware', children: [] },
          { name: 'Small Appliances', children: [] },
          { name: 'Dinnerware & Serveware', children: [] },
          { name: 'Kitchen Storage & Organization', children: [] }
        ]
      },
      {
        name: 'Home Décor',
        children: [
          { name: 'Wall Art', children: [] },
          { name: 'Rugs', children: [] },
          { name: 'Curtains & Shades', children: [] },
          { name: 'Mirrors', children: [] }
        ]
      },
      {
        name: 'Storage & Organization',
        children: [
          { name: 'Closet Organizers', children: [] },
          { name: 'Shelving & Storage Units', children: [] },
          { name: 'Laundry Storage', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Tools & Home Improvement',
    children: [
      {
        name: 'Power Tools',
        children: [
          { name: 'Drills', children: [] },
          { name: 'Saws', children: [] },
          { name: 'Sanders', children: [] },
          { name: 'Power Tool Combo Kits', children: [] }
        ]
      },
      {
        name: 'Hand Tools',
        children: [
          { name: 'Screwdrivers', children: [] },
          { name: 'Wrenches', children: [] },
          { name: 'Hammers', children: [] },
          { name: 'Pliers', children: [] }
        ]
      },
      {
        name: 'Electrical',
        children: [
          { name: 'Smart Home Devices', children: [] },
          { name: 'Extension Cords', children: [] },
          { name: 'Surge Protectors', children: [] }
        ]
      },
      {
        name: 'Lighting & Ceiling Fans',
        children: [
          { name: 'Ceiling Lights', children: [] },
          { name: 'Table Lamps', children: [] },
          { name: 'Outdoor Lighting', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Clothing, Shoes & Jewelry',
    children: [
      {
        name: 'Women',
        children: [
          { name: 'Clothing', children: [] },
          { name: 'Shoes', children: [] },
          { name: 'Jewelry', children: [] },
          { name: 'Handbags & Wallets', children: [] }
        ]
      },
      {
        name: 'Men',
        children: [
          { name: 'Clothing', children: [] },
          { name: 'Shoes', children: [] },
          { name: 'Watches', children: [] },
          { name: 'Accessories', children: [] }
        ]
      },
      {
        name: 'Girls',
        children: [
          { name: 'Clothing', children: [] },
          { name: 'Shoes', children: [] },
          { name: 'Jewelry', children: [] }
        ]
      },
      {
        name: 'Boys',
        children: [
          { name: 'Clothing', children: [] },
          { name: 'Shoes', children: [] },
          { name: 'Accessories', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Sports & Outdoors',
    children: [
      {
        name: 'Exercise & Fitness',
        children: [
          { name: 'Cardio Training', children: [] },
          { name: 'Strength Training', children: [] },
          { name: 'Yoga', children: [] },
          { name: 'Fitness Technology', children: [] }
        ]
      },
      {
        name: 'Outdoor Recreation',
        children: [
          { name: 'Camping & Hiking', children: [] },
          { name: 'Cycling', children: [] },
          { name: 'Water Sports', children: [] },
          { name: 'Climbing', children: [] }
        ]
      },
      {
        name: 'Fan Shop',
        children: [
          { name: 'Team Apparel', children: [] },
          { name: 'Collectibles', children: [] }
        ]
      }
    ]
  },
  {
    name: 'Toys & Games',
    children: [
      { name: 'Action Figures & Statues', children: [] },
      { name: 'Building Toys', children: [] },
      { name: 'Dolls & Accessories', children: [] },
      {
        name: 'Games',
        children: [
          { name: 'Board Games', children: [] },
          { name: 'Card Games', children: [] }
        ]
      },
      { name: 'Learning & Education', children: [] }
    ]
  },
  {
    name: 'Books',
    children: [
      { name: 'Literature & Fiction', children: [] },
      { name: 'Mystery, Thriller & Suspense', children: [] },
      { name: 'Science Fiction & Fantasy', children: [] },
      { name: 'Biographies & Memoirs', children: [] },
      { name: "Children's Books", children: [] },
      { name: 'Business & Money', children: [] },
      { name: 'Computers & Technology', children: [] }
    ]
  },
  {
    name: 'Movies & TV',
    children: [
      { name: 'Blu-ray', children: [] },
      { name: 'DVD', children: [] },
      { name: 'Streaming Video', children: [] }
    ]
  },
  {
    name: 'Music, CDs & Vinyl',
    children: [
      { name: 'CDs', children: [] },
      { name: 'Vinyl', children: [] },
      { name: 'Digital Music', children: [] }
    ]
  },
  {
    name: 'Grocery & Gourmet Food',
    children: [
      { name: 'Beverages', children: [] },
      { name: 'Snacks', children: [] },
      { name: 'Pantry Staples', children: [] },
      { name: 'Breakfast Foods', children: [] }
    ]
  },
  {
    name: 'Health & Household',
    children: [
      { name: 'Vitamins & Supplements', children: [] },
      { name: 'Household Supplies', children: [] },
      { name: 'Medical Supplies & Equipment', children: [] }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    children: [
      { name: 'Makeup', children: [] },
      { name: 'Skin Care', children: [] },
      { name: 'Hair Care', children: [] },
      { name: 'Fragrance', children: [] }
    ]
  },
  {
    name: 'Baby',
    children: [
      { name: 'Strollers', children: [] },
      { name: 'Car Seats', children: [] },
      { name: 'Nursery', children: [] },
      { name: 'Feeding', children: [] }
    ]
  },
  {
    name: 'Pet Supplies',
    children: [
      { name: 'Dogs', children: [] },
      { name: 'Cats', children: [] },
      { name: 'Fish & Aquatic Pets', children: [] },
      { name: 'Small Animals', children: [] }
    ]
  },
  {
    name: 'Automotive',
    children: [
      { name: 'Car Care', children: [] },
      { name: 'Interior Accessories', children: [] },
      { name: 'Exterior Accessories', children: [] },
      { name: 'Replacement Parts', children: [] }
    ]
  },
  {
    name: 'Industrial & Scientific',
    children: [
      { name: 'Test, Measure & Inspect', children: [] },
      { name: 'Lab & Scientific Products', children: [] },
      { name: 'Professional Medical Supplies', children: [] }
    ]
  },
  {
    name: 'Office Products',
    children: [
      { name: 'Office Supplies', children: [] },
      { name: 'School Supplies', children: [] },
      { name: 'Office Electronics', children: [] }
    ]
  },
  {
    name: 'Video Games',
    children: [
      { name: 'PlayStation', children: [] },
      { name: 'Xbox', children: [] },
      { name: 'Nintendo', children: [] },
      { name: 'PC Gaming', children: [] }
    ]
  },
  {
    name: 'Garden & Outdoor',
    children: [
      { name: 'Grills & Outdoor Cooking', children: [] },
      { name: 'Patio Furniture & Accessories', children: [] },
      { name: 'Gardening', children: [] }
    ]
  }
]

const search = ref('')
const selectedTrail = ref<string[]>([])

const flatten = (nodes: TaxonomyNode[], trail: string[] = []) => {
  const results: { node: TaxonomyNode; path: string[] }[] = []
  for (const node of nodes) {
    const path = [...trail, node.name]
    results.push({ node, path })
    if (node.children?.length) {
      results.push(...flatten(node.children, path))
    }
  }
  return results
}

const allResults = computed(() => flatten(taxonomy))
const datasetSize = computed(() => allResults.value.length)

const activeNode = computed(() => {
  let nodes = taxonomy
  let current: TaxonomyNode | undefined

  for (const segment of selectedTrail.value) {
    current = nodes.find((n) => n.name === segment)
    if (!current) return undefined
    nodes = current.children ?? []
  }

  return current
})

const activeDescription = computed(() => {
  if (activeNode.value?.description) return activeNode.value.description
  const name = activeNode.value?.name ?? 'Root'
  return selectedTrail.value.length
    ? `${name} node from the provided Amazon taxonomy.`
    : 'Starting point for the taxonomy walk.'
})

const childNodes = computed(() => activeNode.value?.children ?? taxonomy)

const leafPaths = computed(() => {
  const leaves: string[][] = []

  const traverse = (nodes: TaxonomyNode[], path: string[]) => {
    for (const node of nodes) {
      const nextPath = [...path, node.name]
      if (!node.children?.length) {
        leaves.push(nextPath)
      } else {
        traverse(node.children, nextPath)
      }
    }
  }

  traverse(activeNode.value?.children ?? taxonomy, selectedTrail.value)
  return leaves.slice(0, 25)
})

const filteredResults = computed(() => {
  if (!search.value.trim()) return []

  const query = search.value.toLowerCase()
  return allResults.value.filter((entry) => entry.node.name.toLowerCase().includes(query)).slice(0, 25)
})

const selectChild = (name: string) => {
  selectedTrail.value = [...selectedTrail.value, name]
}

const selectTrail = (trail: string[]) => {
  selectedTrail.value = trail
}

const jumpTo = (index: number) => {
  selectedTrail.value = selectedTrail.value.slice(0, index + 1)
}

const describe = (name: string, description?: string) => description ?? `${name} node from the provided Amazon taxonomy.`

// --- Mobile helpers ---
const isMobile = ref(false)
const pathCard = ref<HTMLElement | null>(null)
const spatialCard = ref<HTMLElement | null>(null)
const searchCard = ref<HTMLElement | null>(null)

const updateMobileState = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < 768
}

const scrollToSection = (element: HTMLElement | null) => {
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// --- Three.js lattice explorer ---
const sceneContainer = ref<HTMLElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let animationFrame = 0
let cleanupCallbacks: Array<() => void> = []
const taxonomyGroup = new THREE.Group()
const nodeMeshes = new Map<string, THREE.Mesh>()

interface LayoutNode {
  path: string[]
  parentKey: string | null
  depth: number
  position?: THREE.Vector3
  isLeaf: boolean
}

const pathKey = (path: string[]) => (path.length ? path.join(' / ') : 'Root')

const buildLayout = () => {
  const layout: LayoutNode[] = []

  const walk = (nodes: TaxonomyNode[], depth: number, trail: string[], parent: string | null) => {
    for (const node of nodes) {
      const path = [...trail, node.name]
      const entry: LayoutNode = {
        path,
        parentKey: parent,
        depth,
        isLeaf: !node.children?.length
      }
      layout.push(entry)
      if (node.children?.length) {
        walk(node.children, depth + 1, path, pathKey(path))
      }
    }
  }

  walk(taxonomy, 0, [], 'Root')

  const depthBuckets = new Map<number, LayoutNode[]>()
  for (const node of layout) {
    const bucket = depthBuckets.get(node.depth) ?? []
    bucket.push(node)
    depthBuckets.set(node.depth, bucket)
  }

  for (const [depth, nodes] of depthBuckets.entries()) {
    const angleStep = (Math.PI * 2) / nodes.length
    const radius = 6 + depth * 6
    nodes.forEach((node, index) => {
      const angle = index * angleStep + depth * 0.35
      node.position = new THREE.Vector3(
        Math.cos(angle) * radius,
        (depth - 1) * 1.6,
        Math.sin(angle) * radius
      )
    })
  }

  return layout
}

const highlightSelection = (trail: string[]) => {
  const currentKey = pathKey(trail)
  const pathKeys = new Set<string>()

  if (trail.length) {
    for (let i = 0; i < trail.length; i++) {
      pathKeys.add(pathKey(trail.slice(0, i + 1)))
    }
  }
  pathKeys.add('Root')

  nodeMeshes.forEach((mesh, key) => {
    const isActive = pathKeys.has(key) || key === currentKey
    const isLeaf = mesh.userData.isLeaf as boolean
    const baseColor = isLeaf ? '#22c55e' : '#38bdf8'
    const activeColor = '#f59e0b'

    const material = mesh.material as THREE.MeshStandardMaterial
    material.color = new THREE.Color(isActive ? activeColor : baseColor)
    material.emissive = new THREE.Color(isActive ? '#b45309' : '#0f172a')
    mesh.scale.setScalar(isActive ? 1.3 : 1)
  })
}

const disposeScene = () => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (controls) controls.dispose()
  cleanupCallbacks.forEach((fn) => fn())
  cleanupCallbacks = []
  if (renderer) {
    renderer.dispose()
    renderer.domElement?.remove()
  }
  nodeMeshes.clear()
  taxonomyGroup.clear()
  scene = null
  camera = null
  controls = null
  renderer = null
}

const buildScene = () => {
  if (!sceneContainer.value) return
  disposeScene()

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0f172a')
  const height = isMobile.value ? 320 : 440
  camera = new THREE.PerspectiveCamera(55, sceneContainer.value.clientWidth / height, 0.1, 1000)
  camera.position.set(0, 10, 26)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(sceneContainer.value.clientWidth, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  sceneContainer.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0, 0)

  const ambient = new THREE.AmbientLight(0xffffff, 0.9)
  const directional = new THREE.DirectionalLight(0xffffff, 0.45)
  directional.position.set(8, 12, 10)
  scene.add(ambient, directional)

  const rootMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 48, 48),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#b45309', emissiveIntensity: 0.45 })
  )
  rootMesh.position.set(0, -1.6, 0)
  rootMesh.userData = { path: [], isLeaf: false }
  nodeMeshes.set('Root', rootMesh)
  taxonomyGroup.add(rootMesh)

  const layout = buildLayout()
  const positionMap = new Map<string, THREE.Vector3>()
  positionMap.set('Root', rootMesh.position.clone())

  layout.forEach((node) => {
    if (!node.position) return
    const geometry = new THREE.SphereGeometry(node.isLeaf ? 0.55 : 0.75, 36, 36)
    const material = new THREE.MeshStandardMaterial({
      color: node.isLeaf ? '#22c55e' : '#38bdf8',
      emissive: '#0f172a',
      emissiveIntensity: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(node.position)
    mesh.userData = { path: node.path, isLeaf: node.isLeaf }

    positionMap.set(pathKey(node.path), node.position)
    nodeMeshes.set(pathKey(node.path), mesh)
    taxonomyGroup.add(mesh)

    const parentPosition = positionMap.get(node.parentKey ?? 'Root') ?? new THREE.Vector3()
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([parentPosition, node.position])
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.4 })
    )
    taxonomyGroup.add(line)
  })

  const haloGeometry = new THREE.RingGeometry(1.3, 1.6, 32)
  const haloMaterial = new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide, opacity: 0.18, transparent: true })
  const halo = new THREE.Mesh(haloGeometry, haloMaterial)
  halo.rotation.x = Math.PI / 2
  halo.position.copy(rootMesh.position)
  taxonomyGroup.add(halo)

  scene.add(taxonomyGroup)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  const onClick = (event: MouseEvent) => {
    if (!renderer || !camera || !sceneContainer.value) return
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersections = raycaster.intersectObjects(Array.from(nodeMeshes.values()))
    if (intersections.length) {
      const path = intersections[0].object.userData.path as string[] | undefined
      if (path) selectTrail(path)
    }
  }

  renderer.domElement.addEventListener('click', onClick)
  cleanupCallbacks.push(() => renderer?.domElement.removeEventListener('click', onClick))

  const resize = () => {
    updateMobileState()
    if (!sceneContainer.value || !renderer || !camera) return
    const width = sceneContainer.value.clientWidth
    const height = isMobile.value ? 320 : 440
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  window.addEventListener('resize', resize)
  cleanupCallbacks.push(() => window.removeEventListener('resize', resize))

  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    taxonomyGroup.rotation.y += 0.002
    controls?.update()
    renderer?.render(scene as THREE.Scene, camera as THREE.PerspectiveCamera)
  }

  animate()
  highlightSelection(selectedTrail.value)
}

onMounted(() => {
  updateMobileState()
  window.addEventListener('resize', updateMobileState)
  buildScene()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileState)
  disposeScene()
})

watch(selectedTrail, (trail) => {
  highlightSelection(trail)
})
</script>
