/**
 * Dictation Mode - Production-Ready Refactored Version
 * 
 * This is a complete rewrite of the dictation test page using modular components,
 * proper state management, and error handling.
 * 
 * Key improvements:
 * - Modular component architecture (split from ~3900 lines monolith)
 * - Proper memory leak prevention with cleanup
 * - Error boundaries for graceful error handling
 * - Session persistence and recovery
 * - Real-time typing feedback
 * - Proper accessibility (ARIA, focus management)
 */

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, RotateCcw, Settings2, Sparkles, X, Minimize2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useCreateCertificate } from '@/hooks/useCertificates';
import { DictationShareDialog } from '@/features/dictation/components/DictationShareDialog';
import { CertificateGenerator } from '@/components/certificate-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateDictationAccuracy, calculateDictationWPM, getSpeedLevelName } from '@shared/dictation-utils';

// Feature imports
import {
  DictationProvider,
  useDictation,
  useDictationState,
  useDictationActions,
  type PracticeMode,
  type DifficultyLevel,
  type ZenTheme,
  type DictationTestResult,
  PRACTICE_MODES,
  CATEGORIES,
  ZEN_THEMES,
  getRandomEncouragement,
  INITIAL_ADAPTIVE_CONFIG,
  calculateOvertimePenalty,
  calculateTimeLimit,
  CHALLENGE_TIMING,
} from '@/features/dictation';

import {
  DictationErrorBoundary,
  DictationModeSelector,
  DictationAudioPlayer,
  DictationTypingArea,
  DictationResults,
  DictationSessionComplete,
  DictationSettings,
  DictationProgressBar,
  DictationSetupPanel,
} from '@/features/dictation/components';

import {
  useDictationAudio,
  useDictationTimer,
  useCountdown,
  useDictationAPI,
} from '@/features/dictation/hooks';

import {
  hasValidSessionBackup,
  clearSessionBackup,
} from '@/features/dictation/utils/persistence';

import { categorizeErrors } from '@/features/dictation/utils/scoring';

// ============================================================================
// MAIN DICTATION PAGE COMPONENT
// ============================================================================

function DictationModeContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const createCertificateMutation = useCreateCertificate();
  
  // Context
  const { state, dispatch, actions } = useDictation();
  
  // API
  const { fetchSentence, isFetching, saveTest, isSaving } = useDictationAPI();
  
  // Audio with callbacks
  const audio = useDictationAudio({
    speedLevel: state.speedLevel,
    onSpeechEnd: () => {
      // Start timer when speech ends
      if (state.testState.sentence && !state.testState.startTime) {
        dispatch({ type: 'SET_TEST_STATE', payload: { startTime: Date.now() } });
        timer.start();
      }
    },
  });
  
  // Timer
  const timer = useDictationTimer({
    onTick: (elapsed) => dispatch({ type: 'SET_ELAPSED_TIME', payload: elapsed }),
  });
  
  // Auto-advance countdown
  const countdown = useCountdown({
    initialValue: 3,
    onComplete: () => handleNextSentence(),
  });
  
  // Local UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateImageCopied, setCertificateImageCopied] = useState(false);
  const [isSharingCertificate, setIsSharingCertificate] = useState(false);
  const [lastResultId, setLastResultId] = useState<number | null>(null);
  const [certificateData, setCertificateData] = useState<any>(null);
  
  // Estimated time limit for Challenge Mode preview
  // Uses the same WPM-based formula as the actual Challenge Mode timer (CHALLENGE_TIMING)
  // Note: This is an ESTIMATE - actual time depends on real sentence length
  const estimatedTimeLimitMs = useMemo(() => {
    if (state.practiceMode !== 'challenge') return null;
    
    // Realistic average words per sentence by difficulty (based on actual dictation content)
    // Easy sentences are shorter and simpler
    // Hard sentences are longer with complex vocabulary
    const avgWordsPerSentence: Record<DifficultyLevel, number> = {
      easy: 10,   // Short, simple sentences (~50 chars)
      medium: 16, // Moderate complexity sentences (~80 chars)
      hard: 24,   // Long, complex sentences (~120 chars)
    };
    
    // Use shared CHALLENGE_TIMING config to stay in sync with runtime timer
    const config = CHALLENGE_TIMING.DIFFICULTY_CONFIG[state.difficulty];
    const estimatedTotalWords = avgWordsPerSentence[state.difficulty] * state.sessionLength;
    
    // Apply a slight challenge factor (90%) to make preview feel appropriately tight
    // This sets user expectation that timing will be snappy
    const challengeFactor = 0.90;
    
    // Formula: Time = (Words / TargetWPM) * Buffer * ChallengeMultiplier * 60s * 1000ms
    const rawTimeMs = (estimatedTotalWords / config.targetWPM) * config.buffer * challengeFactor * 60 * 1000;
    
    // Use shared min/max bounds
    const clampedTime = Math.max(
      CHALLENGE_TIMING.MIN_TIME_MS,
      Math.min(CHALLENGE_TIMING.MAX_TIME_MS, rawTimeMs)
    );
    
    return Math.round(clampedTime);
  }, [state.practiceMode, state.difficulty, state.sessionLength]);
  
  // Refs for cleanup and prefetch
  const isMountedRef = useRef(true);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // Ref to store prefetched sentence for immediate access (avoids React state delays)
  const prefetchedSentenceRef = useRef<typeof state.prefetchedSentence>(null);
  const prefetchedAudioReadyRef = useRef(false);

  // ============================================================================
  // NAVIGATION & HISTORY MANAGEMENT
  // ============================================================================

  // 1. Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') as PracticeMode | null;

      if (!mode) {
        // URL is root, ensure we show selector
        // We check if we are NOT showing the selector to avoid redundant updates
        if (!state.showModeSelector) {
          dispatch({ type: 'SET_SHOW_MODE_SELECTOR', payload: true });
          // Also ensure we reset waiting state if we were there
          if (state.isWaitingToStart) {
             dispatch({ type: 'SET_IS_WAITING_TO_START', payload: false });
          }
        }
      } else if (PRACTICE_MODES[mode]) {
        // URL has mode, ensure we are in that mode
        // Only trigger if we are not already in that mode to avoid reset loops
        if (state.showModeSelector || state.practiceMode !== mode) {
           actions.startPracticeMode(mode);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state.showModeSelector, state.practiceMode, state.isWaitingToStart, dispatch, actions]);

  // 2. Handle initial deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') as PracticeMode | null;
    if (mode && PRACTICE_MODES[mode]) {
      actions.startPracticeMode(mode);
    }
  }, []); // Run once on mount

  // 3. Sync state changes to URL - REMOVED to avoid loops and race conditions
  // Instead, we rely on explicit navigation actions in handlers.
  /*
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');

    if (state.showModeSelector) {
      // We are in selector mode. URL should be clean.
      if (urlMode) {
        const newUrl = window.location.pathname;
        window.history.pushState(null, '', newUrl);
      }
    } else {
      // We are in practice mode. URL should have mode param.
      if (urlMode !== state.practiceMode) {
        const newUrl = `${window.location.pathname}?mode=${state.practiceMode}`;
        window.history.pushState(null, '', newUrl);
      }
    }
  }, [state.showModeSelector, state.practiceMode]);
  */
  
  // Check for session recovery on mount
  useEffect(() => {
    const hasBackup = hasValidSessionBackup();
    if (hasBackup) {
      // Session recovery will be shown in mode selector
    }
    
    return () => {
      isMountedRef.current = false;
      audio.cancel();
      timer.stop();
      countdown.stop();
    };
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'INPUT' ||
        activeElement?.getAttribute('contenteditable') === 'true';
      
      const key = e.key.toLowerCase();
      
      // Next sentence shortcut
      if (state.testState.isComplete && key === 'n' && !isTyping) {
        e.preventDefault();
        handleNextSentence();
        return;
      }
      
      if (state.testState.isComplete || !state.testState.sentence) return;
      if (isTyping) return;
      
      // Replay shortcut
      if (key === 'r' && !audio.isSpeaking && state.testState.sentence) {
        e.preventDefault();
        handleReplay();
      }
      
      // Hint shortcut
      if (
        key === 'h' &&
        !audio.isSpeaking &&
        state.testState.sentence &&
        PRACTICE_MODES[state.practiceMode].hintsAllowed
      ) {
        e.preventDefault();
        actions.toggleHint();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.testState, audio.isSpeaking, state.practiceMode]);
  
  // Save session backup periodically
  useEffect(() => {
    if (state.sessionProgress > 0 && !state.sessionComplete) {
      actions.saveProgress();
    }
  }, [state.sessionProgress, state.sessionHistory]);
  
  // Generate certificate when session completes
  useEffect(() => {
    if (
      state.sessionComplete &&
      user &&
      state.sessionStats.count > 0 &&
      !certificateData &&
      state.lastTestResultId
    ) {
      const avgWpm = Math.round(state.sessionStats.totalWpm / state.sessionStats.count);
      const avgAccuracy = state.sessionStats.totalAccuracy / state.sessionStats.count;
      const consistency = Math.round(Math.random() * 20 + 75);
      const estimatedDuration = Math.round((state.sessionStats.count * 60 * 5) / avgWpm);
      
      const totalWords = state.sessionHistory.reduce((sum, h) => {
        return sum + h.sentence.split(' ').length;
      }, 0);
      
      const certData = {
        wpm: avgWpm,
        accuracy: avgAccuracy,
        consistency,
        speedLevel: getSpeedLevelName(parseFloat(state.speedLevel)),
        sentencesCompleted: state.sessionStats.count,
        totalWords,
        duration: estimatedDuration,
        username: user.username || 'Typing Expert',
      };
      
      setCertificateData(certData);
      
      createCertificateMutation.mutate({
        certificateType: 'dictation',
        dictationTestId: state.lastTestResultId,
        wpm: avgWpm,
        accuracy: avgAccuracy,
        consistency,
        duration: estimatedDuration,
        metadata: {
          speedLevel: getSpeedLevelName(parseFloat(state.speedLevel)),
          sentencesCompleted: state.sessionStats.count,
          totalWords,
          username: user.username || 'Typing Expert',
        },
      });
      
      clearSessionBackup();
    }
  }, [state.sessionComplete, user, state.sessionStats, state.lastTestResultId, certificateData]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleStartPracticeMode = useCallback((mode: PracticeMode) => {
    // Explicitly update history
    const newUrl = `${window.location.pathname}?mode=${mode}`;
    window.history.pushState(null, '', newUrl);
    
    actions.startPracticeMode(mode);
  }, [actions]);
  
  // Track the settings used for the current prefetched sentence
  // This allows us to detect when settings change and refetch
  const prefetchSettingsRef = useRef<{ difficulty: string; category: string; sessionLength: number } | null>(null);
  
  // Track prefetch retry count to prevent infinite retry loops
  const prefetchRetryCount = useRef(0);
  const MAX_PREFETCH_RETRIES = 3;
  
  // Prefetch sentence and preload audio when entering waiting screen
  // Also handles re-fetching when difficulty/category/sessionLength change
  useEffect(() => {
    // Not waiting to start - nothing to do
    if (!state.isWaitingToStart) {
      prefetchRetryCount.current = 0; // Reset retry count when leaving waiting screen
      return;
    }
    
    // Check if we need to refetch due to settings change
    const settingsChanged = prefetchSettingsRef.current !== null && 
      (prefetchSettingsRef.current.difficulty !== state.difficulty || 
       prefetchSettingsRef.current.category !== state.category ||
       prefetchSettingsRef.current.sessionLength !== state.sessionLength);
    
    // If settings changed, clear the existing prefetched sentence and refetch
    if (settingsChanged && (state.prefetchedSentence || prefetchedSentenceRef.current)) {
      prefetchedSentenceRef.current = null;
      prefetchedAudioReadyRef.current = false;
      prefetchSettingsRef.current = null;
      prefetchRetryCount.current = 0; // Reset retry count on settings change
      dispatch({ type: 'SET_PREFETCHED_SENTENCE', payload: null });
      // Return here - the dispatch will trigger this effect again with null state
      return;
    }
    
    // Already have a prefetched sentence with current settings, or currently fetching
    if (state.prefetchedSentence || prefetchedSentenceRef.current || state.isPrefetching) {
      return;
    }
    
    const prefetch = async () => {
      dispatch({ type: 'SET_IS_PREFETCHING', payload: true });
      
      try {
        const sentence = await fetchSentence({
          difficulty: state.difficulty,
          category: state.category,
          excludeIds: state.shownSentenceIds,
          maxRetries: 3,
        });
        
        if (sentence && isMountedRef.current) {
          // Record what settings this sentence was fetched for (including sessionLength)
          prefetchSettingsRef.current = { 
            difficulty: state.difficulty, 
            category: state.category,
            sessionLength: state.sessionLength,
          };
          prefetchRetryCount.current = 0; // Reset retry count on success
          
          // Atomically set both ref AND state together for consistency
          prefetchedSentenceRef.current = sentence;
          prefetchedAudioReadyRef.current = false;
          dispatch({ type: 'SET_PREFETCHED_SENTENCE', payload: sentence });
          
          // Preload audio in background for instant playback
          audio.preloadAudio(sentence.sentence).then((success) => {
            if (success && isMountedRef.current) {
              prefetchedAudioReadyRef.current = true;
            }
          });
        } else if (!sentence && isMountedRef.current) {
          // Sentence fetch returned null - show error to user
          prefetchRetryCount.current++;
          if (prefetchRetryCount.current >= MAX_PREFETCH_RETRIES) {
            toast({
              title: 'Failed to load sentence',
              description: 'Unable to fetch a practice sentence. Please try changing settings or refreshing the page.',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('[Dictation] Failed to prefetch sentence:', error);
        if (isMountedRef.current) {
          prefetchRetryCount.current++;
          if (prefetchRetryCount.current >= MAX_PREFETCH_RETRIES) {
            toast({
              title: 'Connection error',
              description: 'Failed to load practice content. Please check your connection and try again.',
              variant: 'destructive',
            });
          }
        }
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_IS_PREFETCHING', payload: false });
        }
      }
    };
    
    prefetch();
  }, [state.isWaitingToStart, state.prefetchedSentence, state.isPrefetching, state.difficulty, state.category, state.sessionLength, state.shownSentenceIds, fetchSentence, audio, dispatch, toast]);
  
  const handleRecoverSession = useCallback(() => {
    actions.recoverSession();
  }, [actions]);
  
  const loadNextSentence = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Reset states
    timer.reset();
    countdown.reset();
    dispatch({ type: 'RESET_TEST_STATE' });
    
    // Fetch new sentence
    const sentence = await fetchSentence({
      difficulty: state.difficulty,
      category: state.category,
      excludeIds: state.shownSentenceIds,
    });
    
    if (!isMountedRef.current) return;
    
    if (sentence) {
      dispatch({ type: 'ADD_SHOWN_SENTENCE_ID', payload: sentence.id });
      
      // Calculate time limit for Challenge Mode
      const timeLimitMs = state.practiceMode === 'challenge' 
        ? calculateTimeLimit(sentence.sentence, state.difficulty)
        : null;
      
      dispatch({
        type: 'SET_TEST_STATE',
        payload: { sentence, timeLimitMs, timeExpired: false },
      });
      
      // Use streaming TTS for ultra-low latency (~500ms vs 3-5s)
      // Audio starts playing as chunks arrive from the server
      // This also preloads for instant replays in the background
      setTimeout(() => {
        if (isMountedRef.current) {
          audio.speakStreaming(sentence.sentence);
        }
      }, 50);
    } else {
      toast({
        title: 'Failed to load sentence',
        description: 'Could not fetch a new sentence. Please try again.',
        variant: 'destructive',
      });
    }
  }, [
    state.difficulty,
    state.category,
    state.shownSentenceIds,
    state.practiceMode,
    state.sessionLength,
    fetchSentence,
    audio,
    timer,
    countdown,
    dispatch,
    toast,
  ]);
  
  const handleBeginSession = useCallback(async () => {
    actions.beginSession();
    
    // Use prefetched sentence from ref (immediate access) or state
    const prefetchedSentence = prefetchedSentenceRef.current || state.prefetchedSentence;
    
    if (prefetchedSentence) {
      timer.reset();
      countdown.reset();
      dispatch({ type: 'RESET_TEST_STATE' });
      
      const sentence = prefetchedSentence;
      dispatch({ type: 'ADD_SHOWN_SENTENCE_ID', payload: sentence.id });
      
      // Calculate time limit for Challenge Mode
      const timeLimitMs = state.practiceMode === 'challenge' 
        ? calculateTimeLimit(sentence.sentence, state.difficulty)
        : null;
      
      dispatch({ type: 'SET_TEST_STATE', payload: { sentence, timeLimitMs, timeExpired: false } });
      
      // Clear both ref and state
      prefetchedSentenceRef.current = null;
      dispatch({ type: 'SET_PREFETCHED_SENTENCE', payload: null });
      
      // Play preloaded audio immediately (should be instant!)
      setTimeout(() => {
        if (isMountedRef.current) {
          if (prefetchedAudioReadyRef.current || audio.hasPreloadedAudio(sentence.sentence)) {
            prefetchedAudioReadyRef.current = false;
            audio.speakPreloaded(sentence.sentence);
          } else {
            audio.speakStreaming(sentence.sentence);
          }
        }
      }, 50);
    } else {
      // Fallback to fetching if prefetch failed
      await loadNextSentence();
    }
  }, [actions, state.prefetchedSentence, state.practiceMode, state.difficulty, state.sessionLength, audio, timer, countdown, dispatch, loadNextSentence]);
  
  const handleReplay = useCallback(() => {
    if (state.testState.sentence && !audio.isSpeaking) {
      // Check replay limit for Focus Mode
      const modeConfig = PRACTICE_MODES[state.practiceMode];
      if (modeConfig.maxReplays !== undefined && state.testState.replayCount >= modeConfig.maxReplays) {
        return; // Don't replay if limit reached
      }
      actions.incrementReplayCount();
      audio.replay(state.testState.sentence.sentence);
    }
  }, [state.testState.sentence, state.testState.replayCount, state.practiceMode, audio, actions]);
  
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    const { sentence, startTime, typedText, replayCount, hintShown, timeExpired } = state.testState;
    
    if (!sentence || !startTime || !typedText.trim()) return;
    
    const endTime = Date.now();
    const elapsedSeconds = (endTime - startTime) / 1000;
    const duration = Math.max(1, Math.round(elapsedSeconds)); // Minimum 1 second for calculations
    
    // Skip "too fast" check for auto-submit (Challenge Mode time expiry) or if time already expired
    if (elapsedSeconds < 1 && !isAutoSubmit && !timeExpired) {
      toast({
        title: 'Too fast!',
        description: 'Please take your time to type the sentence.',
      });
      return;
    }
    
    // Calculate results
    const accuracyResult = calculateDictationAccuracy(typedText, sentence.sentence);
    const wpm = calculateDictationWPM(typedText.length, elapsedSeconds);
    const wordErrors = accuracyResult.wordDiff.filter((d) => d.status !== 'correct').length;
    
    // Challenge Mode: Check if completed in time and apply streak/penalties
    let finalAccuracy = accuracyResult.accuracy;
    let completedInTime = true;
    
    if (state.practiceMode === 'challenge' && state.testState.timeLimitMs !== null) {
      const elapsedMs = elapsedSeconds * 1000;
      const timeRemainingMs = state.testState.timeLimitMs - elapsedMs;
      
      completedInTime = timeRemainingMs > 0;
      
      if (!completedInTime) {
        // Apply graduated overtime penalty based on how late the submission was
        const secondsOvertime = Math.abs(timeRemainingMs) / 1000;
        const overtimePenalty = calculateOvertimePenalty(secondsOvertime);
        finalAccuracy = Math.max(0, accuracyResult.accuracy - (overtimePenalty * 100));
        toast({
          title: 'Overtime!',
          description: `Time expired! -${Math.round(overtimePenalty * 100)}% accuracy penalty applied.`,
          variant: 'destructive',
        });
      } else {
        // Apply streak bonus if applicable
        const streakBonus = Math.min(
          state.sessionStats.challengeStreak * CHALLENGE_TIMING.STREAK_BONUS,
          CHALLENGE_TIMING.MAX_STREAK_BONUS
        );
        if (streakBonus > 0) {
          finalAccuracy = Math.min(100, accuracyResult.accuracy + (streakBonus * 100));
        }
      }
    }
    
    const result: DictationTestResult = {
      accuracy: finalAccuracy,
      wpm,
      errors: wordErrors,
      duration,
      characterDiff: accuracyResult.characterDiff,
      wordDiff: accuracyResult.wordDiff,
      correctChars: accuracyResult.correctChars,
      totalChars: accuracyResult.totalChars,
      correctWords: accuracyResult.correctWords,
      totalWords: accuracyResult.totalWords,
    };
    
    // Update challenge streak for Challenge Mode
    if (state.practiceMode === 'challenge') {
      const newStreak = completedInTime ? state.sessionStats.challengeStreak + 1 : 0;
      const maxStreak = Math.max(state.sessionStats.maxChallengeStreak, newStreak);
      dispatch({
        type: 'UPDATE_SESSION_STATS',
        payload: {
          challengeStreak: newStreak,
          maxChallengeStreak: maxStreak,
          completedInTime: state.sessionStats.completedInTime + (completedInTime ? 1 : 0),
          timedOut: state.sessionStats.timedOut + (completedInTime ? 0 : 1),
        },
      });
      
      // Show streak notification
      if (completedInTime && newStreak > 1) {
        toast({
          title: `Streak: ${newStreak}!`,
          description: `+${Math.round(Math.min(newStreak * CHALLENGE_TIMING.STREAK_BONUS, CHALLENGE_TIMING.MAX_STREAK_BONUS) * 100)}% bonus applied!`,
        });
      }
    }
    
    // Stop timer
    timer.stop();
    
    // Update state via context action
    actions.handleTestComplete(result, duration);
    
    // Save to server
    const saveResult = await saveTest({
      sentenceId: sentence.id,
      speedLevel: state.speedLevel,
      actualSpeed: audio.currentRate,
      actualSentence: sentence.sentence,
      typedText,
      wpm: result.wpm,
      accuracy: result.accuracy,
      errors: result.errors,
      replayCount,
      hintUsed: hintShown ? 1 : 0,
      duration,
    });
    
    if (saveResult?.id) {
      dispatch({ type: 'SET_LAST_TEST_RESULT_ID', payload: saveResult.id });
    }
    
    // Prefetch next sentence while user reviews results (instant next!)
    // Use silent mode with retries to avoid showing error toasts for background prefetch
    // Note: We purposely DON'T clear refs here - we only clear when the new sentence is ready
    // This prevents a race condition where the user clicks Next before prefetch completes
    if (state.sessionProgress < state.sessionLength) {
      fetchSentence({
        difficulty: state.difficulty,
        category: state.category,
        excludeIds: [...state.shownSentenceIds, sentence.id],
        maxRetries: 3,
        silent: true, // Don't show toasts for background prefetch
      }).then((nextSentence) => {
        if (nextSentence && isMountedRef.current) {
          // Atomically set both ref AND state together
          // Ref first for immediate access, then state for React consistency
          prefetchedSentenceRef.current = nextSentence;
          prefetchedAudioReadyRef.current = false;
          dispatch({ type: 'SET_PREFETCHED_SENTENCE', payload: nextSentence });
          
          // Preload audio for instant playback
          audio.preloadAudio(nextSentence.sentence).then((success) => {
            if (success && isMountedRef.current) {
              prefetchedAudioReadyRef.current = true;
            }
          });
        }
      }).catch((error) => {
        console.error('[Dictation] Failed to prefetch next sentence:', error);
      });
    }
    
    // Start auto-advance if enabled
    if (PRACTICE_MODES[state.practiceMode].autoAdvance) {
      countdown.start();
    }
  }, [state.testState, state.speedLevel, state.practiceMode, state.sessionProgress, state.sessionLength, state.difficulty, state.category, state.shownSentenceIds, audio, timer, countdown, actions, dispatch, saveTest, fetchSentence, toast]);
  
  const handleNextSentence = useCallback(async () => {
    countdown.stop();
    
    // Check if session is complete
    if (state.sessionProgress >= state.sessionLength) {
      dispatch({ type: 'SET_SESSION_COMPLETE', payload: true });
      clearSessionBackup();
      return;
    }
    
    // Use prefetched sentence from ref (immediate access) or state
    const prefetchedSentence = prefetchedSentenceRef.current || state.prefetchedSentence;
    
    if (prefetchedSentence) {
      timer.reset();
      countdown.reset();
      dispatch({ type: 'RESET_TEST_STATE' });
      
      const sentence = prefetchedSentence;
      dispatch({ type: 'ADD_SHOWN_SENTENCE_ID', payload: sentence.id });
      
      // Calculate time limit for Challenge Mode
      const timeLimitMs = state.practiceMode === 'challenge' 
        ? calculateTimeLimit(sentence.sentence, state.difficulty)
        : null;
      
      dispatch({ type: 'SET_TEST_STATE', payload: { sentence, timeLimitMs, timeExpired: false } });
      
      // Clear both ref and state
      prefetchedSentenceRef.current = null;
      dispatch({ type: 'SET_PREFETCHED_SENTENCE', payload: null });
      
      // Play preloaded audio immediately
      setTimeout(() => {
        if (isMountedRef.current) {
          if (prefetchedAudioReadyRef.current || audio.hasPreloadedAudio(sentence.sentence)) {
            prefetchedAudioReadyRef.current = false;
            audio.speakPreloaded(sentence.sentence);
          } else {
            audio.speakStreaming(sentence.sentence);
          }
        }
      }, 50);
    } else {
      // Fallback to fetching if prefetch failed
      await loadNextSentence();
    }
  }, [state.sessionProgress, state.sessionLength, state.prefetchedSentence, state.practiceMode, state.difficulty, countdown, timer, dispatch, audio, loadNextSentence]);
  
  // Auto-submit for Challenge Mode when time expires
  useEffect(() => {
    // Only applies to Challenge Mode with active typing
    if (state.practiceMode !== 'challenge') return;
    if (!state.testState.sentence) return;
    if (!state.testState.startTime) return;
    if (state.testState.isComplete) return;
    if (state.testState.timeLimitMs === null) return;
    if (state.testState.timeExpired) return;
    
    const elapsedMs = state.elapsedTime * 1000;
    const timeRemainingMs = state.testState.timeLimitMs - elapsedMs;
    
    // Check if time has expired (with grace period)
    if (timeRemainingMs <= -CHALLENGE_TIMING.GRACE_PERIOD_MS) {
      // Mark as expired and show Time's Up overlay
      dispatch({ type: 'SET_TEST_STATE', payload: { timeExpired: true, showTimeUpOverlay: true } });
      
      // Auto-submit whatever is typed (pass true to bypass elapsed time check)
      if (state.testState.typedText.trim()) {
        handleSubmit(true);
      } else {
        // No text typed - record 0% accuracy failure result
        const sentence = state.testState.sentence;
        const failureResult: DictationTestResult = {
          accuracy: 0,
          wpm: 0,
          errors: sentence.sentence.length,
          duration: Math.max(1, state.elapsedTime),
          characterDiff: [],
          wordDiff: [],
          correctChars: 0,
          totalChars: sentence.sentence.length,
          correctWords: 0,
          totalWords: sentence.sentence.split(/\s+/).length,
        };
        
        // Mark as complete with failure result
        dispatch({
          type: 'SET_TEST_STATE',
          payload: {
            endTime: Date.now(),
            isComplete: true,
            result: failureResult,
          },
        });
        
        // Update session stats with failure
        dispatch({
          type: 'UPDATE_SESSION_STATS',
          payload: {
            totalWpm: state.sessionStats.totalWpm + 0,
            totalAccuracy: state.sessionStats.totalAccuracy + 0,
            totalErrors: state.sessionStats.totalErrors + sentence.sentence.length,
            count: state.sessionStats.count + 1,
            challengeStreak: 0,
            timedOut: state.sessionStats.timedOut + 1,
          },
        });
        
        // Add to session history
        dispatch({
          type: 'ADD_SESSION_HISTORY',
          payload: {
            sentence: sentence.sentence,
            typedText: '',
            accuracy: 0,
            wpm: 0,
            errors: sentence.sentence.length,
            timestamp: Date.now(),
            errorCategories: [],
          },
        });
        
        // Update progress
        dispatch({ type: 'INCREMENT_SESSION_PROGRESS' });
      }
    }
  }, [state.practiceMode, state.testState, state.elapsedTime, state.sessionStats, dispatch, handleSubmit]);
  
  const handleNewSession = useCallback(() => {
    setCertificateData(null);
    actions.resetSession();
  }, [actions]);
  
  const handleRestartSession = useCallback(() => {
    audio.cancel();
    timer.reset();
    countdown.reset();
    actions.restartCurrentSession();
    
    setTimeout(() => {
      loadNextSentence();
    }, 100);
  }, [audio, timer, countdown, actions, loadNextSentence]);
  
  // Dismiss Time's Up overlay and move to next sentence
  const handleDismissTimeUpOverlay = useCallback(() => {
    dispatch({ type: 'SET_TEST_STATE', payload: { showTimeUpOverlay: false } });
    handleNextSentence();
  }, [dispatch, handleNextSentence]);
  
  // ============================================================================
  // CERTIFICATE FUNCTIONS
  // ============================================================================
  
  // Get the canvas element from CertificateGenerator
  const getCertificateCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!certificateRef.current) return null;
    return certificateRef.current.querySelector('canvas');
  }, []);
  
  // Copy certificate image to clipboard
  const handleCopyCertificateImage = useCallback(async () => {
    try {
      const canvas = getCertificateCanvas();
      if (!canvas) {
        toast({ title: 'Error', description: 'Certificate not ready', variant: 'destructive' });
        return;
      }
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCertificateImageCopied(true);
        setTimeout(() => setCertificateImageCopied(false), 2000);
        toast({ title: 'Copied!', description: 'Certificate image copied to clipboard' });
      }
    } catch (error) {
      toast({ title: 'Copy Failed', description: 'Could not copy certificate image', variant: 'destructive' });
    }
  }, [toast, getCertificateCanvas]);
  
  // Share certificate with image (native share)
  const handleShareCertificateWithImage = useCallback(async () => {
    if (!('share' in navigator)) return;
    
    try {
      setIsSharingCertificate(true);
      
      const canvas = getCertificateCanvas();
      if (!canvas) {
        toast({ title: 'Error', description: 'Certificate not ready', variant: 'destructive' });
        return;
      }
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      if (blob) {
        const avgWpm = state.sessionStats.count > 0 ? Math.round(state.sessionStats.totalWpm / state.sessionStats.count) : 0;
        const avgAccuracy = state.sessionStats.count > 0 ? Math.round(state.sessionStats.totalAccuracy / state.sessionStats.count) : 0;
        
        const file = new File([blob], 'dictation-certificate.png', { type: 'image/png' });
        await (navigator as any).share({
          title: 'My TypeMasterAI Dictation Certificate',
          text: `🎓 Just earned my Dictation Certificate! ${avgWpm} WPM with ${avgAccuracy}% accuracy! 🎯`,
          files: [file],
        });
        toast({ title: 'Shared!', description: 'Certificate shared successfully' });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({ title: 'Share Failed', description: 'Could not share certificate', variant: 'destructive' });
      }
    } finally {
      setIsSharingCertificate(false);
    }
  }, [toast, getCertificateCanvas, state.sessionStats]);
  
  // Calculate session stats for display
  const avgWpm = state.sessionStats.count > 0 ? Math.round(state.sessionStats.totalWpm / state.sessionStats.count) : 0;
  const avgAccuracy = state.sessionStats.count > 0 ? Math.round(state.sessionStats.totalAccuracy / state.sessionStats.count) : 0;
  const totalWords = state.sessionHistory.reduce((sum, h) => sum + h.sentence.split(' ').length, 0);
  const totalCharacters = state.sessionHistory.reduce((sum, h) => sum + h.sentence.length, 0);
  const consistency = Math.round(Math.random() * 20 + 75);
  const sessionDuration = Math.round((state.sessionStats.count * 60 * 5) / Math.max(avgWpm, 1));
  
  // Generate formatted verification ID for certificates
  // Format: DM-XXXX-XXXX-XXXX (DM = Dictation Mode)
  const generateVerificationId = useCallback(() => {
    const id = state.lastTestResultId || 0;
    const timestamp = Date.now();
    const data = `dictation-${id}-${avgWpm}-${avgAccuracy}-${timestamp}`;
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1;
      hash2 = ((hash2 << 3) + hash2) ^ char;
      hash2 = hash2 & hash2;
    }
    const hexHash1 = Math.abs(hash1).toString(16).toUpperCase().padStart(8, '0');
    const hexHash2 = Math.abs(hash2).toString(16).toUpperCase().padStart(4, '0');
    const idPart = id.toString().padStart(4, '0').slice(-4);
    return `DM-${hexHash1.slice(0, 4)}-${idPart}-${hexHash2.slice(0, 4)}`;
  }, [state.lastTestResultId, avgWpm, avgAccuracy]);
  
  const formattedVerificationId = state.lastTestResultId ? generateVerificationId() : undefined;
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Check browser support
  if (!audio.isSupported) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Browser Not Supported</h2>
            <p className="text-muted-foreground">
              Your browser doesn't support speech synthesis. Please use a modern browser like
              Chrome, Edge, or Safari to use Dictation Mode.
            </p>
            <Link href="/">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Session complete screen
  if (state.sessionComplete) {
    return (
      <>
        {/* Hidden certificate for canvas access */}
        {user && (
          <div ref={certificateRef} className="absolute -z-50 w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
            <CertificateGenerator
              username={user.username || 'Typing Expert'}
              wpm={avgWpm}
              accuracy={avgAccuracy}
              mode={sessionDuration}
              date={new Date()}
              freestyle={false}
              characters={totalCharacters}
              words={totalWords}
              consistency={consistency}
              verificationId={formattedVerificationId}
              modeLabel="Dictation Mode"
            />
          </div>
        )}
        
        <DictationSessionComplete
          sessionStats={state.sessionStats}
          sessionHistory={state.sessionHistory}
          sessionLength={state.sessionLength}
          speedLevel={state.speedLevel}
          username={user?.username}
          consistency={consistency}
          onNewSession={handleNewSession}
          onShare={() => setShowShareModal(true)}
          onSessionLengthChange={(length) => dispatch({ type: 'SET_SESSION_LENGTH', payload: length })}
          onViewCertificate={() => setShowCertificate(true)}
        />

        {/* Share Dialog */}
        <DictationShareDialog
          open={showShareModal}
          onOpenChange={setShowShareModal}
          wpm={avgWpm}
          accuracy={avgAccuracy}
          errors={state.sessionStats.totalErrors}
          duration={sessionDuration}
          consistency={consistency}
          totalWords={totalWords}
          totalCharacters={totalCharacters}
          lastResultId={state.lastTestResultId}
          username={user?.username}
          speedLevel={state.speedLevel}
          verificationId={formattedVerificationId}
          onViewCertificate={() => setShowCertificate(true)}
          onCopyCertificateImage={handleCopyCertificateImage}
          onShareCertificateWithImage={handleShareCertificateWithImage}
          isCopying={certificateImageCopied}
          isSharing={isSharingCertificate}
        />
        
        {/* Certificate Full View Dialog */}
        <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                🎓 Dictation Certificate
              </DialogTitle>
            </DialogHeader>
            {user && (
              <CertificateGenerator
                username={user.username || 'Typing Expert'}
                wpm={avgWpm}
                accuracy={avgAccuracy}
                mode={sessionDuration}
                date={new Date()}
                freestyle={false}
                characters={totalCharacters}
                words={totalWords}
                consistency={consistency}
                verificationId={formattedVerificationId}
                modeLabel="Dictation Mode"
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Mode selector
  if (state.showModeSelector) {
    return (
      <DictationModeSelector
        streakData={state.streakData}
        onSelectMode={handleStartPracticeMode}
        hasRecoverableSession={hasValidSessionBackup()}
        onRecoverSession={handleRecoverSession}
      />
    );
  }
  
  // Waiting to start
  if (state.isWaitingToStart) {
    return (
      <TooltipProvider>
        <div className="container max-w-4xl mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                dispatch({ type: 'SET_SHOW_MODE_SELECTOR', payload: true });
                dispatch({ type: 'SET_IS_WAITING_TO_START', payload: false });
                
                // Clean URL
                const newUrl = window.location.pathname;
                window.history.pushState(null, '', newUrl);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{PRACTICE_MODES[state.practiceMode].name}</h1>
            <div className="w-20" />
          </div>
          
          <DictationSetupPanel
            difficulty={state.difficulty}
            speedLevel={state.speedLevel}
            category={state.category}
            sessionLength={state.sessionLength}
            currentOpenAIVoice={audio.currentOpenAIVoice}
            openAIVoices={audio.openAIVoices}
            currentRate={audio.currentRate}
            adaptiveDifficulty={state.adaptiveDifficulty}
            isChallenge={state.practiceMode === 'challenge'}
            challengeTimeLimitMs={estimatedTimeLimitMs}
            isPreviewLoading={false}
            onDifficultyChange={(diff) => dispatch({ type: 'SET_DIFFICULTY', payload: diff })}
            onSpeedLevelChange={(speed) => dispatch({ type: 'SET_SPEED_LEVEL', payload: speed })}
            onCategoryChange={(cat) => dispatch({ type: 'SET_CATEGORY', payload: cat })}
            onSessionLengthChange={(len) => dispatch({ type: 'SET_SESSION_LENGTH', payload: len })}
            onOpenAIVoiceChange={audio.setOpenAIVoice}
            onAdaptiveDifficultyToggle={() => {
              const newEnabled = !state.adaptiveDifficulty.enabled;
              dispatch({
                type: 'SET_ADAPTIVE_DIFFICULTY',
                payload: {
                  enabled: newEnabled,
                  currentLevel: state.difficulty,
                  consecutiveHighScores: 0,
                  consecutiveLowScores: 0,
                  recentScores: [],
                },
              });
            }}
            onStartSession={handleBeginSession}
            onChangeMode={() => {
              dispatch({ type: 'SET_SHOW_MODE_SELECTOR', payload: true });
              dispatch({ type: 'SET_IS_WAITING_TO_START', payload: false });
              const newUrl = window.location.pathname;
              window.history.pushState(null, '', newUrl);
            }}
            isLoading={isFetching || state.isPrefetching}
          />
        </div>
      </TooltipProvider>
    );
  }
  
  // Main practice view
  const isReady = !audio.isSpeaking && state.testState.startTime !== null;
  
  // Get current zen theme config
  const zenThemeConfig = ZEN_THEMES[state.zenTheme];
  
  // Zen Mode fullscreen view for Focus Mode
  if (state.isZenMode && state.practiceMode === 'focus') {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8"
        style={{ background: zenThemeConfig.gradient }}
      >
        {/* Exit Zen Mode button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          style={{ color: zenThemeConfig.textColor }}
          onClick={actions.exitZenMode}
          data-testid="button-exit-zen"
        >
          <Minimize2 className="w-5 h-5" />
        </Button>
        
        {/* Zen Mode content */}
        <div className="w-full max-w-2xl space-y-8">
          {/* Encouragement message */}
          <p 
            className="text-center text-lg italic opacity-80"
            style={{ color: zenThemeConfig.textColor }}
          >
            {getRandomEncouragement()}
          </p>
          
          {/* Progress indicator */}
          <div className="text-center">
            <span 
              className="text-sm font-medium"
              style={{ color: zenThemeConfig.accentColor }}
            >
              Sentence {state.sessionProgress + 1} of {state.sessionLength}
            </span>
          </div>
          
          {/* Audio player with play button for Zen mode */}
          <div className="flex flex-col items-center gap-4">
            <DictationAudioPlayer
              isSpeaking={audio.isSpeaking}
              isReady={isReady}
              isLoading={isFetching}
              showHint={state.testState.showHint}
              hintText={state.testState.sentence?.sentence}
            />
            
            {/* Play/Replay button in Zen mode - use speakStreaming, let onSpeechEnd handle timer start */}
            {state.testState.sentence && !audio.isSpeaking && !state.testState.isComplete && (() => {
              const modeConfig = PRACTICE_MODES[state.practiceMode];
              const maxReplays = modeConfig.maxReplays;
              const isReplayAction = state.testState.startTime !== null;
              const replaysRemaining = maxReplays !== undefined ? maxReplays - state.testState.replayCount : undefined;
              const replayLimitReached = isReplayAction && replaysRemaining !== undefined && replaysRemaining <= 0;
              
              return (
                <Button
                  variant="outline"
                  disabled={replayLimitReached}
                  onClick={() => {
                    // Use speakStreaming - timer starts via onSpeechEnd callback in standard flow
                    audio.speakStreaming(state.testState.sentence!.sentence);
                    // Increment replay count if already started
                    if (state.testState.startTime !== null) {
                      actions.incrementReplayCount();
                    }
                  }}
                  style={{ 
                    background: zenThemeConfig.buttonBg,
                    color: zenThemeConfig.textColor,
                    borderColor: zenThemeConfig.accentColor,
                    opacity: replayLimitReached ? 0.5 : 1
                  }}
                  data-testid="button-zen-play"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {!isReplayAction ? 'Play Audio' : 'Replay Audio'}
                  {isReplayAction && replaysRemaining !== undefined && (
                    <span className="ml-2 text-xs opacity-75">
                      ({replaysRemaining} left)
                    </span>
                  )}
                </Button>
              );
            })()}
          </div>
          
          {/* Typing area */}
          {state.testState.sentence && !state.testState.isComplete && (
            <div 
              className="rounded-lg p-4"
              style={{ background: zenThemeConfig.inputBg }}
            >
              <DictationTypingArea
                typedText={state.testState.typedText}
                onTypedTextChange={actions.setTypedText}
                onSubmit={handleSubmit}
                onReplay={handleReplay}
                onToggleHint={actions.toggleHint}
                showHint={state.testState.showHint}
                elapsedTime={state.elapsedTime}
                practiceMode={state.practiceMode}
                isSpeaking={audio.isSpeaking}
                isReady={isReady}
                disabled={isFetching || isSaving}
                replayCount={state.testState.replayCount}
                timeLimitMs={state.testState.timeLimitMs}
              />
            </div>
          )}
          
          {/* Results in zen mode */}
          {state.testState.isComplete && state.testState.result && (
            <div 
              className="rounded-lg p-6"
              style={{ background: zenThemeConfig.inputBg }}
            >
              <DictationResults
                result={state.testState.result}
                sentence={state.testState.sentence!.sentence}
                typedText={state.testState.typedText}
                replayCount={state.testState.replayCount}
                hintUsed={state.testState.hintShown}
                duration={state.testState.result.duration}
                coachingTip={state.currentCoachingTip}
                autoAdvanceCountdown={countdown.countdown}
                isLastSentence={state.sessionProgress >= state.sessionLength}
                onNext={handleNextSentence}
                onReplay={() => {
                  dispatch({
                    type: 'SET_TEST_STATE',
                    payload: {
                      typedText: '',
                      startTime: null,
                      endTime: null,
                      isComplete: false,
                      result: null,
                    },
                  });
                  timer.reset();
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'SET_SHOW_MODE_SELECTOR', payload: true })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to mode selection</TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{PRACTICE_MODES[state.practiceMode].name}</h1>
            
            {/* Countdown Timer for Challenge Mode - only show during active typing, hide during overlays */}
            {PRACTICE_MODES[state.practiceMode].timerPressure && 
             state.testState.sentence && 
             !state.testState.isComplete && 
             state.testState.startTime !== null &&
             state.testState.timeLimitMs !== null &&
             !state.showSettings && (() => {
              const timeRemainingMs = Math.max(0, state.testState.timeLimitMs! - (state.elapsedTime * 1000));
              const timeRemainingSec = Math.ceil(timeRemainingMs / 1000);
              const isUrgent = timeRemainingMs <= CHALLENGE_TIMING.URGENT_THRESHOLD_MS;
              const isWarning = timeRemainingMs <= CHALLENGE_TIMING.WARNING_THRESHOLD_MS;
              const isExpired = timeRemainingMs <= 0;
              
              return (
                <Badge 
                  variant="outline"
                  className={`font-mono text-sm px-3 py-1 ${
                    isExpired
                      ? 'bg-red-600/30 text-red-400 border-red-500/70 animate-pulse'
                      : isUrgent
                        ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' 
                        : isWarning 
                          ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50' 
                          : 'bg-muted'
                  }`}
                >
                  <Clock className="w-3 h-3 mr-1.5" />
                  {isExpired ? (
                    <span className="text-red-400">Time's Up!</span>
                  ) : (
                    <>
                      {Math.floor(timeRemainingSec / 60)}:{String(timeRemainingSec % 60).padStart(2, '0')}
                      {isUrgent && <span className="ml-1.5 text-xs">Hurry!</span>}
                    </>
                  )}
                </Badge>
              );
            })()}
          </div>
          
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: !state.showSettings })}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            
          </div>
        </div>
        
        {/* Settings panel */}
        {state.showSettings && (
          <DictationSettings
            practiceMode={state.practiceMode}
            difficulty={state.difficulty}
            speedLevel={state.speedLevel}
            category={state.category}
            currentOpenAIVoice={audio.currentOpenAIVoice}
            openAIVoices={audio.openAIVoices}
            currentRate={audio.currentRate}
            adaptiveDifficulty={state.adaptiveDifficulty}
            zenTheme={state.zenTheme}
            streakData={state.streakData}
            onSpeedLevelChange={(speed) => dispatch({ type: 'SET_SPEED_LEVEL', payload: speed })}
            onDifficultyChange={(diff) => {
              dispatch({ type: 'SET_DIFFICULTY', payload: diff });
              if (state.adaptiveDifficulty.enabled) {
                dispatch({
                  type: 'SET_ADAPTIVE_DIFFICULTY',
                  payload: { currentLevel: diff, consecutiveHighScores: 0, consecutiveLowScores: 0 },
                });
              }
            }}
            onCategoryChange={(cat) => dispatch({ type: 'SET_CATEGORY', payload: cat })}
            onOpenAIVoiceChange={audio.setOpenAIVoice}
            onZenThemeChange={(theme) => dispatch({ type: 'SET_ZEN_THEME', payload: theme })}
            onAdaptiveDifficultyToggle={() => {
              const newEnabled = !state.adaptiveDifficulty.enabled;
              dispatch({
                type: 'SET_ADAPTIVE_DIFFICULTY',
                payload: {
                  enabled: newEnabled,
                  currentLevel: state.difficulty,
                  consecutiveHighScores: 0,
                  consecutiveLowScores: 0,
                  recentScores: [],
                },
              });
              toast({
                title: newEnabled ? 'Adaptive Difficulty Enabled' : 'Adaptive Difficulty Disabled',
                description: newEnabled
                  ? 'Difficulty will adjust based on your performance.'
                  : 'Difficulty will stay at your selected level.',
              });
            }}
            onEnterZenMode={actions.enterZenMode}
            onClose={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
            isLoading={isFetching}
            isSpeaking={audio.isSpeaking}
          />
        )}
        
        {/* Progress bar */}
        <DictationProgressBar current={state.sessionProgress} total={state.sessionLength} />
        
        {/* Quick settings bar */}
        {!state.testState.isComplete && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quick Settings
                </h3>
                <Badge variant="outline" className="text-xs">
                  {state.testState.replayCount} replays
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                  <Select
                    value={state.difficulty}
                    onValueChange={(val) => dispatch({ type: 'SET_DIFFICULTY', payload: val as DifficultyLevel })}
                    disabled={isFetching || audio.isSpeaking}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Topic</label>
                  <Select
                    value={state.category}
                    onValueChange={(val) => dispatch({ type: 'SET_CATEGORY', payload: val })}
                    disabled={isFetching || audio.isSpeaking}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full h-10"
                    onClick={handleRestartSession}
                    disabled={isFetching || audio.isSpeaking}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart
                  </Button>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    className="w-full h-10"
                    onClick={() => {
                      handleNewSession();
                      
                      // Clean URL
                      const newUrl = window.location.pathname;
                      window.history.pushState(null, '', newUrl);
                    }}
                    disabled={isFetching || audio.isSpeaking}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Exit Mode
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main content based on test state */}
        {state.testState.isComplete && state.testState.result ? (
          <DictationResults
            result={state.testState.result}
            sentence={state.testState.sentence!.sentence}
            typedText={state.testState.typedText}
            replayCount={state.testState.replayCount}
            hintUsed={state.testState.hintShown}
            duration={state.testState.result.duration}
            coachingTip={state.currentCoachingTip}
            autoAdvanceCountdown={countdown.countdown}
            isLastSentence={state.sessionProgress >= state.sessionLength}
            onNext={handleNextSentence}
            onReplay={() => {
              // Reset and retry same sentence
              dispatch({
                type: 'SET_TEST_STATE',
                payload: {
                  typedText: '',
                  startTime: null,
                  endTime: null,
                  isComplete: false,
                  result: null,
                  replayCount: 0,
                  hintShown: false,
                  showHint: false,
                },
              });
              timer.reset();
              setTimeout(() => {
                audio.speak(state.testState.sentence!.sentence);
              }, 500);
            }}
          />
        ) : (
          <>
            {/* Audio player */}
            <Card className="mb-6 overflow-hidden">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <DictationAudioPlayer
                    isSpeaking={audio.isSpeaking}
                    isReady={isReady}
                    isLoading={isFetching}
                    showHint={state.testState.showHint}
                    hintText={state.testState.sentence?.sentence}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Typing area */}
            <DictationTypingArea
              typedText={state.testState.typedText}
              onTypedTextChange={actions.setTypedText}
              onSubmit={handleSubmit}
              onReplay={handleReplay}
              onToggleHint={actions.toggleHint}
              showHint={state.testState.showHint}
              elapsedTime={state.elapsedTime}
              practiceMode={state.practiceMode}
              isSpeaking={audio.isSpeaking}
              isReady={isReady}
              disabled={isFetching || isSaving}
              replayCount={state.testState.replayCount}
              timeLimitMs={state.testState.timeLimitMs}
            />
          </>
        )}
        
        {/* Share dialog for single sentence results */}
        {showShareModal && state.testState.result && (
          <DictationShareDialog
            open={showShareModal}
            onOpenChange={setShowShareModal}
            wpm={Math.round(state.testState.result.wpm)}
            accuracy={Math.round(state.testState.result.accuracy)}
            errors={state.testState.result.errors}
            duration={state.testState.result.duration || 60}
            lastResultId={state.lastTestResultId}
            username={user?.username}
            speedLevel={state.speedLevel}
          />
        )}
        
        {/* Time's Up Overlay for Challenge Mode */}
        {state.testState.showTimeUpOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="max-w-sm w-full mx-4 text-center border-red-500/30 bg-background/95">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-red-500">Time's Up!</h2>
                <p className="text-muted-foreground mb-6">
                  {state.testState.typedText.trim() 
                    ? 'Your answer was auto-submitted.' 
                    : 'You ran out of time. Try to type faster next time!'}
                </p>
                <Button 
                  onClick={handleDismissTimeUpOverlay}
                  data-testid="button-dismiss-timeout"
                >
                  {state.sessionProgress >= state.sessionLength ? 'View Results' : 'Next Sentence'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// WRAPPED EXPORT WITH ERROR BOUNDARY AND PROVIDER
// ============================================================================

export default function DictationMode() {
  return (
    <DictationErrorBoundary>
      <DictationProvider>
        <DictationModeContent />
      </DictationProvider>
    </DictationErrorBoundary>
  );
}
