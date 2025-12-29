import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { 
  type LeaderboardMode, 
  LEADERBOARD_MODES, 
  getAllModes 
} from "@/lib/leaderboard-config";

interface ModeSelectorProps {
  value: LeaderboardMode;
  onChange: (mode: LeaderboardMode) => void;
  className?: string;
}

export function ModeSelector({ value, onChange, className }: ModeSelectorProps) {
  const modes = getAllModes();
  const currentConfig = LEADERBOARD_MODES[value];
  const CurrentIcon = currentConfig?.icon;

  // Safety check - if config not found, default to first mode
  if (!currentConfig) {
    console.warn(`ModeSelector: Invalid mode "${value}", defaulting to "global"`);
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex items-center w-full">
        <div 
          className="relative flex items-center gap-1 p-1.5 bg-muted/50 rounded-xl border border-border/50 w-full"
          role="tablist"
          aria-label="Leaderboard mode selection"
        >
          {modes.map((mode) => {
            const config = LEADERBOARD_MODES[mode];
            if (!config) return null;
            
            const Icon = config.icon;
            const isActive = mode === value;

            return (
              <Tooltip key={mode} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onChange(mode)}
                    className={cn(
                      "relative z-10 flex flex-col items-center justify-center gap-1 flex-1",
                      "py-2.5 px-2 rounded-lg transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive 
                        ? cn(
                            "font-semibold",
                            config.activeTextColor
                          )
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    data-testid={`mode-tab-${mode}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`leaderboard-panel-${mode}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-mode-tab"
                        className={cn("absolute inset-0 rounded-lg shadow-md z-[-1]", config.activeBgColor)}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        isActive && "scale-110"
                      )} 
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium truncate max-w-[80px]">
                      {config.shortLabel}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="flex items-start gap-2">
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between h-12 px-4",
                "border-border/50 bg-card/50",
                "hover:bg-muted/50 transition-colors duration-200"
              )}
              data-testid="mode-dropdown-trigger"
              aria-label={`Current mode: ${currentConfig.label}. Click to change.`}
            >
              <span className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  currentConfig.bgColor
                )}>
                  <CurrentIcon className={cn("w-4 h-4", currentConfig.color)} aria-hidden="true" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{currentConfig.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {currentConfig.sortMetricLabel} Rankings
                  </span>
                </div>
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-[calc(100vw-2rem)] max-w-sm"
          >
            {modes.map((mode) => {
              const config = LEADERBOARD_MODES[mode];
              if (!config) return null;
              
              const Icon = config.icon;
              const isActive = mode === value;

              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onChange(mode)}
                  className={cn(
                    "flex items-start gap-3 py-3 px-3 cursor-pointer",
                    "focus:bg-muted/50 transition-colors",
                    isActive && "bg-primary/10"
                  )}
                  data-testid={`mode-dropdown-${mode}`}
                >
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    config.bgColor
                  )}>
                    <Icon className={cn("w-4 h-4", config.color)} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{config.label}</span>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {config.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default ModeSelector;
