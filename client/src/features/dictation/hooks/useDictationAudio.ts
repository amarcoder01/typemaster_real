import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useTTSPreloader } from '@/hooks/useTTSPreloader';
import { useStreamingTTS } from '@/hooks/useStreamingTTS';
import { getSpeedRate } from '@shared/dictation-utils';
import { getSavedVoice, saveVoiceSelection } from '../utils/persistence';

interface UseDictationAudioOptions {
  speedLevel: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechError?: (error: string) => void;
}

interface UseDictationAudioReturn {
  speak: (text: string) => void;
  speakStreaming: (text: string) => Promise<void>;
  speakPreloaded: (text: string) => Promise<void>;
  cancel: () => void;
  replay: (text: string) => void;
  preloadAudio: (text: string) => Promise<boolean>;
  isPreloading: boolean;
  hasPreloadedAudio: (text: string) => boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
  
  // Voice management
  voices: SpeechSynthesisVoice[];
  englishVoices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  handleVoiceChange: (voiceUri: string) => void;
  
  // OpenAI TTS
  isUsingOpenAI: boolean;
  setUseOpenAI: (use: boolean) => void;
  openAIVoices: { id: string; name: string }[];
  currentOpenAIVoice: string;
  setOpenAIVoice: (voice: string) => void;
  
  // Current rate
  currentRate: number;
}

/**
 * Hook for managing dictation audio with proper cleanup
 * Handles browser TTS, OpenAI TTS with preloading, and streaming TTS for ultra-low latency
 */
