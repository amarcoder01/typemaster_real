/**
 * BookProgressBar Component
 * 
 * Simplified horizontal progress bar for Book Mode.
 * Replaces the complex segment dots with a clean, intuitive design.
 * 
 * Features:
 * - Single progress bar showing overall completion
 * - Paragraph indicator (e.g., "3 of 12")
 * - Words remaining counter
 * - Animated transitions
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Clock } from 'lucide-react';

export interface BookProgressBarProps {
  /** Current paragraph number (1-based) */
  currentParagraph: number;
  /** Total number of paragraphs */
  totalParagraphs: number;
  /** Progress within current paragraph (0-100) */
  paragraphProgress: number;
  /** Words remaining in current paragraph */
  wordsRemaining?: number;
  /** Total words in current paragraph */
  totalWords?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
  /** Whether to show compact version */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format time as human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function BookProgressBar({
  currentParagraph,
  totalParagraphs,
  paragraphProgress,
  wordsRemaining,
  totalWords,
  timeRemaining,
  compact = false,
  className,
}: BookProgressBarProps) {
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (totalParagraphs === 0) return 0;
    const completedParagraphs = currentParagraph - 1;
    const currentContribution = paragraphProgress / 100;
    return ((completedParagraphs + currentContribution) / totalParagraphs) * 100;
  }, [currentParagraph, totalParagraphs, paragraphProgress]);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {/* Paragraph indicator */}
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {currentParagraph}/{totalParagraphs}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('book-progress-bar space-y-3', className)}>
      {/* Paragraph dots - visual chapter structure */}
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: Math.min(totalParagraphs, 15) }).map((_, idx) => {
          const paragraphIdx = idx + 1;
          const isCompleted = paragraphIdx < currentParagraph;
          const isCurrent = paragraphIdx === currentParagraph;
          
          return (
            <div
              key={idx}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isCompleted && 'w-2 bg-green-500/70',
                isCurrent && 'w-8 bg-primary animate-pulse',
                !isCompleted && !isCurrent && 'w-2 bg-muted-foreground/20'
              )}
            />
          );
        })}
        {totalParagraphs > 15 && (
          <span className="text-xs text-muted-foreground/50 ml-1">
            +{totalParagraphs - 15}
          </span>
        )}
      </div>

      {/* Main progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <span className="text-sm font-mono font-bold text-primary min-w-[3rem] text-right">
          {Math.round(overallProgress)}%
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary/60" />
          <span>
            Paragraph <span className="font-semibold text-foreground">{currentParagraph}</span> of{' '}
            <span className="font-semibold text-foreground">{totalParagraphs}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {wordsRemaining !== undefined && totalWords !== undefined && (
            <span>
              <span className="font-medium text-foreground">{wordsRemaining}</span>
              <span className="text-muted-foreground/60"> words left</span>
            </span>
          )}
          
          {timeRemaining !== undefined && timeRemaining > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ultra-compact inline version for header integration
 */
export function BookProgressInline({
  currentParagraph,
  totalParagraphs,
  progress,
  className,
}: {
  currentParagraph: number;
  totalParagraphs: number;
  progress: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {currentParagraph}/{totalParagraphs}
      </span>
    </div>
  );
}

export default BookProgressBar;

