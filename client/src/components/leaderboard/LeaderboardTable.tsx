import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  Ban,
  Zap,
} from "lucide-react";
import { 
  type LeaderboardMode, 
  getModeConfig,
  formatTestMode,
  getTierColor,
} from "@/lib/leaderboard-config";
import { RankBadge } from "./RankBadge";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";

interface LeaderboardTableProps {
  mode: LeaderboardMode;
  entries: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: Error | null;
  currentUserId?: string;
  onPageChange: (offset: number) => void;
  onRetry: () => void;
}

function getErrorIcon(type: string) {
  switch (type) {
    case "network":
      return <WifiOff className="w-12 h-12 text-orange-500 mb-4" />;
    case "rate_limit":
      return <Ban className="w-12 h-12 text-yellow-500 mb-4" />;
    default:
      return <AlertCircle className="w-12 h-12 text-destructive mb-4" />;
  }
}

function CellContent({ 
  mode, 
  columnKey, 
  entry 
}: { 
  mode: LeaderboardMode; 
  columnKey: string; 
  entry: any;
}) {
  switch (columnKey) {
    case "wpm":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1 cursor-help">
              <Zap className="w-3.5 h-3.5 text-primary/60" />
              <span className="font-mono font-bold text-primary text-lg tabular-nums">
                {entry.wpm}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{entry.wpm} words per minute</p>
            <p className="text-xs text-muted-foreground">Raw typing speed</p>
          </TooltipContent>
        </Tooltip>
      );

    case "accuracy":
      const accuracyValue = typeof entry.accuracy === "number" ? entry.accuracy : parseFloat(entry.accuracy);
      const accuracyColor = accuracyValue >= 98 ? "text-green-500" : accuracyValue >= 95 ? "text-yellow-500" : "text-muted-foreground";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("font-mono cursor-help tabular-nums", accuracyColor)}>
              {accuracyValue.toFixed(1)}%
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Typing accuracy</p>
            {accuracyValue >= 98 && <p className="text-xs text-green-500">Outstanding precision!</p>}
          </TooltipContent>
        </Tooltip>
      );

    case "mode":
      return (
        <Badge variant="outline" className="gap-1 font-mono">
          <Clock className="w-3 h-3" />
          {formatTestMode(entry.mode)}
        </Badge>
      );

    case "tests":
    case "totalTests":
      const testCount = entry.totalTests || entry.tests || 1;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 cursor-help">
              <Target className="w-3 h-3" />
              {testCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{testCount} test{testCount !== 1 ? 's' : ''} completed</p>
          </TooltipContent>
        </Tooltip>
      );

    case "stressScore":
      return (
        <div className="flex items-center justify-center">
          <span className="font-mono font-bold text-orange-500 text-lg tabular-nums animate-pulse">
            {entry.stressScore}
          </span>
        </div>
      );

    case "completionRate":
      const rate = typeof entry.completionRate === "number" ? entry.completionRate : parseFloat(entry.completionRate);
      return (
        <span className="font-mono text-orange-500 tabular-nums">
          {rate.toFixed(0)}%
        </span>
      );

    case "rating":
      return (
        <span className="font-mono font-bold text-green-500 text-lg tabular-nums">
          {entry.rating}
        </span>
      );

    case "tier":
      return (
        <Badge variant="secondary" className={cn("capitalize font-medium", getTierColor(entry.tier))}>
          {entry.tier}
        </Badge>
      );

    case "wins":
      return (
        <span className="font-mono text-green-500 tabular-nums">
          {entry.wins}
        </span>
      );

    case "totalRaces":
      return (
        <span className="font-mono text-muted-foreground tabular-nums">
          {entry.totalRaces}
        </span>
      );

    case "programmingLanguage":
      return (
        <Badge variant="outline" className="capitalize">
          {entry.programmingLanguage}
        </Badge>
      );

    case "speedLevel":
      return (
        <Badge variant="outline" className="capitalize">
          {entry.speedLevel}
        </Badge>
      );

    case "wordsTyped":
      return (
        <span className="font-mono text-muted-foreground tabular-nums">
          {(entry.wordsTyped || 0).toLocaleString()}
        </span>
      );

    case "booksCompleted":
      return (
        <span className="font-mono text-muted-foreground tabular-nums">
          {entry.booksCompleted || 0}
        </span>
      );

    case "difficulty":
      return (
        <Badge variant="outline" className="capitalize">
          {entry.difficulty}
        </Badge>
      );

    default:
      return <span className="tabular-nums">{entry[columnKey] ?? "-"}</span>;
  }
}

