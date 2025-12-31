/**
 * SessionStats Component
 * 
 * Collapsible panel showing real-time typing statistics.
 * Provides immediate feedback on typing performance during book reading.
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Target, 
  Clock, 
  Hash, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SessionStatsProps {
  /** Current words per minute */
  wpm: number;
  /** Previous WPM for trend comparison */
  previousWpm?: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Previous accuracy for trend comparison */
  previousAccuracy?: number;
  /** Total errors made */
  errors: number;
  /** Time elapsed in seconds */
  timeElapsed: number;
  /** Total characters typed */
  charactersTyped: number;
  /** Total words typed */
  wordsTyped: number;
  /** Whether the panel should be collapsed */
  collapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  /** Whether typing is currently active */
  isTyping?: boolean;
  /** Consistency score (0-100) */
  consistency?: number;
  /** Additional className */
  className?: string;
}

/**
 * Format time as MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get trend icon based on current vs previous value
 */
function getTrendIndicator(current: number, previous: number | undefined, higherIsBetter: boolean = true) {
  if (previous === undefined || current === previous) {
    return { icon: Minus, color: 'text-muted-foreground', label: 'stable' };
  }
  
  const isImproving = higherIsBetter ? current > previous : current < previous;
  
  if (isImproving) {
    return { icon: TrendingUp, color: 'text-green-500', label: 'improving' };
  }
  return { icon: TrendingDown, color: 'text-red-500', label: 'declining' };
}

/**
 * Get performance rating based on WPM
 */
function getPerformanceRating(wpm: number): { label: string; color: string } {
  if (wpm >= 100) return { label: 'Expert', color: 'text-purple-500' };
  if (wpm >= 70) return { label: 'Advanced', color: 'text-blue-500' };
  if (wpm >= 50) return { label: 'Proficient', color: 'text-green-500' };
  if (wpm >= 30) return { label: 'Intermediate', color: 'text-yellow-500' };
  return { label: 'Beginner', color: 'text-orange-500' };
}

/**
 * Stat item component
 */
interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
  trend?: {
    icon: React.ElementType;
    color: string;
    label: string;
  };
  tooltip?: string;
}

function StatItem({ icon: Icon, label, value, suffix, color, trend, tooltip }: StatItemProps) {
  const content = (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-4 h-4', color || 'text-muted-foreground')} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <span className={cn('text-lg font-bold tabular-nums', color)}>
            {value}
          </span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          {trend && <trend.icon className={cn('w-3 h-3', trend.color)} />}
        </div>
      </div>
    </div>
  );
  
  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return content;
}

/**
 * Expanded stats panel
 */
export function SessionStatsExpanded({
  wpm,
  previousWpm,
  accuracy,
  previousAccuracy,
  errors,
  timeElapsed,
  charactersTyped,
  wordsTyped,
  consistency,
  onToggleCollapse,
  className,
}: SessionStatsProps) {
  const wpmTrend = getTrendIndicator(wpm, previousWpm);
  const accuracyTrend = getTrendIndicator(accuracy, previousAccuracy);
  const rating = getPerformanceRating(wpm);
  
  return (
    <TooltipProvider>
      <Card className={cn(
        'p-4 bg-card/80 backdrop-blur-sm border-border/50',
        className
      )}>
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Session Statistics</h3>
            <Badge variant="outline" className={cn('text-xs', rating.color)}>
              {rating.label}
            </Badge>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem
            icon={Zap}
            label="Speed"
            value={wpm}
            suffix="WPM"
            color="text-yellow-500"
            trend={wpmTrend}
            tooltip="Words per minute - measures your typing speed"
          />
          
          <StatItem
            icon={Target}
            label="Accuracy"
            value={accuracy}
            suffix="%"
            color="text-green-500"
            trend={accuracyTrend}
            tooltip="Percentage of correctly typed characters"
          />
          
          <StatItem
            icon={AlertCircle}
            label="Errors"
            value={errors}
            color={errors > 10 ? 'text-red-500' : 'text-muted-foreground'}
            tooltip="Total number of typing errors"
          />
          
          <StatItem
            icon={Clock}
            label="Time"
            value={formatTime(timeElapsed)}
            tooltip="Time spent typing in this session"
          />
        </div>
        
        {/* Secondary stats */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{charactersTyped.toLocaleString()} characters</span>
          <span>{wordsTyped.toLocaleString()} words</span>
          {consistency !== undefined && (
            <span>Consistency: {consistency}%</span>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Collapsed stats bar (minimal)
 */
export function SessionStatsCollapsed({
  wpm,
  accuracy,
  errors,
  timeElapsed,
  onToggleCollapse,
  className,
}: SessionStatsProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 px-4 py-2',
      'bg-card/60 backdrop-blur-sm rounded-lg border border-border/30',
      className
    )}>
      <div className="flex items-center gap-4">
        {/* WPM */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-sm font-bold text-yellow-500">{wpm}</span>
          <span className="text-xs text-muted-foreground">WPM</span>
        </div>
        
        {/* Accuracy */}
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-green-500" />
          <span className="text-sm font-bold text-green-500">{accuracy}%</span>
        </div>
        
        {/* Errors */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-sm font-medium',
            errors > 5 ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {errors} errors
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Time */}
        <span className="text-sm font-mono text-muted-foreground">
          {formatTime(timeElapsed)}
        </span>
        
        {/* Expand button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Main SessionStats component with toggle support
 */
export function SessionStats({
  collapsed = false,
  onToggleCollapse,
  ...props
}: SessionStatsProps) {
  if (collapsed) {
    return <SessionStatsCollapsed onToggleCollapse={onToggleCollapse} {...props} />;
  }
  return <SessionStatsExpanded onToggleCollapse={onToggleCollapse} {...props} />;
}

/**
 * Inline mini stats for tight spaces
 */
export function SessionStatsMini({
  wpm,
  accuracy,
  timeElapsed,
  className,
}: Pick<SessionStatsProps, 'wpm' | 'accuracy' | 'timeElapsed' | 'className'>) {
  return (
    <div className={cn('flex items-center gap-3 text-xs', className)}>
      <span className="font-bold text-yellow-500">{wpm} WPM</span>
      <span className="text-muted-foreground">•</span>
      <span className="font-bold text-green-500">{accuracy}%</span>
      <span className="text-muted-foreground">•</span>
      <span className="font-mono text-muted-foreground">{formatTime(timeElapsed)}</span>
    </div>
  );
}

export default SessionStats;

