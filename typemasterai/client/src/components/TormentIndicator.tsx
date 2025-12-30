import { memo } from 'react';
import {
  Vibrate,
  Sparkles,
  Palette,
  Zap,
  EyeOff,
  FlipVertical,
  ArrowRightLeft,
  ZoomIn,
  RotateCcw,
  Waves,
  Ghost,
  Timer,
  Contrast,
  Move,
  MonitorOff,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type TormentType =
  | 'screenShake'
  | 'distractions'
  | 'sounds'
  | 'speedIncrease'
  | 'limitedVisibility'
  | 'colorShift'
  | 'gravity'
  | 'rotation'
  | 'glitch'
  | 'textFade'
  | 'reverseText'
  | 'randomJumps'
  | 'screenInvert'
  | 'zoomChaos'
  | 'screenFlip';

interface TormentConfig {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  glowColor: string;
}

export const TORMENT_CONFIG: Record<TormentType, TormentConfig> = {
  screenShake: {
    icon: Vibrate,
    label: 'Screen Shake',
    description: 'Screen vibrates and shakes during typing',
    color: 'text-orange-400',
    glowColor: 'shadow-orange-500/50',
  },
  distractions: {
    icon: Sparkles,
    label: 'Distractions',
    description: 'Random emoji particles explode on screen',
    color: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/50',
  },
  sounds: {
    icon: Waves,
    label: 'Chaos Sounds',
    description: 'Chaotic sound effects play during the test',
    color: 'text-blue-400',
    glowColor: 'shadow-blue-500/50',
  },
  speedIncrease: {
    icon: Timer,
    label: 'Speed Ramp',
    description: 'Effects intensify as time progresses',
    color: 'text-red-400',
    glowColor: 'shadow-red-500/50',
  },
  limitedVisibility: {
    icon: EyeOff,
    label: 'Blur Vision',
    description: 'Text becomes blurry making it harder to read',
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/50',
  },
  colorShift: {
    icon: Palette,
    label: 'Color Shift',
    description: 'Text and UI colors change randomly',
    color: 'text-pink-400',
    glowColor: 'shadow-pink-500/50',
  },
  gravity: {
    icon: Move,
    label: 'Gravity Float',
    description: 'Text bounces and floats unpredictably',
    color: 'text-teal-400',
    glowColor: 'shadow-teal-500/50',
  },
  rotation: {
    icon: RotateCcw,
    label: 'Screen Tilt',
    description: 'Screen tilts and rotates during typing',
    color: 'text-indigo-400',
    glowColor: 'shadow-indigo-500/50',
  },
  glitch: {
    icon: Zap,
    label: 'Glitch Effect',
    description: 'Visual glitch effects distort the screen',
    color: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/50',
  },
  textFade: {
    icon: Ghost,
    label: 'Text Fade',
    description: 'Text opacity fluctuates making it hard to see',
    color: 'text-gray-400',
    glowColor: 'shadow-gray-500/50',
  },
  reverseText: {
    icon: ArrowRightLeft,
    label: 'Text Reverse',
    description: 'Text temporarily reverses direction',
    color: 'text-amber-400',
    glowColor: 'shadow-amber-500/50',
  },
  randomJumps: {
    icon: Move,
    label: 'Text Jumps',
    description: 'Text teleports to random positions',
    color: 'text-lime-400',
    glowColor: 'shadow-lime-500/50',
  },
  screenInvert: {
    icon: Contrast,
    label: 'Screen Invert',
    description: 'Screen colors invert unexpectedly',
    color: 'text-fuchsia-400',
    glowColor: 'shadow-fuchsia-500/50',
  },
  zoomChaos: {
    icon: ZoomIn,
    label: 'Zoom Chaos',
    description: 'Screen zooms in and out randomly',
    color: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/50',
  },
  screenFlip: {
    icon: FlipVertical,
    label: 'Screen Flip',
    description: 'Screen flips upside down periodically',
    color: 'text-rose-400',
    glowColor: 'shadow-rose-500/50',
  },
};

interface TormentIndicatorProps {
  type: TormentType;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const TormentIndicator = memo(function TormentIndicator({
  type,
  isActive,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  animated = true,
  className,
}: TormentIndicatorProps) {
  const config = TORMENT_CONFIG[type];
  const Icon = config.icon;

  const indicator = (
    <div
      className={cn(
        'relative flex items-center gap-2 transition-all duration-300',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg border transition-all duration-300',
          sizeClasses[size],
          isActive
            ? [
                'bg-black/40 backdrop-blur-sm',
                'border-current',
                config.color,
                animated && 'animate-pulse',
                `shadow-[0_0_12px_currentColor]`,
              ]
            : [
                'bg-black/20 backdrop-blur-sm',
                'border-white/10',
                'text-muted-foreground/40',
              ]
        )}
      >
        <Icon className={cn(iconSizeClasses[size], 'relative z-10')} />
        {isActive && animated && (
          <div
            className={cn(
              'absolute inset-0 rounded-lg opacity-30',
              'animate-ping',
              config.color
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-xs font-medium transition-colors',
            isActive ? config.color : 'text-muted-foreground/50'
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{indicator}</TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn(
          'max-w-xs bg-black/90 backdrop-blur-xl border',
          isActive ? 'border-white/20' : 'border-white/10'
        )}
      >
        <div className="space-y-1">
          <p className={cn('font-semibold', isActive ? config.color : 'text-muted-foreground')}>
            {config.label}
            {isActive && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                ACTIVE
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export { TormentIndicator };

interface TormentGridProps {
  effects: Record<TormentType, boolean>;
  size?: 'sm' | 'md' | 'lg';
  showInactive?: boolean;
  animated?: boolean;
  className?: string;
}

export const TormentGrid = memo(function TormentGrid({
  effects,
  size = 'sm',
  showInactive = false,
  animated = true,
  className,
}: TormentGridProps) {
  const tormentTypes = Object.keys(TORMENT_CONFIG) as TormentType[];
  const activeCount = Object.values(effects).filter(Boolean).length;

  const displayedTorments = showInactive
    ? tormentTypes
    : tormentTypes.filter((type) => effects[type]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Torments
        </span>
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            'bg-gradient-to-r from-cyan-500/20 to-purple-500/20',
            'border border-cyan-500/30',
            'text-cyan-400'
          )}
        >
          {activeCount}/{tormentTypes.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayedTorments.map((type) => (
          <TormentIndicator
            key={type}
            type={type}
            isActive={effects[type]}
            size={size}
            animated={animated && effects[type]}
          />
        ))}
      </div>
    </div>
  );
});

export default TormentIndicator;

