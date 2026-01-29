"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
// Import otimizado: apenas ícones usados no header (componente global)
import { Bell, Search, Plus, LogOut } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { TenantSelector } from "@/components/tenants/TenantSelector";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const { logout } = useLogout();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-14 items-center gap-2 sm:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            
            {/* Search - Hidden on mobile */}
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contratos, contratantes, notas..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Tenant Selector - Hidden on very small screens */}
              <div className="hidden sm:block">
                <TenantSelector />
              </div>

              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1 sm:gap-2 h-9 sm:h-10">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>Novo Contrato</DropdownMenuItem>
                  <DropdownMenuItem>Novo Contratante</DropdownMenuItem>
                  <DropdownMenuItem>Nova Nota Fiscal</DropdownMenuItem>
                  <DropdownMenuItem>Nova Tarefa</DropdownMenuItem>
                  <DropdownMenuItem>Upload Documento</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications - Hidden on mobile */}
              <Button variant="ghost" size="icon" className="relative hidden sm:flex h-9 w-9">
                <Bell className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="page-enter min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
