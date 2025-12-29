/**
 * Chat Health Monitoring Service
 * 
 * Monitors chat service health and triggers alerts
 * for performance degradation or errors
 */

import { chatMetrics } from "./chat-metrics";

interface HealthAlert {
  level: "info" | "warning" | "critical";
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

class ChatHealthMonitor {
  private alerts: HealthAlert[] = [];
  private readonly MAX_ALERTS = 100;
  
  // Health thresholds
  private readonly THRESHOLDS = {
    avgResponseTime: {
      warning: 5000,  // 5s
      critical: 10000, // 10s
    },
    errorRate: {
      warning: 0.05,  // 5%
      critical: 0.10, // 10%
    },
    cacheHitRate: {
      warning: 0.20,  // Below 20%
      critical: 0.10, // Below 10%
    },
    p95ResponseTime: {
      warning: 8000,  // 8s
      critical: 15000, // 15s
    },
  };

  constructor() {
    // Run health checks every 5 minutes
    setInterval(() => this.runHealthCheck(), 5 * 60000);
  }

  /**
   * Run comprehensive health check
   */
  private runHealthCheck(): void {
    const metrics = chatMetrics.getAggregatedMetrics(60);
    
    // Skip if no data
    if (metrics.totalRequests === 0) {
      return;
    }

    // Check average response time
    if (metrics.avgResponseTime > this.THRESHOLDS.avgResponseTime.critical) {
      this.addAlert({
        level: "critical",
        message: "Average response time critically high",
        metric: "avgResponseTime",
        value: metrics.avgResponseTime,
        threshold: this.THRESHOLDS.avgResponseTime.critical,
      });
    } else if (metrics.avgResponseTime > this.THRESHOLDS.avgResponseTime.warning) {
      this.addAlert({
        level: "warning",
        message: "Average response time elevated",
        metric: "avgResponseTime",
        value: metrics.avgResponseTime,
        threshold: this.THRESHOLDS.avgResponseTime.warning,
      });
    }

    // Check error rate
    if (metrics.errorRate > this.THRESHOLDS.errorRate.critical) {
      this.addAlert({
        level: "critical",
        message: "Error rate critically high",
        metric: "errorRate",
        value: metrics.errorRate,
        threshold: this.THRESHOLDS.errorRate.critical,
      });
    } else if (metrics.errorRate > this.THRESHOLDS.errorRate.warning) {
      this.addAlert({
        level: "warning",
        message: "Error rate elevated",
        metric: "errorRate",
        value: metrics.errorRate,
        threshold: this.THRESHOLDS.errorRate.warning,
      });
    }

    // Check cache hit rate (low is bad)
    if (metrics.cacheHitRate < this.THRESHOLDS.cacheHitRate.critical) {
      this.addAlert({
        level: "critical",
        message: "Cache hit rate critically low",
        metric: "cacheHitRate",
        value: metrics.cacheHitRate,
        threshold: this.THRESHOLDS.cacheHitRate.critical,
      });
    } else if (metrics.cacheHitRate < this.THRESHOLDS.cacheHitRate.warning) {
      this.addAlert({
        level: "warning",
        message: "Cache hit rate low",
        metric: "cacheHitRate",
        value: metrics.cacheHitRate,
        threshold: this.THRESHOLDS.cacheHitRate.warning,
      });
    }

    // Check P95 response time
    if (metrics.p95ResponseTime > this.THRESHOLDS.p95ResponseTime.critical) {
      this.addAlert({
        level: "critical",
        message: "P95 response time critically high",
        metric: "p95ResponseTime",
        value: metrics.p95ResponseTime,
        threshold: this.THRESHOLDS.p95ResponseTime.critical,
      });
    } else if (metrics.p95ResponseTime > this.THRESHOLDS.p95ResponseTime.warning) {
      this.addAlert({
        level: "warning",
        message: "P95 response time elevated",
        metric: "p95ResponseTime",
        value: metrics.p95ResponseTime,
        threshold: this.THRESHOLDS.p95ResponseTime.warning,
      });
    }

    // Log health status
    const status = this.getHealthStatus();
    console.log(`[Health Monitor] Status: ${status.status} (${status.alertCount} alerts)`);
  }

  /**
   * Add health alert
   */
  private addAlert(alert: Omit<HealthAlert, "timestamp">): void {
    const fullAlert: HealthAlert = {
      ...alert,
      timestamp: new Date(),
    };

    this.alerts.push(fullAlert);

    // Trim if exceeding max
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    // Log based on severity
    const logMessage = `[Health Alert] ${alert.level.toUpperCase()}: ${alert.message} (${alert.metric}: ${alert.value.toFixed(2)} > ${alert.threshold.toFixed(2)})`;
    
    if (alert.level === "critical") {
      console.error(logMessage);
    } else if (alert.level === "warning") {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "critical";
    alertCount: number;
    recentAlerts: HealthAlert[];
  } {
    const now = Date.now();
    const recentWindow = 15 * 60000; // Last 15 minutes
    
    const recentAlerts = this.alerts.filter(
      a => now - a.timestamp.getTime() < recentWindow
    );

    const criticalCount = recentAlerts.filter(a => a.level === "critical").length;
    const warningCount = recentAlerts.filter(a => a.level === "warning").length;

    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (criticalCount > 0) {
      status = "critical";
    } else if (warningCount > 2) {
      status = "degraded";
    }

    return {
      status,
      alertCount: recentAlerts.length,
      recentAlerts: recentAlerts.slice(-10), // Last 10 alerts
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(limit: number = 50): HealthAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    console.log("[Health Monitor] Alerts cleared");
  }
}

// Singleton instance
export const chatHealthMonitor = new ChatHealthMonitor();

export default chatHealthMonitor;

