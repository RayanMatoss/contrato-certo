"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Building2, Calendar, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TenantWithRole } from "@/hooks/use-tenant-selector";

interface TenantViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithRole | null;
  onEdit: () => void;
  onSwitch: () => void;
  isSelected: boolean;
}

export function TenantViewDialog({ open, onOpenChange, tenant, onEdit, onSwitch, isSelected }: TenantViewDialogProps) {
  if (!tenant) return null;

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Empresa</DialogTitle>
          <DialogDescription>
            Informações completas da empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{tenant.name}</h3>
              <p className="text-sm text-muted-foreground">{tenant.slug}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <StatusBadge
                label={tenant.role === "admin" ? "Administrador" : tenant.role === "escrita" ? "Editor" : "Leitura"}
                variant={tenant.role === "admin" ? "success" : tenant.role === "escrita" ? "info" : "muted"}
              />
              {isSelected && (
                <StatusBadge
                  label="Empresa Ativa"
                  variant="success"
                />
              )}
            </div>
          </div>

          {/* Informações Principais */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="text-sm font-medium">{tenant.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="text-sm font-medium">{tenant.slug}</p>
                </div>
              </div>

              {tenant.cnpj && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="text-sm font-medium">{tenant.cnpj}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {tenant.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {formatDateTime(tenant.created_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!isSelected && (
            <Button onClick={() => {
              onOpenChange(false);
              onSwitch();
            }}>
              <Check className="h-4 w-4 mr-2" />
              Usar esta Empresa
            </Button>
          )}
          <Button onClick={() => {
            onOpenChange(false);
            onEdit();
          }}>
            Editar Empresa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
