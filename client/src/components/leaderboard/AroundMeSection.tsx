import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Info, Loader2, ShieldCheck, TrendingUp, Target, Flame, Zap, Award } from "lucide-react";
import { 
  type LeaderboardMode, 
  getModeConfig,
} from "@/lib/leaderboard-config";
import { RankBadge } from "./RankBadge";

interface AroundMeSectionProps {
  mode: LeaderboardMode;
  entries: any[];
  userRank: number;
  currentUserId: string;
  isLoading: boolean;
}

export function AroundMeSection({
  mode,
  entries,
  userRank,
  currentUserId,
  isLoading,
}: AroundMeSectionProps) {
  const config = getModeConfig(mode);
  const ModeIcon = config.icon;

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent mb-6 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your position...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0 || userRank <= 0) {
    return null;
  }

  // Find current user's entry
  const currentUserEntry = entries.find(e => e.userId === currentUserId);
  const nextRankEntry = entries.find(e => e.rank === userRank - 1);
  const prevRankEntry = entries.find(e => e.rank === userRank + 1);

  // Calculate progress to next rank
  const currentMetric = currentUserEntry?.[config.sortMetric] || 0;
  const nextRankMetric = nextRankEntry?.[config.sortMetric] || currentMetric;
  const prevRankMetric = prevRankEntry?.[config.sortMetric] || 0;
  
  // Progress percentage (how close to beating next rank)
  const metricDifference = nextRankMetric - currentMetric;
  const progressToNext = nextRankEntry 
    ? Math.max(0, Math.min(100, ((currentMetric - prevRankMetric) / (nextRankMetric - prevRankMetric)) * 100))
    : 100;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent mb-6 overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      </div>

      <CardContent className="p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                  <User className={cn("w-4 h-4", config.color)} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">
                    Your Position
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    in {config.shortLabel}
                  </span>
                </div>
                <Info className="w-3 h-3 text-muted-foreground/50" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows players ranked near you in the {config.label} leaderboard</p>
            </TooltipContent>
          </Tooltip>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Award className={cn("w-4 h-4", config.color)} />
                  <span className="font-mono font-bold text-foreground">#{userRank}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your current rank</p>
              </TooltipContent>
            </Tooltip>

            {currentUserEntry && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-primary">
                      {currentMetric} {config.sortMetricLabel}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your best {config.sortMetricLabel}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRankEntry && metricDifference > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="w-3.5 h-3.5" />
                <span>Progress to Rank #{userRank - 1}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("text-xs font-medium cursor-help", config.color)}>
                    {metricDifference} {config.sortMetricLabel} to go
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Beat {nextRankEntry.username}'s score of {nextRankMetric} {config.sortMetricLabel}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Progress 
              value={progressToNext} 
              className="h-2"
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>{currentMetric} {config.sortMetricLabel}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{nextRankMetric} {config.sortMetricLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Celebration */}
        {userRank <= 3 && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-yellow-500 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-yellow-500">
                  {userRank === 1 ? "🏆 You're the Champion!" : 
                   userRank === 2 ? "🥈 Outstanding! Almost at the top!" : 
                   "🥉 Excellent! You're in the top 3!"}
                </p>
                <p className="text-xs text-yellow-500/70">
                  {userRank === 1 ? "Keep dominating the leaderboard!" : 
                   `Only ${userRank - 1} player${userRank > 2 ? 's' : ''} ahead of you!`}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Nearby Players */}
        <div className="space-y-1.5">
          {entries.map((entry: any) => {
            const isCurrentUser = entry.userId === currentUserId;
            const primaryMetric = entry[config.sortMetric];

            return (
              <div 
                key={`around-${entry.rank}-${entry.userId}`} 
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg transition-all duration-200",
                  isCurrentUser 
                    ? "bg-primary/15 ring-1 ring-primary/30 font-medium" 
                    : "bg-background/50 hover:bg-background/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={entry.rank} size="sm" />
                  <span className={cn(
                    "truncate max-w-[120px]",
                    isCurrentUser && "text-primary font-medium"
                  )}>
                    {entry.username}
                  </span>
                  {entry.isVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500 cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verified score</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-medium">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <ModeIcon className={cn("w-3.5 h-3.5", config.color, "opacity-60")} />
                  <span className={cn(
                    "font-mono text-sm tabular-nums",
                    isCurrentUser ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {primaryMetric} {config.sortMetricLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default AroundMeSection;
