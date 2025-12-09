<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">Back</UButton>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Merch taxonomy</p>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Amazon Taxonomy Investigator</h2>
        <p class="text-gray-600 dark:text-gray-300">
          Follow category paths, double-check destinations, and spot where leaf nodes live without losing your place.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UCard class="lg:col-span-2 space-y-4">
        <template #header>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
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
            <UInput
              v-model="search"
              placeholder="Search categories (e.g. Laptop, DSLR, Bedding)"
              icon="i-heroicons-magnifying-glass-20-solid"
              class="min-w-[260px]"
            />
          </div>
        </template>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Children</h3>
            <div v-if="!childNodes.length" class="text-sm text-gray-500 dark:text-gray-400">
              This is a leaf node. Jump to another breadcrumb to continue exploring.
            </div>
            <div class="grid grid-cols-1 gap-2">
              <UCard
                v-for="child in childNodes"
                :key="child.name"
                class="cursor-pointer hover:shadow-sm"
                @click="selectChild(child.name)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ child.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ child.description }}</p>
                  </div>
                  <UBadge color="gray" variant="soft">{{ (child.children?.length ?? 0) }} children</UBadge>
                </div>
              </UCard>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Node details</h3>
            <UCard>
              <p class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ activeNode?.name ?? 'Root' }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">{{ activeNode?.description ?? 'Starting point for the taxonomy walk.' }}</p>
              <div v-if="activeNode?.examples?.length" class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Examples</p>
                <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
                  <li v-for="item in activeNode.examples" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div v-if="activeNode?.children?.length" class="mt-4 space-y-1">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Signals</p>
                <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
                  <li>Depth: {{ selectedTrail.length }}</li>
                  <li>Child count: {{ activeNode.children.length }}</li>
                  <li>Leaf paths: {{ leafPaths.length }}</li>
                </ul>
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

      <UCard class="space-y-3">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick find</p>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Search results</h3>
            </div>
            <UBadge color="gray" variant="soft">{{ filteredResults.length }} matches</UBadge>
          </div>
        </template>

        <div class="space-y-2">
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
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ result.node.description }}</p>
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
import { computed, ref } from 'vue'

interface TaxonomyNode {
  name: string
  description: string
  children?: TaxonomyNode[]
  examples?: string[]
}

