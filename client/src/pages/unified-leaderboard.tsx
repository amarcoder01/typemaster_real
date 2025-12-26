import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  WifiOff, 
  User, 
  Loader2, 
  Trophy, 
  Sparkles, 
  ChevronRight,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ModeSelector, 
  LeaderboardFilters, 
  LeaderboardTable, 
  AroundMeSection 
} from "@/components/leaderboard";
import {
  type LeaderboardMode,
  getModeConfig,
  buildLeaderboardQueryParams,
} from "@/lib/leaderboard-config";

// Custom hook to parse search params
function useSearchParams() {
  const searchString = useSearch();
  return new URLSearchParams(searchString);
}

function UnifiedLeaderboardContent() {
  const [, setLocation] = useLocation();
  const searchParams = useSearchParams();
  
  // Get initial mode from URL or default to 'global'
  const initialMode = (searchParams.get("mode") as LeaderboardMode) || "global";
  
  // State management
  const [mode, setMode] = useState<LeaderboardMode>(initialMode);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const limit = 15;

  const config = getModeConfig(mode);
  const ModeIcon = config.icon;

  // Initialize filters with defaults when mode changes
  useEffect(() => {
    const newFilters: Record<string, string> = {};
    config.filters.forEach((filter) => {
      const urlValue = searchParams.get(filter.key);
      newFilters[filter.key] = urlValue || filter.defaultValue || "all";
    });
    setFilters(newFilters);
    setOffset(0);
  }, [mode]);

  // Update URL when mode changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });
    setLocation(`/leaderboards?${params.toString()}`, { replace: true });
  }, [mode, filters]);

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Current user query
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
    staleTime: 60000,
  });

  // Build query params
  const queryParams = buildLeaderboardQueryParams(mode, filters, { limit, offset });

  // Main leaderboard query
  const { 
    data: leaderboardData, 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["unified-leaderboard", mode, filters, offset, limit],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${config.endpoint}?${queryParams.toString()}`,
        { signal }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch leaderboard");
      }
      
      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
    retry: 2,
  });

  // Around me query
  const { data: aroundMeData, isLoading: aroundMeLoading } = useQuery({
    queryKey: ["unified-leaderboard-around-me", mode, filters],
    queryFn: async () => {
      const aroundMeParams = new URLSearchParams({ range: "3" });
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          aroundMeParams.set(key, value);
        }
      });
      
      const response = await fetch(
        `${config.aroundMeEndpoint}?${aroundMeParams.toString()}`
      );
      
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!userData?.user,
    staleTime: 30000,
    retry: 1,
  });

  const entries = leaderboardData?.entries || [];
  const pagination = leaderboardData?.pagination || { 
    total: 0, 
    limit, 
    offset, 
    hasMore: false 
  };

  const handleModeChange = (newMode: LeaderboardMode) => {
    setMode(newMode);
    setOffset(0);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 py-6 sm:py-10"
        role="main"
        aria-label="Leaderboard page"
      >
        {/* Offline Warning */}
        {!isOnline && (
          <div 
            className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2 text-orange-500"
            role="alert"
            aria-live="polite"
          >
            <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">You're offline. Some features may not work.</span>
          </div>
        )}

        {/* Hero Header */}
        <header className="relative mb-8 sm:mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[500px] h-[500px] rounded-full blur-3xl opacity-20",
              config.bgColor
            )} />
          </div>

          <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
            {/* Icon with glow effect */}
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-2xl blur-xl opacity-50 animate-pulse",
                config.bgColor
              )} />
              <div className={cn(
                "relative p-4 sm:p-5 rounded-2xl",
                config.bgColor,
                "ring-2 ring-inset ring-white/10"
              )}>
                <ModeIcon className={cn("w-8 h-8 sm:w-10 sm:h-10", config.color)} aria-hidden="true" />
              </div>
              <Sparkles 
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 animate-pulse",
                  config.color
                )} 
                aria-hidden="true"
              />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                  Leaderboards
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {config.description}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2">
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{pagination.total.toLocaleString()} Players</span>
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>6 Categories</span>
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Live Rankings</span>
              </Badge>
            </div>
          </div>
        </header>

        {/* Mode Selector */}
        <nav className="mb-6" aria-label="Leaderboard mode selection">
          <ModeSelector 
            value={mode} 
            onChange={handleModeChange} 
          />
        </nav>

        {/* Filters & User Rank */}
        <section className="mb-6" aria-label="Filters and user ranking">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <LeaderboardFilters 
              mode={mode} 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />

            {/* User Rank Display */}
            {userData?.user && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <User className={cn("w-4 h-4", config.color)} aria-hidden="true" />
                  </div>
                  {aroundMeLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Loading rank...</span>
                    </div>
                  ) : aroundMeData?.userRank && aroundMeData.userRank > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Your Rank</span>
                      <span className="font-mono font-bold text-lg text-foreground" aria-label={`Your rank is ${aroundMeData.userRank}`}>
                        #{aroundMeData.userRank}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Not Ranked</span>
                      <span className="text-sm text-muted-foreground">Complete a test to rank!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Around Me Section */}
        {userData?.user && aroundMeData?.entries?.length > 0 && aroundMeData.userRank > 0 && (
          <section aria-label="Your leaderboard position">
            <AroundMeSection
              mode={mode}
              entries={aroundMeData.entries}
              userRank={aroundMeData.userRank}
              currentUserId={userData.user.id}
              isLoading={aroundMeLoading}
            />
          </section>
        )}

        {/* Leaderboard Table */}
        <section aria-label="Leaderboard rankings" id={`leaderboard-${mode}`}>
          <LeaderboardTable
            mode={mode}
            entries={entries}
            pagination={pagination}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            error={error as Error}
            currentUserId={userData?.user?.id}
            onPageChange={handlePageChange}
            onRetry={() => refetch()}
          />
        </section>

        {/* Call to Action */}
        <section className="mt-10 sm:mt-12" aria-label="Start a test">
          <Card className="border-border/50 bg-gradient-to-br from-card via-card/80 to-transparent overflow-hidden">
            <CardContent className="p-6 sm:p-8 relative">
              {/* Background decoration */}
              <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
                <div className={cn(
                  "absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20",
                  config.bgColor
                )} />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    Ready to climb the rankings?
                  </h2>
                  <p className="text-muted-foreground">
                    Take a {config.shortLabel} test and compete with players worldwide!
                  </p>
                </div>
                
                <a
                  href={getTestLink(mode)}
                  className={cn(
                    "group inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                    "font-semibold text-lg transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg",
                    config.bgColor,
                    config.color,
                    "ring-2 ring-inset ring-white/10"
                  )}
                  aria-label={`Start a ${config.shortLabel} test`}
                >
                  <ModeIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Start {config.shortLabel} Test</span>
                  <ChevronRight 
                    className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                    aria-hidden="true" 
                  />
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  );
}

// Helper to get the test link for each mode
function getTestLink(mode: LeaderboardMode): string {
  switch (mode) {
    case "global":
      return "/";
    case "code":
      return "/code-mode";
    case "dictation":
      return "/dictation-mode";
    case "stress":
      return "/stress-test";
    case "rating":
      return "/multiplayer";
    case "book":
      return "/books";
    default:
      return "/";
  }
}

export default function UnifiedLeaderboard() {
  return (
    <ErrorBoundary>
      <UnifiedLeaderboardContent />
    </ErrorBoundary>
  );
}
