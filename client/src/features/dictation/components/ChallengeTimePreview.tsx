import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DifficultyLevel } from '../types';
import { CHALLENGE_TIMING } from '../types';

interface ChallengeTimePreviewProps {
  timeLimitMs: number | null;
  difficulty: DifficultyLevel;
  isLoading?: boolean;
  wordCount?: number;
}

function formatTimeLimit(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'easy':
      return 'Relaxed pace';
    case 'medium':
      return 'Standard pace';
    case 'hard':
      return 'Fast pace';
    default:
      return 'Standard pace';
  }
}

export function ChallengeTimePreview({
  timeLimitMs,
  difficulty,
  isLoading = false,
  wordCount,
}: ChallengeTimePreviewProps) {
  if (isLoading) {
    return (
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Time Limit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-20 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (timeLimitMs === null) {
    return null;
  }

  const difficultyLabel = getDifficultyLabel(difficulty);
  const isEasy = difficulty === 'easy';
  const isHard = difficulty === 'hard';

  return (
    <Card className="border-orange-500/20 bg-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Time Limit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-500">
            {formatTimeLimit(timeLimitMs)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            to complete this sentence
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              isEasy 
                ? 'border-green-500/50 text-green-600' 
                : isHard 
                  ? 'border-red-500/50 text-red-500' 
                  : 'border-muted-foreground/50'
            }`}
          >
            <Zap className="w-3 h-3 mr-1" />
            {difficultyLabel}
          </Badge>
          {wordCount && (
            <Badge variant="secondary" className="text-xs">
              {wordCount} words
            </Badge>
          )}
        </div>
        
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Time starts when you begin typing. 3s grace period after expiry.
        </p>
      </CardContent>
    </Card>
  );
}
