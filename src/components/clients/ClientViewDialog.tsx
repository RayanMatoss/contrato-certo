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
import { Building2, Mail, Phone, MapPin, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Client {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  status: "ativo" | "inativo";
  created_at?: string | null;
  updated_at?: string | null;
}

interface ClientViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: () => void;
}

export function ClientViewDialog({ open, onOpenChange, client, onEdit }: ClientViewDialogProps) {
  if (!client) return null;

  // Função auxiliar para formatar data com segurança
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Não informado";
    
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return "Data inválida";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Contratante</DialogTitle>
          <DialogDescription>
            Informações completas do contratante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{client.nome_fantasia || client.razao_social}</h3>
              <p className="text-sm text-muted-foreground">{client.razao_social}</p>
            </div>
            <StatusBadge
              label={client.status === "ativo" ? "Ativo" : "Inativo"}
              variant={client.status === "ativo" ? "success" : "muted"}
            />
          </div>

          {/* Informações Principais */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="text-sm font-medium">{client.cnpj}</p>
                </div>
              </div>

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                </div>
              )}

              {client.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{client.telefone}</p>
                  </div>
                </div>
              )}

              {(client.cidade || client.uf) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="text-sm font-medium">
                      {client.cidade && client.uf
                        ? `${client.cidade}/${client.uf}`
                        : client.cidade || client.uf || "Não informado"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {client.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {formatDate(client.created_at)}
                  </span>
                </div>
              )}
              {client.updated_at && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Atualizado em:</span>
                  <span className="font-medium">
                    {formatDate(client.updated_at)}
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
          <Button onClick={() => {
            onOpenChange(false);
            onEdit();
          }}>
            Editar Contratante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
