/**
 * Prometheus Metrics for Feedback System
 */

export class FeedbackMetrics {
  private metrics = {
    feedbackSubmitted: 0,
    feedbackProcessed: 0,
    feedbackResolved: 0,
    adminActionsTotal: 0,
    aiProcessingTime: [] as number[],
    apiResponseTime: [] as number[],
  };

  recordFeedbackSubmitted(): void {
    this.metrics.feedbackSubmitted++;
  }

  recordFeedbackProcessed(): void {
    this.metrics.feedbackProcessed++;
  }

  recordFeedbackResolved(): void {
    this.metrics.feedbackResolved++;
  }

  recordAdminAction(): void {
    this.metrics.adminActionsTotal++;
  }

  recordAIProcessingTime(duration: number): void {
    this.metrics.aiProcessingTime.push(duration);
    if (this.metrics.aiProcessingTime.length > 1000) {
      this.metrics.aiProcessingTime.shift();
    }
  }

  recordAPIResponseTime(duration: number): void {
    this.metrics.apiResponseTime.push(duration);
    if (this.metrics.apiResponseTime.length > 1000) {
      this.metrics.apiResponseTime.shift();
    }
  }

  getMetrics() {
    const avgAITime = this.metrics.aiProcessingTime.length > 0
      ? this.metrics.aiProcessingTime.reduce((a, b) => a + b, 0) / this.metrics.aiProcessingTime.length
      : 0;

    const avgAPITime = this.metrics.apiResponseTime.length > 0
      ? this.metrics.apiResponseTime.reduce((a, b) => a + b, 0) / this.metrics.apiResponseTime.length
      : 0;

    return {
      feedback_submitted_total: this.metrics.feedbackSubmitted,
      feedback_processed_total: this.metrics.feedbackProcessed,
      feedback_resolved_total: this.metrics.feedbackResolved,
      admin_actions_total: this.metrics.adminActionsTotal,
      ai_processing_time_avg_ms: avgAITime,
      api_response_time_avg_ms: avgAPITime,
    };
  }
}

export const feedbackMetrics = new FeedbackMetrics();

