/**
 * Book Animations System
 * 
 * Transition and animation definitions for the premium Book Mode UI.
 * Provides smooth, book-like transitions between paragraphs and states.
 * 
 * Uses Tailwind CSS animate utilities and custom keyframes.
 */

/**
 * Paragraph transition animations
 */
export const PARAGRAPH_TRANSITIONS = {
  // Entering as current paragraph
  enterCurrent: 'animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out',
  
  // Exiting to completed state
  exitCompleted: 'animate-out fade-out-50 slide-out-to-top-2 duration-300 ease-in',
  
  // Becoming upcoming (preview)
  enterUpcoming: 'animate-in fade-in-50 duration-400 ease-out',
  
  // Generic fade
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Scale transitions
  scaleUp: 'animate-in zoom-in-95 duration-300',
  scaleDown: 'animate-out zoom-out-95 duration-200',
};

/**
 * Cursor and typing animations
 */
export const TYPING_ANIMATIONS = {
  // Blinking cursor
  cursor: 'after:animate-pulse',
  cursorBlink: 'animate-[blink_1s_step-end_infinite]',
  
  // Character highlight
  charCorrect: 'transition-colors duration-100',
  charError: 'transition-colors duration-75 animate-[shake_0.2s_ease-in-out]',
};

/**
 * Progress bar animations
 */
export const PROGRESS_ANIMATIONS = {
  // Progress fill
  fill: 'transition-all duration-300 ease-out',
  
  // Completion pulse
  completePulse: 'animate-[pulse_0.5s_ease-out]',
  
  // Segment dot
  dotActive: 'animate-pulse',
  dotComplete: 'transition-all duration-200',
};

/**
 * Card state transitions
 */
export const CARD_TRANSITIONS = {
  // Base transition for all state changes
  base: 'transition-all duration-300 ease-out',
  
  // Specific state transitions
  toCurrent: 'transition-[transform,opacity,box-shadow] duration-400 ease-out',
  toCompleted: 'transition-[transform,opacity,filter] duration-300 ease-in',
  toUpcoming: 'transition-[opacity,filter] duration-400 ease-out',
  
  // Hover effect for navigable cards
  hoverScale: 'hover:scale-[1.01] hover:shadow-md transition-transform duration-150',
};

/**
 * Completion celebration animations
 */
export const CELEBRATION_ANIMATIONS = {
  // Paragraph complete
  paragraphComplete: 'animate-[celebrateParagraph_0.6s_ease-out]',
  
  // Chapter complete
  chapterComplete: 'animate-[celebrateChapter_1s_ease-out]',
  
  // Success flash
  successFlash: 'animate-[successFlash_0.4s_ease-out]',
  
  // Badge earned
  badgeEarned: 'animate-[badgePop_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]',
};

/**
 * Scroll animations
 */
export const SCROLL_ANIMATIONS = {
  // Smooth scroll to element
  smoothScroll: 'scroll-smooth',
  
  // Scroll snap
  snapCenter: 'scroll-snap-align-center',
  snapStart: 'scroll-snap-align-start',
};

/**
 * Loading and skeleton animations
 */
export const LOADING_ANIMATIONS = {
  // Skeleton shimmer
  shimmer: 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
  
  // Spinner
  spinner: 'animate-spin',
  
  // Fade in on load
  fadeInLoad: 'animate-in fade-in duration-500 delay-100',
};

/**
 * Combined animation classes for common use cases
 */
export const ANIMATION_PRESETS = {
  // Paragraph becoming active
  paragraphActivate: `${PARAGRAPH_TRANSITIONS.enterCurrent} ${CARD_TRANSITIONS.toCurrent}`,
  
  // Paragraph completing
  paragraphDeactivate: `${PARAGRAPH_TRANSITIONS.exitCompleted} ${CARD_TRANSITIONS.toCompleted}`,
  
  // Card hover interaction
  cardInteractive: `${CARD_TRANSITIONS.base} ${CARD_TRANSITIONS.hoverScale}`,
  
  // Smooth element appearance
  smoothAppear: 'animate-in fade-in slide-in-from-bottom-2 duration-400',
  
  // Quick subtle appear
  subtleAppear: 'animate-in fade-in-50 duration-200',
};

/**
 * CSS keyframe definitions (to be added to global CSS or tailwind config)
 * These are the custom keyframes referenced in the animations above.
 */
export const CSS_KEYFRAMES = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes celebrateParagraph {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(var(--primary), 0.3); }
  100% { transform: scale(1); }
}

@keyframes celebrateChapter {
  0% { transform: scale(1); opacity: 1; }
  30% { transform: scale(1.05); }
  60% { transform: scale(0.98); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes successFlash {
  0% { background-color: transparent; }
  50% { background-color: rgba(34, 197, 94, 0.1); }
  100% { background-color: transparent; }
}

@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

/**
 * Helper to combine animation classes
 */
export function combineAnimations(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get animation class based on paragraph state transition
 */
export function getParagraphAnimation(
  fromState: 'hidden' | 'upcoming' | 'current' | 'completed',
  toState: 'hidden' | 'upcoming' | 'current' | 'completed'
): string {
  if (fromState === toState) return CARD_TRANSITIONS.base;
  
  if (toState === 'current') {
    return ANIMATION_PRESETS.paragraphActivate;
  }
  
  if (toState === 'completed') {
    return ANIMATION_PRESETS.paragraphDeactivate;
  }
  
  if (toState === 'upcoming') {
    return `${PARAGRAPH_TRANSITIONS.enterUpcoming} ${CARD_TRANSITIONS.toUpcoming}`;
  }
  
  return CARD_TRANSITIONS.base;
}

/**
 * Timing functions for JS animations
 */
export const TIMING = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
  
  // Easing functions
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

/**
 * Delay helpers for staggered animations
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `delay-[${index * baseDelay}ms]`;
}

export function getStaggerStyle(index: number, baseDelay: number = 50): React.CSSProperties {
  return { animationDelay: `${index * baseDelay}ms` };
}

