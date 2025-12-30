import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Award, Target, BarChart3, CheckCircle2, Medal, Crown, AlertCircle, RefreshCw, Play, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'expert' | 'nightmare' | 'impossible';

const DIFFICULTY_ICONS: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner: '🔥',
  intermediate: '⚡',
  expert: '💀',
  nightmare: '☠️',
  impossible: '🌀',
};

const DIFFICULTY_COLORS: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner: '#f59e0b',
  intermediate: '#a855f7',
  expert: '#ef4444',
  nightmare: '#f43f5e',
  impossible: '#d946ef',
};

const DIFFICULTY_LABELS: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner: 'Warm-Up',
  intermediate: 'Mind Scrambler',
  expert: 'Absolute Mayhem',
  nightmare: 'Nightmare Realm',
  impossible: 'IMPOSSIBLE',
};

function StressLeaderboardContent() {
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const { data: leaderboardData, isLoading: leaderboardLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['stress-leaderboard', selectedDifficulty, offset, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
      const res = await fetch(`/api/stress-test/leaderboard?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch leaderboard');
      }
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stress-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stress-test/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!user,
  });

  // Use direct API response
  const leaderboard = leaderboardData?.entries || [];
  const total = leaderboardData?.pagination?.total || leaderboard.length;
  const hasMore = leaderboardData?.pagination?.hasMore ?? (leaderboard.length === limit);
  const stats = statsData?.stats;

  // Pagination calculations
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleDifficultyChange = (v: string) => {
    setSelectedDifficulty(v as Difficulty);
    setOffset(0);
  };

  const handlePrevPage = () => {
    setOffset(prev => Math.max(0, prev - limit));
  };

  const handleNextPage = () => {
    setOffset(prev => prev + limit);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/stress-test">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Test
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to stress test difficulty selection</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/stress-test">
                  <Button size="sm" className="gap-2">
                    <Play className="w-4 h-4" />
                    Take the Test
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a new stress test challenge - may cause extreme frustration!</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Trophy className="w-10 h-10 text-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Global stress test rankings - compete for the top spot!</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight cursor-help">
                      Leaderboard
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>See who has mastered typing under extreme chaos conditions</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-lg text-muted-foreground cursor-help">
                    Champions who conquered the chaos
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>These brave souls typed through screen shake, text distortions, and visual mayhem. Can you join them?</p>
                </TooltipContent>
              </Tooltip>
            </div>

          {/* User Stats */}
          {user && stats && (
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="flex items-center gap-2 text-lg cursor-help">
                      <Award className="w-5 h-5 text-primary" />
                      Your Statistics
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your personal stress test performance metrics</p>
                  </TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-lg bg-muted/50 cursor-help">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <div className="text-2xl font-bold">{stats.totalTests}</div>
                        <div className="text-xs text-muted-foreground">Total Tests</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of stress tests you've attempted</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-lg bg-muted/50 cursor-help">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <div className="text-2xl font-bold">{stats.completedTests}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tests you've survived to the end - a true achievement!</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-lg bg-muted/50 cursor-help">
                        <Crown className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                        <div className="text-2xl font-bold">{stats.bestScore}</div>
                        <div className="text-xs text-muted-foreground">Best Score</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your highest stress score achieved under chaos</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-lg bg-muted/50 cursor-help">
                        <Target className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                        <div className="text-2xl font-bold">{stats.avgScore}</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your average stress score across all attempts</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-lg bg-muted/50 cursor-help">
                        <Medal className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <div className="text-2xl font-bold">{stats.difficultiesCompleted.length}/5</div>
                        <div className="text-xs text-muted-foreground">Difficulties</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of difficulty levels you've conquered - can you beat them all?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {stats.difficultiesCompleted.length > 0 && (
                  <div className="mt-6 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground mb-3 cursor-help">Conquered</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Difficulty levels you've successfully completed</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {stats.difficultiesCompleted.map((diff: string) => (
                        <Tooltip key={diff}>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline"
                              className="cursor-help"
                              style={{ borderColor: DIFFICULTY_COLORS[diff as keyof typeof DIFFICULTY_COLORS] }}
                            >
                              <span className="mr-1">{DIFFICULTY_ICONS[diff as keyof typeof DIFFICULTY_ICONS]}</span>
                              <span style={{ color: DIFFICULTY_COLORS[diff as keyof typeof DIFFICULTY_COLORS] }}>
                                {diff}
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>You've mastered {DIFFICULTY_LABELS[diff as keyof typeof DIFFICULTY_LABELS]} mode!</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Difficulty Filter */}
          <Tabs value={selectedDifficulty} onValueChange={handleDifficultyChange} className="mb-8">
            <TabsList className="grid w-full grid-cols-6 h-12 p-1 bg-muted/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="all" 
                    className={`relative gap-1 font-bold transition-all duration-300 ${
                      selectedDifficulty === 'all' 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    All
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View all leaderboard entries across all difficulties</p>
                </TooltipContent>
              </Tooltip>
              
              {(['beginner', 'intermediate', 'expert', 'nightmare', 'impossible'] as const).map((diff) => (
                <Tooltip key={diff}>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value={diff} 
                      className={`relative gap-1 font-bold transition-all duration-300 ${
                        selectedDifficulty === diff 
                          ? 'text-white shadow-lg' 
                          : 'hover:bg-muted'
                      }`}
                      style={selectedDifficulty === diff ? {
                        backgroundColor: DIFFICULTY_COLORS[diff],
                        boxShadow: `0 4px 15px ${DIFFICULTY_COLORS[diff]}50`
                      } : {}}
                    >
                      <span>{DIFFICULTY_ICONS[diff]}</span>
                      <span className="hidden sm:inline capitalize">{diff}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by {DIFFICULTY_LABELS[diff]} - may cause extreme frustration!</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsList>

            <TabsContent value={selectedDifficulty} className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {isError ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="w-12 h-12 text-destructive mb-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Connection issue - the chaos is overwhelming the servers!</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-lg font-medium text-destructive mb-2">Failed to load leaderboard</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {error instanceof Error ? error.message : "An unexpected error occurred"}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Try Again
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attempt to reload the leaderboard data</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : leaderboardLoading ? (
                    <div className="text-center py-16">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-16">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>No one has conquered this difficulty yet!</p>
                        </TooltipContent>
                      </Tooltip>
                      <p className="text-lg text-muted-foreground mb-4">
                        No entries yet. Be the first!
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/stress-test">
                            <Button>Take the Test</Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enter the arena and claim your spot - may cause extreme frustration!</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {/* Table Header */}
                      <div className="hidden md:grid items-center p-4 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        style={{ 
                          gridTemplateColumns: selectedDifficulty === 'all' 
                            ? '60px 1fr 120px 80px 70px 70px 70px' 
                            : '60px 1fr 80px 70px 70px 70px'
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">Rank</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Leaderboard position - compete for the top spots!</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help pl-2">Player</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Brave typists who faced the chaos</p>
                          </TooltipContent>
                        </Tooltip>
                        {selectedDifficulty === 'all' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center cursor-help">Difficulty</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chaos level - higher difficulties = more frustration!</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">Score</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Stress score - combines WPM, accuracy, and chaos survival</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">WPM</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Words per minute achieved under extreme pressure</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">Acc</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Typing accuracy percentage despite the visual chaos</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">Done</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Text completion rate - how much they typed before time ran out</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {leaderboard.map((entry: any, index: number) => {
                        const rank = entry.rank || (index + 1);
                        const diffColor = DIFFICULTY_COLORS[entry.difficulty as keyof typeof DIFFICULTY_COLORS];
                        const isCurrentUser = entry.userId === user?.id;
                        const rankLabels = { 1: 'Champion! 🏆', 2: 'Runner-up! 🎖️', 3: 'Third place! 🏅' };
                        
                        return (
                          <div
                            key={`${entry.userId}-${entry.difficulty}-${entry.createdAt}`}
                            className={`grid items-center p-4 transition-colors ${
                              isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                            }`}
                            style={{ 
                              gridTemplateColumns: selectedDifficulty === 'all' 
                                ? '60px 1fr 120px 80px 70px 70px 70px' 
                                : '60px 1fr 80px 70px 70px 70px'
                            }}
                          >
                            {/* Rank */}
                            <div className="flex justify-center items-center">
                              {rank <= 3 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full cursor-help transform hover:scale-110 transition-transform ${
                                      rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.7)]" :
                                      rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black shadow-[0_0_15px_rgba(203,213,225,0.7)]" :
                                      "bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-[0_0_15px_rgba(217,119,6,0.7)]"
                                    }`}>
                                      <span className="text-xl font-black">{rank}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{rankLabels[rank as keyof typeof rankLabels]}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-lg font-bold text-muted-foreground cursor-help">#{rank}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ranked #{rank} - keep pushing for the top!</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>

                            {/* User */}
                            <div className="flex items-center gap-3 min-w-0 pl-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="w-10 h-10 border-2 cursor-help flex-shrink-0" style={{ borderColor: entry.avatarColor || '#888' }}>
                                    <AvatarFallback style={{ backgroundColor: entry.avatarColor || '#888' }}>
                                      {entry.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{entry.username}'s profile - conquered chaos on {new Date(entry.createdAt).toLocaleDateString()}</p>
                                </TooltipContent>
                              </Tooltip>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate flex items-center gap-2">
                                  {entry.username}
                                  {isCurrentUser && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="text-xs cursor-help">You</Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This is your entry!</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(entry.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Difficulty Badge */}
                            {selectedDifficulty === 'all' && (
                              <div className="flex justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="cursor-help" style={{ borderColor: diffColor }}>
                                      <span className="mr-1">{DIFFICULTY_ICONS[entry.difficulty as keyof typeof DIFFICULTY_ICONS]}</span>
                                      <span className="capitalize" style={{ color: diffColor }}>
                                        {entry.difficulty}
                                      </span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{DIFFICULTY_LABELS[entry.difficulty as keyof typeof DIFFICULTY_LABELS]} difficulty - extreme frustration guaranteed!</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}

                            {/* Score */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center cursor-help">
                                  <div className="text-xl font-bold text-primary">{entry.stressScore}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase md:hidden">Score</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Stress score: {entry.stressScore} - impressive under chaos!</p>
                              </TooltipContent>
                            </Tooltip>
                              
                            {/* WPM */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center cursor-help hidden md:block">
                                  <div className="text-lg font-semibold">{entry.wpm}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase">WPM</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{entry.wpm} words per minute while the screen was going crazy!</p>
                              </TooltipContent>
                            </Tooltip>
                              
                            {/* Accuracy */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center cursor-help hidden md:block">
                                  <div className="text-lg font-semibold">{entry.accuracy.toFixed(1)}%</div>
                                  <div className="text-[10px] text-muted-foreground uppercase">Acc</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{entry.accuracy.toFixed(1)}% accuracy despite visual distortions!</p>
                              </TooltipContent>
                            </Tooltip>
                              
                            {/* Completion */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center cursor-help hidden md:block">
                                  <div className="text-lg font-semibold">{entry.completionRate.toFixed(0)}%</div>
                                  <div className="text-[10px] text-muted-foreground uppercase">Done</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Completed {entry.completionRate.toFixed(0)}% of the text under extreme pressure</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
                      
                      {/* Pagination */}
                      {leaderboard.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Showing{" "}
                              <span className="font-medium text-foreground">
                                {Math.min(offset + 1, total)}
                              </span>
                              {" - "}
                              <span className="font-medium text-foreground">
                                {Math.min(offset + leaderboard.length, total)}
                              </span>
                              {" of "}
                              <span className="font-medium text-foreground">
                                {total.toLocaleString()}
                              </span>
                              {" results"}
                            </span>
                            {isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handlePrevPage}
                                  disabled={offset === 0 || isFetching}
                                  className="gap-1"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  <span className="hidden sm:inline">Previous</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {offset === 0 ? "You're on the first page" : "Go to previous page"}
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
                                  disabled={!hasMore || isFetching}
                                  className="gap-1"
                                >
                                  <span className="hidden sm:inline">Next</span>
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!hasMore ? "You're on the last page" : "Go to next page"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}

export default function StressLeaderboard() {
  return (
    <ErrorBoundary>
      <StressLeaderboardContent />
    </ErrorBoundary>
  );
}
