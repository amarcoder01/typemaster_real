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
  Crosshair,
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
  userRank?: number;
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
            <div className="flex flex-col items-center cursor-help">
              <div className="font-mono font-bold text-primary text-xl tabular-nums">
                {entry.wpm}
              </div>
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
      const accuracyColor = accuracyValue >= 98 ? "text-green-400" : accuracyValue >= 95 ? "text-blue-400" : accuracyValue >= 90 ? "text-yellow-400" : "text-red-400";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center cursor-help">
              <div className={cn("font-mono font-semibold text-base tabular-nums", accuracyColor)}>
                {accuracyValue.toFixed(1)}%
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Typing accuracy: {accuracyValue.toFixed(2)}%</p>
            {accuracyValue >= 98 && <p className="text-xs text-green-400">Outstanding precision!</p>}
          </TooltipContent>
        </Tooltip>
      );

    case "mode":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/40 rounded-md">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span className="text-sm font-medium tabular-nums">
            {formatTestMode(entry.mode)}
          </span>
        </div>
      );

    case "tests":
    case "totalTests":
      const testCount = entry.totalTests || entry.tests || 1;
      return (
        <span className="text-sm font-medium text-muted-foreground/80 tabular-nums">
          {testCount}
        </span>
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
  userRank,
  onPageChange,
  onRetry,
}: LeaderboardTableProps) {
  const config = getModeConfig(mode);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  // Calculate if user's rank is visible on current page
  const userRankPage = userRank ? Math.ceil(userRank / pagination.limit) : 0;
  const isUserOnCurrentPage = userRank 
    ? userRank > pagination.offset && userRank <= pagination.offset + pagination.limit
    : false;
  const showJumpToRank = currentUserId && userRank && userRank > 0 && !isUserOnCurrentPage;

  const handlePrevPage = () => {
    onPageChange(Math.max(0, pagination.offset - pagination.limit));
  };

  const handleNextPage = () => {
    if (pagination.hasMore && pagination.offset + pagination.limit < pagination.total) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  const handleJumpToMyRank = () => {
    if (userRank) {
      // Calculate the offset that would show the user's rank
      const targetOffset = Math.floor((userRank - 1) / pagination.limit) * pagination.limit;
      onPageChange(targetOffset);
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
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="relative text-center py-24 text-muted-foreground">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <ModeIcon className="w-64 h-64" />
            </div>
            
            <div className="relative z-10">
              <div className={cn(
                "inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ring-4 ring-background shadow-xl",
                config.bgColor
              )}>
                <ModeIcon className={cn("w-10 h-10", config.color)} />
              </div>
              <p className="text-2xl font-bold mb-2 text-foreground">No results yet</p>
              <p className="text-base max-w-sm mx-auto">
                Be the first to set a record in {config.label}!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-xl ring-1 ring-white/5">
      <CardContent className="p-0">
        {/* Table Header */}
        <div 
          className="hidden md:grid gap-4 p-4 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5"
          style={{ 
            gridTemplateColumns: config.columns.map(col => {
              if (col.width === "flex-1") return "1fr";
              if (col.width === "w-12") return "3rem";
              if (col.width === "w-16") return "4rem";
              if (col.width === "w-20") return "minmax(5rem, auto)";
              if (col.width === "w-24") return "6rem";
              if (col.width === "w-28") return "7rem";
              if (col.width === "w-32") return "8rem";
              return "auto";
            }).join(" ") 
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
                  "grid gap-4 p-4 items-center transition-all duration-200 border-b border-white/5 last:border-0",
                  "hover:bg-muted/50",
                  isCurrentUser && "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]",
                  // Staggered animation on mount
                  "animate-in fade-in-0 slide-in-from-bottom-2",
                )}
                style={{ 
                  gridTemplateColumns: config.columns.map(col => {
                    if (col.width === "flex-1") return "1fr";
                    if (col.width === "w-12") return "3rem";
                    if (col.width === "w-16") return "4rem";
                    if (col.width === "w-20") return "minmax(5rem, auto)";
                    if (col.width === "w-24") return "6rem";
                    if (col.width === "w-28") return "7rem";
                    if (col.width === "w-32") return "8rem";
                    return "auto";
                  }).join(" "),
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
                        "flex items-center",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end",
                        column.align === "left" && "justify-start"
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
          <div className="flex items-center gap-3">
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

            {/* Jump to my rank button */}
            {showJumpToRank && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleJumpToMyRank}
                    disabled={isFetching}
                    className="gap-1.5 text-primary"
                    data-testid="jump-to-rank"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Jump to #{userRank}</span>
                    <span className="sm:hidden">#{userRank}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Jump to your position (Rank #{userRank}, Page {userRankPage})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
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
