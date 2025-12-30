import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Flame, Award, Target, BarChart3, CheckCircle2, Medal, Crown, Star, HelpCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  beginner: 'text-amber-400',
  intermediate: 'text-purple-400',
  expert: 'text-red-400',
  nightmare: 'text-rose-400',
  impossible: 'text-fuchsia-400',
};

const DIFFICULTY_NEON: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner: '#f59e0b',
  intermediate: '#a855f7',
  expert: '#ef4444',
  nightmare: '#f43f5e',
  impossible: '#d946ef',
};

const DIFFICULTY_DESCRIPTIONS: Record<Exclude<Difficulty, 'all'>, string> = {
  beginner: 'Gentle introduction with light effects - 30 seconds',
  intermediate: 'Screen inverts, zoom chaos, and sensory assault - 45 seconds',
  expert: 'Screen flips upside down, glitches, complete chaos - 60 seconds',
  nightmare: 'Text reverses, screen inverts/flips, reality collapses - 90 seconds',
  impossible: 'Text teleports, ALL effects active, reality ceases to exist - 120 seconds',
};

function StressLeaderboardContent() {
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('all');
  const [offset, setOffset] = useState(0);
  const limit = 50;

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

  const { data: statsData, isLoading: statsLoading } = useQuery({
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

  const leaderboard = leaderboardData?.entries || [];
  const pagination = leaderboardData?.pagination || { total: 0, hasMore: false };
  const stats = statsData?.stats;

  const handleDifficultyChange = (v: string) => {
    setSelectedDifficulty(v as Difficulty);
    setOffset(0);
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(0, 245, 255, 0.08) 0%, transparent 50%),
                             radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)`,
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative">
        <div className="mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/stress-test">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 bg-black/20 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 hover:bg-black/40 transition-all" 
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Stress Test
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black/90 backdrop-blur-xl border border-white/20">
              <p>Return to difficulty selection and take the test</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Trophy 
                      className="w-14 h-14 text-cyan-400 cursor-help" 
                      style={{ filter: 'drop-shadow(0 0 15px rgba(0, 245, 255, 0.5))' }}
                    />
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                  <p>Global rankings of stress test champions</p>
                </TooltipContent>
              </Tooltip>
              <h1 
                className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500"
                style={{
                  textShadow: '0 0 40px rgba(0, 245, 255, 0.3), 0 0 80px rgba(168, 85, 247, 0.2)',
                }}
              >
                Leaderboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              The bravest warriors who survived the chaos
            </p>
            <a 
              href="/leaderboards?mode=stress" 
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all leaderboards →
            </a>
          </div>

          {/* User Stats */}
          {user && stats && (
            <Card className="mb-8 bg-black/30 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,245,255,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Award className="w-5 h-5 text-cyan-400" />
                        <span 
                          className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400"
                          style={{ textShadow: '0 0 15px rgba(0, 245, 255, 0.3)' }}
                        >
                          Your Statistics
                        </span>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <p>Your personal stress test performance summary</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-500/20 cursor-help hover:border-cyan-500/40 transition-all group">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 10px rgba(0, 245, 255, 0.5)' }}>{stats.totalTests}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Tests</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <p>Total number of stress tests you've attempted</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-green-500/20 cursor-help hover:border-green-500/40 transition-all group">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-400 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>{stats.completedTests}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Completed</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <div className="space-y-1">
                        <p>Tests where you typed 100% of the text</p>
                        <p className="text-xs text-muted-foreground">
                          Completion rate: {stats.totalTests > 0 ? ((stats.completedTests / stats.totalTests) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-orange-500/20 cursor-help hover:border-orange-500/40 transition-all group">
                        <Crown className="w-4 h-4 mx-auto mb-1 text-orange-400 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-orange-400" style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.5)' }}>{stats.bestScore}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Best Score</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <p>Your highest stress score ever achieved</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-blue-500/20 cursor-help hover:border-blue-500/40 transition-all group">
                        <Target className="w-4 h-4 mx-auto mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-blue-400" style={{ textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>{stats.avgScore}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avg Score</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <p>Your average stress score across all tests</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/20 cursor-help hover:border-purple-500/40 transition-all group">
                        <Medal className="w-4 h-4 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-bold text-purple-400" style={{ textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>{stats.difficultiesCompleted.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Difficulties</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                      <div className="space-y-1">
                        <p>Number of unique difficulties you've completed</p>
                        <p className="text-xs text-muted-foreground">Complete all 5 difficulties to become a true champion!</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {stats.difficultiesCompleted.length > 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Conquered Difficulties</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {stats.difficultiesCompleted.map((diff: string) => (
                        <Tooltip key={diff}>
                          <TooltipTrigger asChild>
                            <span 
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-help transition-all hover:scale-105 border"
                              style={{
                                borderColor: `${DIFFICULTY_NEON[diff as keyof typeof DIFFICULTY_NEON]}50`,
                                background: `linear-gradient(135deg, ${DIFFICULTY_NEON[diff as keyof typeof DIFFICULTY_NEON]}15 0%, transparent 100%)`,
                                color: DIFFICULTY_NEON[diff as keyof typeof DIFFICULTY_NEON],
                                boxShadow: `0 0 10px ${DIFFICULTY_NEON[diff as keyof typeof DIFFICULTY_NEON]}30`,
                              }}
                            >
                              <span>{DIFFICULTY_ICONS[diff as keyof typeof DIFFICULTY_ICONS]}</span>
                              <span className="capitalize">{diff}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                            <p>{DIFFICULTY_DESCRIPTIONS[diff as keyof typeof DIFFICULTY_DESCRIPTIONS]}</p>
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
            <TabsList className="grid w-full grid-cols-6 p-1.5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="all" 
                    data-testid="tab-all"
                    className="relative z-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none rounded-lg"
                  >
                    {selectedDifficulty === 'all' && (
                      <motion.div
                        layoutId="active-difficulty-tab"
                        className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/40 rounded-lg z-[-1]"
                        style={{ boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)' }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative z-10 ${selectedDifficulty === 'all' ? 'text-cyan-400' : ''}`}>All</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                  <p>View all difficulties combined</p>
                </TooltipContent>
              </Tooltip>
              
              {(['beginner', 'intermediate', 'expert', 'nightmare', 'impossible'] as const).map((diff) => (
                <TabsTrigger 
                  key={diff}
                  value={diff} 
                  data-testid={`tab-${diff}`}
                  className="relative z-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none rounded-lg"
                >
                  {selectedDifficulty === diff && (
                    <motion.div
                      layoutId="active-difficulty-tab"
                      className="absolute inset-0 rounded-lg z-[-1]"
                      style={{ 
                        background: `${DIFFICULTY_NEON[diff]}20`,
                        border: `1px solid ${DIFFICULTY_NEON[diff]}60`,
                        boxShadow: `0 0 15px ${DIFFICULTY_NEON[diff]}30`,
                      }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span 
                    className="relative z-10 flex items-center gap-1"
                    style={{ color: selectedDifficulty === diff ? DIFFICULTY_NEON[diff] : undefined }}
                  >
                    <span>{DIFFICULTY_ICONS[diff]}</span>
                    <span className="capitalize hidden sm:inline">{diff}</span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedDifficulty}>
              <Card className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <CardContent className="p-0">
                  {isError ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                      <p className="text-lg font-medium text-destructive mb-2">Failed to load leaderboard</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {error instanceof Error ? error.message : "An unexpected error occurred"}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => refetch()}
                        disabled={isFetching}
                        data-testid="retry-button"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Try Again
                      </Button>
                    </div>
                  ) : leaderboardLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading leaderboard...</p>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">
                        No one has conquered this challenge yet. Be the first!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {/* Table Header */}
                      <div className="hidden md:flex items-center gap-4 p-4 bg-black/20 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/10">
                        <div className="w-14 text-center">Rank</div>
                        <div className="flex-1">Player</div>
                        {selectedDifficulty === 'all' && <div className="w-28">Difficulty</div>}
                        <div className="w-24 text-center">Score</div>
                        <div className="w-16 text-center">WPM</div>
                        <div className="w-16 text-center">Acc</div>
                        <div className="w-16 text-center">Done</div>
                      </div>
                      
                      {leaderboard.map((entry: any, index: number) => {
                        const rank = entry.rank || (index + 1);
                        const diffColor = DIFFICULTY_NEON[entry.difficulty as keyof typeof DIFFICULTY_NEON];
                        return (
                        <div
                          key={`${entry.userId}-${entry.difficulty}-${entry.createdAt}`}
                          className={`flex items-center gap-4 p-4 transition-all ${
                            entry.userId === user?.id 
                              ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' 
                              : 'hover:bg-white/5'
                          }`}
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-14 text-center">
                            {rank === 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-3xl cursor-help" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' }}>🥇</div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 backdrop-blur-xl border border-white/20">
                                  <p>1st Place - The Champion!</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {rank === 2 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-3xl cursor-help" style={{ filter: 'drop-shadow(0 0 8px rgba(192, 192, 192, 0.5))' }}>🥈</div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 backdrop-blur-xl border border-white/20">
                                  <p>2nd Place - Silver medalist!</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {rank === 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-3xl cursor-help" style={{ filter: 'drop-shadow(0 0 8px rgba(205, 127, 50, 0.5))' }}>🥉</div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 backdrop-blur-xl border border-white/20">
                                  <p>3rd Place - Bronze medalist!</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {rank > 3 && (
                              <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
                            )}
                          </div>

                          {/* User */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar 
                                  className="w-10 h-10 border-2 cursor-help ring-2 ring-transparent hover:ring-white/20 transition-all" 
                                  style={{ borderColor: entry.avatarColor || '#888' }}
                                >
                                  <AvatarFallback style={{ backgroundColor: entry.avatarColor || '#888' }}>
                                    {entry.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                                <p>{entry.username}'s profile</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate flex items-center gap-2">
                                {entry.username}
                                {entry.userId === user?.id && (
                                  <span 
                                    className="text-xs px-2 py-0.5 rounded border border-cyan-500/50 text-cyan-400"
                                    style={{ background: 'rgba(0, 245, 255, 0.1)' }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Difficulty Badge */}
                          {selectedDifficulty === 'all' && (
                            <div className="flex-shrink-0">
                              <span 
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border"
                                style={{
                                  borderColor: `${diffColor}50`,
                                  background: `${diffColor}15`,
                                  color: diffColor,
                                }}
                              >
                                <span>{DIFFICULTY_ICONS[entry.difficulty as keyof typeof DIFFICULTY_ICONS]}</span>
                                <span className="capitalize hidden lg:inline">{entry.difficulty}</span>
                              </span>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex gap-4 md:gap-6 flex-shrink-0">
                            <div className="text-center min-w-[60px]">
                              <div 
                                className="text-2xl font-bold text-cyan-400" 
                                style={{ textShadow: '0 0 10px rgba(0, 245, 255, 0.5)' }}
                              >
                                {entry.stressScore}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Score
                              </div>
                            </div>
                            
                            <div className="text-center hidden md:block min-w-[50px]">
                              <div className="text-lg font-semibold text-blue-400">{entry.wpm}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WPM</div>
                            </div>
                            
                            <div className="text-center hidden md:block min-w-[50px]">
                              <div className="text-lg font-semibold text-green-400">{entry.accuracy.toFixed(1)}%</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Acc</div>
                            </div>
                            
                            <div className="text-center hidden md:block min-w-[50px]">
                              <div className="text-lg font-semibold text-orange-400">{entry.completionRate.toFixed(0)}%</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Done</div>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="text-center mt-12">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/stress-test">
                  <Button 
                    size="lg" 
                    className="gap-3 h-14 px-8 text-lg font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all shadow-[0_0_30px_rgba(0,245,255,0.2)] hover:shadow-[0_0_40px_rgba(0,245,255,0.3)]" 
                    variant="outline"
                    data-testid="button-take-test"
                  >
                    <Play className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 245, 255, 0.5))' }} />
                    Enter the Arena
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-black/90 backdrop-blur-xl border border-white/20">
                <p>Challenge yourself and climb the leaderboard!</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
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
