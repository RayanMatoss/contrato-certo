"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, getInvoiceStatusVariant, getStatusLabel } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Send, Receipt, AlertTriangle, CheckCircle, Clock, RefreshCw, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";
import { NewInvoiceDialog } from "@/components/invoices/NewInvoiceDialog";
import { InvoiceViewDialog } from "@/components/invoices/InvoiceViewDialog";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UUID = string;

interface InvoiceRow {
  id: UUID;
  numero_nf?: string | null;
  competencia: string;
  data_vencimento: string;
  valor_bruto: number;
  valor_impostos?: number | null;
  valor_liquido: number;
  status: string;
  contract_id: string;
  client_id: string;
  tenant_id: string;
  clients?: { razao_social?: string; nome_fantasia?: string } | null;
  contracts?: { numero?: string } | null;
  tenants?: { id: UUID; name: string; slug: string } | null;
}

interface Invoice {
  id: string;
  numeroNf: string | null;
  cliente: string;
  competencia: string;
  dataVencimento: string;
  valorBruto: number;
  valorLiquido: number;
  status: string;
  tenant_id?: string;
  tenantName?: string;
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>(undefined);
  const hasInitializedFilter = useRef(false);
  
  const { tenantId, isLoading: loadingTenant } = useTenant();
  const { tenants, selectedTenantId } = useTenantSelector();
  const queryClient = useQueryClient();

  // Inicializar filtro com a empresa selecionada
  useEffect(() => {
    if (selectedTenantId && !hasInitializedFilter.current) {
      setTenantFilter(selectedTenantId);
      hasInitializedFilter.current = true;
    }
  }, [selectedTenantId]);

  // Mutation para marcar nota fiscal como paga
  const markAsPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from("invoices" as never)
        .update({ status: "paga" } as never)
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Nota fiscal marcada como paga!");
      queryClient.invalidateQueries({ queryKey: ["invoices", tenantFilter] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar como paga: ${error.message}`);
    },
  });

  // Buscar notas fiscais do Supabase - de todas as empresas ou filtrado
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", tenantFilter, statusFilter],
    queryFn: async () => {
      // Obter tenant_ids para buscar
      const tenantIds = tenantFilter 
        ? [tenantFilter] 
        : tenants.map((t) => t.id);
      
      if (tenantIds.length === 0) return [];

      let query = supabase
        .from("invoices" as never)
        .select(`
          id,
          numero_nf,
          competencia,
          data_vencimento,
          valor_bruto,
          valor_liquido,
          status,
          tenant_id,
          clients:client_id (
            id,
            razao_social,
            nome_fantasia
          ),
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .in("tenant_id", tenantIds)
        .order("data_vencimento", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as InvoiceRow[];
      return typedData.map((invoice: InvoiceRow) => {
        const cliente = invoice.clients?.nome_fantasia || invoice.clients?.razao_social || "Contratante não encontrado";
        const tenantName = invoice.tenants?.name || "Empresa não encontrada";
        return {
          id: invoice.id,
          numeroNf: invoice.numero_nf ?? null,
          cliente,
          competencia: invoice.competencia,
          dataVencimento: invoice.data_vencimento,
          valorBruto: invoice.valor_bruto,
          valorLiquido: invoice.valor_liquido,
          status: invoice.status,
          tenant_id: invoice.tenant_id,
          tenantName,
        };
      });
    },
    enabled: !loadingTenant && tenants.length > 0,
  });

  const invoices: Invoice[] = invoicesData || [];

