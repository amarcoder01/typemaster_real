/**
 * ParagraphCard Component
 * 
 * Displays a single paragraph in a visually distinct card with state-based styling.
 * Part of the premium Book Mode UI - creates clear visual separation between paragraphs.
 * 
 * States:
 * - current: Full opacity, shadow, slight scale-up - actively being typed
 * - completed: Dimmed, no shadow, scale-down - already typed
 * - upcoming: Semi-visible, blur - preview of what's next
 * - hidden: Not rendered - for focus mode
 */

import { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ParsedContent } from '@/lib/book-content-parser';
import { getTypeStyle, CHARACTER_STYLES } from '@/lib/book-typography';

export type ParagraphState = 'completed' | 'current' | 'upcoming' | 'hidden';

export interface ParagraphCardProps {
  /** Content blocks in this paragraph */
  blocks: ParsedContent[];
  /** Current state of this paragraph */
  state: ParagraphState;
  /** Index of this paragraph (0-based) */
  paragraphIndex: number;
  /** Total number of paragraphs */
  totalParagraphs: number;
  /** User's typed input for this paragraph */
  userInput?: string;
  /** Character offset where this paragraph starts in full text */
  charOffset?: number;
  /** Whether typing is active */
  isTyping?: boolean;
  /** Children elements (e.g., inline typing overlay) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Click handler for navigation */
  onClick?: () => void;
}

/**
 * State-based styling classes
 * Clean book-reading style - no cards, just clean typography
 */
const CARD_STATE_STYLES: Record<ParagraphState, string> = {
  current: 'opacity-100',
  completed: 'opacity-30',
  upcoming: 'opacity-40',
  hidden: 'hidden',
};

/**
 * Get text to display for a paragraph (joined display text from blocks)
 */
export function getParagraphText(blocks: ParsedContent[]): string {
  return blocks.map(b => b.displayText).join(' ');
}

/**
 * Render highlighted characters for typing feedback
 */
function renderHighlightedText(
  blocks: ParsedContent[],
  userInput: string,
  charOffset: number = 0
): React.ReactNode {
  const result: React.ReactNode[] = [];
  let globalIndex = 0;

  blocks.forEach((block, blockIdx) => {
    const typeConfig = getTypeStyle(block.type);
    const blockChars: React.ReactNode[] = [];

    // Add space before block (except first)
    if (blockIdx > 0) {
      const spaceGlobalPos = charOffset + globalIndex;
      const isSpaceTyped = spaceGlobalPos < userInput.length;
      const expectedSpace = ' ';
      const actualSpace = userInput[spaceGlobalPos];
      
      let spaceClass = CHARACTER_STYLES.pending;
      if (isSpaceTyped) {
        spaceClass = actualSpace === expectedSpace ? CHARACTER_STYLES.correct : CHARACTER_STYLES.incorrect;
      }
      
      blockChars.push(
        <span key={`space-${blockIdx}`} className={spaceClass}> </span>
      );
      globalIndex++;
    }

    // Render each character
    for (let i = 0; i < block.displayText.length; i++) {
      const charGlobalPos = charOffset + globalIndex;
      const expectedChar = block.displayText[i];
      const isTyped = charGlobalPos < userInput.length;
      const isAtCursor = charGlobalPos === userInput.length;
      
      let charClass = CHARACTER_STYLES.pending;
      let displayContent: React.ReactNode = expectedChar;

      if (isTyped) {
        const actualChar = userInput[charGlobalPos];
        if (actualChar === expectedChar) {
          charClass = CHARACTER_STYLES.correct;
        } else {
          // Show both expected (struck) and actual (highlighted)
          displayContent = (
            <span className="relative inline">
              <span className={CHARACTER_STYLES.incorrect}>{expectedChar}</span>
              <span className={CHARACTER_STYLES.actualTyped}>{actualChar || '·'}</span>
            </span>
          );
          charClass = '';
        }
      }

      blockChars.push(
        <span
          key={`${blockIdx}-${i}`}
          className={cn(
            charClass,
            isAtCursor && 'relative after:absolute after:left-0 after:top-0 after:h-full after:w-0.5 after:bg-primary after:animate-pulse'
          )}
        >
          {displayContent}
        </span>
      );
      globalIndex++;
    }

    // Wrap block in appropriate element with styling
    const BlockWrapper = typeConfig.element as React.ElementType;
    result.push(
      <BlockWrapper
        key={`block-${blockIdx}`}
        className={cn(
          typeConfig.className,
          'transition-colors duration-150'
        )}
      >
        {blockChars}
      </BlockWrapper>
    );
  });

  return result;
}

