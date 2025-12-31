/**
 * Book Components
 * 
 * UI components for the enhanced Book Mode experience.
 * Premium paragraph-based reading with inline typing.
 */

// Headers
export { BookHeader, BookHeaderCompact, BookHeaderInline, BookHeaderFloating } from './BookHeader';
export type { BookHeaderProps, BookHeaderInlineProps } from './BookHeader';

// Progress indicators
export { ReadingProgress, ReadingProgressInline } from './ReadingProgress';
export type { ReadingProgressProps } from './ReadingProgress';

export { BookProgressBar, BookProgressInline } from './BookProgressBar';
export type { BookProgressBarProps } from './BookProgressBar';

// Paragraph-based reading
export { ParagraphCard, getParagraphText } from './ParagraphCard';
export type { ParagraphCardProps, ParagraphState } from './ParagraphCard';

export { InlineTypingOverlay } from './InlineTypingOverlay';
export type { InlineTypingOverlayProps, InlineTypingOverlayHandle } from './InlineTypingOverlay';

export { FocusedReader } from './FocusedReader';
export type { FocusedReaderProps, ReadingMode } from './FocusedReader';

// Navigation
export { ChapterNavigation, ChapterNavigationInline, ChapterNavigationPanel } from './ChapterNavigation';
export type { ChapterNavigationProps, ChapterInfo } from './ChapterNavigation';

// Statistics
export { SessionStats, SessionStatsExpanded, SessionStatsCollapsed, SessionStatsMini } from './SessionStats';
export type { SessionStatsProps } from './SessionStats';

// Context (legacy)
export { TypingContext, TypingLine } from './TypingContext';
export type { TypingContextProps } from './TypingContext';