export function LeaderboardTable({
  mode,
  entries,
  pagination,
  isLoading,
  isFetching,
  isError,
  error,
  currentUserId,
  onPageChange,
  onRetry,
}: LeaderboardTableProps) {
  const config = getModeConfig(mode);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const handlePrevPage = () => {
    onPageChange(Math.max(0, pagination.offset - pagination.limit));
  };

  const handleNextPage = () => {
    if (pagination.hasMore && pagination.offset + pagination.limit < pagination.total) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  // Error State
  if (isError) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            {getErrorIcon("unknown")}
            <p className="text-lg font-semibold text-foreground mb-2">
              Failed to load leaderboard
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <Button 
              variant="outline" 
              onClick={onRetry}
              disabled={isFetching}
              className="gap-2"
              data-testid="retry-button"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading State - Use skeleton
  if (isLoading) {
    return <LeaderboardSkeleton rows={pagination.limit} />;
  }

  // Empty State
  if (entries.length === 0) {
    const ModeIcon = config.icon;
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative text-center py-16 text-muted-foreground">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <ModeIcon className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
              <div className={cn(
                "inline-flex items-center justify-center w-20 h-20 rounded-full mb-6",
                config.bgColor
              )}>
                <ModeIcon className={cn("w-10 h-10", config.color)} />
              </div>
              <p className="text-xl font-semibold mb-2">No results yet</p>
              <p className="text-sm max-w-sm mx-auto">
                Be the first to set a record in {config.label}!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Table Header */}
        <div 
          className="hidden md:grid gap-4 p-4 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50"
          style={{ 
            gridTemplateColumns: config.columns.map(col => 
              col.width === "flex-1" ? "1fr" : "auto"
            ).join(" ") 
          }}
          role="row"
        >
          {config.columns.map((column) => (
            <div 
              key={column.key} 
              className={cn(
                column.width !== "flex-1" && column.width,
                column.align === "center" && "text-center",
                column.align === "right" && "text-right"
              )}
              role="columnheader"
            >
              {column.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-current">
                      {column.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{column.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                column.label
              )}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/50" role="rowgroup">
          {entries.map((entry, index) => {
            const rank = entry.rank || (pagination.offset + index + 1);
            const isCurrentUser = currentUserId === entry.userId;
            const username = entry.username || "Unknown";

            return (
              <div
                key={`${entry.userId}-${rank}`}
                className={cn(
                  "grid gap-4 p-4 items-center transition-all duration-200",
                  "hover:bg-muted/40",
                  isCurrentUser && "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary",
                  // Staggered animation on mount
                  "animate-in fade-in-0 slide-in-from-bottom-2",
                )}
                style={{ 
                  gridTemplateColumns: config.columns.map(col => 
                    col.width === "flex-1" ? "1fr" : "auto"
                  ).join(" "),
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: "backwards",
                }}
                data-testid={`leaderboard-entry-${index}`}
                role="row"
              >
                {config.columns.map((column) => {
                  if (column.key === "rank") {
                    return (
                      <div key={column.key} className="flex justify-center" role="cell">
                        <RankBadge rank={rank} />
                      </div>
                    );
                  }

                  if (column.key === "user") {
                    return (
                      <div key={column.key} className="flex items-center gap-3" role="cell">
                        <Avatar className={cn(
                          "w-10 h-10 ring-2 ring-offset-2 ring-offset-background transition-all",
                          rank === 1 ? "ring-yellow-500" : 
                          rank === 2 ? "ring-gray-400" : 
                          rank === 3 ? "ring-orange-500" : 
                          "ring-border/50"
                        )}>
                          <AvatarFallback 
                            className={cn(
                              "text-sm font-semibold",
                              entry.avatarColor || "bg-primary/20"
                            )}
                            style={{ color: "white" }}
                          >
                            {username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[140px]">
                              {username}
                            </span>
                            {entry.isVerified && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldCheck className="w-4 h-4 text-green-500 cursor-help flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">Verified Score</p>
                                  <p className="text-xs text-muted-foreground">Passed anti-cheat challenge</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {isCurrentUser && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/80">
                                You
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {entry.totalTests || 1} test{(entry.totalTests || 1) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={column.key} 
                      className={cn(
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                      role="cell"
                    >
                      <CellContent mode={mode} columnKey={column.key} entry={entry} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/50 bg-muted/20">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm text-muted-foreground cursor-help flex items-center gap-2">
                <span>
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(pagination.offset + 1, pagination.total)}
                  </span>
                  {" - "}
                  <span className="font-medium text-foreground">
                    {Math.min(pagination.offset + entries.length, pagination.total)}
                  </span>
                  {" of "}
                  <span className="font-medium text-foreground">
                    {pagination.total.toLocaleString()}
                  </span>
                  {" results"}
                </span>
                {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{pagination.limit} entries per page</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0 || isFetching}
                  className="gap-1"
                  data-testid="prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {pagination.offset === 0 ? "You're on the first page" : "Go to previous page"}
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Page</span>
              <span className="font-medium px-2 py-1 bg-muted rounded">
                {currentPage}
              </span>
              <span className="text-muted-foreground">of {totalPages}</span>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore || pagination.offset + pagination.limit >= pagination.total || isFetching}
                  className="gap-1"
                  data-testid="next-page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!pagination.hasMore || pagination.offset + pagination.limit >= pagination.total 
                  ? "You're on the last page" 
                  : "Go to next page"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LeaderboardTable;
