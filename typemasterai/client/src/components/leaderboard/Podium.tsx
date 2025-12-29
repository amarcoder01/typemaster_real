import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LeaderboardMode, getModeConfig } from "@/lib/leaderboard-config";

interface PodiumProps {
  entries: any[];
  mode: LeaderboardMode;
  isLoading?: boolean;
}

export function Podium({ entries, mode, isLoading }: PodiumProps) {
  const config = getModeConfig(mode);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-end gap-4 h-[280px] mb-12 px-4">
        {[2, 1, 3].map((rank) => (
          <div 
            key={rank} 
            className={cn(
              "w-full max-w-[140px] rounded-t-xl bg-muted/20 animate-pulse",
              rank === 1 ? "h-[220px]" : rank === 2 ? "h-[180px]" : "h-[150px]"
            )}
          />
        ))}
      </div>
    );
  }

  // Ensure we have 3 spots, filling with null if needed
  const topThree = [
    entries.find(e => (e.rank || 0) === 2), // Left: 2nd
    entries.find(e => (e.rank || 0) === 1), // Center: 1st
    entries.find(e => (e.rank || 0) === 3), // Right: 3rd
  ];

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          height: "h-[240px]",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          ringColor: "ring-yellow-500",
          icon: Crown,
          delay: 0.2,
        };
      case 2:
        return {
          height: "h-[200px]",
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          borderColor: "border-gray-400/30",
          ringColor: "ring-gray-400",
          icon: Medal,
          delay: 0.1,
        };
      case 3:
        return {
          height: "h-[170px]",
          color: "text-amber-700",
          bgColor: "bg-amber-700/10",
          borderColor: "border-amber-700/30",
          ringColor: "ring-amber-700",
          icon: Medal,
          delay: 0.3,
        };
      default:
        return {};
    }
  };

  return (
    <div className="flex justify-center items-end gap-2 sm:gap-6 h-[320px] mb-12 px-4 select-none">
      {topThree.map((entry, index) => {
        // Correct rank mapping based on array position: 0->2nd, 1->1st, 2->3rd
        const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
        const styles = getRankStyles(rank);
        const Icon = styles.icon!;

        if (!entry) {
          return (
            <div 
              key={`empty-${rank}`}
              className={cn(
                "relative w-full max-w-[120px] sm:max-w-[160px] flex flex-col items-center justify-end rounded-t-2xl border-x border-t",
                styles.height,
                "bg-muted/5 border-muted"
              )}
            >
              <div className="mb-8 text-muted-foreground/20 font-bold text-4xl">{rank}</div>
            </div>
          );
        }

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              bounce: 0.4, 
              duration: 0.8,
              delay: styles.delay 
            }}
            className={cn(
              "relative w-full max-w-[120px] sm:max-w-[160px] flex flex-col items-center justify-end",
              "rounded-t-2xl border-x border-t backdrop-blur-sm",
              styles.height,
              styles.bgColor,
              styles.borderColor
            )}
          >
            {/* Floating Avatar */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: -10 }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 2,
                ease: "easeInOut",
                delay: styles.delay 
              }}
              className="absolute -top-14 sm:-top-16 flex flex-col items-center gap-2"
            >
              <div className="relative">
                {rank === 1 && (
                  <Crown 
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 fill-yellow-500/20 animate-bounce" 
                    style={{ animationDuration: "2s" }}
                  />
                )}
                <Avatar className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 border-4 shadow-lg",
                  styles.borderColor,
                  styles.ringColor
                )}>
                  <AvatarFallback 
                    className={cn("text-xl sm:text-2xl font-bold", entry.avatarColor || "bg-primary/20")}
                    style={{ color: "white" }}
                  >
                    {entry.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm whitespace-nowrap",
                  rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : "bg-amber-700"
                )}>
                  Rank {rank}
                </div>
              </div>
              
              <div className="text-center space-y-0.5">
                <div className="font-bold text-sm sm:text-base truncate max-w-[120px]">
                  {entry.username}
                </div>
                <div className="font-mono text-xs sm:text-sm text-muted-foreground font-medium">
                  {entry.wpm} WPM
                </div>
              </div>
            </motion.div>

            {/* Podium Base Content */}
            <div className="w-full h-full flex flex-col items-center justify-end pb-4 bg-gradient-to-b from-transparent to-background/50">
              <div className={cn("text-4xl sm:text-5xl font-black opacity-10 select-none", styles.color)}>
                {rank}
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className={cn(
              "absolute inset-0 opacity-20 bg-gradient-to-t from-background via-transparent to-transparent",
              styles.bgColor
            )} />
          </motion.div>
        );
      })}
    </div>
  );
}
