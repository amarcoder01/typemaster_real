/**
 * React Hook for Real-time Leaderboard Updates via WebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  oldRank?: number;
  wpm: number;
  accuracy: number;
  mode?: number;
  avatarColor?: string;
  isVerified?: boolean;
}

interface LeaderboardUpdate {
  type: 'rank_change' | 'new_entry' | 'score_update';
  mode: string;
  timeframe: string;
  language: string;
  entry: LeaderboardEntry;
  timestamp: number;
}

interface UseLeaderboardWebSocketOptions {
  mode?: string;
  timeframe?: 'all' | 'daily' | 'weekly' | 'monthly';
  language?: string;
  userId?: string;
  enabled?: boolean;
  onUpdate?: (update: LeaderboardUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseLeaderboardWebSocketReturn {
  isConnected: boolean;
  lastUpdate: LeaderboardUpdate | null;
  updates: LeaderboardUpdate[];
  error: Event | null;
  reconnect: () => void;
}

/**
 * Hook to connect to leaderboard WebSocket and receive real-time updates
 */
export function useLeaderboardWebSocket(
  options: UseLeaderboardWebSocketOptions = {}
): UseLeaderboardWebSocketReturn {
  const {
    mode = 'global',
    timeframe = 'all',
    language = 'en',
    userId,
    enabled = true,
    onUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<LeaderboardUpdate | null>(null);
  const [updates, setUpdates] = useState<LeaderboardUpdate[]>([]);
  const [error, setError] = useState<Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}/ws/leaderboard?mode=${mode}&timeframe=${timeframe}&language=${language}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Leaderboard WS] Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe with user ID if available
        if (userId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            userId,
            mode,
            timeframe,
            language,
          }));
        }

        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('[Leaderboard WS] Connection confirmed:', data.clientId);
            return;
          }

          if (data.type === 'pong') {
            return;
          }

          if (data.type === 'leaderboard_update') {
            const update: LeaderboardUpdate = data;
            setLastUpdate(update);
            setUpdates((prev) => [...prev.slice(-49), update]); // Keep last 50 updates
            onUpdate?.(update);
          }
        } catch (err) {
          console.error('[Leaderboard WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Leaderboard WS] Error:', event);
        setError(event);
        onError?.(event);
      };

      ws.onclose = () => {
        console.log('[Leaderboard WS] Disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt to reconnect
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[Leaderboard WS] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };

      // Send periodic pings to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Every 30 seconds

      return () => {
        clearInterval(pingInterval);
      };
    } catch (err) {
      console.error('[Leaderboard WS] Connection failed:', err);
    }
  }, [enabled, mode, timeframe, language, userId, onConnect, onDisconnect, onError, onUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Resubscribe when parameters change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        userId,
        mode,
        timeframe,
        language,
      }));
    }
  }, [mode, timeframe, language, userId]);

  return {
    isConnected,
    lastUpdate,
    updates,
    error,
    reconnect,
  };
}

/**
 * Hook to get real-time rank updates for the current user
 */
export function useUserRankUpdates(
  userId: string | undefined,
  mode: string = 'global',
  timeframe: 'all' | 'daily' | 'weekly' | 'monthly' = 'all',
  language: string = 'en'
): {
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
  lastUpdate: Date | null;
} {
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useLeaderboardWebSocket({
    mode,
    timeframe,
    language,
    userId,
    enabled: !!userId,
    onUpdate: (update) => {
      if (update.entry.userId === userId) {
        setPreviousRank(currentRank);
        setCurrentRank(update.entry.rank);
        setLastUpdate(new Date(update.timestamp));
      }
    },
  });

  const rankChange = currentRank !== null && previousRank !== null
    ? previousRank - currentRank // Positive = moved up, negative = moved down
    : 0;

  return {
    currentRank,
    previousRank,
    rankChange,
    lastUpdate,
  };
}

