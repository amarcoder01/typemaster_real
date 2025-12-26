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
import { ChevronDown, Sparkles } from "lucide-react";
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
  const CurrentIcon = currentConfig.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop: Enhanced horizontal tabs with animations */}
      <div className="hidden md:flex items-center w-full">
        <div className="relative flex items-center gap-1 p-1.5 bg-muted/40 rounded-xl border border-border/50 backdrop-blur-sm w-full">
          {/* Animated background indicator */}
          <div 
            className="absolute inset-y-1.5 rounded-lg bg-gradient-to-r transition-all duration-300 ease-out"
            style={{
              width: `calc(${100 / modes.length}% - 4px)`,
              left: `calc(${modes.indexOf(value) * (100 / modes.length)}% + 2px)`,
              background: `linear-gradient(135deg, var(--${value}-from) 0%, var(--${value}-to) 100%)`,
            }}
          />
          
          {modes.map((mode, index) => {
            const config = LEADERBOARD_MODES[mode];
            const Icon = config.icon;
            const isActive = mode === value;

            return (
              <Tooltip key={mode} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onChange(mode)}
                    className={cn(
                      "relative z-10 flex flex-col items-center justify-center gap-1 flex-1",
                      "py-2.5 px-3 rounded-lg transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isActive 
                        ? cn(config.color, "font-medium") 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    data-testid={`mode-tab-${mode}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`leaderboard-${mode}`}
                  >
                    <div className={cn(
                      "relative transition-transform duration-200",
                      isActive && "scale-110"
                    )}>
                      <Icon className="w-5 h-5" />
                      {isActive && (
                        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-current animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-medium hidden lg:block">
                      {config.shortLabel}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="flex items-start gap-2">
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
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

      {/* Mobile: Enhanced dropdown with icons and descriptions */}
      <div className="md:hidden w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between h-12 px-4",
                "border-border/50 bg-card/50 backdrop-blur-sm",
                "hover:bg-muted/50 transition-all duration-200",
                currentConfig.color
              )}
              data-testid="mode-dropdown-trigger"
              aria-label={`Current mode: ${currentConfig.label}. Click to change.`}
            >
              <span className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  currentConfig.bgColor
                )}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{currentConfig.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {currentConfig.sortMetricLabel} Rankings
                  </span>
                </div>
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-[calc(100vw-2rem)] max-w-sm bg-card/95 backdrop-blur-md"
          >
            {modes.map((mode) => {
              const config = LEADERBOARD_MODES[mode];
              const Icon = config.icon;
              const isActive = mode === value;

              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onChange(mode)}
                  className={cn(
                    "flex items-start gap-3 py-3 px-3 cursor-pointer",
                    "focus:bg-muted/50 transition-colors duration-150",
                    isActive && "bg-primary/10"
                  )}
                  data-testid={`mode-dropdown-${mode}`}
                >
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0 transition-transform",
                    config.bgColor,
                    isActive && "scale-110"
                  )}>
                    <Icon className={cn("w-4 h-4", config.color)} />
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

      {/* Custom CSS for mode colors */}
      <style>{`
        :root {
          --global-from: rgb(234, 179, 8);
          --global-to: rgb(245, 158, 11);
          --code-from: rgb(59, 130, 246);
          --code-to: rgb(99, 102, 241);
          --dictation-from: rgb(168, 85, 247);
          --dictation-to: rgb(139, 92, 246);
          --stress-from: rgb(249, 115, 22);
          --stress-to: rgb(239, 68, 68);
          --rating-from: rgb(34, 197, 94);
          --rating-to: rgb(16, 185, 129);
          --book-from: rgb(245, 158, 11);
          --book-to: rgb(217, 119, 6);
        }
      `}</style>
    </div>
  );
}

export default ModeSelector;