  // Buscar dados completos da nota fiscal para visualização
  const { data: fullInvoiceData } = useQuery({
    queryKey: ["invoice-full", viewingInvoice?.id],
    queryFn: async () => {
      if (!viewingInvoice?.id) return null;
      
      const { data, error } = await supabase
        .from("invoices" as never)
        .select(`
          *,
          clients:client_id (
            id,
            razao_social,
            nome_fantasia
          ),
          contracts:contract_id (
            id,
            numero
          )
        `)
        .eq("id", viewingInvoice.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!viewingInvoice?.id && isViewDialogOpen,
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      (invoice.numeroNf?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      invoice.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tab
    if (activeTab === "pending") {
      return matchesSearch && !["paga", "cancelada"].includes(invoice.status);
    }
    if (activeTab === "paid") {
      return matchesSearch && invoice.status === "paga";
    }
    
    return matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCompetencia = (comp: string) => {
    const [year, month] = comp.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]}/${year}`;
  };

  // Summary stats
  const aEmitir = invoices.filter((i) => i.status === "a_emitir").length;
  const vencidas = invoices.filter((i) => i.status === "vencida").length;
  const totalReceber = invoices
    .filter((i) => !["paga", "cancelada"].includes(i.status))
    .reduce((sum, i) => sum + (i.valorLiquido || 0), 0);
  
  // Calcular recebido no mês atual
  const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM
  const recebidoMes = invoices
    .filter((i) => i.status === "paga" && i.competencia === mesAtual)
    .reduce((sum, i) => sum + (i.valorLiquido || 0), 0);
  const notasPagasMes = invoices.filter((i) => i.status === "paga" && i.competencia === mesAtual).length;

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Notas Fiscais</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Emissão, controle e acompanhamento de notas fiscais
            </p>
          </div>
          <Button 
            className="gap-2"
            onClick={() => setIsNewInvoiceOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Nota Fiscal
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="A Emitir"
            value={aEmitir}
            subtitle="Notas pendentes"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Vencidas"
            value={vencidas}
            subtitle="Aguardando pagamento"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Total a Receber"
            value={formatCurrency(totalReceber)}
            subtitle="Em aberto"
            icon={Receipt}
            variant="primary"
          />
          <StatCard
            title="Recebido (Mês)"
            value={formatCurrency(recebidoMes)}
            subtitle={notasPagasMes === 1 ? "1 nota paga" : `${notasPagasMes} notas pagas`}
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagas</TabsTrigger>
              </TabsList>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por NF ou contratante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="a_emitir">A Emitir</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="em_cobranca">Em Cobrança</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TenantFilter
              value={tenantFilter}
              onValueChange={setTenantFilter}
              className="w-full sm:w-auto"
            />
          </div>

          <TabsContent value="all" className="mt-0">
            {isLoading || loadingTenant ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Carregando notas fiscais...
                </CardContent>
              </Card>
            ) : filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhuma nota fiscal encontrada. Clique em &quot;Nova Nota Fiscal&quot; para começar.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">NF</TableHead>
                        <TableHead>Contratante</TableHead>
                        <TableHead className="hidden md:table-cell">Empresa</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              {invoice.numeroNf || <span className="text-muted-foreground italic">-</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">{invoice.cliente}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="max-w-[150px] truncate text-sm">
                              {invoice.tenantName || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{formatCompetencia(invoice.competencia)}</TableCell>
                          <TableCell>{formatDate(invoice.dataVencimento)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.valorBruto)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.valorLiquido)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={getStatusLabel(invoice.status)}
                              variant={getInvoiceStatusVariant(invoice.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setViewingInvoice(invoice);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setEditingInvoiceId(invoice.id);
                                    setIsNewInvoiceOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {invoice.status !== "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      if (confirm("Deseja marcar esta nota fiscal como paga?")) {
                                        markAsPaid.mutate(invoice.id);
                                      }
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setEditingInvoiceId(invoice.id);
                                      setIsNewInvoiceOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Atualizar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    toast.info("Funcionalidade de envio por e-mail em breve!");
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar por e-mail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            {isLoading || loadingTenant ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Carregando notas fiscais...
                </CardContent>
              </Card>
            ) : filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhuma nota fiscal pendente encontrada.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">NF</TableHead>
                        <TableHead>Contratante</TableHead>
                        <TableHead className="hidden md:table-cell">Empresa</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              {invoice.numeroNf || <span className="text-muted-foreground italic">-</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">{invoice.cliente}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="max-w-[150px] truncate text-sm">
                              {invoice.tenantName || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{formatCompetencia(invoice.competencia)}</TableCell>
                          <TableCell>{formatDate(invoice.dataVencimento)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.valorBruto)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.valorLiquido)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={getStatusLabel(invoice.status)}
                              variant={getInvoiceStatusVariant(invoice.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setViewingInvoice(invoice);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setEditingInvoiceId(invoice.id);
                                    setIsNewInvoiceOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {invoice.status !== "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      if (confirm("Deseja marcar esta nota fiscal como paga?")) {
                                        markAsPaid.mutate(invoice.id);
                                      }
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setEditingInvoiceId(invoice.id);
                                      setIsNewInvoiceOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Atualizar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    toast.info("Funcionalidade de envio por e-mail em breve!");
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar por e-mail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-0">
            {isLoading || loadingTenant ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Carregando notas fiscais...
                </CardContent>
              </Card>
            ) : filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhuma nota fiscal paga encontrada.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">NF</TableHead>
                        <TableHead>Contratante</TableHead>
                        <TableHead className="hidden md:table-cell">Empresa</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              {invoice.numeroNf || <span className="text-muted-foreground italic">-</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">{invoice.cliente}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="max-w-[150px] truncate text-sm">
                              {invoice.tenantName || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>{formatCompetencia(invoice.competencia)}</TableCell>
                          <TableCell>{formatDate(invoice.dataVencimento)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.valorBruto)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.valorLiquido)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={getStatusLabel(invoice.status)}
                              variant={getInvoiceStatusVariant(invoice.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setViewingInvoice(invoice);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setEditingInvoiceId(invoice.id);
                                    setIsNewInvoiceOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {invoice.status !== "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      if (confirm("Deseja marcar esta nota fiscal como paga?")) {
                                        markAsPaid.mutate(invoice.id);
                                      }
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                {invoice.status === "paga" && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setEditingInvoiceId(invoice.id);
                                      setIsNewInvoiceOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Atualizar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    toast.info("Funcionalidade de envio por e-mail em breve!");
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar por e-mail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* View Invoice Dialog */}
        <InvoiceViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          invoice={fullInvoiceData || undefined}
          onEdit={() => {
            if (viewingInvoice) {
              setEditingInvoiceId(viewingInvoice.id);
              setIsViewDialogOpen(false);
              setIsNewInvoiceOpen(true);
            }
          }}
          onMarkAsPaid={() => {
            if (viewingInvoice) {
              markAsPaid.mutate(viewingInvoice.id);
              setIsViewDialogOpen(false);
            }
          }}
        />

        {/* New/Edit Invoice Dialog */}
        <NewInvoiceDialog
          open={isNewInvoiceOpen}
          onOpenChange={(open) => {
            setIsNewInvoiceOpen(open);
            if (!open) {
              setEditingInvoiceId(undefined);
            }
          }}
          tenantId={tenantId}
          invoiceId={editingInvoiceId}
        />
      </div>
    </AppLayout>
  );
}
