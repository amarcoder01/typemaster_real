import React, { useRef, useEffect, useMemo } from 'react';
import { HelpCircle, RotateCcw, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PRACTICE_MODES, type PracticeMode } from '../types';

interface DictationTypingAreaProps {
  typedText: string;
  onTypedTextChange: (text: string) => void;
  onSubmit: () => void;
  onReplay: () => void;
  onToggleHint: () => void;
  showHint: boolean;
  elapsedTime: number;
  practiceMode: PracticeMode;
  isSpeaking: boolean;
  isReady: boolean; // True when audio finished and user can type
  disabled?: boolean;
  // Optional: for real-time feedback
  targetSentence?: string;
  showRealTimeFeedback?: boolean;
  // Optional: replay limit for Focus Mode
  replayCount?: number;
  // Optional: time limit for Challenge Mode (in milliseconds)
  timeLimitMs?: number | null;
}

/**
 * Typing area with real-time feedback and controls
 */
export function DictationTypingArea({
  typedText,
  onTypedTextChange,
  onSubmit,
  onReplay,
  onToggleHint,
  showHint,
  elapsedTime,
  practiceMode,
  isSpeaking,
  isReady,
  disabled = false,
  targetSentence,
  showRealTimeFeedback = false,
  replayCount = 0,
  timeLimitMs = null,
}: DictationTypingAreaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modeConfig = PRACTICE_MODES[practiceMode];
  const maxReplays = modeConfig.maxReplays;
  const replaysRemaining = maxReplays !== undefined ? maxReplays - replayCount : undefined;
  const replayLimitReached = replaysRemaining !== undefined && replaysRemaining <= 0;
  
  // Focus input when ready
  useEffect(() => {
    if (isReady && !isSpeaking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReady, isSpeaking]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isSpeaking && isReady) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  // Calculate remaining time for Challenge Mode
  const timeLimitSeconds = timeLimitMs ? Math.ceil(timeLimitMs / 1000) : null;
  const remainingTime = timeLimitSeconds ? Math.max(0, timeLimitSeconds - elapsedTime) : null;
  const hasTimeLimit = timeLimitSeconds !== null && modeConfig.timerPressure;
  
  // Get timer color based on remaining time (for challenge mode) or elapsed time (for other modes)
  const getTimerColor = () => {
    if (!modeConfig.timerPressure) return 'text-green-600';
    if (hasTimeLimit && remainingTime !== null) {
      // Remaining time logic - lower is more urgent
      if (remainingTime <= 0) return 'text-red-600';
      if (remainingTime <= 5) return 'text-red-600';
      if (remainingTime <= 10) return 'text-orange-500';
      if (remainingTime <= 15) return 'text-yellow-600';
      return 'text-green-600';
    }
    // Fallback to elapsed time logic
    if (elapsedTime > 45) return 'text-red-600';
    if (elapsedTime > 30) return 'text-orange-500';
    if (elapsedTime > 15) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getTimerBgColor = () => {
    if (!modeConfig.timerPressure) return 'bg-green-500/10';
    if (hasTimeLimit && remainingTime !== null) {
      if (remainingTime <= 0) return 'bg-red-500/30';
      if (remainingTime <= 5) return 'bg-red-500/20';
      if (remainingTime <= 10) return 'bg-orange-500/20';
      if (remainingTime <= 15) return 'bg-yellow-500/20';
      return 'bg-green-500/10';
    }
    if (elapsedTime > 45) return 'bg-red-500/20';
    if (elapsedTime > 30) return 'bg-orange-500/20';
    if (elapsedTime > 15) return 'bg-yellow-500/20';
    return 'bg-green-500/10';
  };
  
  const getDotColor = () => {
    if (!modeConfig.timerPressure) return 'bg-green-600';
    if (hasTimeLimit && remainingTime !== null) {
      if (remainingTime <= 0) return 'bg-red-600';
      if (remainingTime <= 5) return 'bg-red-600';
      if (remainingTime <= 10) return 'bg-orange-500';
      if (remainingTime <= 15) return 'bg-yellow-600';
      return 'bg-green-600';
    }
    if (elapsedTime > 45) return 'bg-red-600';
    if (elapsedTime > 30) return 'bg-orange-500';
    if (elapsedTime > 15) return 'bg-yellow-600';
    return 'bg-green-600';
  };
  
  // Get timer status message
  const getTimerMessage = () => {
    if (!hasTimeLimit) return 'Timer running';
    if (remainingTime !== null && remainingTime <= 0) return 'Time expired!';
    if (remainingTime !== null && remainingTime <= 5) return 'Time almost up!';
    if (remainingTime !== null && remainingTime <= 10) return 'Hurry up!';
    return 'Time remaining';
  };
  
  // Real-time character feedback
  const characterFeedback = useMemo(() => {
    if (!showRealTimeFeedback || !targetSentence || !typedText) {
      return null;
    }
    
    const chars: { char: string; status: 'correct' | 'incorrect' | 'pending' }[] = [];
    const target = targetSentence.toLowerCase();
    const typed = typedText.toLowerCase();
    
    for (let i = 0; i < target.length; i++) {
      if (i < typed.length) {
        chars.push({
          char: targetSentence[i],
          status: typed[i] === target[i] ? 'correct' : 'incorrect',
        });
      } else {
        chars.push({
          char: targetSentence[i],
          status: 'pending',
        });
      }
    }
    
    return chars;
  }, [targetSentence, typedText, showRealTimeFeedback]);
  
  // Calculate real-time stats
  const realtimeStats = useMemo(() => {
    if (!characterFeedback) return null;
    
    const typed = characterFeedback.filter(c => c.status !== 'pending');
    const correct = characterFeedback.filter(c => c.status === 'correct').length;
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    
    return {
      typed: typed.length,
      correct,
      total: characterFeedback.length,
      accuracy,
    };
  }, [characterFeedback]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      {/* Real-time feedback preview (optional) */}
      {showRealTimeFeedback && characterFeedback && characterFeedback.length > 0 && (
        <Card className="mb-4 bg-muted/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Real-time Preview</span>
              {realtimeStats && (
                <span className={`text-xs font-mono ${realtimeStats.accuracy >= 90 ? 'text-green-600' : realtimeStats.accuracy >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {realtimeStats.accuracy}% accuracy
                </span>
              )}
            </div>
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {characterFeedback.map((item, idx) => (
                <span
                  key={idx}
                  className={
                    item.status === 'correct'
                      ? 'text-green-600 dark:text-green-400'
                      : item.status === 'incorrect'
                      ? 'text-red-600 dark:text-red-400 underline'
                      : 'text-muted-foreground/50'
                  }
                >
                  {item.char}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    
      {/* Typing input */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-help flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
                  tabIndex={0}
                  role="button"
                  aria-label="Typing area help information"
                >
                  Type what you heard:
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">Typing Area</p>
                <p className="text-xs opacity-90">
                  Type the sentence exactly as you heard it. Punctuation and capitalization matter for accuracy!
                </p>
              </TooltipContent>
            </Tooltip>
            
            {/* Timer display */}
            {isReady && !isSpeaking && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-xs flex items-center gap-2 cursor-help transition-colors ${getTimerColor()}`}
                    data-testid="timer-display"
                  >
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${getDotColor()}`} />
                      {getTimerMessage()}
                    </span>
                    <span className={`font-mono px-2 py-0.5 rounded ${getTimerBgColor()}`} data-testid="timer-value">
                      {hasTimeLimit && remainingTime !== null
                        ? formatTime(remainingTime)
                        : formatTime(elapsedTime)}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {hasTimeLimit
                      ? `Challenge mode: ${remainingTime}s remaining to complete!`
                      : 'Time elapsed since audio finished. Type your answer now!'}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </label>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Textarea
                  ref={inputRef}
                  value={typedText}
                  onChange={(e) => onTypedTextChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type here... (Ctrl+Enter to submit)"
                  className="text-lg p-4 min-h-[120px] resize-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  disabled={disabled || isSpeaking || !isReady}
                  data-testid="input-typed-text"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">Auto-correct and spell-check are disabled for accurate practice</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Character count and shortcuts */}
          <div className="flex items-center justify-between mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="text-xs text-muted-foreground cursor-help focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
                  tabIndex={0}
                  role="status"
                  aria-label={`${typedText.length} characters typed`}
                >
                  {typedText.length} characters
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total characters you've typed so far</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="text-xs text-muted-foreground cursor-help flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
                  tabIndex={0}
                  role="note"
                  aria-label="Press Control plus Enter to submit"
                >
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                  <span>to submit</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard shortcut to quickly submit your answer</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
      
      {/* Action buttons */}
      <Card className="mb-4 bg-gradient-to-r from-muted/50 to-muted/30">
        <CardContent className="py-4">
          <div className="flex gap-3 justify-center flex-wrap items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onReplay}
                  disabled={disabled || isSpeaking || replayLimitReached}
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                  data-testid="button-replay"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Replay
                  {replaysRemaining !== undefined && (
                    <span className={`ml-2 text-xs ${replayLimitReached ? 'text-red-500' : 'text-muted-foreground'}`}>
                      ({replaysRemaining} left)
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {replayLimitReached 
                    ? 'No replays remaining - listen carefully!' 
                    : `Listen to the sentence again (press R)${replaysRemaining !== undefined ? ` - ${replaysRemaining} remaining` : ''}`
                  }
                </p>
              </TooltipContent>
            </Tooltip>
            
            {modeConfig.hintsAllowed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggleHint}
                    disabled={disabled || isSpeaking}
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 text-base"
                    data-testid="button-hint"
                  >
                    {showHint ? (
                      <EyeOff className="w-5 h-5 mr-2" />
                    ) : (
                      <Eye className="w-5 h-5 mr-2" />
                    )}
                    {showHint ? 'Hide' : 'Hint'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show the sentence text (press H)</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSubmit}
                  disabled={!typedText.trim() || isSpeaking || !isReady || disabled}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
                  data-testid="button-submit"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Submit
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Submit your answer (Ctrl+Enter)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
