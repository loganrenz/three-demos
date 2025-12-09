interface AnalyticsEvent {
  name: string
  payload?: Record<string, unknown>
}

/**
 * Track analytics events. Currently logs to console for development.
 * In production, replace console.info with your analytics service (e.g., GA, Mixpanel, etc.)
 */
export function trackAnalytics(enabled: boolean, event: AnalyticsEvent) {
  if (!enabled) return
  const timestamp = new Date().toISOString()
  // TODO: Replace with actual analytics service in production
  console.info(`[analytics ${timestamp}] ${event.name}`, event.payload ?? {})
}
