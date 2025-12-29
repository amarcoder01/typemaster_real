import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Zap, Target, Trophy, HelpCircle, Flame, Calendar, Clock, Lightbulb, LightbulbOff, Timer, ChevronRight, Headphones, Keyboard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { PracticeMode, StreakData } from '../types';
import { PRACTICE_MODES } from '../types';

interface DictationModeSelectorProps {
  streakData: StreakData;
  onSelectMode: (mode: PracticeMode) => void;
  hasRecoverableSession?: boolean;
  onRecoverSession?: () => void;
}

const MODE_ICONS: Record<PracticeMode, React.ReactNode> = {
  quick: <Zap className="w-6 h-6" />,
  focus: <Target className="w-6 h-6" />,
  challenge: <Trophy className="w-6 h-6" />,
};

const MODE_COLORS: Record<PracticeMode, { bg: string; text: string; border: string; glow: string }> = {
  quick: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    border: 'border-blue-500/30 hover:border-blue-500/60',
    glow: 'group-hover:shadow-blue-500/20'
  },
  focus: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    glow: 'group-hover:shadow-emerald-500/20'
  },
  challenge: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-500', 
    border: 'border-amber-500/30 hover:border-amber-500/60',
    glow: 'group-hover:shadow-amber-500/20'
  },
};

const MODE_FEATURES: Record<PracticeMode, { icon: React.ReactNode; label: string; enabled: boolean }[]> = {
  quick: [
    { icon: <Lightbulb className="w-3.5 h-3.5" />, label: 'Hints Available', enabled: true },
    { icon: <Timer className="w-3.5 h-3.5" />, label: 'Untimed', enabled: false },
  ],
  focus: [
    { icon: <LightbulbOff className="w-3.5 h-3.5" />, label: 'No Hints', enabled: true },
    { icon: <Timer className="w-3.5 h-3.5" />, label: 'Untimed', enabled: false },
  ],
  challenge: [
    { icon: <LightbulbOff className="w-3.5 h-3.5" />, label: 'No Hints', enabled: true },
    { icon: <Timer className="w-3.5 h-3.5" />, label: 'Timed', enabled: true },
  ],
};

/**
 * Mode selection screen for Dictation Mode
 * Professional, industry-ready design with improved visual hierarchy
 */
