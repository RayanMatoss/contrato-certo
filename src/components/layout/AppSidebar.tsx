"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
// Import otimizado: apenas ícones usados no sidebar (componente global)
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Calendar,
  FolderOpen,
  Settings,
  ChevronDown,
  LogOut,
  Bell,
  Briefcase,
} from "@/components/icons";
import { LicityLogo } from "@/components/ui/licity-logo";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { useLogout } from "@/hooks/use-logout";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badgeKey: null,
  },
  {
    title: "Contratos",
    href: "/contratos",
    icon: FileText,
    badgeKey: "contracts",
  },
  {
    title: "Contratantes",
    href: "/contratantes",
    icon: Users,
    badgeKey: null,
  },
  {
    title: "Notas Fiscais",
    href: "/notas-fiscais",
    icon: Receipt,
    badgeKey: "invoices",
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
    badgeKey: "tasks",
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FolderOpen,
    badgeKey: null,
  },
  {
    title: "Empresas",
    href: "/empresas",
    icon: Briefcase,
    badgeKey: null,
  },
];

const configNavItems = [
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useAuth();
  
  // Usar hook que busca via API route (evita importar supabase SDK no bundle inicial)
  const { contractsCount, invoicesCount, tasksCount } = useSidebarCounts();

  // Buscar dados do usuário via API route
  const { data: userData } = useQuery({
    queryKey: ["user-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/users/${user.id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const getBadgeCount = (badgeKey: string | null) => {
    if (!badgeKey) return null;
    switch (badgeKey) {
      case "contracts":
        return contractsCount > 0 ? contractsCount : null;
      case "invoices":
        return invoicesCount > 0 ? invoicesCount : null;
      case "tasks":
        return tasksCount > 0 ? tasksCount : null;
      default:
        return null;
    }
  };

  const getUserInitials = () => {
    const typedUserData = userData as { full_name?: string } | null;
    if (typedUserData && typedUserData.full_name) {
      return typedUserData.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    const typedUserData = userData as { full_name?: string } | null;
    return typedUserData?.full_name || user?.email?.split("@")[0] || "Usuário";
  };

  const { logout } = useLogout();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center">
            <LicityLogo size={36} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Licity
              </span>
              <span className="text-xs text-muted-foreground">
                Minha Empresa
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const badgeCount = getBadgeCount(item.badgeKey);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "sidebar-item",
                          isActive(item.href) && "sidebar-item-active"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {badgeCount !== null && (
                              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                                {badgeCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {configNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "sidebar-item",
                        isActive(item.href) && "sidebar-item-active"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex flex-1 flex-col text-left">
                    <span className="text-sm font-medium text-sidebar-foreground">
                      {getUserName()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
