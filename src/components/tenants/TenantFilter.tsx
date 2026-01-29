"use client";

import { useTenantSelector } from "@/hooks/use-tenant-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantFilterProps {
  value: string | null; // null = "Todas", string = tenant_id específico
  onValueChange: (value: string | null) => void;
  className?: string;
  showLabel?: boolean;
}

export function TenantFilter({ value, onValueChange, className, showLabel = true }: TenantFilterProps) {
  const { tenants, isLoading } = useTenantSelector();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && <span className="text-sm text-muted-foreground">Empresa:</span>}
        <Select disabled>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Carregando..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // Se não houver empresas, não mostrar o filtro
  if (tenants.length === 0) {
    return null;
  }

  // Se houver apenas uma empresa, não mostrar o filtro (sempre será essa)
  if (tenants.length === 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">Empresa:</span>
      )}
      <Select
        value={value === null ? "all" : value}
        onValueChange={(val) => {
          if (val === "all") {
            onValueChange(null);
          } else {
            onValueChange(val);
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Selecione uma empresa">
            {value === null ? (
              "Todas as empresas"
            ) : (
              tenants.find((t) => t.id === value)?.name || "Empresa não encontrada"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>Todas as empresas</span>
            </div>
          </SelectItem>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tenant.name}</p>
                  {tenant.cnpj && (
                    <p className="text-xs text-muted-foreground truncate">{tenant.cnpj}</p>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
