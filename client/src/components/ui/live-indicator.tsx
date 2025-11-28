import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function LiveIndicator({ isLive = true, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="live-indicator">
      <div className="relative flex h-2.5 w-2.5">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2.5 w-2.5",
            isLive ? "bg-green-500" : "bg-muted-foreground"
          )}
        />
      </div>
      <span className={cn("text-sm font-medium", isLive ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
        {isLive ? "Live" : "Disconnected"}
      </span>
    </div>
  );
}
