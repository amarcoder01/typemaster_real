import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  previousRank?: number;
  showMovement?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RANK_CONFIG = {
  1: {
    icon: Crown,
    label: "Champion",
    description: "1st Place - The undisputed champion!",
    gradient: "from-yellow-400 via-amber-500 to-yellow-600",
    shadow: "shadow-yellow-500/50",
    glow: "after:bg-yellow-400/30",
    textColor: "text-yellow-400",
    bgColor: "bg-gradient-to-br from-yellow-500/20 to-amber-600/20",
    borderColor: "border-yellow-500/50",
  },
  2: {
    icon: Medal,
    label: "Runner-up",
    description: "2nd Place - Exceptional performance!",
    gradient: "from-gray-300 via-slate-400 to-gray-500",
    shadow: "shadow-gray-400/50",
    glow: "after:bg-gray-300/20",
    textColor: "text-gray-300",
    bgColor: "bg-gradient-to-br from-gray-400/20 to-slate-500/20",
    borderColor: "border-gray-400/50",
  },
  3: {
    icon: Award,
    label: "Bronze Medal",
    description: "3rd Place - Outstanding achievement!",
    gradient: "from-orange-400 via-amber-600 to-orange-700",
    shadow: "shadow-orange-500/50",
    glow: "after:bg-orange-400/20",
    textColor: "text-orange-400",
    bgColor: "bg-gradient-to-br from-orange-500/20 to-amber-600/20",
    borderColor: "border-orange-500/50",
  },
};

const SIZE_CLASSES = {
  sm: {
    container: "w-7 h-7",
    icon: "w-3.5 h-3.5",
    text: "text-xs",
    movement: "w-3 h-3",
  },
  md: {
    container: "w-9 h-9",
    icon: "w-4 h-4",
    text: "text-sm",
    movement: "w-3.5 h-3.5",
  },
  lg: {
    container: "w-12 h-12",
    icon: "w-5 h-5",
    text: "text-base",
    movement: "w-4 h-4",
  },
};

export function RankBadge({ 
  rank, 
  previousRank, 
  showMovement = false, 
  size = "md",
  className 
}: RankBadgeProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const movement = previousRank ? previousRank - rank : 0;
  
  // Top 3 ranks get special treatment
  if (rank <= 3) {
    const config = RANK_CONFIG[rank as 1 | 2 | 3];
    const Icon = config.icon;
    
    return (
      <div className={cn("relative inline-flex items-center", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "relative flex items-center justify-center rounded-full cursor-help",
                "border-2 transition-all duration-300",
                "hover:scale-110 hover:shadow-lg",
                "after:absolute after:inset-0 after:rounded-full after:animate-pulse after:opacity-50",
                config.bgColor,
                config.borderColor,
                config.shadow,
                config.glow,
                sizeClasses.container,
              )}
              role="img"
              aria-label={config.label}
            >
              <Icon className={cn(
                "relative z-10 drop-shadow-sm",
                config.textColor,
                sizeClasses.icon,
                rank === 1 && "animate-pulse"
              )} />
              
              {/* Sparkle effect for 1st place */}
              {rank === 1 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-yellow-400 rounded-full animate-ping animation-delay-300" />
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-5 h-5", config.textColor)} />
              <div>
                <p className="font-semibold">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Movement indicator */}
        {showMovement && movement !== 0 && (
          <RankMovement movement={movement} size={size} />
        )}
      </div>
    );
  }

  // Regular ranks
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center justify-center rounded-full cursor-help",
              "bg-muted/50 border border-border/50 transition-all duration-200",
              "hover:bg-muted hover:border-border",
              sizeClasses.container,
            )}
            role="text"
            aria-label={`Rank ${rank}`}
          >
            <span className={cn(
              "font-mono font-medium text-muted-foreground",
              sizeClasses.text,
            )}>
              {rank}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Rank #{rank}</p>
        </TooltipContent>
      </Tooltip>

      {/* Movement indicator */}
      {showMovement && movement !== 0 && (
        <RankMovement movement={movement} size={size} />
      )}
    </div>
  );
}

function RankMovement({ movement, size }: { movement: number; size: "sm" | "md" | "lg" }) {
  const sizeClasses = SIZE_CLASSES[size];
  
  if (movement === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute -right-1 -bottom-1">
            <Minus className={cn("text-muted-foreground", sizeClasses.movement)} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>No change in rank</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const isUp = movement > 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "absolute -right-1 -bottom-1 flex items-center gap-0.5",
          "rounded-full px-1 py-0.5 text-xs font-medium",
          isUp ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10",
        )}>
          {isUp ? (
            <TrendingUp className={sizeClasses.movement} />
          ) : (
            <TrendingDown className={sizeClasses.movement} />
          )}
          <span className="text-[10px]">{Math.abs(movement)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isUp ? `Moved up ${movement} place${movement > 1 ? 's' : ''}` : `Dropped ${Math.abs(movement)} place${Math.abs(movement) > 1 ? 's' : ''}`}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default RankBadge;

