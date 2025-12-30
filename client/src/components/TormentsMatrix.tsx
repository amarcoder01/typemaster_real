import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TormentIndicator, TORMENT_CONFIG, type TormentType } from './TormentIndicator';
import { cn } from '@/lib/utils';
import { Check, X, HelpCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'nightmare' | 'impossible';

interface StressEffects {
  screenShake: boolean;
  distractions: boolean;
  sounds: boolean;
  speedIncrease: boolean;
  limitedVisibility: boolean;
  colorShift: boolean;
  gravity: boolean;
  rotation: boolean;
  glitch: boolean;
  textFade: boolean;
  reverseText: boolean;
  randomJumps: boolean;
  screenInvert: boolean;
  zoomChaos: boolean;
  screenFlip: boolean;
}

interface DifficultyConfig {
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  effects: StressEffects;
  duration: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: 'Warm-Up',
    icon: '🔥',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    duration: 30,
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: false,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
  },
  intermediate: {
    name: 'Mind Scrambler',
    icon: '⚡',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    duration: 45,
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: false,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: false,
      textFade: false,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: false,
    },
  },
  expert: {
    name: 'Absolute Mayhem',
    icon: '💀',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    duration: 60,
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: false,
      randomJumps: false,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
  },
  nightmare: {
    name: 'Nightmare Realm',
    icon: '☠️',
    color: 'text-rose-500',
    borderColor: 'border-rose-500/30',
    duration: 90,
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: false,
      limitedVisibility: true,
      colorShift: false,
      gravity: false,
      rotation: false,
      glitch: true,
      textFade: false,
      reverseText: true,
      randomJumps: false,
      screenInvert: false,
      zoomChaos: false,
      screenFlip: false,
    },
  },
  impossible: {
    name: 'IMPOSSIBLE',
    icon: '🌀',
    color: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/30',
    duration: 120,
    effects: {
      screenShake: true,
      distractions: true,
      sounds: true,
      speedIncrease: true,
      limitedVisibility: true,
      colorShift: true,
      gravity: true,
      rotation: true,
      glitch: true,
      textFade: true,
      reverseText: true,
      randomJumps: true,
      screenInvert: true,
      zoomChaos: true,
      screenFlip: true,
    },
  },
};

interface TormentsMatrixProps {
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export const TormentsMatrix = memo(function TormentsMatrix({
  className,
  showHeader = true,
  compact = false,
}: TormentsMatrixProps) {
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'nightmare', 'impossible'];
  const tormentTypes = Object.keys(TORMENT_CONFIG) as TormentType[];

  const getActiveCount = (difficulty: Difficulty) => {
    return Object.values(DIFFICULTY_CONFIGS[difficulty].effects).filter(Boolean).length;
  };

  return (
    <Card
      className={cn(
        'bg-black/30 backdrop-blur-xl border border-white/10',
        'shadow-[0_0_30px_rgba(0,0,0,0.5)]',
        className
      )}
    >
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <span
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
              style={{
                textShadow: '0 0 20px rgba(0, 245, 255, 0.3)',
              }}
            >
              Chaos Effect Matrix
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>
                  Compare all visual torments across difficulty levels. Higher difficulties
                  stack more effects for maximum chaos!
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(showHeader ? 'pt-0' : 'pt-6')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/10">
                  Effect
                </th>
                {difficulties.map((diff) => {
                  const config = DIFFICULTY_CONFIGS[diff];
                  return (
                    <th
                      key={diff}
                      className={cn(
                        'text-center py-3 px-2 border-b border-white/10',
                        'min-w-[80px]'
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <span className="text-2xl">{config.icon}</span>
                            <span
                              className={cn(
                                'text-xs font-bold',
                                config.color
                              )}
                            >
                              {compact ? diff.slice(0, 3).toUpperCase() : config.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {config.duration}s
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>
                            {config.name} - {getActiveCount(diff)} effects active
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tormentTypes.map((tormentType, index) => {
                const tormentConfig = TORMENT_CONFIG[tormentType];
                const Icon = tormentConfig.icon;
                
                return (
                  <tr
                    key={tormentType}
                    className={cn(
                      'transition-colors hover:bg-white/5',
                      index % 2 === 0 ? 'bg-white/[0.02]' : ''
                    )}
                  >
                    <td className="py-2 px-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <div
                              className={cn(
                                'w-6 h-6 rounded flex items-center justify-center',
                                'bg-black/40 border border-white/10'
                              )}
                            >
                              <Icon className={cn('w-3 h-3', tormentConfig.color)} />
                            </div>
                            <span className="text-xs font-medium text-foreground/80">
                              {tormentConfig.label}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className={cn('font-semibold', tormentConfig.color)}>
                            {tormentConfig.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tormentConfig.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {difficulties.map((diff) => {
                      const isActive = DIFFICULTY_CONFIGS[diff].effects[tormentType];
                      return (
                        <td key={diff} className="text-center py-2 px-2">
                          <div className="flex justify-center">
                            {isActive ? (
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center',
                                  'bg-green-500/20 border border-green-500/40',
                                  'shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                                )}
                              >
                                <Check className="w-3 h-3 text-green-400" />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center',
                                  'bg-white/5 border border-white/10'
                                )}
                              >
                                <X className="w-3 h-3 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td className="py-3 px-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Total Active
                  </span>
                </td>
                {difficulties.map((diff) => {
                  const count = getActiveCount(diff);
                  const config = DIFFICULTY_CONFIGS[diff];
                  return (
                    <td key={diff} className="text-center py-3 px-2">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center',
                          'w-8 h-8 rounded-full font-bold text-sm',
                          'bg-gradient-to-br',
                          diff === 'beginner' && 'from-amber-500/20 to-orange-500/20 text-amber-400',
                          diff === 'intermediate' && 'from-purple-500/20 to-pink-500/20 text-purple-400',
                          diff === 'expert' && 'from-red-500/20 to-orange-500/20 text-red-400',
                          diff === 'nightmare' && 'from-rose-500/20 to-red-900/20 text-rose-400',
                          diff === 'impossible' && 'from-fuchsia-500/20 to-purple-900/20 text-fuchsia-400',
                          'border',
                          config.borderColor,
                          'shadow-[0_0_12px_currentColor]'
                        )}
                        style={{
                          textShadow: '0 0 8px currentColor',
                        }}
                      >
                        {count}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <Check className="w-2 h-2 text-green-400" />
            </div>
            <span>Effect Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <X className="w-2 h-2 text-muted-foreground/30" />
            </div>
            <span>Effect Inactive</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default TormentsMatrix;

