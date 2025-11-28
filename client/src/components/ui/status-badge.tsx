import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "allow" | "monitor" | "challenge" | "deny" | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  allow: {
    label: "Allowed",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20",
  },
  monitor: {
    label: "Monitored",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  challenge: {
    label: "Challenged",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  },
  deny: {
    label: "Blocked",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.allow;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}

interface SeverityBadgeProps {
  severity: "low" | "medium" | "high" | "critical" | string;
  className?: string;
}

const severityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.low;

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
      data-testid={`badge-severity-${severity}`}
    >
      {config.label}
    </Badge>
  );
}

interface EnforcementBadgeProps {
  mode: "monitor" | "block" | string;
  className?: string;
}

export function EnforcementBadge({ mode, className }: EnforcementBadgeProps) {
  const isBlocking = mode === "block";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        isBlocking
          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        className
      )}
      data-testid={`badge-enforcement-${mode}`}
    >
      {isBlocking ? "Blocking" : "Monitoring"}
    </Badge>
  );
}
