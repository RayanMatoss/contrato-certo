"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, MapPin, FileText, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Tender, TenderSearchParams } from "@/modules/tenders/domain/types";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const MODALIDADE_OPTIONS = [
  "Pregão Eletrônico",
  "Pregão Presencial",
  "Concorrência",
  "Tomada de Preços",
  "Dispensa",
  "Inexigibilidade",
  "Chamada Pública",
  "Concurso",
  "Leilão",
];

const STATUS_OPTIONS = [
  "Aberta",
  "Encerrada",
  "Cancelada",
  "Homologada",
  "Adjudicada",
  "Anulada",
];

// Valor especial para "todos/todas" - Radix Select não aceita value=""
const ALL_VALUE = "__all__";

const toFilterValue = (v: string | undefined) => (v === ALL_VALUE || !v ? undefined : v);

async function searchTenders(params: TenderSearchParams) {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.uf) searchParams.set("uf", params.uf);
  if (params.municipio) searchParams.set("municipio", params.municipio);
  if (params.modalidade) searchParams.set("modalidade", params.modalidade);
  if (params.status) searchParams.set("status", params.status);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.minVal !== undefined) searchParams.set("minVal", params.minVal.toString());
  if (params.maxVal !== undefined) searchParams.set("maxVal", params.maxVal.toString());
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());

  const res = await fetch(`/api/tenders/search?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to search tenders");
  return res.json();
}

function formatCurrency(value?: number): string {
  if (!value) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date?: string): string {
  if (!date) return "Não informado";
  return new Date(date).toLocaleDateString("pt-BR");
}

export default function TendersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<TenderSearchParams>>({
    uf: undefined,
    municipio: undefined,
    modalidade: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    minVal: undefined,
    maxVal: undefined,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenders-search", searchQuery, filters, page],
    queryFn: () => searchTenders({ q: searchQuery, ...filters, page, pageSize }),
    enabled: true, // Sempre busca ao montar (pode mostrar últimos resultados)
  });

  const handleSearch = () => {
    setPage(1);
    // A query será refeita automaticamente pelo useQuery
  };

  const handleFilterChange = (key: keyof TenderSearchParams, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value === "" ? undefined : value }));
    setPage(1);
  };

  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;

  return (
    <AuthGuard>
      <AppLayout>
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buscador de Licitações</h1>
          <p className="text-muted-foreground mt-1">
            Busque licitações por palavra-chave, localização, modalidade e mais
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por objeto, órgão, município..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">UF</label>
              <Select
                value={filters.uf || ALL_VALUE}
                onValueChange={(value) => handleFilterChange("uf", toFilterValue(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Município</label>
              <Input
                placeholder="Ex: São Paulo"
                value={filters.municipio || ""}
                onChange={(e) => handleFilterChange("municipio", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Modalidade</label>
              <Select
                value={filters.modalidade || ALL_VALUE}
                onValueChange={(value) => handleFilterChange("modalidade", toFilterValue(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                  {MODALIDADE_OPTIONS.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || ALL_VALUE}
                onValueChange={(value) => handleFilterChange("status", toFilterValue(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Publicação (De)</label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Publicação (Até)</label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Mínimo (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minVal || ""}
                onChange={(e) =>
                  handleFilterChange("minVal", e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Valor Máximo (R$)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.maxVal || ""}
                onChange={(e) =>
                  handleFilterChange("maxVal", e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Carregando resultados...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            Erro ao buscar licitações. Tente novamente.
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total !== undefined
                  ? `Encontradas ${data.total} licitação(ões)`
                  : `${data.data.length} resultado(s)`}
              </p>
            </div>

            {data.data.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma licitação encontrada com os filtros selecionados.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data.data.map((tender: Tender) => (
                  <Card key={tender.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Link
                              href={`/tenders/${tender.id}`}
                              className="text-lg font-semibold hover:text-primary transition-colors"
                            >
                              {tender.objeto}
                            </Link>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {tender.orgao && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{tender.orgao}</span>
                                {tender.unidade && <span> - {tender.unidade}</span>}
                              </div>
                            )}
                            {(tender.municipio || tender.uf) && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {tender.municipio}
                                  {tender.uf && `, ${tender.uf}`}
                                </span>
                              </div>
                            )}
                            {tender.modalidade && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{tender.modalidade}</span>
                              </div>
                            )}
                            {tender.numero && tender.ano && (
                              <div className="flex items-center gap-1">
                                <span>
                                  Nº {tender.numero}/{tender.ano}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            {tender.dataPublicacao && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Publicação: {formatDate(tender.dataPublicacao)}</span>
                              </div>
                            )}
                            {tender.dataAbertura && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Abertura: {formatDate(tender.dataAbertura)}</span>
                              </div>
                            )}
                            {tender.valorEstimado && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">
                                  {formatCurrency(tender.valorEstimado)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          {tender.status && (
                            <Badge variant="outline">{tender.status}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
      </AppLayout>
    </AuthGuard>
  );
}
