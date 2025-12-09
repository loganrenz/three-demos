import { onBeforeUnmount, ref, watchEffect, type Ref } from 'vue'

export interface RuntimeDiagnostics {
  fps: Ref<number>
  memory: Ref<number | null>
  validationFailures: Ref<string[]>
  recordFrame: () => void
  logValidationFailure: (message: string) => void
}

export function useRuntimeDiagnostics(enabled: Ref<boolean>): RuntimeDiagnostics {
  const fps = ref(0)
  const memory = ref<number | null>(null)
  const validationFailures = ref<string[]>([])

  let frameCount = 0
  let lastSample = performance.now()
  let timer: number | null = null

  const recordFrame = () => {
    frameCount += 1
  }

  const logValidationFailure = (message: string) => {
    validationFailures.value = [...validationFailures.value, message]
  }

  const sampleMetrics = () => {
    const now = performance.now()
    const delta = now - lastSample
    if (delta > 0) {
      fps.value = Math.round((frameCount / delta) * 1000)
    }
    frameCount = 0
    lastSample = now

    const performanceMemory = (performance as Performance & {
      memory?: { usedJSHeapSize?: number }
    }).memory
    if (performanceMemory?.usedJSHeapSize) {
      memory.value = performanceMemory.usedJSHeapSize
    }
  }

  const start = () => {
    if (timer !== null) return
    frameCount = 0
    lastSample = performance.now()
    timer = window.setInterval(sampleMetrics, 1000)
  }

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  watchEffect(() => {
    if (enabled.value) {
      start()
    } else {
      stop()
    }
  })

  onBeforeUnmount(() => stop())

  return {
    fps,
    memory,
    validationFailures,
    recordFrame,
    logValidationFailure
  }
}
