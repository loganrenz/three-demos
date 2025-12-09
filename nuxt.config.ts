export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    public: {
      featureFlags: {
        renderQuality: 'high',
        dictionarySource: 'local',
        analytics: false,
        debugPanel: false
      }
    }
  },
  devServer: {
    port: 6512
  }
})

