import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Upload,
  Download,
  Power,
  PowerOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { SeverityBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WafRule, Tenant } from "@shared/schema";

const ruleCategories = [
  { value: "all", label: "All Categories" },
  { value: "sql-injection", label: "SQL Injection" },
  { value: "xss", label: "Cross-Site Scripting" },
  { value: "path-traversal", label: "Path Traversal" },
  { value: "command-injection", label: "Command Injection" },
  { value: "protocol", label: "Protocol Violations" },
  { value: "custom", label: "Custom Rules" },
];

export default function Rules() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: rules, isLoading } = useQuery<WafRule[]>({
    queryKey: ["/api/rules"],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/rules/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule updated",
        description: "The rule has been toggled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule deleted",
        description: "The rule has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRules = rules?.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || rule.category === categoryFilter;
    const matchesTenant =
      tenantFilter === "all" ||
      rule.tenantId === tenantFilter ||
      rule.tenantId === null;
    return matchesSearch && matchesCategory && matchesTenant;
  });

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Global";
    const tenant = tenants?.find((t) => t.id === tenantId);
    return tenant?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            WAF Rules
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage security rules and detection patterns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-rule">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Rule</DialogTitle>
                <DialogDescription>
                  Define a custom WAF rule to detect malicious patterns.
                </DialogDescription>
              </DialogHeader>
              <CreateRuleForm onClose={() => setCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {ruleCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-tenant">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="global">Global Only</SelectItem>
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
              <span className="text-sm text-muted-foreground">Total Rules</span>
              <Badge variant="outline">{rules?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Enabled</span>
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                {rules?.filter((r) => r.enabled).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Built-in</span>
              <Badge variant="outline">
                {rules?.filter((r) => r.isBuiltIn).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Custom</span>
              <Badge variant="outline">
                {rules?.filter((r) => !r.isBuiltIn).length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Status</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead className="w-[100px]">Hits</TableHead>
                  <TableHead className="w-[100px]">Scope</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-testid="table-rules">
                {isLoading ? (
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
                ) : filteredRules && filteredRules.length > 0 ? (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id} data-testid={`rule-row-${rule.id}`}>
                      <TableCell>
                        <Switch
                          checked={rule.enabled ?? false}
                          onCheckedChange={(checked) =>
                            toggleRuleMutation.mutate({ id: rule.id, enabled: checked })
                          }
                          disabled={toggleRuleMutation.isPending}
                          data-testid={`switch-rule-${rule.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.name}</span>
                            {rule.isBuiltIn && (
                              <Badge variant="outline" className="text-xs">
                                Built-in
                              </Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {rule.category.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={rule.severity || "medium"} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        +{rule.score}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {rule.hitCount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTenantName(rule.tenantId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-rule-menu-${rule.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Rule</DropdownMenuItem>
                            <DropdownMenuItem>View Pattern</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              disabled={rule.isBuiltIn ?? false}
                            >
                              Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Shield className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No rules found</p>
                        <p className="text-sm mt-1">
                          Create a custom rule or adjust your filters
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

function CreateRuleForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "custom",
    severity: "medium",
    pattern: "",
    targetField: "path",
    score: 10,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule created",
        description: "The new rule has been added.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Custom Rule"
            required
            data-testid="input-rule-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger id="category" data-testid="select-rule-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ruleCategories.slice(1).map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="What this rule detects..."
          data-testid="input-rule-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pattern">Pattern (Regex)</Label>
        <Textarea
          id="pattern"
          value={formData.pattern}
          onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
          placeholder="(?i)(union|select|insert|update|delete|drop)"
          className="font-mono text-sm"
          rows={3}
          required
          data-testid="input-rule-pattern"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="targetField">Target Field</Label>
          <Select
            value={formData.targetField}
            onValueChange={(v) => setFormData({ ...formData, targetField: v })}
          >
            <SelectTrigger id="targetField" data-testid="select-rule-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="path">URL Path</SelectItem>
              <SelectItem value="query">Query String</SelectItem>
              <SelectItem value="body">Request Body</SelectItem>
              <SelectItem value="headers">Headers</SelectItem>
              <SelectItem value="user-agent">User Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={formData.severity}
            onValueChange={(v) => setFormData({ ...formData, severity: v })}
          >
            <SelectTrigger id="severity" data-testid="select-rule-severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="score">Score (+)</Label>
          <Input
            id="score"
            type="number"
            min={1}
            max={100}
            value={formData.score}
            onChange={(e) =>
              setFormData({ ...formData, score: parseInt(e.target.value) })
            }
            data-testid="input-rule-score"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-rule">
          {createMutation.isPending ? "Creating..." : "Create Rule"}
        </Button>
      </DialogFooter>
    </form>
  );
}
