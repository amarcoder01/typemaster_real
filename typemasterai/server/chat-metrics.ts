/**
 * Chat Performance Metrics Service
 * 
 * Tracks chat performance metrics for monitoring and optimization
 * 
 * Metrics tracked:
 * - Response times
 * - Search frequency
 * - Cache hit rates
 * - Error rates
 * - Token usage
 */

interface ChatRequestMetric {
  timestamp: number;
  queryType: "knowledge" | "search";
  responseTime: number;
  searchTime?: number;
  cacheHit: boolean;
  modelUsed: string;
  tokensUsed?: number;
  error?: string;
}

interface AggregatedMetrics {
  totalRequests: number;
  avgResponseTime: number;
  searchTriggerRate: number;
  cacheHitRate: number;
  errorRate: number;
  avgTokensUsed: number;
  
  // Breakdown by query type
  knowledgeQueries: number;
  searchQueries: number;
  
  // Performance percentiles
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Time window
  windowStart: Date;
  windowEnd: Date;
}

class ChatMetricsService {
  private metrics: ChatRequestMetric[];
  private readonly MAX_METRICS = 10000; // Keep last 10k requests in memory
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour

  constructor() {
    this.metrics = [];
    
    // Periodic cleanup of old metrics
    setInterval(() => this.cleanupOldMetrics(), this.CLEANUP_INTERVAL);
  }

  /**
   * Track a chat request
   */
  trackChatRequest(metric: {
    queryType: "knowledge" | "search";
    responseTime: number;
    searchTime?: number;
    cacheHit: boolean;
    modelUsed: string;
    tokensUsed?: number;
    error?: string;
  }): void {
    const chatMetric: ChatRequestMetric = {
      timestamp: Date.now(),
      ...metric,
    };

    this.metrics.push(chatMetric);

    // Trim if exceeding max
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log significant events
    if (metric.error) {
      console.error(`[Metrics] Request failed: ${metric.error}`);
    } else if (metric.responseTime > 10000) {
      console.warn(`[Metrics] Slow response: ${metric.responseTime}ms`);
    } else if (metric.cacheHit) {
      console.log(`[Metrics] Cache hit - ${metric.responseTime}ms`);
    }
  }

  /**
   * Get aggregated metrics for a time window
   */
  getAggregatedMetrics(windowMinutes: number = 60): AggregatedMetrics {
    const now = Date.now();
    const windowStart = now - windowMinutes * 60000;
    
    const windowMetrics = this.metrics.filter(m => m.timestamp >= windowStart);
    
    if (windowMetrics.length === 0) {
      return this.getEmptyMetrics();
    }

    // Calculate metrics
    const totalRequests = windowMetrics.length;
    const searchQueries = windowMetrics.filter(m => m.queryType === "search").length;
    const knowledgeQueries = windowMetrics.filter(m => m.queryType === "knowledge").length;
    const cacheHits = windowMetrics.filter(m => m.cacheHit).length;
    const errors = windowMetrics.filter(m => m.error).length;
    
    const responseTimes = windowMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const tokensUsed = windowMetrics.filter(m => m.tokensUsed).map(m => m.tokensUsed!);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgTokensUsed = tokensUsed.length > 0 
      ? tokensUsed.reduce((a, b) => a + b, 0) / tokensUsed.length 
      : 0;

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      searchTriggerRate: searchQueries / totalRequests,
      cacheHitRate: cacheHits / totalRequests,
      errorRate: errors / totalRequests,
      avgTokensUsed: Math.round(avgTokensUsed),
      
      knowledgeQueries,
      searchQueries,
      
      p50ResponseTime: this.getPercentile(responseTimes, 0.50),
      p95ResponseTime: this.getPercentile(responseTimes, 0.95),
      p99ResponseTime: this.getPercentile(responseTimes, 0.99),
      
      windowStart: new Date(windowStart),
      windowEnd: new Date(now),
    };
  }

  /**
   * Get percentile value from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return Math.round(sortedArray[Math.max(0, index)]);
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): AggregatedMetrics {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      searchTriggerRate: 0,
      cacheHitRate: 0,
      errorRate: 0,
      avgTokensUsed: 0,
      knowledgeQueries: 0,
      searchQueries: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      windowStart: new Date(),
      windowEnd: new Date(),
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): Array<{ timestamp: Date; error: string; responseTime: number }> {
    return this.metrics
      .filter(m => m.error)
      .slice(-limit)
      .map(m => ({
        timestamp: new Date(m.timestamp),
        error: m.error!,
        responseTime: m.responseTime,
      }));
  }

  /**
   * Get slow requests
   */
  getSlowRequests(thresholdMs: number = 5000, limit: number = 10): Array<{ 
    timestamp: Date; 
    queryType: string;
    responseTime: number;
    searchTime?: number;
  }> {
    return this.metrics
      .filter(m => m.responseTime > thresholdMs)
      .slice(-limit)
      .map(m => ({
        timestamp: new Date(m.timestamp),
        queryType: m.queryType,
        responseTime: m.responseTime,
        searchTime: m.searchTime,
      }));
  }

  /**
   * Clean up old metrics (keep last 24 hours)
   */
  private cleanupOldMetrics(): void {
    const dayAgo = Date.now() - 24 * 3600000;
    const beforeCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= dayAgo);
    const removed = beforeCount - this.metrics.length;
    
    if (removed > 0) {
      console.log(`[Metrics] Cleaned up ${removed} old metrics`);
    }
  }

  /**
   * Get metrics summary as formatted string
   */
  getSummary(windowMinutes: number = 60): string {
    const metrics = this.getAggregatedMetrics(windowMinutes);
    
    return `
Chat Performance Metrics (Last ${windowMinutes} minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Requests: ${metrics.totalRequests}
├─ Knowledge Queries: ${metrics.knowledgeQueries} (${(metrics.knowledgeQueries / Math.max(1, metrics.totalRequests) * 100).toFixed(1)}%)
└─ Search Queries: ${metrics.searchQueries} (${(metrics.searchTriggerRate * 100).toFixed(1)}%)

Performance:
├─ Avg Response Time: ${metrics.avgResponseTime}ms
├─ P50 Response Time: ${metrics.p50ResponseTime}ms
├─ P95 Response Time: ${metrics.p95ResponseTime}ms
└─ P99 Response Time: ${metrics.p99ResponseTime}ms

Efficiency:
├─ Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%
├─ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%
└─ Avg Tokens Used: ${metrics.avgTokensUsed}

Status: ${this.getStatusEmoji(metrics)}
`;
  }

  /**
   * Get status emoji based on metrics
   */
  private getStatusEmoji(metrics: AggregatedMetrics): string {
    if (metrics.errorRate > 0.05) return "🔴 Critical";
    if (metrics.avgResponseTime > 5000) return "🟡 Degraded";
    if (metrics.p95ResponseTime > 8000) return "🟡 Slow";
    if (metrics.cacheHitRate > 0.3 && metrics.avgResponseTime < 3000) return "🟢 Excellent";
    return "🟢 Healthy";
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics = [];
    console.log("[Metrics] Reset all metrics");
  }
}

// Singleton instance
export const chatMetrics = new ChatMetricsService();

// Log metrics summary every 10 minutes
setInterval(() => {
  const summary = chatMetrics.getSummary(60);
  console.log(summary);
}, 10 * 60000);

export default chatMetrics;

