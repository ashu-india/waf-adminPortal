import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { MethodBadge } from "@/components/ui/method-badge";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { useSSE } from "@/hooks/useSSE";
import { useAuth } from "@/hooks/useAuth";
import type { RequestWithAnalysis, Tenant } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Traffic() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [liveRequests, setLiveRequests] = useState<RequestWithAnalysis[]>([]);
  
  const { user } = useAuth();

  // Only connect SSE when user is authenticated
  const { isConnected, subscribe } = useSSE(user ? "/api/traffic/stream" : "");

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: requests, isLoading } = useQuery<RequestWithAnalysis[]>({
    queryKey: ["/api/requests", tenantFilter !== "all" ? tenantFilter : undefined],
    queryFn: async () => {
      const url = new URL(`${import.meta.env.VITE_API_URL || ''}/api/requests`, window.location.origin);
      if (tenantFilter !== "all") {
        url.searchParams.set("tenantId", tenantFilter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
  });

  useEffect(() => {
    if (!user) return; // Don't subscribe if user not authenticated
    
    const unsubscribe = subscribe("request", (data: RequestWithAnalysis) => {
      setLiveRequests((prev) => [data, ...prev.slice(0, 199)]);
    });

    return unsubscribe;
  }, [user, subscribe]);

  const displayRequests = liveRequests.length > 0 ? liveRequests : requests || [];

  const filteredRequests = displayRequests.filter((req) => {
    const matchesSearch =
      req.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.clientIp?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || req.actionTaken === statusFilter;
    const matchesTenant =
      tenantFilter === "all" || req.tenantId === tenantFilter;
    return matchesSearch && matchesStatus && matchesTenant;
  });

  const getTenantName = (tenantId: string) => {
    const tenant = tenants?.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Live Traffic
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time view of all incoming requests across your sites
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator isLive={isConnected} />
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by path, IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-tenant">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status">
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
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <Badge variant="outline">{filteredRequests.length}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Allowed</span>
              <Badge className="status-allowed">
                {filteredRequests.filter((r) => r.actionTaken === "allow").length}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monitored</span>
              <Badge className="status-monitored">
                {filteredRequests.filter((r) => r.actionTaken === "monitor").length}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Blocked</span>
              <Badge className="status-blocked">
                {filteredRequests.filter((r) => r.actionTaken === "deny").length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead className="w-[120px]">Site</TableHead>
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
                {isLoading ? (
                  Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {Array(9)
                          .fill(0)
                          .map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.slice(0, 100).map((request, index) => (
                    <TableRow
                      key={request.id || index}
                      className={
                        index === 0 && liveRequests.length > 0 ? "animate-fade-in-row" : ""
                      }
                      data-testid={`request-row-${request.id || index}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {request.timestamp
                          ? formatDistanceToNow(new Date(request.timestamp), {
                              addSuffix: true,
                            })
                          : "Just now"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/tenants/${request.tenantId}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                            {getTenantName(request.tenantId)}
                          </Badge>
                        </Link>
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
                            request.actionTaken === "deny"
                              ? "status-blocked"
                              : request.actionTaken === "monitor"
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
                          data-testid={`button-view-${request.id}`}
                        >
                          <Link href={`/requests/${request.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Activity className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm mt-1">
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
    </div>
  );
}
