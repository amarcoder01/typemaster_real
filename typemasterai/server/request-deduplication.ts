import crypto from "crypto";

/**
 * Request Deduplication Service
 * 
 * Prevents duplicate API calls for identical concurrent requests
 * Implements request coalescing - multiple identical requests share a single API call
 * 
 * Features:
 * - Hash-based request identification
 * - Promise sharing for concurrent requests
 * - Automatic cleanup after completion
 * - Timeout handling for stuck requests
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  waiters: number;
}

class RequestDeduplicationService {
  private pendingRequests: Map<string, PendingRequest<any>>;
  private readonly REQUEST_TIMEOUT = 60000; // 60 seconds

  constructor() {
    this.pendingRequests = new Map();
    
    // Cleanup stuck requests every 30 seconds
    setInterval(() => this.cleanupStuckRequests(), 30000);
  }

  /**
   * Generate hash for request deduplication
   */
  private generateRequestHash(query: string, context?: string[]): string {
    const content = context && context.length > 0 
      ? `${query}::${context.join('|')}`
      : query;
    
    return crypto.createHash('md5').update(content.toLowerCase().trim()).digest('hex');
  }

  /**
   * Get or create a deduplicated request
   * 
   * @param query - The user query
   * @param generator - Function that generates the response
   * @param context - Optional conversation context for more specific deduplication
   * @returns Promise that resolves to the response
   */
  async getDedupedResponse<T>(
    query: string,
    generator: () => Promise<T>,
    context?: string[]
  ): Promise<T> {
    const hash = this.generateRequestHash(query, context);
    
    // Check if request is already in progress
    const existing = this.pendingRequests.get(hash);
    if (existing) {
      existing.waiters++;
      console.log(`[Dedup] Request already in progress (${existing.waiters} waiters) - hash: ${hash.substring(0, 8)}`);
      return existing.promise;
    }

    // Create new request
    console.log(`[Dedup] New request - hash: ${hash.substring(0, 8)}`);
    const promise = generator();
    
    const pendingRequest: PendingRequest<T> = {
      promise,
      timestamp: Date.now(),
      waiters: 0,
    };

    this.pendingRequests.set(hash, pendingRequest);

    // Cleanup after completion (success or failure)
    promise
      .then((result) => {
        console.log(`[Dedup] Request completed (${pendingRequest.waiters} waiters served) - hash: ${hash.substring(0, 8)}`);
        return result;
      })
      .catch((error) => {
        console.error(`[Dedup] Request failed - hash: ${hash.substring(0, 8)}`, error);
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(hash);
      });

    return promise;
  }

  /**
   * Clean up requests that have been stuck for too long
   */
  private cleanupStuckRequests(): void {
    const now = Date.now();
    let cleanedCount = 0;

    const entries = Array.from(this.pendingRequests.entries());
    for (const [hash, request] of entries) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        console.warn(`[Dedup] Cleaning up stuck request - hash: ${hash.substring(0, 8)}`);
        this.pendingRequests.delete(hash);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Dedup] Cleaned up ${cleanedCount} stuck requests`);
    }
  }

  /**
   * Get statistics about pending requests
   */
  getStats(): { pendingRequests: number; totalWaiters: number } {
    let totalWaiters = 0;
    
    const requests = Array.from(this.pendingRequests.values());
    for (const request of requests) {
      totalWaiters += request.waiters;
    }

    return {
      pendingRequests: this.pendingRequests.size,
      totalWaiters,
    };
  }

  /**
   * Clear all pending requests (for testing/reset)
   */
  clear(): void {
    this.pendingRequests.clear();
    console.log("[Dedup] Cleared all pending requests");
  }
}

// Singleton instance
export const requestDedup = new RequestDeduplicationService();

export default requestDedup;