export function DictationModeSelector({
  streakData,
  onSelectMode,
  hasRecoverableSession = false,
  onRecoverSession,
}: DictationModeSelectorProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <main className="min-h-screen bg-background">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header with improved hierarchy */}
          <header className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button variant="ghost" size="sm" data-testid="button-back" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Return to home page</p>
                </TooltipContent>
              </Tooltip>
              <div className="w-16 sm:w-20" />
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-2">
                <Headphones className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Audio-Based Practice</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
                data-testid="text-page-title"
              >
                Dictation Mode
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Sharpen your listening and typing skills with AI-powered audio dictation
              </p>
            </div>
          </header>

          {/* Session Recovery Banner */}
          {hasRecoverableSession && onRecoverSession && (
            <Card className="mb-8 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-full shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Resume Previous Session</p>
                      <p className="text-sm text-muted-foreground">
                        You have an unfinished session from earlier
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={onRecoverSession}
                      size="sm"
                      className="flex-1 sm:flex-none"
                      data-testid="button-recover-session"
                    >
                      Resume Session
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        localStorage.removeItem('dictation_session_backup');
                        window.location.reload();
                      }}
                      data-testid="button-discard-session"
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Section with improved visuals */}
          <section aria-label="Your progress statistics" className="mb-8 sm:mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help border-transparent bg-gradient-to-br from-orange-500/5 to-orange-500/10 hover:from-orange-500/10 hover:to-orange-500/15 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="p-2 sm:p-2.5 bg-orange-500/15 rounded-full shrink-0">
                          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-orange-500 tabular-nums" data-testid="text-current-streak">
                            {streakData.currentStreak}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Current Streak</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Practice daily to keep your streak going!</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help border-transparent bg-gradient-to-br from-amber-500/5 to-amber-500/10 hover:from-amber-500/10 hover:to-amber-500/15 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="p-2 sm:p-2.5 bg-amber-500/15 rounded-full shrink-0">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-amber-500 tabular-nums" data-testid="text-best-streak">
                            {streakData.longestStreak}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Best Streak</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your all-time best streak</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help border-transparent bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/15 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="p-2 sm:p-2.5 bg-blue-500/15 rounded-full shrink-0">
                          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-500 tabular-nums" data-testid="text-total-sessions">
                            {streakData.totalSessions}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Sessions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total practice sessions completed</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          {/* Mode Selection with enhanced cards */}
          <section aria-label="Practice mode selection" className="mb-8 sm:mb-10">
            <Card className="border-border/50">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-center text-xl sm:text-2xl font-semibold">
                  Choose Your Practice Mode
                </CardTitle>
                <p className="text-center text-muted-foreground text-sm mt-1">
                  Select the mode that matches your learning goals
                </p>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {(Object.entries(PRACTICE_MODES) as [PracticeMode, typeof PRACTICE_MODES[PracticeMode]][]).map(
                    ([mode, config]) => {
                      const colors = MODE_COLORS[mode];
                      const features = MODE_FEATURES[mode];
                      
                      return (
                        <Tooltip key={mode}>
                          <TooltipTrigger asChild>
                            <Card
                              className={`group relative cursor-pointer transition-all duration-200 border-2 ${colors.border} hover:shadow-lg ${colors.glow}`}
                              onClick={() => onSelectMode(mode)}
                              tabIndex={0}
                              role="button"
                              aria-label={`Select ${config.name}`}
                              onKeyDown={(e) => e.key === 'Enter' && onSelectMode(mode)}
                              data-testid={`button-mode-${mode}`}
                            >
                              <CardContent className="pt-6 pb-5 px-4 sm:px-5">
                                {/* Icon */}
                                <div
                                  className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 ${colors.bg} ${colors.text} transition-transform group-hover:scale-110`}
                                >
                                  {MODE_ICONS[mode]}
                                </div>
                                
                                {/* Title and description */}
                                <h3 className={`text-lg sm:text-xl font-bold text-center mb-2 ${colors.text}`}>
                                  {config.name}
                                </h3>
                                <p className="text-sm text-muted-foreground text-center mb-4 min-h-[40px]">
                                  {config.description}
                                </p>
                                
                                {/* Feature badges */}
                                <div className="flex flex-col gap-2">
                                  {features.map((feature, idx) => (
                                    <div 
                                      key={idx}
                                      className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium ${
                                        feature.enabled 
                                          ? 'bg-foreground/5 text-foreground' 
                                          : 'bg-muted/50 text-muted-foreground'
                                      }`}
                                    >
                                      {feature.icon}
                                      <span>{feature.label}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Start button hint */}
                                <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>Click to start</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">{config.name}</p>
                            <p className="text-xs opacity-90">{config.description}</p>
                            <Separator className="my-2 bg-white/20" />
                            <p className="text-xs opacity-70">
                              Starts at {config.defaultDifficulty} difficulty with {config.defaultSpeed}x speed
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How It Works Section with numbered steps */}
          <section aria-label="How dictation mode works" className="mb-6">
            <Card className="bg-muted/20 border-muted/30">
              <CardContent className="py-5 sm:py-6 px-4 sm:px-6">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">How It Works</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { step: 1, icon: <Headphones className="w-4 h-4" />, title: 'Listen', desc: 'Hear the sentence spoken aloud' },
                    { step: 2, icon: <Keyboard className="w-4 h-4" />, title: 'Type', desc: 'Type exactly what you heard' },
                    { step: 3, icon: <CheckCircle2 className="w-4 h-4" />, title: 'Submit', desc: 'Get instant accuracy feedback' },
                    { step: 4, icon: <Target className="w-4 h-4" />, title: 'Improve', desc: 'Track progress and level up' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-muted-foreground">{item.icon}</span>
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4 bg-border/50" />
                
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px] font-mono">R</kbd>
                    <span>Replay audio</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px] font-mono">H</kbd>
                    <span>Show hint</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px] font-mono">Enter</kbd>
                    <span>Submit answer</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </TooltipProvider>
  );
}
