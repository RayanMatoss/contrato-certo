"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search, Building2, Mail, Phone, MapPin, MoreHorizontal, Eye, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenantSelector, TenantWithRole } from "@/hooks/use-tenant-selector";
import { NewTenantDialog } from "@/components/tenants/NewTenantDialog";
import { TenantViewDialog } from "@/components/tenants/TenantViewDialog";
import { toast } from "sonner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | undefined>(undefined);
  const [viewingTenant, setViewingTenant] = useState<TenantWithRole | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { user } = useAuth();
  const { tenants, selectedTenantId, setSelectedTenantId } = useTenantSelector();
  const queryClient = useQueryClient();

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutation para alternar empresa selecionada
  const switchTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      setSelectedTenantId(tenantId);
      queryClient.invalidateQueries();
      return tenantId;
    },
    onSuccess: (tenantId) => {
      const tenant = tenants.find((t) => t.id === tenantId);
      toast.success(`Empresa "${tenant?.name}" selecionada!`);
    },
  });

  const handleSwitchTenant = (tenantId: string) => {
    switchTenantMutation.mutate(tenantId);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Empresas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as empresas que você representa
            </p>
          </div>
          <Button className="gap-2" onClick={() => {
            setEditingTenantId(undefined);
            setIsNewTenantOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm
                ? "Nenhuma empresa encontrada com os filtros aplicados."
                : "Nenhuma empresa cadastrada. Clique em 'Nova Empresa' para começar."}
            </CardContent>
          </Card>
        )}

        {/* Tenants Grid */}
        {filteredTenants.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTenants.map((tenant) => (
              <Card
                key={tenant.id}
                className={`card-interactive ${selectedTenantId === tenant.id ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(tenant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[180px]">
                          {tenant.name}
                        </p>
                        {tenant.cnpj && (
                          <p className="text-xs text-muted-foreground">{tenant.cnpj}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem
                          onSelect={() => {
                            setViewingTenant(tenant);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditingTenantId(tenant.id);
                            setIsNewTenantOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {selectedTenantId !== tenant.id && (
                          <DropdownMenuItem
                            onSelect={() => handleSwitchTenant(tenant.id)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Usar esta Empresa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{tenant.slug}</span>
                    </div>
                    {tenant.role && (
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          label={tenant.role === "admin" ? "Administrador" : tenant.role === "escrita" ? "Editor" : "Leitura"}
                          variant={tenant.role === "admin" ? "success" : tenant.role === "escrita" ? "info" : "muted"}
                        />
                      </div>
                    )}
                  </div>

                  {selectedTenantId === tenant.id && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <StatusBadge
                        label="Empresa Ativa"
                        variant="success"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Tenant Dialog */}
        <TenantViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          tenant={viewingTenant}
          onEdit={() => {
            if (viewingTenant) {
              setEditingTenantId(viewingTenant.id);
              setIsViewDialogOpen(false);
              setIsNewTenantOpen(true);
            }
          }}
          onSwitch={() => {
            if (viewingTenant) {
              handleSwitchTenant(viewingTenant.id);
              setIsViewDialogOpen(false);
            }
          }}
          isSelected={selectedTenantId === viewingTenant?.id}
        />

        {/* New/Edit Tenant Dialog */}
        <NewTenantDialog
          open={isNewTenantOpen}
          onOpenChange={(open) => {
            setIsNewTenantOpen(open);
            if (!open) {
              setEditingTenantId(undefined);
            }
          }}
          tenantId={editingTenantId}
        />
      </div>
    </AppLayout>
  );
}
