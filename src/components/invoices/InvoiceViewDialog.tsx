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
import { StatusBadge, getInvoiceStatusVariant, getStatusLabel } from "@/components/ui/status-badge";
import { Receipt, Building2, Calendar, DollarSign, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invoice {
  id: string;
  numero_nf: string | null;
  competencia: string;
  data_vencimento: string;
  valor_bruto: number;
  valor_impostos: number;
  valor_liquido: number;
  status: string;
  observacoes: string | null;
  contract_id: string;
  client_id: string;
  clients?: {
    razao_social: string;
    nome_fantasia: string | null;
  };
  contracts?: {
    numero: string;
  };
  created_at?: string | null;
  updated_at?: string | null;
}

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: () => void;
  onMarkAsPaid?: () => void;
}

export function InvoiceViewDialog({ open, onOpenChange, invoice, onEdit, onMarkAsPaid }: InvoiceViewDialogProps) {
  if (!invoice) return null;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatCompetencia = (comp: string) => {
    const [year, month] = comp.split("-");
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${months[parseInt(month) - 1]} de ${year}`;
  };

  const clienteNome = invoice.clients?.nome_fantasia || invoice.clients?.razao_social || "Contratante não encontrado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
          <DialogDescription>
            Informações completas da nota fiscal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {invoice.numero_nf ? `NF ${invoice.numero_nf}` : "Nota Fiscal sem número"}
              </h3>
              <p className="text-sm text-muted-foreground">{clienteNome}</p>
            </div>
            <StatusBadge
              label={getStatusLabel(invoice.status)}
              variant={getInvoiceStatusVariant(invoice.status)}
            />
          </div>

          {/* Informações Principais */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contratante</p>
                  <p className="text-sm font-medium">{clienteNome}</p>
                </div>
              </div>

              {invoice.contracts && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contrato</p>
                    <p className="text-sm font-medium">{invoice.contracts.numero}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Competência</p>
                  <p className="text-sm font-medium">{formatCompetencia(invoice.competencia)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                  <p className="text-sm font-medium">{formatDate(invoice.data_vencimento)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Bruto</p>
                  <p className="text-sm font-medium">{formatCurrency(invoice.valor_bruto)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor de Impostos</p>
                  <p className="text-sm font-medium">{formatCurrency(invoice.valor_impostos)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Líquido</p>
                  <p className="text-sm font-semibold text-lg">{formatCurrency(invoice.valor_liquido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {invoice.observacoes && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm font-medium whitespace-pre-wrap">{invoice.observacoes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          {(invoice.created_at || invoice.updated_at) && (
            <Card>
              <CardContent className="p-4 space-y-2">
                {invoice.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {formatDateTime(invoice.created_at)}
                    </span>
                  </div>
                )}
                {invoice.updated_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span className="font-medium">
                      {formatDateTime(invoice.updated_at)}
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
          {invoice.status !== "paga" && onMarkAsPaid && (
            <Button 
              variant="default" 
              onClick={() => {
                if (confirm("Deseja marcar esta nota fiscal como paga?")) {
                  onMarkAsPaid();
                }
              }}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Marcar como Paga
            </Button>
          )}
          {invoice.status === "paga" && (
            <Button 
              variant="default" 
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              Atualizar Nota Fiscal
            </Button>
          )}
          <Button onClick={() => {
            onOpenChange(false);
            onEdit();
          }}>
            {invoice.status === "paga" ? "Editar Detalhes" : "Editar Nota Fiscal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
