import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Settings,
  Shield,
  Activity,
  ExternalLink,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge, EnforcementBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { MethodBadge } from "@/components/ui/method-badge";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Tenant, Policy, Request as WAFRequest, RequestWithAnalysis } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Real analytics data fetched from backend

export default function TenantDetail() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("traffic");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveRequests, setLiveRequests] = useState<RequestWithAnalysis[]>([]);

  const { data: tenant, isLoading: tenantLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants", tenantId],
  });

  const { data: policy, isLoading: policyLoading } = useQuery<Policy>({
    queryKey: ["/api/tenants", tenantId, "policy"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<RequestWithAnalysis[]>({
    queryKey: ["/api/tenants", tenantId, "requests"],
  });

  const toggleEnforcementMutation = useMutation({
    mutationFn: async (mode: "monitor" | "block") => {
      await apiRequest("PATCH", `/api/policies/${policy?.id}`, { enforcementMode: mode });
    },
    onSuccess: (_, mode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "policy"] });
      toast({
        title: "Enforcement mode updated",
        description: `WAF is now in ${mode === "block" ? "blocking" : "monitoring"} mode.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update enforcement mode",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Note: Real-time WebSocket support for individual tenants can be added later
  // For now, we rely on periodic API polling via React Query

  const displayRequests = liveRequests.length > 0 ? liveRequests : requests || [];

  const filteredRequests = displayRequests.filter((req) => {
    const matchesSearch =
      req.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.clientIp?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      req.actionTaken === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Site not found</h2>
        <p className="text-muted-foreground mb-6">
          The site you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/tenants">Back to Sites</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/tenants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold" data-testid="text-tenant-name">{tenant.name}</h1>
              <Badge
                variant="outline"
                className={tenant.isActive ? "status-allowed" : "status-blocked"}
              >
                {tenant.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{tenant.domain}</span>
              <a
                href={`https://${tenant.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Enforcement:</span>
            <EnforcementBadge mode={policy?.enforcementMode || "monitor"} />
            <Switch
              checked={policy?.enforcementMode === "block"}
              onCheckedChange={(checked) =>
                toggleEnforcementMutation.mutate(checked ? "block" : "monitor")
              }
              disabled={toggleEnforcementMutation.isPending}
              data-testid="switch-enforcement"
            />
          </div>
          <Button variant="outline" size="icon" asChild data-testid="button-settings">
            <Link href={`/tenants/${tenantId}/settings`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests"
          value={displayRequests.length}
          description="Last 24 hours"
          icon={Activity}
        />
        <MetricCard
          title="Blocked"
          value={displayRequests.filter((r) => r.actionTaken === "deny").length}
          icon={Shield}
          variant="danger"
        />
        <MetricCard
          title="Monitored"
          value={displayRequests.filter((r) => r.actionTaken === "monitor").length}
          icon={Eye}
          variant="warning"
        />
        <MetricCard
          title="Allowed"
          value={displayRequests.filter((r) => r.actionTaken === "allow").length}
          icon={Activity}
          variant="success"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="traffic" data-testid="tab-traffic">Live Traffic</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by path or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-requests"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="allow">Allowed</SelectItem>
                <SelectItem value="monitor">Monitored</SelectItem>
                <SelectItem value="deny">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Requests Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Time</TableHead>
                      <TableHead className="w-[120px]">Client IP</TableHead>
                      <TableHead className="w-[80px]">Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="w-[80px]">Score</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                      <TableHead className="w-[80px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-testid="table-requests">
                    {requestsLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <TableRow key={i}>
                            {Array(8)
                              .fill(0)
                              .map((_, j) => (
                                <TableCell key={j}>
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              ))}
                          </TableRow>
                        ))
                    ) : filteredRequests.length > 0 ? (
                      filteredRequests.slice(0, 50).map((request, index) => (
                        <TableRow
                          key={request.id || index}
                          className={index === 0 && liveRequests.length > 0 ? "animate-fade-in-row" : ""}
                          data-testid={`request-row-${request.id || index}`}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {request.timestamp
                              ? formatDistanceToNow(new Date(request.timestamp), { addSuffix: true })
                              : "Just now"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {request.clientIpAnonymized ? "***.***.***" : request.clientIp}
                          </TableCell>
                          <TableCell>
                            <MethodBadge method={request.method} />
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            {request.path}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                request.responseCode && request.responseCode >= 400
                                  ? "status-blocked"
                                  : request.responseCode && request.responseCode >= 300
                                  ? "status-monitored"
                                  : "status-allowed"
                              }
                            >
                              {request.responseCode || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ScoreIndicator score={request.analysis?.totalScore || 0} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={request.actionTaken || "allow"} />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              data-testid={`button-view-request-${request.id}`}
                            >
                              <Link href={`/requests/${request.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="h-8 w-8 mb-2 opacity-50" />
                            <p>No requests found</p>
                            <p className="text-xs mt-1">
                              Waiting for traffic or adjust your filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Traffic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" data-testid="chart-analytics">
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4">
                  <Activity className="h-12 w-12 opacity-50" />
                  <div>
                    <p className="font-medium">Request Analytics</p>
                    <p className="text-sm mt-1">Real-time metrics displayed above</p>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold">{displayRequests.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Blocked</p>
                        <p className="text-lg font-semibold text-destructive">{displayRequests.filter(r => r.actionTaken === "deny").length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monitored</p>
                        <p className="text-lg font-semibold text-yellow-600">{displayRequests.filter(r => r.actionTaken === "monitor").length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">WAF Rules</CardTitle>
              <Button variant="outline" size="sm" asChild data-testid="button-manage-rules">
                <Link href="/rules">Manage All Rules</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Configure WAF rules for this site from the Rules management page.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
