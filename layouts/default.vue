<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <UContainer>
      <header class="py-6 border-b border-gray-200 dark:border-gray-800">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Three.js Demos
        </h1>
      </header>
      <main class="py-8">
        <slot />
      </main>
    </UContainer>
  </div>
</template>

