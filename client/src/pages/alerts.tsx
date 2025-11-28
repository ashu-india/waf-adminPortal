import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  Filter,
  Trash2,
  Eye,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SeverityBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Alert, Tenant } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Alerts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/alerts/${id}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/alerts/${id}`, { isDismissed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert dismissed",
        description: "The alert has been dismissed.",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/alerts/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "All alerts marked as read",
        description: "All alerts have been marked as read.",
      });
    },
  });

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    const matchesTenant =
      tenantFilter === "all" ||
      alert.tenantId === tenantFilter ||
      alert.tenantId === null;
    return matchesSearch && matchesSeverity && matchesTenant && !alert.isDismissed;
  });

  const unreadCount = alerts?.filter((a) => !a.isRead && !a.isDismissed).length || 0;

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "System";
    const tenant = tenants?.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown";
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
    if (!alert.isRead) {
      markReadMutation.mutate(alert.id);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
              Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Security alerts and system notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-severity">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-tenant">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="system">System</SelectItem>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Critical</span>
              <Badge variant="destructive">
                {alerts?.filter((a) => a.severity === "critical" && !a.isDismissed).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High</span>
              <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                {alerts?.filter((a) => a.severity === "high" && !a.isDismissed).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Medium</span>
              <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                {alerts?.filter((a) => a.severity === "medium" && !a.isDismissed).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unread</span>
              <Badge variant="outline">{unreadCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredAlerts && filteredAlerts.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border" data-testid="list-alerts">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 cursor-pointer hover-elevate transition-colors ${
                      !alert.isRead ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleAlertClick(alert)}
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${!alert.isRead ? "" : "text-muted-foreground"}`}>
                          {alert.title}
                        </span>
                        <SeverityBadge severity={alert.severity} />
                        {!alert.isRead && (
                          <Badge variant="default" className="text-xs h-5">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{getTenantName(alert.tenantId)}</span>
                        <span>·</span>
                        <span>
                          {alert.createdAt
                            ? formatDistanceToNow(new Date(alert.createdAt), {
                                addSuffix: true,
                              })
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissMutation.mutate(alert.id);
                        }}
                        data-testid={`button-dismiss-${alert.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-alerts">
              <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No alerts</h3>
              <p className="text-muted-foreground max-w-md">
                All clear! There are no security alerts at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedAlert && getSeverityIcon(selectedAlert.severity)}
              <div>
                <DialogTitle>{selectedAlert?.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <SeverityBadge severity={selectedAlert?.severity || "low"} />
                  <span>·</span>
                  <span>{getTenantName(selectedAlert?.tenantId || null)}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Message</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAlert?.message}
              </p>
            </div>
            {selectedAlert?.metadata ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Details</h4>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto font-mono">
                  {String(JSON.stringify(selectedAlert.metadata as any, null, 2))}
                </pre>
              </div>
            ) : null}
            <div className="text-xs text-muted-foreground">
              Created:{" "}
              {selectedAlert?.createdAt
                ? new Date(selectedAlert.createdAt).toLocaleString()
                : "Unknown"}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedAlert) {
                  dismissMutation.mutate(selectedAlert.id);
                }
                setDetailDialogOpen(false);
              }}
              data-testid="button-dismiss-detail"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
