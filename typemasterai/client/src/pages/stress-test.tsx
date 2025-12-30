import { useState, useEffect, useRef, useCallback, useMemo, memo, useLayoutEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Zap, Trophy, Volume2, VolumeX, AlertTriangle, Clock, Target, Flame, XCircle, Timer, BarChart3, RefreshCw, Home, LogIn, WifiOff, Award, X, ChevronRight, Play, Sparkles, Eye, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { calculateWPM, calculateAccuracy } from '@/lib/typing-utils';
import { useAuth } from '@/lib/auth-context';
import { useNetwork } from '@/lib/network-context';
import { StressCertificate } from '@/components/StressCertificate';
import { TormentGrid, type TormentType } from '@/components/TormentIndicator';
import { TormentsMatrix } from '@/components/TormentsMatrix';

type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'nightmare' | 'impossible';

interface StressEffects {
  screenShake: boolean;
  distractions: boolean;
  sounds: boolean;
  speedIncrease: boolean;
  limitedVisibility: boolean;
  colorShift: boolean;
  gravity: boolean;
  rotation: boolean;
  glitch: boolean;
  textFade: boolean;
  reverseText: boolean;
  randomJumps: boolean;
  screenInvert: boolean;
  zoomChaos: boolean;
  screenFlip: boolean;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, {
  name: string;
  description: string;
  effects: StressEffects;
  duration: number;
  icon: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  baseShakeIntensity: number;
  particleFrequency: number;
  multiplier: number;
  difficulty: string;
  maxBlur?: number;
  blurPulse?: boolean;
  constantBlur?: number;
  blurPulseSpeed?: number;
  realityDistortion?: boolean;
  chromaticAberration?: boolean;
  textScramble?: boolean;
  multiEffectCombos?: boolean;
  extremeChaosWaves?: boolean;
  doubleVision?: boolean;
  textWarp?: boolean;
  chaosIntensityMultiplier?: number;
}> = {
  beginner: {
    name: 'Warm-Up',
    description: 'Light screen shake and distractions',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: false,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
    duration: 30,
    icon: '🔥',
    color: '#f59e0b',
    accentColor: 'amber',
    bgGradient: 'from-amber-500/10 to-orange-500/5',
    baseShakeIntensity: 3,
    particleFrequency: 0.15,
    multiplier: 1,
    difficulty: 'Easy',
  },
  intermediate: {
    name: 'Mind Scrambler',
    description: 'Screen inverts, zoom chaos begins',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: false,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: false,
    },
    duration: 45,
    icon: '⚡',
    color: '#a855f7',
    accentColor: 'purple',
    bgGradient: 'from-purple-500/10 to-pink-500/5',
    baseShakeIntensity: 8,
    particleFrequency: 0.3,
    multiplier: 2,
    difficulty: 'Medium',
  },
  expert: {
    name: 'Absolute Mayhem',
    description: 'Screen flips, glitches everywhere',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
    duration: 60,
    icon: '💀',
    color: '#ef4444',
    accentColor: 'red',
    bgGradient: 'from-red-500/10 to-orange-500/5',
    baseShakeIntensity: 25,
    particleFrequency: 0.7,
    multiplier: 3,
    difficulty: 'Hard',
  },
  nightmare: {
    name: 'Nightmare Realm',
    description: 'Text reverses, blur pulses',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: true,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: true,
      textFade: false,
      reverseText: true,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
    duration: 90,
    icon: '☠️',
    color: '#f43f5e',
    accentColor: 'rose',
    bgGradient: 'from-rose-500/10 to-red-900/5',
    baseShakeIntensity: 8,
    particleFrequency: 0.3,
    multiplier: 4,
    difficulty: 'Extreme',
    maxBlur: 1.8,
    blurPulse: true,
    constantBlur: 0.3,
    blurPulseSpeed: 0.1,
  },
  impossible: {
    name: 'IMPOSSIBLE',
    description: 'ALL effects active - reality breaks',
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: true,
      randomJumps: true,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
    duration: 120,
    icon: '🌀',
    color: '#d946ef',
    accentColor: 'fuchsia',
    bgGradient: 'from-fuchsia-500/10 to-purple-900/5',
    baseShakeIntensity: 25,
    particleFrequency: 0.8,
    multiplier: 5,
    difficulty: 'Legendary',
    maxBlur: 3.5,
    blurPulse: true,
    constantBlur: 0.8,
    blurPulseSpeed: 0.2,
    realityDistortion: true,
    chromaticAberration: true,
    textScramble: true,
    multiEffectCombos: true,
    extremeChaosWaves: true,
    doubleVision: true,
    textWarp: true,
    chaosIntensityMultiplier: 1,
  },
};

const STRESS_SENTENCES = [
  "The quick brown fox jumps over the lazy dog while the world shakes violently around you.",
  "In the midst of chaos, only the focused mind prevails against impossible odds.",
  "Type through the storm, embrace the madness, and prove your worth as a master typist.",
  "Your fingers dance on keys while reality itself trembles and distorts before your eyes.",
  "Focus is everything when the screen becomes your worst enemy in this battle of wills.",
  "When the world falls apart around you, let your fingers find their rhythm in the chaos.",
  "Every keystroke is a victory against the madness that surrounds your screen tonight.",
  "The storm rages but your hands remain steady on the keyboard through it all.",
  "Through glitch and shake, through flash and fade, the determined typist perseveres.",
  "Master the chaos or be consumed by it - there is no middle ground here for you.",
  "Concentration is your shield against the visual assault of this stress test.",
  "Let the screen shake, let the colors shift - your typing will not falter today.",
  "In darkness and confusion, the skilled typist finds clarity in each keystroke.",
  "Reality bends and warps but your focus remains unbroken through it all.",
  "The keys beneath your fingers are your only connection to sanity in this storm.",
  "Embrace the chaos, let it flow through you, and emerge victorious on the other side.",
  "Speed and accuracy become one as you type through the visual madness around you.",
  "Your mind is a fortress, your fingers are soldiers, and every word is a victory won.",
  "The screen may flicker and dance but your determination remains absolutely steadfast.",
  "Type like your life depends on it because in this test your score certainly does.",
  "Chaos is merely a ladder for those who refuse to let their focus waver even slightly.",
  "The visual storm is nothing compared to the calm precision of your practiced fingers.",
  "Each character you type correctly is a small triumph against the forces of distraction.",
  "Stay calm, stay focused, and let your muscle memory guide you through this trial.",
];

const generateStressText = (durationSeconds: number): string => {
  const targetCharsPerSecond = 6;
  const targetLength = durationSeconds * targetCharsPerSecond;
  
  const shuffled = [...STRESS_SENTENCES].sort(() => Math.random() - 0.5);
  
  let result = '';
  let sentenceIndex = 0;
  
  while (result.length < targetLength && sentenceIndex < shuffled.length) {
    if (result.length > 0) {
      result += ' ';
    }
    result += shuffled[sentenceIndex];
    sentenceIndex++;
  }
  
  if (result.length < targetLength && shuffled.length > 0) {
    let extraIndex = 0;
    while (result.length < targetLength) {
      result += ' ' + shuffled[extraIndex % shuffled.length];
      extraIndex++;
    }
  }
  
  return result;
};

const MAX_PARTICLES = 20;

interface ParticleData {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
}

const Particle = memo(({ particle }: { particle: ParticleData }) => (
  <div
    className="fixed pointer-events-none text-4xl animate-ping z-50"
    style={{
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      animationDuration: `${particle.speed}s`,
    }}
    aria-hidden="true"
  >
    {particle.emoji}
  </div>
));

Particle.displayName = 'Particle';

let globalAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    if (!globalAudioContext || globalAudioContext.state === 'closed') {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume();
    }
    return globalAudioContext;
  } catch {
    return null;
  }
}

