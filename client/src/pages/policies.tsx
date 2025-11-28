import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Globe,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EnforcementBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Policy, Tenant } from "@shared/schema";

export default function Policies() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const { data: policies, isLoading } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Policy>;
    }) => {
      await apiRequest("PATCH", `/api/policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({
        title: "Policy updated",
        description: "The policy settings have been saved.",
      });
      setEditDialogOpen(false);
      setSelectedPolicy(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update policy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredPolicies = policies?.filter((policy) => {
    const matchesSearch = policy.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTenant =
      tenantFilter === "all" || policy.tenantId === tenantFilter;
    return matchesSearch && matchesTenant;
  });

  const getTenantName = (tenantId: string) => {
    const tenant = tenants?.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown";
  };

  const handleEditClick = (policy: Policy) => {
    setSelectedPolicy(policy);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Policies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure enforcement modes and thresholds per site
          </p>
        </div>
        <Button data-testid="button-add-policy">
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
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
      </div>

      {/* Policies Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredPolicies && filteredPolicies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-policies">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} className="overflow-visible" data-testid={`policy-card-${policy.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {policy.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {getTenantName(policy.tenantId)}
                      </Badge>
                      {policy.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-policy-menu-${policy.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(policy)}>
                        Edit Policy
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Delete Policy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enforcement</span>
                  <EnforcementBadge mode={policy.enforcementMode} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Block Threshold</span>
                    <span className="font-medium">{policy.blockThreshold}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive rounded-full"
                      style={{ width: `${policy.blockThreshold}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Challenge Threshold</span>
                    <span className="font-medium">{policy.challengeThreshold}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${policy.challengeThreshold}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rate Limit</span>
                  <span className="font-medium">
                    {policy.rateLimit} req/{policy.rateLimitWindow}s
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEditClick(policy)}
                  data-testid={`button-edit-policy-${policy.id}`}
                >
                  Configure Policy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-policies">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No policies found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Create your first policy to configure enforcement settings for your sites.
            </p>
            <Button data-testid="button-create-first-policy">
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Policy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Configure enforcement settings for {selectedPolicy?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <PolicyEditForm
              policy={selectedPolicy}
              onSave={(data) =>
                updatePolicyMutation.mutate({ id: selectedPolicy.id, data })
              }
              isPending={updatePolicyMutation.isPending}
              onClose={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PolicyEditFormProps {
  policy: Policy;
  onSave: (data: Partial<Policy>) => void;
  isPending: boolean;
  onClose: () => void;
}

function PolicyEditForm({ policy, onSave, isPending, onClose }: PolicyEditFormProps) {
  const [formData, setFormData] = useState({
    enforcementMode: policy.enforcementMode,
    blockThreshold: policy.blockThreshold || 70,
    challengeThreshold: policy.challengeThreshold || 50,
    monitorThreshold: policy.monitorThreshold || 30,
    rateLimit: policy.rateLimit || 100,
    rateLimitWindow: policy.rateLimitWindow || 60,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Enforcement Mode</label>
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <div className="flex-1">
              <p className="font-medium">
                {formData.enforcementMode === "block" ? "Blocking" : "Monitoring"}
              </p>
              <p className="text-sm text-muted-foreground">
                {formData.enforcementMode === "block"
                  ? "Actively blocking malicious requests"
                  : "Logging threats without blocking"}
              </p>
            </div>
            <Switch
              checked={formData.enforcementMode === "block"}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  enforcementMode: checked ? "block" : "monitor",
                })
              }
              data-testid="switch-enforcement-mode"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Block Threshold</label>
            <span className="text-sm text-muted-foreground">{formData.blockThreshold}</span>
          </div>
          <Slider
            value={[formData.blockThreshold]}
            onValueChange={([value]) =>
              setFormData({ ...formData, blockThreshold: value })
            }
            min={0}
            max={100}
            step={1}
            data-testid="slider-block-threshold"
          />
          <p className="text-xs text-muted-foreground">
            Requests with scores above this will be blocked
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Challenge Threshold</label>
            <span className="text-sm text-muted-foreground">{formData.challengeThreshold}</span>
          </div>
          <Slider
            value={[formData.challengeThreshold]}
            onValueChange={([value]) =>
              setFormData({ ...formData, challengeThreshold: value })
            }
            min={0}
            max={100}
            step={1}
            data-testid="slider-challenge-threshold"
          />
          <p className="text-xs text-muted-foreground">
            Requests with scores above this may require verification
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate Limit</label>
            <Input
              type="number"
              value={formData.rateLimit}
              onChange={(e) =>
                setFormData({ ...formData, rateLimit: parseInt(e.target.value) })
              }
              min={1}
              data-testid="input-rate-limit"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Window (seconds)</label>
            <Input
              type="number"
              value={formData.rateLimitWindow}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rateLimitWindow: parseInt(e.target.value),
                })
              }
              min={1}
              data-testid="input-rate-window"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-policy">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
