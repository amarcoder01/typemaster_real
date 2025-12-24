import { 
  Settings2, 
  Play, 
  Volume2, 
  Clock, 
  Target, 
  Hash, 
  RotateCcw,
  Languages,
  Mic,
  Sparkles,
  ChevronRight,
  Gauge,
  BookOpen,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ChallengeTimePreview } from './ChallengeTimePreview';
import type { 
  DifficultyLevel, 
  AdaptiveDifficultyConfig 
} from '../types';
import { CATEGORIES } from '../types';

interface DictationSetupPanelProps {
  difficulty: DifficultyLevel;
  speedLevel: string;
  category: string;
  sessionLength: number;
  currentOpenAIVoice: string;
  openAIVoices: { id: string; name: string }[];
  currentRate: number;
  adaptiveDifficulty: AdaptiveDifficultyConfig;
  
  isChallenge?: boolean;
  challengePerSentenceMs?: number | null;
  challengeTotalSessionMs?: number | null;
  isPreviewLoading?: boolean;
  
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onSpeedLevelChange: (speed: string) => void;
  onCategoryChange: (category: string) => void;
  onSessionLengthChange: (length: number) => void;
  onOpenAIVoiceChange: (voice: string) => void;
  onAdaptiveDifficultyToggle: () => void;
  
  onStartSession: () => void;
  onChangeMode: () => void;
  
  isLoading?: boolean;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'text-emerald-500',
  medium: 'text-amber-500',
  hard: 'text-red-500',
};

/**
 * Comprehensive setup panel shown before starting a dictation session.
 * Professional, industry-ready design with clear visual hierarchy.
 */
export function DictationSetupPanel({
  difficulty,
  speedLevel,
  category,
  sessionLength,
  currentOpenAIVoice,
  openAIVoices,
  currentRate,
  adaptiveDifficulty,
  isChallenge = false,
  challengePerSentenceMs,
  challengeTotalSessionMs,
  isPreviewLoading = false,
  onDifficultyChange,
  onSpeedLevelChange,
  onCategoryChange,
  onSessionLengthChange,
  onOpenAIVoiceChange,
  onAdaptiveDifficultyToggle,
  onStartSession,
  onChangeMode,
  isLoading = false,
}: DictationSetupPanelProps) {
  
  const estimatedMinutes = Math.ceil((sessionLength * 30) / 60);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid gap-5 lg:gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Main Configuration Card */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-lg sm:text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                Session Configuration
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal hidden sm:flex">
                <Clock className="w-3 h-3 mr-1" />
                ~{estimatedMinutes} min
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Content Settings Section */}
            <section aria-label="Content settings">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Content
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Difficulty Level</Label>
                  <Select 
                    value={difficulty} 
                    onValueChange={(val) => onDifficultyChange(val as DifficultyLevel)}
                    disabled={adaptiveDifficulty.enabled}
                  >
                    <SelectTrigger 
                      className="h-11" 
                      data-testid="select-difficulty"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Easy
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="hard">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Hard
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {adaptiveDifficulty.enabled && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>Auto-adjusted by Adaptive Mode</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Topic</Label>
                  <Select value={category} onValueChange={onCategoryChange}>
                    <SelectTrigger className="h-11" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/30" />

            {/* Audio Settings Section */}
            <section aria-label="Audio settings">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Audio Experience
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-2.5">
                  <Label className="text-sm font-medium">Voice Style</Label>
                  <Select value={currentOpenAIVoice} onValueChange={onOpenAIVoiceChange}>
                    <SelectTrigger className="h-11" data-testid="select-voice">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {openAIVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Speech Speed</Label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {currentRate.toFixed(1)}x
                    </Badge>
                  </div>
                  <Slider
                    value={[parseFloat(speedLevel) || 1.0]}
                    onValueChange={(value) => onSpeedLevelChange(value[0].toString())}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                    data-testid="slider-speed"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Slow (0.5x)</span>
                    <span>Normal</span>
                    <span>Fast (2x)</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-border/30" />

            {/* Session Length Section */}
            <section aria-label="Session length">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Session Length
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Number of Sentences</Label>
                  <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums" data-testid="text-session-length">
                    {sessionLength}
                  </span>
                </div>
                <Slider
                  value={[sessionLength]}
                  onValueChange={(val) => onSessionLengthChange(val[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                  data-testid="slider-session-length"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Quick (1)</span>
                  <span>Standard (10)</span>
                  <span>Marathon (20)</span>
                </div>
              </div>
            </section>
          </CardContent>
          
          <CardFooter className="bg-muted/10 border-t border-border/30 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onChangeMode}
              className="order-2 sm:order-1"
              data-testid="button-change-mode"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Change Mode
            </Button>
            <Button 
              size="lg" 
              onClick={onStartSession} 
              disabled={isLoading}
              className="order-1 sm:order-2 px-6 sm:px-8 shadow-md shadow-primary/20 font-semibold"
              data-testid="button-start-session"
            >
              {isLoading ? (
                <LoadingDots text="Preparing" size="md" />
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start Session
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Side Panel: Advanced Features & Summary */}
        <div className="space-y-5">
          {/* Challenge Mode Time Preview */}
          {isChallenge && (
            <ChallengeTimePreview
              perSentenceMs={challengePerSentenceMs ?? null}
              totalSessionMs={challengeTotalSessionMs ?? null}
              isLoading={isPreviewLoading}
            />
          )}
          
          {/* Adaptive Mode Card */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                Adaptive Mode
                <Badge variant="outline" className="ml-auto text-[10px] font-normal">
                  AI-Powered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label 
                    htmlFor="adaptive-mode" 
                    className="cursor-pointer text-sm font-medium"
                  >
                    Auto-adjust difficulty
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dynamically increases challenge as your skills improve
                  </p>
                </div>
                <Switch
                  id="adaptive-mode"
                  checked={adaptiveDifficulty.enabled}
                  onCheckedChange={onAdaptiveDifficultyToggle}
                  data-testid="switch-adaptive-mode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Session Summary Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Gauge className="w-4 h-4 text-primary" />
                </div>
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background/50 rounded-lg cursor-help">
                      <p className="text-lg font-bold text-foreground tabular-nums">{sessionLength}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Sentences</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total sentences in this session</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background/50 rounded-lg cursor-help">
                      <p className={`text-lg font-bold capitalize tabular-nums ${DIFFICULTY_COLORS[difficulty]}`}>
                        {difficulty}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">Difficulty</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Base difficulty level</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Voice Speed</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{currentRate}x</span>
              </div>
              
              <Separator className="bg-primary/10" />
              
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p className="font-medium text-foreground">Keyboard shortcuts:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="bg-background px-1.5 py-0.5 rounded border text-[10px] font-mono">R</kbd>
                    <span>Replay</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="bg-background px-1.5 py-0.5 rounded border text-[10px] font-mono">H</kbd>
                    <span>Hint</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="bg-background px-1.5 py-0.5 rounded border text-[10px] font-mono">Enter</kbd>
                    <span>Submit</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
