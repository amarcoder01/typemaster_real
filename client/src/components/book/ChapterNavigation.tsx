/**
 * ChapterNavigation Component
 * 
 * Navigation panel for jumping between chapters/sections in Book Mode.
 * Provides overview of book structure and quick access to different parts.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, BookOpen, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChapterInfo {
  /** Chapter/section title */
  title: string;
  /** Starting paragraph index */
  paragraphStart: number;
  /** Ending paragraph index */
  paragraphEnd: number;
  /** Word count in this chapter */
  wordCount?: number;
  /** Whether this chapter is completed */
  isCompleted?: boolean;
  /** Progress within this chapter (0-100) */
  progress?: number;
}

export interface ChapterNavigationProps {
  /** List of chapters/sections */
  chapters: ChapterInfo[];
  /** Current chapter index */
  currentChapter: number;
  /** Current paragraph within chapter */
  currentParagraph: number;
  /** Total paragraphs */
  totalParagraphs: number;
  /** Callback when chapter is selected */
  onChapterSelect: (chapterIndex: number) => void;
  /** Callback when paragraph is selected */
  onParagraphSelect?: (paragraphIndex: number) => void;
  /** Whether navigation is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Inline chapter navigation (previous/next buttons)
 */
export function ChapterNavigationInline({
  chapters,
  currentChapter,
  onChapterSelect,
  disabled = false,
  className,
}: Omit<ChapterNavigationProps, 'currentParagraph' | 'totalParagraphs'>) {
  const hasPrevious = currentChapter > 0;
  const hasNext = currentChapter < chapters.length - 1;
  const current = chapters[currentChapter];
  
  return (
    <div className={cn(
      'flex items-center justify-between gap-4',
      className
    )}>
      {/* Previous button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChapterSelect(currentChapter - 1)}
        disabled={!hasPrevious || disabled}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      
      {/* Current chapter indicator */}
      <div className="flex items-center gap-2 text-sm">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium truncate max-w-[150px] sm:max-w-[250px]">
          {current?.title || `Chapter ${currentChapter + 1}`}
        </span>
        <Badge variant="secondary" className="text-xs">
          {currentChapter + 1}/{chapters.length}
        </Badge>
      </div>
      
      {/* Next button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChapterSelect(currentChapter + 1)}
        disabled={!hasNext || disabled}
        className="gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * Full chapter navigation panel (drawer/sheet)
 */
export function ChapterNavigationPanel({
  chapters,
  currentChapter,
  currentParagraph,
  totalParagraphs,
  onChapterSelect,
  onParagraphSelect,
  disabled = false,
  className,
}: ChapterNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (totalParagraphs === 0) return 0;
    return (currentParagraph / totalParagraphs) * 100;
  }, [currentParagraph, totalParagraphs]);
  
  const handleChapterClick = (index: number) => {
    onChapterSelect(index);
    setIsOpen(false);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          disabled={disabled}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Contents</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Table of Contents
          </SheetTitle>
        </SheetHeader>
        
        {/* Overall progress */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-mono font-bold text-primary">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Paragraph {currentParagraph + 1} of {totalParagraphs}
          </p>
        </div>
        
        {/* Chapter list */}
        <ScrollArea className="mt-6 h-[calc(100vh-200px)]">
          <div className="space-y-2 pr-4">
            {chapters.map((chapter, index) => {
              const isCurrent = index === currentChapter;
              const isCompleted = chapter.isCompleted || (index < currentChapter);
              
              return (
                <button
                  key={index}
                  onClick={() => handleChapterClick(index)}
                  disabled={disabled}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200',
                    'border hover:border-primary/30',
                    isCurrent && 'bg-primary/10 border-primary/30 ring-1 ring-primary/20',
                    !isCurrent && isCompleted && 'bg-muted/50 border-muted',
                    !isCurrent && !isCompleted && 'border-border/50 hover:bg-muted/30',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm truncate',
                        isCurrent && 'text-primary',
                        isCompleted && !isCurrent && 'text-muted-foreground'
                      )}>
                        {chapter.title || `Chapter ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Paragraphs {chapter.paragraphStart + 1}-{chapter.paragraphEnd + 1}
                        {chapter.wordCount && ` • ${chapter.wordCount} words`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isCompleted && !isCurrent && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                          ✓
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Chapter progress bar */}
                  {(isCurrent || chapter.progress !== undefined) && (
                    <div className="mt-2">
                      <Progress 
                        value={chapter.progress || 0} 
                        className="h-1" 
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Combined navigation component with both inline and panel options
 */
export function ChapterNavigation({
  chapters,
  currentChapter,
  currentParagraph,
  totalParagraphs,
  onChapterSelect,
  onParagraphSelect,
  disabled = false,
  className,
}: ChapterNavigationProps) {
  // If only one chapter or no chapters, show simplified view
  if (chapters.length <= 1) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <BookOpen className="w-4 h-4" />
        <span>Paragraph {currentParagraph + 1} of {totalParagraphs}</span>
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Panel trigger */}
      <ChapterNavigationPanel
        chapters={chapters}
        currentChapter={currentChapter}
        currentParagraph={currentParagraph}
        totalParagraphs={totalParagraphs}
        onChapterSelect={onChapterSelect}
        onParagraphSelect={onParagraphSelect}
        disabled={disabled}
      />
      
      {/* Inline navigation */}
      <ChapterNavigationInline
        chapters={chapters}
        currentChapter={currentChapter}
        onChapterSelect={onChapterSelect}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}

export default ChapterNavigation;

