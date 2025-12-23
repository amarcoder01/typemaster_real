import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useTTSPreloader } from '@/hooks/useTTSPreloader';
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
  speakPreloaded: (text: string) => Promise<void>;
  cancel: () => void;
  replay: (text: string) => void;
  preloadAudio: (text: string) => Promise<boolean>;
  isPreloading: boolean;
  hasPreloadedAudio: (text: string) => boolean;
  isSpeaking: boolean;
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
 * Handles both browser TTS and OpenAI TTS with audio preloading support
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

  // TTS Preloader for OpenAI
  const preloader = useTTSPreloader({
    voice: currentOpenAIVoice,
    speed: currentRate,
  });
  
  // Combined speaking state from both sources
  const isSpeaking = combinedSpeaking || baseSpeaking || preloader.isSpeaking;
  
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
  
  // Track speaking state changes
  const wasSpeakingRef = useRef(false);
  useEffect(() => {
    if (isSpeaking && !wasSpeakingRef.current) {
      speechCallbacksRef.current.onSpeechStart?.();
    } else if (!isSpeaking && wasSpeakingRef.current) {
      speechCallbacksRef.current.onSpeechEnd?.();
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);
  
  // Track errors
  useEffect(() => {
    const error = speechError || preloader.error;
    if (error) {
      speechCallbacksRef.current.onSpeechError?.(error);
    }
  }, [speechError, preloader.error]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      baseCancel();
      preloader.cancel();
      preloader.clearCache();
    };
  }, [baseCancel]);

  // Preload audio for a sentence (call this when sentence is fetched)
  const preloadAudio = useCallback(async (text: string): Promise<boolean> => {
    if (!isUsingOpenAI) {
      return true;
    }
    console.log('[DictationAudio] Preloading audio for:', text.substring(0, 50) + '...');
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
        console.log('[DictationAudio] Preloaded playback failed, falling back to direct speech');
        baseSpeek(text);
      }
    } else {
      baseSpeek(text);
    }
  }, [isUsingOpenAI, preloader, baseSpeek]);
  
  // Speak with safety check (legacy method, still fetches on demand)
  const speak = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    baseSpeek(text);
  }, [baseSpeek]);

  // Cancel all audio
  const cancel = useCallback(() => {
    baseCancel();
    preloader.cancel();
    setCombinedSpeaking(false);
  }, [baseCancel, preloader]);
  
  // Replay with delay
  const replay = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    cancel();
    setTimeout(() => {
      if (isMountedRef.current) {
        if (isUsingOpenAI && preloader.hasPreloaded(text)) {
          preloader.playPreloaded(text);
        } else {
          baseSpeek(text);
        }
      }
    }, 200);
  }, [cancel, baseSpeek, isUsingOpenAI, preloader]);
  
  return {
    speak,
    speakPreloaded,
    cancel,
    replay,
    preloadAudio,
    isPreloading: preloader.isPreloading,
    hasPreloadedAudio,
    isSpeaking,
    isSupported,
    error: speechError || preloader.error,
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
