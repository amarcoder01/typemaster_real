import React, { useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Share2, Twitter, MessageCircle, Award, RefreshCw, Zap, Home, BarChart3, Target, Clock, Eye, Timer, Flame, Check, Copy, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { StressShareCard } from '@/components/StressShareCard';
import { StressCertificate } from '@/components/StressCertificate';
import { getStressPerformanceRating, buildStressShareText } from '@/lib/share-utils';

type Props = {
  username?: string | null;
  wpm: number;
  accuracy: number;
  completionRate: number;
  stressScore: number;
  survivalTime: number;
  duration: number;
  maxCombo: number;
  errors: number;
  difficulty: string;
  difficultyName: string;
  difficultyIcon: string;
  difficultyColor: string;
  certificateData?: any | null;
  isOnline: boolean;
  pendingResultData?: any | null;
  saveResultMutation: { isError: boolean; isSuccess: boolean; isPending: boolean };
  onRetry: () => void;
  onChangeDifficulty: () => void;
  onCopyLink?: (link: string) => void;
  onRetrySave: () => void;
};

function getTier(score: number) {
  if (score >= 5000) return { name: 'Diamond', color: '#00d4ff', bg: 'bg-cyan-500/10', desc: 'Legendary performance! Top 1% of all players.' };
  if (score >= 3000) return { name: 'Platinum', color: '#c0c0c0', bg: 'bg-slate-500/10', desc: 'Elite typist! Outstanding chaos resistance.' };
  if (score >= 1500) return { name: 'Gold', color: '#ffd700', bg: 'bg-yellow-500/10', desc: 'Excellent focus under pressure!' };
  if (score >= 500) return { name: 'Silver', color: '#a8a8a8', bg: 'bg-zinc-500/10', desc: 'Good job! Keep practicing to reach Gold.' };
  return { name: 'Bronze', color: '#cd7f32', bg: 'bg-orange-500/10', desc: 'You survived! Try again to improve your score.' };
}

export default function StressResultsComplete(props: Props) {
  const {
    username,
    wpm,
    accuracy,
    completionRate,
    stressScore,
    survivalTime,
    duration,
    maxCombo,
    errors,
    difficulty,
    difficultyName,
    difficultyIcon,
    difficultyColor,
    certificateData,
    isOnline,
    pendingResultData,
    saveResultMutation,
    onRetry,
    onChangeDifficulty,
    onCopyLink,
    onRetrySave,
  } = props;

  const tier = getTier(stressScore);
  const [copied, setCopied] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const shareLink = `${window.location.origin}/stress-test`;
  const rating = getStressPerformanceRating(stressScore);
  const shareText = buildStressShareText(stressScore, wpm, accuracy, completionRate, survivalTime, difficultyName, rating);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: `${tier.color}20` }}>
                <Trophy className="w-10 h-10" style={{ color: tier.color }} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{tier.desc}</p>
            </TooltipContent>
          </Tooltip>
          <h1 className="text-3xl font-bold mb-2">Stress Test Result</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{difficultyIcon}</span>
            <span className="text-xl font-medium" style={{ color: difficultyColor }}>
              {difficultyName}
            </span>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <BarChart3 className="w-5 h-5" /> WPM
              </div>
              <div className="text-4xl md:text-5xl font-bold text-primary">{Math.round(wpm)}</div>
            </div>
            <div className={`text-center px-6 py-4 rounded-2xl ${tier.bg}`}>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{tier.name} Tier</div>
              <div className="text-5xl font-bold" style={{ color: tier.color }}>{stressScore}</div>
              <div className="text-xs text-muted-foreground">Stress Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Target className="w-5 h-5" /> Accuracy
              </div>
              <div className="text-4xl md:text-5xl font-bold">{accuracy.toFixed(1)}%</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Eye className="w-5 h-5" /> Completed
              </div>
              <div className="text-3xl md:text-4xl font-bold text-orange-500">{completionRate.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Flame className="w-5 h-5" /> Max Combo
              </div>
              <div className="text-3xl md:text-4xl font-bold text-purple-500">{maxCombo}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm mb-2">Errors</div>
              <div className="text-3xl md:text-4xl font-bold text-red-500">{errors}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Timer className="w-5 h-5" /> Survival
              </div>
              <div className="text-3xl md:text-4xl font-bold text-cyan-500">{Math.round(survivalTime)}s</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
                <Clock className="w-5 h-5" /> Duration
              </div>
              <div className="text-3xl md:text-4xl font-bold">{duration}s</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm mb-2">Difficulty</div>
              <div className="text-xl font-semibold">{difficultyIcon} {difficultyName}</div>
            </div>
          </div>
        </Card>

        {!username && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Zap className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-600 dark:text-amber-400">Login to save your results</p>
                <p className="text-sm text-muted-foreground">Your score won't be saved without an account.</p>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-600">
                  Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {username && (
          <Card className={`mb-6 ${!isOnline || pendingResultData ? 'border-amber-500/50 bg-amber-500/5' : saveResultMutation.isError ? 'border-red-500/50 bg-red-500/5' : saveResultMutation.isSuccess ? 'border-green-500/50 bg-green-500/5' : ''}`}>
            <CardContent className="p-4 text-center">
              {!isOnline ? (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Offline - Will save when reconnected</span>
                </div>
              ) : pendingResultData ? (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <RefreshCw className={`w-4 h-4 ${saveResultMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="text-sm">
                    {saveResultMutation.isPending ? 'Saving...' : 'Pending - '}
                  </span>
                  {!saveResultMutation.isPending && (
                    <Button variant="ghost" size="sm" onClick={onRetrySave} className="h-6 px-2 text-amber-600">
                      Retry
                    </Button>
                  )}
                </div>
              ) : saveResultMutation.isError ? (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <span className="text-sm">Failed to save</span>
                  <Button variant="ghost" size="sm" onClick={onRetrySave} className="h-6 px-2 text-red-500">
                    Retry
                  </Button>
                </div>
              ) : saveResultMutation.isSuccess ? (
                <p className="text-sm text-green-600 dark:text-green-400">✓ Result saved!</p>
              ) : saveResultMutation.isPending ? (
                <p className="text-sm text-muted-foreground">Saving...</p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="p-4">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="social" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Visual Card</span>
                </TabsTrigger>
                <TabsTrigger value="certificate" className="gap-2" disabled={!username}>
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Certificate</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="social" className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-bold">Share Your Survival!</h3>
                  <p className="text-sm text-muted-foreground">Challenge others to beat your {stressScore} point score</p>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        onCopyLink?.(shareLink);
                      } catch {}
                    }}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400')}
                    variant="secondary"
                  >
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                  </Button>
                  <Button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
                    variant="secondary"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="visual" className="mt-4">
                <StressShareCard
                  wpm={wpm}
                  accuracy={accuracy}
                  stressScore={stressScore}
                  completionRate={completionRate}
                  survivalTime={survivalTime}
                  difficulty={difficulty}
                  difficultyName={difficultyName}
                  difficultyIcon={difficultyIcon}
                  difficultyColor={difficultyColor}
                  maxCombo={maxCombo}
                  errors={errors}
                  duration={duration}
                  username={username || undefined}
                />
              </TabsContent>

              <TabsContent value="certificate" className="space-y-4">
                {username && certificateData ? (
                  <>
                    <div className="text-center space-y-2 mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 mb-2">
                        <Award className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold">Stress Test Certificate</h3>
                      <p className="text-sm text-muted-foreground">Your official {difficultyName} survival certificate</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center p-4 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl border border-red-500/20">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Stress Score</p>
                        <p className="text-2xl font-bold" style={{ color: tier.color }}>{stressScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">WPM</p>
                        <p className="text-2xl font-bold text-blue-400">{Math.round(wpm)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tier</p>
                        <p className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                        <p className="text-sm font-bold">{difficultyIcon} {difficultyName}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
                      >
                        <Award className="w-5 h-5" />
                        View Certificate
                      </button>
                      <Link href="/profile">
                        <button className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-foreground font-bold rounded-xl hover:from-purple-500/30 hover:to-cyan-500/30 transition-all flex items-center justify-center gap-2 border border-purple-500/30">
                          <Trophy className="w-5 h-5" />
                          All Certificates
                        </button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">{username ? 'Certificate not available for this test' : 'Login to earn certificates'}</p>
                    {!username && (
                      <Link href="/login">
                        <Button variant="outline" size="sm" className="mt-4">Login to Earn Certificates</Button>
                      </Link>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {showCertificate && certificateData && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Achievement Certificate</h3>
                <Button onClick={() => setShowCertificate(false)} variant="ghost" size="sm">
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <StressCertificate {...certificateData} />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full gap-2" size="lg">
            <RefreshCw className="w-4 h-4" />
            Retry {difficultyName}
          </Button>
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={onChangeDifficulty} variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Change
            </Button>
            <Link href="/stress-leaderboard">
              <Button variant="outline" className="w-full gap-2">
                <Trophy className="w-4 h-4" />
                Ranks
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
