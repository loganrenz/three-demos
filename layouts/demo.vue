<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
    <header class="sticky top-0 z-20 bg-slate-950/85 backdrop-blur border-b border-white/5">
      <div class="flex items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white">
          <span aria-hidden="true">←</span>
          <span>All demos</span>
        </NuxtLink>
        <span class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Three.js first</span>
      </div>
    </header>
    <main class="flex-1 px-3 sm:px-6 pb-8">
      <slot />
    </main>
  </div>
</template>