export function useDictationAudio(options: UseDictationAudioOptions): UseDictationAudioReturn {
  const { speedLevel, onSpeechStart, onSpeechEnd, onSpeechError } = options;
  
  const currentRate = getSpeedRate(speedLevel);
  const isMountedRef = useRef(true);
  const speechCallbacksRef = useRef({ onSpeechStart, onSpeechEnd, onSpeechError });
  const [combinedSpeaking, setCombinedSpeaking] = useState(false);
  
  // Update refs when callbacks change
  useEffect(() => {
    speechCallbacksRef.current = { onSpeechStart, onSpeechEnd, onSpeechError };
  }, [onSpeechStart, onSpeechEnd, onSpeechError]);
  
  const {
    speak: baseSpeek,
    cancel: baseCancel,
    isSpeaking: baseSpeaking,
    isSupported,
    error: speechError,
    voices,
    setVoice,
    currentVoice,
    isUsingOpenAI,
    setUseOpenAI,
    openAIVoices,
    setOpenAIVoice,
    currentOpenAIVoice,
  } = useSpeechSynthesis({
    rate: currentRate,
    lang: 'en-US',
  });

  // TTS Preloader for OpenAI (used for replays)
  const preloader = useTTSPreloader({
    voice: currentOpenAIVoice,
    speed: currentRate,
  });

  // Streaming TTS for ultra-low latency first play
  const streaming = useStreamingTTS({
    voice: currentOpenAIVoice,
    speed: currentRate,
    onStart: () => speechCallbacksRef.current.onSpeechStart?.(),
    onEnd: () => speechCallbacksRef.current.onSpeechEnd?.(),
    onError: (err) => speechCallbacksRef.current.onSpeechError?.(err),
  });
  
  // Combined speaking state from all sources
  const isSpeaking = combinedSpeaking || baseSpeaking || preloader.isSpeaking || streaming.isSpeaking;
  const isLoading = preloader.isPreloading || streaming.isLoading;
  
  // Filter English voices
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  // Handle voice change with persistence
  const handleVoiceChange = useCallback((voiceUri: string) => {
    const selectedVoice = voices.find(v => v.voiceURI === voiceUri);
    if (selectedVoice) {
      setVoice(selectedVoice);
      saveVoiceSelection(voiceUri);
    }
  }, [voices, setVoice]);
  
  // Restore saved voice on mount
  useEffect(() => {
    if (voices.length > 0) {
      const savedVoiceURI = getSavedVoice();
      if (savedVoiceURI) {
        const savedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
        if (savedVoice) {
          setVoice(savedVoice);
        }
      }
    }
  }, [voices, setVoice]);
  
  // Track speaking state changes (for non-streaming modes)
  const wasSpeakingRef = useRef(false);
  useEffect(() => {
    // Don't trigger callbacks here for streaming - it handles its own
    const nonStreamingSpeaking = combinedSpeaking || baseSpeaking || preloader.isSpeaking;
    if (nonStreamingSpeaking && !wasSpeakingRef.current) {
      speechCallbacksRef.current.onSpeechStart?.();
    } else if (!nonStreamingSpeaking && wasSpeakingRef.current && !streaming.isSpeaking) {
      speechCallbacksRef.current.onSpeechEnd?.();
    }
    wasSpeakingRef.current = nonStreamingSpeaking;
  }, [combinedSpeaking, baseSpeaking, preloader.isSpeaking, streaming.isSpeaking]);
  
  // Track errors
  useEffect(() => {
    const error = speechError || preloader.error || streaming.error;
    if (error) {
      speechCallbacksRef.current.onSpeechError?.(error);
    }
  }, [speechError, preloader.error, streaming.error]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      baseCancel();
      preloader.cancel();
      preloader.clearCache();
      streaming.cancel();
    };
  }, [baseCancel]);

  // Ultra-low latency streaming speak (plays audio as it arrives)
  // With robust fallback to preloaded/browser TTS if streaming fails
  const speakStreaming = useCallback(async (text: string) => {
    if (!isMountedRef.current) return;
    
    if (isUsingOpenAI) {
      try {
        // Start preloading in parallel for fallback and future replays
        const preloadPromise = preloader.preload(text).catch(() => false);
        
        // Attempt streaming playback
        await streaming.speakStreaming(text);
        
        // If we get here without error, streaming worked
        // Wait for preload to complete in background for replays
        preloadPromise.catch(() => {});
      } catch (streamError) {
        // Try preloaded audio if available
        if (preloader.hasPreloaded(text)) {
          setCombinedSpeaking(true);
          await preloader.playPreloaded(text);
          setCombinedSpeaking(false);
        } else {
          // Last resort: use the legacy non-streaming fetch
          baseSpeek(text);
        }
      }
    } else {
      baseSpeek(text);
    }
  }, [isUsingOpenAI, streaming, preloader, baseSpeek]);

  // Preload audio for a sentence (call this when sentence is fetched)
  const preloadAudio = useCallback(async (text: string): Promise<boolean> => {
    if (!isUsingOpenAI) {
      return true;
    }
    return preloader.preload(text);
  }, [isUsingOpenAI, preloader]);

  // Check if audio is already preloaded
  const hasPreloadedAudio = useCallback((text: string): boolean => {
    if (!isUsingOpenAI) return true;
    return preloader.hasPreloaded(text);
  }, [isUsingOpenAI, preloader]);

  // Speak using preloaded audio (instant playback)
  const speakPreloaded = useCallback(async (text: string) => {
    if (!isMountedRef.current) return;
    
    if (isUsingOpenAI) {
      setCombinedSpeaking(true);
      const success = await preloader.playPreloaded(text);
      setCombinedSpeaking(false);
      
      if (!success) {
        await streaming.speakStreaming(text);
      }
    } else {
      baseSpeek(text);
    }
  }, [isUsingOpenAI, preloader, streaming, baseSpeek]);
  
  // Speak with safety check (legacy method, still fetches on demand)
  const speak = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    baseSpeek(text);
  }, [baseSpeek]);

  // Cancel all audio
  const cancel = useCallback(() => {
    baseCancel();
    preloader.cancel();
    streaming.cancel();
    setCombinedSpeaking(false);
  }, [baseCancel, preloader, streaming]);
  
  // Replay with delay - use preloaded if available, otherwise stream
  const replay = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    cancel();
    setTimeout(() => {
      if (isMountedRef.current) {
        if (isUsingOpenAI && preloader.hasPreloaded(text)) {
          preloader.playPreloaded(text);
        } else if (isUsingOpenAI) {
          streaming.speakStreaming(text);
        } else {
          baseSpeek(text);
        }
      }
    }, 200);
  }, [cancel, baseSpeek, isUsingOpenAI, preloader, streaming]);
  
  return {
    speak,
    speakStreaming,
    speakPreloaded,
    cancel,
    replay,
    preloadAudio,
    isPreloading: preloader.isPreloading,
    hasPreloadedAudio,
    isSpeaking,
    isLoading,
    isSupported,
    error: speechError || preloader.error || streaming.error,
    voices,
    englishVoices,
    currentVoice,
    setVoice,
    handleVoiceChange,
    isUsingOpenAI,
    setUseOpenAI,
    openAIVoices,
    currentOpenAIVoice,
    setOpenAIVoice,
    currentRate,
  };
}
