import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeaderboardSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export function LeaderboardSkeleton({ rows = 10, showHeader = true }: LeaderboardSkeletonProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        
        {/* Header Skeleton */}
        {showHeader && (
          <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-muted/30 border-b border-border/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-4 rounded bg-muted animate-pulse",
                  i === 0 ? "w-8" : i === 1 ? "w-full" : "w-16 mx-auto"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {/* Row Skeletons */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, index) => (
            <div 
              key={index} 
              className="grid grid-cols-6 gap-4 p-4 items-center"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Rank */}
              <div className="flex justify-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full animate-pulse",
                    index < 3 ? "bg-yellow-500/20" : "bg-muted"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              </div>

              {/* User */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-full bg-muted animate-pulse"
                  style={{ animationDelay: `${index * 50 + 50}ms` }}
                />
                <div className="flex flex-col gap-1.5">
                  <div 
                    className="h-4 w-24 rounded bg-muted animate-pulse"
                    style={{ animationDelay: `${index * 50 + 100}ms` }}
                  />
                  <div 
                    className="h-3 w-16 rounded bg-muted/50 animate-pulse"
                    style={{ animationDelay: `${index * 50 + 150}ms` }}
                  />
                </div>
              </div>

              {/* WPM */}
              <div className="flex justify-center">
                <div 
                  className="h-6 w-12 rounded bg-primary/20 animate-pulse"
                  style={{ animationDelay: `${index * 50 + 200}ms` }}
                />
              </div>

              {/* Accuracy */}
              <div className="flex justify-center">
                <div 
                  className="h-5 w-14 rounded bg-muted animate-pulse"
                  style={{ animationDelay: `${index * 50 + 250}ms` }}
                />
              </div>

              {/* Mode/Extra */}
              <div className="flex justify-center">
                <div 
                  className="h-6 w-14 rounded-full bg-muted animate-pulse"
                  style={{ animationDelay: `${index * 50 + 300}ms` }}
                />
              </div>

              {/* Tests */}
              <div className="flex justify-center">
                <div 
                  className="h-6 w-10 rounded-full bg-muted animate-pulse"
                  style={{ animationDelay: `${index * 50 + 350}ms` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between p-4 border-t border-border/50">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LeaderboardSkeleton;

