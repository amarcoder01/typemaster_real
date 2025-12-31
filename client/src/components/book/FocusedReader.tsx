/**
 * FocusedReader Component
 * 
 * Main container for the premium Book Mode reading experience.
 * Manages paragraph focus and provides immersive typing interface.
 * 
 * Reading Modes:
 * - focus: Only current paragraph visible (maximum immersion)
 * - flow: Current + preview of next paragraph
 * - full: Multiple paragraphs visible (traditional view)
 */

import { useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { ParsedContent } from '@/lib/book-content-parser';
import { ParagraphCard, getParagraphText, type ParagraphState } from './ParagraphCard';
import { InlineTypingOverlay, type InlineTypingOverlayHandle } from './InlineTypingOverlay';
import { CARD_TRANSITIONS, ANIMATION_PRESETS } from '@/lib/book-animations';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type ReadingMode = 'focus' | 'flow' | 'full';

export interface FocusedReaderProps {
  /** Array of paragraphs (each paragraph is an array of content blocks) */
  paragraphs: ParsedContent[][];
  /** Current paragraph index (0-based) */
  currentIndex: number;
  /** User's typed input for current paragraph */
  userInput: string;
  /** Callback when input changes */
  onInput: (value: string) => void;
  /** Callback when paragraph is completed */
  onParagraphComplete: () => void;
  /** Callback when typing starts */
  onTypingStart?: () => void;
  /** Reading mode */
  readingMode: ReadingMode;
  /** Whether typing is currently active */
  isTyping: boolean;
  /** Whether the reader is disabled (e.g., loading) */
  disabled?: boolean;
  /** Callback to navigate to a specific paragraph */
  onNavigate?: (index: number) => void;
  /** Additional className */
  className?: string;
}

/**
 * Calculate character offsets for each paragraph
 */
function calculateOffsets(paragraphs: ParsedContent[][]): number[] {
  const offsets: number[] = [];
  let currentOffset = 0;
  
  for (const paragraph of paragraphs) {
    offsets.push(currentOffset);
    const text = getParagraphText(paragraph);
    currentOffset += text.length + 1; // +1 for separator
  }
  
  return offsets;
}

/**
 * Determine paragraph state based on current index
 */
function getParagraphState(
  paragraphIndex: number,
  currentIndex: number,
  readingMode: ReadingMode
): ParagraphState {
  if (paragraphIndex === currentIndex) {
    return 'current';
  }
  
  if (paragraphIndex < currentIndex) {
    // Completed paragraphs
    if (readingMode === 'focus') {
      return 'hidden';
    }
    return 'completed';
  }
  
  // Upcoming paragraphs
  if (readingMode === 'focus') {
    return 'hidden';
  }
  
  if (readingMode === 'flow') {
    // Only show next paragraph in flow mode
    return paragraphIndex === currentIndex + 1 ? 'upcoming' : 'hidden';
  }
  
  // Full mode: show all
  return 'upcoming';
}

export const FocusedReader = forwardRef<HTMLDivElement, FocusedReaderProps>(
  function FocusedReader({
    paragraphs,
    currentIndex,
    userInput,
    onInput,
    onParagraphComplete,
    onTypingStart,
    readingMode,
    isTyping,
    disabled = false,
    onNavigate,
    className,
  }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<InlineTypingOverlayHandle>(null);
  
  // Calculate offsets for all paragraphs
  const offsets = useMemo(() => calculateOffsets(paragraphs), [paragraphs]);
  
  // Get current paragraph text
  const currentParagraphText = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= paragraphs.length) return '';
    return getParagraphText(paragraphs[currentIndex]);
  }, [paragraphs, currentIndex]);
  
  // Scroll current paragraph into view
  useEffect(() => {
    if (currentCardRef.current) {
      currentCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);
  
  // Focus the typing overlay when paragraph changes
  useEffect(() => {
    if (overlayRef.current && !disabled) {
      overlayRef.current.focus();
    }
  }, [currentIndex, disabled]);
  
  // Handle paragraph completion
  const handleComplete = useCallback(() => {
    onParagraphComplete();
    // Reset overlay for next paragraph
    if (overlayRef.current) {
      overlayRef.current.reset();
    }
  }, [onParagraphComplete]);
  
  // Handle paragraph navigation
  const handleNavigate = useCallback((index: number) => {
    if (onNavigate && index >= 0 && index < paragraphs.length && index !== currentIndex) {
      onNavigate(index);
    }
  }, [onNavigate, paragraphs.length, currentIndex]);
  
  // Navigate with keyboard arrows when not typing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isTyping || disabled) return;
    
    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      handleNavigate(currentIndex - 1);
    }
    if (e.key === 'ArrowDown' && currentIndex < paragraphs.length - 1) {
      e.preventDefault();
      handleNavigate(currentIndex + 1);
    }
  }, [isTyping, disabled, currentIndex, paragraphs.length, handleNavigate]);
  
  // Render navigation hints
  const showNavHints = !isTyping && onNavigate;
  
  if (paragraphs.length === 0) {
    return (
      <div className={cn('focused-reader text-center py-12 text-muted-foreground', className)}>
        <p>No content to display</p>
      </div>
    );
  }
  
  return (
    <div
      ref={ref || containerRef}
      className={cn(
        'focused-reader',
        'relative w-full',
        // Clean paragraph separation like TypeLit.io
        'divide-y divide-border/10',
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Navigation hint: Previous */}
      {showNavHints && currentIndex > 0 && readingMode !== 'focus' && (
        <button
          onClick={() => handleNavigate(currentIndex - 1)}
          className={cn(
            'flex items-center justify-center gap-1 w-full py-2',
            'text-xs text-muted-foreground/50 hover:text-muted-foreground',
            'transition-colors duration-200',
            CARD_TRANSITIONS.base
          )}
        >
          <ChevronUp className="w-4 h-4" />
          <span>Previous paragraph</span>
        </button>
      )}
      
      {/* Paragraphs */}
      {paragraphs.map((paragraph, index) => {
        const state = getParagraphState(index, currentIndex, readingMode);
        const isCurrent = index === currentIndex;
        
        // Don't render hidden paragraphs
        if (state === 'hidden') return null;
        
        return (
          <ParagraphCard
            key={`paragraph-${index}`}
            ref={isCurrent ? currentCardRef : undefined}
            blocks={paragraph}
            state={state}
            paragraphIndex={index}
            totalParagraphs={paragraphs.length}
            userInput={isCurrent ? userInput : undefined}
            charOffset={0} // Each paragraph starts at 0 for its own text
            isTyping={isCurrent && isTyping}
            className={cn(
              CARD_TRANSITIONS.base,
              isCurrent && ANIMATION_PRESETS.smoothAppear
            )}
            onClick={
              !isCurrent && onNavigate
                ? () => handleNavigate(index)
                : undefined
            }
          >
            {/* Inline typing overlay for current paragraph */}
            {isCurrent && (
              <InlineTypingOverlay
                ref={overlayRef}
                text={currentParagraphText}
                userInput={userInput}
                onInput={onInput}
                isActive={isTyping || !disabled}
                onComplete={handleComplete}
                onStart={onTypingStart}
                disabled={disabled}
                placeholder="Start typing to begin..."
              />
            )}
          </ParagraphCard>
        );
      })}
      
      {/* Navigation hint: Next */}
      {showNavHints && currentIndex < paragraphs.length - 1 && readingMode !== 'focus' && (
        <button
          onClick={() => handleNavigate(currentIndex + 1)}
          className={cn(
            'flex items-center justify-center gap-1 w-full py-3',
            'text-xs text-muted-foreground/40 hover:text-muted-foreground',
            'transition-colors duration-200',
            CARD_TRANSITIONS.base
          )}
        >
          <ChevronDown className="w-4 h-4" />
          <span>Next paragraph ({currentIndex + 2} of {paragraphs.length})</span>
        </button>
      )}
      
      {/* Flow/Full mode: Show paragraph progress dots */}
      {readingMode !== 'focus' && paragraphs.length > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          {paragraphs.slice(0, Math.min(20, paragraphs.length)).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200',
                idx < currentIndex && 'bg-green-500/50',
                idx === currentIndex && 'bg-primary w-4',
                idx > currentIndex && 'bg-muted-foreground/20'
              )}
            />
          ))}
          {paragraphs.length > 20 && (
            <span className="text-xs text-muted-foreground/40 ml-1">+{paragraphs.length - 20}</span>
          )}
        </div>
      )}
      
      {/* Focus mode: Show paragraph indicator when no other context */}
      {readingMode === 'focus' && paragraphs.length > 0 && (
        <div className="text-center space-y-3 pt-6">
          {/* Paragraph dots indicator - limit to 20 for UI cleanliness */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-xs mx-auto">
            {paragraphs.slice(0, Math.min(20, paragraphs.length)).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  idx < currentIndex && 'w-2 bg-green-500/60',
                  idx === currentIndex && 'w-6 bg-primary animate-pulse',
                  idx > currentIndex && 'w-2 bg-muted-foreground/30'
                )}
              />
            ))}
            {paragraphs.length > 20 && (
              <span className="text-xs text-muted-foreground/40 ml-1">
                +{paragraphs.length - 20}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground/50">
            Paragraph {currentIndex + 1} of {paragraphs.length}
            {!isTyping && currentIndex < paragraphs.length - 1 && (
              <span className="ml-2 text-primary/60">• Press Tab when complete</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default FocusedReader;

