import { storage } from "./storage";
import { raceCache } from "./race-cache";

interface CleanupStats {
  totalCleaned: number;
  lastCleanup: Date | null;
  waitingCleaned: number;
  countdownCleaned: number;
  racingCleaned: number;
}

const CLEANUP_INTERVAL_MS = 60 * 1000; // Run cleanup every minute
const WAITING_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for waiting races (increased from 10)
const COUNTDOWN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for countdown races (increased from 2)
const RACING_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes for racing races (increased from 30)
const FINISHED_RETENTION_MS = 24 * 60 * 60 * 1000; // Keep finished races for 24 hours

// Callback to check if race has active WebSocket connections
let hasActiveConnectionsCallback: ((raceId: number) => boolean) | null = null;

class RaceCleanupScheduler {
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private stats: CleanupStats = {
    totalCleaned: 0,
    lastCleanup: null,
    waitingCleaned: 0,
    countdownCleaned: 0,
    racingCleaned: 0,
  };

  // Allow WebSocket server to register a callback to check for active connections
  setActiveConnectionsChecker(callback: (raceId: number) => boolean) {
    hasActiveConnectionsCallback = callback;
  }

  initialize() {
    this.cleanupTimer = setInterval(() => {
      this.runCleanup();
    }, CLEANUP_INTERVAL_MS);
    
    // Delay initial cleanup to allow WebSocket connections to establish
    setTimeout(() => {
      this.runCleanup();
    }, 30000); // Wait 30 seconds instead of 5

    console.log("[RaceCleanup] Scheduler initialized");
  }

  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async runCleanup(): Promise<void> {
    if (this.isRunning) {
      return; // Skip silently if already running
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const staleRaces = await storage.getStaleRaces(
        WAITING_TIMEOUT_MS,
        COUNTDOWN_TIMEOUT_MS,
        RACING_TIMEOUT_MS
      );

      let cleaned = 0;
      let skippedActive = 0;

      for (const race of staleRaces) {
        try {
          // CRITICAL: Skip races that have active WebSocket connections
          if (hasActiveConnectionsCallback && hasActiveConnectionsCallback(race.id)) {
            skippedActive++;
            continue; // Don't clean races with active players
          }
          
          // Also skip races in cache (they're likely still active)
          const cachedRace = raceCache.getRace(race.id);
          if (cachedRace && cachedRace.race.status !== "finished") {
            skippedActive++;
            continue;
          }
          
          // Double-check race age before cleaning (prevent timezone issues)
          const raceAge = Date.now() - new Date(race.createdAt).getTime();
          const minAge = race.status === "waiting" ? WAITING_TIMEOUT_MS :
                         race.status === "countdown" ? COUNTDOWN_TIMEOUT_MS :
                         race.status === "racing" ? RACING_TIMEOUT_MS : 0;
          
          if (raceAge < minAge) {
            console.log(`[RaceCleanup] Skipping race ${race.id} - not old enough (age: ${Math.round(raceAge/1000)}s, need: ${Math.round(minAge/1000)}s)`);
            continue;
          }
          
          console.log(`[RaceCleanup] Cleaning stale race ${race.id} (status: ${race.status}, age: ${Math.round(raceAge/60000)}min)`);
          await storage.updateRaceStatus(race.id, "finished", undefined, new Date());
          
          raceCache.deleteRace(race.id);

          cleaned++;

          if (race.status === "waiting") this.stats.waitingCleaned++;
          else if (race.status === "countdown") this.stats.countdownCleaned++;
          else if (race.status === "racing") this.stats.racingCleaned++;

        } catch (error) {
          console.error(`[RaceCleanup] Failed to clean race ${race.id}:`, error);
        }
      }

      const oldFinished = await storage.cleanupOldFinishedRaces(FINISHED_RETENTION_MS);

      if (cleaned > 0 || oldFinished > 0) {
        console.log(`[RaceCleanup] Cleaned ${cleaned} stale races, ${oldFinished} old finished races, skipped ${skippedActive} active races in ${Date.now() - startTime}ms`);
      }

      this.stats.totalCleaned += cleaned + oldFinished;
      this.stats.lastCleanup = new Date();

    } catch (error) {
      console.error("[RaceCleanup] Cleanup failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  getStats(): CleanupStats {
    return { ...this.stats };
  }

  async forceCleanup(): Promise<void> {
    await this.runCleanup();
  }
}

export const raceCleanupScheduler = new RaceCleanupScheduler();
