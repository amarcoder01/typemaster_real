import { Trophy, Code, Headphones, Flame, Gauge, type LucideIcon } from "lucide-react";
// BookOpen import removed - book mode hidden

export type LeaderboardMode = "global" | "code" | "dictation" | "stress" | "rating";
// Hidden: "book" mode temporarily disabled
export type TimeFrame = "all" | "daily" | "weekly" | "monthly";

export interface LeaderboardColumn {
  key: string;
  label: string;
  width?: string;
  tooltip?: string;
  align?: "left" | "center" | "right";
}

export interface LeaderboardFilter {
  key: string;
  type: "select" | "tabs";
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

export interface LeaderboardModeConfig {
  key: LeaderboardMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  endpoint: string;
  aroundMeEndpoint: string;
  filters: LeaderboardFilter[];
  columns: LeaderboardColumn[];
  color: string;
  bgColor: string;
  activeBgColor: string;  // Solid background for active tab
  activeTextColor: string; // Text color for active tab (needs contrast)
  sortMetric: string;
  sortMetricLabel: string;
}

// Timeframe options for standard leaderboard
export const TIMEFRAME_OPTIONS: { value: TimeFrame; label: string; tooltip: string }[] = [
  { value: "all", label: "All Time", tooltip: "Rankings based on all-time best scores" },
  { value: "daily", label: "Today", tooltip: "Rankings based on scores from today" },
  { value: "weekly", label: "Weekly", tooltip: "Rankings based on scores from this week" },
  { value: "monthly", label: "Monthly", tooltip: "Rankings based on scores from this month" },
];

// Language options for various filters
export const LANGUAGE_OPTIONS = [
  { value: "all", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "ko", label: "Korean" },
  { value: "mr", label: "Marathi" },
  { value: "bn", label: "Bengali" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "vi", label: "Vietnamese" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "nl", label: "Dutch" },
  { value: "sv", label: "Swedish" },
  { value: "th", label: "Thai" },
  { value: "id", label: "Indonesian" },
];

// Programming language options for code leaderboard
export const PROGRAMMING_LANGUAGE_OPTIONS = [
  { value: "all", label: "All Languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sass", label: "Sass" },
  { value: "less", label: "Less" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dart", label: "Dart" },
  { value: "scala", label: "Scala" },
  { value: "groovy", label: "Groovy" },
  { value: "objectivec", label: "Objective-C" },
  { value: "c", label: "C" },
  { value: "zig", label: "Zig" },
  { value: "vhdl", label: "VHDL" },
  { value: "r", label: "R" },
  { value: "julia", label: "Julia" },
  { value: "matlab", label: "MATLAB" },
  { value: "bash", label: "Bash/Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "perl", label: "Perl" },
  { value: "lua", label: "Lua" },
  { value: "elixir", label: "Elixir" },
  { value: "haskell", label: "Haskell" },
  { value: "clojure", label: "Clojure" },
  { value: "fsharp", label: "F#" },
  { value: "ocaml", label: "OCaml" },
  { value: "erlang", label: "Erlang" },
  { value: "scheme", label: "Scheme" },
  { value: "racket", label: "Racket" },
  { value: "lisp", label: "Lisp" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "fortran", label: "Fortran" },
  { value: "nim", label: "Nim" },
  { value: "crystal", label: "Crystal" },
  { value: "d", label: "D" },
  { value: "solidity", label: "Solidity" },
  { value: "pascal", label: "Pascal" },
];

// Stress test difficulty options
export const STRESS_DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "beginner", label: "🔥 Beginner" },
  { value: "intermediate", label: "⚡ Intermediate" },
  { value: "expert", label: "💀 Expert" },
  { value: "nightmare", label: "☠️ Nightmare" },
  { value: "impossible", label: "🌀 Impossible" },
];

// Rating tier options
export const RATING_TIER_OPTIONS = [
  { value: "all", label: "All Tiers" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
  { value: "master", label: "Master" },
  { value: "grandmaster", label: "Grandmaster" },
];

// Book topic options
export const BOOK_TOPIC_OPTIONS = [
  { value: "all", label: "All Topics" },
  { value: "fiction", label: "Fiction" },
  { value: "classics", label: "Classics" },
  { value: "adventure", label: "Adventure" },
  { value: "mystery", label: "Mystery" },
  { value: "science-fiction", label: "Science Fiction" },
  { value: "philosophy", label: "Philosophy" },
  { value: "history", label: "History" },
];

// Main configuration for all leaderboard modes
export const LEADERBOARD_MODES: Record<LeaderboardMode, LeaderboardModeConfig> = {
  global: {
    key: "global",
    label: "Standard Typing",
    shortLabel: "Standard",
    description: "Global rankings based on typing speed across all users",
    icon: Trophy,
    endpoint: "/api/leaderboard",
    aroundMeEndpoint: "/api/leaderboard/around-me",
    filters: [
      {
        key: "timeframe",
        type: "tabs",
        label: "Time Period",
        options: TIMEFRAME_OPTIONS,
        defaultValue: "all",
      },
      {
        key: "language",
        type: "select",
        label: "Language",
        options: LANGUAGE_OPTIONS,
        defaultValue: "all",
      },
    ],
    columns: [
      { key: "rank", label: "#", width: "w-12", align: "center", tooltip: "Rank position" },
      { key: "user", label: "User", width: "flex-1", align: "left" },
      { key: "wpm", label: "WPM", width: "w-20", align: "center", tooltip: "Words Per Minute" },
      { key: "accuracy", label: "Accuracy", width: "w-20", align: "center", tooltip: "Typing accuracy percentage" },
      { key: "mode", label: "Time", width: "w-20", align: "center", tooltip: "Test duration" },
      { key: "tests", label: "Tests", width: "w-16", align: "center", tooltip: "Total tests completed" },
    ],
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    activeBgColor: "bg-yellow-500",
    activeTextColor: "text-yellow-950",
    sortMetric: "wpm",
    sortMetricLabel: "WPM",
  },
  code: {
    key: "code",
    label: "Code Practice",
    shortLabel: "Code",
    description: "Rankings for code typing speed across programming languages",
    icon: Code,
    endpoint: "/api/code/leaderboard",
    aroundMeEndpoint: "/api/code/leaderboard/around-me",
    filters: [
      {
        key: "language",
        type: "select",
        label: "Programming Language",
        options: PROGRAMMING_LANGUAGE_OPTIONS,
        defaultValue: "all",
      },
    ],
    columns: [
      { key: "rank", label: "#", width: "w-12", align: "center" },
      { key: "user", label: "User", width: "flex-1", align: "left" },
      { key: "wpm", label: "WPM", width: "w-20", align: "center", tooltip: "Words Per Minute" },
      { key: "accuracy", label: "Accuracy", width: "w-20", align: "center" },
      { key: "programmingLanguage", label: "Language", width: "w-28", align: "center" },
      { key: "tests", label: "Tests", width: "w-16", align: "center" },
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    activeBgColor: "bg-blue-500",
    activeTextColor: "text-white",
    sortMetric: "wpm",
    sortMetricLabel: "WPM",
  },
  dictation: {
    key: "dictation",
    label: "Dictation",
    shortLabel: "Dictation",
    description: "Rankings for audio dictation typing accuracy",
    icon: Headphones,
    endpoint: "/api/dictation/leaderboard",
    aroundMeEndpoint: "/api/dictation/leaderboard/around-me",
    filters: [],
    columns: [
      { key: "rank", label: "#", width: "w-12", align: "center" },
      { key: "user", label: "User", width: "flex-1", align: "left" },
      { key: "wpm", label: "WPM", width: "w-20", align: "center", tooltip: "Words Per Minute" },
      { key: "accuracy", label: "Accuracy", width: "w-20", align: "center" },
      { key: "speedLevel", label: "Speed", width: "w-24", align: "center", tooltip: "Dictation speed level" },
      { key: "tests", label: "Tests", width: "w-16", align: "center" },
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    activeBgColor: "bg-purple-500",
    activeTextColor: "text-white",
    sortMetric: "wpm",
    sortMetricLabel: "WPM",
  },
  stress: {
    key: "stress",
    label: "Speed Challenge",
    shortLabel: "Challenge",
    description: "Survive extreme typing conditions and test your limits",
    icon: Flame,
    endpoint: "/api/stress-test/leaderboard",
    aroundMeEndpoint: "/api/stress-test/leaderboard/around-me",
    filters: [
      {
        key: "difficulty",
        type: "tabs",
        label: "Difficulty",
        options: STRESS_DIFFICULTY_OPTIONS,
        defaultValue: "all",
      },
    ],
    columns: [
      { key: "rank", label: "#", width: "w-12", align: "center" },
      { key: "user", label: "User", width: "flex-1", align: "left" },
      { key: "stressScore", label: "Score", width: "w-20", align: "center", tooltip: "Stress test score" },
      { key: "wpm", label: "WPM", width: "w-16", align: "center" },
      { key: "accuracy", label: "Acc", width: "w-16", align: "center" },
      { key: "completionRate", label: "Done", width: "w-16", align: "center", tooltip: "Completion rate" },
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    activeBgColor: "bg-orange-500",
    activeTextColor: "text-white",
    sortMetric: "stressScore",
    sortMetricLabel: "Score",
  },
  rating: {
    key: "rating",
    label: "Competitive Racing",
    shortLabel: "Racing",
    description: "Compete in ranked races and climb the competitive ladder",
    icon: Gauge,
    endpoint: "/api/ratings/leaderboard",
    aroundMeEndpoint: "/api/ratings/leaderboard/around-me",
    filters: [
      {
        key: "tier",
        type: "select",
        label: "Tier",
        options: RATING_TIER_OPTIONS,
        defaultValue: "all",
      },
    ],
    columns: [
      { key: "rank", label: "#", width: "w-12", align: "center", tooltip: "Rank position" },
      { key: "user", label: "User", width: "flex-1", align: "left" },
      { key: "rating", label: "Rating", width: "w-20", align: "center", tooltip: "ELO rating" },
      { key: "tier", label: "Tier", width: "w-24", align: "center", tooltip: "Skill tier based on rating" },
      { key: "wins", label: "Wins", width: "w-16", align: "center", tooltip: "Total race victories" },
      { key: "totalRaces", label: "Races", width: "w-16", align: "center", tooltip: "Total races participated" },
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    activeBgColor: "bg-green-500",
    activeTextColor: "text-white",
    sortMetric: "rating",
    sortMetricLabel: "Rating",
  },
  // HIDDEN: Book mode temporarily disabled
  // book: {
  //   key: "book",
  //   label: "Book Library",
  //   shortLabel: "Books",
  //   description: "Rankings for book typing performance",
  //   icon: BookOpen,
  //   endpoint: "/api/book/leaderboard",
  //   aroundMeEndpoint: "/api/book/leaderboard/around-me",
  //   filters: [
  //     {
  //       key: "topic",
  //       type: "select",
  //       label: "Topic",
  //       options: BOOK_TOPIC_OPTIONS,
  //       defaultValue: "all",
  //     },
  //   ],
  //   columns: [
  //     { key: "rank", label: "#", width: "w-12", align: "center" },
  //     { key: "user", label: "User", width: "flex-1", align: "left" },
  //     { key: "wpm", label: "WPM", width: "w-20", align: "center", tooltip: "Words Per Minute" },
  //     { key: "accuracy", label: "Accuracy", width: "w-20", align: "center" },
  //     { key: "wordsTyped", label: "Words", width: "w-20", align: "center", tooltip: "Total words typed" },
  //     { key: "booksCompleted", label: "Books", width: "w-16", align: "center", tooltip: "Books completed" },
  //   ],
  //   color: "text-amber-500",
  //   bgColor: "bg-amber-500/10",
  //   activeBgColor: "bg-amber-500",
  //   activeTextColor: "text-amber-950",
  //   sortMetric: "wpm",
  //   sortMetricLabel: "WPM",
  // },
};

// Helper function to get mode config
export function getModeConfig(mode: LeaderboardMode): LeaderboardModeConfig {
  return LEADERBOARD_MODES[mode];
}

// Hidden modes that should not appear in the UI
const HIDDEN_MODES = ["book"];

// Get all mode keys as array (excluding hidden modes)
export function getAllModes(): LeaderboardMode[] {
  return (Object.keys(LEADERBOARD_MODES) as string[])
    .filter(mode => !HIDDEN_MODES.includes(mode)) as LeaderboardMode[];
}

// Build query params for API calls
export function buildLeaderboardQueryParams(
  mode: LeaderboardMode,
  filters: Record<string, string>,
  pagination: { limit: number; offset: number }
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("limit", String(pagination.limit));
  params.set("offset", String(pagination.offset));
  
  // Add mode-specific filters
  const config = getModeConfig(mode);
  config.filters.forEach((filter) => {
    const value = filters[filter.key];
    if (value && value !== "all") {
      params.set(filter.key, value);
    }
  });
  
  return params;
}

// Format test mode duration
export function formatTestMode(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:00`;
}

// Get tier color class
export function getTierColor(tier: string | undefined | null): string {
  if (!tier) return "text-muted-foreground";
  const tierColors: Record<string, string> = {
    bronze: "text-orange-600",
    silver: "text-gray-400",
    gold: "text-yellow-500",
    platinum: "text-cyan-400",
    diamond: "text-blue-400",
    master: "text-purple-500",
    grandmaster: "text-red-500",
  };
  return tierColors[tier.toLowerCase()] || "text-muted-foreground";
}

// Get tier badge variant
export function getTierBadgeVariant(tier: string | undefined | null): "default" | "secondary" | "destructive" | "outline" {
  if (!tier) return "secondary";
  const highTiers = ["diamond", "master", "grandmaster"];
  return highTiers.includes(tier.toLowerCase()) ? "default" : "secondary";
}

