import { cn } from "@/lib/utils";

interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 30) return "low";
  if (score < 50) return "medium";
  if (score < 70) return "high";
  return "critical";
}

const scoreColors = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-orange-600 dark:text-orange-400",
  critical: "text-red-600 dark:text-red-400",
};

const scoreBgColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const sizeStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
};

export function ScoreIndicator({
  score,
  maxScore = 100,
  showLabel = false,
  size = "md",
  className,
}: ScoreIndicatorProps) {
  const level = getScoreLevel(score);
  const percentage = Math.min((score / maxScore) * 100, 100);

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="score-indicator">
      <span className={cn("font-mono", scoreColors[level], sizeStyles[size])}>
        {score.toFixed(0)}
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{level}</span>
      )}
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  className?: string;
}

export function ScoreBar({ score, maxScore = 100, className }: ScoreBarProps) {
  const level = getScoreLevel(score);
  const percentage = Math.min((score / maxScore) * 100, 100);

  return (
    <div className={cn("flex items-center gap-3", className)} data-testid="score-bar">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", scoreBgColors[level])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn("text-sm font-mono min-w-[3ch]", scoreColors[level])}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}

interface ScoreBreakdownProps {
  breakdown: {
    name: string;
    score: number;
    maxScore?: number;
  }[];
  className?: string;
}

export function ScoreBreakdown({ breakdown, className }: ScoreBreakdownProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="score-breakdown">
      {breakdown.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.name}</span>
            <ScoreIndicator score={item.score} size="sm" />
          </div>
          <ScoreBar score={item.score} maxScore={item.maxScore} />
        </div>
      ))}
    </div>
  );
}
