import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, Code, HelpCircle, Filter } from "lucide-react";
import { 
  type LeaderboardMode,
  type LeaderboardFilter,
  getModeConfig,
} from "@/lib/leaderboard-config";

interface LeaderboardFiltersProps {
  mode: LeaderboardMode;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}

function getFilterIcon(filterKey: string) {
  switch (filterKey) {
    case "language":
      return <Globe className="w-4 h-4" />;
    case "programmingLanguage":
      return <Code className="w-4 h-4" />;
    default:
      return <Filter className="w-4 h-4" />;
  }
}

export function LeaderboardFilters({ mode, filters, onFilterChange }: LeaderboardFiltersProps) {
  const config = getModeConfig(mode);
  
  if (config.filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
      {config.filters.map((filter: LeaderboardFilter) => (
        <div key={filter.key} className="flex items-center gap-2">
          {filter.type === "tabs" ? (
            <Tabs 
              value={filters[filter.key] || filter.defaultValue || "all"} 
              onValueChange={(v) => onFilterChange(filter.key, v)}
            >
              <TabsList className="h-9">
                {filter.options.map((option) => (
                  <TabsTrigger 
                    key={option.value}
                    value={option.value}
                    className="text-xs sm:text-sm"
                    data-testid={`filter-${filter.key}-${option.value}`}
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <div className="flex items-center gap-2">
              {getFilterIcon(filter.key)}
              <SearchableSelect
                value={filters[filter.key] || filter.defaultValue || "all"}
                onValueChange={(v) => onFilterChange(filter.key, v)}
                options={filter.options}
                placeholder={`Select ${filter.label}`}
                searchPlaceholder={`Search ${filter.label.toLowerCase()}...`}
                emptyText={`No ${filter.label.toLowerCase()} found.`}
                icon={getFilterIcon(filter.key)}
                triggerClassName="w-[180px]"
                contentClassName="max-h-[300px] overflow-y-auto"
                data-testid={`filter-${filter.key}`}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    aria-label={`${filter.label} help`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{filter.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Filter leaderboard results by {filter.label.toLowerCase()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LeaderboardFilters;

