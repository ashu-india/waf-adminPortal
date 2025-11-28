import { useQuery } from "@tanstack/react-query";
import { Activity, Shield, AlertTriangle, Globe, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge, SeverityBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Tenant, Alert, DashboardStats } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Real data will be fetched from backend

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/recent"],
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your WAF protection status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            <span data-testid="text-last-updated">Last updated: just now</span>
          </Badge>
          <Button variant="outline" size="sm" asChild data-testid="button-view-traffic">
            <Link href="/traffic">View Live Traffic</Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests"
          value={stats?.totalRequests || 0}
          description="Last 24 hours"
          icon={Activity}
          trend={{ value: 12.5, isPositive: true }}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Blocked Requests"
          value={stats?.blockedRequests || 0}
          description={`${stats?.blockPercentage?.toFixed(1) || 0}% of total`}
          icon={Shield}
          variant="danger"
          trend={{ value: 8.2, isPositive: false }}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Flagged Requests"
          value={stats?.flaggedRequests || 0}
          description="Requires review"
          icon={AlertTriangle}
          variant="warning"
          isLoading={statsLoading}
        />
        <MetricCard
          title="Active Tenants"
          value={stats?.activeTenants || 0}
          description={`${stats?.activeRules || 0} active rules`}
          icon={Globe}
          variant="info"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Traffic Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Traffic Overview (Last 24 Hours)</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Total: {stats?.totalRequests || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Blocked: {stats?.blockedRequests || 0}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px]" data-testid="chart-traffic">
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mb-4 opacity-50" />
                  <p>Real-time traffic data</p>
                  <p className="text-sm mt-1">Aggregate metrics shown above</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests Summary */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Request Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Allowed</span>
                <span className="font-medium">{stats?.allowedRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monitored</span>
                <span className="font-medium">{stats?.flaggedRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Blocked</span>
                <span className="font-medium text-destructive">{stats?.blockedRequests || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Block Rate</span>
                  <span className="font-semibold">{stats?.blockPercentage?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Recent Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild data-testid="button-view-alerts">
                <Link href="/alerts">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3" data-testid="list-recent-alerts">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{alert.title}</span>
                        <SeverityBadge severity={alert.severity} className="shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="empty-alerts">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No recent alerts</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Your systems are running smoothly
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="system-health">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Active Tenants</span>
                <span className="font-medium">{stats?.activeTenants || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Active Rules</span>
                <span className="font-medium">{stats?.activeRules || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Active Alerts</span>
                <span className="font-medium">{stats?.recentAlerts?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Grid */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Protected Sites</CardTitle>
            <Button variant="outline" size="sm" asChild data-testid="button-manage-tenants">
              <Link href="/tenants">Manage All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : tenants && tenants.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-tenants">
              {tenants.slice(0, 6).map((tenant) => (
                <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
                  <div
                    className="p-4 rounded-lg border border-border hover-elevate cursor-pointer"
                    data-testid={`tenant-card-${tenant.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium truncate">{tenant.name}</span>
                      <Badge
                        variant="outline"
                        className={tenant.isActive ? "status-allowed" : "status-blocked"}
                      >
                        {tenant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{tenant.domain}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-tenants">
              <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No sites configured</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Add your first website to start protecting it with WAF rules and real-time monitoring.
              </p>
              <Button asChild data-testid="button-add-first-tenant">
                <Link href="/tenants/new">Add Your First Site</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
