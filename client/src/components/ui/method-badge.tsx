import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MethodBadgeProps {
  method: string;
  className?: string;
}

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  POST: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  PUT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  PATCH: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  HEAD: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  OPTIONS: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
  const upperMethod = method.toUpperCase();
  const colorClass = methodColors[upperMethod] || methodColors.GET;

  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs", colorClass, className)}
      data-testid={`badge-method-${method.toLowerCase()}`}
    >
      {upperMethod}
    </Badge>
  );
}
