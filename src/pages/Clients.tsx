"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Search, Mail, Phone, MapPin, MoreHorizontal, Eye, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";
// Dynamic imports para reduzir bundle inicial - dialogs só carregam quando necessários
import dynamic from "next/dynamic";
const NewClientDialog = dynamic(() => import("@/components/clients/NewClientDialog").then(mod => ({ default: mod.NewClientDialog })), { ssr: false });
const ClientViewDialog = dynamic(() => import("@/components/clients/ClientViewDialog").then(mod => ({ default: mod.ClientViewDialog })), { ssr: false });

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
  tenant_id?: string;
  tenantName?: string;
  created_at?: string;
  updated_at?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | undefined>(undefined);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { tenants, isLoading: loadingTenant } = useTenantSelector();
  const tenantIds = tenantFilter ? [tenantFilter] : tenants.map((t) => t.id);
  const tenantIdForDialog = tenantFilter || tenants[0]?.id;

  // Buscar contratantes de todas as empresas (ou filtrado)
  const { data: clientsRaw = [], isLoading } = useQuery({
    queryKey: ["clients", tenantFilter, tenantIds.join(",")],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("clients" as never)
        .select(`
          *,
          tenants:tenant_id ( id, name )
        `)
        .in("tenant_id", tenantIds)
        .order("razao_social");
      if (error) throw error;
      return (data || []) as Array<Client & { tenants?: { id: string; name: string } | null }>;
    },
    enabled: !loadingTenant && tenantIds.length > 0,
  });

  const clients: Client[] = clientsRaw.map((c: Client & { tenants?: { name: string } | null }) => ({
    ...c,
    tenant_id: c.tenant_id,
    tenantName: c.tenants?.name ?? undefined,
  }));

  const filteredClients = clients.filter(
    (client) =>
      client.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      client.cnpj.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Contratantes</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro de contratantes, órgãos e tomadores de serviço
            </p>
          </div>
          <Button className="gap-2" onClick={() => {
            setEditingClientId(undefined);
            setIsNewClientOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Novo Contratante
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <TenantFilter value={tenantFilter} onValueChange={setTenantFilter} />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {(isLoading || loadingTenant) && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Carregando contratantes...
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !loadingTenant && filteredClients.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm
                ? "Nenhum contratante encontrado com os filtros aplicados."
                : "Nenhum contratante cadastrado. Clique em 'Novo Contratante' para começar."}
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        {!isLoading && !loadingTenant && filteredClients.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
            <Card key={client.id} className="card-interactive">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(client.nome_fantasia || client.razao_social)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">
                        {client.nome_fantasia || client.razao_social}
                      </p>
                      <p className="text-xs text-muted-foreground">{client.cnpj}</p>
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
                          setViewingClient(client);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => {
                          setEditingClientId(client.id);
                          setIsNewClientOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {client.tenantName && (
                  <p className="text-xs text-muted-foreground mb-2 truncate" title={client.tenantName}>
                    {client.tenantName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {client.razao_social}
                </p>

                <div className="space-y-2 text-sm">
                  {client.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{client.telefone}</span>
                    </div>
                  )}
                  {(client.cidade || client.uf) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {client.cidade && client.uf
                          ? `${client.cidade}/${client.uf}`
                          : client.cidade || client.uf || ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <StatusBadge
                    label={client.status === "ativo" ? "Ativo" : "Inativo"}
                    variant={client.status === "ativo" ? "success" : "muted"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* View Client Dialog - Defer: só renderiza quando aberto */}
        {isViewDialogOpen && (
          <ClientViewDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            client={viewingClient}
            onEdit={() => {
              if (viewingClient) {
                setEditingClientId(viewingClient.id);
                setIsNewClientOpen(true);
              }
            }}
          />
        )}

        {/* New/Edit Client Dialog - Defer: só renderiza quando aberto */}
        {tenantIdForDialog && isNewClientOpen && (
          <NewClientDialog
            open={isNewClientOpen}
            onOpenChange={(open) => {
              setIsNewClientOpen(open);
              if (!open) {
                setEditingClientId(undefined);
              }
            }}
            tenantId={tenantIdForDialog}
            clientId={editingClientId}
          />
        )}
      </div>
    </AppLayout>
  );
}
