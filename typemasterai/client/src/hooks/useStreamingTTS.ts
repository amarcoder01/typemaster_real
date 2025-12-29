import { useCallback, useRef, useState } from 'react';

interface UseStreamingTTSOptions {
  voice?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseStreamingTTSReturn {
  speakStreaming: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BUFFER_SIZE = 4096;

/**
 * Hook for ultra-low latency TTS using Web Audio API streaming
 * Plays PCM audio chunks as they arrive from the server
 * Latency reduced from 3-5s to ~500ms time-to-first-audio
 */
export function useStreamingTTS(options: UseStreamingTTSOptions = {}): UseStreamingTTSReturn {
  const { voice = 'nova', speed = 1.0, onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioBufferQueue = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const scheduledTimeRef = useRef(0);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({
        latencyHint: 'interactive',
        sampleRate: SAMPLE_RATE,
      });
    }
    return audioContextRef.current;
  }, []);

  const cleanup = useCallback(() => {
    sourceNodesRef.current.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Node may already be stopped
      }
    });
    sourceNodesRef.current = [];
    audioBufferQueue.current = [];
    isPlayingRef.current = false;
    scheduledTimeRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  const scheduleBuffer = useCallback((audioContext: AudioContext, floatData: Float32Array) => {
    const audioBuffer = audioContext.createBuffer(CHANNELS, floatData.length, SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(floatData);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    const currentTime = audioContext.currentTime;
    const startTime = Math.max(currentTime, scheduledTimeRef.current);
    
    source.start(startTime);
    scheduledTimeRef.current = startTime + audioBuffer.duration;

    sourceNodesRef.current.push(source);

    source.onended = () => {
      const index = sourceNodesRef.current.indexOf(source);
      if (index > -1) {
        sourceNodesRef.current.splice(index, 1);
      }
    };

    return source;
  }, []);

  const convertPCMToFloat32 = useCallback((pcmData: Uint8Array): Float32Array => {
    const samples = pcmData.length / 2;
    const floatData = new Float32Array(samples);
    const dataView = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);

    for (let i = 0; i < samples; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      floatData[i] = int16 / 32768;
    }

    return floatData;
  }, []);

  const speakStreaming = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    cancel();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      scheduledTimeRef.current = audioContext.currentTime;
      isPlayingRef.current = true;

      const response = await fetch('/api/dictation/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Streaming TTS failed');
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      let isFirstChunk = true;
      let leftoverBytes = new Uint8Array(0);

      setIsSpeaking(true);
      setIsLoading(false);

      if (isFirstChunk) {
        onStart?.();
        isFirstChunk = false;
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        if (!isPlayingRef.current) break;

        const combined = new Uint8Array(leftoverBytes.length + value.length);
        combined.set(leftoverBytes);
        combined.set(value, leftoverBytes.length);

        const usableLength = Math.floor(combined.length / 2) * 2;
        const usableData = combined.slice(0, usableLength);
        leftoverBytes = combined.slice(usableLength);

        if (usableData.length > 0) {
          const floatData = convertPCMToFloat32(usableData);
          scheduleBuffer(audioContext, floatData);
        }
      }

      const lastScheduledTime = scheduledTimeRef.current;
      const waitTime = Math.max(0, (lastScheduledTime - audioContext.currentTime) * 1000);
      
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));

      setIsSpeaking(false);
      onEnd?.();

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsLoading(false);
        setIsSpeaking(false);
        return;
      }

      console.error('Streaming TTS error:', err);
      setError(err.message || 'Streaming TTS failed');
      setIsLoading(false);
      setIsSpeaking(false);
      onError?.(err.message || 'Streaming TTS failed');
      
      // Re-throw to allow caller to handle fallback
      throw err;
    }
  }, [voice, speed, cancel, getAudioContext, convertPCMToFloat32, scheduleBuffer, onStart, onEnd, onError]);

  return {
    speakStreaming,
    cancel,
    isSpeaking,
    isLoading,
    error,
  };
}
