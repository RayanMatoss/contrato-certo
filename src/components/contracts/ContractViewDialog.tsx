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
import { StatusBadge, getContractStatusVariant, getStatusLabel } from "@/components/ui/status-badge";
import { FileText, Calendar, DollarSign, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  numero: string;
  cliente: string;
  objeto: string;
  valorMensal: number | null;
  valorTotal?: number | null;
  dataInicio: string;
  dataFim: string;
  status: string;
  indiceReajuste?: string | null;
  periodicidadeReajuste?: number | null;
  responsavelInterno?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ContractViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onEdit: () => void;
}

export function ContractViewDialog({ open, onOpenChange, contract, onEdit }: ContractViewDialogProps) {
  if (!contract) return null;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Contrato</DialogTitle>
          <DialogDescription>
            Informações completas do contrato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{contract.numero}</h3>
              <p className="text-sm text-muted-foreground">{contract.cliente}</p>
            </div>
            <StatusBadge
              label={getStatusLabel(contract.status)}
              variant={getContractStatusVariant(contract.status)}
            />
          </div>

          {/* Informações Principais */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contratante</p>
                  <p className="text-sm font-medium">{contract.cliente}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Objeto</p>
                  <p className="text-sm font-medium">{contract.objeto}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Mensal</p>
                  <p className="text-sm font-medium">{formatCurrency(contract.valorMensal)}</p>
                </div>
              </div>

              {contract.valorTotal && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-medium">{formatCurrency(contract.valorTotal)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Vigência</p>
                  <p className="text-sm font-medium">
                    {formatDate(contract.dataInicio)} - {formatDate(contract.dataFim)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          {(contract.indiceReajuste || contract.periodicidadeReajuste || contract.responsavelInterno) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                {contract.indiceReajuste && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Índice de Reajuste</p>
                      <p className="text-sm font-medium">{contract.indiceReajuste}</p>
                    </div>
                  </div>
                )}

                {contract.periodicidadeReajuste && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Periodicidade de Reajuste</p>
                      <p className="text-sm font-medium">
                        {contract.periodicidadeReajuste} {contract.periodicidadeReajuste === 1 ? "mês" : "meses"}
                      </p>
                    </div>
                  </div>
                )}

                {contract.responsavelInterno && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsável Interno</p>
                      <p className="text-sm font-medium">{contract.responsavelInterno}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          {(contract.created_at || contract.updated_at) && (
            <Card>
              <CardContent className="p-4 space-y-2">
                {contract.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {formatDateTime(contract.created_at)}
                    </span>
                  </div>
                )}
                {contract.updated_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span className="font-medium">
                      {formatDateTime(contract.updated_at)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            onEdit();
          }}>
            Editar Contrato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
