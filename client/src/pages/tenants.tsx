import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Globe,
  Settings,
  MoreVertical,
  Activity,
  Shield,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EnforcementBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Tenant, Policy } from "@shared/schema";

export default function Tenants() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({
        title: "Tenant deleted",
        description: "The site has been removed from WAF protection.",
      });
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTenants = tenants?.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Protected Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your websites and WAF configurations
          </p>
        </div>
        <Button asChild data-testid="button-add-tenant">
          <Link href="/tenants/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sites by name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-tenants"
          />
        </div>
        <Button variant="outline" className="shrink-0" data-testid="button-filter">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Tenants Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredTenants && filteredTenants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-tenants">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onDelete={() => handleDeleteClick(tenant)}
            />
          ))}
        </div>
      ) : tenants && tenants.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching sites</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Try adjusting your search query or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-tenants">
            <Globe className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sites configured</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Add your first website to start protecting it with WAF rules, 
              real-time traffic monitoring, and threat analysis.
            </p>
            <Button size="lg" asChild data-testid="button-add-first-tenant">
              <Link href="/tenants/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Site
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{tenantToDelete?.name}</strong>? 
              This will remove all WAF configurations, policies, and request logs for this site.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => tenantToDelete && deleteMutation.mutate(tenantToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TenantCardProps {
  tenant: Tenant;
  onDelete: () => void;
}

function TenantCard({ tenant, onDelete }: TenantCardProps) {
  const { data: policy } = useQuery<Policy>({
    queryKey: ["/api/tenants", tenant.id, "policy"],
  });

  return (
    <Card className="overflow-visible" data-testid={`tenant-card-${tenant.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{tenant.name}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">{tenant.domain}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-tenant-menu-${tenant.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tenants/${tenant.id}`} className="cursor-pointer">
                  <Activity className="h-4 w-4 mr-2" />
                  View Traffic
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/tenants/${tenant.id}/settings`} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`https://${tenant.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={onDelete}
                data-testid={`button-delete-tenant-${tenant.id}`}
              >
                Delete Site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge
            variant="outline"
            className={tenant.isActive ? "status-allowed" : "status-blocked"}
          >
            {tenant.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Mode</span>
          <EnforcementBadge mode={policy?.enforcementMode || "monitor"} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">SSL</span>
          <Badge variant="outline" className={tenant.sslEnabled ? "status-allowed" : ""}>
            {tenant.sslEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <div className="pt-2 border-t border-border">
          <Button variant="outline" className="w-full" asChild data-testid={`button-view-tenant-${tenant.id}`}>
            <Link href={`/tenants/${tenant.id}`}>
              <Shield className="h-4 w-4 mr-2" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
