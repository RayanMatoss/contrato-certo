"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Calendar, MapPin, FileText, DollarSign, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import type { TenderWithRelations } from "@/modules/tenders/domain/types";

async function getTenderById(id: string) {
  const res = await fetch(`/api/tenders/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Licitação não encontrada");
    throw new Error("Erro ao carregar licitação");
  }
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

function formatDateTime(date?: string): string {
  if (!date) return "Não informado";
  return new Date(date).toLocaleString("pt-BR");
}

export default function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: tender, isLoading, error } = useQuery<TenderWithRelations>({
    queryKey: ["tender", id],
    queryFn: () => getTenderById(id),
  });

  if (isLoading) {
    return (
      <AuthGuard>
        <AppLayout>
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Carregando detalhes da licitação...
        </div>
      </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (error || !tender) {
    return (
      <AuthGuard>
        <AppLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : "Erro ao carregar licitação"}
            </p>
            <Link href="/tenders">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para busca
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tenders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{tender.objeto}</h1>
          <p className="text-muted-foreground mt-1">
            Detalhes da licitação
          </p>
        </div>
        {tender.status && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {tender.status}
          </Badge>
        )}
      </div>

      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tender.orgao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Órgão</label>
                <p className="text-base">{tender.orgao}</p>
                {tender.unidade && (
                  <p className="text-sm text-muted-foreground">{tender.unidade}</p>
                )}
              </div>
            )}

            {(tender.municipio || tender.uf) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Localização</label>
                <p className="text-base flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tender.municipio}
                  {tender.uf && `, ${tender.uf}`}
                </p>
              </div>
            )}

            {tender.modalidade && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Modalidade</label>
                <p className="text-base">{tender.modalidade}</p>
              </div>
            )}

            {(tender.numero || tender.ano) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número/Ano</label>
                <p className="text-base">
                  {tender.numero && `Nº ${tender.numero}`}
                  {tender.numero && tender.ano && " / "}
                  {tender.ano}
                </p>
              </div>
            )}

            {tender.dataPublicacao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Publicação</label>
                <p className="text-base flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(tender.dataPublicacao)}
                </p>
              </div>
            )}

            {tender.dataAbertura && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Abertura</label>
                <p className="text-base flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(tender.dataAbertura)}
                </p>
              </div>
            )}

            {tender.valorEstimado && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Estimado</label>
                <p className="text-base flex items-center gap-1 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(tender.valorEstimado)}
                </p>
              </div>
            )}

            {tender.source && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fonte</label>
                <p className="text-base uppercase">{tender.source}</p>
              </div>
            )}
          </div>

          {tender.sourceUrl && (
            <div className="pt-4 border-t">
              <a
                href={tender.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Ver no portal original
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens da Licitação */}
      {tender.items && tender.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Itens da Licitação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-32">Unidade</TableHead>
                    <TableHead className="w-32 text-right">Quantidade</TableHead>
                    <TableHead className="w-40 text-right">Valor Unitário</TableHead>
                    <TableHead className="w-40 text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tender.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.itemNum ?? index + 1}
                      </TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>{item.unidade || "-"}</TableCell>
                      <TableCell className="text-right">
                        {item.quantidade
                          ? new Intl.NumberFormat("pt-BR", {
                              maximumFractionDigits: 3,
                            }).format(item.quantidade)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.valorUnitario ? formatCurrency(item.valorUnitario) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.valorTotal ? formatCurrency(item.valorTotal) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos */}
      {tender.docs && tender.docs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tender.docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.title || "Documento sem título"}</p>
                      {doc.docType && (
                        <p className="text-sm text-muted-foreground">{doc.docType}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atualizações */}
      {tender.updates && tender.updates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tender.updates.map((update) => (
                <div key={update.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{update.eventType}</p>
                      {update.eventDate && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(update.eventDate)}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{update.eventType}</Badge>
                  </div>
                  {update.payload && Object.keys(update.payload).length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded">
                        {JSON.stringify(update.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voltar */}
      <div className="flex justify-center">
        <Link href="/tenders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para busca
          </Button>
        </Link>
      </div>
    </div>
      </AppLayout>
    </AuthGuard>
  );
}