/**
 * Render preview text (no typing highlighting, just dimmed)
 */
function renderPreviewText(blocks: ParsedContent[], truncate: boolean = false): React.ReactNode {
  const result: React.ReactNode[] = [];
  let totalLength = 0;
  const maxPreviewLength = 150;

  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    const block = blocks[blockIdx];
    const typeConfig = getTypeStyle(block.type);
    const BlockWrapper = typeConfig.element as React.ElementType;
    
    let text = block.displayText;
    
    // Truncate if needed
    if (truncate && totalLength + text.length > maxPreviewLength) {
      const remaining = maxPreviewLength - totalLength;
      if (remaining > 20) {
        text = text.substring(0, remaining) + '...';
      } else if (blockIdx === 0) {
        text = text.substring(0, maxPreviewLength) + '...';
      } else {
        break;
      }
    }
    
    totalLength += text.length + 1; // +1 for space

    result.push(
      <BlockWrapper
        key={`preview-${blockIdx}`}
        className={cn(typeConfig.className, 'text-muted-foreground')}
      >
        {text}
      </BlockWrapper>
    );

    if (truncate && totalLength >= maxPreviewLength) break;
  }

  return result;
}

export const ParagraphCard = forwardRef<HTMLDivElement, ParagraphCardProps>(
  function ParagraphCard(
    {
      blocks,
      state,
      paragraphIndex,
      totalParagraphs,
      userInput = '',
      charOffset = 0,
      isTyping = false,
      children,
      className,
      onClick,
    },
    ref
  ) {
    // Don't render hidden paragraphs
    if (state === 'hidden') {
      return null;
    }

    const content = useMemo(() => {
      if (state === 'current' && isTyping) {
        return renderHighlightedText(blocks, userInput, charOffset);
      }
      if (state === 'completed') {
        return renderPreviewText(blocks, false);
      }
      // Upcoming: show truncated preview
      return renderPreviewText(blocks, state === 'upcoming');
    }, [blocks, state, userInput, charOffset, isTyping]);

    const isClickable = state !== 'current' && onClick;

    return (
      <div
        ref={ref}
        className={cn(
          'paragraph-block',
          'relative',
          'py-6 md:py-8',
          'transition-opacity duration-300 ease-out',
          CARD_STATE_STYLES[state],
          isClickable && 'cursor-pointer hover:opacity-60',
          className
        )}
        onClick={isClickable ? onClick : undefined}
        data-paragraph-index={paragraphIndex}
        data-paragraph-state={state}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable ? `Go to paragraph ${paragraphIndex + 1}` : undefined}
      >
        {/* Main content - clean book typography like TypeLit.io */}
        <div className={cn(
          'paragraph-content',
          'max-w-[65ch] mx-auto px-4',
          // Clean serif italic typography matching the image
          'font-serif italic',
          'text-lg md:text-xl lg:text-[1.35rem]',
          'leading-[1.85] md:leading-[1.95]',
          'tracking-normal',
          'text-foreground/95',
          // Proper text justification for book feel
          'text-left',
          // Selection styling
          'selection:bg-primary/30'
        )}>
          {content}
        </div>

        {/* Children (e.g., inline typing overlay) */}
        {children}

        {/* Subtle progress hint for current paragraph */}
        {state === 'current' && !isTyping && userInput.length === 0 && (
          <div className="mt-4 text-center text-xs text-muted-foreground/30 uppercase tracking-[0.2em] animate-pulse">
            Start typing...
          </div>
        )}
      </div>
    );
  }
);

export default ParagraphCard;

