"use client";

import { useTenantSelector } from "@/hooks/use-tenant-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export function TenantSelector() {
  const { tenants, selectedTenant, setSelectedTenantId, isLoading } = useTenantSelector();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSelectTenant = (tenantId: string | null) => {
    setSelectedTenantId(tenantId);
    queryClient.invalidateQueries();
    router.refresh();
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Carregando...
      </Button>
    );
  }

  if (tenants.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/empresas")}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Criar Empresa
      </Button>
    );
  }

  const isAllSelected = !selectedTenant;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[220px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {isAllSelected ? "Todas as empresas" : selectedTenant?.name}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel>Filtrar por empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSelectTenant(null)}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="text-sm font-medium">Todas as empresas</span>
          {isAllSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSelectTenant(tenant.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tenant.name}</p>
                {tenant.cnpj && (
                  <p className="text-xs text-muted-foreground truncate">{tenant.cnpj}</p>
                )}
              </div>
            </div>
            {selectedTenant?.id === tenant.id && (
              <Check className="h-4 w-4 shrink-0 text-primary ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/empresas")}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Gerenciar Empresas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
