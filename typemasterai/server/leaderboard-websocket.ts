/**
 * Real-time Leaderboard WebSocket Service
 * Broadcasts leaderboard updates to connected clients
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface LeaderboardClient {
  ws: WebSocket;
  userId?: string;
  timeframe: 'all' | 'daily' | 'weekly' | 'monthly';
  language: string;
  mode: string; // 'global', 'code', 'stress', etc.
  lastActivity: number;
}

interface LeaderboardUpdate {
  type: 'rank_change' | 'new_entry' | 'score_update';
  mode: string;
  timeframe: string;
  language: string;
  entry: {
    userId: string;
    username: string;
    rank: number;
    oldRank?: number;
    wpm: number;
    accuracy: number;
    mode?: number;
    avatarColor?: string;
    isVerified?: boolean;
  };
}

class LeaderboardWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, LeaderboardClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/leaderboard',
      perMessageDeflate: false,
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      
      const client: LeaderboardClient = {
        ws,
        timeframe: (url.searchParams.get('timeframe') as any) || 'all',
        language: url.searchParams.get('language') || 'en',
        mode: url.searchParams.get('mode') || 'global',
        lastActivity: Date.now(),
      };

      this.clients.set(clientId, client);
      console.log(`[Leaderboard WS] Client connected: ${clientId} (mode: ${client.mode}, timeframe: ${client.timeframe})`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message, client);
        } catch (error) {
          console.error('[Leaderboard WS] Invalid message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[Leaderboard WS] Client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error('[Leaderboard WS] Client error:', error);
        this.clients.delete(clientId);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: Date.now(),
      }));
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log('[Leaderboard WS] WebSocket service initialized');
  }

  private generateClientId(): string {
    return `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(clientId: string, message: any, client: LeaderboardClient): void {
    const { type, userId, timeframe, language, mode } = message;

    switch (type) {
      case 'subscribe':
        // Update client subscription
        if (timeframe) client.timeframe = timeframe;
        if (language) client.language = language;
        if (mode) client.mode = mode;
        if (userId) client.userId = userId;
        client.lastActivity = Date.now();
        
        console.log(`[Leaderboard WS] Client ${clientId} subscribed to ${mode}/${timeframe}/${language}`);
        break;

      case 'ping':
        client.lastActivity = Date.now();
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        console.warn(`[Leaderboard WS] Unknown message type: ${type}`);
    }
  }

  /**
   * Broadcast a leaderboard update to relevant clients
   */
  broadcastUpdate(update: LeaderboardUpdate): void {
    if (!this.wss) return;

    const { mode, timeframe, language } = update;
    let broadcastCount = 0;

    this.clients.forEach((client) => {
      // Only send to clients subscribed to this mode/timeframe/language
      if (
        client.mode === mode &&
        (client.timeframe === timeframe || timeframe === 'all') &&
        client.language === language
      ) {
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(JSON.stringify({
              ...update,
              timestamp: Date.now(),
            }));
            broadcastCount++;
          } catch (error) {
            console.error('[Leaderboard WS] Broadcast error:', error);
          }
        }
      }
    });

    if (broadcastCount > 0) {
      console.log(`[Leaderboard WS] Broadcast update to ${broadcastCount} clients (${mode}/${timeframe}/${language})`);
    }
  }

  /**
   * Broadcast rank change for a specific user
   */
  broadcastRankChange(
    userId: string,
    username: string,
    mode: string,
    timeframe: string,
    language: string,
    newRank: number,
    oldRank: number,
    wpm: number,
    accuracy: number,
    additionalData?: any
  ): void {
    this.broadcastUpdate({
      type: 'rank_change',
      mode,
      timeframe,
      language,
      entry: {
        userId,
        username,
        rank: newRank,
        oldRank,
        wpm,
        accuracy,
        ...additionalData,
      },
    });
  }

  /**
   * Broadcast new leaderboard entry
   */
  broadcastNewEntry(
    userId: string,
    username: string,
    mode: string,
    timeframe: string,
    language: string,
    rank: number,
    wpm: number,
    accuracy: number,
    additionalData?: any
  ): void {
    this.broadcastUpdate({
      type: 'new_entry',
      mode,
      timeframe,
      language,
      entry: {
        userId,
        username,
        rank,
        wpm,
        accuracy,
        ...additionalData,
      },
    });
  }

  /**
   * Start heartbeat to keep connections alive and clean up dead ones
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > timeout) {
          console.log(`[Leaderboard WS] Closing inactive client: ${clientId}`);
          client.ws.close();
          this.clients.delete(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get service statistics
   */
  getStats(): {
    connectedClients: number;
    subscriptions: Record<string, number>;
  } {
    const subscriptions: Record<string, number> = {};

    this.clients.forEach((client) => {
      const key = `${client.mode}/${client.timeframe}/${client.language}`;
      subscriptions[key] = (subscriptions[key] || 0) + 1;
    });

    return {
      connectedClients: this.clients.size,
      subscriptions,
    };
  }

  /**
   * Shutdown the WebSocket service
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    console.log('[Leaderboard WS] Service shutdown complete');
  }
}

export const leaderboardWS = new LeaderboardWebSocketService();
export type { LeaderboardUpdate, LeaderboardClient };

