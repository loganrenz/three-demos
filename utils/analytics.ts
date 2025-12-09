interface AnalyticsEvent {
  name: string
  payload?: Record<string, unknown>
}

export function trackAnalytics(enabled: boolean, event: AnalyticsEvent) {
  if (!enabled) return
  const timestamp = new Date().toISOString()
  console.info(`[analytics ${timestamp}] ${event.name}`, event.payload ?? {})
}
