"use client";

import { useState, useEffect } from "react";
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
import { StatusBadge, getContractStatusVariant, getStatusLabel } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, FileText, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { ContractViewDialog } from "@/components/contracts/ContractViewDialog";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { useTenantSelector } from "@/hooks/use-tenant-selector";
import { TenantFilter } from "@/components/tenants/TenantFilter";

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
  tenant_id?: string;
  tenantName?: string;
  created_at?: string;
  updated_at?: string;
  diasRestantes: number;
}

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string | null>(null); // null = todas, string = tenant_id
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | undefined>(undefined);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Obter tenant_id do usuário autenticado e todas as empresas
  const { tenantId, isLoading: loadingTenant } = useTenant();
  const { tenants, selectedTenantId } = useTenantSelector();
  
  // Inicializar filtro com a empresa selecionada
  useEffect(() => {
    if (selectedTenantId && tenantFilter === null) {
      setTenantFilter(selectedTenantId);
    }
  }, [selectedTenantId]);

  // Buscar contratos do Supabase - de todas as empresas ou filtrado
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ["contracts", tenantFilter, statusFilter],
    queryFn: async () => {
      // Obter tenant_ids para buscar
      const tenantIds = tenantFilter 
        ? [tenantFilter] 
        : tenants.map((t) => t.id);
      
      if (tenantIds.length === 0) return [];

      let query = supabase
        .from("contracts")
        .select(`
          id,
          numero,
          objeto,
          valor_mensal,
          valor_total,
          data_inicio,
          data_fim,
          status,
          indice_reajuste,
          periodicidade_reajuste,
          responsavel_interno,
          tenant_id,
          created_at,
          updated_at,
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
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map((contract: any) => {
        const cliente = contract.clients?.nome_fantasia || contract.clients?.razao_social || "Contratante não encontrado";
        const dataFim = new Date(contract.data_fim);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const tenantName = contract.tenants?.name || "Empresa não encontrada";

        return {
          id: contract.id,
          numero: contract.numero,
          cliente,
          objeto: contract.objeto,
          valorMensal: contract.valor_mensal || contract.valor_total || 0,
          valorTotal: contract.valor_total,
          dataInicio: contract.data_inicio,
          dataFim: contract.data_fim,
          status: contract.status,
          indiceReajuste: contract.indice_reajuste,
          periodicidadeReajuste: contract.periodicidade_reajuste,
          responsavelInterno: contract.responsavel_interno,
          tenant_id: contract.tenant_id,
          tenantName,
          created_at: contract.created_at,
          updated_at: contract.updated_at,
          diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        };
      }) || [];
    },
    enabled: !loadingTenant && tenants.length > 0,
  });

  const contracts: Contract[] = contractsData || [];

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.objeto.toLowerCase().includes(searchTerm.toLowerCase());
    // Status filter já é aplicado na query do Supabase
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

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Contratos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie seus contratos, aditivos e vigências
            </p>
          </div>
          <Button 
            className="gap-2" 
            onClick={() => {
              setEditingContractId(undefined);
              setIsNewContractOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, contratante ou objeto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TenantFilter
                value={tenantFilter}
                onValueChange={setTenantFilter}
                className="w-full sm:w-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        {!isLoading && filteredContracts.length > 0 && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[640px]">
                <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Número</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead className="hidden md:table-cell">Empresa</TableHead>
                    <TableHead className="hidden lg:table-cell">Objeto</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                    <TableHead className="hidden md:table-cell">Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {contract.numero}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">{contract.cliente}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-[150px] truncate text-sm">
                        {contract.tenantName || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="max-w-[250px] truncate text-muted-foreground">
                        {contract.objeto}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(contract.valorMensal)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {formatDate(contract.dataInicio)} - {formatDate(contract.dataFim)}
                        </span>
                        {contract.status === "ativo" && contract.diasRestantes <= 30 && (
                          <Badge variant="outline" className="text-warning border-warning/20 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {contract.diasRestantes}d
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={getStatusLabel(contract.status)}
                        variant={getContractStatusVariant(contract.status)}
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
                              setViewingContract(contract);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setEditingContractId(contract.id);
                              setIsNewContractOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
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

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Carregando contratos...
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && contracts.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum contrato encontrado. Clique em "Novo Contrato" para começar.
            </CardContent>
          </Card>
        )}

        {/* View Contract Dialog */}
        <ContractViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          contract={viewingContract}
          onEdit={() => {
            if (viewingContract) {
              setEditingContractId(viewingContract.id);
              setIsNewContractOpen(true);
            }
          }}
        />

        {/* New/Edit Contract Dialog */}
        <NewContractDialog
          open={isNewContractOpen}
          onOpenChange={(open) => {
            setIsNewContractOpen(open);
            if (!open) {
              setEditingContractId(undefined);
            }
          }}
          tenantId={tenantId}
          contractId={editingContractId}
        />
      </div>
    </AppLayout>
  );
}
