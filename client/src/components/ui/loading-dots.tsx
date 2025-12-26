import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingDots({ className, size = "md", text }: LoadingDotsProps) {
  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {text && <span>{text}</span>}
      <span className="inline-flex items-center gap-0.5">
        <span 
          className={cn(
            "rounded-full bg-current animate-bounce",
            dotSizes[size]
          )}
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        />
        <span 
          className={cn(
            "rounded-full bg-current animate-bounce",
            dotSizes[size]
          )}
          style={{ animationDelay: "150ms", animationDuration: "600ms" }}
        />
        <span 
          className={cn(
            "rounded-full bg-current animate-bounce",
            dotSizes[size]
          )}
          style={{ animationDelay: "300ms", animationDuration: "600ms" }}
        />
      </span>
    </span>
  );
}
