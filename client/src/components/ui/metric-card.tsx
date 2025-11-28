import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  isLoading?: boolean;
}

const variantStyles = {
  default: {
    icon: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  success: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  warning: {
    icon: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  danger: {
    icon: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
  isLoading = false,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("overflow-visible", className)} data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
              {title}
            </p>
            {isLoading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold tracking-tight truncate" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", styles.bg)}>
              <Icon className={cn("h-6 w-6", styles.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
