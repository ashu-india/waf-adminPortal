import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Shield,
  Globe,
  FileText,
  Settings,
  Bell,
  Activity,
  Users,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials, getUserRole } from "@/lib/authUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Globe,
  },
  {
    title: "Live Traffic",
    url: "/traffic",
    icon: Activity,
  },
];

const securityNavItems = [
  {
    title: "WAF Rules",
    url: "/rules",
    icon: Shield,
  },
  {
    title: "Policies",
    url: "/policies",
    icon: FileText,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
  },
];

const adminNavItems = [
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const role = getUserRole(user);
  const [tenantsOpen, setTenantsOpen] = useState(true);

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/20 text-primary",
    operator: "bg-chart-2/20 text-chart-2",
    viewer: "bg-muted text-muted-foreground",
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-sidebar-foreground">WAF Admin</span>
              <span className="text-xs text-sidebar-foreground/60">Security Dashboard</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 py-3">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-10"
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 py-3">
            Security
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-10"
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Alerts" && (
                        <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                          3
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(role === "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 py-3">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className="h-10"
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-md p-2 hover-elevate text-left"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {getUserDisplayName(user)}
                </p>
                <Badge variant="outline" className={`text-xs h-5 px-1.5 ${roleColors[role]}`}>
                  {role}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer" data-testid="link-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="cursor-pointer text-destructive" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
