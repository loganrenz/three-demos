import { computed } from 'vue'

export type RenderQuality = 'low' | 'medium' | 'high'
export type DictionarySource = 'local' | 'extended'

export interface FeatureFlags {
  renderQuality: RenderQuality
  dictionarySource: DictionarySource
  analytics: boolean
  debugPanel: boolean
}

function toBoolean(value: string | string[] | boolean | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => toBoolean(entry))
  }
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
  }
  return false
}

function resolveRenderQuality(value: unknown): RenderQuality {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }
  return 'high'
}

function resolveDictionarySource(value: unknown): DictionarySource {
  if (value === 'extended') return 'extended'
  return 'local'
}

export function useFeatureFlags() {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()

  return computed<FeatureFlags>(() => {
    const publicFlags = runtimeConfig.public.featureFlags || {}
    const renderQuality = resolveRenderQuality(
      route.query.quality ?? publicFlags.renderQuality
    )
    const dictionarySource = resolveDictionarySource(
      route.query.dictionary ?? publicFlags.dictionarySource
    )
    const analytics = toBoolean(route.query.analytics ?? publicFlags.analytics)
    const debugPanel = toBoolean(route.query.debug ?? publicFlags.debugPanel)

    return {
      renderQuality,
      dictionarySource,
      analytics,
      debugPanel
    }
  })
}
