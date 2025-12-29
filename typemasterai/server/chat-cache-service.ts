import crypto from "crypto";

/**
 * Response Cache Service
 * 
 * Provides in-memory caching for chat responses with fuzzy matching
 * Can be upgraded to Redis for production deployment
 * 
 * Features:
 * - Normalized query matching
 * - Fuzzy matching with Levenshtein distance
 * - TTL-based expiration
 * - LRU eviction
 * - Hit/miss metrics
 */

interface CacheEntry {
  query: string;
  normalizedQuery: string;
  response: string;
  sources?: Array<{ title: string; url: string; snippet: string }>;
  timestamp: number;
  hits: number;
  ttl: number; // milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

class ChatCacheService {
  private cache: Map<string, CacheEntry>;
  private maxEntries: number;
  private hits: number;
  private misses: number;
  
  // TTL values
  private readonly KNOWLEDGE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SEARCH_TTL = 60 * 60 * 1000; // 1 hour
  private readonly DEFAULT_TTL = 6 * 60 * 60 * 1000; // 6 hours
  
  // Fuzzy matching threshold (0-1, where 1 is exact match)
  private readonly FUZZY_THRESHOLD = 0.85;

  constructor(maxEntries: number = 1000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Normalize query for consistent matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Generate cache key from normalized query
   */
  private generateKey(normalizedQuery: string): string {
    return crypto.createHash('md5').update(normalizedQuery).digest('hex');
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Early return for empty strings
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate similarity score (0-1) between two strings
   */
  private similarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshteinDistance(str1, str2);
    return 1.0 - distance / maxLen;
  }

  /**
   * Find similar cached entry using fuzzy matching
   */
  private findSimilarEntry(normalizedQuery: string): CacheEntry | null {
    let bestMatch: CacheEntry | null = null;
    let bestScore = 0;

    const entries = Array.from(this.cache.values());
    for (const entry of entries) {
      // Skip expired entries
      if (Date.now() - entry.timestamp > entry.ttl) {
        continue;
      }

      const score = this.similarity(normalizedQuery, entry.normalizedQuery);
      
      if (score >= this.FUZZY_THRESHOLD && score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= this.FUZZY_THRESHOLD) {
      console.log(`[Cache] Fuzzy match found (similarity: ${(bestScore * 100).toFixed(1)}%)`);
      return bestMatch;
    }

    return null;
  }

  /**
   * Get cached response
   */
  get(query: string): { response: string; sources?: any[] } | null {
    const normalizedQuery = this.normalizeQuery(query);
    const key = this.generateKey(normalizedQuery);

    // Exact match
    const exactEntry = this.cache.get(key);
    if (exactEntry) {
      // Check if expired
      if (Date.now() - exactEntry.timestamp > exactEntry.ttl) {
        this.cache.delete(key);
        this.misses++;
        console.log("[Cache] MISS (expired)");
        return null;
      }

      exactEntry.hits++;
      this.hits++;
      console.log(`[Cache] HIT (exact) - hits: ${exactEntry.hits}`);
      
      return {
        response: exactEntry.response,
        sources: exactEntry.sources,
      };
    }

    // Fuzzy match
    const similarEntry = this.findSimilarEntry(normalizedQuery);
    if (similarEntry) {
      similarEntry.hits++;
      this.hits++;
      console.log(`[Cache] HIT (fuzzy) - hits: ${similarEntry.hits}`);
      
      return {
        response: similarEntry.response,
        sources: similarEntry.sources,
      };
    }

    this.misses++;
    console.log("[Cache] MISS");
    return null;
  }

  /**
   * Store response in cache
   */
  set(
    query: string,
    response: string,
    sources?: Array<{ title: string; url: string; snippet: string }>,
    hasSources: boolean = false
  ): void {
    const normalizedQuery = this.normalizeQuery(query);
    const key = this.generateKey(normalizedQuery);

    // Determine TTL based on content type
    let ttl = this.DEFAULT_TTL;
    if (hasSources) {
      ttl = this.SEARCH_TTL; // Shorter TTL for search-based responses
    } else {
      ttl = this.KNOWLEDGE_TTL; // Longer TTL for knowledge-based responses
    }

    // Check time-sensitive keywords (shorter TTL)
    const timeSensitiveKeywords = ['latest', 'current', 'today', 'recent', 'news', '2024', '2025'];
    if (timeSensitiveKeywords.some(kw => normalizedQuery.includes(kw))) {
      ttl = Math.min(ttl, this.SEARCH_TTL);
    }

    const entry: CacheEntry = {
      query,
      normalizedQuery,
      response,
      sources,
      timestamp: Date.now(),
      hits: 0,
      ttl,
    };

    // LRU eviction if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    console.log(`[Cache] SET (TTL: ${(ttl / 3600000).toFixed(1)}h) - total entries: ${this.cache.size}`);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      // Prefer evicting entries with low hits and old timestamp
      const score = entry.timestamp - (entry.hits * 60000); // Favor frequently accessed entries
      
      if (score < lruTime) {
        lruTime = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log("[Cache] LRU eviction - freed space");
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[Cache] Cleanup: removed ${expiredCount} expired entries`);
    }
  }

  /**
   * Warm up cache with common queries
   */
  warmup(entries: Array<{ query: string; response: string; sources?: any[] }>): void {
    console.log(`[Cache] Warming up with ${entries.length} entries`);
    for (const entry of entries) {
      this.set(entry.query, entry.response, entry.sources, !!entry.sources);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log("[Cache] Cleared all entries");
  }

  /**
   * Invalidate specific query
   */
  invalidate(query: string): boolean {
    const normalizedQuery = this.normalizeQuery(query);
    const key = this.generateKey(normalizedQuery);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      console.log("[Cache] Invalidated entry");
    }
    
    return deleted;
  }
}

// Singleton instance
export const chatCache = new ChatCacheService(1000);

// Pre-warm cache with common typing questions
const commonTypingQuestions = [
  {
    query: "How can I improve my typing speed?",
    response: `## Improving Your Typing Speed

### Essential Techniques

1. **Master Touch Typing**
   - Learn proper finger placement on home row (ASDF JKL;)
   - Practice without looking at keyboard
   - Use all 10 fingers consistently

2. **Focus on Accuracy First**
   - Speed comes naturally with accuracy
   - Aim for 98%+ accuracy before pushing speed
   - Slow down if error rate increases

3. **Practice Deliberately**
   - 15-30 minutes daily is better than occasional long sessions
   - Focus on weak keys and combinations
   - Use typing.com, Keybr, or TypeRacer

4. **Optimize Your Setup**
   - Proper posture: feet flat, back straight, wrists neutral
   - Screen at eye level
   - Quality keyboard that feels comfortable

5. **Build Muscle Memory**
   - Repeat common words and patterns
   - Practice real-world content (code, writing)
   - Gradual progression: accuracy → speed → endurance

> **Pro Tip**: Track your progress weekly. Most people can increase from 40 WPM to 60+ WPM in 2-3 months with consistent practice.

### Common Mistakes to Avoid
- Don't look at the keyboard
- Don't rush before you're accurate
- Don't practice tired or frustrated
- Don't skip warm-up exercises`,
  },
  {
    query: "What is touch typing?",
    response: `## Touch Typing

**Touch typing** is a typing technique where you type without looking at the keyboard, using muscle memory to find keys by feel rather than sight.

### Key Principles

1. **Home Row Position**
   - Left hand: A, S, D, F
   - Right hand: J, K, L, ;
   - Index fingers rest on F and J (with tactile bumps)

2. **Finger Zones**
   - Each finger is responsible for specific keys
   - Fingers return to home row after each keystroke
   - Thumbs rest on spacebar

3. **No Looking**
   - Eyes stay on screen or source material
   - Rely on tactile feedback and muscle memory
   - Trust finger positioning

### Benefits
- **Speed**: 60-80+ WPM achievable vs 30-40 WPM hunt-and-peck
- **Accuracy**: Fewer errors with consistent technique
- **Efficiency**: Less mental effort, more focus on content
- **Health**: Better posture, reduced strain

### Learning Curve
- Week 1-2: Learning finger positions (slow)
- Week 3-4: Building muscle memory (awkward)
- Month 2-3: Matching old speed
- Month 3+: Exceeding old speed

> Most people can learn touch typing basics in 2-4 weeks with 20-30 minutes daily practice.`,
  },
];

// Warm up cache on module load
chatCache.warmup(commonTypingQuestions);

export default chatCache;