const taxonomy: TaxonomyNode[] = [
  {
    name: 'Electronics',
    description: 'Devices, components, and accessories built around silicon.',
    children: [
      {
        name: 'Computers & Tablets',
        description: 'Laptops, desktops, and tablet form factors.',
        examples: ['MacBook Air', 'Chromebooks', 'Mini PCs'],
        children: [
          { name: 'Laptops', description: 'Clamshell and 2-in-1 portables.', examples: ['Ultrabooks', 'Gaming laptops'] },
          { name: 'Desktops', description: 'Towers, all-in-ones, and micro PCs.', examples: ['Prebuilt towers', 'Barebones kits'] },
          { name: 'Tablets', description: 'Touch-first slabs.', examples: ['Fire tablets', 'iPads'] }
        ]
      },
      {
        name: 'Audio',
        description: 'Listening gear and recording helpers.',
        examples: ['Noise-cancelling headphones', 'Podcast microphones'],
        children: [
          { name: 'Headphones', description: 'In-ear, over-ear, and wireless options.' },
          { name: 'Speakers', description: 'Bluetooth, smart, and bookshelf speakers.' },
          { name: 'Studio', description: 'Interfaces, mixers, and monitors.' }
        ]
      },
      {
        name: 'Cameras & Photo',
        description: 'Capture tools for stills and video.',
        examples: ['Mirrorless kits', 'Action cameras'],
        children: [
          { name: 'DSLR & Mirrorless', description: 'Interchangeable lens bodies and bundles.' },
          { name: 'Lenses', description: 'Primes, zooms, and specialty glass.' },
          { name: 'Lighting', description: 'Continuous and strobe solutions.' }
        ]
      }
    ]
  },
  {
    name: 'Home & Kitchen',
    description: 'Everything for daily living spaces.',
    children: [
      {
        name: 'Bedding',
        description: 'Sleep systems and linens.',
        children: [
          { name: 'Sheets', description: 'Percale, sateen, and performance fabric sets.' },
          { name: 'Comforters', description: 'Down, down-alternative, and quilts.' },
          { name: 'Pillows', description: 'Support pillows, foam, and specialty shapes.' }
        ]
      },
      {
        name: 'Kitchen',
        description: 'Prep, cook, and storage tools.',
        children: [
          { name: 'Cookware', description: 'Pots, pans, and heat-ready sets.' },
          { name: 'Small Appliances', description: 'Air fryers, blenders, and espresso machines.' },
          { name: 'Storage & Organization', description: 'Pantry bins, meal prep containers.' }
        ]
      },
      {
        name: 'Furniture',
        description: 'Foundational pieces for each room.',
        children: [
          { name: 'Living Room', description: 'Sofas, sectionals, and accent chairs.' },
          { name: 'Office', description: 'Desks, task chairs, and storage.' },
          { name: 'Bedroom', description: 'Beds, nightstands, and dressers.' }
        ]
      }
    ]
  },
  {
    name: 'Fashion',
    description: 'Apparel and accessories for every season.',
    children: [
      {
        name: 'Women',
        description: 'Ready-to-wear and essentials.',
        children: [
          { name: 'Dresses', description: 'Casual, work, and occasion dresses.' },
          { name: 'Activewear', description: 'Leggings, sports bras, and performance tops.' },
          { name: 'Shoes', description: 'Flats, heels, sneakers, and boots.' }
        ]
      },
      {
        name: 'Men',
        description: 'Wardrobe staples and seasonal picks.',
        children: [
          { name: 'Denim', description: 'Jeans across fits and rises.' },
          { name: 'Outerwear', description: 'Insulated, rain, and lightweight jackets.' },
          { name: 'Footwear', description: 'Work boots, sneakers, and dress shoes.' }
        ]
      },
      {
        name: 'Accessories',
        description: 'The finishing details.',
        children: [
          { name: 'Bags', description: 'Backpacks, totes, and crossbody styles.' },
          { name: 'Jewelry', description: 'Everyday and statement pieces.' },
          { name: 'Watches', description: 'Analog, digital, and smartwatches.' }
        ]
      }
    ]
  },
  {
    name: 'Sports & Outdoors',
    description: 'Gear for training, trail, and travel.',
    children: [
      {
        name: 'Fitness',
        description: 'Strength, cardio, and recovery.',
        children: [
          { name: 'Cardio Equipment', description: 'Treadmills, bikes, and rowers.' },
          { name: 'Strength Training', description: 'Dumbbells, racks, and resistance systems.' },
          { name: 'Recovery', description: 'Massage guns, rollers, and supports.' }
        ]
      },
      {
        name: 'Outdoor Recreation',
        description: 'Adventure-ready picks.',
        children: [
          { name: 'Camping & Hiking', description: 'Tents, packs, and sleeping systems.' },
          { name: 'Cycling', description: 'Bikes, helmets, and maintenance tools.' },
          { name: 'Water Sports', description: 'Paddle boards, kayaks, and PFDs.' }
        ]
      },
      {
        name: 'Team Sports',
        description: 'League and pickup favorites.',
        children: [
          { name: 'Basketball', description: 'Balls, hoops, and training aids.' },
          { name: 'Soccer', description: 'Cleats, goals, and cones.' },
          { name: 'Baseball', description: 'Bats, gloves, and protective gear.' }
        ]
      }
    ]
  },
  {
    name: 'Books',
    description: 'Printed and digital reading categories.',
    children: [
      {
        name: 'Fiction',
        description: 'Stories across genres.',
        children: [
          { name: 'Mystery & Thriller', description: 'Detective, suspense, and crime novels.' },
          { name: 'Science Fiction', description: 'Speculative and futuristic narratives.' },
          { name: 'Literary Fiction', description: 'Character-driven and award-winning titles.' }
        ]
      },
      {
        name: 'Nonfiction',
        description: 'Real-world topics and references.',
        children: [
          { name: 'Biographies', description: 'Life stories and memoirs.' },
          { name: 'Business', description: 'Leadership, management, and strategy.' },
          { name: 'Self-Help', description: 'Habits, productivity, and wellness.' }
        ]
      },
      {
        name: "Children's Books",
        description: 'Board books through young adult.',
        children: [
          { name: 'Picture Books', description: 'Illustrated stories for early readers.' },
          { name: 'Middle Grade', description: 'Chapter books for ages 8-12.' },
          { name: 'Young Adult', description: 'Teen-focused fiction and nonfiction.' }
        ]
      }
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
  return leaves.slice(0, 15)
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
</script>
