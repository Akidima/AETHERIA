// Analytics Service - Track user interactions
// Sends events to backend for aggregation

const API_URL = import.meta.env.VITE_API_URL || '';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL);
  }

  // Track an event
  track(event: string, properties?: Record<string, any>): void {
    this.queue.push({
      event,
      properties,
      timestamp: new Date().toISOString(),
    });

    // Auto-flush when batch is full
    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }

  // Flush events to backend
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          events.map(e => ({
            ...e,
            sessionId: this.sessionId,
          }))
        ),
      });
    } catch (error) {
      // Re-queue events on failure (up to a limit)
      if (this.queue.length < 100) {
        this.queue = [...events, ...this.queue];
      }
    }
  }

  // Predefined event trackers
  trackPageView(page: string): void {
    this.track('page_view', { page });
  }

  trackInterpretation(input: string, success: boolean): void {
    this.track('interpretation', {
      input_length: input.length,
      success,
      // Don't store actual input for privacy
    });
  }

  trackShare(shareId: string): void {
    this.track('share_created', { shareId });
  }

  trackFeatureUse(feature: string): void {
    this.track('feature_use', { feature });
  }

  trackAuth(action: 'login' | 'logout' | 'signup', provider?: string): void {
    this.track('auth', { action, provider });
  }

  trackError(error: string, context?: string): void {
    this.track('error', { error, context });
  }

  // Get session ID for correlation
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// React hook for easy usage
export function useAnalytics() {
  return analytics;
}
