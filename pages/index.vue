<template>
  <div class="space-y-8">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="space-y-2">
        <p class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Demo container</p>
        <h2 class="text-3xl font-semibold text-gray-900 dark:text-white">Three.js + systems lab</h2>
        <p class="text-gray-600 dark:text-gray-300 max-w-2xl">
          Jump between experiments without stale state or console noise. Each card opens a standalone
          Nuxt page so you can explore, come back, and continue from where you left off.
        </p>
        <div class="flex gap-2 flex-wrap">
          <UBadge color="gray" variant="solid">{{ demos.length }} demos</UBadge>
          <UBadge color="cyan" variant="outline">No shared scene state</UBadge>
          <UBadge color="violet" variant="outline">Client-only rendering</UBadge>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="demo in demos"
        :key="demo.slug"
        class="hover:shadow-lg transition-shadow h-full"
      >
        <NuxtLink :to="`/demo/${demo.slug}`" class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ labels[demo.category] }}</p>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ demo.title }}</h3>
            </div>
            <UBadge v-if="demo.tags?.length" :color="demo.accent ?? 'gray'" variant="soft">
              {{ demo.tags[0] }}
            </UBadge>
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-3">{{ demo.description }}</p>
          <div class="flex gap-2 flex-wrap">
            <UBadge
              v-for="tag in demo.tags?.slice(1)"
              :key="tag"
              :color="demo.accent ?? 'gray'"
              variant="outline"
            >
              {{ tag }}
            </UBadge>
          </div>
        </NuxtLink>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { demoList } from '@/utils/demoList'

const labels = {
  '3d-world': '3D world',
  simulation: 'Simulation',
  puzzle: 'Puzzle',
  taxonomy: 'Taxonomy tool'
}

const demos = demoList
</script>
