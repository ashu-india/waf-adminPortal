import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SignIn from "@/pages/sign-in";
import Dashboard from "@/pages/dashboard";
import Tenants from "@/pages/tenants";
import TenantDetail from "@/pages/tenant-detail";
import TenantForm from "@/pages/tenant-form";
import Traffic from "@/pages/traffic";
import Rules from "@/pages/rules";
import Policies from "@/pages/policies";
import Alerts from "@/pages/alerts";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import RequestDetail from "@/pages/request-detail";


function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading, error } = useAuth();

  // Pre-fetch ALL app data on init for instant page loads
  useEffect(() => {
    if (user) {
      // Prefetch all critical data immediately
      const prefetch = async () => {
        try {
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ["/api/dashboard/stats"],
              queryFn: () => fetch("/api/dashboard/stats", { credentials: "include" }).then(r => r.json()),
            }),
            queryClient.prefetchQuery({
              queryKey: ["/api/tenants"],
              queryFn: () => fetch("/api/tenants", { credentials: "include" }).then(r => r.json()),
            }),
            queryClient.prefetchQuery({
              queryKey: ["/api/policies"],
              queryFn: () => fetch("/api/policies", { credentials: "include" }).then(r => r.json()),
            }),
            queryClient.prefetchQuery({
              queryKey: ["/api/waf/rules"],
              queryFn: () => fetch("/api/waf/rules", { credentials: "include" }).then(r => r.json()),
            }),
            queryClient.prefetchQuery({
              queryKey: ["/api/alerts"],
              queryFn: () => fetch("/api/alerts", { credentials: "include" }).then(r => r.json()),
            }),
          ]);
        } catch (e) {
          // Silently fail - queries will retry on demand
        }
      };
      prefetch();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Unauthenticated routes - use Switch/Route for proper rendering
  if (!user) {
    return (
      <Switch>
        <Route path="/sign-in" component={SignIn} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tenants" component={Tenants} />
        <Route path="/tenants/new" component={TenantForm} />
        <Route path="/tenants/:id" component={TenantDetail} />
        <Route path="/tenants/:id/settings" component={TenantForm} />
        <Route path="/traffic" component={Traffic} />
        <Route path="/rules" component={Rules} />
        <Route path="/policies" component={Policies} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={Settings} />
        <Route path="/requests/:id" component={RequestDetail} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
