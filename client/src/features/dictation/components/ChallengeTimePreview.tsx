import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChallengeTimePreviewProps {
  timeLimitMs: number | null;
  isLoading?: boolean;
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

export function ChallengeTimePreview({
  timeLimitMs,
  isLoading = false,
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

  return (
    <Card className="border-orange-500/20 bg-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Time Per Sentence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-500">
            {formatTimeLimit(timeLimitMs)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            estimated time for each sentence
          </p>
        </div>
        
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Timer starts after audio finishes
        </p>
      </CardContent>
    </Card>
  );
}
