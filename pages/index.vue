<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
      Welcome to Three.js Demos
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="demo in demos" :key="demo.path" class="cursor-pointer hover:shadow-lg transition-shadow" @click="navigateTo(demo.path)">
        <template #header>
          <h3 class="text-xl font-semibold">{{ demo.title }}</h3>
        </template>
        <p class="text-gray-600 dark:text-gray-400">{{ demo.description }}</p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const demos = [
  {
    title: 'Basic Scene',
    description: 'A simple Three.js scene with a rotating cube',
    path: '/demo/basic-scene'
  },
  {
    title: 'Hydrogen City Pulse Map',
    description: 'A living 3D city powered by invisible hydrogen rivers',
    path: '/demo/hydrogen-city'
  },
  {
    title: 'Procedural Forest with Dynamic Weather',
    description: 'A procedurally generated forest with wind animation, rain, fog, and falling leaves',
    path: '/demo/forest-weather'
  },
  {
    title: 'LexiStack Word Tower',
    description: 'A rising grid word game that mixes Boggle with falling blocks',
    path: '/demo/lexi-stack'
  }
]
</script>

