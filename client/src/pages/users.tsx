import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  Plus,
  Search,
  MoreVertical,
  Shield,
  Mail,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserInitials, canManagePolicies } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Tenant } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const roleColors: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  operator: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  viewer: "bg-muted text-muted-foreground border-muted-foreground/20",
};

export default function Users() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canManage = canManagePolicies(currentUser);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated",
        description: "User settings have been saved.",
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user access and permissions
          </p>
        </div>
        {canManage && (
          <Button data-testid="button-invite-user">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-role">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <Badge variant="outline">{users?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Admins</span>
              <Badge className={roleColors.admin}>
                {users?.filter((u) => u.role === "admin").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operators</span>
              <Badge className={roleColors.operator}>
                {users?.filter((u) => u.role === "operator").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Viewers</span>
              <Badge className={roleColors.viewer}>
                {users?.filter((u) => u.role === "viewer").length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[200px]">Email</TableHead>
                  <TableHead className="w-[150px]">Joined</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-testid="table-users">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {Array(5)
                          .fill(0)
                          .map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={user.profileImageUrl || undefined}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email?.split("@")[0] || "User"}
                            </p>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs mt-0.5">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role || "viewer"]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt
                          ? formatDistanceToNow(new Date(user.createdAt), {
                              addSuffix: true,
                            })
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {canManage && user.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-user-menu-${user.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(user)}
                              >
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>View Activity</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UsersIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm mt-1">
                          Adjust your search or filters
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and permissions for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              tenants={tenants || []}
              onSave={(data) =>
                updateUserMutation.mutate({ id: selectedUser.id, data })
              }
              isPending={updateUserMutation.isPending}
              onClose={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserEditFormProps {
  user: User;
  tenants: Tenant[];
  onSave: (data: Partial<User>) => void;
  isPending: boolean;
  onClose: () => void;
}

function UserEditForm({ user, tenants, onSave, isPending, onClose }: UserEditFormProps) {
  const [role, setRole] = useState<"admin" | "operator" | "viewer">(user.role || "viewer");
  const [selectedTenants, setSelectedTenants] = useState<string[]>(
    user.tenantIds || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ role, tenantIds: selectedTenants });
  };

  const toggleTenant = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as "admin" | "operator" | "viewer")}>
            <SelectTrigger data-testid="select-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Admin - Full access
                </div>
              </SelectItem>
              <SelectItem value="operator">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Operator - View & take actions
                </div>
              </SelectItem>
              <SelectItem value="viewer">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Viewer - Read-only access
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tenant Access</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
            {tenants.length > 0 ? (
              tenants.map((tenant) => (
                <label
                  key={tenant.id}
                  className="flex items-center gap-3 p-2 rounded hover-elevate cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={() => toggleTenant(tenant.id)}
                    className="rounded"
                    data-testid={`checkbox-tenant-${tenant.id}`}
                  />
                  <span className="text-sm">{tenant.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tenant.domain}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tenants available
              </p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-user">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
