import { useCallback, useRef, useState } from 'react';

interface PreloadedAudio {
  text: string;
  audioUrl: string;
  audioBlob: Blob;
  timestamp: number;
}

interface UseTTSPreloaderOptions {
  voice?: string;
  speed?: number;
  maxCacheSize?: number;
  cacheExpiryMs?: number;
}

interface UseTTSPreloaderReturn {
  preload: (text: string) => Promise<boolean>;
  playPreloaded: (text: string) => Promise<boolean>;
  hasPreloaded: (text: string) => boolean;
  isPreloading: boolean;
  preloadProgress: number;
  clearCache: () => void;
  cancel: () => void;
  isSpeaking: boolean;
  error: string | null;
}

const CACHE_EXPIRY_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 10;

export function useTTSPreloader(options: UseTTSPreloaderOptions = {}): UseTTSPreloaderReturn {
  const { 
    voice = 'nova', 
    speed = 1.0, 
    maxCacheSize = MAX_CACHE_SIZE,
    cacheExpiryMs = CACHE_EXPIRY_MS 
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, PreloadedAudio>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((text: string) => {
    return `${text.trim().toLowerCase()}|${voice}|${speed}`;
  }, [voice, speed]);

  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    const entries = Array.from(cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > cacheExpiryMs) {
        URL.revokeObjectURL(entry.audioUrl);
        cache.delete(key);
      }
    }

    while (cache.size > maxCacheSize) {
      const keys = Array.from(cache.keys());
      const oldestKey = keys[0];
      if (oldestKey) {
        const entry = cache.get(oldestKey);
        if (entry) {
          URL.revokeObjectURL(entry.audioUrl);
        }
        cache.delete(oldestKey);
      }
    }
  }, [cacheExpiryMs, maxCacheSize]);

  const hasPreloaded = useCallback((text: string): boolean => {
    const key = getCacheKey(text);
    const entry = cacheRef.current.get(key);
    
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > cacheExpiryMs) {
      URL.revokeObjectURL(entry.audioUrl);
      cacheRef.current.delete(key);
      return false;
    }
    
    return true;
  }, [getCacheKey, cacheExpiryMs]);

  const preload = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;
    
    const key = getCacheKey(text);
    
    if (hasPreloaded(text)) {
      return true;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsPreloading(true);
    setPreloadProgress(0);
    setError(null);

    try {
      setPreloadProgress(10);

      const response = await fetch('/api/dictation/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice,
          speed,
        }),
        signal: controller.signal,
      });

      setPreloadProgress(50);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.fallback) {
          setIsPreloading(false);
          return false;
        }
        throw new Error(data.message || 'TTS preload failed');
      }

      setPreloadProgress(70);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setPreloadProgress(90);

      cleanupExpiredCache();

      cacheRef.current.set(key, {
        text: text.trim(),
        audioUrl,
        audioBlob,
        timestamp: Date.now(),
      });

      setPreloadProgress(100);
      setIsPreloading(false);
      abortControllerRef.current = null;

      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsPreloading(false);
        return false;
      }

      console.error('TTS preload error:', err);
      setError(err.message || 'Failed to preload audio');
      setIsPreloading(false);
      abortControllerRef.current = null;
      return false;
    }
  }, [getCacheKey, hasPreloaded, voice, speed, cleanupExpiredCache]);

  const playPreloaded = useCallback(async (text: string): Promise<boolean> => {
    const key = getCacheKey(text);
    const entry = cacheRef.current.get(key);

    if (!entry) {
      console.log('[TTS Preloader] No preloaded audio found, fetching now...');
      const preloaded = await preload(text);
      if (!preloaded) return false;
      return playPreloaded(text);
    }

    if (Date.now() - entry.timestamp > cacheExpiryMs) {
      URL.revokeObjectURL(entry.audioUrl);
      cacheRef.current.delete(key);
      const preloaded = await preload(text);
      if (!preloaded) return false;
      return playPreloaded(text);
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(entry.audioUrl);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          resolve(true);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setError('Audio playback failed');
          resolve(false);
        };

        setIsSpeaking(true);
        setError(null);
        audio.play().catch((err) => {
          console.error('Audio play error:', err);
          setIsSpeaking(false);
          setError('Failed to play audio');
          resolve(false);
        });
      });
    } catch (err) {
      console.error('Play preloaded error:', err);
      setIsSpeaking(false);
      return false;
    }
  }, [getCacheKey, preload, cacheExpiryMs]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPreloading(false);
    setIsSpeaking(false);
  }, []);

  const clearCache = useCallback(() => {
    const entries = Array.from(cacheRef.current.values());
    for (const entry of entries) {
      URL.revokeObjectURL(entry.audioUrl);
    }
    cacheRef.current.clear();
  }, []);

  return {
    preload,
    playPreloaded,
    hasPreloaded,
    isPreloading,
    preloadProgress,
    clearCache,
    cancel,
    isSpeaking,
    error,
  };
}