export default function StressTest() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const lastToastTimeRef = useRef<Record<string, number>>({});
  const showDebouncedToast = useCallback((key: string, title: string, description: string, variant: "default" | "destructive" = "default", debounceMs = 2000) => {
    const now = Date.now();
    const lastTime = lastToastTimeRef.current[key] || 0;
    if (now - lastTime > debounceMs) {
      lastToastTimeRef.current[key] = now;
      toast({ title, description, variant });
    }
  }, [toast]);
  
  const { isOnline, isServerReachable, addPendingAction, checkConnection } = useNetwork();
  const [, setLocation] = useLocation();
  const [showCertificate, setShowCertificate] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [lastTestResultId, setLastTestResultId] = useState<number | null>(null);
  const [pendingResultData, setPendingResultData] = useState<{
    difficulty: Difficulty;
    enabledEffects: StressEffects;
    wpm: number;
    accuracy: number;
    errors: number;
    maxCombo: number;
    totalCharacters: number;
    duration: number;
    survivalTime: number;
    completionRate: number;
    stressScore: number;
  } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [currentColor, setCurrentColor] = useState('hsl(0, 0%, 100%)');
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [gravityOffset, setGravityOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [textReversed, setTextReversed] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [backgroundFlash, setBackgroundFlash] = useState(false);
  const [stressLevel, setStressLevel] = useState(0);
  const [screenInverted, setScreenInverted] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [screenFlipped, setScreenFlipped] = useState(false);
  const [comboExplosion, setComboExplosion] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [isClarityWindow, setIsClarityWindow] = useState(false);
  const isClarityWindowRef = useRef(false);
  const [chromaticOffset, setChromaticOffset] = useState({ r: 0, g: 0, b: 0 });
  const [realityWarp, setRealityWarp] = useState(0);
  const [textScrambleActive, setTextScrambleActive] = useState(false);
  const [chaosWaveIntensity, setChaosWaveIntensity] = useState(0);
  const [multiEffectActive, setMultiEffectActive] = useState(false);
  const [doubleVisionOffset, setDoubleVisionOffset] = useState({ x: 0, y: 0 });
  const [textWarpAmount, setTextWarpAmount] = useState(0);
  const blurPulsePhaseRef = useRef(0);
  
  const [finalResults, setFinalResults] = useState<{
    survivalTime: number;
    wpm: number;
    accuracy: number;
    completionRate: number;
    stressScore: number;
    completed: boolean;
  } | null>(null);
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pendingTimeoutsRef = useRef<Map<ReturnType<typeof setTimeout>, boolean>>(new Map());
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clarityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blurIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const testSessionRef = useRef<number>(0);
  const isTestActiveRef = useRef<boolean>(false);
  const particleIdRef = useRef<number>(0);
  const finishTestRef = useRef<(completed: boolean) => void>(() => {});
  const maxComboRef = useRef<number>(0);
  const typedTextRef = useRef<string>('');
  const currentTextRef = useRef<string>('');
  const errorsRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const selectedDifficultyRef = useRef<Difficulty | null>(null);
  const completedRef = useRef<boolean>(false);
  const stressLevelRef = useRef<number>(0);
  const configRef = useRef<typeof DIFFICULTY_CONFIGS[Difficulty] | null>(null);

  const config = selectedDifficulty ? DIFFICULTY_CONFIGS[selectedDifficulty] : null;
  
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  useEffect(() => {
    stressLevelRef.current = stressLevel;
  }, [stressLevel]);

  const safeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      pendingTimeoutsRef.current.delete(timeoutId);
      if (isTestActiveRef.current) {
        callback();
      }
    }, delay);
    pendingTimeoutsRef.current.set(timeoutId, true);
    return timeoutId;
  }, []);

  const clearAllTimers = useCallback(() => {
    pendingTimeoutsRef.current.forEach((_, id) => clearTimeout(id));
    pendingTimeoutsRef.current.clear();
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (effectsIntervalRef.current) {
      clearInterval(effectsIntervalRef.current);
      effectsIntervalRef.current = null;
    }
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
      shakeIntervalRef.current = null;
    }
    if (stressIntervalRef.current) {
      clearInterval(stressIntervalRef.current);
      stressIntervalRef.current = null;
    }
    if (clarityIntervalRef.current) {
      clearInterval(clarityIntervalRef.current);
      clarityIntervalRef.current = null;
    }
    if (blurIntervalRef.current) {
      clearInterval(blurIntervalRef.current);
      blurIntervalRef.current = null;
    }
  }, []);

  const resetVisualStates = useCallback(() => {
    setShakeIntensity(0);
    setParticles([]);
    setCurrentColor('hsl(0, 0%, 100%)');
    setBlur(0);
    setRotation(0);
    setGravityOffset(0);
    setGlitchActive(false);
    setTextOpacity(1);
    setTextReversed(false);
    setTextPosition({ x: 0, y: 0 });
    setBackgroundFlash(false);
    setStressLevel(0);
    setScreenInverted(false);
    setZoomScale(1);
    setScreenFlipped(false);
    setComboExplosion(false);
    setShakeOffset({ x: 0, y: 0 });
    setIsClarityWindow(false);
    isClarityWindowRef.current = false;
    setChromaticOffset({ r: 0, g: 0, b: 0 });
    setRealityWarp(0);
    setTextScrambleActive(false);
    setChaosWaveIntensity(0);
    setMultiEffectActive(false);
    setDoubleVisionOffset({ x: 0, y: 0 });
    setTextWarpAmount(0);
    blurPulsePhaseRef.current = 0;
  }, []);

  const playSound = useCallback((type: 'correct' | 'error' | 'combo' | 'chaos') => {
    if (!soundEnabled || prefersReducedMotion) return;
    
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'combo':
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'chaos':
          oscillator.frequency.setValueAtTime(100 + Math.random() * 400, ctx.currentTime);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
      }
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled, prefersReducedMotion]);

  const saveResultMutation = useMutation({
    mutationFn: async (data: {
      difficulty: Difficulty;
      wpm: number;
      accuracy: number;
      errors: number;
      maxCombo: number;
      totalCharacters: number;
      duration: number;
      survivalTime: number;
      completionRate: number;
      stressScore: number;
      enabledEffects: StressEffects;
    }) => {
      const res = await fetch('/api/stress-test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save result');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPendingResultData(null);
      if (data.testResult?.id) {
        setLastTestResultId(data.testResult.id);
      }
      showDebouncedToast('save-success', 'Result Saved!', 'Your stress test score has been recorded.', 'default', 5000);
    },
    onError: (error) => {
      console.error('Failed to save result:', error);
    },
  });

  const retrySave = useCallback(() => {
    if (pendingResultData && isOnline) {
      saveResultMutation.mutate(pendingResultData);
    }
  }, [pendingResultData, isOnline, saveResultMutation]);

  useEffect(() => {
    if (isOnline && pendingResultData && !saveResultMutation.isPending) {
      const retryTimer = setTimeout(() => {
        retrySave();
      }, 2000);
      return () => clearTimeout(retryTimer);
    }
  }, [isOnline, pendingResultData, saveResultMutation.isPending, retrySave]);

  const finishTest = useCallback((completed: boolean) => {
    if (!isTestActiveRef.current) return;
    
    isTestActiveRef.current = false;
    completedRef.current = completed;
    
    clearAllTimers();
    
    const endTime = Date.now();
    const totalTime = startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0;
    const difficulty = selectedDifficultyRef.current;
    const difficultyConfig = difficulty ? DIFFICULTY_CONFIGS[difficulty] : null;
    
    const typed = typedTextRef.current;
    const text = currentTextRef.current;
    const totalErrors = errorsRef.current;
    const bestCombo = maxComboRef.current;
    
    const wpm = calculateWPM(typed.length, totalTime);
    const accuracy = calculateAccuracy(typed.length, totalErrors);
    const completionRate = text.length > 0 ? (typed.length / text.length) * 100 : 0;
    
    const baseScore = wpm * (accuracy / 100) * (completionRate / 100);
    const multiplier = difficultyConfig?.multiplier || 1;
    const comboBonus = bestCombo * 2;
    const stressScore = Math.round((baseScore * multiplier) + comboBonus);
    
    const results = {
      survivalTime: totalTime,
      wpm,
      accuracy,
      completionRate,
      stressScore,
      completed,
    };
    
    setFinalResults(results);
    setIsFinished(true);
    setIsStarted(false);
    resetVisualStates();
    
    if (completed && completionRate >= 100) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    
    if (user && difficulty && difficultyConfig) {
      const resultData = {
        difficulty,
        enabledEffects: difficultyConfig.effects,
        wpm,
        accuracy,
        errors: totalErrors,
        maxCombo: bestCombo,
        totalCharacters: typed.length,
        duration: difficultyConfig.duration,
        survivalTime: totalTime,
        completionRate,
        stressScore,
      };
      
      if (isOnline) {
        saveResultMutation.mutate(resultData);
      } else {
        setPendingResultData(resultData);
        addPendingAction({
          id: `stress-${Date.now()}`,
          type: 'save_stress_test',
          data: resultData,
          timestamp: new Date(),
          retryCount: 0,
        });
        showDebouncedToast('offline-save', 'Saved Offline', 'Your result will sync when you reconnect.', 'default', 5000);
      }
      
      if (completed && completionRate >= 100 && accuracy >= 80) {
        const certDisplayData = {
          testType: 'stress' as const,
          difficulty,
          wpm,
          accuracy,
          stressScore,
          completedAt: new Date().toISOString(),
        };
        setCertificateData(certDisplayData);
        
        // Note: Certificate creation will happen after save succeeds and we have the test result ID
      }
    }
  }, [user, isOnline, addPendingAction, clearAllTimers, resetVisualStates, saveResultMutation, showDebouncedToast]);

  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  const handleStart = useCallback((difficulty: Difficulty) => {
    testSessionRef.current += 1;
    clearAllTimers();
    resetVisualStates();
    
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    const text = generateStressText(diffConfig.duration);
    
    setSelectedDifficulty(difficulty);
    selectedDifficultyRef.current = difficulty;
    setCurrentText(text);
    currentTextRef.current = text;
    setTypedText('');
    typedTextRef.current = '';
    setErrors(0);
    errorsRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    maxComboRef.current = 0;
    setTimeLeft(diffConfig.duration);
    setCountdown(3);
    setIsFinished(false);
    setIsStarted(false);
    setFinalResults(null);
    setShowCertificate(false);
    setCertificateData(null);
    setPendingResultData(null);
    
    const currentSession = testSessionRef.current;
    
    countdownIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        return;
      }
      
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          if (testSessionRef.current === currentSession) {
            isTestActiveRef.current = true;
            setIsStarted(true);
            setStartTime(Date.now());
            startTimeRef.current = Date.now();
            
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearAllTimers, resetVisualStates]);

  useEffect(() => {
    if (!isStarted || isFinished || !config) return;
    
    const currentSession = testSessionRef.current;
    
    timerIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        return;
      }
      
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTestRef.current(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isStarted, isFinished, config]);

  useEffect(() => {
    if (!isStarted || isFinished || !config || prefersReducedMotion) return;
    
    const currentSession = testSessionRef.current;
    
    if (config.effects.screenShake) {
      shakeIntervalRef.current = setInterval(() => {
        if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
        
        const intensity = config.baseShakeIntensity * (1 + stressLevelRef.current / 100);
        setShakeOffset({
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * intensity,
        });
      }, 50);
    }
    
    stressIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
      
      setStressLevel((prev) => Math.min(100, prev + 0.5));
    }, 500);
    
    if (config.effects.limitedVisibility && config.blurPulse) {
      blurIntervalRef.current = setInterval(() => {
        if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
        if (isClarityWindowRef.current) {
          setBlur(0);
          return;
        }
        
        blurPulsePhaseRef.current += config.blurPulseSpeed || 0.1;
        const pulseValue = (Math.sin(blurPulsePhaseRef.current) + 1) / 2;
        const maxBlurValue = config.maxBlur || 2;
        const constantBlur = config.constantBlur || 0;
        const newBlur = constantBlur + pulseValue * (maxBlurValue - constantBlur);
        setBlur(newBlur);
      }, 100);
    }
    
    effectsIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
      
      const cfg = configRef.current;
      if (!cfg) return;
      
      if (cfg.effects.distractions && Math.random() < cfg.particleFrequency) {
        const emojis = ['💥', '⚡', '🔥', '💫', '✨', '🌟', '💢', '🎯', '🚀', '💣'];
        const newParticle: ParticleData = {
          id: particleIdRef.current++,
          x: Math.random() * 100,
          y: Math.random() * 100,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          speed: 0.5 + Math.random() * 1.5,
        };
        
        setParticles((prev) => {
          const updated = [...prev, newParticle].slice(-MAX_PARTICLES);
          return updated;
        });
        
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        }, newParticle.speed * 1000);
      }
      
      if (cfg.effects.colorShift && Math.random() < 0.3) {
        setCurrentColor(`hsl(${Math.random() * 360}, 70%, 60%)`);
      }
      
      if (cfg.effects.rotation && Math.random() < 0.2) {
        setRotation((Math.random() - 0.5) * 10);
      }
      
      if (cfg.effects.gravity && Math.random() < 0.3) {
        setGravityOffset((Math.random() - 0.5) * 20);
      }
      
      if (cfg.effects.glitch && Math.random() < 0.15) {
        setGlitchActive(true);
        playSound('chaos');
        safeTimeout(() => setGlitchActive(false), 100 + Math.random() * 200);
      }
      
      if (cfg.effects.textFade && Math.random() < 0.2) {
        setTextOpacity(0.3 + Math.random() * 0.7);
      }
      
      if (cfg.effects.reverseText && Math.random() < 0.1) {
        setTextReversed((prev) => !prev);
        safeTimeout(() => setTextReversed(false), 2000 + Math.random() * 3000);
      }
      
      if (cfg.effects.randomJumps && Math.random() < 0.15) {
        setTextPosition({
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 30,
        });
        safeTimeout(() => setTextPosition({ x: 0, y: 0 }), 500);
      }
      
      if (cfg.effects.screenInvert && Math.random() < 0.08) {
        setScreenInverted(true);
        safeTimeout(() => setScreenInverted(false), 500 + Math.random() * 1000);
      }
      
      if (cfg.effects.zoomChaos && Math.random() < 0.15) {
        setZoomScale(0.9 + Math.random() * 0.3);
        safeTimeout(() => setZoomScale(1), 300);
      }
      
      if (cfg.effects.screenFlip && Math.random() < 0.05) {
        setScreenFlipped(true);
        safeTimeout(() => setScreenFlipped(false), 3000 + Math.random() * 2000);
      }
      
      if (cfg.chromaticAberration && Math.random() < 0.3) {
        const offset = 2 + Math.random() * 4;
        setChromaticOffset({
          r: offset,
          g: 0,
          b: -offset,
        });
        safeTimeout(() => setChromaticOffset({ r: 0, g: 0, b: 0 }), 200);
      }
      
      if (cfg.realityDistortion && Math.random() < 0.2) {
        setRealityWarp((Math.random() - 0.5) * 5);
        safeTimeout(() => setRealityWarp(0), 300);
      }
      
      if (cfg.textScramble && Math.random() < 0.15) {
        setTextScrambleActive(true);
        safeTimeout(() => setTextScrambleActive(false), 300);
      }
      
      if (cfg.extremeChaosWaves && Math.random() < 0.1) {
        setChaosWaveIntensity(0.5 + Math.random() * 0.5);
        safeTimeout(() => setChaosWaveIntensity(0), 1000);
      }
      
      if (cfg.multiEffectCombos && Math.random() < 0.08) {
        setMultiEffectActive(true);
        setGlitchActive(true);
        setScreenInverted(true);
        setChaosWaveIntensity(1);
        safeTimeout(() => {
          setMultiEffectActive(false);
          setGlitchActive(false);
          setScreenInverted(false);
          setChaosWaveIntensity(0);
        }, 500);
      }
      
      if (cfg.doubleVision && Math.random() < 0.2) {
        setDoubleVisionOffset({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 5,
        });
        safeTimeout(() => setDoubleVisionOffset({ x: 0, y: 0 }), 400);
      }
      
      if (cfg.textWarp && Math.random() < 0.2) {
        setTextWarpAmount((Math.random() - 0.5) * 10);
        safeTimeout(() => setTextWarpAmount(0), 300);
      }
    }, 200);
    
    clarityIntervalRef.current = setInterval(() => {
      if (testSessionRef.current !== currentSession || !isTestActiveRef.current) return;
      
      if (Math.random() < 0.1) {
        setIsClarityWindow(true);
        isClarityWindowRef.current = true;
        
        setBlur(0);
        setGlitchActive(false);
        setScreenInverted(false);
        setChaosWaveIntensity(0);
        setTextOpacity(1);
        setRotation(0);
        setZoomScale(1);
        
        safeTimeout(() => {
          setIsClarityWindow(false);
          isClarityWindowRef.current = false;
        }, 2000);
      }
    }, 5000);
    
    return () => {
      if (effectsIntervalRef.current) clearInterval(effectsIntervalRef.current);
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
      if (stressIntervalRef.current) clearInterval(stressIntervalRef.current);
      if (clarityIntervalRef.current) clearInterval(clarityIntervalRef.current);
      if (blurIntervalRef.current) clearInterval(blurIntervalRef.current);
    };
  }, [isStarted, isFinished, config, prefersReducedMotion, playSound, safeTimeout]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTestActiveRef.current || isFinished) return;
    
    const newValue = e.target.value;
    const oldValue = typedTextRef.current;
    
    if (newValue.length < oldValue.length) {
      return;
    }
    
    const newChar = newValue[newValue.length - 1];
    const expectedChar = currentTextRef.current[oldValue.length];
    
    if (newChar === expectedChar) {
      typedTextRef.current = newValue;
      setTypedText(newValue);
      setCombo((prev) => {
        const newCombo = prev + 1;
        if (newCombo > maxComboRef.current) {
          maxComboRef.current = newCombo;
          setMaxCombo(newCombo);
        }
        
        if (newCombo > 0 && newCombo % 10 === 0) {
          setComboExplosion(true);
          playSound('combo');
          setTimeout(() => setComboExplosion(false), 300);
        }
        
        return newCombo;
      });
      
      if (newValue.length >= currentTextRef.current.length) {
        finishTestRef.current(true);
      }
    } else {
      setErrors((prev) => {
        errorsRef.current = prev + 1;
        return prev + 1;
      });
      setCombo(0);
      setBackgroundFlash(true);
      playSound('error');
      setTimeout(() => setBackgroundFlash(false), 100);
      
      if (config?.effects.screenShake) {
        setShakeOffset({
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 30,
        });
      }
    }
  }, [isFinished, config, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStarted && !isFinished) {
        finishTestRef.current(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isFinished]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      isTestActiveRef.current = false;
    };
  }, [clearAllTimers]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isFinished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStarted, isFinished]);

  const handleReset = useCallback(() => {
    testSessionRef.current += 1;
    isTestActiveRef.current = false;
    clearAllTimers();
    setSelectedDifficulty(null);
    setIsStarted(false);
    setIsFinished(false);
    setCountdown(0);
    setTypedText('');
    setErrors(0);
    setCombo(0);
    setMaxCombo(0);
    maxComboRef.current = 0;
    setFinalResults(null);
    resetVisualStates();
  }, [clearAllTimers, resetVisualStates]);

  const displayText = textReversed ? currentText.split('').reverse().join('') : currentText;
  
  const renderedCharacters = useMemo(() => {
    if (!currentText) return [];
    const textLength = currentText.length;
    return displayText.split('').map((char, displayIndex) => {
      const originalIndex = textReversed ? (textLength - 1 - displayIndex) : displayIndex;
      
      let color = 'text-muted-foreground';
      if (originalIndex < typedText.length) {
        color = typedText[originalIndex] === currentText[originalIndex] ? 'text-green-500' : 'text-red-500';
      } else if (originalIndex === typedText.length) {
        color = 'text-primary bg-primary/20';
      }
      return { char, color, index: displayIndex };
    });
  }, [displayText, typedText, currentText, textReversed]);

  // ============================================
  // DIFFICULTY SELECTION SCREEN
  // ============================================
  if (!selectedDifficulty || (!isStarted && !isFinished && countdown === 0)) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Return to home page</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="gap-2"
                      aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{soundEnabled ? 'Click to mute chaos sounds' : 'Click to enable chaos sounds'}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/stress-leaderboard">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>View top stress test scores from all players</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-12">
            {/* Hero */}
            <div className="text-center mb-12">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 mb-4 cursor-help">
                    <Zap className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                      Stress Test
                    </h1>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Test your typing skills under extreme visual pressure. ⚠️ May cause extreme frustration!</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6 cursor-help">
                    Type while visual chaos erupts around you. Test your focus under extreme conditions.
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Screen shake, color shifts, text blur, screen flips, and more will try to break your concentration</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm cursor-help">
                    <AlertTriangle className="w-4 h-4" />
                    <span>WARNING: May cause EXTREME frustration!</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">Photosensitivity Warning</p>
                    <p>This test contains intense visual effects including:</p>
                    <ul className="text-xs list-disc pl-4 space-y-1">
                      <li>Rapid screen shaking and flashing</li>
                      <li>Color inversions and shifts</li>
                      <li>Text blur, rotation, and movement</li>
                      <li>Screen flipping and zooming</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">Not recommended for those sensitive to motion or flashing lights.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Difficulty Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
              {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((difficulty) => {
                const cfg = DIFFICULTY_CONFIGS[difficulty];
                const activeEffects = Object.values(cfg.effects).filter(Boolean).length;
                const totalEffects = Object.keys(cfg.effects).length;
                
                return (
                  <Card
                    key={difficulty}
                    className={`group relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/50 ${
                      difficulty === 'impossible' ? 'ring-1 ring-primary/20' : ''
                    }`}
                    onClick={() => handleStart(difficulty)}
                  >
                    <CardContent className="p-6">
                      {/* Icon & Name */}
                      <div className="text-center mb-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-4xl mb-2 block cursor-help">{cfg.icon}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{cfg.name} - {cfg.difficulty} difficulty</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="text-lg font-bold cursor-help" style={{ color: cfg.color }}>
                              {cfg.name}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Click to start {cfg.name} challenge</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="mt-1 cursor-help">
                              {cfg.difficulty}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Difficulty level: {cfg.difficulty} ({cfg.multiplier}x score multiplier)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Description */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground text-center mb-4 min-h-[40px] cursor-help">
                            {cfg.description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{cfg.description}. Prepare for chaos!</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-center gap-4 text-sm mb-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                              <Clock className="w-4 h-4" />
                              <span>{cfg.duration}s</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Test duration: {cfg.duration} seconds</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-help" style={{ color: cfg.color }}>
                              <Sparkles className="w-4 h-4" />
                              <span>{activeEffects}/{totalEffects}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{activeEffects} of {totalEffects} chaos effects active</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Active Effects Preview */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="border-t pt-4 cursor-help">
                            <TormentGrid
                              effects={cfg.effects as Record<TormentType, boolean>}
                              size="sm"
                              showInactive={false}
                              animated={false}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Active visual torments that will assault your senses during this challenge</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {/* Start Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            className="w-full mt-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            variant="outline"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Begin {cfg.name} - {cfg.duration}s of chaos awaits!</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Effects Matrix Toggle */}
            <div className="max-w-4xl mx-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between py-6 border rounded-lg"
                    onClick={() => setShowMatrix(!showMatrix)}
                  >
                    <span className="font-medium">View All Effects by Difficulty</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${showMatrix ? 'rotate-90' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Compare all 15 chaos effects across difficulty levels</p>
                </TooltipContent>
              </Tooltip>
              
              {showMatrix && (
                <div className="mt-4">
                  <TormentsMatrix />
                </div>
              )}
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // COUNTDOWN SCREEN
  // ============================================
  if (countdown > 0 && !isStarted) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xl text-muted-foreground mb-4 cursor-help">Get Ready</p>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>⚠️ Chaos begins soon! Focus on the screen. May cause extreme frustration!</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`text-[10rem] font-bold leading-none cursor-help ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
                  style={{ color: config?.color }}
                >
                  {countdown}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Starting in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-8 flex items-center justify-center gap-3 cursor-help">
                  <span className="text-4xl">{config?.icon}</span>
                  <span className="text-2xl font-bold" style={{ color: config?.color }}>
                    {config?.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{config?.description}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground mt-2 cursor-help">{config?.difficulty}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Difficulty: {config?.difficulty} • Duration: {config?.duration}s • {config?.multiplier}x multiplier</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // RESULTS SCREEN
  // ============================================
  if (isFinished && finalResults) {
    const { survivalTime, wpm, accuracy, completionRate, stressScore } = finalResults;
    
    const getTier = (score: number) => {
      if (score >= 5000) return { name: 'Diamond', color: '#00d4ff', bg: 'bg-cyan-500/10', desc: 'Legendary performance! Top 1% of all players.' };
      if (score >= 3000) return { name: 'Platinum', color: '#c0c0c0', bg: 'bg-slate-500/10', desc: 'Elite typist! Outstanding chaos resistance.' };
      if (score >= 1500) return { name: 'Gold', color: '#ffd700', bg: 'bg-yellow-500/10', desc: 'Excellent focus under pressure!' };
      if (score >= 500) return { name: 'Silver', color: '#a8a8a8', bg: 'bg-zinc-500/10', desc: 'Good job! Keep practicing to reach Gold.' };
      return { name: 'Bronze', color: '#cd7f32', bg: 'bg-orange-500/10', desc: 'You survived! Try again to improve your score.' };
    };
    
    const tier = getTier(stressScore);

    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 cursor-help" style={{ backgroundColor: `${tier.color}20` }}>
                      <Trophy className="w-10 h-10" style={{ color: tier.color }} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{tier.desc}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-3xl font-bold mb-2 cursor-help">
                      {completionRate >= 100 ? 'Challenge Complete!' : 'Test Survived!'}
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{completionRate >= 100 ? 'You typed all the text! Amazing focus!' : 'Time ran out, but you survived the chaos!'}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center gap-2 mb-4 cursor-help">
                      <span className="text-2xl">{config?.icon}</span>
                      <span className="text-xl font-medium" style={{ color: config?.color }}>
                        {config?.name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{config?.difficulty} difficulty • {config?.multiplier}x score multiplier</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Score Badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`inline-flex flex-col items-center px-8 py-4 rounded-2xl cursor-help ${tier.bg}`}>
                      <span className="text-sm text-muted-foreground uppercase tracking-wider">
                        {tier.name} Tier
                      </span>
                      <span className="text-5xl font-bold" style={{ color: tier.color }}>
                        {stressScore}
                      </span>
                      <span className="text-sm text-muted-foreground">Stress Score</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{tier.name} Tier</p>
                      <p className="text-xs">{tier.desc}</p>
                      <p className="text-xs text-muted-foreground">Score = (WPM × Accuracy% × Completion%) × {config?.multiplier}x + Combo Bonus</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-blue-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-blue-500">{wpm}</div>
                        <div className="text-xs text-muted-foreground uppercase">WPM</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Words Per Minute - Your typing speed under chaos</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-green-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Target className="w-5 h-5 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-green-500">{accuracy.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground uppercase">Accuracy</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Typing accuracy - Correct keystrokes vs total attempts</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-orange-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Eye className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold text-orange-500">{completionRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground uppercase">Completed</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Completion rate - How much of the text you typed</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-purple-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Flame className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold text-purple-500">{maxCombo}</div>
                        <div className="text-xs text-muted-foreground uppercase">Max Combo</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Longest streak of correct keystrokes. Every 10 = bonus points!</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-red-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <XCircle className="w-5 h-5 mx-auto mb-2 text-red-500" />
                        <div className="text-2xl font-bold text-red-500">{errors}</div>
                        <div className="text-xs text-muted-foreground uppercase">Errors</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Total mistakes - Each error breaks your combo and shakes the screen!</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-cyan-500/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <Timer className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                        <div className="text-2xl font-bold text-cyan-500">{Math.round(survivalTime)}s</div>
                        <div className="text-xs text-muted-foreground uppercase">Survival</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Time survived in the chaos (out of {config?.duration}s)</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Login Prompt */}
              {!user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="mb-6 border-amber-500/50 bg-amber-500/5 cursor-help">
                      <CardContent className="p-4 flex items-center gap-4">
                        <LogIn className="w-6 h-6 text-amber-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-600 dark:text-amber-400">Login to save your results</p>
                          <p className="text-sm text-muted-foreground">Your score won't be saved without an account.</p>
                        </div>
                        <Link href="/login">
                          <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-600">
                            Login
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Create a free account to save scores and compete on the leaderboard!</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Save Status */}
              {user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className={`mb-6 cursor-help ${
                      !isOnline || pendingResultData 
                        ? 'border-amber-500/50 bg-amber-500/5' 
                        : saveResultMutation.isError 
                          ? 'border-red-500/50 bg-red-500/5'
                          : saveResultMutation.isSuccess
                            ? 'border-green-500/50 bg-green-500/5'
                            : ''
                    }`}>
                      <CardContent className="p-4 text-center">
                        {!isOnline ? (
                          <div className="flex items-center justify-center gap-2 text-amber-600">
                            <WifiOff className="w-4 h-4" />
                            <span className="text-sm">Offline - Will save when reconnected</span>
                          </div>
                        ) : pendingResultData ? (
                          <div className="flex items-center justify-center gap-2 text-amber-600">
                            <RefreshCw className={`w-4 h-4 ${saveResultMutation.isPending ? 'animate-spin' : ''}`} />
                            <span className="text-sm">
                              {saveResultMutation.isPending ? 'Saving...' : 'Pending - '}
                            </span>
                            {!saveResultMutation.isPending && (
                              <Button variant="ghost" size="sm" onClick={retrySave} className="h-6 px-2 text-amber-600">
                                Retry
                              </Button>
                            )}
                          </div>
                        ) : saveResultMutation.isError ? (
                          <div className="flex items-center justify-center gap-2 text-red-500">
                            <span className="text-sm">Failed to save</span>
                            <Button variant="ghost" size="sm" onClick={retrySave} className="h-6 px-2 text-red-500">
                              Retry
                            </Button>
                          </div>
                        ) : saveResultMutation.isSuccess ? (
                          <p className="text-sm text-green-600 dark:text-green-400">✓ Result saved!</p>
                        ) : saveResultMutation.isPending ? (
                          <p className="text-sm text-muted-foreground">Saving...</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{saveResultMutation.isSuccess ? 'Your score has been saved to your profile and leaderboard!' : 'Saving your score to the database...'}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Certificate */}
              {certificateData && !showCertificate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setShowCertificate(true)} 
                      className="w-full mb-6 gap-2"
                      variant="outline"
                    >
                      <Award className="w-5 h-5" />
                      View Certificate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>View and download your achievement certificate!</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {showCertificate && certificateData && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-lg font-semibold cursor-help">Achievement Certificate</h3>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Your official stress test completion certificate</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => setShowCertificate(false)} variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Hide certificate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <StressCertificate {...certificateData} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => selectedDifficulty && handleStart(selectedDifficulty)} 
                      className="w-full gap-2"
                      size="lg"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry {config?.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Try the same difficulty again. Can you beat your score?</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="grid grid-cols-3 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleReset} variant="outline" className="gap-2">
                        <Zap className="w-4 h-4" />
                        Change
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Select a different difficulty level</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/stress-leaderboard">
                        <Button variant="outline" className="w-full gap-2">
                          <Trophy className="w-4 h-4" />
                          Ranks
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>View global leaderboard rankings</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/">
                        <Button variant="outline" className="w-full gap-2">
                          <Home className="w-4 h-4" />
                          Home
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Return to home page</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ============================================
  // ACTIVE TEST SCREEN
  // ============================================
  const progress = currentText.length > 0 ? Math.min(100, (typedText.length / currentText.length) * 100) : 0;
  const isUrgent = timeLeft <= 10;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        className={`min-h-screen flex items-center justify-center p-4 cursor-text transition-all duration-100 ${
          backgroundFlash ? 'bg-red-500/20' : 'bg-background'
        }`}
        style={{
          transform: prefersReducedMotion ? 'none' : `translate(${shakeOffset.x}px, ${shakeOffset.y}px) rotate(${rotation}deg) scale(${zoomScale}) ${screenFlipped ? 'rotateX(180deg)' : ''} skewX(${realityWarp}deg)`,
          filter: prefersReducedMotion ? 'none' : `${glitchActive ? 'hue-rotate(180deg) saturate(3)' : ''} ${screenInverted ? 'invert(1) hue-rotate(180deg)' : ''} ${chaosWaveIntensity > 0 ? `contrast(${1 + chaosWaveIntensity * 0.3})` : ''}`,
        }}
        role="main"
        aria-label="Stress test in progress - May cause extreme frustration!"
      >
        {!prefersReducedMotion && particles.map((particle) => (
          <Particle key={particle.id} particle={particle} />
        ))}

        <div className="w-full max-w-4xl">
          {/* HUD */}
          <div className="mb-6 p-4 rounded-xl bg-card border flex items-center justify-between gap-4 flex-wrap" role="status" aria-live="polite">
            {/* Timer */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-help ${
                  isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                } ${isUrgent && !prefersReducedMotion ? 'animate-pulse' : ''}`}>
                  <Timer className="w-5 h-5" />
                  <span className="text-2xl font-mono font-bold" aria-label={`${timeLeft} seconds remaining`}>{timeLeft}s</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isUrgent ? '⚠️ HURRY! Time is running out!' : `Time remaining: ${timeLeft} seconds`}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Combo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-help ${
                  combo >= 10 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted'
                } ${comboExplosion && !prefersReducedMotion ? 'scale-110' : ''} transition-transform`}>
                  <Flame className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-xl font-bold">{combo}</div>
                    <div className="text-xs text-muted-foreground">Combo</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Current streak: {combo} correct keys. {combo >= 10 ? '🔥 On fire!' : 'Every 10 = bonus points!'}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Errors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-help ${
                  errors > 0 ? 'bg-red-500/10 text-red-500' : 'bg-muted'
                }`}>
                  <XCircle className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-xl font-bold">{errors}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{errors} mistakes - Each error resets your combo and causes frustration!</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Stress Level */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted cursor-help">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <div className="w-24">
                    <Progress value={stressLevel} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{Math.round(stressLevel)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Stress Level: {Math.round(stressLevel)}% - Visual chaos intensifies as this increases!</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Progress Bar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-6 cursor-help">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{typedText.length} chars</span>
                  <span>{progress.toFixed(1)}%</span>
                  <span>{currentText.length} total</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Progress: {progress.toFixed(1)}% complete ({typedText.length}/{currentText.length} characters)</p>
            </TooltipContent>
          </Tooltip>

          {/* Typing Area */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`mb-6 transition-all duration-200 ${multiEffectActive ? 'ring-2 ring-purple-500' : ''}`}
                style={prefersReducedMotion ? {} : {
                  transform: `translateY(${gravityOffset}px) translate(${textPosition.x}px, ${textPosition.y}px)`,
                  opacity: textOpacity,
                  filter: `blur(${blur}px)`,
                }}
              >
                <CardContent className="p-8 relative overflow-hidden">
                  {/* Chromatic Aberration Effect */}
                  {(chromaticOffset.r !== 0 || chromaticOffset.b !== 0) && !prefersReducedMotion && (
                    <>
                      <div 
                        className="absolute inset-0 pointer-events-none text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none mix-blend-screen opacity-30 p-8"
                        style={{ transform: `translate(${chromaticOffset.r}px, ${chromaticOffset.r * 0.5}px)`, color: 'red' }}
                        aria-hidden="true"
                      >
                        {displayText}
                      </div>
                      <div 
                        className="absolute inset-0 pointer-events-none text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none mix-blend-screen opacity-30 p-8"
                        style={{ transform: `translate(${chromaticOffset.b}px, ${chromaticOffset.b * 0.5}px)`, color: 'blue' }}
                        aria-hidden="true"
                      >
                        {displayText}
                      </div>
                    </>
                  )}
                  
                  {/* Double Vision Effect */}
                  {(doubleVisionOffset.x !== 0 || doubleVisionOffset.y !== 0) && !prefersReducedMotion && (
                    <div 
                      className="absolute inset-0 pointer-events-none text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none opacity-40 p-8"
                      style={{ transform: `translate(${doubleVisionOffset.x}px, ${doubleVisionOffset.y}px)`, filter: 'blur(0.5px)' }}
                      aria-hidden="true"
                    >
                      {displayText}
                    </div>
                  )}
                  
                  {/* Main Text */}
                  <div 
                    className="text-2xl font-mono leading-relaxed whitespace-pre-wrap select-none relative z-10"
                    style={{
                      ...(textScrambleActive && !prefersReducedMotion ? { letterSpacing: `${Math.random() * 5}px`, wordSpacing: `${Math.random() * 10}px` } : {}),
                      ...(textWarpAmount !== 0 && !prefersReducedMotion ? { transform: `skewX(${textWarpAmount}deg) skewY(${textWarpAmount * 0.3}deg)` } : {}),
                    }}
                    aria-label="Text to type"
                  >
                    {renderedCharacters.map(({ char, color, index }) => (
                      <span
                        key={index}
                        className={`${color} transition-colors duration-100`}
                        style={{
                          display: 'inline-block',
                          animation: glitchActive && !prefersReducedMotion ? 'glitch 0.1s infinite' : 'none',
                          transform: textScrambleActive && !prefersReducedMotion && Math.random() > 0.7 
                            ? `translateY(${(Math.random() - 0.5) * 8}px) rotate(${(Math.random() - 0.5) * 10}deg)` 
                            : 'none',
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Type the text shown. Green = correct, Red = error. Click to focus if needed.</p>
            </TooltipContent>
          </Tooltip>

          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onBlur={() => {
              if (isStarted && !isFinished && isTestActiveRef.current) {
                setTimeout(() => inputRef.current?.focus(), 10);
              }
            }}
            className="sr-only"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type the text shown above"
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-center text-sm text-muted-foreground cursor-help">
                Press ESC to quit • Click anywhere to focus
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Press Escape key to end the test early. Your progress will still be saved!</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
